<template>
  <view class="page">
    <view class="hero">
      <text class="hero-title">道枢 · 东方智慧AI数字人</text>
      <text class="hero-sub">道，可道也，非恒道也。以经问道，以道处世。</text>
    </view>

    <view class="card" @tap="goChat">
      <view class="card-icon">☯</view>
      <view class="card-body">
        <text class="card-title">问道对话</text>
        <text class="card-desc">与专属数字人深度对话，解行业、择业、处世之惑</text>
      </view>
      <view class="card-arrow">›</view>
    </view>
  </view>
</template>

<script setup lang="ts">
function goChat() {
  uni.navigateTo({ url: '/pages/chat/chat' });
}
</script>

<style scoped>
.page {
  padding: 30rpx;
}
.hero {
  padding: 60rpx 10rpx 40rpx;
  text-align: center;
}
.hero-title {
  font-size: 44rpx;
  font-weight: 700;
  letter-spacing: 6rpx;
  color: #3a3226;
}
.hero-sub {
  margin-top: 14rpx;
  font-size: 26rpx;
  color: #8a7f6a;
}
.card {
  display: flex;
  align-items: center;
  background: #fffdf7;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(90, 80, 60, 0.08);
}
.card-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 18rpx;
  background: #efe6d5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}
.card-body {
  flex: 1;
}
.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #3a3226;
}
.card-desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #8a7f6a;
}
.card-arrow {
  font-size: 40rpx;
  color: #c9c0ae;
}
</style>