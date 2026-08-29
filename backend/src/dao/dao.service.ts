import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { KnowledgeRetriever, RetrievedChapter } from '../chat/knowledge-retriever.service';
import { DatabaseService } from '../database/database.service';
import { PointsService } from '../points/points.service';
import { LLMService } from '../llm/llm.service';
import { IS_DEMO } from '../common';

export interface DaoAnswer {
  id: string;
  inquiryId: string;
  answererUserId: string;
  answererName: string;
  answererType: 'digital_human' | 'user';
  digitalHumanId: string | null;
  content: string;
  accepted: boolean;
  reward: number;
  createdAt: string;
}

export interface DaoInquiry {
  id: string;
  askerUserId: string;
  askerName: string;
  askerType: 'digital_human' | 'user';
  digitalHumanId: string | null;
  content: string;
  isPaid: boolean;
  bounty: number;
  status: 'open' | 'resolved';
  acceptedAnswerId: string | null;
  answerCount: number;
  createdAt: string;
}

export interface DaoInquiryDetail extends DaoInquiry {
  answers: DaoAnswer[];
}

export interface PublishInquiryDto {
  content: string;
  isPaid?: boolean;
  bounty?: number;
  digitalHumanId?: string;
  digitalHumanName?: string; // 以数字人名义发布时的显示名（演示模式由前端传入）
}

export interface AnswerDto {
  content?: string; // 人工回答；为空且提供 digitalHumanId 时由数字人自动作答
  digitalHumanId?: string;
  digitalHumanName?: string;
}

const MAX_BOUNTY = 500;
const MIN_BOUNTY = 10;

/** 合法 UUID 才可写入 uuid 外键列（演示 ID/空值置 null） */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function toUuidOrNull(v?: string): string | null {
  return v && UUID_RE.test(v) ? v : null;
}

@Injectable()
export class DaoService {
  private readonly logger = new Logger(DaoService.name);
  private readonly demoInquiries = new Map<string, DaoInquiryDetail>();
  private seq = 0;

  constructor(
    private readonly retriever: KnowledgeRetriever,
    private readonly db: DatabaseService,
    private readonly points: PointsService,
    private readonly llm: LLMService,
  ) {}

  /** 发布求道帖：免费，或有偿（悬赏积分冻结） */
  async publish(userId: string, askerName: string, dto: PublishInquiryDto): Promise<DaoInquiry> {
    const content = dto.content?.trim();
    if (!content) throw new BadRequestException('求道内容不能为空');
    if (content.length > 500) throw new BadRequestException('求道内容请控制在 500 字以内');

    const isPaid = !!dto.isPaid;
    const bounty = isPaid ? Math.min(Math.max(dto.bounty ?? MIN_BOUNTY, MIN_BOUNTY), MAX_BOUNTY) : 0;
    const digitalHumanId = toUuidOrNull(dto.digitalHumanId);
    const askerType: 'digital_human' | 'user' = digitalHumanId ? 'digital_human' : 'user';
    // 以数字人名义发布：显示名取数字人名（前端传入；真实模式亦可查库为准）
    if (askerType === 'digital_human' && dto.digitalHumanName?.trim()) {
      askerName = dto.digitalHumanName.trim();
    }
    const inquiryId = IS_DEMO() ? `dao-q-${++this.seq}` : crypto.randomUUID();
    if (isPaid) {
      const account = await this.points.getAccount(userId);
      if (account.balance < bounty) {
        throw new BadRequestException(`积分不足：当前余额 ${account.balance}，悬赏需 ${bounty}`);
      }
      await this.points.freeze(userId, bounty, 'dao_bounty', inquiryId);
    }

    const inquiry: DaoInquiry = {
      id: inquiryId,
      askerUserId: userId,
      askerName,
      askerType,
      digitalHumanId,
      content,
      isPaid,
      bounty,
      status: 'open',
      acceptedAnswerId: null,
      answerCount: 0,
      createdAt: new Date().toISOString(),
    };

    if (IS_DEMO() || !this.db.isAvailable) {
      this.demoInquiries.set(inquiry.id, { ...inquiry, answers: [] });
    } else {
      await this.db.query(
        `INSERT INTO dao_inquiries (id, asker_user_id, asker_name, asker_type, digital_human_id, content, is_paid, bounty)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [inquiry.id, userId, askerName, askerType, inquiry.digitalHumanId, content, isPaid, bounty],
      );
    }
    return inquiry;
  }

  /** 帖子列表（公开可读）：all / bounty / open / mine */
  async list(userId: string | null, filter = 'all'): Promise<DaoInquiry[]> {
    if (IS_DEMO() || !this.db.isAvailable) {
      let items = [...this.demoInquiries.values()];
      if (filter === 'bounty') items = items.filter((i) => i.isPaid);
      if (filter === 'open') items = items.filter((i) => i.status === 'open');
      if (filter === 'mine' && userId) items = items.filter((i) => i.askerUserId === userId);
      return items
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(({ answers, ...rest }) => rest);
    }
    const params: unknown[] = [];
    let where = '';
    if (filter === 'bounty') where = 'AND is_paid = true';
    if (filter === 'open') where = "AND status = 'open'";
    if (filter === 'mine' && userId) {
      params.push(userId);
      where = `AND asker_user_id = $${params.length}`;
    }
    return this.db.query<Record<string, unknown>>(
      `SELECT id, asker_user_id AS "askerUserId", asker_name AS "askerName", asker_type AS "askerType",
              digital_human_id AS "digitalHumanId", content, is_paid AS "isPaid", bounty, status,
              accepted_answer_id AS "acceptedAnswerId", created_at AS "createdAt",
              (SELECT count(*) FROM dao_answers a WHERE a.inquiry_id = dao_inquiries.id) AS "answerCount"
       FROM dao_inquiries WHERE 1=1 ${where}
       ORDER BY created_at DESC LIMIT 100`,
      params,
    ) as unknown as DaoInquiry[];
  }

  /** 帖子详情（含回答） */
  async detail(id: string): Promise<DaoInquiryDetail> {
    if (IS_DEMO() || !this.db.isAvailable) {
      const item = this.demoInquiries.get(id);
      if (!item) throw new NotFoundException('求道帖不存在');
      return item;
    }
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT id, asker_user_id AS "askerUserId", asker_name AS "askerName", asker_type AS "askerType",
              digital_human_id AS "digitalHumanId", content, is_paid AS "isPaid", bounty, status,
              accepted_answer_id AS "acceptedAnswerId", created_at AS "createdAt"
       FROM dao_inquiries WHERE id = $1`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException('求道帖不存在');
    const answers = await this.db.query<Record<string, unknown>>(
      `SELECT id, inquiry_id AS "inquiryId", answerer_user_id AS "answererUserId", answerer_name AS "answererName",
              answerer_type AS "answererType", digital_human_id AS "digitalHumanId", content,
              is_accepted AS "accepted", reward, created_at AS "createdAt"
       FROM dao_answers WHERE inquiry_id = $1 ORDER BY created_at`,
      [id],
    );
    const q = rows[0];
    return {
      ...(q as unknown as DaoInquiry),
      answerCount: answers.length,
      answers: answers as unknown as DaoAnswer[],
    };
  }

  /** 回答：人工（本人或以其数字人名义），或由数字人自动作答 */
  async answer(
    inquiryId: string,
    userId: string,
    answererName: string,
    dto: AnswerDto,
  ): Promise<DaoAnswer> {
    const inquiry = await this.detail(inquiryId);
    // 演示模式为单用户，放开自答限制便于完整体验链路
    if (!IS_DEMO() && inquiry.askerUserId === userId) {
      throw new BadRequestException('不能回答自己的求道帖');
    }
    let content = dto.content?.trim() ?? '';
    const digitalHumanId = toUuidOrNull(dto.digitalHumanId);
    const answererType: 'digital_human' | 'user' = digitalHumanId ? 'digital_human' : 'user';
    // 以数字人名义作答：显示名取数字人名
    if (answererType === 'digital_human' && dto.digitalHumanName?.trim()) {
      answererName = dto.digitalHumanName.trim();
    }

    // 未提供内容且指定数字人 → 数字人依据知识库自动作答
    if (!content && digitalHumanId) {
      content = await this.composeDHAnswer(inquiry, answererName);
    }
    if (!content) throw new BadRequestException('回答内容不能为空');

    const ans: DaoAnswer = {
      id: IS_DEMO() ? `dao-a-${++this.seq}` : crypto.randomUUID(),
      inquiryId,
      answererUserId: userId,
      answererName,
      answererType,
      digitalHumanId,
      content,
      accepted: false,
      reward: 0,
      createdAt: new Date().toISOString(),
    };
    if (IS_DEMO() || !this.db.isAvailable) {
      this.demoInquiries.get(inquiryId)?.answers.push(ans);
      if (this.demoInquiries.has(inquiryId)) {
        this.demoInquiries.get(inquiryId)!.answerCount++;
      }
    } else {
      await this.db.query(
        `INSERT INTO dao_answers (id, inquiry_id, answerer_user_id, answerer_name, answerer_type, digital_human_id, content)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [ans.id, inquiryId, userId, answererName, answererType, ans.digitalHumanId, content],
      );
    }
    return ans;
  }

  /** 楼主采纳回答：有悬赏则积分从冻结划给回答者 */
  async accept(inquiryId: string, userId: string, answerId: string) {
    const inquiry = await this.detail(inquiryId);
    if (inquiry.askerUserId !== userId) throw new BadRequestException('只有发布者可采纳回答');
    if (inquiry.status === 'resolved') throw new BadRequestException('该帖已采纳过回答');
    const ans = inquiry.answers.find((a) => a.id === answerId);
    if (!ans) throw new NotFoundException('回答不存在');

    const reward = inquiry.isPaid ? inquiry.bounty : 0;
    if (reward > 0) {
      await this.points.settleBounty(inquiry.askerUserId, ans.answererUserId, reward, inquiry.id);
    }

    if (IS_DEMO() || !this.db.isAvailable) {
      const item = this.demoInquiries.get(inquiryId)!;
      item.status = 'resolved';
      item.acceptedAnswerId = answerId;
      const target = item.answers.find((a) => a.id === answerId);
      if (target) {
        target.accepted = true;
        target.reward = reward;
      }
    } else {
      await this.db.query(
        `UPDATE dao_inquiries SET status = 'resolved', accepted_answer_id = $2 WHERE id = $1`,
        [inquiryId, answerId],
      );
      await this.db.query(
        `UPDATE dao_answers SET is_accepted = true, reward = $2 WHERE id = $1`,
        [answerId, reward],
      );
    }
    return { ok: true, reward, answererName: ans.answererName };
  }

  // ---------- 数字人自动作答（知识检索 + LLM/本地） ----------

  private async composeDHAnswer(
    inquiry: DaoInquiryDetail,
    dhName: string,
    userId?: string,
  ): Promise<string> {
    const retrieved: RetrievedChapter[] = this.retriever.search(inquiry.content, 3);
    if (retrieved.length === 0) {
      throw new NotFoundException('未在道德经知识库中检索到相关内容，请换一种问法');
    }
    if (this.llm.enabled) {
      try {
        const context = retrieved
          .map(
            (r) =>
              `第${r.chapter.no}章《${r.chapter.title}》：${r.chapter.simplified ?? r.chapter.original}\n小结：${r.chapter.summary ?? ''}`,
          )
          .join('\n');
        const res = await this.llm.chat(
          [
            {
              role: 'system',
              content: `你是数字人「${dhName}」，以《道德经》为思想根基的智慧导师。回答以原文为据、标注章节号、贴合提问者处境，120-200字。`,
            },
            {
              role: 'user',
              content: `【知识库依据】\n${context}\n\n有人在求道板块提问：${inquiry.content}\n请给出你的回答。`,
            },
          ],
          { model: 'light', temperature: 0.7, userId },
        );
        return res.content;
      } catch (e) {
        this.logger.warn(`LLM 作答失败，降级本地检索：${(e as Error).message}`);
      }
    }
    const lines: string[] = [`（${dhName} 依经作答）`];
    for (const r of retrieved.slice(0, 2)) {
      lines.push(`《道德经》第${r.chapter.no}章《${r.chapter.title}》：${r.chapter.simplified ?? r.chapter.original}`);
      if (r.chapter.summary) lines.push(`章旨：${r.chapter.summary}`);
      const anno = r.matchedAnnotations[0]?.items[0]?.text;
      if (anno) lines.push(`注解：${anno.slice(0, 100)}`);
      lines.push('');
    }
    lines.push(`以此观之：${inquiry.content.slice(0, 20)}……之问，枢要在「守柔处下、顺势而为」。先辨此事中"可控与不可控"，尽人事于可控，处静守于不可控，事缓则圆。`);
    return lines.join('\n');
  }
}
