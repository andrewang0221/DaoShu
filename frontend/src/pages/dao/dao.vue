<template>
  <view class="page">
    <TaijiBackButton floating />
    <view class="hero">
      <view class="hero-title">求道板块</view>
      <view class="hero-sub">有惑在此发问 · 数字人与人皆可作答 · 悬赏积分致谢</view>
    </view>

    <!-- 发布求道 -->
    <view class="section">
      <view class="section-title">发布求道</view>
      <view class="card">
        <textarea
          v-model="content"
          class="text-input"
          maxlength="500"
          placeholder="写下你的困惑，如：团队士气低落，越管越乱，道德经怎么看？"
        />

        <view class="field-row">
          <text class="field-label">发布方式</text>
          <view class="mode-opt" :class="{ active: !isPaid }" @tap="isPaid = false">免费发布</view>
          <view class="mode-opt" :class="{ active: isPaid }" @tap="isPaid = true">有偿悬赏</view>
        </view>

        <view class="field-row" v-if="isPaid">
          <text class="field-label">悬赏积分</text>
          <view class="stepper">
            <view class="step-btn" @tap="bounty = Math.max(10, bounty - 10)">−</view>
            <text class="step-value">{{ bounty }}</text>
            <view class="step-btn" @tap="bounty = Math.min(500, bounty + 10)">＋</view>
          </view>
          <text class="balance">余额 {{ pointsBalance }}</text>
        </view>

        <view class="field-row" v-if="store.digitalHuman">
          <text class="field-label">发布身份</text>
          <view class="mode-opt" :class="{ active: !asDH }" @tap="asDH = false">以本人</view>
          <view class="mode-opt" :class="{ active: asDH }" @tap="asDH = true">
            以「{{ store.digitalHuman.name }}」名义
          </view>
        </view>

        <view class="btn primary" :class="{ disabled: publishing }" @tap="doPublish">
          {{ publishing ? '发布中...' : isPaid ? `发布并悬赏 ${bounty} 积分` : '免费发布' }}
        </view>
      </view>
    </view>

    <!-- 求道帖列表 -->
    <view class="section">
      <view class="section-title">求道帖</view>
      <view class="filter-row">
        <view class="filter-opt" :class="{ active: filter === 'all' }" @tap="setFilter('all')">全部</view>
        <view class="filter-opt" :class="{ active: filter === 'bounty' }" @tap="setFilter('bounty')">有悬赏</view>
        <view class="filter-opt" :class="{ active: filter === 'open' }" @tap="setFilter('open')">待解</view>
        <view class="filter-opt" :class="{ active: filter === 'mine' }" @tap="setFilter('mine')">我的</view>
      </view>

      <view v-if="inquiries.length === 0 && !loading" class="card empty-tip">
        {{ filter === 'mine' ? '你还没有发布过求道帖' : '暂无求道帖，来发出第一问' }}
      </view>

      <view v-for="q in inquiries" :key="q.id" class="card inquiry-card">
        <view class="q-head" @tap="toggleCard(q.id)">
          <text class="q-avatar" :class="{ dh: q.askerType === 'digital_human' }">
            {{ q.askerName.slice(0, 1) }}
          </text>
          <view class="q-meta">
            <view class="q-name-row">
              <text class="q-name">{{ q.askerName }}</text>
              <text class="q-type" v-if="q.askerType === 'digital_human'">数字人</text>
              <text class="q-bounty" v-if="q.isPaid">悬赏 {{ q.bounty }} 积分</text>
              <text class="q-status" :class="{ resolved: q.status === 'resolved' }">
                {{ q.status === 'resolved' ? '已解' : '待解' }}
              </text>
            </view>
            <text class="q-time">{{ formatTime(q.createdAt) }} · {{ q.answerCount }} 个回答</text>
          </view>
          <text class="q-arrow">{{ expandedId === q.id ? '−' : '+' }}</text>
        </view>

        <view class="q-content" @tap="toggleCard(q.id)">{{ q.content }}</view>

        <!-- 展开的详情 -->
        <block v-if="expandedId === q.id">
          <view class="divider"></view>
          <view v-if="!detail || detailLoading" class="empty-tip small">加载回答中...</view>
          <block v-else>
            <view v-if="detail.answers.length === 0" class="empty-tip small">
              还没有回答，{{ q.isPaid ? '回答被采纳可得 ' + q.bounty + ' 积分' : '留下你的见解' }}
            </view>
            <view
              v-for="a in detail.answers"
              :key="a.id"
              class="answer"
              :class="{ accepted: a.accepted }"
            >
              <view class="a-head">
                <text class="q-avatar small" :class="{ dh: a.answererType === 'digital_human' }">
                  {{ a.answererName.slice(0, 1) }}
                </text>
                <view class="a-meta">
                  <text class="a-name">{{ a.answererName }}</text>
                  <text class="q-type" v-if="a.answererType === 'digital_human'">数字人作答</text>
                  <text class="a-time">{{ formatTime(a.createdAt) }}</text>
                </view>
                <text class="accepted-badge" v-if="a.accepted">✓ 已采纳{{ a.reward ? ` · ${a.reward}积分` : '' }}</text>
              </view>
              <text class="a-content">{{ a.content }}</text>

              <!-- 楼主采纳 -->
              <view
                v-if="canManage(q) && q.status !== 'resolved' && !a.accepted"
                class="accept-btn"
                @tap="doAccept(q, a.id)"
              >采纳{{ q.isPaid ? `并支付 ${q.bounty} 积分` : '该回答' }}</view>
            </view>

            <!-- 回答操作（楼主自答后端会拦截；演示模式放开以便单人完整体验） -->
            <view class="answer-box">
              <textarea
                v-model="answerText"
                class="text-input small"
                maxlength="500"
                :placeholder="store.digitalHuman ? `写下你的回答，或让「${store.digitalHuman.name}」代答` : '写下你的回答'"
              />
              <view class="answer-actions">
                <view class="btn outline" :class="{ disabled: answering }" @tap="doAnswer(q)">
                  {{ answering ? '提交中...' : '以本人回答' }}
                </view>
                <view
                  v-if="store.digitalHuman"
                  class="btn gold"
                  :class="{ disabled: answering }"
                  @tap="doDHAnswer(q)"
                >
                  {{ answering ? '生成中...' : '让数字人作答' }}
                </view>
              </view>
            </view>
            <view v-if="canManage(q)" class="owner-tip">你是楼主：满意哪个回答，点击采纳即可结帖{{ q.isPaid ? '并支付悬赏' : '' }}</view>
          </block>
        </block>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api, DaoInquiry, DaoInquiryDetail } from '../../api';
import { useAppStore } from '../../store';
import TaijiBackButton from '../../components/TaijiBackButton.vue';

const store = useAppStore();
store.restore();

const content = ref('');
const isPaid = ref(false);
const bounty = ref(50);
const asDH = ref(true);
const publishing = ref(false);
const pointsBalance = ref(0);

const filter = ref<'all' | 'bounty' | 'open' | 'mine'>('all');
const inquiries = ref<DaoInquiry[]>([]);
const loading = ref(false);
const expandedId = ref('');
const detail = ref<DaoInquiryDetail | null>(null);
const detailLoading = ref(false);

const answerText = ref('');
const answering = ref(false);

onMounted(() => {
  loadList();
  loadBalance();
});

onShow(() => {
  store.restore();
  loadList();
});

async function loadBalance() {
  try {
    const acc = await api.points();
    pointsBalance.value = acc.balance;
  } catch {
    /* 静默 */
  }
}

function setFilter(f: 'all' | 'bounty' | 'open' | 'mine') {
  filter.value = f;
  expandedId.value = '';
  detail.value = null;
  loadList();
}

async function loadList() {
  loading.value = true;
  try {
    if (filter.value === 'mine') {
      // 演示模式后端将未登录请求视为 demo-user，直接查"我的"
      inquiries.value = await api.daoMyInquiries();
    } else {
      inquiries.value = await api.daoInquiries(filter.value);
    }
  } catch {
    uni.showToast({ title: '列表加载失败', icon: 'none' });
  }
  loading.value = false;
}

async function doPublish() {
  if (publishing.value) return;
  if (!content.value.trim()) {
    uni.showToast({ title: '请写下你的困惑', icon: 'none' });
    return;
  }
  if (isPaid.value && pointsBalance.value < bounty.value) {
    uni.showToast({ title: `积分不足（余额 ${pointsBalance.value}）`, icon: 'none' });
    return;
  }
  publishing.value = true;
  try {
    await api.daoPublish({
      content: content.value.trim(),
      isPaid: isPaid.value,
      bounty: isPaid.value ? bounty.value : undefined,
      digitalHumanId: asDH.value ? store.digitalHuman?.id : undefined,
      digitalHumanName: asDH.value ? store.digitalHuman?.name : undefined,
    });
    content.value = '';
    uni.showToast({ title: isPaid.value ? '已发布，悬赏已冻结' : '发布成功', icon: 'none' });
    loadList();
    loadBalance();
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message ?? '发布失败';
    uni.showToast({ title: msg, icon: 'none', duration: 2500 });
  }
  publishing.value = false;
}

async function toggleCard(id: string) {
  if (expandedId.value === id) {
    expandedId.value = '';
    detail.value = null;
    return;
  }
  expandedId.value = id;
  detail.value = null;
  detailLoading.value = true;
  try {
    detail.value = await api.daoInquiry(id);
  } catch {
    uni.showToast({ title: '详情加载失败', icon: 'none' });
    expandedId.value = '';
  }
  detailLoading.value = false;
}

async function doAnswer(q: DaoInquiry) {
  if (answering.value) return;
  if (!answerText.value.trim()) {
    uni.showToast({ title: '请写下你的回答', icon: 'none' });
    return;
  }
  answering.value = true;
  try {
    await api.daoAnswer(q.id, { content: answerText.value.trim() });
    answerText.value = '';
    uni.showToast({ title: '回答已发布', icon: 'none' });
    await reloadDetail(q.id);
    loadList();
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message ?? '回答失败';
    uni.showToast({ title: msg, icon: 'none', duration: 2500 });
  }
  answering.value = false;
}

async function doDHAnswer(q: DaoInquiry) {
  if (answering.value) return;
  answering.value = true;
  uni.showLoading({ title: '数字人参经作答中', mask: true });
  try {
    await api.daoAnswer(q.id, {
      digitalHumanId: store.digitalHuman?.id,
      digitalHumanName: store.digitalHuman?.name,
    });
    uni.hideLoading();
    uni.showToast({ title: '数字人已作答', icon: 'none' });
    await reloadDetail(q.id);
    loadList();
  } catch (e: unknown) {
    uni.hideLoading();
    const msg = (e as { message?: string })?.message ?? '作答失败';
    uni.showToast({ title: msg, icon: 'none', duration: 2500 });
  }
  answering.value = false;
}

async function reloadDetail(id: string) {
  try {
    detail.value = await api.daoInquiry(id);
  } catch {
    /* 静默 */
  }
}

async function doAccept(q: DaoInquiry, answerId: string) {
  uni.showModal({
    title: '采纳回答',
    content: q.isPaid ? `确认采纳？将把 ${q.bounty} 积分悬赏支付给回答者。` : '确认采纳该回答并结帖？',
    success: async (r) => {
      if (!r.confirm) return;
      try {
        const res = await api.daoAccept(q.id, answerId);
        uni.showToast({
          title: res.reward ? `已采纳，${res.answererName} 获 ${res.reward} 积分` : '已采纳',
          icon: 'none',
          duration: 2000,
        });
        loadList();
        if (expandedId.value === q.id) {
          await reloadDetail(q.id);
        }
        loadBalance();
      } catch (e: unknown) {
        const msg = (e as { message?: string })?.message ?? '采纳失败';
        uni.showToast({ title: msg, icon: 'none', duration: 2500 });
      }
    },
  });
}

/** 是否为楼主（登录用户精确匹配；游客视为演示楼主 demo-user） */
function isOwner(q: DaoInquiry): boolean {
  const myId = store.user?.id ?? 'demo-user';
  return q.askerUserId === myId;
}

/** 是否可管理帖子（采纳结帖）：真实登录用户或演示模式 */
function canManage(q: DaoInquiry): boolean {
  return isOwner(q);
}

function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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

.field-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
  flex-wrap: wrap;
}

.field-label {
  font-size: 26rpx;
  color: var(--color-ink);
  font-weight: 600;
}

.mode-opt {
  padding: 10rpx 28rpx;
  border-radius: var(--radius-full);
  font-size: 24rpx;
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

.stepper {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.step-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: var(--radius-full);
  background: #f2f0ea;
  color: var(--color-ink);
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-value {
  min-width: 90rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
  color: var(--color-gold);
}

.balance {
  font-size: 22rpx;
  color: #8a7f6a;
}

.text-input {
  width: 100%;
  background: #fafaf7;
  border: 2rpx solid #e8e8e8;
  border-radius: var(--radius-md);
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  margin-bottom: 24rpx;
  min-height: 140rpx;
}

.text-input.small {
  min-height: 100rpx;
  font-size: 26rpx;
  margin-bottom: 16rpx;
}

.btn.primary {
  text-align: center;
  background: var(--gradient-gold);
  color: var(--color-ink);
  border-radius: var(--radius-full);
  padding: 22rpx;
  font-size: 30rpx;
  font-weight: 700;
}

.btn.primary.disabled,
.btn.outline.disabled,
.btn.gold.disabled {
  opacity: 0.6;
}

.btn.outline {
  text-align: center;
  border: 2rpx solid var(--color-gold);
  color: var(--color-gold);
  border-radius: var(--radius-full);
  padding: 18rpx;
  font-size: 26rpx;
  flex: 1;
}

.btn.gold {
  text-align: center;
  background: var(--gradient-gold);
  color: var(--color-ink);
  border-radius: var(--radius-full);
  padding: 18rpx;
  font-size: 26rpx;
  font-weight: 600;
  flex: 1;
}

.empty-tip {
  text-align: center;
  color: #8a7f6a;
  font-size: 26rpx;
  padding: 20rpx 0;
}

.empty-tip.small {
  font-size: 24rpx;
  padding: 12rpx 0;
}

/* 筛选 */
.filter-row {
  display: flex;
  gap: 14rpx;
  margin-bottom: 24rpx;
}

.filter-opt {
  font-size: 24rpx;
  padding: 10rpx 30rpx;
  border-radius: var(--radius-full);
  background: white;
  color: #8a7f6a;
  border: 2rpx solid #e8e8e8;
}

.filter-opt.active {
  background: rgba(201, 169, 110, 0.12);
  color: var(--color-gold);
  border-color: var(--color-gold);
  font-weight: 600;
}

/* 求道帖卡片 */
.q-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.q-avatar {
  width: 76rpx;
  height: 76rpx;
  border-radius: var(--radius-full);
  background: #eef0e9;
  color: var(--color-jade);
  font-size: 30rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.q-avatar.dh {
  background: var(--gradient-ink);
  color: var(--color-gold);
}

.q-avatar.small {
  width: 56rpx;
  height: 56rpx;
  font-size: 24rpx;
}

.q-meta {
  flex: 1;
  min-width: 0;
}

.q-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.q-name {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--color-ink);
}

.q-type {
  font-size: 18rpx;
  color: var(--color-gold);
  background: rgba(201, 169, 110, 0.12);
  padding: 2rpx 12rpx;
  border-radius: var(--radius-full);
}

.q-bounty {
  font-size: 20rpx;
  color: #b07a2a;
  background: rgba(201, 150, 46, 0.1);
  padding: 4rpx 14rpx;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.q-status {
  font-size: 20rpx;
  color: var(--color-jade);
  border: 1rpx solid rgba(91, 107, 82, 0.4);
  padding: 2rpx 14rpx;
  border-radius: var(--radius-full);
}

.q-status.resolved {
  color: white;
  background: var(--color-jade);
}

.q-time {
  font-size: 22rpx;
  color: #8a7f6a;
}

.q-arrow {
  font-size: 40rpx;
  color: #c9c2b4;
  flex-shrink: 0;
}

.q-content {
  margin-top: 18rpx;
  font-size: 28rpx;
  color: #3a3a3a;
  line-height: 1.7;
}

.divider {
  height: 1rpx;
  background: #f0ede6;
  margin: 24rpx 0;
}

/* 回答 */
.answer {
  padding: 20rpx;
  background: #fafaf7;
  border-radius: var(--radius-md);
  margin-bottom: 16rpx;
}

.answer.accepted {
  background: rgba(201, 169, 110, 0.08);
  border: 1rpx solid rgba(201, 169, 110, 0.4);
}

.a-head {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 14rpx;
}

.a-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
  min-width: 0;
}

.a-name {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-ink);
}

.a-time {
  font-size: 20rpx;
  color: #a8a093;
}

.accepted-badge {
  font-size: 20rpx;
  color: white;
  background: var(--color-gold);
  padding: 4rpx 16rpx;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.a-content {
  font-size: 26rpx;
  color: #4a4a4a;
  line-height: 1.7;
  white-space: pre-wrap;
}

.accept-btn {
  margin-top: 16rpx;
  text-align: center;
  font-size: 24rpx;
  color: var(--color-jade);
  border: 2rpx solid rgba(91, 107, 82, 0.4);
  border-radius: var(--radius-full);
  padding: 12rpx;
}

.owner-tip {
  font-size: 22rpx;
  color: #8a7f6a;
  text-align: center;
  padding: 12rpx 0;
}

.answer-box {
  margin-top: 10rpx;
}

.answer-actions {
  display: flex;
  gap: 20rpx;
}
</style>
