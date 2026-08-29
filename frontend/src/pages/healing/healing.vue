<template>
  <view class="page">
    <TaijiBackButton floating />
    <view class="hero">
      <view class="hero-title">道家情绪疗愈</view>
      <view class="hero-sub">减焦虑 · 识大道 · 安顿身心</view>
    </view>

    <!-- 情绪识别 -->
    <view class="section">
      <view class="section-title">情绪疏导</view>
      <view class="card">
        <textarea v-model="emotionText" placeholder="说说你现在的感受...（例如：最近工作压力很大，晚上睡不着，很焦虑）" class="text-input" />
        <view class="btn primary" @tap="doAssess" :class="{ disabled: assessing }">
          {{ assessing ? '分析中...' : '情绪识别与疏导' }}
        </view>
      </view>
      <view class="result" v-if="assessResult">
        <view class="emotion-tag" :class="assessResult.riskLevel === 'high' ? 'high' : assessResult.intensity">
          {{ assessResult.emotionLabel }} · {{ assessResult.intensity === 'strong' ? '强烈' : assessResult.intensity === 'mild' ? '中等' : '轻微' }}
          <text v-if="assessResult.riskLevel === 'high'" class="risk-badge">高危信号</text>
        </view>
        <view v-if="assessResult.patternLabel" class="pattern-card">
          <view class="pattern-name">建议练习：{{ assessResult.patternLabel }}</view>
          <view class="pattern-suggestion">{{ assessResult.suggestion }}</view>
        </view>
        <view v-if="assessResult.referral" class="referral-box">
          <view class="referral-title">重要：请寻求专业帮助</view>
          <view class="referral-text">{{ assessResult.referral }}</view>
          <view class="hotline">全国统一心理援助热线：12356（24 小时免费）</view>
        </view>
      </view>
    </view>

    <!-- 焦虑急救 -->
    <view class="section">
      <view class="section-title">焦虑急救（3-5 分钟）</view>
      <view class="card">
        <textarea v-model="sosText" placeholder="我现在很慌，不知道该怎么办..." class="text-input" />
        <view class="btn primary" @tap="doSOS" :class="{ disabled: sosing }">
          {{ sosing ? '引导中...' : '启动急救' }}
        </view>
      </view>
      <view class="result" v-if="sosResult">
        <view v-if="sosResult.riskLevel === 'high'" class="referral-box">
          <view class="referral-title">重要：请寻求专业帮助</view>
          <view class="referral-text">{{ sosResult.referral }}</view>
        </view>
        <view v-else-if="sosResult.steps" class="steps">
          <view class="step-title">{{ sosResult.emotionLabel }}急救指南</view>
          <view v-for="(step, i) in sosResult.steps" :key="i" class="step-item">
            <view class="step-num">{{ i + 1 }}</view>
            <view class="step-content">
              <view class="step-label">{{ step.step }}</view>
              <view class="step-desc">{{ step.guidance }}</view>
            </view>
          </view>
          <view v-if="sosResult.quote" class="quote">{{ sosResult.quote }}</view>
        </view>
      </view>
    </view>

    <!-- 四类练习 -->
    <view class="section">
      <view class="section-title">道家情绪调节练习</view>
      <view v-for="(p, i) in patterns" :key="i" class="pattern-card">
        <view class="pattern-header">
          <text class="pattern-icon">{{ ['☯', '🌊', '🍃', '🔥'][i] }}</text>
          <view class="pattern-title-block">
            <view class="pattern-name">{{ p.label }}</view>
            <view class="pattern-origin">{{ p.origin }} · 对治：{{ p.target }}</view>
          </view>
        </view>
        <view v-for="(prac, j) in p.practice" :key="j" class="practice-row">
          <view class="practice-step">{{ prac.step }}</view>
          <view class="practice-guide">{{ prac.guidance }}</view>
        </view>
        <view class="pattern-quote">{{ p.quote }}</view>
      </view>
    </view>

    <!-- 每周复盘 -->
    <view class="section">
      <view class="section-title">每周复盘</view>
      <view class="card">
        <textarea v-model="weeklyRecords" placeholder="记录本周的情绪变化（一行一天）..." class="text-input" />
        <view class="btn primary" @tap="doWeeklyReview" :class="{ disabled: reviewing }">
          {{ reviewing ? '生成中...' : '生成复盘' }}
        </view>
      </view>
      <view class="result" v-if="weeklyResult">
        <view class="review-title">{{ weeklyResult.template.title }}</view>
        <view v-for="(s, i) in weeklyResult.template.sections" :key="i" class="review-section">
          <view class="review-section-title">{{ i + 1 }}. {{ s.key }}</view>
          <view class="review-section-desc">{{ s.desc }}</view>
        </view>
        <view v-if="weeklyResult.quote" class="quote">{{ weeklyResult.quote }}</view>
        <view v-if="weeklyResult.tip" class="review-tip">{{ weeklyResult.tip }}</view>
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

const emotionText = ref('');
const assessResult = ref<any>(null);
const assessing = ref(false);

const sosText = ref('');
const sosResult = ref<any>(null);
const sosing = ref(false);

const patterns = ref<any[]>([]);

const weeklyRecords = ref('');
const weeklyResult = ref<any>(null);
const reviewing = ref(false);

onMounted(async () => {
  try {
    patterns.value = await api.healingPatterns();
  } catch {
    uni.showToast({ title: '加载练习失败', icon: 'none' });
  }
});

async function doAssess() {
  if (!emotionText.value.trim()) return;
  if (!requireLogin('情绪识别')) return;
  assessing.value = true;
  try {
    assessResult.value = await api.healingAssess(emotionText.value);
  } catch {
    uni.showToast({ title: '识别失败', icon: 'none' });
  }
  assessing.value = false;
}

async function doSOS() {
  if (!sosText.value.trim()) return;
  if (!requireLogin('焦虑急救')) return;
  sosing.value = true;
  try {
    sosResult.value = await api.healingSOS(sosText.value);
  } catch {
    uni.showToast({ title: '急救启动失败', icon: 'none' });
  }
  sosing.value = false;
}

async function doWeeklyReview() {
  const records = weeklyRecords.value.split('\n').filter(s => s.trim());
  if (!requireLogin('每周复盘')) return;
  reviewing.value = true;
  try {
    weeklyResult.value = await api.healingWeeklyReview(records);
  } catch {
    uni.showToast({ title: '生成失败', icon: 'none' });
  }
  reviewing.value = false;
}
</script>

<style scoped>
.page { padding: 30rpx; background: #f7f3ea; min-height: 100vh; }
.hero { padding: 40rpx 10rpx 30rpx; text-align: center; }
.hero-title { font-size: 44rpx; font-weight: 700; letter-spacing: 6rpx; color: #3a3226; }
.hero-sub { margin-top: 12rpx; font-size: 26rpx; color: #8a7f6a; }
.section { margin-bottom: 40rpx; }
.section-title { font-size: 30rpx; font-weight: 600; color: #3a3226; margin-bottom: 20rpx; padding-left: 16rpx; border-left: 6rpx solid #7a8a6a; }
.card { background: #fffdf7; border-radius: 20rpx; padding: 30rpx; margin-bottom: 20rpx; box-shadow: 0 4rpx 16rpx rgba(90, 80, 60, 0.06); }
.text-input { width: 100%; height: 160rpx; border: 2rpx solid #e0d8c8; border-radius: 12rpx; padding: 16rpx; font-size: 26rpx; color: #3a3226; box-sizing: border-box; }
.btn { padding: 20rpx 40rpx; border-radius: 40rpx; text-align: center; font-size: 28rpx; font-weight: 600; margin-top: 20rpx; }
.btn.primary { background: #7a8a6a; color: #fdfaf2; }
.btn.disabled { background: #d8cfba; }
.result { background: #fffdf7; border-radius: 20rpx; padding: 30rpx; margin-bottom: 20rpx; }
.emotion-tag { font-size: 28rpx; font-weight: 600; padding: 20rpx; border-radius: 12rpx; margin-bottom: 20rpx; }
.emotion-tag.strong { background: #f9e8e8; color: #c44; }
.emotion-tag.mild { background: #fff8f0; color: #b8a477; }
.emotion-tag.calm { background: #e8f0e4; color: #5b6b52; }
.emotion-tag.high { background: #f9e8e8; color: #c44; border: 2rpx solid #c44; }
.risk-badge { font-size: 22rpx; background: #c44; color: #fff; padding: 4rpx 16rpx; border-radius: 20rpx; margin-left: 16rpx; }
.pattern-card { background: #fffdf7; border-radius: 20rpx; padding: 30rpx; margin-bottom: 20rpx; }
.pattern-header { display: flex; align-items: flex-start; margin-bottom: 20rpx; }
.pattern-icon { font-size: 48rpx; margin-right: 20rpx; }
.pattern-title-block { flex: 1; }
.pattern-name { font-size: 28rpx; font-weight: 600; color: #3a3226; }
.pattern-origin { font-size: 22rpx; color: #8a7f6a; margin-top: 4rpx; }
.practice-row { padding: 12rpx 0; border-bottom: 1rpx solid #f0ebe0; }
.practice-step { font-size: 26rpx; font-weight: 600; color: #5b6b52; }
.practice-guide { font-size: 24rpx; color: #3a3226; margin-top: 6rpx; line-height: 1.5; }
.pattern-quote { font-size: 24rpx; color: #8a7f6a; font-style: italic; margin-top: 16rpx; padding: 16rpx; background: #f7f3ea; border-radius: 8rpx; }
.referral-box { background: #f9e8e8; border: 2rpx solid #c44; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.referral-title { font-size: 28rpx; font-weight: 600; color: #c44; margin-bottom: 12rpx; }
.referral-text { font-size: 26rpx; color: #3a3226; line-height: 1.6; }
.hotline { font-size: 28rpx; font-weight: 600; color: #c44; margin-top: 16rpx; text-align: center; }
.steps { background: #fffdf7; border-radius: 20rpx; padding: 30rpx; }
.step-title { font-size: 28rpx; font-weight: 600; color: #3a3226; margin-bottom: 20rpx; text-align: center; }
.step-item { display: flex; margin-bottom: 24rpx; }
.step-num { width: 48rpx; height: 48rpx; border-radius: 50%; background: #7a8a6a; color: #fff; font-size: 24rpx; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; flex-shrink: 0; }
.step-label { font-size: 28rpx; font-weight: 600; color: #3a3226; }
.step-desc { font-size: 24rpx; color: #8a7f6a; margin-top: 6rpx; line-height: 1.5; }
.step-duration { font-size: 22rpx; color: #b3a88f; margin-top: 6rpx; }
.quote { font-size: 26rpx; color: #5b6b52; font-style: italic; text-align: center; margin-top: 24rpx; padding: 20rpx; background: #f0ebe0; border-radius: 8rpx; }
.review-title { font-size: 32rpx; font-weight: 700; color: #3a3226; text-align: center; margin-bottom: 20rpx; }
.review-section { padding: 16rpx 0; border-bottom: 1rpx solid #f0ebe0; }
.review-section-title { font-size: 26rpx; font-weight: 600; color: #5b6b52; }
.review-section-desc { font-size: 24rpx; color: #3a3226; margin-top: 6rpx; line-height: 1.5; }
.review-tip { font-size: 22rpx; color: #8a7f6a; margin-top: 16rpx; }
.review-template { font-size: 26rpx; color: #3a3226; line-height: 1.6; white-space: pre-wrap; }
</style>