<template>
  <view class="page">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-content">
        <TaijiBackButton />
        <view class="nav-title">
          <text class="title-text">知识库管理</text>
        </view>
        <view class="nav-actions">
          <view class="nav-btn" @tap="importKnowledge">
            <text class="nav-btn-text">导入</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 标签页 -->
    <view class="tabs">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'pending' }" 
        @tap="activeTab = 'pending'"
      >
        <text class="tab-text">待审核</text>
        <view class="tab-badge" v-if="pendingCount > 0">
          <text class="badge-text">{{ pendingCount }}</text>
        </view>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'approved' }" 
        @tap="activeTab = 'approved'"
      >
        <text class="tab-text">已通过</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'rejected' }" 
        @tap="activeTab = 'rejected'"
      >
        <text class="tab-text">已拒绝</text>
      </view>
    </view>

    <!-- 知识列表 -->
    <scroll-view class="knowledge-list" scroll-y>
      <view class="knowledge-card" v-for="(item, index) in filteredKnowledge" :key="index">
        <view class="knowledge-header">
          <view class="knowledge-status" :class="item.status">
            <text class="status-text">{{ item.statusText }}</text>
          </view>
          <view class="knowledge-meta">
            <text class="meta-item">ID: {{ item.id }}</text>
            <text class="meta-item">提交者: {{ item.submitter }}</text>
            <text class="meta-item">提交时间: {{ item.submitTime }}</text>
          </view>
        </view>
        
        <view class="knowledge-content">
          <text class="content-title">{{ item.title }}</text>
          <text class="content-text">{{ item.content }}</text>
          
          <view class="knowledge-tags">
            <text class="tag" v-for="(tag, tagIndex) in item.tags" :key="tagIndex">{{ tag }}</text>
          </view>
          
          <view class="knowledge-source">
            <text class="source-label">出处：</text>
            <text class="source-text">{{ item.source }}</text>
          </view>
        </view>
        
        <view class="knowledge-actions" v-if="item.status === 'pending'">
          <view class="action-btn approve" @tap="approveKnowledge(item)">
            <text class="action-text">通过</text>
          </view>
          <view class="action-btn reject" @tap="rejectKnowledge(item)">
            <text class="action-text">拒绝</text>
          </view>
          <view class="action-btn revision" @tap="requestRevision(item)">
            <text class="action-text">修改</text>
          </view>
        </view>
        
        <view class="knowledge-actions" v-else>
          <view class="action-btn view" @tap="viewKnowledge(item)">
            <text class="action-text">查看</text>
          </view>
          <view class="action-btn rollback" v-if="item.status === 'approved'" @tap="rollbackKnowledge(item)">
            <text class="action-text">回滚</text>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-if="filteredKnowledge.length === 0">
        <text class="empty-icon">📚</text>
        <text class="empty-text">暂无{{ activeTab === 'pending' ? '待审核' : activeTab === 'approved' ? '已通过' : '已拒绝' }}的知识条目</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TaijiBackButton from '../../components/TaijiBackButton.vue';

const activeTab = ref('pending');
const pendingCount = ref(5);

// 知识数据
const knowledgeItems = ref([
  {
    id: 'K001',
    title: '道德经第一章新解',
    content: '道可道，非常道；名可名，非常名。无名天地之始，有名万物之母。故常无欲以观其妙，常有欲以观其徼。此两者同出而异名，同谓之玄，玄之又玄，众妙之门。',
    status: 'pending',
    statusText: '待审核',
    submitter: '张三',
    submitTime: '2024-03-20 10:30',
    tags: ['原文', '第一章', '注解'],
    source: '王弼注《道德经》'
  },
  {
    id: 'K002',
    title: '无为而治在现代管理中的应用',
    content: '在现代企业管理中，"无为而治"并非消极不作为，而是指管理者应顺应自然规律，减少不必要的干预，让系统自组织、自运行。',
    status: 'approved',
    statusText: '已通过',
    submitter: '李四',
    submitTime: '2024-03-19 14:45',
    tags: ['应用', '管理', '现代'],
    source: '《道德经》第三十七章'
  },
  {
    id: 'K003',
    title: '上善若水的处世智慧',
    content: '上善若水，水善利万物而不争，处众人之所恶，故几于道。在人际关系中，我们应学习水的品德：利他、不争、处下。',
    status: 'approved',
    statusText: '已通过',
    submitter: '王五',
    submitTime: '2024-03-18 09:20',
    tags: ['处世', '智慧', '第八章'],
    source: '《道德经》第八章'
  },
  {
    id: 'K004',
    title: '知足不辱的财务观',
    content: '知足不辱，知止不殆，可以长久。在个人财务管理中，懂得满足、知道适可而止，才能避免陷入财务危机。',
    status: 'rejected',
    statusText: '已拒绝',
    submitter: '赵六',
    submitTime: '2024-03-17 16:30',
    tags: ['财务', '知足', '第四十四章'],
    source: '《道德经》第四十四章'
  },
  {
    id: 'K005',
    title: '反者道之动的逆向思维',
    content: '反者道之动，弱者道之用。天下万物生于有，有生于无。这揭示了事物发展的辩证规律：物极必反，以柔克刚。',
    status: 'pending',
    statusText: '待审核',
    submitter: '孙七',
    submitTime: '2024-03-16 11:15',
    tags: ['哲学', '辩证', '第四十章'],
    source: '《道德经》第四0章'
  }
]);

// 筛选后的知识
const filteredKnowledge = computed(() => {
  return knowledgeItems.value.filter(item => item.status === activeTab.value);
});

// 返回
function goBack() {
  uni.navigateBack();
}

// 导入知识
function importKnowledge() {
  uni.showToast({ title: '导入功能开发中', icon: 'none' });
}

// 审核知识
function approveKnowledge(item: any) {
  uni.showModal({
    title: '确认通过',
    content: `确定要通过知识条目 "${item.title}" 吗？`,
    success: (res) => {
      if (res.confirm) {
        item.status = 'approved';
        item.statusText = '已通过';
        pendingCount.value--;
        uni.showToast({ title: '审核通过', icon: 'success' });
      }
    }
  });
}

function rejectKnowledge(item: any) {
  uni.showModal({
    title: '确认拒绝',
    content: `确定要拒绝知识条目 "${item.title}" 吗？`,
    success: (res) => {
      if (res.confirm) {
        item.status = 'rejected';
        item.statusText = '已拒绝';
        pendingCount.value--;
        uni.showToast({ title: '已拒绝', icon: 'none' });
      }
    }
  });
}

function requestRevision(item: any) {
  uni.showToast({ title: '修改功能开发中', icon: 'none' });
}

function viewKnowledge(item: any) {
  uni.showToast({ title: `查看: ${item.title}`, icon: 'none' });
}

function rollbackKnowledge(item: any) {
  uni.showToast({ title: '回滚功能开发中', icon: 'none' });
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f5;
}

/* 导航栏样式 */
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #1a1a2e;
  border-bottom: 1rpx solid rgba(201, 169, 110, 0.2);
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  height: 88rpx;
}

.nav-back {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-text {
  font-size: 36rpx;
  color: white;
}

.nav-title {
  flex: 1;
  text-align: center;
}

.title-text {
  font-size: 32rpx;
  font-weight: 600;
  color: white;
}

.nav-actions {
  width: 60rpx;
}

.nav-btn {
  padding: 10rpx 20rpx;
  border-radius: 9999rpx;
  background: rgba(255, 255, 255, 0.1);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.nav-btn-text {
  font-size: 24rpx;
  color: white;
}

/* 标签页 */
.tabs {
  display: flex;
  background: white;
  margin-top: 88rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24rpx;
  position: relative;
}

.tab-item.active {
  border-bottom: 4rpx solid #c9a96e;
}

.tab-text {
  font-size: 28rpx;
  color: #8a7f6a;
  font-weight: 500;
}

.tab-item.active .tab-text {
  color: #c9a96e;
  font-weight: 600;
}

.tab-badge {
  position: absolute;
  top: 16rpx;
  right: 30rpx;
  background: #e74c3c;
  color: white;
  padding: 4rpx 10rpx;
  border-radius: 9999rpx;
  font-size: 20rpx;
  font-weight: 600;
}

/* 知识列表 */
.knowledge-list {
  flex: 1;
  padding: 20rpx;
}

.knowledge-card {
  background: white;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.knowledge-header {
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.knowledge-status {
  padding: 8rpx 16rpx;
  border-radius: 9999rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.knowledge-status.pending {
  background: rgba(243, 156, 18, 0.1);
  color: #f39c12;
}

.knowledge-status.approved {
  background: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
}

.knowledge-status.rejected {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.knowledge-meta {
  display: flex;
  gap: 20rpx;
}

.meta-item {
  font-size: 22rpx;
  color: #8a7f6a;
}

.knowledge-content {
  padding: 24rpx;
}

.content-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 12rpx;
  display: block;
}

.content-text {
  font-size: 26rpx;
  color: #5a5a5a;
  line-height: 1.6;
  margin-bottom: 16rpx;
  display: block;
}

.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.tag {
  padding: 6rpx 12rpx;
  background: rgba(201, 169, 110, 0.1);
  color: #c9a96e;
  border-radius: 9999rpx;
  font-size: 22rpx;
  font-weight: 500;
}

.knowledge-source {
  display: flex;
  align-items: center;
  padding: 16rpx;
  background: #f9f9f9;
  border-radius: 8rpx;
}

.source-label {
  font-size: 24rpx;
  color: #8a7f6a;
  margin-right: 8rpx;
}

.source-text {
  font-size: 24rpx;
  color: #5a5a5a;
}

.knowledge-actions {
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-btn {
  flex: 1;
  padding: 16rpx;
  border-radius: 9999rpx;
  font-size: 26rpx;
  font-weight: 600;
  text-align: center;
}

.action-btn.approve {
  background: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
}

.action-btn.reject {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.action-btn.revision {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.action-btn.view {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.action-btn.rollback {
  background: rgba(243, 156, 18, 0.1);
  color: #f39c12;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 40rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #8a7f6a;
  text-align: center;
}

/* 响应式调整 */
@media (min-width: 768px) {
  .knowledge-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12rpx;
  }
  
  .knowledge-meta {
    flex-wrap: wrap;
  }
  
  .knowledge-actions {
    justify-content: flex-end;
  }
  
  .action-btn {
    flex: none;
    padding: 16rpx 40rpx;
  }
}
</style>