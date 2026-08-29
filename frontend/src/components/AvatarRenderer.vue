<template>
  <view class="avatar-wrap">
    <view v-if="photoUrl" class="photo-box" :class="{ talking: speaking }">
      <image class="photo-img" :src="photoUrl" mode="aspectFill" />
      <view class="photo-ring" :class="{ talking: speaking }"></view>
    </view>
    <view v-else-if="showGlbHost" id="glb-host" class="glb-host"></view>
    <canvas
      v-else-if="!useLive2D"
      :id="canvasId"
      :canvas-id="canvasId"
      class="avatar-canvas"
    ></canvas>
    <view v-else id="live2d-host" class="live2d-host"></view>
    <view class="avatar-name">{{ name || '道德经智慧导师' }}</view>
    <view class="avatar-status">
      <text class="dot" :class="{ active: speaking }"></text>
      {{ statusText }}
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, onUnmounted, ref, watch } from 'vue';
import { CanvasAvatar, AvatarMood, Avatar3DParams } from './canvas-avatar';
import { Live2DHandle, mountLive2D } from './live2d-avatar';
import { GlbHandle, mountGlb } from './glb-avatar';
import { LIVE2D_MODEL_URL } from '../env';
import type { AvatarAnimOptions } from './avatar-anim';

const props = defineProps<{
  name?: string;
  speaking?: boolean;
  avatarStyle?: string;
  avatarUrl?: string | null;
  /** 三维头像模型文件 URL（.glb），存在时以 three.js 真三维渲染（仅 H5） */
  avatarGlbUrl?: string | null;
  /** 三维立体形象参数（无 .glb 模型时以 3D Canvas 参数化渲染） */
  avatar3dParams?: Avatar3DParams | null;
  /** GLB 动画设置（自转 / 眨眼眼神 / 口型同步） */
  animOptions?: AvatarAnimOptions | null;
  mood?: AvatarMood;
}>();

const canvasId = 'dh-avatar';
const useLive2D = ref(false);
const showGlbHost = ref(false);
const canvasAvatar = ref<CanvasAvatar | null>(null);
let live2d: Live2DHandle | null = null;
let glb: GlbHandle | null = null;
let inst: ReturnType<typeof getCurrentInstance> = null;

/** 有 .glb 模型 → 真三维渲染通道；否则参数化 3D Canvas 回落 */
const useGlb = computed(() => !!props.avatarGlbUrl);
const use3D = computed(() => useGlb.value || !!props.avatar3dParams || props.avatarStyle === '3d');
const photoUrl = computed(() => (!use3D.value && props.avatarUrl ? props.avatarUrl : ''));
const statusText = computed(() => {
  if (props.speaking) return '言说中…';
  if (props.mood === 'thinking') return '参悟中…';
  return '静候开示';
});

async function init() {
  if (useGlb.value) {
    // #ifdef H5
    showGlbHost.value = true;
    await new Promise((r) => setTimeout(r, 0)); // 等待 DOM 渲染
    const host = document.getElementById('glb-host');
    if (host) {
      glb = await mountGlb(host, props.avatarGlbUrl as string, props.animOptions ?? undefined);
    }
    // #endif
    if (!glb) {
      // GLB 渲染不可用（非 H5 或加载失败）→ 回落参数化 3D
      showGlbHost.value = false;
    } else {
      glb.setSpeaking(!!props.speaking);
      return;
    }
  }
  if (use3D.value) {
    canvasAvatar.value = new CanvasAvatar(
      canvasId,
      inst?.proxy,
      props.avatarStyle,
      props.avatar3dParams ?? null,
    );
    canvasAvatar.value.setMood(props.mood ?? 'calm');
    canvasAvatar.value.start();
    return;
  }
  if (photoUrl.value) return; // 照片模式无需 Canvas/Live2D
  if (LIVE2D_MODEL_URL) {
    // #ifdef H5
    const host = document.getElementById('live2d-host');
    if (host) {
      live2d = await mountLive2D(host, LIVE2D_MODEL_URL);
      useLive2D.value = !!live2d;
    }
    // #endif
  }
  if (!useLive2D.value && !photoUrl.value) {
    canvasAvatar.value = new CanvasAvatar(canvasId, inst?.proxy, props.avatarStyle);
    canvasAvatar.value.setMood(props.mood ?? 'calm');
    canvasAvatar.value.start();
  }
}

/** 形象来源变化（换头像/重设/3D 参数生成）时重建渲染器 */
function teardown() {
  canvasAvatar.value?.stop();
  canvasAvatar.value = null;
  live2d?.destroy();
  live2d = null;
  glb?.destroy();
  glb = null;
  useLive2D.value = false;
  showGlbHost.value = false;
}

onMounted(async () => {
  inst = getCurrentInstance();
  await init();
});

watch(
  () => [props.avatarUrl, props.avatarStyle, props.avatar3dParams, props.avatarGlbUrl],
  async () => {
    teardown();
    await init();
  },
);

watch(
  () => props.speaking,
  (v) => {
    canvasAvatar.value?.setSpeaking(!!v);
    glb?.setSpeaking(!!v);
  },
);

/** 动画设置变化：实时生效，无需重建渲染器 */
watch(
  () => props.animOptions,
  (v) => {
    if (v && glb) glb.setOptions(v);
  },
  { deep: true },
);

watch(
  () => props.mood,
  (m) => canvasAvatar.value?.setMood(m ?? 'calm'),
);

onUnmounted(() => {
  teardown();
});
</script>

<style scoped>
.avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12rpx 0 4rpx;
}
.avatar-canvas {
  width: 320rpx;
  height: 400rpx;
}
.glb-host {
  width: 320rpx;
  height: 400rpx;
}
.live2d-host {
  width: 320rpx;
  height: 400rpx;
}
.photo-box {
  position: relative;
  width: 240rpx;
  height: 240rpx;
  animation: photo-breath 4s ease-in-out infinite;
}
.photo-img {
  width: 240rpx;
  height: 240rpx;
  border-radius: 50%;
  border: 6rpx solid #e8dfc8;
  box-shadow: 0 6rpx 20rpx rgba(90, 80, 60, 0.18);
}
.photo-ring {
  position: absolute;
  top: -12rpx;
  left: -12rpx;
  width: 264rpx;
  height: 264rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(122, 156, 109, 0);
  transition: border-color 0.3s;
}
.photo-ring.talking {
  border-color: rgba(122, 156, 109, 0.8);
  animation: ring-pulse 1.2s ease-out infinite;
}
@keyframes photo-breath {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}
@keyframes ring-pulse {
  0% {
    transform: scale(0.96);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.12);
    opacity: 0;
  }
}
.avatar-name {
  margin-top: 4rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #3a3226;
  letter-spacing: 4rpx;
}
.avatar-status {
  display: flex;
  align-items: center;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #8a7f6a;
}
.dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #c9c0ae;
  margin-right: 8rpx;
}
.dot.active {
  background: #7a9c6d;
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>
