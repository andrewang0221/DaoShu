<template>
  <view class="page">
    <view class="top-bar">
      <view class="top-title">与「{{ dhName }}」问道</view>
      <view class="top-actions">
        <view class="top-btn" @tap="animSheet = true">⚙️ 动画</view>
        <view class="top-btn" @tap="openAvatarSheet">换头像</view>
        <view class="top-btn" @tap="resetDigitalHuman">重设数字人</view>
      </view>
    </view>

    <AvatarRenderer
      :name="dhName"
      :speaking="thinking || ttsPlaying"
      :avatar-style="avatarSheet && custom3dOpen ? '3d' : dhStyle"
      :avatar-url="avatarSheet && custom3dOpen ? null : dhPhoto"
      :avatar-glb-url="dhGlbUrl"
      :avatar3d-params="avatarSheet && custom3dOpen ? draft3d : dhParams3d"
      :anim-options="animOpts"
      :mood="mood"
    />

    <scroll-view class="msg-list" scroll-y :scroll-into-view="scrollInto">
      <view v-if="!messages.length" class="msg-empty">
        与「{{ dhName }}」对话，从《道德经》中寻求启发。
        <text class="tips">试试：无为对管理工作有什么启发？</text>
      </view>
      <view
        v-for="m in messages"
        :key="m.id"
        class="msg-row"
        :class="m.role === 'user' ? 'row-user' : 'row-assistant'"
      >
        <view class="bubble" :class="m.role">
          <text class="msg-content" user-select>{{ m.content }}</text>
          <view v-if="m.citations && m.citations.length" class="citations">
            <view v-for="(c, i) in m.citations" :key="i" class="citation">
              引用 · 第{{ c.chapterNo }}章《{{ c.chapterTitle }}》（{{ c.source }}）
            </view>
          </view>
        </view>
      </view>
      <view v-if="thinking" class="msg-row row-assistant">
        <view class="bubble assistant thinking">◌ 正在参悟…</view>
      </view>
      <view id="msg-bottom" class="msg-bottom"></view>
    </scroll-view>

    <view v-if="recording" class="record-bar">
      🎙 聆听中：{{ partialText || '请开口提问…' }}（点击 ⏹ 结束并自动发送）
    </view>

    <view class="input-bar">
      <view class="voice-btn" :class="{ off: !ttsOn }" @tap="toggleTts">
        {{ ttsOn ? '🔊' : '🔇' }}
      </view>
      <input
        v-model="input"
        class="input"
        confirm-type="send"
        placeholder="道，可道也，非恒道也 —— 请提问…"
        :disabled="thinking"
        @confirm="send"
      />
      <view
        v-if="!recording"
        class="mic-btn"
        :class="{ disabled: thinking }"
        @tap="startRecord"
      >🎤</view>
      <view v-else class="mic-btn recording" @tap="stopRecord">⏹</view>
      <view class="send-btn" :class="{ disabled: thinking }" @tap="send">问</view>
    </view>

    <!-- 换头像弹层 -->
    <view v-if="avatarSheet" class="sheet-mask" @tap="avatarSheet = false">
      <view class="sheet" @tap.stop>
        <view class="sheet-title">更换头像</view>
        <view class="sheet-sub">选择预设形象，或上传照片由 AI 生成三维立体的它</view>
        <view class="sheet-grid">
          <view
            v-for="s in quickStyles"
            :key="s.value"
            class="sheet-item"
            :class="{ picked: dhStyle === s.value }"
            @tap="quickChange(s.value)"
          >
            <view class="sheet-emoji">{{ s.emoji }}</view>
            <view class="sheet-name">{{ s.label }}</view>
          </view>
          <view class="sheet-item" @tap="changePhoto">
            <view class="sheet-emoji">📷</view>
            <view class="sheet-name">上传照片</view>
          </view>
        </view>

        <view class="sheet-sec" @tap="custom3dOpen = !custom3dOpen">
          <view class="sec-title">三维形象定制</view>
          <view class="sec-arrow">{{ custom3dOpen ? '收起 ▴' : '展开 ▸' }}</view>
        </view>
        <view v-if="custom3dOpen" class="custom-panel">
          <view class="c-row">
            <view class="c-name">性别</view>
            <view class="c-chips">
              <view
                v-for="g in genderOpts"
                :key="g.value"
                class="c-chip"
                :class="{ on: draft3d.gender === g.value }"
                @tap="draft3d.gender = g.value"
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
                :class="{ on: draft3d.hairStyle === h.value }"
                @tap="draft3d.hairStyle = h.value"
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
                :class="{ on: draft3d.skin === c }"
                :style="{ background: c }"
                @tap="draft3d.skin = c"
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
                :class="{ on: draft3d.hair === c }"
                :style="{ background: c }"
                @tap="setDraftHair(c)"
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
                :class="{ on: draft3d.cloth === c }"
                :style="{ background: c }"
                @tap="draft3d.cloth = c"
              />
            </view>
          </view>
          <view class="c-row">
            <view class="c-name">配饰</view>
            <view class="c-chips">
              <view class="c-chip" :class="{ on: draft3d.glasses }" @tap="draft3d.glasses = !draft3d.glasses">眼镜</view>
              <view class="c-chip" :class="{ on: draft3d.beard }" @tap="draft3d.beard = !draft3d.beard">胡须</view>
            </view>
          </view>
          <view class="apply-btn" :class="{ disabled: changing }" @tap="applyCustom3d">保存三维形象</view>
        </view>
      </view>
    </view>

    <!-- 动画设置弹层 -->
    <AvatarAnimSheet :open="animSheet" :value="animOpts" @close="animSheet = false" @change="onAnimChange" />
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AvatarRenderer from '../../components/AvatarRenderer.vue';
import AvatarAnimSheet from '../../components/AvatarAnimSheet.vue';
import { api, ChatMessage } from '../../api';
import { useAppStore } from '../../store';
import { AvatarMood, Avatar3DParams, DEFAULT_3D_PARAMS } from '../../components/canvas-avatar';
import { XfyunIatRecorder, xfyunTts } from '../../utils/xfyun-voice';
import type { AvatarAnimOptions } from '../../components/avatar-anim';

/** 三维模型动画设置（自转/眨眼眼神/口型同步），与认养预览页共用持久化。
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

const store = useAppStore();
const dhName = computed(() => store.digitalHuman?.name ?? '道德经智慧导师');
const dhId = computed(() => store.digitalHuman?.id ?? 'demo-dh');
const dhStyle = computed(() => store.digitalHuman?.avatarStyle ?? 'ancient_male');
const dhPhoto = computed(() => store.digitalHuman?.avatarUrl ?? '');
const dhGlbUrl = computed(() =>
  avatarSheet.value && custom3dOpen.value ? null : (store.digitalHuman?.avatarGlbUrl ?? ''),
);
const dhParams3d = computed(
  () => (store.digitalHuman?.avatar3dParams as Avatar3DParams | null) ?? null,
);

const messages = ref<ChatMessage[]>([]);
const input = ref('');
const thinking = ref(false);
const scrollInto = ref('');
const conversationId = ref('');
const mood = ref<AvatarMood>('calm');
let moodTimer: ReturnType<typeof setTimeout> | null = null;

function setMood(m: AvatarMood, revertMs?: number) {
  if (moodTimer) {
    clearTimeout(moodTimer);
    moodTimer = null;
  }
  mood.value = m;
  if (revertMs) {
    moodTimer = setTimeout(() => {
      mood.value = 'calm';
    }, revertMs);
  }
}

onLoad(async () => {
  await resolveDigitalHuman();
  await ensureConversation();
  await loadHistory();
});

onUnmounted(() => {
  if (moodTimer) clearTimeout(moodTimer);
  stopSpeak();
  iat?.stop();
});

/** 数字人就绪标志：完整模式未认养时不可建会话（digital_human_id 为 uuid 外键） */
let dhReady = false;

/** 恢复/查询当前用户的数字人：后端 panel 为准（防本地缓存陈旧）→ 本地缓存兜底 → 引导去认养 */
async function resolveDigitalHuman() {
  try {
    const p = (await api.adoptionPanel()) as {
      digitalHumanId?: string | null;
      name?: string | null;
      avatarStyle?: string | null;
      avatarUrl?: string | null;
      avatarGlbUrl?: string | null;
      avatar3dParams?: Avatar3DParams | null;
    };
    if (p?.digitalHumanId) {
      // 演示模式 panel 不含形象字段：仅当服务端有详情或本地无缓存时覆盖
      const hasDetail = !!(p.name || p.avatarStyle || p.avatarGlbUrl || p.avatar3dParams);
      if (hasDetail || !store.digitalHuman?.id) {
        store.setDigitalHuman({
          id: p.digitalHumanId,
          name: p.name ?? '道德经智慧导师',
          avatarStyle: p.avatarStyle ?? undefined,
          avatarUrl: p.avatarUrl ?? null,
          avatarGlbUrl: p.avatarGlbUrl ?? null,
          avatar3dParams: p.avatar3dParams ?? null,
        });
      }
      dhReady = true;
      return;
    }
  } catch {
    // 未登录或后端不可达：走下方本地缓存/认养引导
  }
  if (store.digitalHuman?.id) {
    dhReady = true;
    return;
  }
  uni.showToast({ title: '请先认养数字人，再开始问道', icon: 'none' });
  setTimeout(() => {
    uni.redirectTo({ url: '/pages/adoption/quiz' });
  }, 800);
}

async function ensureConversation() {
  if (conversationId.value || !dhReady) return;
  try {
    // 跨端同步：优先复用该数字人最近活跃的会话（后端按 updated_at 倒序），无会话才新建
    const list = await api.listConversations(dhId.value);
    if (Array.isArray(list) && list.length > 0) {
      conversationId.value = list[0].id;
      return;
    }
    const conv = await api.createConversation({ digitalHumanId: dhId.value, mode: 'free' });
    conversationId.value = conv.id;
  } catch {
    uni.showToast({ title: '连接后端失败，请确认服务已启动', icon: 'none' });
  }
}

async function loadHistory() {
  if (!conversationId.value) return;
  try {
    messages.value = await api.getMessages(conversationId.value);
  } catch {
    messages.value = [];
  }
}

async function send() {
  const content = input.value.trim();
  if (!content || thinking.value) return;
  // 会话未建立（如后端瞬时不可达）时先重建，避免向空 ID 发请求
  if (!conversationId.value) {
    await ensureConversation();
    if (!conversationId.value) {
      uni.showToast({ title: dhReady ? '连接后端失败，请稍后重试' : '请先认养数字人', icon: 'none' });
      return;
    }
  }
  input.value = '';
  messages.value.push({ id: `u-${Date.now()}`, role: 'user', content, citations: [], createdAt: '' });
  scrollToBottom();
  thinking.value = true;
  // 提问瞬间：惊讶 → 转入沉思
  setMood('surprised', 900);
  setTimeout(() => {
    if (thinking.value) setMood('thinking');
  }, 900);
  try {
    const answer = await api.ask(conversationId.value, content);
    messages.value.push(answer);
    // 回答到达：微笑开示，片刻后回归平和
    setMood('smile', 3000);
    // 语音播报（开启时数字人开口说话，口型同步）
    if (ttsOn.value && answer.content) speak(answer.content);
  } catch {
    setMood('calm');
  } finally {
    thinking.value = false;
    scrollToBottom();
  }
}

// ---------- 语音交互（讯飞 IAT 识别 + TTS 合成） ----------

const ttsOn = ref(uni.getStorageSync('ddj_tts_on') !== '0');
const ttsPlaying = ref(false);
const recording = ref(false);
const partialText = ref('');
let iat: XfyunIatRecorder | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl = '';

function toggleTts() {
  ttsOn.value = !ttsOn.value;
  uni.setStorageSync('ddj_tts_on', ttsOn.value ? '1' : '0');
  if (!ttsOn.value) stopSpeak();
  uni.showToast({ title: ttsOn.value ? '语音播报已开启' : '语音播报已关闭', icon: 'none' });
}

/** 停止当前播报 */
function stopSpeak() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = '';
  }
  ttsPlaying.value = false;
}

/** TTS 合成并播放（播放期间驱动数字人口型与表情） */
async function speak(text: string) {
  stopSpeak();
  try {
    const url = await xfyunTts(text);
    currentAudioUrl = url;
    const a = new Audio(url);
    currentAudio = a;
    ttsPlaying.value = true;
    setMood('smile');
    a.onended = () => {
      ttsPlaying.value = false;
      setMood('calm');
    };
    a.onerror = () => {
      ttsPlaying.value = false;
      setMood('calm');
    };
    await a.play();
  } catch (e) {
    ttsPlaying.value = false;
    setMood('calm');
    uni.showToast({ title: ((e as Error).message || '语音合成失败').slice(0, 30), icon: 'none' });
  }
}

/** 开始语音识别录音 */
async function startRecord() {
  if (thinking.value || recording.value) return;
  stopSpeak();
  try {
    iat = new XfyunIatRecorder({
      onPartial: (t) => (partialText.value = t),
      onDone: (text, err) => {
        recording.value = false;
        partialText.value = '';
        if (err) {
          setMood('calm');
          uni.showToast({ title: err.message.slice(0, 30), icon: 'none' });
          return;
        }
        if (!text.trim()) {
          setMood('calm');
          uni.showToast({ title: '未识别到语音，请再试一次', icon: 'none' });
          return;
        }
        input.value = text.trim();
        send();
      },
    });
    await iat.start();
    recording.value = true;
    setMood('thinking');
  } catch (e) {
    uni.showToast({
      title: ((e as Error).message || '无法访问麦克风，请检查浏览器权限（需 HTTPS 或 localhost）').slice(0, 40),
      icon: 'none',
    });
  }
}

/** 停止录音 → 自动发送识别结果 */
function stopRecord() {
  iat?.stop();
}

function scrollToBottom() {
  nextTick(() => {
    scrollInto.value = 'msg-bottom';
  });
}

// ---------- 换头像 / 重设数字人 ----------

const avatarSheet = ref(false);
const changing = ref(false);

// ---------- 三维形象手动定制 ----------
const custom3dOpen = ref(false);
const draft3d = ref<Avatar3DParams>({ ...DEFAULT_3D_PARAMS });
const genderOpts = [
  { value: 'male' as const, label: '男' },
  { value: 'female' as const, label: '女' },
];
const hairOpts = [
  { value: 'short' as const, label: '短发' },
  { value: 'long' as const, label: '长发' },
  { value: 'bun' as const, label: '发髻' },
  { value: 'cloud' as const, label: '云鬓' },
  { value: 'buzz' as const, label: '寸头' },
  { value: 'ponytail' as const, label: '马尾' },
];
const skinColors = ['#f5dcc0', '#f0d2b0', '#e8c09a', '#d9a878', '#b9825e', '#8d5a3b'];
const hairColors = ['#191513', '#3b2f28', '#5a4632', '#8a6a45', '#b08a5a', '#d9c49a', '#6e6e73', '#a3552e'];
const clothColors = ['#5b6b52', '#7a5c43', '#4a5568', '#8a3b3b', '#5d4a6e', '#2f4f4f', '#8c7853', '#3a3226'];

/** 发色同时联动眉毛颜色，观感更自然 */
function setDraftHair(color: string) {
  draft3d.value.hair = color;
  draft3d.value.browColor = color;
}

/** 保存三维手动定制：切到 3d 风格 + 写入参数（清除照片） */
async function applyCustom3d() {
  if (changing.value) return;
  changing.value = true;
  try {
    const dh = await api.updateDigitalHuman({
      avatarStyle: '3d',
      avatarUrl: null,
      avatar3dParams: { ...draft3d.value },
    });
    applyDh(dh);
    avatarSheet.value = false;
    uni.showToast({ title: '三维形象已更新', icon: 'success' });
  } finally {
    changing.value = false;
  }
}
const quickStyles = [
  { value: 'laozi', label: '老子', emoji: '🧙' },
  { value: 'confucius', label: '孔子', emoji: '📜' },
  { value: 'zhuangzi', label: '庄子', emoji: '🐟' },
  { value: 'mozi', label: '墨子', emoji: '🛠' },
  { value: 'ancient_male', label: '古老 · 男', emoji: '👴' },
  { value: 'ancient_female', label: '古老 · 女', emoji: '👵' },
  { value: 'modern_male', label: '现代 · 男', emoji: '🧑' },
  { value: 'modern_female', label: '现代 · 女', emoji: '👩' },
  { value: 'abstract', label: '抽象水墨', emoji: '☯' },
  { value: '3d', label: '三维立体', emoji: '🧊' },
];

function openAvatarSheet() {
  draft3d.value = { ...(dhParams3d.value ?? DEFAULT_3D_PARAMS) };
  avatarSheet.value = true;
}

/** 重新设置数字人：进入认养页（重设模式，预填当前形象） */
function resetDigitalHuman() {
  uni.navigateTo({ url: '/pages/adoption/create?reset=1' });
}

/** 快捷切换预设形象（切到 3d 无参数则用默认三维形象） */
async function quickChange(style: string) {
  if (changing.value) return;
  changing.value = true;
  try {
    const dh = await api.updateDigitalHuman({
      avatarStyle: style,
      // 切换为预设形象时清除照片、三维模型与参数；3d 用默认三维形象
      avatarUrl: null,
      avatarGlbUrl: null,
      avatar3dParams: null,
    });
    applyDh(dh);
    avatarSheet.value = false;
    uni.showToast({ title: '头像已更换', icon: 'success' });
  } finally {
    changing.value = false;
  }
}

/** 上传照片：有 LLM 视觉模型则生成三维形象，否则直接作为照片头像 */
function changePhoto() {
  if (changing.value) return;
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: (res) => {
      const path = res.tempFilePaths?.[0];
      if (!path) return;
      const file = res.tempFiles?.[0];
      if (file && file.size > 5 * 1024 * 1024) {
        uni.showToast({ title: '照片不能超过 5MB', icon: 'none' });
        return;
      }
      changePhotoFlow(path);
    },
  });
}

async function changePhotoFlow(path: string) {
  changing.value = true;
  avatarSheet.value = false;
  uni.showLoading({ title: '上传照片中…' });
  try {
    const up = await api.uploadAvatar(path);
    uni.showLoading({ title: 'AI 解析三维形象…' });
    const analyzed = await api
      .analyzeAvatar3d(up.url)
      .catch(() => null as { params: Avatar3DParams; source: string; message?: string } | null);
    const dh = await api.updateDigitalHuman({
      avatarStyle: '3d',
      avatarUrl: analyzed ? null : up.url,
      avatar3dParams: analyzed ? analyzed.params : null,
    });
    applyDh(dh);
    uni.hideLoading();
    uni.showToast({
      title: analyzed?.source === 'llm' ? '已生成三维形象' : '头像已更换',
      icon: 'success',
    });
    if (analyzed?.source === 'fallback' && analyzed.message) {
      setTimeout(() => uni.showToast({ title: analyzed.message!, icon: 'none', duration: 3000 }), 1600);
    }
  } catch {
    uni.hideLoading();
  } finally {
    changing.value = false;
  }
}

function applyDh(dh: {
  id: string;
  name: string;
  avatarStyle?: string;
  avatarUrl?: string | null;
  avatarGlbUrl?: string | null;
  avatar3dParams?: Avatar3DParams | null;
}) {
  store.setDigitalHuman({
    id: dh.id,
    name: dh.name,
    avatarStyle: dh.avatarStyle,
    avatarUrl: dh.avatarUrl ?? null,
    avatarGlbUrl: dh.avatarGlbUrl ?? null,
    avatar3dParams: dh.avatar3dParams ?? null,
  });
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f7f3ea;
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx 0;
}
.top-title {
  font-size: 26rpx;
  color: #5a4f3d;
  letter-spacing: 2rpx;
}
.top-actions {
  display: flex;
  gap: 14rpx;
}
.top-btn {
  padding: 8rpx 22rpx;
  border: 2rpx solid #d8cfba;
  border-radius: 28rpx;
  font-size: 22rpx;
  color: #6b5f4a;
  background: #fffdf7;
}
.sheet-mask {
  position: fixed;
  inset: 0;
  background: rgba(58, 50, 38, 0.45);
  z-index: 99;
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  background: #fffdf7;
  border-radius: 32rpx 32rpx 0 0;
  padding: 36rpx 30rpx calc(36rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}
.sheet-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #3a3226;
  text-align: center;
}
.sheet-sub {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #b3a88f;
  text-align: center;
  margin-bottom: 26rpx;
}
.sheet-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}
.sheet-item {
  width: calc(25% - 14rpx);
  box-sizing: border-box;
  text-align: center;
  padding: 20rpx 0;
  border: 2rpx solid #e8dfc8;
  border-radius: 16rpx;
}
.sheet-item.picked {
  border-color: #5b6b52;
  background: #f0f3ea;
}
.sheet-emoji {
  font-size: 44rpx;
}
.sheet-name {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #5a4f3d;
}
.sheet-sec {
  margin-top: 26rpx;
  padding: 18rpx 24rpx;
  background: #f7f1e3;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sec-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #3a3226;
}
.sec-arrow {
  font-size: 22rpx;
  color: #b3a88f;
}
.custom-panel {
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  background: #f7f1e3;
  border-radius: 14rpx;
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
.apply-btn {
  margin-top: 22rpx;
  height: 76rpx;
  border-radius: 38rpx;
  background: #5b6b52;
  color: #fdfaf2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  letter-spacing: 4rpx;
}
.apply-btn.disabled {
  opacity: 0.5;
}
.record-bar {
  margin: 0 30rpx 12rpx;
  padding: 14rpx 24rpx;
  background: #fffdf7;
  border: 2rpx solid #d8cfba;
  border-radius: 14rpx;
  font-size: 24rpx;
  color: #7a9c6d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.voice-btn {
  flex-shrink: 0;
  width: 64rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
}
.voice-btn.off {
  opacity: 0.4;
}
.mic-btn {
  flex-shrink: 0;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  border-radius: 50%;
  background: #eef0e4;
}
.mic-btn.recording {
  background: #c25b4e;
  animation: mic-pulse 1.2s infinite;
}
.mic-btn.disabled {
  opacity: 0.4;
}
@keyframes mic-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(194, 91, 78, 0.4); }
  50% { box-shadow: 0 0 0 14rpx rgba(194, 91, 78, 0); }
}
.msg-list {
  flex: 1;
  padding: 20rpx 30rpx;
  box-sizing: border-box;
}
.msg-empty {
  text-align: center;
  color: #8a7f6a;
  font-size: 26rpx;
  padding: 60rpx 20rpx;
  line-height: 1.8;
}
.tips {
  display: block;
  margin-top: 12rpx;
  color: #b3a88f;
  font-size: 24rpx;
}
.msg-row {
  display: flex;
  margin-bottom: 20rpx;
}
.row-user {
  justify-content: flex-end;
}
.row-assistant {
  justify-content: flex-start;
}
.bubble {
  max-width: 80%;
  padding: 20rpx 24rpx;
  border-radius: 18rpx;
  font-size: 28rpx;
  line-height: 1.7;
  word-break: break-all;
}
.bubble.user {
  background: #5b6b52;
  color: #fdfaf2;
  border-bottom-right-radius: 4rpx;
}
.bubble.assistant {
  background: #fffdf7;
  color: #3a3226;
  border-bottom-left-radius: 4rpx;
  box-shadow: 0 2rpx 10rpx rgba(90, 80, 60, 0.06);
}
.bubble.thinking {
  color: #8a7f6a;
}
.citations {
  margin-top: 14rpx;
  border-top: 1rpx dashed #d8cfba;
  padding-top: 12rpx;
}
.citation {
  font-size: 22rpx;
  color: #7a6f5a;
  margin-bottom: 6rpx;
}
.msg-bottom {
  height: 4rpx;
}
.input-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fffdf7;
  border-top: 1rpx solid #e8dfc8;
}
.input {
  flex: 1;
  height: 76rpx;
  background: #f2ecdf;
  border-radius: 38rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
}
.send-btn {
  margin-left: 20rpx;
  width: 96rpx;
  height: 76rpx;
  border-radius: 38rpx;
  background: #5b6b52;
  color: #fdfaf2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}
.send-btn.disabled {
  opacity: 0.5;
}
</style>
