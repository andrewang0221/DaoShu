<template>
  <view
    class="tj-back"
    :class="{ 'tj-floating': floating }"
    hover-class="tj-pressed"
    :hover-stay-time="120"
    @tap="onBack"
  >
    <view class="taiji"></view>
    <text class="tj-arrow">←</text>
  </view>
</template>

<script setup lang="ts">
// 太极图返回按钮：内联形态用于深色导航栏，floating 形态悬浮于无导航栏页面
withDefaults(defineProps<{ floating?: boolean }>(), { floating: false });

function onBack() {
  uni.navigateBack({
    delta: 1,
    fail: () => {
      uni.switchTab({
        url: '/pages/index/index',
        fail: () => uni.reLaunch({ url: '/pages/index/index' }),
      });
    },
  });
}
</script>

<style scoped>
.tj-back {
  position: relative;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  border: 3rpx solid var(--color-gold);
  background: #fdfbf5;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.tj-pressed {
  transform: scale(0.88);
}

/* 阴阳鱼：半白半墨，S 形由两个半圆鱼眼圆构成 */
.taiji {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(90deg, #fdfbf5 0 50%, #22303f 50% 100%);
  animation: tj-spin 48s linear infinite;
}

.taiji::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 50%;
  height: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, #fdfbf5 0 24%, #22303f 24% 100%);
}

.taiji::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 50%;
  height: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, #22303f 0 24%, #fdfbf5 24% 100%);
}

/* 返回箭头：朱砂色，阴阳两半上均清晰可见 */
.tj-arrow {
  position: relative;
  z-index: 2;
  color: var(--color-cinnabar);
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1;
  text-shadow:
    0 0 4rpx rgba(253, 251, 245, 0.95),
    0 1rpx 2rpx rgba(0, 0, 0, 0.35);
  margin-right: 4rpx;
}

/* 悬浮形态：无导航栏页面固定于左上角 */
.tj-floating {
  position: fixed;
  top: calc(20rpx + env(safe-area-inset-top));
  left: 24rpx;
  width: 84rpx;
  height: 84rpx;
  z-index: 999;
  box-shadow: 0 6rpx 20rpx rgba(26, 26, 46, 0.35);
}

.tj-floating .tj-arrow {
  font-size: 40rpx;
}

@keyframes tj-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 尊重系统减弱动态偏好 */
@media (prefers-reduced-motion: reduce) {
  .taiji { animation: none; }
}
</style>
