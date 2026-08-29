/** 商业闭环 — 订阅计划数据（V2.0 新增模块） */

export interface PlanDef {
  code: string;
  tier: 'free' | 'pro' | 'enterprise';
  name: string;
  priceMonthly: number; // 元/月（企业为起价）
  priceYearly: number;
  tagline: string;
  benefits: string[];
  limits: string[];
}

export const PLANS: PlanDef[] = [
  {
    code: 'free',
    tier: 'free',
    name: '体验版',
    priceMonthly: 0,
    priceYearly: 0,
    tagline: '先感受《道德经》有用，再决定是否深入',
    benefits: [
      '每日一课 + 每日箴言卡',
      '道系人格测试（16 型）',
      '每月 3 次深度问道',
      '焦虑急救基础版（5 次/月）',
      '道枢 API 开发者免费层（每日 500 次调用）',
    ],
    limits: ['自由问道受限', '无行业包', '无完整情绪疗愈'],
  },
  {
    code: 'pro',
    tier: 'pro',
    name: 'Pro 会员',
    priceMonthly: 39,
    priceYearly: 328,
    tagline: '把老子的智慧，变成每天用得上的操作系统',
    benefits: [
      '自由问道（无限次）',
      '行业包 ×3（管理/心理/处世任选）',
      '完整情绪疗愈（焦虑急救不限次 + 每周复盘）',
      '认知档案与成长时间线',
      '数字人进化加速 1.2 倍',
      '无广告 + 专属箴言风格',
    ],
    limits: ['无数字人 IP 经济参与', '无企业级部署'],
  },
  {
    code: 'enterprise',
    tier: 'enterprise',
    name: '企业道枢',
    priceMonthly: 20000,
    priceYearly: 200000,
    tagline: '让整个团队/公司的 AI 应用，带上老子的眼睛',
    benefits: [
      '道枢 Runtime 私有化注入包 + 审计 API',
      '行业 Agent 模板（管理/客服 2 选 1，可增购）',
      '对齐能力报告（月度）',
      '内部培训《无为而治》课程 1 场/年',
      '专家支持与专属客服',
      'SLA 99.9% 与租户级数据隔离',
    ],
    limits: ['定制开发另议', '共营共建模式另签'],
  },
];

/** 权益校验：planCode → 能力开关 */
export const PLAN_FEATURES: Record<string, string[]> = {
  free: ['daily', 'quiz', 'ask_3', 'sos_5', 'api_free'],
  pro: ['daily', 'quiz', 'ask_unlimited', 'sos_unlimited', 'industry_3', 'review', 'cognitive_profile', 'evolution_1_2x'],
  enterprise: ['daily', 'quiz', 'ask_unlimited', 'sos_unlimited', 'industry_all', 'review', 'cognitive_profile', 'evolution_1_2x', 'runtime_api', 'audit_api', 'training', 'data_isolated'],
};