import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { IS_DEMO } from '../common';
import { KnowledgeRetriever } from '../chat/knowledge-retriever.service';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface RecommendDto {
  content: string;
  source: string; // 出处（必填）
  chapterNo?: number;
  tags?: string[];
  reason?: string;
}

@Injectable()
export class KnowledgeService {
  /** 演示模式：内存中的待审队列与总库 */
  private readonly demoPending: Record<string, unknown>[] = [];

  constructor(
    private readonly db: DatabaseService,
    private readonly retriever: KnowledgeRetriever,
  ) {}

  /** 成员推荐知识（进入候选池，待管理员审核） */
  async recommend(userId: string, dto: RecommendDto) {
    if (!dto.content?.trim()) throw new BadRequestException('内容不能为空');
    if (!dto.source?.trim()) throw new BadRequestException('出处必填（无出处不采纳）');
    const tags = dto.tags ?? [];
    if (IS_DEMO()) {
      const item = {
        id: `demo-rec-${this.demoPending.length + 1}`,
        status: 'pending',
        sourceType: 'member_recommend',
        chapterNo: dto.chapterNo ?? null,
        content: dto.content,
        source: dto.source,
        tags,
        reason: dto.reason ?? '',
        submitterId: userId,
        createdAt: new Date().toISOString(),
      };
      this.demoPending.push(item);
      return { item, tip: '演示模式：已入候选池，等待管理员审核' };
    }
    const rows = await this.db.query<Record<string, unknown>>(
      `INSERT INTO knowledge_items (status, source_type, chapter_no, title, content, source, tags, submitter_id)
       VALUES ('pending', 'member_recommend', $1, $2, $3, $4, $5, $6)
       RETURNING id, status`,
      [dto.chapterNo ?? null, dto.content.slice(0, 40), dto.content, dto.source, JSON.stringify(tags), userId],
    );
    return { item: rows[0] };
  }

  /** 检索总库（演示模式直接检索 JSON 知识库） */
  async search(chapterNo?: number, keyword?: string) {
    if (IS_DEMO() || !this.db.isAvailable) {
      if (keyword?.trim()) {
        const hits = this.retriever.search(keyword, 5).map((r) => ({
          chapterNo: r.chapter.no,
          title: `${r.chapter.title}`,
          simplified: r.chapter.simplified,
          summary: r.chapter.summary,
        }));
        return hits;
      }
      if (chapterNo) {
        const ch = this.retriever.getChapter(chapterNo);
        return ch ? [{ chapterNo: ch.no, title: ch.title, simplified: ch.simplified, summary: ch.summary }] : [];
      }
      return { tip: '请传入 keyword 或 chapterNo' };
    }
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT chapter_no AS "chapterNo", title, content, source, tags
       FROM knowledge_items
       WHERE status = 'approved'
         AND ($1::smallint IS NULL OR chapter_no = $1)
         AND ($2::text IS NULL OR content ILIKE '%' || $2 || '%')
       ORDER BY chapter_no LIMIT 50`,
      [chapterNo ?? null, keyword ?? null],
    );
    return rows;
  }

  /** 研讨纪要写入知识库（数字人研讨产出，进入知识治理流程：pending → 审核入总库） */
  async submitSymposiumMinutes(input: {
    topic: string;
    chapterNo: number | null;
    hostName: string;
    speeches: unknown[];
    summary: unknown;
    submitterId: string;
  }): Promise<{ id: string; status: string }> {
    const content = JSON.stringify({
      type: 'symposium_minutes',
      topic: input.topic,
      chapterNo: input.chapterNo,
      host: input.hostName,
      speeches: input.speeches,
      summary: input.summary,
    });
    const source = `道枢·${input.hostName}主持研讨纪要`;
    const tags = ['symposium', '会议纪要', `第${input.chapterNo ?? '?'}章`];
    if (IS_DEMO()) {
      const item = {
        id: `demo-sym-kb-${this.demoPending.length + 1}`,
        status: 'pending',
        sourceType: 'symposium',
        chapterNo: input.chapterNo,
        title: `论道纪要·${input.topic.slice(0, 30)}`,
        content,
        source,
        tags,
        reason: `数字人「${input.hostName}」研讨产出`,
        submitterId: input.submitterId,
        createdAt: new Date().toISOString(),
      };
      this.demoPending.push(item);
      return { id: item.id, status: item.status };
    }
    const rows = await this.db.query<{ id: string; status: string }>(
      `INSERT INTO knowledge_items (status, source_type, chapter_no, title, content, source, tags, submitter_id)
       VALUES ('pending', 'symposium', $1, $2, $3, $4, $5, $6)
       RETURNING id, status`,
      [input.chapterNo, `论道纪要·${input.topic.slice(0, 40)}`, content, source, JSON.stringify(tags), input.submitterId],
    );
    return rows[0];
  }

  /** 管理员：查看待审队列 */
  async reviewQueue() {
    if (IS_DEMO()) return this.demoPending;
    return this.db.query<Record<string, unknown>>(
      `SELECT id, chapter_no AS "chapterNo", title, source, tags, submitter_id AS "submitterId", created_at AS "createdAt"
       FROM knowledge_items WHERE status = 'pending' ORDER BY created_at DESC`,
    );
  }

  /** 管理员：审核（approve / reject / needs_revision） */
  async review(itemId: string, action: 'approve' | 'reject' | 'needs_revision', note?: string, operatorId?: string) {
    const statusMap = { approve: 'approved', reject: 'rejected', needs_revision: 'needs_revision' } as const;
    const status = statusMap[action];
    if (!status) throw new BadRequestException('非法审核动作');
    if (IS_DEMO()) {
      const item = this.demoPending.find((i) => i.id === itemId);
      if (!item) throw new BadRequestException('条目不存在');
      item.status = status;
      item.reviewNote = note ?? '';
      return { id: itemId, status, reviewNote: item.reviewNote };
    }
    await this.db.query(
      `UPDATE knowledge_items
       SET status = $2, reviewer_id = $3, review_note = $4, reviewed_at = now(), updated_at = now()
       WHERE id = $1`,
      [itemId, status, operatorId ?? null, note ?? null],
    );
    return { id: itemId, status };
  }

  /** 管理员：从知识库 JSON 批量导入（管理员导入，直接 approved） */
  async adminImport(): Promise<{ imported: number; tip?: string }> {
    const path = resolve(process.env.KB_PATH ?? '../knowledge-base/taoteching-wsy-2026.json');
    const kb = JSON.parse(readFileSync(path, 'utf8')) as { chapters: { no: number; rawNo: string; title: string; source: string }[] };
    if (IS_DEMO()) {
      return { imported: kb.chapters.length, tip: '演示模式：知识库已由 KnowledgeRetriever 加载，无需导入' };
    }
    let imported = 0;
    for (const ch of kb.chapters) {
      const rows = await this.db.query<{ id: string }>(
        `INSERT INTO knowledge_items (status, source_type, chapter_no, title, content, source, tags, version)
         VALUES ('approved', 'admin_import', $1, $2, $3, $4, $5, 1)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [ch.no, `道德经·第${ch.rawNo}章·${ch.title}`, JSON.stringify(ch), '汪胜岩《道德经》注解（2026整理本）', '[]'],
      );
      if (rows.length) imported++;
    }
    return { imported };
  }
}
