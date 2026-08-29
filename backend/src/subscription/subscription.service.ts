import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { IS_DEMO } from '../common';
import { PLANS, PLAN_FEATURES, PlanDef } from './subscription.data';

/** 管理端套餐编辑入参 */
export interface PlanInput {
  code: string;
  tier: 'free' | 'pro' | 'enterprise';
  name: string;
  priceMonthly?: number;
  priceYearly?: number;
  tagline?: string;
  benefits?: string[];
  limits?: string[];
}

@Injectable()
export class SubscriptionService {
  // 演示模式：内存套餐（初始为内置三级套餐，可经管理端修改）
  private demoPlans: PlanDef[] = JSON.parse(JSON.stringify(PLANS));

  constructor(private readonly db: DatabaseService) {}

  /** 三级产品计划：优先数据库配置，为空时回退内置套餐 */
  async plans(): Promise<PlanDef[]> {
    if (IS_DEMO() || !this.db.isAvailable) {
      return [...this.demoPlans];
    }
    try {
      const rows = await this.db.query<PlanDef>(
        `SELECT code, tier, name, price_monthly AS "priceMonthly", price_yearly AS "priceYearly",
                benefits, '{}'::jsonb AS limits
         FROM subscription_plans WHERE status = 'published' ORDER BY
           CASE tier WHEN 'free' THEN 0 WHEN 'pro' THEN 1 ELSE 2 END`,
      );
      if (rows.length > 0) {
        return rows.map((r) => ({
          code: r.code,
          tier: r.tier,
          name: r.name,
          priceMonthly: Number(r.priceMonthly),
          priceYearly: Number(r.priceYearly),
          tagline: '',
          benefits: (r.benefits as unknown as string[]) ?? [],
          limits: [],
        }));
      }
    } catch {
      // 表未迁移等情况：回退内置套餐
    }
    return [...PLANS];
  }

  /** 模拟购买：演示模式直接成功，完整模式写订单表并更新用户归属 */
  async purchase(userId: string, planCode: string) {
    const plans = await this.plans();
    const plan = plans.find((p) => p.code === planCode) ?? PLANS.find((p) => p.code === planCode);
    if (!plan) throw new NotFoundException(`未知计划：${planCode}`);
    if (plan.tier === 'free') {
      return { order: null, plan, note: '体验版无需购买，默认开通。' };
    }
    if (IS_DEMO()) {
      return {
        order: {
          id: `demo-order-${Date.now()}`,
          planCode,
          amount: plan.priceYearly,
          currency: 'CNY',
          status: 'paid',
          period: 'yearly',
          paidAt: new Date().toISOString(),
        },
        plan,
        note: '演示模式：支付链路已模拟通过（生产环境接入微信支付）。',
      };
    }
    const rows = await this.db.query<Record<string, unknown>>(
      `INSERT INTO subscription_orders (user_id, plan_code, amount, period)
       VALUES ($1, $2, $3, 'yearly')
       RETURNING id, plan_code AS "planCode", amount, status, created_at AS "paidAt"`,
      [userId, planCode, plan.priceYearly],
    );
    return { order: rows[0], plan, note: '订单已生成，支付回调后自动开通权益。' };
  }

  /** 我的订阅与权益 */
  async my(userId: string) {
    if (IS_DEMO()) {
      return {
        userId,
        currentPlan: this.demoPlans[0] ?? PLANS[0],
        features: PLAN_FEATURES.pro, // 演示默认已开通 Pro 权益，便于体验完整能力
        expiresAt: null,
        note: '演示模式默认开通 Pro 权益；接入支付后以订单为准。',
      };
    }
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT plan_code AS "planCode", status, created_at AS "paidAt"
       FROM subscription_orders WHERE user_id = $1 AND status = 'paid'
       ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
    const planCode = (rows[0]?.planCode as string) ?? 'free';
    const plan = (await this.plans()).find((p) => p.code === planCode) ?? PLANS[0];
    return {
      userId,
      currentPlan: plan,
      features: PLAN_FEATURES[planCode] ?? PLAN_FEATURES.free,
      expiresAt: rows[0]?.paidAt ?? null,
    };
  }

  // ============================================================
  //  管理端：套餐 CRUD（V2.3，参考 galaxyopc 套餐管理）
  // ============================================================

  /** 管理端列表（含未发布，附内置权益开关） */
  async adminPlans() {
    if (IS_DEMO() || !this.db.isAvailable) {
      return [...this.demoPlans];
    }
    const rows = await this.db.query<PlanDef>(
      `SELECT code, tier, name, price_monthly AS "priceMonthly", price_yearly AS "priceYearly",
              benefits, status
       FROM subscription_plans ORDER BY
         CASE tier WHEN 'free' THEN 0 WHEN 'pro' THEN 1 ELSE 2 END`,
    );
    return rows.map((r) => ({
      code: r.code,
      tier: r.tier,
      name: r.name,
      priceMonthly: Number(r.priceMonthly),
      priceYearly: Number(r.priceYearly),
      tagline: '',
      benefits: (r.benefits as unknown as string[]) ?? [],
      limits: [],
    }));
  }

  /** 新增/覆盖套餐（按 code upsert） */
  async upsertPlan(input: PlanInput): Promise<PlanDef> {
    if (!input?.code || !input?.name || !input?.tier) {
      throw new BadRequestException('套餐标识、名称、档位不能为空');
    }
    if (!['free', 'pro', 'enterprise'].includes(input.tier)) {
      throw new BadRequestException('档位必须为 free / pro / enterprise');
    }
    const plan: PlanDef = {
      code: input.code,
      tier: input.tier,
      name: input.name,
      priceMonthly: input.priceMonthly ?? 0,
      priceYearly: input.priceYearly ?? (input.priceMonthly ?? 0) * 10,
      tagline: input.tagline ?? '',
      benefits: input.benefits ?? [],
      limits: input.limits ?? [],
    };

    if (IS_DEMO() || !this.db.isAvailable) {
      const idx = this.demoPlans.findIndex((p) => p.code === plan.code);
      if (idx >= 0) this.demoPlans[idx] = plan;
      else this.demoPlans.push(plan);
      return plan;
    }
    await this.db.query(
      `INSERT INTO subscription_plans (code, tier, name, price_monthly, price_yearly, benefits)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       ON CONFLICT (code) DO UPDATE SET
         tier = $2, name = $3, price_monthly = $4, price_yearly = $5,
         benefits = $6::jsonb, updated_at = now()`,
      [plan.code, plan.tier, plan.name, plan.priceMonthly, plan.priceYearly, JSON.stringify(plan.benefits)],
    );
    return plan;
  }

  /** 删除套餐（内置三级套餐不可删，避免订单外键悬空） */
  async deletePlan(code: string) {
    if (['free', 'pro', 'enterprise'].includes(code)) {
      throw new BadRequestException('内置三级套餐不可删除，可编辑价格与权益');
    }
    if (IS_DEMO() || !this.db.isAvailable) {
      this.demoPlans = this.demoPlans.filter((p) => p.code !== code);
      return;
    }
    await this.db.query('DELETE FROM subscription_plans WHERE code = $1', [code]);
  }
}
