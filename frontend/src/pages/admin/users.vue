<template>
  <view class="page">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-content">
        <TaijiBackButton />
        <view class="nav-title">
          <text class="title-text">用户管理</text>
        </view>
        <view class="nav-actions">
          <view class="nav-btn" @tap="addUser">
            <text class="nav-btn-text">+</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input">
        <text class="search-icon">🔍</text>
        <input 
          v-model="searchQuery" 
          placeholder="搜索用户..." 
          class="input-field"
          @input="searchUsers"
        />
      </view>
      <view class="filter-btn" @tap="showFilter">
        <text class="filter-text">筛选</text>
      </view>
    </view>

    <!-- 用户列表 -->
    <scroll-view class="user-list" scroll-y>
      <view class="user-card" v-for="(user, index) in filteredUsers" :key="index">
        <view class="user-avatar">
          <text class="avatar-emoji">{{ user.avatar }}</text>
          <view class="status-dot" :class="user.status"></view>
        </view>
        
        <view class="user-info">
          <view class="user-header">
            <text class="user-name">{{ user.name }}</text>
            <view class="user-role" :class="user.role">
              <text class="role-text">{{ user.roleText }}</text>
            </view>
          </view>
          
          <view class="user-details">
            <text class="detail-item">ID: {{ user.id }}</text>
            <text class="detail-item">注册: {{ user.registerDate }}</text>
            <text class="detail-item">最后登录: {{ user.lastLogin }}</text>
          </view>
          
          <view class="user-stats">
            <view class="stat-item">
              <text class="stat-value">{{ user.digitalHumans }}</text>
              <text class="stat-label">数字人</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ user.points }}</text>
              <text class="stat-label">积分</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ user.knowledge }}</text>
              <text class="stat-label">知识条目</text>
            </view>
          </view>
        </view>
        
        <view class="user-actions">
          <view class="action-btn" @tap="viewUser(user)">
            <text class="action-text">查看</text>
          </view>
          <view class="action-btn" :class="user.status === 'active' ? 'ban' : 'unban'" @tap="toggleUserStatus(user)">
            <text class="action-text">{{ user.status === 'active' ? '封禁' : '解封' }}</text>
          </view>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view class="load-more" v-if="hasMore">
        <text class="load-text">加载更多...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TaijiBackButton from '../../components/TaijiBackButton.vue';

const searchQuery = ref('');
const hasMore = ref(true);

// 用户数据
const users = ref([
  {
    id: '10001',
    name: '张三',
    avatar: '👨',
    status: 'active',
    role: 'admin',
    roleText: '管理员',
    registerDate: '2024-01-15',
    lastLogin: '2024-03-20 10:30',
    digitalHumans: 2,
    points: 1250,
    knowledge: 15
  },
  {
    id: '10002',
    name: '李四',
    avatar: '👩',
    status: 'active',
    role: 'member',
    roleText: '成员',
    registerDate: '2024-02-20',
    lastLogin: '2024-03-19 14:45',
    digitalHumans: 1,
    points: 850,
    knowledge: 8
  },
  {
    id: '10003',
    name: '王五',
    avatar: '👨',
    status: 'banned',
    role: 'member',
    roleText: '成员',
    registerDate: '2024-03-01',
    lastLogin: '2024-03-15 09:20',
    digitalHumans: 1,
    points: 320,
    knowledge: 3
  },
  {
    id: '10004',
    name: '赵六',
    avatar: '👩',
    status: 'active',
    role: 'expert',
    roleText: '领域顾问',
    registerDate: '2024-01-10',
    lastLogin: '2024-03-20 11:15',
    digitalHumans: 1,
    points: 2100,
    knowledge: 25
  },
  {
    id: '10005',
    name: '孙七',
    avatar: '👨',
    status: 'active',
    role: 'contributor',
    roleText: '认证荐者',
    registerDate: '2024-02-05',
    lastLogin: '2024-03-18 16:30',
    digitalHumans: 1,
    points: 1580,
    knowledge: 18
  }
]);

// 筛选后的用户
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  
  return users.value.filter(user => 
    user.name.includes(searchQuery.value) || 
    user.id.includes(searchQuery.value)
  );
});

// 搜索用户
function searchUsers() {
  // 实际项目中这里会调用API进行搜索
  console.log('搜索用户:', searchQuery.value);
}

// 显示筛选
function showFilter() {
  uni.showToast({ title: '筛选功能开发中', icon: 'none' });
}

// 返回
function goBack() {
  uni.navigateBack();
}

// 添加用户
function addUser() {
  uni.showToast({ title: '添加用户功能开发中', icon: 'none' });
}

// 查看用户详情
function viewUser(user: any) {
  uni.showToast({ title: `查看用户: ${user.name}`, icon: 'none' });
}

// 切换用户状态
function toggleUserStatus(user: any) {
  const action = user.status === 'active' ? '封禁' : '解封';
  
  uni.showModal({
    title: `确认${action}`,
    content: `确定要${action}用户 ${user.name} 吗？`,
    success: (res) => {
      if (res.confirm) {
        // 实际项目中这里会调用API
        user.status = user.status === 'active' ? 'banned' : 'active';
        uni.showToast({ title: `${action}成功`, icon: 'success' });
      }
    }
  });
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
  width: 60rpx;
  height: 60rpx;
  border-radius: 9999rpx;
  background: rgba(255, 255, 255, 0.1);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn-text {
  font-size: 36rpx;
  color: white;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  margin-top: 88rpx;
  background: white;
  border-bottom: 1rpx solid #f0f0f0;
}

.search-input {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 9999rpx;
  padding: 16rpx 24rpx;
  margin-right: 20rpx;
}

.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.input-field {
  flex: 1;
  font-size: 28rpx;
  border: none;
  background: transparent;
}

.filter-btn {
  padding: 16rpx 24rpx;
  background: linear-gradient(135deg, #c9a96e 0%, #f1c40f 100%);
  border-radius: 9999rpx;
}

.filter-text {
  font-size: 28rpx;
  color: white;
  font-weight: 600;
}

/* 用户列表 */
.user-list {
  flex: 1;
  padding: 20rpx;
}

.user-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: flex-start;
}

.user-avatar {
  position: relative;
  margin-right: 24rpx;
}

.avatar-emoji {
  font-size: 60rpx;
}

.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20rpx;
  height: 20rpx;
  border-radius: 9999rpx;
  border: 4rpx solid white;
}

.status-dot.active {
  background: #2ecc71;
}

.status-dot.banned {
  background: #e74c3c;
}

.user-info {
  flex: 1;
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.user-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a2e;
  margin-right: 12rpx;
}

.user-role {
  padding: 4rpx 12rpx;
  border-radius: 9999rpx;
  font-size: 20rpx;
  font-weight: 600;
}

.user-role.admin {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.user-role.member {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.user-role.expert {
  background: rgba(155, 89, 182, 0.1);
  color: #9b59b6;
}

.user-role.contributor {
  background: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
}

.user-details {
  margin-bottom: 16rpx;
}

.detail-item {
  font-size: 22rpx;
  color: #8a7f6a;
  margin-right: 20rpx;
}

.user-stats {
  display: flex;
  gap: 30rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #c9a96e;
}

.stat-label {
  font-size: 20rpx;
  color: #8a7f6a;
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.action-btn {
  padding: 12rpx 20rpx;
  border-radius: 9999rpx;
  font-size: 22rpx;
  font-weight: 600;
  text-align: center;
}

.action-btn:first-child {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.action-btn.ban {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.action-btn.unban {
  background: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 40rpx;
}

.load-text {
  font-size: 26rpx;
  color: #8a7f6a;
}

/* 响应式调整 */
@media (min-width: 768px) {
  .user-card {
    display: flex;
    align-items: center;
  }
  
  .user-stats {
    gap: 60rpx;
  }
  
  .user-actions {
    flex-direction: row;
  }
}
</style>