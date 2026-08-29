<template>
  <view class="page">
    <view class="mine-card">
      <view class="avatar-circle">☯</view>
      <template v-if="isLoggedIn">
        <view class="mine-name">{{ accountName }}</view>
        <view class="mine-sub">{{ roleLabel }} · {{ store.digitalHuman ? '已认养' : '尚未认养' }}</view>
        <view class="account-grid">
          <view class="account-row">
            <text class="account-label">账号</text>
            <text class="account-value">{{ store.user?.username ?? '—' }}</text>
          </view>
          <view class="account-row">
            <text class="account-label">邮箱</text>
            <text class="account-value">{{ store.user?.email ?? '未绑定' }}</text>
          </view>
          <view class="account-row">
            <text class="account-label">数字人</text>
            <text class="account-value">{{ store.digitalHuman?.name ?? '未认养' }}</text>
          </view>
        </view>
      </template>
      <template v-else>
        <view class="mine-name">游客模式</view>
        <view class="mine-sub">登录后可体验完整功能</view>
        <button class="login-cta" @tap="goLogin">立即登录 / 注册</button>
      </template>
    </view>

    <view class="points-card">
      <view class="points-num">{{ balance }}</view>
      <view class="points-label">我的积分</view>
    </view>

    <view class="section-title">积分商城</view>
    <view v-for="s in shop" :key="s.code" class="shop-item">
      <view class="shop-name">{{ s.name }}</view>
      <view class="shop-cost">{{ s.cost }} 积分</view>
      <view class="shop-btn" :class="{ disabled: balance < s.cost }" @tap="exchange(s.code)">兑换</view>
    </view>

    <view class="section-title">通用设置</view>
    <view class="menu-item" @tap="goIpr">
      <view class="menu-left">
        <text class="menu-icon">©️</text>
        <text class="menu-name">知识产权服务</text>
      </view>
      <view class="menu-right">
        <text class="menu-sub">著作权代办 · 数字存证</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>
    <view class="menu-item" @tap="goLlmSettings">
      <view class="menu-left">
        <text class="menu-icon">🧠</text>
        <text class="menu-name">大模型设置</text>
      </view>
      <view class="menu-right">
        <text class="menu-sub">{{ llmStatusText }}</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <view v-if="isLoggedIn" class="logout-btn" @tap="logout">退出登录</view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api } from '../../api';
import { useAppStore } from '../../store';

const store = useAppStore();
store.restore();

const isLoggedIn = computed(() => store.isLoggedIn);
const accountName = computed(
  () => store.user?.nickname ?? store.user?.username ?? store.user?.email ?? store.user?.phone ?? '已登录',
);
const roleLabel = computed(() => {
  const map: Record<string, string> = {
    admin: '管理员',
    advisor: '顾问',
    certified_contributor: '认证贡献者',
    member: '正式成员',
  };
  return map[store.user?.role ?? 'member'] ?? '成员';
});

const balance = ref(0);
const shop = ref<{ code: string; name: string; cost: number }[]>([]);
const llmEnabled = ref(false);

const llmStatusText = computed(() =>
  llmEnabled.value ? '已启用自定义模型' : '使用系统模型',
);

onShow(async () => {
  store.restore();
  try {
    const acc = await api.points();
    balance.value = acc.balance;
    shop.value = acc.shop;
  } catch {
    // 后端未启动等
  }
  try {
    const s = await api.llmSettings();
    llmEnabled.value = !!s.enabled;
  } catch {
    // 忽略
  }
});

async function exchange(code: string) {
  try {
    const r = await api.exchange(code);
    balance.value = r.balance;
    uni.showToast({ title: `已兑换：${r.item}`, icon: 'success' });
  } catch {
    // 错误已提示
  }
}

function goLogin() {
  uni.navigateTo({ url: '/pages/login/login' });
}

function goLlmSettings() {
  uni.navigateTo({ url: '/pages/llm-settings/llm-settings' });
}

function goIpr() {
  uni.navigateTo({ url: '/pages/ipr/ipr' });
}

function logout() {
  uni.showModal({
    title: '退出登录',
    content: `确定退出当前账号「${accountName.value}」吗？`,
    confirmText: '退出',
    success: (r) => {
      if (!r.confirm) return;
      store.logout();
      uni.showToast({ title: '已退出登录', icon: 'none' });
    },
  });
}
</script>

<style scoped>
.page {
  padding: 30rpx;
}
.mine-card {
  background: linear-gradient(135deg, #5b6b52, #7a8a6a);
  border-radius: 24rpx;
  padding: 50rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fdfaf2;
  margin-bottom: 24rpx;
}
.avatar-circle {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
}
.mine-name {
  margin-top: 20rpx;
  font-size: 36rpx;
  font-weight: 600;
  letter-spacing: 4rpx;
}
.mine-sub {
  margin-top: 8rpx;
  font-size: 24rpx;
  opacity: 0.85;
}
.account-grid {
  width: 100%;
  margin-top: 30rpx;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 16rpx;
  padding: 10rpx 30rpx;
  box-sizing: border-box;
}
.account-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14rpx 0;
}
.account-row + .account-row {
  border-top: 1rpx solid rgba(255, 255, 255, 0.12);
}
.account-label {
  font-size: 24rpx;
  opacity: 0.75;
}
.account-value {
  font-size: 26rpx;
  max-width: 420rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.login-cta {
  margin-top: 30rpx;
  height: 72rpx;
  line-height: 72rpx;
  width: 320rpx;
  background: rgba(255, 255, 255, 0.2);
  color: #fdfaf2;
  font-size: 28rpx;
  border-radius: 36rpx;
  border: none;
}
.login-cta::after {
  border: none;
}
.points-card {
  background: #fffdf7;
  border-radius: 20rpx;
  padding: 40rpx;
  text-align: center;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(90, 80, 60, 0.06);
}
.points-num {
  font-size: 64rpx;
  font-weight: 700;
  color: #5b6b52;
}
.points-label {
  margin-top: 6rpx;
  font-size: 26rpx;
  color: #8a7f6a;
}
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #3a3226;
  margin: 20rpx 0;
}
.shop-item {
  display: flex;
  align-items: center;
  background: #fffdf7;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}
.shop-name {
  flex: 1;
  font-size: 28rpx;
  color: #3a3226;
}
.shop-cost {
  font-size: 26rpx;
  color: #b3a88f;
  margin-right: 20rpx;
}
.shop-btn {
  padding: 10rpx 30rpx;
  border-radius: 30rpx;
  background: #5b6b52;
  color: #fdfaf2;
  font-size: 26rpx;
}
.shop-btn.disabled {
  background: #d8cfba;
}
.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fffdf7;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
}
.menu-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.menu-icon {
  font-size: 32rpx;
}
.menu-name {
  font-size: 28rpx;
  color: #3a3226;
}
.menu-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.menu-sub {
  font-size: 24rpx;
  color: #b3a88f;
}
.menu-arrow {
  font-size: 32rpx;
  color: #c9bfa8;
}
.logout-btn {
  margin-top: 40rpx;
  text-align: center;
  font-size: 26rpx;
  color: #b3a88f;
  padding: 20rpx;
}
</style>
