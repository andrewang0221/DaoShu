import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PointsService } from '../points/points.service';
import { LLMService } from '../llm/llm.service';
import { KnowledgeRetriever, RetrievedChapter } from '../chat/knowledge-retriever.service';
import { INDUSTRY_AGENTS, INDUSTRY_TAXONOMY, IndustryAgentDef, IndustryTaxonomyDef } from './industry.data';
import { ALIGNMENT_KNOWLEDGE, REFLECTION_CHAIN } from '../daoshu/daoshu.data';

/** 每个行业包的免费试用次数（FR-P02：试用后再解锁） */
const FREE_TRIALS = 2;

interface InvocationLog {
  userId: string;
  agentCode: string;
  question: string;
  answer: string;
  chapters: { chapterNo: number; chapterTitle: string }[];
  createdAt: string;
}

@Injectable()
export class IndustryService {
  constructor(
    private readonly retriever: KnowledgeRetriever,
    private readonly llm: LLMService,
    private readonly points: PointsService,
    private readonly db: DatabaseService,
  ) {}

  // 演示模式内存态：自定义包 / 解锁记录 / 调用日志（案例源）
  private readonly demoCustomPacks = new Map<string, IndustryAgentDef>();
  private readonly demoUnlocks = new Set<string>(); // `${userId}:${code}`
  private readonly demoInvocations: InvocationLog[] = [];

  // ============================================================
  // 行业包列表与详情（FR-P01）
  // ============================================================

  async list() {
    const customs = await this.customPacks();
    return [...INDUSTRY_AGENTS, ...customs].map((a) => ({
      code: a.code,
      name: a.name,
      sector: a.sector,
      excerpt: a.excerpt,
      pricing: a.pricing,
      unlockCost: a.unlockCost,
      custom: !!a.custom,
    }));
  }

  async get(code: string): Promise<IndustryAgentDef> {
    const preset = INDUSTRY_AGENTS.find((a) => a.code === code);
    if (preset) return preset;
    const customs = await this.customPacks();
    const custom = customs.find((a) => a.code === code);
    if (!custom) throw new NotFoundException(`未找到行业 Agent：${code}`);
    return custom;
  }

  /** 自定义包：完整模式读 industry_packs（published），演示模式读内存 */
  private async customPacks(): Promise<IndustryAgentDef[]> {
    if (IS_DEMO_AVAIL(this.db)) {
      return [...this.demoCustomPacks.values()];
    }
    try {
      const rows = await this.db.query<IndustryAgentDef>(
        `SELECT code, name, def->>'sector' AS sector, def->>'excerpt' AS excerpt,
                def->>'pricing' AS pricing, (def->>'unlockCost')::int AS "unlockCost",
                def->'painPoints' AS "painPoints", def->'injectionPoints' AS "injectionPoints",
                def->>'promptPack' AS "promptPack", def->'sampleQuestions' AS "sampleQuestions",
                def->'anchorChapters' AS "anchorChapters",
                owner_user_id AS "ownerUserId", true AS custom
         FROM industry_packs WHERE status = 'published'`,
      );
      return rows.map((r) => ({ ...r, custom: true, ownerUserId: r.ownerUserId ?? undefined }));
    } catch {
      // 表未迁移：回退内存
      return [...this.demoCustomPacks.values()];
    }
  }

  // ============================================================
  // 自定义行业识别与包生成（FR-P 核心）
  // ============================================================

  /**
   * 输入一段自我描述（如"我是一名建筑工人"）→ 识别行业 → 生成专属行业 Agent。
   * LLM 可用时由大模型精细归位并定制注入包；否则本地关键词打分。
   */
  async detect(profile: string, userId: string) {
    if (!profile?.trim() || profile.trim().length < 4) {
      throw new BadRequestException('请输入至少 4 个字的职业/行业描述');
    }
    const text = profile.trim();

    // 1) 本地关键词识别（LLM 失败时的兜底，也提供候选行业）
    const local = this.detectByKeywords(text);

    let tax = local.tax;
    let matchReason = `命中关键词「${local.matched.join('、')}」`;
    let source: 'llm' | 'local' = 'local';
    let llmCustom: Partial<IndustryAgentDef> = {};

    // 2) LLM 精细识别 + 定制注入包
    if (this.llm.enabled) {
      try {
        const parsed = await this.llmDetect(text);
        if (parsed) {
          source = 'llm';
          matchReason = parsed.matchReason || matchReason;
          const found = INDUSTRY_TAXONOMY.find((t) => t.code === parsed.industryCode);
          tax = found ?? local.tax;
          llmCustom = {
            name: parsed.agentName,
            excerpt: parsed.excerpt,
            painPoints: parsed.painPoints,
            injectionPoints: parsed.injectionPoints,
            promptPack: parsed.promptPack,
            sampleQuestions: parsed.sampleQuestions,
          };
        }
      } catch {
        // LLM 异常：静默回退本地结果
      }
    }

    // 3) 组装自定义 Agent（生成者本人免费解锁）
    const code = `custom-${tax.code}-${userId.slice(0, 8)}`;
    const agent: IndustryAgentDef = {
      code,
      name: llmCustom.name || `${tax.name}·${tax.agentName}`,
      sector: tax.sector,
      excerpt: llmCustom.excerpt || tax.excerpt,
      painPoints: llmCustom.painPoints?.length ? llmCustom.painPoints : tax.painPoints,
      injectionPoints: llmCustom.injectionPoints?.length ? llmCustom.injectionPoints : tax.injectionPoints,
      promptPack: llmCustom.promptPack || tax.promptPack,
      sampleQuestions: llmCustom.sampleQuestions?.length ? llmCustom.sampleQuestions : tax.sampleQuestions,
      anchorChapters: tax.anchorChapters,
      pricing: '个人定制包（生成者免费）',
      unlockCost: 100,
      custom: true,
      ownerUserId: userId,
    };

    // 4) 持久化 + 生成者自动解锁
    await this.saveCustomPack(agent);
    await this.grantUnlock(userId, code, 0);

    return {
      industry: {
        code: tax.code,
        name: tax.name,
        sector: tax.sector,
        icon: tax.icon,
        score: local.score,
        matchReason,
        source,
      },
      agent,
    };
  }

  /** 本地关键词打分：长词权重高，未命中归"通用职场" */
  private detectByKeywords(text: string) {
    let best: { tax: IndustryTaxonomyDef; score: number; matched: string[] } | null = null;
    for (const tax of INDUSTRY_TAXONOMY) {
      const matched = tax.keywords.filter((k) => text.includes(k));
      if (!matched.length) continue;
      const score = matched.reduce((s, k) => s + k.length * 2, 0);
      if (!best || score > best.score) best = { tax, score, matched };
    }
    const generic = INDUSTRY_TAXONOMY.find((t) => t.code === 'generic')!;
    if (!best) return { tax: generic, score: 0, matched: [] as string[] };
    return best;
  }

  /** LLM 行业识别 + 注入包定制 */
  private async llmDetect(text: string) {
    const candidates = INDUSTRY_TAXONOMY.map((t) => `${t.code}(${t.name})`).join('、');
    const prompt = `你是行业分类专家，为"道枢"系统判断用户所属行业并定制"道系行业 Agent"。

【用户自述】${text}

【候选行业】${candidates}

要求：
1. industryCode 必须从候选列表中选择（选最贴合的；都不贴合选 generic）。
2. agentName 为贴合该用户的道系 Agent 名（可带《道德经》意象，15 字内）。
3. painPoints 是该用户所在场景的 3 条真实痛点；injectionPoints 是 3 条《道德经》智慧注入点（引用原句）；promptPack 是给 Agent 的系统提示词（150 字内，含 4 条行为准则）。
4. sampleQuestions 是 2 条该用户可能问的问题。

严格输出 JSON（不要任何其他文字）：
{"industryCode":"...","matchReason":"判断依据（40字内）","agentName":"...","excerpt":"一句话卖点（30字内）","painPoints":["..."],"injectionPoints":["..."],"promptPack":"...","sampleQuestions":["..."]}`;

    const res = await this.llm.chat([{ role: 'user', content: prompt }], {
      model: 'light',
      temperature: 0.4,
    });
    const start = res.content.indexOf('{');
    const end = res.content.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      const parsed = JSON.parse(res.content.slice(start, end + 1)) as Record<string, unknown>;
      const toList = (v: unknown, n: number): string[] =>
        Array.isArray(v) ? v.map(String).filter(Boolean).slice(0, n) : [];
      return {
        industryCode: String(parsed.industryCode ?? 'generic'),
        matchReason: String(parsed.matchReason ?? ''),
        agentName: String(parsed.agentName ?? ''),
        excerpt: String(parsed.excerpt ?? ''),
        painPoints: toList(parsed.painPoints, 3),
        injectionPoints: toList(parsed.injectionPoints, 3),
        promptPack: String(parsed.promptPack ?? ''),
        sampleQuestions: toList(parsed.sampleQuestions, 2),
      };
    } catch {
      return null;
    }
  }

  /** 自定义包入库（完整模式 upsert industry_packs；演示模式内存） */
  private async saveCustomPack(agent: IndustryAgentDef) {
    const def = {
      sector: agent.sector,
      excerpt: agent.excerpt,
      pricing: agent.pricing,
      unlockCost: agent.unlockCost,
      painPoints: agent.painPoints,
      injectionPoints: agent.injectionPoints,
      promptPack: agent.promptPack,
      sampleQuestions: agent.sampleQuestions,
      anchorChapters: agent.anchorChapters ?? [],
    };
    if (IS_DEMO_AVAIL(this.db)) {
      this.demoCustomPacks.set(agent.code, agent);
      return;
    }
    try {
      await this.db.query(
        `INSERT INTO industry_packs (code, name, price, def, owner_user_id, status)
         VALUES ($1, $2, 0, $3::jsonb, $4, 'published')
         ON CONFLICT (code) DO UPDATE SET
           name = $2, def = $3::jsonb, owner_user_id = $4, updated_at = now()`,
        [agent.code, agent.name, JSON.stringify(def), agent.ownerUserId ?? null],
      );
    } catch {
      this.demoCustomPacks.set(agent.code, agent);
    }
  }

  // ============================================================
  // 解锁与试用（FR-P02：积分解锁，试用 2 次）
  // ============================================================

  private async isUnlocked(userId: string, code: string): Promise<boolean> {
    if (IS_DEMO_AVAIL(this.db)) return this.demoUnlocks.has(`${userId}:${code}`);
    try {
      const rows = await this.db.query(`SELECT 1 FROM industry_unlocks WHERE user_id = $1 AND pack_code = $2`, [
        userId,
        code,
      ]);
      return rows.length > 0;
    } catch {
      return this.demoUnlocks.has(`${userId}:${code}`);
    }
  }

  private async grantUnlock(userId: string, code: string, cost: number) {
    if (IS_DEMO_AVAIL(this.db)) {
      this.demoUnlocks.add(`${userId}:${code}`);
      return;
    }
    try {
      await this.db.query(
        `INSERT INTO industry_unlocks (user_id, pack_code, cost) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, pack_code) DO NOTHING`,
        [userId, code, cost],
      );
    } catch {
      this.demoUnlocks.add(`${userId}:${code}`);
    }
  }

  async unlock(code: string, userId: string) {
    const agent = await this.get(code);
    if (await this.isUnlocked(userId, code)) {
      return { ok: true, alreadyUnlocked: true, cost: 0 };
    }
    // 生成者本人免费
    if (agent.ownerUserId === userId) {
      await this.grantUnlock(userId, code, 0);
      return { ok: true, cost: 0, note: '本人定制包，免费解锁。' };
    }
    const spend = await this.points.spend(userId, agent.unlockCost, 'industry_unlock', code);
    await this.grantUnlock(userId, code, agent.unlockCost);
    return { ok: true, cost: agent.unlockCost, balance: spend.balance };
  }

  async myUnlocks(userId: string) {
    if (IS_DEMO_AVAIL(this.db)) {
      const codes = [...this.demoUnlocks].filter((k) => k.startsWith(`${userId}:`)).map((k) => k.split(':')[1]);
      return { codes };
    }
    try {
      const rows = await this.db.query<{ pack_code: string }>(
        `SELECT pack_code FROM industry_unlocks WHERE user_id = $1`,
        [userId],
      );
      return { codes: rows.map((r) => r.pack_code) };
    } catch {
      return { codes: [] as string[] };
    }
  }

  /** 访问检查：已解锁不限次；未解锁可免费试用 FREE_TRIALS 次 */
  private async checkAccess(userId: string, code: string) {
    const unlocked = await this.isUnlocked(userId, code);
    const used = await this.countInvocations(userId, code);
    return {
      unlocked,
      trialsUsed: used,
      freeTrialLeft: unlocked ? FREE_TRIALS : Math.max(FREE_TRIALS - used, 0),
    };
  }

  // ============================================================
  // 行业场景问答 + 调用日志（案例源）
  // ============================================================

  async invoke(code: string, question: string, userId: string) {
    if (!question?.trim()) throw new BadRequestException('问题不能为空');
    const agent = await this.get(code);

    const access = await this.checkAccess(userId, code);
    if (!access.unlocked && access.freeTrialLeft <= 0) {
      throw new BadRequestException(`免费试用已用完（${FREE_TRIALS} 次），解锁后可无限使用`);
    }

    const retrieved = this.retriever.search(`${agent.sector}${question}`, 3);
    // 检索为空时兜底：注入行业道系锚点章节（如建筑业→第 64 章九层之台）
    if (!retrieved.length && agent.anchorChapters?.length) {
      for (const no of agent.anchorChapters) {
        const ch = this.retriever.getChapter(no);
        if (ch) retrieved.push({ chapter: ch, score: 0, matchedAnnotations: ch.annotations.slice(0, 2) });
      }
    }
    const chapters = retrieved.map((r) => ({
      chapterNo: r.chapter.no,
      chapterTitle: r.chapter.title,
      score: r.score,
    }));
    const matchedRules = ALIGNMENT_KNOWLEDGE.slice(0, 3).map((k) => ({
      principle: k.principle,
      agentRule: k.agentRule,
      source: k.source,
    }));
    const reflection = REFLECTION_CHAIN.map((q) => q.label);

    // 回答：LLM 优先（注入包 + 检索 + 对齐规则）。
    // LLM 已启用但调用失败时直接报错（不降级、不记账）——降级的本地拼装回答过短，
    // 用户体验像"没回答完"，且会白白消耗试用次数。
    let answer: string;
    let engine = 'local';
    if (this.llm.enabled) {
      try {
        answer = await this.llmAnswer(agent, question, retrieved, userId);
        engine = 'llm';
      } catch (e) {
        throw new ServiceUnavailableException(
          `AI 生成失败（${(e as Error).message}），本次不计入试用次数，请稍后重试`,
        );
      }
    } else {
      answer = this.buildAnswer(agent.name, agent.sector, question, retrieved);
    }

    const result = {
      agentCode: code,
      agentName: agent.name,
      sector: agent.sector,
      question,
      engine,
      chaptersUsed: chapters,
      alignmentRules: matchedRules,
      answer,
      access: {
        ...access,
        freeTrialLeft: access.unlocked ? -1 : Math.max(access.freeTrialLeft - 1, 0),
      },
      frameworkNote: `已注入行业提示词包 + 对齐规则 ${matchedRules.length} 条；后续步骤可接入道枢审计 API 复核（${reflection.join(' / ')}）。`,
    };

    // 调用日志（FR-P03 案例库数据源）
    await this.logInvocation(userId, code, question, answer, chapters);

    return result;
  }

  /** LLM 行业级回答：注入包 + 知识库依据 + 对齐规则 */
  private async llmAnswer(
    agent: IndustryAgentDef,
    question: string,
    retrieved: RetrievedChapter[],
    userId: string,
  ): Promise<string> {
    const context = retrieved
      .map(
        (r) =>
          `第${r.chapter.no}章《${r.chapter.title}》原文：${r.chapter.simplified ?? r.chapter.original}${
            r.chapter.summary ? `；小结：${r.chapter.summary}` : ''
          }`,
      )
      .join('\n');
    const rules = ALIGNMENT_KNOWLEDGE.slice(0, 3).map((k) => `${k.principle}——${k.agentRule}`).join('；');

    const prompt = `${agent.promptPack}

【行业】${agent.sector}
【知识库依据】（引用必须以此为据，标注章节号，绝不编造原文）
${context}

【对齐规则】${rules}

【用户问题】${question}

要求：
1. 结合行业场景与《道德经》智慧回答，300-500 字；
2. 结构：【道式观察】→【经文依据】（引用章节）→【可行的一步】；
3. 语气符合行业 Agent 人设，不给空泛鸡汤；
4. 涉及安全/健康/法律/投资，先给底线提醒。`;

    const res = await this.llm.chat([{ role: 'user', content: prompt }], {
      model: 'light',
      temperature: 0.7,
      maxTokens: 2048, // 行业级回答较长，避免模型默认配额截断
      userId,
    });
    return res.content;
  }

  private buildAnswer(
    agentName: string,
    sector: string,
    question: string,
    retrieved: RetrievedChapter[],
  ): string {
    const lines: string[] = [
      `【${agentName}·本地演示回答】（${sector}行业注入版）`,
      '',
    ];
    for (const r of retrieved.slice(0, 2)) {
      lines.push(`第${r.chapter.no}章《${r.chapter.title}》（${r.chapter.source}）`);
      lines.push(`原文：${r.chapter.simplified ?? r.chapter.original}`);
      if (r.chapter.summary) lines.push(`小结：${r.chapter.summary}`);
      const first = r.matchedAnnotations[0];
      if (first) lines.push(`注解：${first.sentence}：${(first.items[0]?.text ?? '').slice(0, 80)}`);
      lines.push('');
    }
    lines.push('对当前问题的道式观察：先按"情绪-事实-可选方案"三层回应；不要急着给结论，确认对方处境后再落一步。');
    lines.push('（提示：配置 LLM_API_KEY 后，此处将由大模型结合注入包生成完整行业级回答）');
    return lines.join('\n');
  }

  // ============================================================
  // 调用日志与案例库（FR-P03）
  // ============================================================

  private async logInvocation(
    userId: string,
    agentCode: string,
    question: string,
    answer: string,
    chapters: { chapterNo: number; chapterTitle: string }[],
  ) {
    const entry: InvocationLog = {
      userId,
      agentCode,
      question,
      answer,
      chapters: chapters.map((c) => ({ chapterNo: c.chapterNo, chapterTitle: c.chapterTitle })),
      createdAt: new Date().toISOString(),
    };
    if (IS_DEMO_AVAIL(this.db)) {
      this.demoInvocations.push(entry);
      if (this.demoInvocations.length > 500) this.demoInvocations.shift();
      return;
    }
    try {
      await this.db.query(
        `INSERT INTO industry_invocations (user_id, agent_code, question, result, chapters_used)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)`,
        [userId, agentCode, question, JSON.stringify({ answer }), JSON.stringify(entry.chapters)],
      );
    } catch {
      this.demoInvocations.push(entry);
    }
  }

  private async countInvocations(userId: string, code: string): Promise<number> {
    if (IS_DEMO_AVAIL(this.db)) {
      return this.demoInvocations.filter((l) => l.userId === userId && l.agentCode === code).length;
    }
    try {
      const rows = await this.db.query<{ count: string }>(
        `SELECT count(*) AS count FROM industry_invocations WHERE user_id = $1 AND agent_code = $2`,
        [userId, code],
      );
      return Number(rows[0]?.count ?? 0);
    } catch {
      return this.demoInvocations.filter((l) => l.userId === userId && l.agentCode === code).length;
    }
  }

  /** 行业案例库：取该 Agent 最近 20 条调用问答（经管理员审核后可入总库） */
  async cases(code: string) {
    await this.get(code); // 校验存在
    if (IS_DEMO_AVAIL(this.db)) {
      return this.demoInvocations
        .filter((l) => l.agentCode === code)
        .slice(-20)
        .reverse()
        .map((l) => ({ question: l.question, answer: l.answer, chapters: l.chapters, createdAt: l.createdAt }));
    }
    try {
      const rows = await this.db.query<{
        question: string;
        result: { answer?: string };
        chapters_used: { chapterNo: number; chapterTitle: string }[];
        created_at: string;
      }>(
        `SELECT question, result, chapters_used, created_at
         FROM industry_invocations WHERE agent_code = $1
         ORDER BY created_at DESC LIMIT 20`,
        [code],
      );
      return rows.map((r) => ({
        question: r.question,
        answer: r.result?.answer ?? '',
        chapters: Array.isArray(r.chapters_used) ? r.chapters_used : [],
        createdAt: r.created_at,
      }));
    } catch {
      return [];
    }
  }
}

/** 演示模式或数据库不可用 → 走内存态 */
function IS_DEMO_AVAIL(db: DatabaseService): boolean {
  return process.env.DEMO_MODE === 'true' || !process.env.DATABASE_URL || !db.isAvailable;
}
