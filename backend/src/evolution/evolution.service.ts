/**
 * 进化引擎 - 记忆向量化、成长复盘、一致性审计、维度度量
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LLMService } from '../llm/llm.service';
import { IS_DEMO } from '../common';

// ---------- 类型 ----------
export interface MemoryItem {
  id: string;
  type: 'pattern' | 'emotion' | 'goal' | 'insight' | 'preference';
  content: string;
  embedding?: number[];
  confirmed: boolean;
  createdAt: string;
}

export interface EvolutionMetrics {
  understanding: number; // 理解度 0-1
  wisdom: number;        // 智慧度 0-1
  empathy: number;       // 共情度 0-1
  consistency: number;   // 一致性 0-1
  overall: number;       // 综合分 0-1
}

export interface GrowthReview {
  id: string;
  metrics: EvolutionMetrics;
  summary: string;       // 道德经框架复盘
  suggestions: string[]; // 改进建议
  period: string;        // 复盘周期（如 "2026-01"）
  createdAt: string;
}

export interface AuditResult {
  consistent: boolean;
  score: number;
  violations: string[];
  suggestion?: string;
}

@Injectable()
export class EvolutionService {
  private readonly logger = new Logger(EvolutionService.name);

  // 演示模式：内存存储
  private readonly demoMemory = new Map<string, MemoryItem[]>();
  private readonly demoReviews = new Map<string, GrowthReview[]>();
  private readonly demoMetrics = new Map<string, EvolutionMetrics>();
  private seq = 0;

  constructor(
    private readonly db: DatabaseService,
    private readonly llm: LLMService,
  ) {}

  // ============================================================
  //  1. 记忆管理（向量化存储）
  // ============================================================

  /** 从对话中提取记忆并存储 */
  async extractAndStoreMemory(
    dhId: string,
    conversationText: string,
    conversationSummary: string,
    userId?: string,
  ): Promise<MemoryItem[]> {
    if (!this.llm.enabled) {
      this.logger.debug('LLM 未启用，跳过记忆提取');
      return [];
    }

    // 用 LLM 从对话中提取记忆要点
    const response = await this.llm.chat([
      {
        role: 'system',
        content: `你是记忆提取器。分析对话内容，提取关键记忆点。输出 JSON 数组：[{"type":"pattern|emotion|goal|insight|preference","content":"一句话描述"}]。最多 5 条，每条不超过 50 字。`,
      },
      {
        role: 'user',
        content: `对话摘要：${conversationSummary}\n完整内容：${conversationText.slice(0, 3000)}`,
      },
    ], { model: 'light', temperature: 0.3, userId });

    try {
      const items = JSON.parse(response.content) as { type: string; content: string }[];
      const memories: MemoryItem[] = [];

      for (const item of items) {
        if (!['pattern', 'emotion', 'goal', 'insight', 'preference'].includes(item.type)) continue;
        const memory: MemoryItem = {
          id: IS_DEMO() ? `mem-${++this.seq}` : crypto.randomUUID(),
          type: item.type as MemoryItem['type'],
          content: item.content,
          confirmed: false,
          createdAt: new Date().toISOString(),
        };

        // 生成 embedding（如果 LLM 支持）
        if (this.llm.enabled) {
          try {
            memory.embedding = await this.llm.embed(item.content);
          } catch {
            // embedding 失败不影响存储
          }
        }

        memories.push(memory);
      }

      // 存储
      if (IS_DEMO()) {
        const existing = this.demoMemory.get(dhId) ?? [];
        existing.push(...memories);
        this.demoMemory.set(dhId, existing);
      } else {
        for (const mem of memories) {
          await this.db.query(
            `INSERT INTO memory_longterm (id, digital_human_id, type, content, embedding)
             VALUES ($1, $2, $3, $4, $5)`,
            [mem.id, dhId, mem.type, mem.content,
             mem.embedding ? JSON.stringify(mem.embedding) : null],
          );
        }
      }

      return memories;
    } catch (e) {
      this.logger.warn(`记忆提取解析失败：${(e as Error).message}`);
      return [];
    }
  }

  /** 检索相关记忆（向量相似度） */
  async searchMemory(dhId: string, query: string, topK = 5): Promise<MemoryItem[]> {
    if (IS_DEMO()) {
      return (this.demoMemory.get(dhId) ?? []).slice(-topK);
    }

    // 生成查询向量
    let queryEmbedding: number[];
    try {
      queryEmbedding = await this.llm.embed(query);
    } catch {
      // fallback：返回最近的记忆
      return this.db.query<MemoryItem>(
        `SELECT id, type, content, confirmed, created_at AS "createdAt"
         FROM memory_longterm WHERE digital_human_id = $1
         ORDER BY created_at DESC LIMIT $2`,
        [dhId, topK],
      );
    }

    // pgvector 余弦相似度检索
    return this.db.query<MemoryItem>(
      `SELECT id, type, content, confirmed, created_at AS "createdAt",
              1 - (embedding <=> $2::vector) AS similarity
       FROM memory_longterm
       WHERE digital_human_id = $1 AND embedding IS NOT NULL
       ORDER BY embedding <=> $2::vector
       LIMIT $3`,
      [dhId, JSON.stringify(queryEmbedding), topK],
    );
  }

  /** 获取用户所有记忆 */
  async getMemories(dhId: string): Promise<MemoryItem[]> {
    if (IS_DEMO()) {
      return this.demoMemory.get(dhId) ?? [];
    }
    return this.db.query<MemoryItem>(
      `SELECT id, type, content, confirmed, created_at AS "createdAt"
       FROM memory_longterm WHERE digital_human_id = $1
       ORDER BY created_at DESC`,
      [dhId],
    );
  }

  /** 确认记忆（主人确认后入价值层） */
  async confirmMemory(dhId: string, memoryId: string): Promise<void> {
    if (IS_DEMO()) {
      const memories = this.demoMemory.get(dhId) ?? [];
      const m = memories.find((x) => x.id === memoryId);
      if (m) m.confirmed = true;
      return;
    }
    await this.db.query(
      'UPDATE memory_longterm SET confirmed = true WHERE id = $1 AND digital_human_id = $2',
      [memoryId, dhId],
    );
  }

  /** 删除记忆（遗忘权） */
  async deleteMemory(dhId: string, memoryId: string): Promise<void> {
    if (IS_DEMO()) {
      const memories = this.demoMemory.get(dhId) ?? [];
      this.demoMemory.set(dhId, memories.filter((m) => m.id !== memoryId));
      return;
    }
    await this.db.query(
      'DELETE FROM memory_longterm WHERE id = $1 AND digital_human_id = $2',
      [memoryId, dhId],
    );
  }

  // ============================================================
  //  2. 成长复盘
  // ============================================================

  /** 生成成长复盘报告 */
  async generateGrowthReview(dhId: string, userId?: string): Promise<GrowthReview> {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 收集最近对话摘要
    const memories = await this.getMemories(dhId);
    const recentMemories = memories.slice(-20); // 最近 20 条记忆

    if (recentMemories.length === 0 && IS_DEMO()) {
      // 演示模式：生成模拟复盘
      const review: GrowthReview = {
        id: `review-${++this.seq}`,
        metrics: { understanding: 0.4, wisdom: 0.3, empathy: 0.5, consistency: 0.9, overall: 0.5 },
        summary: '主人刚开始与数字人交流，正处于"初识"阶段。建议多问开放性问题，探索道德经在个人生活中的应用。',
        suggestions: [
          '尝试问"道法自然对我做决策有什么启发？"',
          '结合具体工作场景提问',
          '每日一问，保持对话节奏',
        ],
        period,
        createdAt: now.toISOString(),
      };
      const existing = this.demoReviews.get(dhId) ?? [];
      existing.push(review);
      this.demoReviews.set(dhId, existing);
      this.demoMetrics.set(dhId, review.metrics);
      return review;
    }

    // 真实模式：用 LLM 分析对话生成复盘
    if (this.llm.enabled) {
      try {
        const memoryText = recentMemories.map((m) => `[${m.type}] ${m.content}`).join('\n');
        const response = await this.llm.chat([
          {
            role: 'system',
            content: `你是《道德经》AI 数字人成长分析师。分析主人的对话记忆，从以下维度评估成长：
- 理解度：对道德经核心概念的理解深度
- 智慧度：将智慧应用于生活/工作的能力
- 共情度：情感表达与共情能力
- 一致性：价值观与行为的一致性

输出 JSON 格式：
{"metrics":{"understanding":0-1,"wisdom":0-1,"empathy":0-1,"consistency":0-1},"summary":"复盘总结（引用道德经）","suggestions":["建议1","建议2","建议3"]}`,
          },
          {
            role: 'user',
            content: `请根据以下对话记忆，生成${period}的成长复盘：\n\n${memoryText}`,
          },
        ], { model: 'heavy', temperature: 0.4, userId });

        const data = JSON.parse(response.content);
        const metrics: EvolutionMetrics = {
          ...data.metrics,
          overall: Object.values(data.metrics as Record<string, number>).reduce((a, b) => a + b, 0) / 4,
        };
        const review: GrowthReview = {
          id: `review-${++this.seq}`,
          metrics,
          summary: data.summary,
          suggestions: data.suggestions ?? [],
          period,
          createdAt: now.toISOString(),
        };

        // 存储
        if (IS_DEMO()) {
          const existing = this.demoReviews.get(dhId) ?? [];
          existing.push(review);
          this.demoReviews.set(dhId, existing);
          this.demoMetrics.set(dhId, metrics);
        } else {
          await this.db.query(
            `INSERT INTO evolution_reports (id, digital_human_id, metrics, content, status)
             VALUES ($1, $2, $3, $4, 'pending')`,
            [review.id, dhId, JSON.stringify(metrics), review.summary],
          );
        }

        return review;
      } catch (e) {
        this.logger.warn(`复盘生成失败：${(e as Error).message}`);
      }
    }

    // fallback：基础复盘
    return this.generateFallbackReview(dhId, period, memories.length);
  }

  private generateFallbackReview(dhId: string, period: string, memoryCount: number): GrowthReview {
    const review: GrowthReview = {
      id: `review-${++this.seq}`,
      metrics: {
        understanding: Math.min(0.3 + memoryCount * 0.05, 0.8),
        wisdom: Math.min(0.2 + memoryCount * 0.04, 0.7),
        empathy: Math.min(0.4 + memoryCount * 0.03, 0.8),
        consistency: 0.85,
        overall: Math.min(0.3 + memoryCount * 0.04, 0.75),
      },
      summary: `本周期主人进行了 ${memoryCount} 次有效交流。基于《道德经》"为学日益，为道日损"的智慧，持续对话本身就是修道的过程。`,
      suggestions: ['保持每日一问的对话节奏', '尝试将道德经智慧应用到具体场景', '关注"道法自然"在决策中的启发'],
      period,
      createdAt: new Date().toISOString(),
    };
    const existing = this.demoReviews.get(dhId) ?? [];
    existing.push(review);
    this.demoReviews.set(dhId, existing);
    this.demoMetrics.set(dhId, review.metrics);
    return review;
  }

  /** 获取复盘历史 */
  async getGrowthReviews(dhId: string): Promise<GrowthReview[]> {
    if (IS_DEMO()) return this.demoReviews.get(dhId) ?? [];
    return this.db.query<GrowthReview>(
      `SELECT id, metrics, content AS summary, status, created_at AS "createdAt"
       FROM evolution_reports WHERE digital_human_id = $1
       ORDER BY created_at DESC`,
      [dhId],
    );
  }

  /** 获取当前进化指标 */
  async getEvolutionMetrics(dhId: string): Promise<EvolutionMetrics> {
    if (IS_DEMO()) return this.demoMetrics.get(dhId) ?? this.getDefaultMetrics();
    const rows = await this.db.query<{ metrics: EvolutionMetrics }>(
      `SELECT dimensions AS metrics FROM value_profile WHERE digital_human_id = $1`,
      [dhId],
    );
    return rows[0]?.metrics ?? this.getDefaultMetrics();
  }

  private getDefaultMetrics(): EvolutionMetrics {
    return { understanding: 0.2, wisdom: 0.2, empathy: 0.3, consistency: 0.8, overall: 0.3 };
  }

  // ============================================================
  //  3. 一致性审计
  // ============================================================

  /** 审计回答是否符合角色锚点 */
  async auditConsistency(
    anchorPrompt: string,
    responseText: string,
    userId?: string,
  ): Promise<AuditResult> {
    if (!this.llm.enabled) {
      return { consistent: true, score: 1.0, violations: [], suggestion: 'LLM 未启用，跳过审计' };
    }

    try {
      const response = await this.llm.chat([
        {
          role: 'system',
          content: `你是角色一致性审计师。检查数字人回答是否符合角色锚点。

角色锚点：
${anchorPrompt}

输出 JSON：{"consistent":boolean,"score":0-1,"violations":["违规点"],"suggestion":"改进建议"}`,
        },
        {
          role: 'user',
          content: `请审计以下回答：\n\n${responseText}`,
        },
      ], { model: 'light', temperature: 0.1, userId });

      const data = JSON.parse(response.content);
      return {
        consistent: data.consistent ?? true,
        score: data.score ?? 1.0,
        violations: data.violations ?? [],
        suggestion: data.suggestion,
      };
    } catch (e) {
      this.logger.warn(`审计失败：${(e as Error).message}`);
      return { consistent: true, score: 0.8, violations: [], suggestion: '审计异常，默认通过' };
    }
  }

  // ============================================================
  //  4. 进化维度度量
  // ============================================================

  /** 实时计算进化指标（基于最近对话） */
  async calculateRealtimeMetrics(dhId: string, recentConversation: string): Promise<EvolutionMetrics> {
    // 简单规则 + LLM 辅助
    const base = await this.getEvolutionMetrics(dhId);
    const memoryCount = (this.demoMemory.get(dhId) ?? []).length;

    // 基于对话内容的简单评分
    const hasQuestion = recentConversation.includes('？') || recentConversation.includes('?');
    const hasTaoConcept = /道|德|无为|自然|柔|静|朴|知足/.test(recentConversation);
    const hasApplication = /工作|管理|决策|生活|关系/.test(recentConversation);

    let understandingDelta = 0;
    let wisdomDelta = 0;
    let empathyDelta = 0;

    if (hasTaoConcept) understandingDelta += 0.02;
    if (hasApplication) wisdomDelta += 0.03;
    if (hasQuestion) empathyDelta += 0.01;

    const metrics: EvolutionMetrics = {
      understanding: Math.min(base.understanding + understandingDelta, 1),
      wisdom: Math.min(base.wisdom + wisdomDelta, 1),
      empathy: Math.min(base.empathy + empathyDelta, 1),
      consistency: base.consistency, // 一致性由审计决定
      overall: 0,
    };
    metrics.overall = Object.values(metrics).reduce((a, b) => a + b, 0) / 4;

    // 存储最新指标
    if (IS_DEMO()) {
      this.demoMetrics.set(dhId, metrics);
    } else {
      await this.db.query(
        `INSERT INTO value_profile (digital_human_id, dimensions) VALUES ($1, $2)
         ON CONFLICT (digital_human_id) DO UPDATE SET dimensions = $2`,
        [dhId, JSON.stringify(metrics)],
      );
    }

    return metrics;
  }
}
