<template>
  <view class="page">
    <TaijiBackButton floating />
    <view class="tab-row">
      <view class="tab" :class="{ active: tab === 'search' }" @tap="tab = 'search'">检索</view>
      <view class="tab" :class="{ active: tab === 'recommend' }" @tap="switchToRecommend">推荐</view>
    </view>

    <!-- 检索 -->
    <view v-if="tab === 'search'">
      <view class="search-bar">
        <input
          v-model="keyword"
          class="input"
          confirm-type="search"
          placeholder="如：上善若水、无为、大器晚成"
          @confirm="search"
        />
        <view class="search-btn" @tap="search">搜</view>
      </view>
      <view v-if="loading" class="empty">检索中…</view>
      <view v-else-if="!items.length" class="empty">输入关键词检索 81 章道德经</view>
      <view
        v-for="it in items"
        :key="it.chapterNo"
        class="kb-item"
        @tap="openChapter(it.chapterNo)"
      >
        <view class="kb-title">第{{ it.chapterNo }}章《{{ it.title }}》</view>
        <view class="kb-text">{{ it.simplified }}</view>
        <view v-if="it.summary" class="kb-summary">{{ it.summary.slice(0, 80) }}…</view>
        <view class="kb-more">📖 查看整章原文 · 注音 · 今译 · 注解 ›</view>
      </view>
    </view>

    <!-- 推荐 -->
    <view v-else>
      <view class="form-card">
        <view class="label">知识内容 *</view>
        <textarea
          v-model="rec.content"
          class="textarea"
          placeholder="推荐一段原文、注解或你的行业应用心得…"
        />
        <view class="label">出处 *（必填，无出处不采纳）</view>
        <input v-model="rec.source" class="input" placeholder="如：汪胜岩注解2026·第X章 / 某书Pxx" />
        <view class="label">对应章节（选填）</view>
        <input v-model="rec.chapterNo" class="input" type="number" placeholder="1-81" />
        <view class="submit-btn" :class="{ disabled: !rec.content.trim() || !rec.source.trim() }" @tap="submitRec">
          提交推荐
        </view>
        <view class="tip">采纳后你将获得积分奖励；被他人引用还将获得分成</view>
      </view>

      <!-- 我的提交记录 -->
      <view class="my-recs-title">我的提交记录</view>
      <view v-if="loadingRecs" class="empty">加载中…</view>
      <view v-else-if="!myRecs.length" class="empty">还没有提交记录，欢迎推荐你的研读心得</view>
      <view v-for="r in myRecs" :key="r.id" class="rec-item">
        <view class="rec-head">
          <text class="rec-status" :class="'st-' + r.status">{{ statusText(r.status) }}</text>
          <text v-if="r.chapterNo" class="rec-ch">第{{ r.chapterNo }}章</text>
          <text class="rec-time">{{ fmtTime(r.createdAt) }}</text>
        </view>
        <view class="rec-content">{{ r.content }}</view>
        <view class="rec-source">出处：{{ r.source }}</view>
        <view v-if="r.reviewNote" class="rec-note">审核反馈：{{ r.reviewNote }}</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api, KnowledgeItem, MyRecommendation } from '../../api';
import { useAppStore } from '../../store';
import TaijiBackButton from '../../components/TaijiBackButton.vue';

const store = useAppStore();
const tab = ref<'search' | 'recommend'>('search');
const keyword = ref('');
const items = ref<KnowledgeItem[]>([]);
const loading = ref(false);
const rec = reactive({ content: '', source: '', chapterNo: '' });

const myRecs = ref<MyRecommendation[]>([]);
const loadingRecs = ref(false);

async function search() {
  const kw = keyword.value.trim();
  if (!kw) return;
  loading.value = true;
  try {
    items.value = await api.searchKnowledge(kw);
  } catch {
    items.value = [];
  } finally {
    loading.value = false;
  }
}

/** 跳转到学习页阅读器，查看整章详细内容 */
function openChapter(chapterNo?: number) {
  if (!chapterNo) return;
  store.pendingStudyChapter = chapterNo;
  uni.switchTab({ url: '/pages/study/study' });
}

function switchToRecommend() {
  tab.value = 'recommend';
  loadMyRecs();
}

async function loadMyRecs() {
  if (!store.isLoggedIn) {
    myRecs.value = [];
    return;
  }
  loadingRecs.value = true;
  try {
    myRecs.value = await api.myRecommendations();
  } catch {
    myRecs.value = [];
  } finally {
    loadingRecs.value = false;
  }
}

function statusText(status: string) {
  return (
    {
      pending: '待审核',
      approved: '已采纳',
      rejected: '未采纳',
      needs_revision: '需补充',
    } as Record<string, string>
  )[status] || '待审核';
}

function fmtTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

async function submitRec() {
  if (!rec.content.trim() || !rec.source.trim()) {
    uni.showToast({ title: '内容与出处均为必填', icon: 'none' });
    return;
  }
  if (!store.isLoggedIn) {
    uni.showModal({
      title: '请先登录',
      content: '提交推荐需要先登录账号',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) uni.navigateTo({ url: '/pages/login/login' });
      },
    });
    return;
  }
  uni.showLoading({ title: '提交中…' });
  try {
    await api.recommend({
      content: rec.content.trim(),
      source: rec.source.trim(),
      chapterNo: rec.chapterNo ? Number(rec.chapterNo) : undefined,
    });
    uni.hideLoading();
    uni.showToast({ title: '已提交，等待管理员审核', icon: 'success' });
    rec.content = '';
    rec.source = '';
    rec.chapterNo = '';
    loadMyRecs();
  } catch {
    uni.hideLoading();
  }
}

onShow(() => {
  store.restore();
  if (tab.value === 'recommend') loadMyRecs();
});
</script>

<style scoped>
.page {
  padding: 30rpx;
  padding-top: calc(120rpx + env(safe-area-inset-top));
}
.tab-row {
  display: flex;
  margin-bottom: 24rpx;
}
.tab {
  padding: 12rpx 40rpx;
  font-size: 28rpx;
  color: #8a7f6a;
  border-bottom: 4rpx solid transparent;
}
.tab.active {
  color: #3a3226;
  font-weight: 600;
  border-bottom-color: #5b6b52;
}
.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}
.input {
  flex: 1;
  height: 76rpx;
  background: #fffdf7;
  border-radius: 38rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
}
.search-btn {
  margin-left: 16rpx;
  width: 88rpx;
  height: 76rpx;
  border-radius: 38rpx;
  background: #5b6b52;
  color: #fdfaf2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}
.empty {
  text-align: center;
  color: #b3a88f;
  font-size: 26rpx;
  padding: 60rpx 0;
}
.kb-item {
  background: #fffdf7;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(90, 80, 60, 0.05);
}
.kb-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #3a3226;
  margin-bottom: 10rpx;
}
.kb-text {
  font-size: 26rpx;
  color: #5a4f3d;
  line-height: 1.7;
}
.kb-summary {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #8a7f6a;
}
.kb-more {
  margin-top: 14rpx;
  font-size: 24rpx;
  color: #5b6b52;
  font-weight: 600;
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
.textarea {
  width: 100%;
  height: 200rpx;
  background: #f2ecdf;
  border-radius: 14rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}
.submit-btn {
  margin-top: 30rpx;
  height: 84rpx;
  border-radius: 42rpx;
  background: #5b6b52;
  color: #fdfaf2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}
.submit-btn.disabled {
  opacity: 0.5;
}
.tip {
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #b3a88f;
}
.my-recs-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #3a3226;
  margin: 40rpx 0 20rpx;
  border-left: 8rpx solid #c9a96e;
  padding-left: 16rpx;
}
.rec-item {
  background: #fffdf7;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 18rpx;
  box-shadow: 0 2rpx 10rpx rgba(90, 80, 60, 0.05);
}
.rec-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}
.rec-status {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  color: #fff;
  background: #b3a88f;
}
.rec-status.st-pending {
  background: #c9a96e;
}
.rec-status.st-approved {
  background: #5b6b52;
}
.rec-status.st-rejected {
  background: #a06a5a;
}
.rec-status.st-needs_revision {
  background: #8a7f6a;
}
.rec-ch {
  font-size: 24rpx;
  color: #5a4f3d;
  font-weight: 600;
}
.rec-time {
  margin-left: auto;
  font-size: 22rpx;
  color: #b3a88f;
}
.rec-content {
  font-size: 26rpx;
  color: #3a3226;
  line-height: 1.7;
}
.rec-source {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #8a7f6a;
}
.rec-note {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #a06a5a;
}
</style>
