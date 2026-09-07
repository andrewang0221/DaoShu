<template>
  <view class="page">
    <TaijiBackButton floating />
    <view class="intro">
      <template v-if="isReset">
        重新设定你的数字人 —— 可更换名号与形象；选择「三维立体」可由照片生成 .glb 三维模型，或直接上传现成模型文件。
      </template>
      <template v-else>
        你的价值观初测已完成。现在为你的数字人命名，选择形象 —— 它将与你同行、随你成长。
      </template>
    </view>

    <view class="form-card">
      <view class="label">数字人名号</view>
      <input v-model="name" class="input" placeholder="如：青玄子、守拙、静笃" maxlength="12" />

      <view class="label">形象风格</view>
      <view class="style-grid">
        <view
          v-for="s in styles"
          :key="s.value"
          class="style-item"
          :class="{ picked: style === s.value }"
          @tap="style = s.value"
        >
          <view class="style-emoji">{{ s.emoji }}</view>
          <view class="style-name">{{ s.label }}</view>
        </view>
      </view>
      <view class="tip">老子/孔子/庄子/墨子为历史人物预设，一键化身先贤；古老/现代/抽象为通用形象；「三维立体」支持照片生成 .glb 模型或直接上传模型文件</view>

      <template v-if="style === '3d'">
        <view class="label">人物照片（用于生成三维模型）</view>
        <view class="photo-row" @tap="choosePhoto">
          <image v-if="avatarLocal" class="photo-preview" :src="avatarLocal" mode="aspectFill" />
          <view v-else class="photo-empty">
            <view class="photo-plus">＋</view>
            <view class="photo-hint">上传照片（JPG/PNG/WebP，≤5MB）</view>
          </view>
          <view v-if="avatarLocal" class="photo-remove" @tap.stop="removePhoto">✕</view>
        </view>

        <view class="glb-actions">
          <view class="glb-btn primary" :class="{ disabled: glbGenerating || !avatarLocal }" @tap="generateGlb">
            {{ glbGenerating ? '生成中…' : '由照片生成 3D 模型' }}
          </view>
          <view class="glb-btn" :class="{ disabled: glbGenerating }" @tap="chooseGlb">直接上传 GLB 模型</view>
        </view>
        <view class="glb-btn studio-btn" @tap="openStudio">🎭 本地生成三维头像（照片不出浏览器，自带口型表情）</view>
        <view v-if="glbGenerating" class="tip uploading">3D 模型生成中，约需数十秒至几分钟…</view>
        <view v-else-if="glbMsg" class="tip" :class="{ ok: glbOk }">{{ glbMsg }}</view>
        <view v-else-if="!glbUrl" class="tip">
          由照片生成 .glb 三维模型（需已接入 Instant-Avatar / DreamFace 生成服务）；或直接上传外部工具产出的 .glb 文件。无模型时可手动定制下方参数化形象
        </view>

        <template v-if="!glbUrl && params3d">
          <view class="label">手动定制（无 GLB 模型时的参数化形象）</view>
          <view class="custom-panel">
          <view class="c-row">
            <view class="c-name">性别</view>
            <view class="c-chips">
              <view
                v-for="g in genderOpts"
                :key="g.value"
                class="c-chip"
                :class="{ on: params3d.gender === g.value }"
                @tap="params3d!.gender = g.value"
              >{{ g.label }}</view>
            </view>
          </view>
          <view class="c-row">
            <view class="c-name">发型</view>
            <view class="c-chips">
              <view
                v-for="h in hairOpts"
                :key="h.value"
                class="c-chip"
                :class="{ on: params3d.hairStyle === h.value }"
                @tap="params3d!.hairStyle = h.value"
              >{{ h.label }}</view>
            </view>
          </view>
          <view class="c-row">
            <view class="c-name">肤色</view>
            <view class="c-swatches">
              <view
                v-for="c in skinColors"
                :key="c"
                class="c-swatch"
                :class="{ on: params3d.skin === c }"
                :style="{ background: c }"
                @tap="params3d!.skin = c"
              />
            </view>
          </view>
          <view class="c-row">
            <view class="c-name">发色</view>
            <view class="c-swatches">
              <view
                v-for="c in hairColors"
                :key="c"
                class="c-swatch"
                :class="{ on: params3d.hair === c }"
                :style="{ background: c }"
                @tap="setHair(c)"
              />
            </view>
          </view>
          <view class="c-row">
            <view class="c-name">衣色</view>
            <view class="c-swatches">
              <view
                v-for="c in clothColors"
                :key="c"
                class="c-swatch"
                :class="{ on: params3d.cloth === c }"
                :style="{ background: c }"
                @tap="params3d!.cloth = c"
              />
            </view>
          </view>
          <view class="c-row">
            <view class="c-name">配饰</view>
            <view class="c-chips">
              <view class="c-chip" :class="{ on: params3d.glasses }" @tap="params3d!.glasses = !params3d!.glasses">眼镜</view>
              <view class="c-chip" :class="{ on: params3d.beard }" @tap="params3d!.beard = !params3d!.beard">胡须</view>
            </view>
          </view>
          <view class="tip">定制参数实时同步到预览；生成/上传 GLB 后以真三维模型渲染</view>
          </view>
        </template>

        <view class="preview-box">
          <view class="label-row">
            <view class="label">{{ glbUrl ? '三维模型预览' : '三维形象预览' }}</view>
            <view v-if="glbUrl" class="anim-btn" @tap="animSheet = true">⚙️ 动画</view>
          </view>
          <AvatarRenderer
            :name="name || '未命名'"
            avatar-style="3d"
            :avatar-url="null"
            :avatar-glb-url="glbUrl || null"
            :avatar3d-params="params3d"
            :anim-options="animOpts"
          />
        </view>
      </template>

      <template v-else>
        <view class="label">人物照片（可选 · 形象参考）</view>
        <view class="photo-row" @tap="choosePhoto">
          <image v-if="avatarLocal" class="photo-preview" :src="avatarLocal" mode="aspectFill" />
          <view v-else class="photo-empty">
            <view class="photo-plus">＋</view>
            <view class="photo-hint">上传照片（JPG/PNG/WebP，≤5MB）</view>
          </view>
          <view v-if="avatarLocal" class="photo-remove" @tap.stop="removePhoto">✕</view>
        </view>
        <view v-if="uploading" class="tip uploading">照片上传中…</view>
      </template>
    </view>

    <view class="submit-btn" :class="{ disabled: !name.trim() || submitting }" @tap="create">
      {{ isReset ? '☯ 焕新数字人' : '☯ 缔结认养契约' }}
    </view>

    <AvatarAnimSheet :open="animSheet" :value="animOpts" @close="animSheet = false" @change="onAnimChange" />
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { api } from '../../api';
import TaijiBackButton from '../../components/TaijiBackButton.vue';
import { getToken } from '../../api/request';
import { useAppStore } from '../../store';
import AvatarRenderer from '../../components/AvatarRenderer.vue';
import { DEFAULT_3D_PARAMS, type Avatar3DParams } from '../../components/canvas-avatar';

const store = useAppStore();
store.restore();
const name = ref('');
const style = ref('ancient_male');
const styles = [
  { value: 'laozi', label: '老子', emoji: '🧙' },
  { value: 'confucius', label: '孔子', emoji: '📜' },
  { value: 'zhuangzi', label: '庄子', emoji: '🐟' },
  { value: 'mozi', label: '墨子', emoji: '🛠' },
  { value: 'ancient_male', label: '古老 · 男', emoji: '👴' },
  { value: 'ancient_female', label: '古老 · 女', emoji: '👵' },
  { value: 'modern_male', label: '现代 · 男', emoji: '🧑' },
  { value: 'modern_female', label: '现代 · 女', emoji: '👩' },
  { value: 'abstract', label: '抽象水墨', emoji: '☯' },
  { value: '2d_cartoon', label: '国风卡通', emoji: '🧙' },
  { value: '2d_real', label: '2D 真人', emoji: '✨' },
  { value: '3d', label: '三维立体', emoji: '🧊' },
];

/** 重设模式：chat 页「重新设置数字人」进入，预填当前形象 */
const isReset = ref(false);
const avatarLocal = ref('');
const avatarUrl = ref('');
const uploading = ref(false);
const submitting = ref(false);
/** 三维模型（.glb）：生成服务产出或直接上传 */
const glbUrl = ref('');
const glbGenerating = ref(false);
const glbMsg = ref('');
const glbOk = ref(false);
/** 无 GLB 模型时的参数化形象回落 */
const params3d = ref<Avatar3DParams | null>(null);

/** 三维模型动画设置（自转/眨眼眼神/口型同步），与聊天页共用持久化。
 * 注意：从 avatar-anim 导入函数会因 uni-app 分包 hoist 问题产生跨 chunk 引用错误，故本地实现 */
const ANIM_ROT_VALUES = [0, 0.15, 0.4, 0.8];
function loadAnimOptions(): AvatarAnimOptions {
  try {
    const rot = parseFloat(uni.getStorageSync('ddj_anim_rot') ?? '');
    const blink = uni.getStorageSync('ddj_anim_blink');
    const mouth = uni.getStorageSync('ddj_anim_mouth');
    return {
      rotationSpeed: ANIM_ROT_VALUES.includes(rot) ? rot : 0.15,
      blinkEnabled: blink === '' || blink === undefined ? true : blink !== '0',
      mouthSync: mouth === '' || mouth === undefined ? true : mouth !== '0',
    };
  } catch {
    return { rotationSpeed: 0.15, blinkEnabled: true, mouthSync: true };
  }
}
function saveAnimOptions(opts: AvatarAnimOptions): void {
  uni.setStorageSync('ddj_anim_rot', String(opts.rotationSpeed));
  uni.setStorageSync('ddj_anim_blink', opts.blinkEnabled ? '1' : '0');
  uni.setStorageSync('ddj_anim_mouth', opts.mouthSync ? '1' : '0');
}
const animOpts = ref<AvatarAnimOptions>(loadAnimOptions());
const animSheet = ref(false);
function onAnimChange(opts: AvatarAnimOptions) {
  animOpts.value = opts;
  saveAnimOptions(opts);
}

const MAX_BYTES = 5 * 1024 * 1024;

// ---------- 三维形象手动定制 ----------
const genderOpts = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
] as const;
const hairOpts = [
  { value: 'short', label: '短发' },
  { value: 'long', label: '长发' },
  { value: 'bun', label: '发髻' },
  { value: 'cloud', label: '云鬓' },
  { value: 'buzz', label: '寸头' },
  { value: 'ponytail', label: '马尾' },
] as const;
const skinColors = ['#f5dcc0', '#f0d2b0', '#e8c09a', '#d9a878', '#b9825e', '#8d5a3b'];
const hairColors = ['#191513', '#3b2f28', '#5a4632', '#8a6a45', '#b08a5a', '#d9c49a', '#6e6e73', '#a3552e'];
const clothColors = ['#5b6b52', '#7a5c43', '#4a5568', '#8a3b3b', '#5d4a6e', '#2f4f4f', '#8c7853', '#3a3226'];

/** 发色同时联动眉毛颜色，观感更自然 */
function setHair(color: string) {
  if (!params3d.value) return;
  params3d.value.hair = color;
  params3d.value.browColor = color;
}

onLoad((opts) => {
  if (opts?.reset === '1' && store.digitalHuman?.id) {
    isReset.value = true;
    const dh = store.digitalHuman;
    name.value = dh.name ?? '';
    style.value = dh.avatarStyle ?? 'ancient_male';
    if (dh.avatarUrl) {
      avatarUrl.value = dh.avatarUrl;
      avatarLocal.value = dh.avatarUrl;
    }
    if (dh.avatarGlbUrl) {
      glbUrl.value = dh.avatarGlbUrl;
      glbOk.value = true;
      glbMsg.value = '已沿用上次的三维模型';
    } else if (dh.avatar3dParams) {
      params3d.value = dh.avatar3dParams as Avatar3DParams;
    }
    // 注：不再异步拉 panel 覆盖预填值——chat 页 resolveDigitalHuman 已保证 store 为服务端最新，
    // 且异步回调会在用户选择风格后返回，把用户刚选的值覆盖回旧值（重置失效 bug 根因）
  }
});

/** 选「三维立体」时：无参数则初始化默认形象供手动定制 */
watch(
  style,
  (v) => {
    if (v !== '3d') return;
    if (!params3d.value) params3d.value = { ...DEFAULT_3D_PARAMS };
  },
  { immediate: true },
);

function choosePhoto() {
  if (uploading.value) return;
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: (res) => {
      const file = res.tempFiles?.[0];
      if (file && file.size > MAX_BYTES) {
        uni.showToast({ title: '照片不能超过 5MB', icon: 'none' });
        return;
      }
      const path = res.tempFilePaths?.[0];
      if (!path) return;
      avatarLocal.value = path;
      uploadPhoto(path);
    },
  });
}

async function uploadPhoto(path: string) {
  uploading.value = true;
  try {
    const res = await api.uploadAvatar(path);
    avatarUrl.value = res.url;
  } catch {
    avatarLocal.value = '';
    avatarUrl.value = '';
  } finally {
    uploading.value = false;
  }
}

/** 照片 → 3D 生成服务（Instant-Avatar / DreamFace 等）→ .glb 模型 */
async function generateGlb() {
  if (glbGenerating.value) return;
  if (!avatarLocal.value || /^https?:\/\//.test(avatarLocal.value)) {
    uni.showToast({ title: '请先重新选择一张本地照片', icon: 'none' });
    return;
  }
  glbGenerating.value = true;
  glbMsg.value = '';
  glbOk.value = false;
  try {
    const res = await api.generateAvatarGlb(avatarLocal.value);
    glbUrl.value = res.glbUrl;
    glbOk.value = true;
    glbMsg.value = '三维模型已生成 ✓';
  } catch (e) {
    glbMsg.value = (e as Error)?.message || '三维模型生成失败，可直接上传 GLB 或手动定制';
  } finally {
    glbGenerating.value = false;
  }
}

/** 直接上传外部工具（Instant-Avatar / DreamFace 等）产出的 .glb 文件 */
function chooseGlb() {
  if (glbGenerating.value) return;
  // #ifdef H5
  uni.chooseFile({
    count: 1,
    extension: ['.glb'],
    success: async (res) => {
      const path = res.tempFilePaths?.[0];
      const file = res.tempFiles?.[0];
      if (!path || !file) return;
      if (file.size > 50 * 1024 * 1024) {
        uni.showToast({ title: '模型文件不能超过 50MB', icon: 'none' });
        return;
      }
      glbGenerating.value = true;
      glbMsg.value = '';
      try {
        const r = await api.uploadGlb(path);
        glbUrl.value = r.url;
        glbOk.value = true;
        glbMsg.value = '三维模型已上传 ✓';
      } catch (e) {
        glbMsg.value = (e as Error)?.message || 'GLB 上传失败';
        glbOk.value = false;
      } finally {
        glbGenerating.value = false;
      }
    },
  });
  // #endif
  // #ifndef H5
  uni.showToast({ title: '请使用 H5 网页版上传 GLB 模型', icon: 'none' });
  // #endif
}

function removePhoto() {
  avatarLocal.value = '';
  avatarUrl.value = '';
  glbUrl.value = '';
  glbMsg.value = '';
  glbOk.value = false;
}

/** 打开本地三维头像工坊（face-to-blendshape-3d，浏览器本地运算，照片不上传） */
function openStudio() {
  // #ifdef H5
  // 打开前显式传递登录令牌（uni 存储格式不透明，工坊页直接读键不可靠）
  localStorage.setItem('dh_bearer_token', getToken());
  window.open('/avatar-studio/?v=2', '_blank');
  // #endif
  // #ifndef H5
  uni.showToast({ title: '请使用 H5 网页版生成三维头像', icon: 'none' });
  // #endif
}

/** 从头像工坊返回：接收生成并上传好的 GLB */
onShow(() => {
  const pending = uni.getStorageSync('dh_pending_glb');
  if (pending) {
    uni.removeStorageSync('dh_pending_glb');
    glbUrl.value = pending;
    glbOk.value = true;
    glbMsg.value = '本地生成的三维头像已就绪 ✓（自带 52 组口型表情通道）';
  }
});

async function create() {
  const n = name.value.trim();
  if (!n || uploading.value || submitting.value) return;
  submitting.value = true;
  uni.showLoading({ title: isReset.value ? '焕新中…' : '缔结契约中…' });
  try {
    const dh = await api.createDigitalHuman({
      name: n,
      avatarStyle: style.value,
      avatarUrl: avatarUrl.value || undefined,
      avatarGlbUrl: style.value === '3d' ? glbUrl.value || undefined : undefined,
      avatar3dParams: style.value === '3d' ? (params3d.value ?? undefined) : undefined,
      quizScores: store.quizScores ?? undefined,
    });
    if (!isReset.value) await api.signContract(dh.id);
    store.setDigitalHuman({
      id: dh.id,
      name: dh.name,
      avatarStyle: dh.avatarStyle,
      avatarUrl: dh.avatarUrl ?? null,
      avatarGlbUrl: dh.avatarGlbUrl ?? null,
      avatar3dParams: (dh.avatar3dParams as Avatar3DParams | null) ?? null,
    });
    uni.hideLoading();
    uni.showToast({
      title: isReset.value ? `「${dh.name}」已焕新` : `「${dh.name}」已认养`,
      icon: 'success',
    });
    // chat 是 tabBar 页，redirectTo 会静默失败，必须用 switchTab
    setTimeout(() => uni.switchTab({ url: '/pages/chat/chat' }), 1200);
  } catch (e: unknown) {
    uni.hideLoading();
    uni.showToast({
      title: (e as Error)?.message || '提交失败，请稍后重试',
      icon: 'none',
      duration: 2500,
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.page {
  padding: 30rpx;
  padding-top: calc(120rpx + env(safe-area-inset-top));
}
.intro {
  font-size: 26rpx;
  color: #8a7f6a;
  line-height: 1.8;
  margin-bottom: 24rpx;
  padding: 20rpx;
  background: #efe6d5;
  border-radius: 16rpx;
}
.form-card {
  background: #fffdf7;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(90, 80, 60, 0.06);
}
.label {
  font-size: 26rpx;
  color: #3a3226;
  font-weight: 600;
  margin: 10rpx 0 16rpx;
}
.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.anim-btn {
  font-size: 24rpx;
  color: #5b6b52;
  background: #eef2e8;
  border: 2rpx solid #5b6b52;
  border-radius: 24rpx;
  padding: 6rpx 20rpx;
}
.input {
  height: 80rpx;
  background: #f2ecdf;
  border-radius: 14rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  margin-bottom: 20rpx;
}
.style-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.style-item {
  width: calc(25% - 12rpx);
  box-sizing: border-box;
  text-align: center;
  padding: 20rpx 0;
  border: 2rpx solid #e8dfc8;
  border-radius: 16rpx;
}
.style-item.picked {
  border-color: #5b6b52;
  background: #f0f3ea;
}
.style-emoji {
  font-size: 44rpx;
}
.style-name {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #5a4f3d;
}
.tip {
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #b3a88f;
  line-height: 1.6;
}
.tip.uploading {
  color: #7a9c6d;
}
.tip.ok {
  color: #5b8a4c;
}
.preview-box {
  margin-top: 24rpx;
  padding: 16rpx 0 4rpx;
  border-top: 1rpx dashed #e8dfc8;
}
.glb-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}
.glb-btn {
  flex: 1;
  height: 72rpx;
  border-radius: 36rpx;
  border: 2rpx solid #5b6b52;
  color: #5b6b52;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}
.glb-btn.primary {
  background: #5b6b52;
  color: #fdfaf2;
}
.glb-btn.disabled {
  opacity: 0.5;
}
.studio-btn {
  margin-top: 16rpx;
  background: #7d8f6e;
  color: #fdfaf2;
  border: none;
}
.custom-panel {
  background: #f7f1e3;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
}
.c-row {
  display: flex;
  align-items: center;
  margin-bottom: 18rpx;
}
.c-row:last-of-type {
  margin-bottom: 0;
}
.c-name {
  width: 84rpx;
  flex-shrink: 0;
  font-size: 24rpx;
  color: #5a4f3d;
}
.c-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.c-chip {
  padding: 8rpx 22rpx;
  border: 2rpx solid #e0d6bd;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: #5a4f3d;
  background: #fffdf7;
}
.c-chip.on {
  border-color: #5b6b52;
  background: #5b6b52;
  color: #fdfaf2;
}
.c-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}
.c-swatch {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(58, 50, 38, 0.15);
  box-sizing: border-box;
}
.c-swatch.on {
  border-color: #3a3226;
  box-shadow: 0 0 0 4rpx rgba(91, 107, 82, 0.35);
}
.photo-row {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 20rpx;
  background: #f2ecdf;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.photo-preview {
  width: 100%;
  height: 100%;
}
.photo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.photo-plus {
  font-size: 56rpx;
  color: #b3a88f;
  line-height: 1;
}
.photo-hint {
  margin-top: 10rpx;
  font-size: 20rpx;
  color: #b3a88f;
  text-align: center;
  padding: 0 12rpx;
}
.photo-remove {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba(58, 50, 38, 0.6);
  color: #fdfaf2;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.submit-btn {
  margin-top: 40rpx;
  height: 88rpx;
  border-radius: 44rpx;
  background: #5b6b52;
  color: #fdfaf2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  letter-spacing: 4rpx;
}
.submit-btn.disabled {
  opacity: 0.5;
}
</style>
