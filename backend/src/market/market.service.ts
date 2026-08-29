import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { IS_DEMO } from '../common';
import { createHash } from 'node:crypto';

export interface PublishDto {
  content: string;      // 脱敏后的公开内容（强制脱敏由前端确认）
  sceneTags?: string[];
  digitalHumanId?: string; // 产出数字人
}

@Injectable()
export class MarketService {
  /** 演示模式内存知识池 */
  private readonly demoPool: Record<string, unknown>[] = [];

  constructor(private readonly db: DatabaseService) {}

  /** 公开知识（默认私有 → 显式公开；内容指纹防重复） */
  async publish(userId: string, dto: PublishDto) {
    if (!dto.content?.trim()) throw new BadRequestException('内容不能为空');
    const hash = createHash('sha256').update(dto.content).digest('hex');
    if (IS_DEMO()) {
      if (this.demoPool.some((i) => i.contentHash === hash)) {
        throw new BadRequestException('内容重复，已存在同指纹公开条目');
      }
      const item = {
        id: `demo-pk-${this.demoPool.length + 1}`,
        contentHash: hash,
        deidentifiedContent: dto.content,
        sceneTags: dto.sceneTags ?? [],
        ownerUserId: userId,
        digitalHumanId: dto.digitalHumanId ?? null,
        publishedAt: new Date().toISOString(),
      };
      this.demoPool.push(item);
      return { item, tip: '演示模式：已公开并进入知识池（可被引用）' };
    }
    const rows = await this.db.query<{ id: string }>(
      `INSERT INTO public_knowledge (knowledge_item_id, digital_human_id, content_hash, deidentified_content, scene_tags)
       VALUES (NULL, $1, $2, $3, $4)
       ON CONFLICT (content_hash) DO NOTHING
       RETURNING id`,
      [dto.digitalHumanId ?? null, hash, dto.content, JSON.stringify(dto.sceneTags ?? [])],
    );
    if (!rows.length) throw new BadRequestException('内容重复，已存在同指纹公开条目');
    return { id: rows[0].id };
  }

  /** 知识池列表 */
  async list() {
    if (IS_DEMO()) return this.demoPool;
    return this.db.query<Record<string, unknown>>(
      `SELECT id, digital_human_id AS "digitalHumanId", deidentified_content AS content, scene_tags AS "sceneTags", published_at AS "publishedAt"
       FROM public_knowledge WHERE status = 'active' ORDER BY published_at DESC LIMIT 100`,
    );
  }

  /** 条目被引用情况 */
  async citations(publicKnowledgeId: string) {
    if (IS_DEMO()) return { publicKnowledgeId, count: 0, tip: '演示模式：引用计数需接入对话链路后生效' };
    const rows = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM citations WHERE public_knowledge_id = $1`,
      [publicKnowledgeId],
    );
    return { publicKnowledgeId, count: Number(rows[0]?.count ?? 0) };
  }
}
