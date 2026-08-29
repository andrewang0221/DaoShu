#!/usr/bin/env node
/**
 * 后端冒烟测试：验证演示模式下核心链路
 * 前提：backend 已启动（npm run start:dev），默认 http://localhost:3080
 * 用法：node tools/smoke-test.mjs [baseUrl]
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

console.log(`冒烟测试开始 → ${BASE}\n`);

// 1. 认证
let r = await call('POST', '/auth/sms-code', { phone: '13800000000' });
check('auth/sms-code', r.status === 201 || r.status === 200, JSON.stringify(r.json));

r = await call('POST', '/auth/login', { phone: '13800000000', code: '123456' });
check('auth/login 返回 token', !!r.json.token, JSON.stringify(r.json));
const token = r.json.token;

r = await call('GET', '/users/me');
check('users/me（演示自动放行）', r.json.user?.id === 'demo-user', JSON.stringify(r.json));

// 2. 认养
r = await call('GET', '/adoption/quiz');
check('adoption/quiz 8 维度', r.json.dimensions?.length === 8, JSON.stringify(r.json));

r = await call('POST', '/adoption/quiz', {
  answers: { q_dao: 2, q_de: 2, q_wuwei: 1, q_rou: 2, q_jing: 1, q_pu: 2, q_zhizu: 1, q_ziran: 2 },
});
check('adoption/quiz 提交得分', r.json.scores?.dao === 1, JSON.stringify(r.json));

r = await call('POST', '/adoption/digital-human', { name: '青玄子', avatarStyle: '2d_cartoon' });
check('创建数字人', !!r.json.id && r.json.name === '青玄子', JSON.stringify(r.json));
const dhId = r.json.id;

r = await call('POST', `/adoption/contract/${dhId}`);
check('签署认养契约', r.status === 201 || r.status === 200, JSON.stringify(r.json));

r = await call('GET', '/adoption/panel/demo-dh');
check('认养面板', !!r.json.radar, JSON.stringify(r.json));

// 3. 对话（知识检索）
r = await call('POST', '/chat/conversations', { digitalHumanId: dhId, mode: 'free' });
check('创建会话', !!r.json.id, JSON.stringify(r.json));
const convId = r.json.id;

r = await call('POST', `/chat/conversations/${convId}/messages`, { content: '无为是什么意思？我想知道它对管理工作有什么启发' });
check('提问返回回答', !!r.json.content && r.json.content.length > 20, (r.json.content ?? '').slice(0, 50));
check('回答带引用章节', Array.isArray(r.json.citations) && r.json.citations.length > 0, JSON.stringify(r.json.citations));
check('引用含"无为"相关章节', r.json.citations?.some((c) => [2, 3, 37, 48, 57, 63].includes(c.chapterNo)), JSON.stringify(r.json.citations));

r = await call('GET', `/chat/conversations/${convId}/messages`);
check('历史消息 2 条', r.json.length === 2, JSON.stringify(r.json.length));

// 4. 知识治理
r = await call('POST', '/knowledge/recommend', {
  content: '测试推荐条目：无为并非躺平，而是不强为。',
  source: '《道德经》第三十七章学习笔记',
  chapterNo: 37,
  tags: ['管理'],
});
check('成员推荐成功（含出处）', r.json.item?.status === 'pending', JSON.stringify(r.json));

r = await call('POST', '/knowledge/recommend', { content: '没有出处的推荐', chapterNo: 3 });
check('无出处推荐被拒', r.status === 400, `status=${r.status}`);

r = await call('GET', '/knowledge/items?keyword=上善若水');
check('知识库检索命中', r.json.length >= 1 && r.json[0].chapterNo === 8, JSON.stringify(r.json));

r = await call('GET', '/admin/knowledge/review-queue');
check('管理端待审队列', Array.isArray(r.json) && r.json.length >= 1, JSON.stringify(r.json));
const pendingId = r.json[0]?.id;

r = await call('POST', `/admin/knowledge/review/${pendingId}`, { action: 'approve', note: '测试通过' });
check('管理员采纳', r.json.status === 'approved', JSON.stringify(r.json));

// 5. 积分与市场（幂等：不依赖初始余额，断言相对扣减）
r = await call('GET', '/points/me');
const bal0 = r.json.balance;
check('积分账户可查询', typeof bal0 === 'number' && bal0 > 0, JSON.stringify(r.json));

r = await call('POST', '/points/exchange', { itemCode: 'meditation' });
check('积分兑换按价扣减', r.json.balance === bal0 - 300, `before=${bal0} after=${r.json.balance}`);

const uniqueContent = `上善若水：适应变化者强。（${Date.now()}）`;
r = await call('POST', '/market/publish', { content: uniqueContent, sceneTags: ['处世'] });
check('公开知识入池', !!r.json.item?.contentHash, JSON.stringify(r.json));

r = await call('POST', '/market/publish', { content: uniqueContent, sceneTags: ['处世'] });
check('重复公开被拒（指纹防重）', r.status === 400, `status=${r.status}`);

r = await call('GET', '/market/items');
check('知识池列表', r.json.length >= 1, JSON.stringify(r.json));

console.log(`\n结果：${passed} 通过 / ${failed} 失败`);
process.exitCode = failed ? 1 : 0;
