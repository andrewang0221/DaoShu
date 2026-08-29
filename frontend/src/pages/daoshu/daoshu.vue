<template>
  <view class="page">
    <TaijiBackButton floating />
    <view class="hero">
      <view class="hero-title">道枢思维底座</view>
      <view class="hero-sub">让 AI 智能体拥有东方智慧的底层操作系统</view>
    </view>

    <!-- 对齐框架 -->
    <view class="section">
      <view class="section-title">一 · 对齐框架</view>
      <view class="card" v-if="frameworks.general">
        <view class="card-label">价值观总纲</view>
        <view class="card-text">{{ frameworks.general }}</view>
      </view>
      <view class="card" v-if="frameworks.rules?.length">
        <view class="card-label">八维行为规则</view>
        <view v-for="(r, i) in frameworks.rules.slice(0, 6)" :key="i" class="rule-block">
          <view class="rule-head">
            <text class="rule-num">{{ i + 1 }}</text>
            <text class="rule-principle">{{ r.principle }}</text>
            <text class="rule-source">{{ r.source }}</text>
          </view>
          <view class="rule-text">{{ r.guideline }}</view>
          <view class="rule-quote">✔ 正向：{{ r.positive }}</view>
          <view class="rule-quote negative">✘ 负向：{{ r.negative }}</view>
        </view>
        <view v-if="frameworks.rules.length > 6" class="hint">共 {{ frameworks.rules.length }} 条，查看完整版请调用 API</view>
      </view>
      <view class="card" v-if="frameworks.reflectionChain?.length">
        <view class="card-label">反思链四问</view>
        <view v-for="(q, i) in frameworks.reflectionChain" :key="i" class="rule-item">
          <text class="rule-num">{{ i + 1 }}</text>
          <text class="rule-text">{{ q.label }}：{{ q.question }}</text>
        </view>
      </view>
    </view>

    <!-- 反思链自检 -->
    <view class="section">
      <view class="section-title">二 · 反思链自检</view>
      <view class="input-area">
        <textarea v-model="reflectText" placeholder="输入一段决策或回复文本，系统将按道枢反思链四问进行自检..." class="text-input" />
        <view class="btn primary" @tap="doReflect" :class="{ disabled: reflecting }">
          {{ reflecting ? '分析中...' : '运行反思链' }}
        </view>
      </view>
      <view class="result" v-if="reflectResult">
        <view class="result-summary" :class="{ pass: reflectWarnCount === 0, warn: reflectWarnCount > 0 }">
          {{ reflectWarnCount === 0 ? '通过：未发现风险信号' : `警告：检出 ${reflectWarnCount} 项风险` }}
        </view>
        <view v-for="(q, i) in reflectResult.questions" :key="i" class="question-row" :class="{ warn: q.verdict === 'warn' }">
          <text class="q-label">{{ q.label }}</text>
          <text class="q-verdict" :class="q.verdict">{{ q.verdict === 'warn' ? '⚠ ' : '✓ ' }}{{ q.verdict === 'warn' ? '风险' : '通过' }}</text>
          <view v-if="q.hitKeywords?.length" class="q-keywords">
            命中关键词：{{ q.hitKeywords.join('、') }}
          </view>
          <view class="q-advice">{{ q.advice }}</view>
        </view>
      </view>
    </view>

    <!-- 四维审计 -->
    <view class="section">
      <view class="section-title">三 · 四维审计 API</view>
      <view class="input-area">
        <textarea v-model="auditText" placeholder="输入文本，系统将按无为/守中/自然/知足四维度评分..." class="text-input" />
        <view class="btn primary" @tap="doAudit" :class="{ disabled: auditing }">
          {{ auditing ? '审计中...' : '运行审计' }}
        </view>
      </view>
      <view class="result" v-if="auditResult">
        <view class="score-ring">
          <view class="score-num">{{ auditResult.overall }}</view>
          <view class="score-label">综合得分</view>
        </view>
        <view v-for="(d, i) in auditResult.dimensions" :key="i" class="dim-row">
          <text class="dim-name">{{ d.label }}</text>
          <view class="dim-bar-bg">
            <view class="dim-bar" :style="{ width: d.score + '%', background: dimColor(d.score) }"></view>
          </view>
          <text class="dim-score">{{ d.score }}</text>
          <view class="dim-reason">{{ d.reason }}</view>
        </view>
        <view class="result-suggestion">{{ auditResult.suggestion }}</view>
      </view>
    </view>

    <!-- 知识库 -->
    <view class="section">
      <view class="section-title">四 · 对齐知识库</view>
      <view v-if="alignmentKnowledge.length" class="knowledge-list">
        <view v-for="(k, i) in alignmentKnowledge.slice(0, 5)" :key="i" class="k-item">
          <text class="k-principle">{{ k.principle }}</text>
          <text class="k-rule">{{ k.agentRule }}</text>
          <text class="k-source">{{ k.source }}</text>
        </view>
      </view>
      <view class="card" v-if="metaKnowledge.length">
        <view class="card-label">元层规律（{{ metaKnowledge.length }} 条）</view>
        <view v-for="(m, i) in metaKnowledge.slice(0, 3)" :key="i" class="rule-item">
          <text class="rule-num">{{ i + 1 }}</text>
          <view class="rule-text">
            <text class="meta-principle">{{ m.principle }}（{{ m.source }}）</text>
            <text class="meta-pattern">{{ m.pattern }}</text>
            <text class="meta-modern">{{ m.modern }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../api';
import { useAppStore } from '../../store';
import TaijiBackButton from '../../components/TaijiBackButton.vue';

const store = useAppStore();
store.restore();

/** 未登录时引导登录（工具类 LLM 调用需要账号） */
function requireLogin(action: string): boolean {
  if (store.isLoggedIn) return true;
  uni.showModal({
    title: '请先登录',
    content: `${action}需要先登录账号`,
    confirmText: '去登录',
    success: (r) => {
      if (r.confirm) uni.navigateTo({ url: '/pages/login/login' });
    },
  });
  return false;
}

const frameworks = ref<any>({});
const alignmentKnowledge = ref<any[]>([]);
const metaKnowledge = ref<any[]>([]);

const reflectText = ref('这是最后机会，错过就亏了，马上充值以免后悔');
const reflectResult = ref<any>(null);
const reflectWarnCount = ref(0);
const reflecting = ref(false);

const auditText = ref('建议按你的节奏来，也提示一下风险边界，随时可以退出，长期看会有周期。');
const auditResult = ref<any>(null);
const auditing = ref(false);

onMounted(async () => {
  try {
    frameworks.value = await api.daoshuFrameworks();
    alignmentKnowledge.value = await api.daoshuAlignmentKnowledge();
    metaKnowledge.value = await api.daoshuMetaKnowledge();
  } catch (e) {
    uni.showToast({ title: '加载道枢数据失败', icon: 'none' });
  }
});

async function doReflect() {
  if (!reflectText.value.trim()) return;
  if (!requireLogin('反思链自检')) return;
  reflecting.value = true;
  try {
    reflectResult.value = await api.daoshuReflect(reflectText.value);
    reflectWarnCount.value = reflectResult.value.questions?.filter((q: any) => q.verdict === 'warn').length ?? 0;
  } catch {
    uni.showToast({ title: '反思链运行失败', icon: 'none' });
  }
  reflecting.value = false;
}

async function doAudit() {
  if (!auditText.value.trim()) return;
  if (!requireLogin('四维审计')) return;
  auditing.value = true;
  try {
    auditResult.value = await api.daoshuAudit(auditText.value);
  } catch {
    uni.showToast({ title: '审计运行失败', icon: 'none' });
  }
  auditing.value = false;
}

function dimColor(score: number) {
  if (score >= 80) return '#5b6b52';
  if (score >= 60) return '#b8a477';
  return '#c44';
}
</script>

<style scoped>
.page { padding: 30rpx; background: #f7f3ea; min-height: 100vh; }
.hero { padding: 40rpx 10rpx 30rpx; text-align: center; }
.hero-title { font-size: 44rpx; font-weight: 700; letter-spacing: 6rpx; color: #3a3226; }
.hero-sub { margin-top: 12rpx; font-size: 26rpx; color: #8a7f6a; }
.section { margin-bottom: 40rpx; }
.section-title { font-size: 30rpx; font-weight: 600; color: #3a3226; margin-bottom: 20rpx; padding-left: 16rpx; border-left: 6rpx solid #5b6b52; }
.card { background: #fffdf7; border-radius: 20rpx; padding: 30rpx; margin-bottom: 20rpx; box-shadow: 0 4rpx 16rpx rgba(90, 80, 60, 0.06); }
.card-label { font-size: 28rpx; font-weight: 600; color: #5b6b52; margin-bottom: 16rpx; }
.card-text { font-size: 26rpx; color: #3a3226; line-height: 1.6; }
.rule-item { display: flex; align-items: flex-start; margin-bottom: 14rpx; }
.rule-num { width: 40rpx; height: 40rpx; border-radius: 50%; background: #efe6d5; color: #5b6b52; font-size: 22rpx; display: flex; align-items: center; justify-content: center; margin-right: 16rpx; flex-shrink: 0; margin-top: 4rpx; }
.rule-text { flex: 1; font-size: 26rpx; color: #3a3226; line-height: 1.5; }
.meta-principle { font-size: 26rpx; font-weight: 600; color: #5b6b52; display: block; }
.meta-pattern { font-size: 26rpx; color: #3a3226; display: block; margin-top: 4rpx; }
.meta-modern { font-size: 22rpx; color: #8a7f6a; display: block; margin-top: 4rpx; }
.hint { font-size: 22rpx; color: #b3a88f; margin-top: 10rpx; }
.rule-block { padding: 20rpx; background: #f7f3ea; border-radius: 12rpx; margin-bottom: 16rpx; }
.rule-head { display: flex; align-items: center; margin-bottom: 8rpx; flex-wrap: wrap; }
.rule-principle { font-size: 28rpx; font-weight: 600; color: #5b6b52; }
.rule-source { font-size: 22rpx; color: #b3a88f; margin-left: 12rpx; }
.rule-quote { font-size: 22rpx; color: #5b6b52; margin-top: 6rpx; line-height: 1.5; }
.rule-quote.negative { color: #b8876a; }
.input-area { background: #fffdf7; border-radius: 20rpx; padding: 30rpx; margin-bottom: 20rpx; }
.text-input { width: 100%; height: 160rpx; border: 2rpx solid #e0d8c8; border-radius: 12rpx; padding: 16rpx; font-size: 26rpx; color: #3a3226; box-sizing: border-box; }
.btn { padding: 20rpx 40rpx; border-radius: 40rpx; text-align: center; font-size: 28rpx; font-weight: 600; margin-top: 20rpx; }
.btn.primary { background: #5b6b52; color: #fdfaf2; }
.btn.disabled { background: #d8cfba; }
.result { background: #fffdf7; border-radius: 20rpx; padding: 30rpx; margin-bottom: 20rpx; }
.result-summary { font-size: 28rpx; font-weight: 600; padding: 20rpx; border-radius: 12rpx; text-align: center; margin-bottom: 20rpx; }
.result-summary.pass { background: #e8f0e4; color: #5b6b52; }
.result-summary.warn { background: #f9e8e8; color: #c44; }
.question-row { padding: 16rpx 0; border-bottom: 1rpx solid #f0ebe0; }
.question-row.warn { background: #fff8f0; margin: 0 -16rpx; padding: 16rpx; border-radius: 8rpx; }
.q-label { font-size: 26rpx; font-weight: 600; color: #3a3226; }
.q-verdict { font-size: 24rpx; margin-left: 16rpx; }
.q-verdict.pass { color: #5b6b52; }
.q-verdict.warn { color: #c44; }
.q-keywords { font-size: 22rpx; color: #b3a88f; margin-top: 6rpx; }
.q-advice { font-size: 24rpx; color: #8a7f6a; margin-top: 8rpx; line-height: 1.5; }
.score-ring { width: 160rpx; height: 160rpx; border-radius: 50%; border: 8rpx solid #5b6b52; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 30rpx; }
.score-num { font-size: 48rpx; font-weight: 700; color: #5b6b52; }
.score-label { font-size: 22rpx; color: #8a7f6a; }
.dim-row { margin-bottom: 20rpx; }
.dim-name { font-size: 26rpx; font-weight: 600; color: #3a3226; display: block; margin-bottom: 8rpx; }
.dim-bar-bg { height: 16rpx; background: #e8e0d0; border-radius: 8rpx; overflow: hidden; margin-bottom: 6rpx; }
.dim-bar { height: 100%; border-radius: 8rpx; transition: width 0.6s ease; }
.dim-score { font-size: 24rpx; color: #5b6b52; font-weight: 600; }
.dim-reason { font-size: 22rpx; color: #8a7f6a; margin-top: 4rpx; }
.result-suggestion { font-size: 26rpx; color: #3a3226; background: #f0ebe0; padding: 20rpx; border-radius: 12rpx; margin-top: 20rpx; line-height: 1.6; }
.knowledge-list { background: #fffdf7; border-radius: 20rpx; padding: 30rpx; }
.k-item { margin-bottom: 20rpx; padding-bottom: 20rpx; border-bottom: 1rpx solid #f0ebe0; }
.k-principle { font-size: 26rpx; font-weight: 600; color: #5b6b52; display: block; }
.k-rule { font-size: 24rpx; color: #3a3226; margin-top: 6rpx; display: block; line-height: 1.5; }
.k-source { font-size: 22rpx; color: #b3a88f; margin-top: 6rpx; display: block; }
</style>