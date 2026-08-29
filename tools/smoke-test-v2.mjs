#!/usr/bin/env node
/**
 * V2.0 增量模块冒烟测试：道枢思维底座 / 疗愈引擎 / 增长引擎 / 行业 Agent 矩阵 / 订阅闭环
 * 前提：backend 已启动（npm run start:dev），默认 http://localhost:3081/api/v1
 * 用法：node tools/smoke-test-v2.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? 'http://localhost:3081/api/v1';
let passed = 0;
let failed = 0;

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function check(name, cond, detail = '') {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name} ${detail}`);
  }
}

console.log(`V2.0 冒烟测试开始 → ${BASE}\n`);

// ========== 1. 道枢思维底座（Agent 对齐注入 + 审计） ==========
let r = await call('GET', '/daoshu/frameworks');
check(
  'daoshu/frameworks 含总纲+八维规则+反思链+审计口径',
  !!r.json.general &&
    Array.isArray(r.json.rules) && r.json.rules.length >= 8 &&
    Array.isArray(r.json.reflectionChain) && r.json.reflectionChain.length === 4 &&
    Array.isArray(r.json.auditCriteria) && r.json.auditCriteria.length === 4,
  JSON.stringify(r.json).slice(0, 120),
);

r = await call('POST', '/daoshu/reflect', {
  text: '这是最后机会，错过就亏了，马上充值以免后悔',
});
check(
  'daoshu/reflect 反思链检出"恐吓/紧迫感"',
  Array.isArray(r.json.questions) && r.json.questions.length === 4 &&
    r.json.questions.some((q) => q.verdict === 'warn'),
  JSON.stringify(r.json).slice(0, 160),
);

r = await call('POST', '/daoshu/audit', {
  text: '建议按你的节奏来，也提示一下风险边界，随时可以退出，长期看会有周期。',
});
check(
  'daoshu/audit 四维审计返回总分',
  Array.isArray(r.json.dimensions) && r.json.dimensions.length === 4 &&
    typeof r.json.overall === 'number' && r.json.overall >= 0 && r.json.overall <= 100,
  JSON.stringify(r.json).slice(0, 120),
);
check('daoshu/audit 正向文本整体达标', r.json.overall >= 70, `overall=${r.json.overall}`);

r = await call('POST', '/daoshu/audit', { text: '绝对没问题，必须马上办，不要错过最后机会！' });
check('daoshu/audit 负向文本得分被压低', r.json.overall < 70, `overall=${r.json.overall}`);

r = await call('GET', '/daoshu/alignment-knowledge');
check('daoshu/alignment-knowledge 对齐知识库非空', Array.isArray(r.json) && r.json.length > 0, JSON.stringify(r.json).slice(0, 80));

r = await call('GET', '/daoshu/meta-knowledge');
check('daoshu/meta-knowledge 元规律库非空', Array.isArray(r.json) && r.json.length > 0, JSON.stringify(r.json).slice(0, 80));

// ========== 2. 疗愈引擎（减焦虑 + 高危转介） ==========
r = await call('POST', '/healing/assess', { text: '最近工作压力很大，很焦虑，晚上睡不着，特别担心做不好。' });
check(
  'healing/assess 识别焦虑并给出道式练习',
  r.json.emotion === 'anxiety' && !!r.json.patternKey && !!r.json.patternLabel,
  JSON.stringify(r.json).slice(0, 120),
);
check('healing/assess 普通情绪不触发转介', r.json.riskLevel === 'none', JSON.stringify(r.json).slice(0, 80));

r = await call('POST', '/healing/assess', { text: '我真的不想活了，感觉活着没意思。' });
check(
  'healing/assess 高危信号触发转介（含 12356）',
  r.json.riskLevel === 'high' && (r.json.referral ?? '').includes('12356'),
  JSON.stringify(r.json).slice(0, 120),
);

r = await call('POST', '/healing/sos', { text: '我现在很慌，不知道该怎么办。' });
check('healing/sos 焦虑急救四步法', Array.isArray(r.json.steps) && r.json.steps.length === 4, JSON.stringify(r.json).slice(0, 100));
check('healing/sos 附道经箴言', !!r.json.quote, JSON.stringify(r.json).slice(0, 80));

r = await call('GET', '/healing/patterns');
check('healing/patterns 四类道式练习', Array.isArray(r.json) && r.json.length === 4, JSON.stringify(r.json).slice(0, 80));

r = await call('POST', '/healing/weekly-review', { records: ['周一午后焦虑了半小时'] });
check('healing/weekly-review 周报模板', !!r.json.template && Array.isArray(r.json.records), JSON.stringify(r.json).slice(0, 80));

// ========== 3. 增长引擎（道系人格测试 / 箴言卡 / 邀请） ==========
r = await call('GET', '/growth/daoxi-quiz');
check('growth/daoxi-quiz 问卷 8 题', Array.isArray(r.json.questions) && r.json.questions.length === 8, JSON.stringify(r.json).slice(0, 80));

if (Array.isArray(r.json.questions) && r.json.questions.length === 8) {
  const answers = Object.fromEntries(r.json.questions.map((q, i) => [q.id, (i % 2) + 1]));
  const qr = await call('POST', '/growth/daoxi-quiz', { answers });
  check(
    'growth/daoxi-quiz 提交得 16 型人格 + 分享卡',
    !!qr.json.persona?.title && !!qr.json.shareCard?.title && !!qr.json.shareCard?.shareText,
    JSON.stringify(qr.json).slice(0, 160),
  );
  check(
    'growth/daoxi-quiz 分享文案含裂变钩子',
    (qr.json.shareCard?.shareText ?? '').length > 20,
    JSON.stringify(qr.json.shareCard ?? {}).slice(0, 100),
  );
}

r = await call('GET', '/growth/proverb-card');
check(
  'growth/proverb-card 每日箴言卡（81 章轮转）',
  !!r.json.quote && r.json.chapterNo >= 1 && r.json.chapterNo <= 81 && !!r.json.action,
  JSON.stringify(r.json).slice(0, 120),
);

r = await call('GET', '/growth/invite?persona=上善若水型');
check('growth/invite 邀请文案非空', !!r.json.text && r.json.text.length > 10, JSON.stringify(r.json).slice(0, 80));

// ========== 4. 行业 Agent 矩阵 ==========
r = await call('GET', '/industry/agents');
check('industry/agents 七大行业 Agent', Array.isArray(r.json) && r.json.length === 7, JSON.stringify(r.json).slice(0, 160));

r = await call('GET', '/industry/agents/psychology');
check('industry/agents/:code 注入包详情', !!r.json.promptPack && !!r.json.pricing, JSON.stringify(r.json).slice(0, 120));

r = await call('POST', '/industry/agents/psychology/invoke', { question: '来访者反复说担心失败，如何安抚并引导？' });
check(
  'industry/agents/:code/invoke 行业问答带回溯章节 + 对齐规则',
  r.json.agentCode === 'psychology' &&
    Array.isArray(r.json.chaptersUsed) && r.json.chaptersUsed.length > 0 &&
    Array.isArray(r.json.alignmentRules) && r.json.alignmentRules.length > 0 &&
    !!r.json.answer,
  JSON.stringify(r.json).slice(0, 160),
);

r = await call('GET', '/industry/agents/nonexist');
check('industry/agents 未知行业返回 404', r.status === 404, `status=${r.status}`);

// ========== 5. 商业闭环（订阅三级火箭） ==========
r = await call('GET', '/subscription/plans');
check(
  'subscription/plans 三级计划（体验/Pro/企业）',
  Array.isArray(r.json) && r.json.length === 3 &&
    r.json.some((p) => p.tier === 'free') && r.json.some((p) => p.tier === 'pro') && r.json.some((p) => p.tier === 'enterprise'),
  JSON.stringify(r.json).slice(0, 160),
);
const pro = r.json.find((p) => p.tier === 'pro');
check('subscription/plans Pro 定价合理', !!pro && pro.priceYearly > 0 && pro.priceYearly < 10000, JSON.stringify(pro));

r = await call('POST', '/subscription/orders', { planCode: 'pro' });
check(
  'subscription/orders 模拟支付成功（演示模式）',
  !!r.json.order && r.json.order.status === 'paid',
  JSON.stringify(r.json).slice(0, 160),
);

r = await call('GET', '/subscription/my');
check(
  'subscription/my 返回权益列表（演示默认 Pro）',
  !!r.json.currentPlan && Array.isArray(r.json.features) && r.json.features.length > 0,
  JSON.stringify(r.json).slice(0, 160),
);

console.log(`\n结果：${passed} 通过 / ${failed} 失败`);
process.exitCode = failed ? 1 : 0;