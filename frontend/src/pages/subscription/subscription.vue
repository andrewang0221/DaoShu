<template>
  <view class="page">
    <TaijiBackButton floating />
    <view class="hero">
      <view class="hero-title">订阅与升级</view>
      <view class="hero-sub">体验 → Pro → 企业 · 三级火箭</view>
    </view>

    <!-- 当前计划 -->
    <view v-if="myPlan" class="current-card">
      <view class="current-badge">{{ myPlan.tier === 'free' ? '体验版' : myPlan.tier === 'pro' ? 'Pro 会员' : '企业版' }}</view>
      <view class="current-name">{{ myPlan.name }}</view>
      <view v-if="myPlan.tier !== 'free'" class="current-note">有效期至：{{ myPlan.expiresAt || '永久' }}</view>
    </view>

    <!-- 计划列表 -->
    <view class="section">
      <view class="section-title">选择计划</view>
      <view v-for="(plan, i) in plans" :key="i" class="plan-card" :class="{ active: selectedPlan?.code === plan.code }" @tap="selectPlan(plan)">
        <view class="plan-header">
          <view class="plan-name">{{ plan.name }}</view>
          <view class="plan-price">
            <text v-if="plan.priceMonthly > 0" class="price-month">{{ plan.priceMonthly }} 元/月</text>
            <text v-if="plan.priceYearly > 0" class="price-year">{{ plan.priceYearly }} 元/年</text>
            <text v-if="plan.priceMonthly === 0 && plan.priceYearly === 0" class="price-free">免费</text>
          </view>
        </view>
        <view class="plan-desc">{{ plan.tagline }}</view>
        <view class="plan-benefits">
          <view v-for="(b, j) in plan.benefits || []" :key="j" class="benefit-item">✓ {{ b }}</view>
        </view>
      </view>
    </view>

    <!-- 购买 -->
    <view v-if="selectedPlan && selectedPlan.tier !== 'free'" class="section">
      <view class="order-card">
        <view class="order-title">开通 {{ selectedPlan.name }}</view>
        <view class="order-amount">{{ selectedPlan.priceYearly }} 元/年</view>
        <view class="btn primary" @tap="doPurchase" :class="{ disabled: purchasing }">
          {{ purchasing ? '处理中...' : '立即开通（演示模式模拟成功）' }}
        </view>
      </view>
    </view>

    <!-- 权益展示 -->
    <view v-if="myFeatures.length" class="section">
      <view class="section-title">我的权益（演示模式已默认开通 Pro 权益）</view>
      <view v-for="(f, i) in myFeatures" :key="i" class="feature-item">
        <text class="feature-check">✓</text>
        <text class="feature-name">{{ featureLabel(f) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../api';
import TaijiBackButton from '../../components/TaijiBackButton.vue';
import { useAppStore } from '../../store';

const store = useAppStore();
store.restore();

const plans = ref<any[]>([]);
const selectedPlan = ref<any>(null);
const myPlan = ref<any>(null);
const myFeatures = ref<any[]>([]);
const purchasing = ref(false);

const FEATURE_LABELS: Record<string, string> = {
  daily: '每日一课 + 每日箴言卡',
  quiz: '道系人格测试（16 型）',
  ask_3: '每月 3 次深度问道',
  ask_unlimited: '自由问道（无限次）',
  sos_5: '焦虑急救基础版（5 次/月）',
  sos_unlimited: '焦虑急救不限次 + 每周复盘',
  industry_3: '行业包 ×3（管理/心理/处世任选）',
  industry_all: '全行业 Agent 包',
  review: '每周情绪复盘',
  cognitive_profile: '认知档案与成长时间线',
  evolution_1_2x: '数字人进化加速 1.2 倍',
  api_free: '道枢 API 免费层（每日 500 次）',
  runtime_api: '道枢 Runtime 私有化注入包',
  audit_api: '四维审计 API',
  training: '《无为而治》内部培训',
  data_isolated: '租户级数据隔离 + SLA 99.9%',
};

function featureLabel(code: string) {
  return FEATURE_LABELS[code] || code;
}

onMounted(async () => {
  try {
    plans.value = await api.subscriptionPlans();
    if (store.isLoggedIn) await loadMyPlan();
  } catch {
    uni.showToast({ title: '加载计划失败', icon: 'none' });
  }
});

async function loadMyPlan() {
  try {
    const r = await api.subscriptionMy();
    myPlan.value = r.currentPlan;
    myFeatures.value = r.features || [];
  } catch {
    uni.showToast({ title: '加载权益失败', icon: 'none' });
  }
}

function selectPlan(plan: any) {
  selectedPlan.value = plan;
}

async function doPurchase() {
  if (!selectedPlan.value) return;
  if (!store.isLoggedIn) {
    uni.showModal({
      title: '请先登录',
      content: '开通订阅计划需要先登录账号',
      confirmText: '去登录',
      success: (r) => {
        if (r.confirm) uni.navigateTo({ url: '/pages/login/login' });
      },
    });
    return;
  }
  purchasing.value = true;
  try {
    const r = await api.subscriptionOrder(selectedPlan.value.code);
    if (r.order?.status === 'paid') {
      uni.showToast({ title: '开通成功（演示模式）', icon: 'success' });
      await loadMyPlan();
    }
  } catch {
    uni.showToast({ title: '开通失败', icon: 'none' });
  }
  purchasing.value = false;
}
</script>

<style scoped>
.page { padding: 30rpx; background: #f7f3ea; min-height: 100vh; }
.hero { padding: 40rpx 10rpx 30rpx; text-align: center; }
.hero-title { font-size: 44rpx; font-weight: 700; letter-spacing: 6rpx; color: #3a3226; }
.hero-sub { margin-top: 12rpx; font-size: 26rpx; color: #8a7f6a; }
.current-card { background: linear-gradient(135deg, #5b6b52, #7a8a6a); border-radius: 24rpx; padding: 40rpx; text-align: center; color: #fdfaf2; margin-bottom: 30rpx; }
.current-badge { display: inline-block; font-size: 22rpx; background: rgba(255, 255, 255, 0.2); padding: 8rpx 24rpx; border-radius: 30rpx; margin-bottom: 16rpx; }
.current-name { font-size: 36rpx; font-weight: 600; letter-spacing: 4rpx; }
.current-note { font-size: 24rpx; opacity: 0.85; margin-top: 8rpx; }
.section { margin-bottom: 40rpx; }
.section-title { font-size: 30rpx; font-weight: 600; color: #3a3226; margin-bottom: 20rpx; padding-left: 16rpx; border-left: 6rpx solid #b8a477; }
.plan-card { background: #fffdf7; border-radius: 20rpx; padding: 30rpx; margin-bottom: 20rpx; box-shadow: 0 4rpx 16rpx rgba(90, 80, 60, 0.06); border: 2rpx solid transparent; }
.plan-card.active { border-color: #5b6b52; }
.plan-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.plan-name { font-size: 32rpx; font-weight: 600; color: #3a3226; }
.plan-price { display: flex; flex-direction: column; align-items: flex-end; }
.price-month { font-size: 24rpx; color: #8a7f6a; }
.price-year { font-size: 32rpx; font-weight: 700; color: #5b6b52; }
.price-free { font-size: 28rpx; font-weight: 600; color: #5b6b52; }
.plan-desc { font-size: 24rpx; color: #8a7f6a; margin-bottom: 16rpx; }
.plan-benefits { display: flex; flex-wrap: wrap; gap: 12rpx; }
.benefit-item { font-size: 22rpx; color: #5b6b52; background: #e8f0e4; padding: 8rpx 16rpx; border-radius: 20rpx; }
.order-card { background: #fffdf7; border-radius: 20rpx; padding: 40rpx; text-align: center; }
.order-title { font-size: 32rpx; font-weight: 600; color: #3a3226; margin-bottom: 12rpx; }
.order-amount { font-size: 48rpx; font-weight: 700; color: #5b6b52; margin-bottom: 30rpx; }
.btn { padding: 20rpx 40rpx; border-radius: 40rpx; text-align: center; font-size: 28rpx; font-weight: 600; }
.btn.primary { background: #5b6b52; color: #fdfaf2; }
.btn.disabled { background: #d8cfba; }
.feature-item { display: flex; align-items: center; background: #fffdf7; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.feature-check { font-size: 28rpx; color: #5b6b52; margin-right: 16rpx; }
.feature-name { font-size: 28rpx; font-weight: 600; color: #3a3226; flex: 1; }
.feature-desc { font-size: 22rpx; color: #8a7f6a; }
</style>