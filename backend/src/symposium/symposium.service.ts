import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { KnowledgeRetriever, RetrievedChapter } from '../chat/knowledge-retriever.service';
import { DatabaseService } from '../database/database.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { LLMService } from '../llm/llm.service';
import { IS_DEMO } from '../common';

export interface SymposiumSpeech {
  speaker: string; // 发言者名称
  stance: string; // 立场/视角
  content: string; // 发言内容
  citations: { chapterNo: number; chapterTitle: string }[];
}

export interface SymposiumSummary {
  coreInsights: string[]; // 核心洞见
  agreements: string[]; // 达成共识
  disagreements: string[]; // 保留分歧
  applications: string[]; // 应用场景
  closingQuote: string; // 收尾引文
}

export interface SymposiumRecord {
  id: string;
  ownerUserId: string;
  digitalHumanId: string | null;
  hostName: string;
  topic: string;
  chapterNo: number | null;
  rounds: number;
  speeches: SymposiumSpeech[];
  summary: SymposiumSummary;
  knowledgeItemId: string | null;
  knowledgeStatus: string; // pending / approved
  createdAt: string;
}

export interface StartSymposiumDto {
  topic?: string;
  chapterNo?: number;
  digitalHumanId?: string;
  hostName?: string;
  rounds?: number;
}

/** 经典研讨席：与数字人主持人对谈的三位固定角色 */
const CLASSIC_PANEL = [
  { key: 'laozi', name: '老子', stance: '原典正读' },
  { key: 'zhuangzi', name: '庄子', stance: '意象通达' },
  { key: 'guanyin', name: '关尹子', stance: '务实致用' },
] as const;

/** 推荐研讨主题（经典章题 × 现代议题） */
const SUGGESTED_TOPICS: { title: string; chapterNo?: number }[] = [
  { title: '上善若水：不争的处世智慧', chapterNo: 8 },
  { title: '无为而治与现代团队管理', chapterNo: 2 },
  { title: '知人者智：如何看清自己与他人', chapterNo: 33 },
  { title: '为学日益，为道日减：内卷时代做减法', chapterNo: 48 },
  { title: '柔弱胜刚强：以退为进的竞争策略', chapterNo: 36 },
  { title: '治大国若烹小鲜：经营中的分寸感', chapterNo: 60 },
  { title: '知足不辱：欲望与幸福的边界', chapterNo: 44 },
  { title: '大器晚成：慢成长的人生节奏', chapterNo: 41 },
  { title: '亲子共学道德经：给孩子的心法启蒙', chapterNo: 10 },
  { title: '致虚守静：信息过载中的定力修炼', chapterNo: 16 },
];

@Injectable()
export class SymposiumService {
  private readonly logger = new Logger(SymposiumService.name);
  private readonly demoStore = new Map<string, SymposiumRecord>();
  private seq = 0;

  constructor(
    private readonly retriever: KnowledgeRetriever,
    private readonly db: DatabaseService,
    private readonly llm: LLMService,
    private readonly knowledge: KnowledgeService,
  ) {}

  /** 推荐主题列表 */
  getTopics() {
    return { topics: SUGGESTED_TOPICS };
  }

  /** 发起一场研讨：数字人主持 + 三位经典角色对谈 → 会议纪要 → 知识库 */
  async start(userId: string, dto: StartSymposiumDto): Promise<SymposiumRecord> {
    const rounds = Math.min(Math.max(dto.rounds ?? 2, 1), 3);
    const hostName = dto.hostName?.trim() || '道枢使者';
    let digitalHumanId = dto.digitalHumanId ?? null;

    // 真实模式：以数据库中该用户的数字人为准；未认养则置空（列可空，勿传演示 ID）
    if (!IS_DEMO() && this.db.isAvailable) {
      const dh = await this.db.query<{ id: string; name: string }>(
        `SELECT id, name FROM digital_humans WHERE owner_user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId],
      );
      digitalHumanId = dh[0]?.id ?? null;
    }

    // 主题解析：显式主题 > 指定章节 > 随机章
    let topic = dto.topic?.trim() ?? '';
    let chapterNo = dto.chapterNo ?? null;
    let retrieved: RetrievedChapter[] = [];
    if (chapterNo) {
      const ch = this.retriever.getChapter(chapterNo);
      if (!ch) throw new BadRequestException(`第 ${chapterNo} 章不存在`);
      retrieved = [{ chapter: ch, score: 99, matchedAnnotations: ch.annotations.slice(0, 6) }];
      if (!topic) topic = `第${ch.no}章《${ch.title}》研讨`;
    } else {
      if (!topic) throw new BadRequestException('请提供研讨主题或选择章节');
      retrieved = this.retriever.search(topic, 3);
      if (retrieved.length === 0) {
        throw new NotFoundException('未在道德经知识库中检索到相关内容，请换一个主题');
      }
    }
    const main = retrieved[0];
    if (!chapterNo) chapterNo = main.chapter.no;
    if (retrieved.length === 1) {
      retrieved = this.retriever.search(main.chapter.simplified ?? main.chapter.title, 3);
    }

    // 生成讨论与纪要：LLM 优先，失败/未配置降级本地知识拼装
    let speeches: SymposiumSpeech[] = [];
    let summary: SymposiumSummary = {
      coreInsights: [],
      agreements: [],
      disagreements: [],
      applications: [],
      closingQuote: '',
    };
    let mode = 'local';
    if (this.llm.enabled) {
      try {
        const generated = await this.generateByLLM(topic, hostName, retrieved, rounds, userId);
        speeches = generated.speeches;
        summary = generated.summary;
        mode = 'llm';
      } catch (e) {
        this.logger.warn(`LLM 研讨生成失败，降级本地模式：${(e as Error).message}`);
      }
    }
    if (mode === 'local') {
      const local = this.buildLocalSymposium(topic, hostName, retrieved, rounds);
      speeches = local.speeches;
      summary = local.summary;
    }
    this.logger.log(`研讨「${topic}」完成：${speeches.length} 段发言（${mode} 模式）`);

    // 落库（研讨纪要自有存储）
    const record: SymposiumRecord = {
      id: IS_DEMO() ? `demo-sym-${++this.seq}` : crypto.randomUUID(),
      ownerUserId: userId,
      digitalHumanId,
      hostName,
      topic,
      chapterNo,
      rounds,
      speeches,
      summary,
      knowledgeItemId: null,
      knowledgeStatus: 'pending',
      createdAt: new Date().toISOString(),
    };
    if (IS_DEMO() || !this.db.isAvailable) {
      this.demoStore.set(record.id, record);
    } else {
      await this.db.query(
        `INSERT INTO symposium_records (id, owner_user_id, digital_human_id, host_name, topic, chapter_no, rounds, speeches, summary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          record.id,
          userId,
          digitalHumanId,
          hostName,
          topic,
          chapterNo,
          rounds,
          JSON.stringify(speeches),
          JSON.stringify(summary),
        ],
      );
    }

    // 会议纪要写入知识库（进入知识治理流程：pending → 审核入总库）
    try {
      const kbItem = await this.knowledge.submitSymposiumMinutes({
        topic,
        chapterNo,
        hostName,
        speeches,
        summary,
        submitterId: userId,
      });
      record.knowledgeItemId = kbItem.id;
      record.knowledgeStatus = kbItem.status;
      if (!(IS_DEMO() || !this.db.isAvailable)) {
        await this.db.query(
          `UPDATE symposium_records SET knowledge_item_id = $1 WHERE id = $2`,
          [kbItem.id, record.id],
        );
      }
    } catch (e) {
      this.logger.warn(`纪要入知识库失败：${(e as Error).message}`);
    }

    return record;
  }

  /** 我的研讨纪要列表 */
  async list(userId: string): Promise<Partial<SymposiumRecord>[]> {
    if (IS_DEMO() || !this.db.isAvailable) {
      return [...this.demoStore.values()]
        .filter((r) => r.ownerUserId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((r) => ({
          id: r.id,
          topic: r.topic,
          chapterNo: r.chapterNo,
          hostName: r.hostName,
          rounds: r.rounds,
          speechCount: r.speeches.length,
          summary: r.summary,
          knowledgeStatus: r.knowledgeStatus,
          createdAt: r.createdAt,
        }));
    }
    return this.db.query<Record<string, unknown>>(
      `SELECT id, topic, chapter_no AS "chapterNo", host_name AS "hostName", rounds,
              jsonb_array_length(speeches) AS "speechCount",
              summary, knowledge_item_id AS "knowledgeItemId", created_at AS "createdAt"
       FROM symposium_records WHERE owner_user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
  }

  /** 研讨详情 */
  async detail(userId: string, id: string): Promise<SymposiumRecord> {
    if (IS_DEMO() || !this.db.isAvailable) {
      const rec = this.demoStore.get(id);
      if (!rec || rec.ownerUserId !== userId) throw new NotFoundException('研讨纪要不存在');
      return rec;
    }
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT id, owner_user_id AS "ownerUserId", digital_human_id AS "digitalHumanId",
              host_name AS "hostName", topic, chapter_no AS "chapterNo", rounds,
              speeches, summary, knowledge_item_id AS "knowledgeItemId", created_at AS "createdAt"
       FROM symposium_records WHERE id = $1`,
      [id],
    );
    if (!rows[0] || rows[0].ownerUserId !== userId) throw new NotFoundException('研讨纪要不存在');
    return {
      ...rows[0],
      digitalHumanId: rows[0].digitalHumanId as string,
      hostName: rows[0].hostName as string,
      topic: rows[0].topic as string,
      chapterNo: rows[0].chapterNo as number | null,
      rounds: rows[0].rounds as number,
      speeches: rows[0].speeches as SymposiumSpeech[],
      summary: rows[0].summary as SymposiumSummary,
      knowledgeItemId: (rows[0].knowledgeItemId as string | null) ?? null,
      knowledgeStatus: 'pending',
      createdAt: rows[0].createdAt as string,
    } as SymposiumRecord;
  }

  // ---------- LLM 模式：结构化生成整场研讨 ----------

  private async generateByLLM(
    topic: string,
    hostName: string,
    retrieved: RetrievedChapter[],
    rounds: number,
    userId?: string,
  ): Promise<{ speeches: SymposiumSpeech[]; summary: SymposiumSummary }> {
    const context = retrieved
      .map(
        (r) =>
          `第${r.chapter.no}章《${r.chapter.title}》\n原文：${r.chapter.simplified ?? r.chapter.original}\n小结：${r.chapter.summary ?? ''}\n注解：${r.matchedAnnotations
            .slice(0, 3)
            .map((a) => `${a.sentence}——${a.items[0]?.text ?? ''}`)
            .join('；')}`,
      )
      .join('\n\n');

    const panel = CLASSIC_PANEL.map((p) => `${p.name}（视角：${p.stance}）`).join('、');
    const prompt = `你是「道枢」研讨导演，负责编排一场《道德经》主题研讨。

【研讨主题】${topic}
【主持人】数字人「${hostName}」
【研讨席】${panel}
【研讨轮数】${rounds} 轮（每轮三位经典角色依次发言）

【知识库依据】（发言必须以此为据，引用标注章节号，绝不编造原文）
${context}

要求：
1. 主持人开场点题并引出原文；每轮围绕主题递进（第一轮解经义，第二轮碰现实，若有第三轮则面向应用收束）；最后主持人总结。
2. 各角色保持视角差异：老子依原文正读；庄子善用意象比喻；关尹子谈现实致用，可提出质疑与张力。
3. 每段发言 120-200 字，口吻符合人物。
4. 最终纪要：核心洞见 3 条、共识 2 条、保留分歧 1-2 条、应用场景 3 条、收尾引文 1 句（注明章节）。

严格输出 JSON（不要任何其他文字）：
{
  "speeches": [{"speaker":"名称","stance":"视角","content":"发言","citations":[{"chapterNo":1,"chapterTitle":"章题"}]}],
  "summary": {"coreInsights":["..."],"agreements":["..."],"disagreements":["..."],"applications":["..."],"closingQuote":"..."}
}`;

    const res = await this.llm.chat(
      [{ role: 'user', content: prompt }],
      { model: 'light', temperature: 0.7, userId },
    );
    const parsed = this.extractJson(res.content);
    if (!parsed || !Array.isArray(parsed.speeches) || !parsed.summary) {
      throw new Error('LLM 返回结构异常');
    }
    const speeches: SymposiumSpeech[] = parsed.speeches
      .filter((s: Record<string, unknown>) => s?.speaker && s?.content)
      .map((s: Record<string, unknown>) => ({
        speaker: String(s.speaker),
        stance: String(s.stance ?? ''),
        content: String(s.content),
        citations: Array.isArray(s.citations) ? s.citations : [],
      }));
    if (speeches.length < 4) throw new Error('LLM 发言数量不足');
    const sm = parsed.summary as Record<string, unknown>;
    const summary: SymposiumSummary = {
      coreInsights: this.toStringList(sm.coreInsights, 3),
      agreements: this.toStringList(sm.agreements, 2),
      disagreements: this.toStringList(sm.disagreements, 2),
      applications: this.toStringList(sm.applications, 3),
      closingQuote: String(sm.closingQuote ?? ''),
    };
    return { speeches, summary };
  }

  private extractJson(text: string): Record<string, unknown> | null {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private toStringList(v: unknown, max: number): string[] {
    if (!Array.isArray(v)) return [];
    return v.map(String).filter(Boolean).slice(0, max);
  }

  // ---------- 本地模式：基于知识库拼装研讨 ----------

  private buildLocalSymposium(
    topic: string,
    hostName: string,
    retrieved: RetrievedChapter[],
    rounds: number,
  ): { speeches: SymposiumSpeech[]; summary: SymposiumSummary } {
    const main = retrieved[0].chapter;
    const second = retrieved[1]?.chapter;
    const citeMain = [{ chapterNo: main.no, chapterTitle: main.title }];
    const speeches: SymposiumSpeech[] = [];

    // 主持人开场
    speeches.push({
      speaker: hostName,
      stance: '主持开场',
      content: `今日研讨主题是「${topic}」。先立经文为据——第${main.no}章《${main.title}》：${main.simplified ?? main.original}${main.summary ? `\n章旨小结：${main.summary}` : ''}。请三位就本章义理与现代处境依次开示。`,
      citations: citeMain,
    });

    const laoziNotes = this.pickNote(retrieved[0], 'note');
    const zhuangziNote = this.pickNote(retrieved[0], 'wang');
    const guanyinNote = this.pickNote(retrieved[0], 'organizer');

    for (let round = 1; round <= rounds; round++) {
      // 老子：原典正读
      speeches.push({
        speaker: '老子',
        stance: '原典正读',
        content:
          round === 1
            ? `此章枢要在「${main.title}」。经文说：${this.firstSentence(main.simplified ?? main.original)}。${main.chapterNote ? main.chapterNote.slice(0, 120) : ''}${laoziNotes ? `注家云：${laoziNotes.slice(0, 100)}` : ''}读此章，当先辨天道与人道之分，再落到人事。`
            : `承接上轮。道不远人，只在日用：以此章之「守柔」「知足」观今日之竞逐，凡用力处即是偏离处。${second ? `可参照第${second.no}章《${second.title}》互证。` : ''}`,
        citations: second && round > 1 ? [{ chapterNo: second.no, chapterTitle: second.title }] : citeMain,
      });
      // 庄子：意象通达
      speeches.push({
        speaker: '庄子',
        stance: '意象通达',
        content: round === 1
          ? `${zhuangziNote ? `汪按有言：${zhuangziNote.slice(0, 110)}` : ''}吾试以譬喻明之——水不与物争而利物，虚舟触舟则怒息。人若自见于名，如以水击水，徒起波澜；若能虚己以游世，孰能害之。此章妙处，正在"放下我执"四字。`
          : `再进一层：世人把「无为」听成"不做"，恰如把"忘"当作"失"。坐忘非失我，乃是我与道相安。今日诸位谈压力谈内卷，皆因"我"字太重——名卸下了，力反而纯了。`,
        citations: citeMain,
      });
      // 关尹子：务实致用，提出张力
      speeches.push({
        speaker: '关尹子',
        stance: '务实致用',
        content: round === 1
          ? `我务实际：${guanyinNote ? `${guanyinNote.slice(0, 100)}` : ''}此章用在治事，是要人"抓枢机、省动作"——譬如烹小鲜，翻动愈多，碎得愈快。但我存一疑：今人处竞逐之世，若一味不争，位次不保，奈何？望诸位教我。`
          : `答我上轮之疑——原来"不争"非弃位，乃不以位伤生。选可争处而争，争亦合道。此分寸，正是凡圣之别。受教。`,
        citations: citeMain,
      });
    }

    // 主持人总结
    speeches.push({
      speaker: hostName,
      stance: '研讨总结',
      content: `感谢三位。本轮研讨以第${main.no}章为据：老子正其读，庄子通其意，关尹子落到事上验之。大家的分歧与共识，我已录入纪要，供主人温习与践行。`,
      citations: citeMain,
    });

    // 会议纪要
    const summary: SymposiumSummary = {
      coreInsights: [
        main.summary ?? `第${main.no}章枢机：${main.title}`,
        `老子正读：${(main.chapterNote || main.summary || '').slice(0, 60) || '辨天道人道，以柔守常'}`,
        zhuangziNote ? `庄子通其意：${zhuangziNote.slice(0, 60)}` : '庄子以虚舟为喻：放下我执，力反纯全',
      ].filter(Boolean),
      agreements: [
        '「不争」非不作为，而是不以执念伤生；守柔处下恰是长久的力',
        main.no === 8 || /水/.test(main.title) ? '上善若水：效水之善下、不争而利万物' : '为道日损：减损外在竞逐，增益内在定力',
      ],
      disagreements: [
        '庄子重心境之逍遥，关尹子重经世之分寸——「无为」究竟是修养境界还是行事策略，各有侧重',
      ],
      applications: [
        '职场管理：抓枢机、省动作，如"治大国若烹小鲜"，减少无效折腾',
        '个人心法：遇竞逐先问"我执何在"，以虚己游世化解内耗',
        '亲子家教：以身教"不言之教"替代说教，示范比纠正更近道',
      ],
      closingQuote: `《道德经》第${main.no}章：${this.firstSentence(main.simplified ?? main.original)}`,
    };

    return { speeches, summary };
  }

  private pickNote(r: RetrievedChapter, type: string): string {
    for (const a of r.matchedAnnotations) {
      const item = a.items.find((i) => i.type === type) ?? a.items[0];
      if (item?.text) return item.text;
    }
    return '';
  }

  private firstSentence(text: string): string {
    const s = text.split(/[。；\n]/)[0] ?? text;
    return s.length > 40 ? `${s.slice(0, 40)}……` : s;
  }
}
