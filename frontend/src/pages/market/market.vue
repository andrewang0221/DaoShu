<template>
  <view class="page">
    <view class="tab-row">
      <view class="tab" :class="{ active: tab === 'list' }" @tap="switchTab('list')">知识池</view>
      <view class="tab" :class="{ active: tab === 'publish' }" @tap="switchTab('publish')">公开洞见</view>
    </view>

    <view v-if="tab === 'list'">
      <view class="publish-tip">他人引用你的公开知识时，你将获得积分回流（主人 70% / 平台 30%）</view>
      <view v-if="!items.length" class="empty">暂无公开知识</view>
      <view v-for="it in items" :key="it.id" class="mk-item">
        <view class="mk-content">{{ it.deidentifiedContent || it.content }}</view>
        <view v-if="it.sceneTags && it.sceneTags.length" class="mk-tags">
          <text v-for="t in it.sceneTags" :key="t" class="tag">{{ t }}</text>
        </view>
      </view>
    </view>

    <view v-else class="form-card">
      <view class="label">公开内容（将强制脱敏后进入知识池）</view>
      <textarea
        v-model="pub.content"
        class="textarea"
        placeholder="写下一段你在对话中获得的洞见或应用案例…"
      />
      <view class="label">场景标签（逗号分隔，选填）</view>
      <input v-model="pub.tags" class="input" placeholder="如：处世, 管理, 择业" />
      <view class="submit-btn" :class="{ disabled: !pub.content.trim() }" @tap="publish">
        公开到知识池
      </view>
      <view class="tip">公开前请确认已去除姓名、公司等个人信息</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { reactive, ref } from 'vue';
import { api, MarketItem } from '../../api';
import { useAppStore } from '../../store';

const store = useAppStore();

const tab = ref<'list' | 'publish'>('list');
const items = ref<MarketItem[]>([]);
const pub = reactive({ content: '', tags: '' });

onShow(() => {
  store.restore();
  load();
});

function switchTab(t: 'list' | 'publish') {
  tab.value = t;
  if (t === 'list') load();
}

async function load() {
  try {
    items.value = await api.marketItems();
  } catch {
    items.value = [];
  }
}

async function publish() {
  if (!pub.content.trim()) return;
  if (!store.isLoggedIn) {
    uni.showModal({
      title: '请先登录',
      content: '公开知识到市场需要先登录账号',
      confirmText: '去登录',
      success: (r) => {
        if (r.confirm) uni.navigateTo({ url: '/pages/login/login' });
      },
    });
    return;
  }
  uni.showLoading({ title: '公开中…' });
  try {
    await api.publishMarket({
      content: pub.content.trim(),
      sceneTags: pub.tags
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean),
    });
    uni.hideLoading();
    uni.showToast({ title: '已公开入池', icon: 'success' });
    pub.content = '';
    pub.tags = '';
    tab.value = 'list';
    load();
  } catch {
    uni.hideLoading();
  }
}
</script>

<style scoped>
.page {
  padding: 30rpx;
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
.publish-tip {
  font-size: 24rpx;
  color: #8a7f6a;
  background: #efe6d5;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 20rpx;
  line-height: 1.6;
}
.empty {
  text-align: center;
  color: #b3a88f;
  font-size: 26rpx;
  padding: 60rpx 0;
}
.mk-item {
  background: #fffdf7;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(90, 80, 60, 0.05);
}
.mk-content {
  font-size: 27rpx;
  color: #3a3226;
  line-height: 1.7;
}
.mk-tags {
  margin-top: 14rpx;
}
.tag {
  display: inline-block;
  font-size: 22rpx;
  color: #5b6b52;
  background: #f0f3ea;
  border-radius: 8rpx;
  padding: 4rpx 14rpx;
  margin-right: 12rpx;
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
  height: 220rpx;
  background: #f2ecdf;
  border-radius: 14rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}
.input {
  height: 76rpx;
  background: #f2ecdf;
  border-radius: 14rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
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
