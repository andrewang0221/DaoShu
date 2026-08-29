/**
 * 大模型配置服务（V2.3）
 *
 * 参考 galaxyopc 的 model-config 范式：
 * 1. 管理员在后台配置大模型（OpenAI 兼容：Base URL + API Key + 模型名 + 用途分级 + 最低套餐）
 * 2. 用户可配置自定义大模型 API，启用后对话/数字人/论坛等功能优先走用户自己的 Key
 * 3. 对话、数字人、求道、论道等功能统一经 LLMService 从此处解析模型配置
 *
 * 双轨存储：DEMO 模式用内存（重启清零），完整模式走 PostgreSQL model_configs / user_llm_settings
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { IS_DEMO } from '../common';

// ---------- 类型 ----------

export type ModelRole = 'light' | 'heavy' | 'embed';
export type PlanTier = 'free' | 'pro' | 'enterprise';

export interface ModelConfig {
  id: string;
  modelKey: string;
  displayName: string;
  provider: string;
  apiBaseUrl: string;
  apiKey: string;
  modelName: string;
  modelRole: ModelRole;
  minTier: PlanTier;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  sortOrder: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserLLMSettings {
  userId: string;
  provider: string;
  apiBaseUrl: string;
  apiKey: string;
  modelName: string;
  enabled: boolean;
  updatedAt: string;
}

/** 保存/编辑模型的入参（apiKey 可选：编辑时缺省表示沿用原 Key） */
export interface ModelConfigInput {
  modelKey: string;
  displayName: string;
  provider?: string;
  apiBaseUrl: string;
  apiKey?: string;
  modelName: string;
  modelRole?: ModelRole;
  minTier?: PlanTier;
  temperature?: number;
  maxTokens?: number;
  enabled?: boolean;
  sortOrder?: number;
  description?: string;
}

/** 用户保存自定义设置的入参 */
export interface UserSettingsInput {
  provider?: string;
  apiBaseUrl: string;
  apiKey?: string; // 缺省表示沿用已保存的 Key
  modelName: string;
  enabled?: boolean;
}

/** 运行时解析出的可用配置（LLM 调用四要素） */
export interface RuntimeLLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  source: 'user' | 'system' | 'env';
  displayName?: string;
}

const TIER_RANK: Record<PlanTier, number> = { free: 0, pro: 1, enterprise: 2 };

function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 10) return `${key.slice(0, 2)}****`;
  return `${key.slice(0, 6)}****${key.slice(-4)}`;
}

@Injectable()
export class LLMConfigService implements OnModuleInit {
  private readonly logger = new Logger(LLMConfigService.name);

  // 演示模式：内存存储
  private readonly demoModels: ModelConfig[] = [];
  private readonly demoUserSettings = new Map<string, UserLLMSettings>();
  private demoSeq = 0;

  // 系统模型缓存（完整模式下启动时加载 + 管理员变更时刷新）
  private enabledModelsCache: ModelConfig[] = [];
  private anyUserConfig = false; // 是否存在配置齐全的用户自定义设置

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit(): Promise<void> {
    if (IS_DEMO() || !this.db.isAvailable) return;
    try {
      await this.refreshCache();
    } catch (e) {
      this.logger.warn(`模型配置缓存加载失败（稍后重试）：${(e as Error).message}`);
    }
  }

  /** 重新加载系统模型缓存与用户配置标志 */
  async refreshCache(): Promise<void> {
    if (IS_DEMO() || !this.db.isAvailable) {
      // DEMO 模式：缓存即内存数据
      return;
    }
    this.enabledModelsCache = (await this.listModels()).filter((m) => m.enabled && m.apiKey);
    const rows = await this.db.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM user_llm_settings
         WHERE api_key <> '' AND api_base_url <> '' AND model_name <> ''
       ) AS exists`,
    );
    this.anyUserConfig = rows[0]?.exists ?? false;
  }

  // ============================================================
  //  管理端：系统模型 CRUD
  // ============================================================

  /** 全部模型配置（管理端，含 Key） */
  async listModels(): Promise<ModelConfig[]> {
    if (IS_DEMO() || !this.db.isAvailable) {
      return [...this.demoModels].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT id, model_key AS "modelKey", display_name AS "displayName", provider,
              api_base_url AS "apiBaseUrl", api_key AS "apiKey", model_name AS "modelName",
              model_role AS "modelRole", min_tier AS "minTier", temperature, max_tokens AS "maxTokens",
              enabled, sort_order AS "sortOrder", description,
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM model_configs ORDER BY sort_order, created_at`,
    );
    return rows.map((r) => this.rowToModel(r)) as ModelConfig[];
  }

  /** 启用中的模型列表（用户端，脱敏不含 Key） */
  async listEnabledModels() {
    const models = (await this.listModels()).filter((m) => m.enabled);
    return models.map((m) => ({
      id: m.id,
      modelKey: m.modelKey,
      displayName: m.displayName,
      provider: m.provider,
      modelRole: m.modelRole,
      minTier: m.minTier,
      temperature: m.temperature,
      maxTokens: m.maxTokens,
      description: m.description,
      apiKeyMasked: maskKey(m.apiKey),
    }));
  }

  /** 新增/编辑模型（id 缺省为新增；apiKey 缺省沿用原值） */
  async upsertModel(input: ModelConfigInput, id?: string): Promise<ModelConfig> {
    const role: ModelRole = input.modelRole ?? 'light';
    const tier: PlanTier = input.minTier ?? 'free';
    const now = new Date().toISOString();
    // 空字符串 Key 视为未提供：新增时报错，编辑时沿用原值
    const apiKey = input.apiKey?.trim() ? input.apiKey.trim() : undefined;

    if (IS_DEMO() || !this.db.isAvailable) {
      let model = id ? this.demoModels.find((m) => m.id === id) : undefined;
      if (id && !model) throw new Error('模型配置不存在');
      if (!model) {
        if (this.demoModels.some((m) => m.modelKey === input.modelKey)) {
          throw new Error(`模型标识已存在：${input.modelKey}`);
        }
        model = {
          id: `demo-mc-${++this.demoSeq}`,
          modelKey: input.modelKey,
          displayName: input.displayName,
          provider: input.provider ?? 'openai_compatible',
          apiBaseUrl: input.apiBaseUrl,
          apiKey: apiKey ?? '',
          modelName: input.modelName,
          modelRole: role,
          minTier: tier,
          temperature: input.temperature ?? 0.7,
          maxTokens: input.maxTokens ?? 2000,
          enabled: input.enabled ?? true,
          sortOrder: input.sortOrder ?? 0,
          description: input.description ?? '',
          createdAt: now,
          updatedAt: now,
        };
        this.demoModels.push(model);
      } else {
        Object.assign(model, {
          modelKey: input.modelKey,
          displayName: input.displayName,
          provider: input.provider ?? model.provider,
          apiBaseUrl: input.apiBaseUrl,
          apiKey: apiKey ?? model.apiKey,
          modelName: input.modelName,
          modelRole: role,
          minTier: tier,
          temperature: input.temperature ?? model.temperature,
          maxTokens: input.maxTokens ?? model.maxTokens,
          enabled: input.enabled ?? model.enabled,
          sortOrder: input.sortOrder ?? model.sortOrder,
          description: input.description ?? model.description,
          updatedAt: now,
        });
      }
      return model;
    }

    const rows = await this.db.query<Record<string, unknown>>(
      id
        ? `UPDATE model_configs SET
             model_key = $2, display_name = $3, provider = $4, api_base_url = $5,
             api_key = COALESCE($6, api_key), model_name = $7, model_role = $8,
             min_tier = $9, temperature = $10, max_tokens = $11, enabled = $12,
             sort_order = $13, description = $14, updated_at = now()
           WHERE id = $1
           RETURNING id, model_key AS "modelKey", display_name AS "displayName", provider,
                     api_base_url AS "apiBaseUrl", api_key AS "apiKey", model_name AS "modelName",
                     model_role AS "modelRole", min_tier AS "minTier", temperature, max_tokens AS "maxTokens",
                     enabled, sort_order AS "sortOrder", description,
                     created_at AS "createdAt", updated_at AS "updatedAt"`
        : `INSERT INTO model_configs (
             model_key, display_name, provider, api_base_url, api_key, model_name,
             model_role, min_tier, temperature, max_tokens, enabled, sort_order, description
           ) VALUES ($2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           RETURNING id, model_key AS "modelKey", display_name AS "displayName", provider,
                     api_base_url AS "apiBaseUrl", api_key AS "apiKey", model_name AS "modelName",
                     model_role AS "modelRole", min_tier AS "minTier", temperature, max_tokens AS "maxTokens",
                     enabled, sort_order AS "sortOrder", description,
                     created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        id ?? null,
        input.modelKey,
        input.displayName,
        input.provider ?? 'openai_compatible',
        input.apiBaseUrl.replace(/\/$/, ''),
        apiKey ?? null,
        input.modelName,
        role,
        tier,
        input.temperature ?? 0.7,
        input.maxTokens ?? 2000,
        input.enabled ?? true,
        input.sortOrder ?? 0,
        input.description ?? '',
      ],
    );
    if (rows.length === 0) throw new Error('模型配置不存在');
    await this.refreshCache();
    return this.rowToModel(rows[0]) as ModelConfig;
  }

  /** 删除模型 */
  async deleteModel(id: string): Promise<void> {
    if (IS_DEMO() || !this.db.isAvailable) {
      const idx = this.demoModels.findIndex((m) => m.id === id);
      if (idx === -1) throw new Error('模型配置不存在');
      this.demoModels.splice(idx, 1);
      return;
    }
    const rows = await this.db.query('DELETE FROM model_configs WHERE id = $1 RETURNING id', [id]);
    if (rows.length === 0) throw new Error('模型配置不存在');
    await this.refreshCache();
  }

  // ============================================================
  //  用户端：自定义大模型 API
  // ============================================================

  /** 用户自定义设置（Key 脱敏） */
  async getUserSettings(userId: string) {
    const s = await this.getRawUserSettings(userId);
    if (!s) {
      return { userId, provider: 'custom', apiBaseUrl: '', apiKeyMasked: '', modelName: '', enabled: false, configured: false };
    }
    return {
      userId,
      provider: s.provider,
      apiBaseUrl: s.apiBaseUrl,
      apiKeyMasked: maskKey(s.apiKey),
      modelName: s.modelName,
      enabled: s.enabled,
      configured: !!(s.apiKey && s.apiBaseUrl && s.modelName),
    };
  }

  /** 保存用户自定义设置（apiKey 缺省/为空沿用原值） */
  async saveUserSettings(userId: string, input: UserSettingsInput): Promise<void> {
    const now = new Date().toISOString();
    if (!/^https?:\/\//.test(input.apiBaseUrl)) {
      throw new Error('Base URL 必须以 http:// 或 https:// 开头');
    }
    const apiKey = input.apiKey?.trim() ? input.apiKey.trim() : undefined;
    if (IS_DEMO() || !this.db.isAvailable) {
      const existing = this.demoUserSettings.get(userId);
      const merged: UserLLMSettings = {
        userId,
        provider: input.provider ?? existing?.provider ?? 'custom',
        apiBaseUrl: input.apiBaseUrl.replace(/\/$/, ''),
        apiKey: apiKey ?? existing?.apiKey ?? '',
        modelName: input.modelName,
        enabled: input.enabled ?? existing?.enabled ?? false,
        updatedAt: now,
      };
      if (!merged.apiKey) throw new Error('请填写 API Key');
      this.demoUserSettings.set(userId, merged);
      return;
    }
    await this.db.query(
      `INSERT INTO user_llm_settings (user_id, provider, api_base_url, api_key, model_name, enabled)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         provider = $2, api_base_url = $3,
         api_key = COALESCE($4, user_llm_settings.api_key),
         model_name = $5, enabled = $6, updated_at = now()`,
      [
        userId,
        input.provider ?? 'custom',
        input.apiBaseUrl.replace(/\/$/, ''),
        apiKey ?? null,
        input.modelName,
        input.enabled ?? false,
      ],
    );
    if (apiKey || (await this.hasCompleteUserConfig(userId))) this.anyUserConfig = true;
  }

  /** 用户运行时配置（启用且配置齐全时返回，供 LLM 调用） */
  async getUserRuntimeConfig(userId: string): Promise<RuntimeLLMConfig | null> {
    const s = await this.getRawUserSettings(userId);
    if (!s || !s.enabled || !s.apiKey || !s.apiBaseUrl || !s.modelName) return null;
    return {
      baseUrl: s.apiBaseUrl,
      apiKey: s.apiKey,
      model: s.modelName,
      source: 'user',
      displayName: s.provider,
    };
  }

  /** 缓存标志：是否存在任何可用的用户自定义配置 */
  hasAnyUserConfig(): boolean {
    if (IS_DEMO() || !this.db.isAvailable) {
      for (const s of this.demoUserSettings.values()) {
        if (s.apiKey && s.apiBaseUrl && s.modelName) return true;
      }
      return false;
    }
    return this.anyUserConfig;
  }

  // ============================================================
  //  运行时解析：系统模型（供 LLMService 调用）
  // ============================================================

  /** 是否存在可用的系统对话模型（enabled + 有 Key） */
  hasAnyChatModel(): boolean {
    const models = IS_DEMO() || !this.db.isAvailable ? this.demoModels : this.enabledModelsCache;
    return models.some((m) => m.enabled && m.apiKey && m.modelRole !== 'embed');
  }

  /**
   * 取某用途（light/heavy/embed）的系统模型运行时配置
   * - 过滤：enabled + 有 Key + 用户套餐达到 minTier（tier 缺省视为不限制）
   * - heavy 无匹配时回退 light，light 无匹配时回退 heavy；embed 不回退
   */
  async getSystemRuntimeConfig(
    role: ModelRole,
    tier?: PlanTier,
  ): Promise<RuntimeLLMConfig | null> {
    const models = (await this.listModels()).filter((m) => m.enabled && m.apiKey);
    const pick = (r: ModelRole) =>
      models
        .filter((m) => m.modelRole === r && (tier === undefined || TIER_RANK[tier] >= TIER_RANK[m.minTier]))
        .sort((a, b) => a.sortOrder - b.sortOrder)[0];

    const model = pick(role) ?? (role === 'heavy' ? pick('light') : role === 'light' ? pick('heavy') : undefined);
    if (!model) return null;
    return {
      baseUrl: model.apiBaseUrl,
      apiKey: model.apiKey,
      model: model.modelName,
      temperature: model.temperature,
      maxTokens: model.maxTokens,
      source: 'system',
      displayName: model.displayName,
    };
  }

  /** 用户当前套餐 tier（依据最近一笔已支付订单；DEMO 默认 pro） */
  async getUserTier(userId: string): Promise<PlanTier> {
    if (IS_DEMO() || !this.db.isAvailable) return 'pro';
    try {
      const rows = await this.db.query<{ tier: PlanTier }>(
        `SELECT p.tier FROM subscription_orders o
         JOIN subscription_plans p ON p.code = o.plan_code
         WHERE o.user_id = $1 AND o.status = 'paid'
         ORDER BY o.paid_at DESC NULLS LAST, o.created_at DESC LIMIT 1`,
        [userId],
      );
      return rows[0]?.tier ?? 'free';
    } catch {
      return 'free';
    }
  }

  // ============================================================
  //  连通性测试
  // ============================================================

  /** 测试 OpenAI 兼容接口连通性：先探 /models，失败再发一条最小 chat 请求 */
  static async testConnection(baseUrl: string, apiKey: string, modelName?: string): Promise<{ ok: boolean; message: string }> {
    if (!/^https?:\/\//.test(baseUrl)) return { ok: false, message: 'Base URL 必须以 http:// 或 https:// 开头' };
    if (!apiKey) return { ok: false, message: 'API Key 不能为空' };
    const base = baseUrl.replace(/\/$/, '');

    try {
      const resp = await fetch(`${base}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      });
      if (resp.ok) return { ok: true, message: '连接成功：接口鉴权通过' };
      if (resp.status !== 404 && resp.status !== 405) {
        return { ok: false, message: `鉴权失败（${resp.status}）：${(await resp.text()).slice(0, 200)}` };
      }
    } catch (e) {
      // 网络异常直接返回
      if ((e as Error).name === 'TimeoutError') return { ok: false, message: '连接超时（10 秒），请检查 Base URL' };
    }

    // /models 不可用 → 发一条最小对话请求验证
    try {
      const resp = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: modelName || 'ping',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (resp.ok) return { ok: true, message: '连接成功：对话接口可用' };
      const err = (await resp.text()).slice(0, 200);
      return { ok: false, message: `对话接口返回 ${resp.status}：${err}` };
    } catch (e) {
      return { ok: false, message: `连接失败：${(e as Error).message}` };
    }
  }

  // ---------- 内部 ----------

  private async getRawUserSettings(userId: string): Promise<UserLLMSettings | null> {
    if (IS_DEMO() || !this.db.isAvailable) {
      return this.demoUserSettings.get(userId) ?? null;
    }
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT user_id AS "userId", provider, api_base_url AS "apiBaseUrl", api_key AS "apiKey",
              model_name AS "modelName", enabled, updated_at AS "updatedAt"
       FROM user_llm_settings WHERE user_id = $1`,
      [userId],
    );
    return (rows[0] as unknown as UserLLMSettings) ?? null;
  }

  private async hasCompleteUserConfig(userId: string): Promise<boolean> {
    const s = await this.getRawUserSettings(userId);
    return !!(s && s.apiKey && s.apiBaseUrl && s.modelName);
  }

  private rowToModel(r: Record<string, unknown>): ModelConfig {
    return {
      id: r.id as string,
      modelKey: r.modelKey as string,
      displayName: r.displayName as string,
      provider: r.provider as string,
      apiBaseUrl: r.apiBaseUrl as string,
      apiKey: r.apiKey as string,
      modelName: r.modelName as string,
      modelRole: r.modelRole as ModelRole,
      minTier: r.minTier as PlanTier,
      temperature: Number(r.temperature ?? 0.7),
      maxTokens: Number(r.maxTokens ?? 2000),
      enabled: Boolean(r.enabled),
      sortOrder: Number(r.sortOrder ?? 0),
      description: (r.description as string) ?? '',
      createdAt: r.createdAt as string,
      updatedAt: r.updatedAt as string,
    };
  }
}
