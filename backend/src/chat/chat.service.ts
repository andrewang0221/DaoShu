import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { KnowledgeRetriever, RetrievedChapter } from './knowledge-retriever.service';
import { DatabaseService } from '../database/database.service';
import { IS_DEMO } from '../common';
import { buildAnchor } from './anchor.prompt';
import { LLMService } from '../llm/llm.service';
import { EvolutionService } from '../evolution/evolution.service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: unknown[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  digitalHumanId: string;
  mode: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly demoStore = new Map<string, Conversation>();
  private seq = 0;

  constructor(
    private readonly retriever: KnowledgeRetriever,
    private readonly db: DatabaseService,
    private readonly llm: LLMService,
    private readonly evolution: EvolutionService,
  ) {}

  // ---------- 会话管理 ----------
  async listConversations(digitalHumanId: string): Promise<Conversation[]> {
    if (IS_DEMO()) {
      return [...this.demoStore.values()].filter((c) => c.digitalHumanId === digitalHumanId);
    }
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT id, mode, title, created_at AS "createdAt"
       FROM conversations WHERE digital_human_id = $1 ORDER BY updated_at DESC`,
      [digitalHumanId],
    );
    return rows.map((r) => ({
      id: r.id as string,
      digitalHumanId,
      mode: r.mode as string,
      title: (r.title as string) ?? '',
      messages: [],
      createdAt: r.createdAt as string,
    }));
  }

  async createConversation(
    digitalHumanId: string,
    mode = 'free',
    title?: string,
  ): Promise<Conversation> {
    const conv: Conversation = {
      id: IS_DEMO() ? `demo-conv-${++this.seq}` : crypto.randomUUID(),
      digitalHumanId,
      mode,
      title: title ?? (mode === 'free' ? '自由问道' : mode),
      messages: [],
      createdAt: new Date().toISOString(),
    };
    if (IS_DEMO()) {
      this.demoStore.set(conv.id, conv);
    } else {
      await this.db.query(
        `INSERT INTO conversations (id, digital_human_id, mode, title) VALUES ($1, $2, $3, $4)`,
        [conv.id, digitalHumanId, mode, title ?? ''],
      );
    }
    return conv;
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    if (IS_DEMO()) {
      const conv = this.demoStore.get(conversationId);
      if (!conv) throw new NotFoundException('会话不存在');
      return conv.messages;
    }
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT id, role, content, citations, created_at AS "createdAt"
       FROM messages WHERE conversation_id = $1 ORDER BY created_at`,
      [conversationId],
    );
    return rows.map((r) => ({
      id: r.id as string,
      role: r.role as 'user' | 'assistant',
      content: r.content as string,
      citations: (r.citations as unknown[]) ?? [],
      createdAt: r.createdAt as string,
    }));
  }

  // ---------- 核心问答 ----------

  async ask(conversationId: string, content: string, userId?: string): Promise<ChatMessage> {
    // 获取数字人ID（演示模式从会话中获取）
    let dhId = 'demo-dh';
    if (!IS_DEMO()) {
      const rows = await this.db.query<{ digital_human_id: string }>(
        'SELECT digital_human_id FROM conversations WHERE id = $1',
        [conversationId],
      );
      dhId = rows[0]?.digital_human_id ?? dhId;
    }

    const retrieved = this.retriever.search(content, 3);
    if (retrieved.length === 0) {
      throw new NotFoundException('未在道德经知识库中检索到相关内容，请换一种问法');
    }
    const answerText = await this.composeAnswer(content, retrieved, userId);
    const citations = retrieved.map((r) => ({
      chapterNo: r.chapter.no,
      chapterTitle: r.chapter.title,
      source: r.chapter.source,
    }));
    const assistantMsg: ChatMessage = {
      id: IS_DEMO() ? `demo-msg-${++this.seq}` : crypto.randomUUID(),
      role: 'assistant',
      content: answerText,
      citations,
      createdAt: new Date().toISOString(),
    };

    if (IS_DEMO()) {
      const conv = this.demoStore.get(conversationId);
      if (!conv) throw new NotFoundException('会话不存在');
      dhId = conv.digitalHumanId;
      conv.messages.push(
        { id: `demo-msg-${++this.seq}`, role: 'user', content, citations: [], createdAt: new Date().toISOString() },
        assistantMsg,
      );
    } else {
      const userMsgId = crypto.randomUUID();
      await this.db.query(
        `INSERT INTO messages (id, conversation_id, role, content, citations) VALUES ($1, $2, 'user', $3, '[]')`,
        [userMsgId, conversationId, content],
      );
      await this.db.query(
        `INSERT INTO messages (id, conversation_id, role, content, citations) VALUES ($1, $2, 'assistant', $3, $4)`,
        [assistantMsg.id, conversationId, answerText, JSON.stringify(citations)],
      );
    }

    // 自动提取记忆并存储（进化引擎）
    try {
      await this.evolution.extractAndStoreMemory(
        dhId,
        `用户提问：${content}\n数字人回答：${answerText}`,
        `关于${retrieved.map((r) => `第${r.chapter.no}章`).join('、')}的对话`,
        userId,
      );
      // 同时计算实时进化指标
      await this.evolution.calculateRealtimeMetrics(dhId, content + answerText);
    } catch (e) {
      this.logger.debug(`记忆提取跳过：${(e as Error).message}`);
    }

    return assistantMsg;
  }

  // ---------- 问答模式切换：LLM vs 本地检索 ----------

  /** 组装回答：有大模型可用（用户自定义/后台配置/环境变量）走 LLM，否则本地知识检索模式 */
  private async composeAnswer(
    query: string,
    retrieved: RetrievedChapter[],
    userId?: string,
  ): Promise<string> {
    const context = this.buildKnowledgeContext(retrieved);
    const anchor = buildAnchor('道德经智慧导师', '主人');

    // 模式1：LLM 大模型
    if (this.llm.enabled) {
      try {
        const response = await this.llm.chat(
          [
            { role: 'system', content: anchor },
            {
              role: 'user',
              content: `请基于以下《道德经》原文知识库内容回答主人的问题。\n要求：\n1. 引用原文必须标注章节号（如"《道德经》第二章"）\n2. 结合主人的具体处境给出启发\n3. 多提问引导，少直接说教\n4. 保持"道德经智慧导师"角色\n\n【知识库检索结果】\n${context}\n\n【主人的问题】\n${query}`,
            },
          ],
          { model: 'light', temperature: 0.7, userId },
        );
        this.logger.log(`LLM 回答完成，模型=${response.model}，tokens=${response.usage.totalTokens}`);
        return response.content;
      } catch (e) {
        this.logger.warn(`LLM 调用失败，降级本地检索：${(e as Error).message}`);
      }
    }

    // 模式2：本地知识检索模式（无 LLM 或调用失败）
    return this.buildLocalResponse(query, retrieved, context);
  }

  /** 构建知识库上下文字符串 */
  private buildKnowledgeContext(retrieved: RetrievedChapter[]): string {
    return retrieved
      .map((r) => {
        const annos = r.matchedAnnotations
          .slice(0, 3)
          .map((a) => `    - ${a.sentence}：${a.items[0]?.text ?? ''}`)
          .join('\n');
        return `第${r.chapter.no}章《${r.chapter.title}》（${r.chapter.source}）\n原文：${r.chapter.simplified ?? r.chapter.original}\n小结：${r.chapter.summary ?? ''}\n相关注解：\n${annos}`;
      })
      .join('\n\n');
  }

  /** 本地知识检索模式回答 */
  private buildLocalResponse(
    query: string,
    retrieved: RetrievedChapter[],
    context: string,
  ): string {
    const lines: string[] = [
      '【本地知识检索模式】以下内容摘自《道德经》知识库（汪胜岩注解 2026 整理本）：',
      '',
    ];
    for (const r of retrieved) {
      lines.push(`━━ 第${r.chapter.no}章《${r.chapter.title}》（${r.chapter.source}）━━`);
      lines.push(`原文：${r.chapter.simplified ?? r.chapter.original}`);
      if (r.chapter.summary) lines.push(`小结：${r.chapter.summary}`);
      if (r.matchedAnnotations.length) {
        lines.push('相关注解：');
        for (const a of r.matchedAnnotations.slice(0, 3)) {
          const first = a.items.find((i) => i.type === 'note') ?? a.items[0];
          if (first) lines.push(`  · ${a.sentence}：${first.text.slice(0, 120)}${first.text.length > 120 ? '…' : ''}`);
        }
      }
      lines.push('');
    }
    lines.push('（提示：管理员在后台配置大模型、或用户在「我的-大模型设置」配置自有 API 后，可获得大模型深度解读与引导式对话）');
    return lines.join('\n');
  }
}
