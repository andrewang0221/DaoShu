<template>
  <view class="page">
    <TaijiBackButton floating />
    <view class="hero">
      <view class="hero-title">行业 Agent 矩阵</view>
      <view class="hero-sub">让智慧落地各行各业 · 道德经 x 行业场景</view>
    </view>

    <!-- 自定义行业识别（FR-P） -->
    <view class="section">
      <view class="section-title">没有你的行业？一句话定制</view>
      <view class="detect-card">
        <view class="detect-tip">输入你的职业/行业描述，系统自动识别并生成专属行业 Agent</view>
        <textarea
          v-model="profileInput"
          class="text-input"
          placeholder="例如：我是一名建筑工人，每天在工地干活，最近总为工期和安全操心……"
          :maxlength="200"
        />
        <view class="btn primary" @tap="doDetect" :class="{ disabled: detecting }">
          {{ detecting ? '识别中...' : '识别并生成专属 Agent' }}
        </view>

        <!-- 识别结果 -->
        <view v-if="detectResult" class="detect-result">
          <view class="detect-industry">
            <text class="di-icon">{{ detectResult.industry.icon }}</text>
            <view class="di-body">
              <view class="di-name">
                {{ detectResult.industry.name }}
                <text class="di-tag" :class="detectResult.industry.source">{{ detectResult.industry.source === 'llm' ? 'AI 识别' : '智能匹配' }}</text>
              </view>
              <view class="di-reason">{{ detectResult.industry.matchReason }}</view>
            </view>
          </view>
          <view class="detect-agent" @tap="selectAgent(detectResult.agent)">
            <text class="da-icon">✨</text>
            <view class="da-body">
              <view class="da-name">已生成专属 Agent：{{ detectResult.agent.name }}</view>
              <view class="da-note">点击进入详情并开始对话（本人免费）</view>
            </view>
            <view class="agent-arrow">›</view>
          </view>
        </view>
      </view>
    </view>

    <!-- Agent 列表 -->
    <view class="section">
      <view class="section-title">选择行业（{{ agents.length }}）</view>
      <view v-for="(agent, i) in agents" :key="agent.code" class="agent-card" @tap="selectAgent(agent)">
        <view class="agent-icon">{{ agent.custom ? '✨' : (industryIcons[agent.code] || '🏢') }}</view>
        <view class="agent-body">
          <view class="agent-name">
            {{ agent.name }}
            <text v-if="agent.custom" class="custom-badge">定制</text>
          </view>
          <view class="agent-sector">{{ agent.sector }}</view>
          <view class="agent-excerpt">{{ agent.excerpt }}</view>
        </view>
        <view class="agent-arrow">›</view>
      </view>
    </view>

    <!-- Agent 详情与调用 -->
    <view v-if="selectedAgent" class="section">
      <view class="detail-card">
        <view class="detail-header">
          <text class="detail-icon">{{ selectedAgent.custom ? '✨' : (industryIcons[selectedAgent.code] || '🏢') }}</text>
          <view class="detail-title-block">
            <view class="detail-name">{{ selectedAgent.name }}</view>
            <view class="detail-sector">{{ selectedAgent.sector }}</view>
          </view>
        </view>

        <!-- 解锁状态 -->
        <view class="detail-section">
          <view class="unlock-bar">
            <template v-if="isUnlocked(selectedAgent.code)">
              <text class="unlock-ok">✓ 已解锁 · 无限使用</text>
            </template>
            <template v-else>
              <text class="unlock-trial">免费试用剩余 {{ trialLeft }} 次</text>
              <view class="unlock-btn" @tap="doUnlock">解锁 {{ selectedAgent.unlockCost }} 积分</view>
            </template>
          </view>
        </view>

        <view class="detail-section">
          <view class="detail-label">场景示例</view>
          <view v-for="(q, j) in selectedAgent.sampleQuestions" :key="j" class="sample-question" @tap="setQuestion(q)">
            {{ q }}
          </view>
        </view>

        <view class="detail-section">
          <view class="detail-label">注入包</view>
          <view class="prompt-pack">{{ selectedAgent.promptPack }}</view>
        </view>

        <view class="detail-section">
          <view class="detail-label">道之痛（{{ selectedAgent.painPoints?.length || 0 }} 条）</view>
          <view v-for="(p, k) in (selectedAgent.painPoints || [])" :key="k" class="rule-row">
            {{ k + 1 }}. {{ p }}
          </view>
        </view>

        <view class="detail-section">
          <view class="detail-label">落地模式</view>
          <view class="pricing-text">{{ selectedAgent.pricing }}</view>
        </view>
      </view>

      <!-- 场景调用 -->
      <view class="invoke-card">
        <view class="invoke-label">输入你的行业问题</view>
        <textarea v-model="invokeQuestion" placeholder="例如：来访者反复说担心失败，如何安抚并引导？" class="text-input" />
        <view class="btn primary" @tap="doInvoke" :class="{ disabled: invoking }">
          {{ invoking ? '思考中...（AI 深度生成约需 1 分钟，请勿离开）' : '启动行业 Agent' }}
        </view>
      </view>

      <view class="result" v-if="invokeResult">
        <view class="result-header">
          <text class="result-agent">{{ invokeResult.agentName }}</text>
          <text class="result-chapters">引用 {{ invokeResult.chaptersUsed?.length || 0 }} 章</text>
        </view>
        <view class="result-answer">{{ invokeResult.answer }}</view>
        <view v-if="invokeResult.access && !invokeResult.access.unlocked" class="trial-note">
          免费试用剩余 {{ invokeResult.access.freeTrialLeft }} 次
        </view>
        <view v-if="invokeResult.alignmentRules?.length" class="alignment-section">
          <view class="alignment-title">已注入对齐规则 {{ invokeResult.alignmentRules.length }} 条</view>
          <view v-for="(ar, idx) in invokeResult.alignmentRules" :key="idx" class="alignment-item">
            <text class="ar-principle">{{ ar.principle }}</text>
            <text class="ar-rule">{{ ar.agentRule }}</text>
          </view>
        </view>
        <view v-if="invokeResult.frameworkNote" class="framework-note">{{ invokeResult.frameworkNote }}</view>
      </view>

      <!-- 案例库 -->
      <view class="invoke-card">
        <view class="invoke-label">行业案例库（{{ cases.length }}）</view>
        <view v-if="!cases.length" class="hint">暂无案例 —— 你的每次优质问答都会沉淀为行业案例</view>
        <view v-for="(c, ci) in cases" :key="ci" class="case-item">
          <view class="case-q">Q：{{ c.question }}</view>
          <view class="case-a">{{ c.answer }}</view>
          <view class="case-meta">
            <text v-for="(ch, chi) in c.chapters" :key="chi">第{{ ch.chapterNo }}章</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '../../api';
import { useAppStore } from '../../store';
import TaijiBackButton from '../../components/TaijiBackButton.vue';

const agents = ref<any[]>([]);
const selectedAgent = ref<any>(null);
const invokeQuestion = ref('');
const invokeResult = ref<any>(null);
const invoking = ref(false);
const unlockedCodes = ref<Set<string>>(new Set());
const trialLeft = ref(2);
const cases = ref<any[]>([]);

const store = useAppStore();
store.restore();

/** 未登录时引导登录（交互类操作需要账号） */
function requireLogin(action: string): boolean {
  if (store.isLoggedIn) return true;
  uni.showModal({
    title: '请先登录',
    content: `${action}需要先登录账号`,
    confirmText: '去登录',
    success: (res) => {
      if (res.confirm) uni.navigateTo({ url: '/pages/login/login' });
    },
  });
  return false;
}

// 自定义行业识别
const profileInput = ref('');
const detecting = ref(false);
const detectResult = ref<any>(null);

const industryIcons: Record<string, string> = {
  psychology: '🧠',
  'customer-service': '🎧',
  management: '📊',
  finance: '💰',
  education: '📚',
  eldercare: '🏥',
  ecommerce: '🛒',
  construction: '🏗️',
  internet: '💻',
  healthcare: '⚕️',
  sales: '🤝',
  catering: '🍜',
  logistics: '🚚',
  manufacturing: '🏭',
  agriculture: '🌾',
  media: '🎬',
  'public-sector': '🏛️',
  hr: '🧑‍💼',
  legal: '⚖️',
  design: '🎨',
  'security-service': '🛡️',
  retail: '🛒',
  research: '🔬',
  generic: '🌀',
};

const isUnlocked = (code: string) => unlockedCodes.value.has(code);

onMounted(async () => {
  await Promise.all([loadAgents(), loadUnlocks()]);
});

async function loadAgents() {
  try {
    agents.value = await api.industryAgents();
  } catch {
    uni.showToast({ title: '加载行业列表失败', icon: 'none' });
  }
}

async function loadUnlocks() {
  // 游客无需解锁状态，跳过（避免 401 提示）
  if (!store.isLoggedIn) return;
  try {
    const res = await api.industryUnlocks();
    unlockedCodes.value = new Set(res.codes ?? []);
  } catch {
    // 静默失败：按未解锁处理
  }
}

/** 自定义行业识别：输入一段描述 → 识别行业 → 生成专属 Agent */
async function doDetect() {
  if (!profileInput.value.trim() || detecting.value) return;
  if (!requireLogin('行业识别与生成专属 Agent')) return;
  detecting.value = true;
  detectResult.value = null;
  try {
    detectResult.value = await api.industryDetect(profileInput.value);
    // 生成的包已自动解锁（本人免费），刷新列表与解锁状态
    await Promise.all([loadAgents(), loadUnlocks()]);
    uni.showToast({ title: `已识别行业：${detectResult.value.industry.name}`, icon: 'none' });
  } catch {
    // request 封装已 toast 错误信息
  }
  detecting.value = false;
}

async function selectAgent(agent: any) {
  selectedAgent.value = agent;
  invokeQuestion.value = '';
  invokeResult.value = null;
  cases.value = [];
  try {
    const detail = await api.industryAgentDetail(agent.code);
    selectedAgent.value = { ...agent, ...detail };
  } catch {
    // 详情加载失败仍保留列表数据
  }
  await loadCases(agent.code);
  refreshTrialLeft(agent.code);
}

function setQuestion(q: string) {
  invokeQuestion.value = q;
}

/** 通过一次静默调用探测剩余试用次数：直接从最近 invoke 结果或本地缓存推断 */
function refreshTrialLeft(_code: string) {
  // invokeResult.access 会随调用更新；初始按最大试用次数显示
  if (invokeResult.value?.agentCode === _code) {
    trialLeft.value = invokeResult.value.access?.freeTrialLeft ?? 2;
  } else {
    trialLeft.value = 2;
  }
}

/** 解锁：扣积分（自定义包生成者本人免费） */
async function doUnlock() {
  if (!selectedAgent.value) return;
  if (!requireLogin('解锁行业包')) return;
  const cost = selectedAgent.value.unlockCost ?? 0;
  const confirmed = await new Promise<boolean>((resolve) => {
    uni.showModal({
      title: '解锁行业包',
      content: `将消耗 ${cost} 积分解锁「${selectedAgent.value.name}」，解锁后无限使用。`,
      success: (res) => resolve(!!res.confirm),
      fail: () => resolve(false),
    });
  });
  if (!confirmed) return;
  try {
    const res = await api.industryUnlock(selectedAgent.value.code);
    unlockedCodes.value = new Set([...unlockedCodes.value, selectedAgent.value.code]);
    uni.showToast({ title: res.cost ? `已解锁（-${res.cost} 积分）` : '已解锁', icon: 'none' });
  } catch {
    // request 封装已 toast（如积分不足）
  }
}

async function doInvoke() {
  if (!invokeQuestion.value.trim() || !selectedAgent.value || invoking.value) return;
  if (!requireLogin('行业问答')) return;
  invoking.value = true;
  try {
    invokeResult.value = await api.industryInvoke(selectedAgent.value.code, invokeQuestion.value);
    if (invokeResult.value.access) {
      if (invokeResult.value.access.unlocked) {
        unlockedCodes.value = new Set([...unlockedCodes.value, selectedAgent.value.code]);
      } else {
        trialLeft.value = invokeResult.value.access.freeTrialLeft ?? 0;
      }
    }
    // 问答沉淀为案例，刷新案例库
    loadCases(selectedAgent.value.code);
  } catch (e: any) {
    // 试用用完：引导解锁
    if (e?.message && e.message.includes('解锁')) {
      doUnlock();
    }
  }
  invoking.value = false;
}

async function loadCases(code: string) {
  try {
    cases.value = await api.industryCases(code);
  } catch {
    cases.value = [];
  }
}
</script>

<style scoped>
.page { padding: 30rpx; background: #f7f3ea; min-height: 100vh; }
.hero { padding: 40rpx 10rpx 30rpx; text-align: center; }
.hero-title { font-size: 44rpx; font-weight: 700; letter-spacing: 6rpx; color: #3a3226; }
.hero-sub { margin-top: 12rpx; font-size: 26rpx; color: #8a7f6a; }
.section { margin-bottom: 40rpx; }
.section-title { font-size: 30rpx; font-weight: 600; color: #3a3226; margin-bottom: 20rpx; padding-left: 16rpx; border-left: 6rpx solid #5b6b52; }
.detect-card { background: #fffdf7; border-radius: 20rpx; padding: 30rpx; box-shadow: 0 4rpx 16rpx rgba(90, 80, 60, 0.06); }
.detect-tip { font-size: 24rpx; color: #8a7f6a; margin-bottom: 16rpx; line-height: 1.5; }
.detect-result { margin-top: 24rpx; }
.detect-industry { display: flex; align-items: center; background: #f7f3ea; border-radius: 16rpx; padding: 24rpx; }
.di-icon { font-size: 48rpx; margin-right: 20rpx; }
.di-body { flex: 1; }
.di-name { font-size: 30rpx; font-weight: 600; color: #3a3226; }
.di-tag { display: inline-block; margin-left: 12rpx; padding: 2rpx 12rpx; border-radius: 8rpx; font-size: 20rpx; font-weight: 500; color: #fdfaf2; background: #5b6b52; }
.di-tag.llm { background: #8a6d3b; }
.di-reason { font-size: 24rpx; color: #8a7f6a; margin-top: 8rpx; line-height: 1.4; }
.detect-agent { display: flex; align-items: center; background: #f2f0e4; border: 1rpx dashed #b3a88f; border-radius: 16rpx; padding: 24rpx; margin-top: 16rpx; }
.da-icon { font-size: 40rpx; margin-right: 20rpx; }
.da-body { flex: 1; }
.da-name { font-size: 28rpx; font-weight: 600; color: #3a3226; }
.da-note { font-size: 22rpx; color: #8a7f6a; margin-top: 6rpx; }
.agent-card { display: flex; align-items: center; background: #fffdf7; border-radius: 20rpx; padding: 30rpx; margin-bottom: 20rpx; box-shadow: 0 4rpx 16rpx rgba(90, 80, 60, 0.06); }
.agent-icon { font-size: 48rpx; margin-right: 24rpx; }
.agent-body { flex: 1; }
.agent-name { font-size: 30rpx; font-weight: 600; color: #3a3226; }
.custom-badge { display: inline-block; margin-left: 10rpx; padding: 2rpx 10rpx; border-radius: 8rpx; font-size: 20rpx; color: #8a6d3b; background: #f2e8d5; vertical-align: middle; }
.agent-sector { font-size: 22rpx; color: #5b6b52; margin-top: 4rpx; }
.agent-excerpt { font-size: 24rpx; color: #8a7f6a; margin-top: 8rpx; line-height: 1.4; }
.agent-arrow { font-size: 40rpx; color: #c9c0ae; }
.detail-card { background: #fffdf7; border-radius: 20rpx; padding: 30rpx; margin-bottom: 20rpx; }
.detail-header { display: flex; align-items: flex-start; margin-bottom: 24rpx; }
.detail-icon { font-size: 48rpx; margin-right: 20rpx; }
.detail-title-block { flex: 1; }
.detail-name { font-size: 32rpx; font-weight: 600; color: #3a3226; }
.detail-sector { font-size: 24rpx; color: #8a7f6a; margin-top: 4rpx; }
.detail-section { margin-bottom: 24rpx; padding-bottom: 20rpx; border-bottom: 1rpx solid #f0ebe0; }
.detail-label { font-size: 26rpx; font-weight: 600; color: #5b6b52; margin-bottom: 14rpx; }
.unlock-bar { display: flex; align-items: center; justify-content: space-between; background: #f7f3ea; border-radius: 12rpx; padding: 20rpx; }
.unlock-ok { font-size: 26rpx; font-weight: 600; color: #5b6b52; }
.unlock-trial { font-size: 24rpx; color: #8a7f6a; }
.unlock-btn { padding: 10rpx 24rpx; border-radius: 30rpx; background: #5b6b52; color: #fdfaf2; font-size: 24rpx; font-weight: 600; }
.sample-question { padding: 16rpx; background: #f7f3ea; border-radius: 12rpx; margin-bottom: 12rpx; font-size: 26rpx; color: #3a3226; }
.sample-question:active { background: #efe6d5; }
.rule-row { font-size: 24rpx; color: #3a3226; line-height: 1.5; margin-bottom: 8rpx; }
.hint { font-size: 22rpx; color: #b3a88f; }
.prompt-pack { font-size: 24rpx; color: #3a3226; line-height: 1.6; background: #f7f3ea; border-radius: 12rpx; padding: 20rpx; }
.pricing-text { font-size: 26rpx; font-weight: 600; color: #5b6b52; }
.invoke-card { background: #fffdf7; border-radius: 20rpx; padding: 30rpx; margin-bottom: 20rpx; }
.invoke-label { font-size: 26rpx; font-weight: 600; color: #3a3226; margin-bottom: 16rpx; }
.text-input { width: 100%; height: 160rpx; border: 2rpx solid #e0d8c8; border-radius: 12rpx; padding: 16rpx; font-size: 26rpx; color: #3a3226; box-sizing: border-box; }
.btn { padding: 20rpx 40rpx; border-radius: 40rpx; text-align: center; font-size: 28rpx; font-weight: 600; margin-top: 20rpx; background: #efe6d5; color: #3a3226; }
.btn.primary { background: #5b6b52; color: #fdfaf2; }
.btn.disabled { background: #d8cfba; }
.result { background: #fffdf7; border-radius: 20rpx; padding: 30rpx; margin-bottom: 20rpx; }
.result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; padding-bottom: 16rpx; border-bottom: 1rpx solid #f0ebe0; }
.result-agent { font-size: 28rpx; font-weight: 600; color: #5b6b52; }
.result-chapters { font-size: 22rpx; color: #8a7f6a; }
.result-answer { font-size: 26rpx; color: #3a3226; line-height: 1.6; white-space: pre-wrap; }
.trial-note { margin-top: 16rpx; font-size: 22rpx; color: #8a6d3b; background: #f2e8d5; border-radius: 8rpx; padding: 12rpx 16rpx; }
.alignment-section { margin-top: 24rpx; padding-top: 20rpx; border-top: 1rpx solid #f0ebe0; }
.alignment-title { font-size: 26rpx; font-weight: 600; color: #5b6b52; margin-bottom: 14rpx; }
.alignment-item { margin-bottom: 12rpx; }
.ar-principle { font-size: 24rpx; font-weight: 600; color: #3a3226; display: block; }
.ar-rule { font-size: 22rpx; color: #8a7f6a; display: block; margin-top: 4rpx; }
.framework-note { font-size: 22rpx; color: #b3a88f; margin-top: 16rpx; padding: 16rpx; background: #f7f3ea; border-radius: 8rpx; }
.case-item { padding: 16rpx; background: #f7f3ea; border-radius: 12rpx; margin-bottom: 14rpx; }
.case-q { font-size: 24rpx; font-weight: 600; color: #3a3226; margin-bottom: 8rpx; }
.case-a { font-size: 22rpx; color: #5b6b52; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.case-meta { margin-top: 8rpx; font-size: 20rpx; color: #b3a88f; }
.case-meta text { margin-right: 12rpx; }
</style>
