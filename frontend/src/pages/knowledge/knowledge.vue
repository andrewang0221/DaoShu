<template>
  <view class="page">
    <TaijiBackButton floating />
    <view class="tab-row">
      <view class="tab" :class="{ active: tab === 'search' }" @tap="tab = 'search'">检索</view>
      <view class="tab" :class="{ active: tab === 'recommend' }" @tap="tab = 'recommend'">推荐</view>
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
      <view v-for="it in items" :key="it.chapterNo" class="kb-item">
        <view class="kb-title">第{{ it.chapterNo }}章《{{ it.title }}》</view>
        <view class="kb-text">{{ it.simplified }}</view>
        <view v-if="it.summary" class="kb-summary">{{ it.summary.slice(0, 80) }}…</view>
      </view>
    </view>

    <!-- 推荐 -->
    <view v-else class="form-card">
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
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { api, KnowledgeItem } from '../../api';
import TaijiBackButton from '../../components/TaijiBackButton.vue';

const tab = ref<'search' | 'recommend'>('search');
const keyword = ref('');
const items = ref<KnowledgeItem[]>([]);
const loading = ref(false);
const rec = reactive({ content: '', source: '', chapterNo: '' });

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

async function submitRec() {
  if (!rec.content.trim() || !rec.source.trim()) {
    uni.showToast({ title: '内容与出处均为必填', icon: 'none' });
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
    tab.value = 'search';
  } catch {
    uni.hideLoading();
  }
}
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
</style>
