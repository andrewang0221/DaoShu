<template>
  <view v-if="open" class="sheet-mask" @tap="emit('close')">
    <view class="sheet" @tap.stop>
      <view class="sheet-title">⚙️ 动画设置</view>

      <view class="s-row">
        <view class="s-name">自转</view>
        <view class="s-chips">
          <view
            v-for="o in rotOptions"
            :key="o.value"
            class="s-chip"
            :class="{ on: value.rotationSpeed === o.value }"
            @tap="update({ rotationSpeed: o.value })"
          >{{ o.label }}</view>
        </view>
      </view>

      <view class="s-row">
        <view class="s-name">眨眼 + 眼神</view>
        <view class="s-chips">
          <view class="s-chip" :class="{ on: value.blinkEnabled }" @tap="update({ blinkEnabled: true })">开</view>
          <view class="s-chip" :class="{ on: !value.blinkEnabled }" @tap="update({ blinkEnabled: false })">关</view>
        </view>
      </view>

      <view class="s-row">
        <view class="s-name">口型跟语音同步</view>
        <view class="s-chips">
          <view class="s-chip" :class="{ on: value.mouthSync }" @tap="update({ mouthSync: true })">开</view>
          <view class="s-chip" :class="{ on: !value.mouthSync }" @tap="update({ mouthSync: false })">关</view>
        </view>
      </view>

      <view class="s-tip">设置实时生效，语音播报时数字人会张嘴、眨眼并看向镜头</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { AvatarAnimOptions } from './avatar-anim';

const props = defineProps<{ open: boolean; value: AvatarAnimOptions }>();
const emit = defineEmits<{ close: []; change: [opts: AvatarAnimOptions] }>();
// 注意：从 avatar-anim 导入常量会因 uni-app 分包 hoist 问题产生跨 chunk 引用错误，故本地定义
const rotOptions = [
  { value: 0, label: '不转' },
  { value: 0.15, label: '慢' },
  { value: 0.4, label: '中' },
  { value: 0.8, label: '快' },
] as const;

function update(patch: Partial<AvatarAnimOptions>) {
  emit('change', { ...props.value, ...patch });
}
</script>

<style scoped>
.sheet-mask {
  position: fixed;
  inset: 0;
  background: rgba(30, 25, 15, 0.45);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  background: #fffdf7;
  border-radius: 28rpx 28rpx 0 0;
  padding: 36rpx 34rpx calc(40rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -8rpx 40rpx rgba(60, 50, 30, 0.2);
}
.sheet-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #3a3226;
  margin-bottom: 28rpx;
  letter-spacing: 2rpx;
}
.s-row {
  margin-bottom: 26rpx;
}
.s-name {
  font-size: 26rpx;
  color: #6a5f4b;
  margin-bottom: 14rpx;
}
.s-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}
.s-chip {
  padding: 12rpx 30rpx;
  border-radius: 30rpx;
  border: 2rpx solid #e0d6bd;
  font-size: 26rpx;
  color: #5a4f3d;
  background: #faf6ec;
}
.s-chip.on {
  border-color: #5b6b52;
  background: #eef2e8;
  color: #3a4a32;
  font-weight: 600;
}
.s-tip {
  font-size: 22rpx;
  color: #a2987f;
  line-height: 1.7;
  margin-top: 6rpx;
}
</style>
