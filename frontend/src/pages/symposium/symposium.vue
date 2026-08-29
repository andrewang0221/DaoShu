<template>
  <view class="page">
    <TaijiBackButton floating />
    <view class="hero">
      <view class="hero-title">论道研讨</view>
      <view class="hero-sub">数字人主持 · 老子庄子对谈 · 纪要沉淀知识库</view>
    </view>

    <!-- 发起研讨 -->
    <view class="section">
      <view class="section-title">发起研讨</view>
      <view class="card">
        <block v-if="store.digitalHuman">
          <view class="host-line">
            <text class="host-badge">🧘 主持人</text>
            <text class="host-name">{{ store.digitalHuman.name }}</text>
            <text class="host-tip">将携老子 / 庄子 / 关尹子展开对谈</text>
          </view>

          <view class="mode-row">
            <view class="mode-opt" :class="{ active: mode === 'topic' }" @tap="mode = 'topic'">按主题</view>
            <view class="mode-opt" :class="{ active: mode === 'chapter' }" @tap="mode = 'chapter'">按章节</view>
          </view>

          <view v-if="mode === 'topic'">
            <input v-model="topic" class="text-input" placeholder="输入研讨主题，如：无为而治与现代管理" />
            <view class="chips">
              <view
                v-for="(t, i) in suggestedTopics"
                :key="i"
                class="chip"
                @tap="useTopic(t)"
              >{{ t.title }}</view>
            </view>
          </view>

          <view v-else class="picker-row">
            <picker mode="selector" :range="chapterLabels" @change="onChapterChange">
              <view class="picker-value">{{ chapterNo ? `第 ${chapterNo} 章` : '选择章节（1-81）' }}</view>
            </picker>
          </view>

          <view class="rounds-row">
            <text class="rounds-label">研讨轮数</text>
            <view class="mode-opt" :class="{ active: rounds === 1 }" @tap="rounds = 1">1 轮</view>
            <view class="mode-opt" :class="{ active: rounds === 2 }" @tap="rounds = 2">2 轮</view>
            <view class="mode-opt" :class="{ active: rounds === 3 }" @tap="rounds = 3">3 轮</view>
          </view>

          <view class="btn primary" :class="{ disabled: starting }" @tap="doStart">
            {{ starting ? '研讨进行中...' : '发起研讨' }}
          </view>
        </block>
        <block v-else>
          <view class="empty-tip">发起研讨前，请先认养你的专属数字人主持人</view>
          <view class="btn primary" @tap="goAdopt">去认养数字人</view>
        </block>
      </view>
    </view>

    <!-- 研讨过程与纪要 -->
    <view class="section" v-if="record">
      <view class="section-title">研讨实录 · {{ record.topic }}</view>

      <!-- 发言流 -->
      <view class="card" v-for="(s, i) in record.speeches" :key="i">
        <view class="speech-head">
          <text class="speech-avatar">{{ speakerIcon(s.speaker) }}</text>
          <view class="speech-meta">
            <text class="speech-name">{{ s.speaker }}</text>
            <text class="speech-stance" v-if="s.stance">{{ s.stance }}</text>
          </view>
        </view>
        <text class="speech-content">{{ s.content }}</text>
        <view class="cites" v-if="s.citations && s.citations.length">
          <text v-for="(c, j) in s.citations" :key="j" class="cite" @tap="readChapter(c.chapterNo)">
            《道德经》第{{ c.chapterNo }}章·{{ c.chapterTitle }}
          </text>
        </view>
      </view>

      <!-- 会议纪要 -->
      <view class="minutes">
        <view class="minutes-head">
          <text class="minutes-title">📋 会议纪要</text>
          <text class="minutes-time">{{ formatTime(record.createdAt) }}</text>
        </view>

        <view class="minutes-block">
          <view class="block-label gold">核心洞见</view>
          <view v-for="(t, i) in record.summary.coreInsights" :key="i" class="block-item">{{ t }}</view>
        </view>
        <view class="minutes-block">
          <view class="block-label jade">达成共识</view>
          <view v-for="(t, i) in record.summary.agreements" :key="i" class="block-item">{{ t }}</view>
        </view>
        <view class="minutes-block">
          <view class="block-label cinnabar">保留分歧</view>
          <view v-for="(t, i) in record.summary.disagreements" :key="i" class="block-item">{{ t }}</view>
        </view>
        <view class="minutes-block">
          <view class="block-label indigo">应用场景</view>
          <view v-for="(t, i) in record.summary.applications" :key="i" class="block-item">{{ t }}</view>
        </view>
        <view class="closing-quote" v-if="record.summary.closingQuote">{{ record.summary.closingQuote }}</view>

        <view class="kb-status">
          <text class="kb-dot">✓</text>
          <text>纪要已提交知识库（管理员审核后进入总库，沉淀为公共智慧）</text>
        </view>
        <view class="minutes-actions">
          <view class="btn outline" @tap="goKnowledgeBase">查看知识库</view>
          <view class="btn outline" @tap="goDao">去求道板块分享</view>
        </view>
      </view>
    </view>

    <!-- 我的纪要 -->
    <view class="section">
      <view class="section-title">我的研讨纪要</view>
      <view v-if="records.length === 0" class="card empty-tip">还没有研讨记录，发起第一场吧</view>
      <view
        v-for="r in records"
        :key="r.id"
        class="card record-card"
        :class="{ current: record && record.id === r.id }"
        @tap="loadRecord(r.id)"
      >
        <view class="record-head">
          <text class="record-topic">{{ r.topic }}</text>
          <text class="record-brief" v-if="r.chapterNo">第{{ r.chapterNo }}章</text>
        </view>
        <view class="record-meta">
          <text>主持人 {{ r.hostName }} · {{ r.speechCount }} 段发言</text>
          <text>{{ formatTime(r.createdAt) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api, SymposiumRecord } from '../../api';
import { useAppStore } from '../../store';
import TaijiBackButton from '../../components/TaijiBackButton.vue';

const store = useAppStore();
store.restore();

const mode = ref<'topic' | 'chapter'>('topic');
const topic = ref('');
const chapterNo = ref(0);
const rounds = ref(2);
const starting = ref(false);

const record = ref<SymposiumRecord | null>(null);
const records = ref<Partial<SymposiumRecord>[]>([]);
const suggestedTopics = ref<{ title: string; chapterNo?: number }[]>([]);

const chapterLabels = computed(() =>
  Array.from({ length: 81 }, (_, i) => `第 ${i + 1} 章`),
);

onMounted(async () => {
  try {
    const res = await api.symposiumTopics();
    suggestedTopics.value = res.topics.slice(0, 8);
  } catch {
    /* 推荐主题加载失败不阻塞 */
  }
  loadRecords();
});

async function loadRecords() {
  try {
    records.value = await api.symposiumRecords();
  } catch {
    /* 静默 */
  }
}

function useTopic(t: { title: string; chapterNo?: number }) {
  mode.value = 'topic';
  topic.value = t.title;
}

function onChapterChange(e: { detail: { value: number } }) {
  chapterNo.value = Number(e.detail.value) + 1;
  mode.value = 'chapter';
}

async function doStart() {
  if (starting.value) return;
  if (mode.value === 'topic' && !topic.value.trim()) {
    uni.showToast({ title: '请输入研讨主题', icon: 'none' });
    return;
  }
  if (mode.value === 'chapter' && !chapterNo.value) {
    uni.showToast({ title: '请选择章节', icon: 'none' });
    return;
  }
  starting.value = true;
  uni.showLoading({ title: '研讨进行中', mask: true });
  try {
    record.value = await api.symposiumStart({
      topic: mode.value === 'topic' ? topic.value.trim() : undefined,
      chapterNo: mode.value === 'chapter' ? chapterNo.value : undefined,
      digitalHumanId: store.digitalHuman?.id,
      hostName: store.digitalHuman?.name,
      rounds: rounds.value,
    });
    uni.hideLoading();
    uni.showToast({ title: '研讨完成，纪要已入知识库', icon: 'none', duration: 2000 });
    loadRecords();
    uni.pageScrollTo({ scrollTop: 0, duration: 300 });
  } catch (e: unknown) {
    uni.hideLoading();
    const msg = (e as { message?: string })?.message ?? '研讨发起失败';
    uni.showToast({ title: msg, icon: 'none', duration: 2500 });
  }
  starting.value = false;
}

function loadRecord(id?: string) {
  if (!id) return;
  api.symposiumRecord(id)
    .then((r) => {
      record.value = r;
      uni.pageScrollTo({ scrollTop: 0, duration: 300 });
    })
    .catch(() => uni.showToast({ title: '纪要加载失败', icon: 'none' }));
}

function speakerIcon(name: string): string {
  return name.slice(0, 1);
}

function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function goAdopt() {
  uni.navigateTo({ url: '/pages/adoption/quiz' });
}

function goKnowledgeBase() {
  uni.navigateTo({ url: '/pages/knowledge-base/knowledge-base' });
}

function goDao() {
  uni.navigateTo({ url: '/pages/dao/dao' });
}

function readChapter(no: number) {
  uni.navigateTo({ url: '/pages/knowledge/knowledge?chapter=' + no });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-paper);
  padding-bottom: 60rpx;
}

.hero {
  background: var(--gradient-ink);
  padding: 100rpx 40rpx 60rpx;
  text-align: center;
}

.hero-title {
  font-size: 48rpx;
  font-weight: 700;
  color: var(--color-gold);
  letter-spacing: 4rpx;
}

.hero-sub {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 16rpx;
}

.section {
  padding: 40rpx 30rpx 0;
}

.card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.host-line {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 24rpx;
  flex-wrap: wrap;
}

.host-badge {
  background: rgba(201, 169, 110, 0.12);
  color: var(--color-gold);
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: var(--radius-full);
  border: 1rpx solid rgba(201, 169, 110, 0.3);
}

.host-name {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--color-ink);
}

.host-tip {
  font-size: 22rpx;
  color: #8a7f6a;
}

.mode-row,
.rounds-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
  align-items: center;
}

.rounds-label {
  font-size: 26rpx;
  color: var(--color-ink);
  margin-right: 8rpx;
}

.mode-opt {
  padding: 12rpx 32rpx;
  border-radius: var(--radius-full);
  font-size: 26rpx;
  background: #f2f0ea;
  color: #8a7f6a;
  border: 2rpx solid transparent;
}

.mode-opt.active {
  background: rgba(201, 169, 110, 0.12);
  color: var(--color-gold);
  border-color: var(--color-gold);
  font-weight: 600;
}

.text-input {
  width: 100%;
  background: #fafaf7;
  border: 2rpx solid #e8e8e8;
  border-radius: var(--radius-md);
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  margin-bottom: 20rpx;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.chip {
  font-size: 22rpx;
  color: var(--color-jade);
  background: rgba(91, 107, 82, 0.08);
  border: 1rpx solid rgba(91, 107, 82, 0.3);
  padding: 8rpx 20rpx;
  border-radius: var(--radius-full);
}

.picker-value {
  background: #fafaf7;
  border: 2rpx solid #e8e8e8;
  border-radius: var(--radius-md);
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: var(--color-ink);
}

.btn.primary {
  margin-top: 10rpx;
  text-align: center;
  background: var(--gradient-gold);
  color: var(--color-ink);
  border-radius: var(--radius-full);
  padding: 22rpx;
  font-size: 30rpx;
  font-weight: 700;
}

.btn.primary.disabled {
  opacity: 0.6;
}

.btn.outline {
  text-align: center;
  border: 2rpx solid var(--color-gold);
  color: var(--color-gold);
  border-radius: var(--radius-full);
  padding: 16rpx;
  font-size: 26rpx;
  flex: 1;
}

.empty-tip {
  text-align: center;
  color: #8a7f6a;
  font-size: 26rpx;
  padding: 20rpx 0;
}

/* 发言流 */
.speech-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 18rpx;
}

.speech-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: var(--radius-full);
  background: var(--gradient-ink);
  color: var(--color-gold);
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.speech-meta {
  display: flex;
  flex-direction: column;
}

.speech-name {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--color-ink);
}

.speech-stance {
  font-size: 20rpx;
  color: var(--color-gold);
}

.speech-content {
  font-size: 26rpx;
  color: #4a4a4a;
  line-height: 1.8;
  white-space: pre-wrap;
}

.cites {
  margin-top: 18rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.cite {
  font-size: 20rpx;
  color: var(--color-tech-blue);
  background: rgba(52, 152, 219, 0.08);
  border: 1rpx solid rgba(52, 152, 219, 0.25);
  padding: 6rpx 16rpx;
  border-radius: var(--radius-full);
}

/* 会议纪要 */
.minutes {
  background: var(--gradient-ink);
  border-radius: var(--radius-lg);
  padding: 36rpx 30rpx;
  color: white;
  margin-bottom: 20rpx;
}

.minutes-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 26rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.12);
}

.minutes-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--color-gold);
}

.minutes-time {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.55);
}

.minutes-block {
  margin-bottom: 24rpx;
}

.block-label {
  font-size: 24rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.block-label::before {
  content: '';
  width: 8rpx;
  height: 24rpx;
  border-radius: 4rpx;
  background: currentColor;
}

.block-label.gold { color: var(--color-gold); }
.block-label.jade { color: #9db88a; }
.block-label.cinnabar { color: #e08a7b; }
.block-label.indigo { color: #8fb4d9; }

.block-item {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.7;
  margin-bottom: 8rpx;
  padding-left: 18rpx;
}

.closing-quote {
  font-size: 26rpx;
  color: var(--color-gold);
  font-style: italic;
  padding: 20rpx;
  border-left: 6rpx solid var(--color-gold);
  background: rgba(201, 169, 110, 0.08);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  margin-bottom: 24rpx;
}

.kb-status {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 22rpx;
  color: #9db88a;
  background: rgba(157, 184, 138, 0.12);
  padding: 16rpx 20rpx;
  border-radius: var(--radius-md);
  margin-bottom: 24rpx;
}

.kb-dot {
  font-weight: 700;
}

.minutes-actions {
  display: flex;
  gap: 20rpx;
}

/* 纪要列表 */
.record-card.current {
  border: 2rpx solid var(--color-gold);
}

.record-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
  gap: 16rpx;
}

.record-topic {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-ink);
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.record-brief {
  font-size: 20rpx;
  color: var(--color-gold);
  background: rgba(201, 169, 110, 0.1);
  padding: 4rpx 14rpx;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.record-meta {
  display: flex;
  justify-content: space-between;
  font-size: 22rpx;
  color: #8a7f6a;
}
</style>
