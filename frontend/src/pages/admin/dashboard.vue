<template>
  <view class="page">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-content">
        <TaijiBackButton />
        <view class="nav-title">
          <text class="title-text">管理后台</text>
        </view>
        <view class="nav-actions">
          <view class="nav-btn" @tap="logout">
            <text class="nav-btn-text">退出</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <scroll-view class="main-content" scroll-y>
      <!-- 管理员信息 -->
      <view class="admin-header">
        <view class="admin-avatar">
          <text class="avatar-emoji">👑</text>
        </view>
        <view class="admin-info">
          <text class="admin-name">超级管理员</text>
          <text class="admin-role">系统最高权限</text>
        </view>
        <view class="admin-status">
          <text class="status-dot online"></text>
          <text class="status-text">在线</text>
        </view>
      </view>

      <!-- 数据看板 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">数据看板</text>
          <text class="section-subtitle">系统运营数据概览</text>
        </view>
        
        <view class="stats-grid">
          <view class="stat-card" v-for="(stat, index) in dashboardStats" :key="index">
            <view class="stat-icon">
              <text class="icon-text">{{ stat.icon }}</text>
            </view>
            <view class="stat-info">
              <text class="stat-value">{{ stat.value }}</text>
              <text class="stat-name">{{ stat.name }}</text>
            </view>
            <view class="stat-trend" :class="stat.trend">
              <text class="trend-text">{{ stat.trendValue }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 管理功能 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">管理功能</text>
          <text class="section-subtitle">系统管理与运维</text>
        </view>
        
        <view class="admin-grid">
          <view class="admin-card" v-for="(admin, index) in adminFeatures" :key="index" @tap="admin.action">
            <view class="admin-icon">
              <text class="icon-text">{{ admin.icon }}</text>
            </view>
            <text class="admin-title">{{ admin.title }}</text>
            <text class="admin-desc">{{ admin.description }}</text>
            <view class="admin-badge" v-if="admin.badge">
              <text class="badge-text">{{ admin.badge }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 系统状态 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">系统状态</text>
          <text class="section-subtitle">实时监控与告警</text>
        </view>
        
        <view class="system-status">
          <view class="status-item" v-for="(status, index) in systemStatus" :key="index">
            <view class="status-indicator" :class="status.status">
              <text class="indicator-dot"></text>
            </view>
            <view class="status-info">
              <text class="status-name">{{ status.name }}</text>
              <text class="status-detail">{{ status.detail }}</text>
            </view>
            <text class="status-value">{{ status.value }}</text>
          </view>
        </view>
      </view>

      <!-- 最近操作 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">最近操作</text>
          <text class="section-subtitle">审计日志</text>
        </view>
        
        <view class="audit-log">
          <view class="log-item" v-for="(log, index) in auditLogs" :key="index">
            <view class="log-time">
              <text class="time-text">{{ log.time }}</text>
            </view>
            <view class="log-content">
              <text class="log-action">{{ log.action }}</text>
              <text class="log-detail">{{ log.detail }}</text>
            </view>
            <view class="log-operator">
              <text class="operator-text">{{ log.operator }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TaijiBackButton from '../../components/TaijiBackButton.vue';

// 管理员数据
const adminStats = ref({
  totalUsers: '1,234',
  activeUsers: '456',
  totalDigitalHumans: '789',
  totalKnowledge: '2,345'
});

// 仪表板统计
const dashboardStats = ref([
  {
    icon: '👥',
    name: '总用户数',
    value: '1,234',
    trend: 'up',
    trendValue: '+12%'
  },
  {
    icon: '🤖',
    name: '数字人总数',
    value: '789',
    trend: 'up',
    trendValue: '+8%'
  },
  {
    icon: '📚',
    name: '知识条目',
    value: '2,345',
    trend: 'up',
    trendValue: '+15%'
  },
  {
    icon: '💬',
    name: '今日对话',
    value: '456',
    trend: 'up',
    trendValue: '+23%'
  },
  {
    icon: '💎',
    name: '积分流通',
    value: '10,000+',
    trend: 'up',
    trendValue: '+18%'
  },
  {
    icon: '📈',
    name: '知识引用',
    value: '5,678',
    trend: 'up',
    trendValue: '+10%'
  }
]);

// 管理功能
const adminFeatures = ref([
  {
    icon: '👥',
    title: '用户管理',
    description: '查看、封禁、解封用户',
    badge: '12',
    action: () => goToUsers()
  },
  {
    icon: '📚',
    title: '知识库管理',
    description: '导入、审核、版本管理',
    badge: '8',
    action: () => goToKnowledge()
  },
  {
    icon: '🤖',
    title: '数字人管理',
    description: '查看、审核数字人',
    badge: '5',
    action: () => goToDigitalHumans()
  },
  {
    icon: '💎',
    title: '积分管理',
    description: '流水查询、调整',
    badge: '',
    action: () => goToPoints()
  },
  {
    icon: '🛡️',
    title: '内容安全',
    description: '敏感词、举报处理',
    badge: '3',
    action: () => goToContentSafety()
  },
  {
    icon: '📊',
    title: '数据看板',
    description: 'DAU、留存、转化率',
    badge: '',
    action: () => goToDashboard()
  }
]);

// 系统状态
const systemStatus = ref([
  {
    name: 'API服务',
    detail: 'NestJS主服务',
    value: '正常',
    status: 'online'
  },
  {
    name: '数据库',
    detail: 'PostgreSQL + pgvector',
    value: '正常',
    status: 'online'
  },
  {
    name: '缓存',
    detail: 'Redis 7',
    value: '正常',
    status: 'online'
  },
  {
    name: '任务队列',
    detail: 'BullMQ',
    value: '正常',
    status: 'online'
  },
  {
    name: 'WebSocket',
    detail: '实时通信',
    value: '正常',
    status: 'online'
  }
]);

// 审计日志
const auditLogs = ref([
  {
    time: '10:30',
    action: '用户封禁',
    detail: '用户ID: 12345，原因：违规操作',
    operator: 'admin'
  },
  {
    time: '09:15',
    action: '知识审核',
    detail: '通过知识条目ID: 67890',
    operator: 'admin'
  },
  {
    time: '08:45',
    action: '积分调整',
    detail: '用户ID: 54321，调整积分: +100',
    operator: 'admin'
  },
  {
    time: '08:20',
    action: '系统配置',
    detail: '更新每日一课章节范围',
    operator: 'admin'
  },
  {
    time: '08:00',
    action: '登录系统',
    detail: '超级管理员登录',
    operator: 'admin'
  }
]);

// 导航方法
function goBack() {
  uni.navigateBack();
}

function logout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出管理后台吗？',
    success: (res) => {
      if (res.confirm) {
        uni.navigateBack();
      }
    }
  });
}

function goToUsers() {
  uni.navigateTo({
    url: '/pages/admin/users'
  });
}

function goToKnowledge() {
  uni.navigateTo({
    url: '/pages/admin/knowledge'
  });
}

function goToDigitalHumans() {
  uni.showToast({ title: '功能开发中', icon: 'none' });
}

function goToPoints() {
  uni.showToast({ title: '功能开发中', icon: 'none' });
}

function goToContentSafety() {
  uni.showToast({ title: '功能开发中', icon: 'none' });
}

function goToDashboard() {
  uni.showToast({ title: '已在数据看板', icon: 'none' });
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

/* 主要内容区域 */
.main-content {
  flex: 1;
  margin-top: 88rpx;
  padding-bottom: 40rpx;
}

/* 管理员信息 */
.admin-header {
  display: flex;
  align-items: center;
  padding: 40rpx 30rpx;
  background: linear-gradient(135deg, #1a1a2e 0%, #2c3e50 100%);
  margin-bottom: 30rpx;
}

.admin-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 9999rpx;
  background: linear-gradient(135deg, #c9a96e 0%, #f1c40f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 30rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.2);
}

.avatar-emoji {
  font-size: 50rpx;
}

.admin-info {
  flex: 1;
}

.admin-name {
  font-size: 36rpx;
  font-weight: 700;
  color: white;
  display: block;
}

.admin-role {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 8rpx;
  display: block;
}

.admin-status {
  display: flex;
  align-items: center;
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 9999rpx;
  margin-right: 10rpx;
}

.status-dot.online {
  background: #2ecc71;
}

.status-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

/* 区域样式 */
.section {
  padding: 0 30rpx 30rpx;
}

.section-header {
  margin-bottom: 30rpx;
}

.section-subtitle {
  font-size: 26rpx;
  color: #8a7f6a;
  margin-top: 10rpx;
  display: block;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.stat-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 18rpx;
  background: rgba(201, 169, 110, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.icon-text {
  font-size: 40rpx;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32rpx;
  font-weight: 700;
  color: #1a1a2e;
  display: block;
}

.stat-name {
  font-size: 24rpx;
  color: #8a7f6a;
  margin-top: 4rpx;
  display: block;
}

.stat-trend {
  padding: 8rpx 16rpx;
  border-radius: 9999rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.stat-trend.up {
  background: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
}

.stat-trend.down {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

/* 管理功能网格 */
.admin-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.admin-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  position: relative;
  transition: transform 0.3s ease;
}

.admin-card:active {
  transform: scale(0.98);
}

.admin-icon {
  width: 70rpx;
  height: 70rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #c9a96e 0%, #f1c40f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.admin-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8rpx;
  display: block;
}

.admin-desc {
  font-size: 24rpx;
  color: #8a7f6a;
  line-height: 1.5;
  display: block;
}

.admin-badge {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  background: #e74c3c;
  color: white;
  padding: 6rpx 12rpx;
  border-radius: 9999rpx;
  font-size: 20rpx;
  font-weight: 600;
}

/* 系统状态 */
.system-status {
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.status-item {
  display: flex;
  align-items: center;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.status-item:last-child {
  border-bottom: none;
}

.status-indicator {
  margin-right: 20rpx;
}

.indicator-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 9999rpx;
  display: block;
}

.status-indicator.online .indicator-dot {
  background: #2ecc71;
}

.status-indicator.offline .indicator-dot {
  background: #e74c3c;
}

.status-indicator.warning .indicator-dot {
  background: #f39c12;
}

.status-info {
  flex: 1;
}

.status-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a2e;
  display: block;
}

.status-detail {
  font-size: 22rpx;
  color: #8a7f6a;
  margin-top: 4rpx;
  display: block;
}

.status-value {
  font-size: 24rpx;
  color: #8a7f6a;
}

/* 审计日志 */
.audit-log {
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.log-item {
  display: flex;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  margin-right: 20rpx;
}

.time-text {
  font-size: 24rpx;
  color: #8a7f6a;
}

.log-content {
  flex: 1;
}

.log-action {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a2e;
  display: block;
}

.log-detail {
  font-size: 22rpx;
  color: #8a7f6a;
  margin-top: 4rpx;
  display: block;
}

.log-operator {
  margin-left: 20rpx;
}

.operator-text {
  font-size: 24rpx;
  color: #c9a96e;
  font-weight: 600;
}

/* 响应式调整 */
@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .admin-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>