/**
 * LLM 大模型服务 - OpenAI 兼容接口
 * 
 * 功能：
 * 1. 支持 DeepSeek / 通义千问 / 豆包等 OpenAI 兼容接口
 * 2. 流式输出（SSE）
 * 3. 模型分级路由（轻量问答/深度研学/进化分析）
 * 4. Token 计数与成本控制
 * 5. 对话上下文管理
 */

import { Injectable, Logger } from '@nestjs/common';
import { LLMConfigService, RuntimeLLMConfig } from './llm-config.service';

// ---------- 配置 ----------
export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  modelLight: string;    // 轻量模型（问答）
  modelHeavy: string;    // 重型模型（研学/复盘）
  modelEmbed: string;    // Embedding 模型
  maxTokens: number;
  temperature: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

export interface LLMStreamChunk {
  content: string;
  done: boolean;
  usage?: LLMResponse['usage'];
}

// ---------- Token 计数（简易版）----------
function estimateTokens(text: string): number {
  // 中文约 1.5 token/字，英文约 0.75 token/word
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars * 1.5 + otherChars * 0.4);
}

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private config: LLMConfig | null = null;
  private totalTokensUsed = 0;
  private readonly DAILY_LIMIT = 100000; // 每日 token 上限

  constructor(private readonly configService: LLMConfigService) {
    this.loadConfig();
  }

  /** 从环境变量加载配置（作为后台配置缺失时的兜底） */
  private loadConfig(): void {
    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) {
      this.logger.log('环境变量 LLM_API_KEY 未配置，将以管理后台模型配置为准');
      return;
    }

    this.config = {
      apiKey,
      baseUrl: (process.env.LLM_BASE_URL ?? 'https://api.deepseek.com/v1').replace(/\/$/, ''),
      modelLight: process.env.LLM_MODEL_LIGHT ?? 'deepseek-chat',
      modelHeavy: process.env.LLM_MODEL_HEAVY ?? 'deepseek-reasoner',
      modelEmbed: process.env.LLM_MODEL_EMBED ?? 'text-embedding-ada-002',
      maxTokens: 2000,
      temperature: 0.7,
    };
    this.logger.log(`LLM 环境变量兜底配置：${this.config.baseUrl} / ${this.config.modelLight}`);
  }

  /** 是否可用：环境变量 / 管理后台模型配置 / 用户自定义配置 任一存在即可 */
  get enabled(): boolean {
    return (
      !!this.config?.apiKey ||
      this.configService.hasAnyChatModel() ||
      this.configService.hasAnyUserConfig()
    );
  }

  /**
   * 运行时模型解析（参考 galaxyopc 五级解析，简化为三级）：
   * 1. 用户自定义模型（启用且配置齐全）→ 用户自己的 Key
   * 2. 管理后台系统模型（按用途 light/heavy + 套餐过滤）
   * 3. 环境变量兜底
   */
  private async resolveRuntimeConfig(
    userId: string | undefined,
    role: 'light' | 'heavy',
  ): Promise<RuntimeLLMConfig | null> {
    if (userId) {
      try {
        const userCfg = await this.configService.getUserRuntimeConfig(userId);
        if (userCfg) return userCfg;
      } catch (e) {
        this.logger.warn(`用户自定义模型解析失败：${(e as Error).message}`);
      }
    }
    try {
      const tier = userId ? await this.configService.getUserTier(userId) : undefined;
      const sysCfg = await this.configService.getSystemRuntimeConfig(role, tier);
      if (sysCfg) return sysCfg;
    } catch (e) {
      this.logger.warn(`系统模型配置解析失败：${(e as Error).message}`);
    }
    if (this.config?.apiKey) {
      return {
        baseUrl: this.config.baseUrl,
        apiKey: this.config.apiKey,
        model: role === 'heavy' ? this.config.modelHeavy : this.config.modelLight,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        source: 'env',
      };
    }
    return null;
  }

  /** Token 使用统计 */
  get usageStats() {
    return { total: this.totalTokensUsed, dailyLimit: this.DAILY_LIMIT };
  }

  // ---------- 对话补全（同步）----------

  /** 完整对话补全（非流式） */
  async chat(
    messages: ChatMessage[],
    options?: {
      model?: 'light' | 'heavy';
      temperature?: number;
      maxTokens?: number;
      userId?: string; // 传入后按「用户自定义 > 系统配置 > 环境变量」解析模型
    },
  ): Promise<LLMResponse> {
    if (this.totalTokensUsed >= this.DAILY_LIMIT) throw new Error('已达每日 Token 上限');

    const role = options?.model ?? 'light';
    const cfg = await this.resolveRuntimeConfig(options?.userId, role);
    if (!cfg) throw new Error('LLM 未配置（可在管理后台配置模型，或由用户在「我的-大模型设置」配置自有 API）');

    try {
      // 单次调用 90 秒超时保护：超时抛错，避免客户端长时间挂起后静默消耗调用配额
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 90_000);
      let resp: Response;
      try {
        resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cfg.apiKey}`,
          },
          body: JSON.stringify({
            model: cfg.model,
            messages,
            temperature: options?.temperature ?? cfg.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? cfg.maxTokens ?? 2000,
            stream: false,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (!resp.ok) {
        const err = await resp.text();
        this.logger.error(`LLM API 错误 ${resp.status}: ${err}`);
        throw new Error(`LLM 调用失败：${resp.status}`);
      }

      const data = (await resp.json()) as {
        choices: { message?: { content?: string } }[];
        model: string;
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      };

      const content = data.choices?.[0]?.message?.content?.trim() ?? '';
      const usage = {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      };
      this.totalTokensUsed += usage.totalTokens;

      return {
        content,
        model: data.model ?? cfg.model,
        usage,
        finishReason: 'stop',
      };
    } catch (e) {
      const err = e as Error;
      if (err.name === 'AbortError') {
        this.logger.error(`LLM 调用超时 90s（${cfg.source}/${cfg.model}）`);
        throw new Error('LLM 响应超时（90 秒），请稍后重试');
      }
      this.logger.error(`LLM 调用异常（${cfg.source}/${cfg.model}）：${err.message}`);
      throw e;
    }
  }

  // ---------- 视觉理解（多模态：文本 + 图片）----------

  /**
   * 视觉对话补全：传入提示词与图片（data URL 或公网 URL），
   * 面向支持 image_url 多模态输入的 OpenAI 兼容模型（如 MiMo-VL / qwen-vl 等）。
   * 模型不支持图片输入时抛错，由调用方兜底。
   */
  async chatVision(
    prompt: string,
    imageUrl: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      userId?: string;
    },
  ): Promise<LLMResponse> {
    if (this.totalTokensUsed >= this.DAILY_LIMIT) throw new Error('已达每日 Token 上限');

    const cfg = await this.resolveRuntimeConfig(options?.userId, 'light');
    if (!cfg) throw new Error('LLM 未配置');

    const messages = [
      {
        role: 'user' as const,
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ];

    try {
      const resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          messages,
          temperature: options?.temperature ?? cfg.temperature ?? 0.3,
          max_tokens: options?.maxTokens ?? cfg.maxTokens ?? 1000,
          stream: false,
        }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        this.logger.error(`LLM 视觉调用错误 ${resp.status}: ${err}`);
        throw new Error(`LLM 视觉调用失败：${resp.status}`);
      }

      const data = (await resp.json()) as {
        choices: { message?: { content?: string } }[];
        model: string;
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      };

      const content = data.choices?.[0]?.message?.content?.trim() ?? '';
      const usage = {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      };
      this.totalTokensUsed += usage.totalTokens;

      return {
        content,
        model: data.model ?? cfg.model,
        usage,
        finishReason: 'stop',
      };
    } catch (e) {
      this.logger.error(`LLM 视觉调用异常（${cfg.source}/${cfg.model}）：${(e as Error).message}`);
      throw e;
    }
  }

  // ---------- 对话补全（流式）----------

  /** 流式对话补全，通过 callback 返回 chunks */
  async chatStream(
    messages: ChatMessage[],
    onChunk: (chunk: LLMStreamChunk) => void,
    options?: {
      model?: 'light' | 'heavy';
      temperature?: number;
      maxTokens?: number;
      userId?: string;
    },
  ): Promise<LLMResponse> {
    if (this.totalTokensUsed >= this.DAILY_LIMIT) throw new Error('已达每日 Token 上限');

    const role = options?.model ?? 'light';
    const cfg = await this.resolveRuntimeConfig(options?.userId, role);
    if (!cfg) throw new Error('LLM 未配置');
    let fullContent = '';

    try {
      const resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          messages,
          temperature: options?.temperature ?? cfg.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? cfg.maxTokens ?? 2000,
          stream: true,
        }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`LLM 流式调用失败：${resp.status} ${err}`);
      }

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              onChunk({ content: '', done: true });
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content ?? '';
              if (delta) {
                fullContent += delta;
                onChunk({ content: delta, done: false });
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      // 估算 token（流式模式通常不返回精确 usage）
      const usage = {
        promptTokens: estimateTokens(messages.map((m) => m.content).join('')),
        completionTokens: estimateTokens(fullContent),
        totalTokens: 0,
      };
      usage.totalTokens = usage.promptTokens + usage.completionTokens;
      this.totalTokensUsed += usage.totalTokens;

      return {
        content: fullContent,
        model: cfg.model,
        usage,
        finishReason: 'stop',
      };
    } catch (e) {
      this.logger.error(`LLM 流式调用异常：${(e as Error).message}`);
      throw e;
    }
  }

  // ---------- Embedding ----------

  /** 生成文本向量（用于记忆向量化；仅走系统 embed 模型或环境变量，不使用用户自定义配置） */
  async embed(text: string): Promise<number[]> {
    let baseUrl = this.config?.baseUrl;
    let apiKey = this.config?.apiKey;
    let model = this.config?.modelEmbed;

    try {
      const sysCfg = await this.configService.getSystemRuntimeConfig('embed');
      if (sysCfg) {
        baseUrl = sysCfg.baseUrl;
        apiKey = sysCfg.apiKey;
        model = sysCfg.model;
      }
    } catch {
      // 保持环境变量兜底
    }
    if (!baseUrl || !apiKey || !model) {
      throw new Error('LLM 未配置（embedding 需在管理后台配置 embed 模型或设置环境变量）');
    }

    try {
      const resp = await fetch(`${baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: text.slice(0, 8000), // 截断防止超长
        }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Embedding API 错误 ${resp.status}: ${err}`);
      }

      const data = (await resp.json()) as {
        data: { embedding: number[] }[];
      };

      return data.data?.[0]?.embedding ?? [];
    } catch (e) {
      this.logger.error(`Embedding 调用异常：${(e as Error).message}`);
      throw e;
    }
  }

  // ---------- 预设对话模板 ----------

  /** 构建问答对话上下文 */
  buildQAContext(
    systemPrompt: string,
    knowledgeContext: string,
    question: string,
  ): ChatMessage[] {
    return [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `【知识库上下文】\n${knowledgeContext}\n\n【主人的问题】\n${question}`,
      },
    ];
  }

  /** 构建成长复盘对话 */
  buildReviewContext(
    anchorPrompt: string,
    conversationHistory: string,
    dimensions: string[],
  ): ChatMessage[] {
    return [
      {
        role: 'system',
        content: `${anchorPrompt}\n\n你是成长复盘分析师，需要分析主人与数字人的对话，从以下维度评估主人的成长：${dimensions.join('、')}。请以JSON格式输出评分和具体观察。`,
      },
      {
        role: 'user',
        content: `请分析以下对话，输出复盘报告（JSON格式）：\n\n${conversationHistory}`,
      },
    ];
  }

  /** 构建一致性审计对话 */
  buildAuditContext(
    anchorPrompt: string,
    responseToAudit: string,
  ): ChatMessage[] {
    return [
      {
        role: 'system',
        content: `你是角色一致性审计师。以下是一个数字人的角色锚点（不可违背的原则）：\n\n${anchorPrompt}\n\n请检查以下回答是否符合角色锚点，输出审计结果（JSON格式）：{"consistent": boolean, "violations": [], "score": 0-1}`,
      },
      {
        role: 'user',
        content: `请审计以下回答：\n\n${responseToAudit}`,
      },
    ];
  }
}
