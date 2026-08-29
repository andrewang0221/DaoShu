<template>
  <div class="layout">
    <!-- 侧栏：玄墨深邃 -->
    <aside class="aside">
      <div class="brand">
        <div class="brand-mark">☯</div>
        <div class="brand-text">
          <div class="brand-title">道枢</div>
          <div class="brand-sub">东方智慧AI数字人 · 管理台</div>
        </div>
      </div>

      <nav class="nav">
        <router-link
          v-for="m in menus"
          :key="m.path"
          :to="m.path"
          class="nav-item"
          :class="{ active: $route.path.startsWith(m.path) }"
        >
          <span class="nav-icon">{{ m.icon }}</span>
          <span class="nav-label">{{ m.label }}</span>
          <span class="nav-dot"></span>
        </router-link>
      </nav>

      <div class="aside-footer">
        <div class="footer-divider"></div>
        <div class="footer-quote">道法自然</div>
      </div>
    </aside>

    <!-- 主区：宣纸留白 -->
    <div class="content">
      <header class="header">
        <div class="page-title">
          <span class="title-icon">◆</span>
          {{ $route.meta.title }}
        </div>
        <div class="user-info">
          <span class="user-name">{{ userPhone }}</span>
          <span class="user-sep">·</span>
          <span class="logout" @click="logout">退出</span>
        </div>
      </header>

      <main class="main page-bg">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const userPhone = computed(() => localStorage.getItem('admin_username') ?? '管理员');

const menus = [
  { path: '/dashboard', icon: '☯', label: '数据看板' },
  { path: '/models', icon: '🧠', label: '大模型配置' },
  { path: '/speech', icon: '🎙️', label: '语音配置' },
  { path: '/plans', icon: '💎', label: '套餐管理' },
  { path: '/knowledge', icon: '📜', label: '知识库审核' },
  { path: '/ipr', icon: '©️', label: '知识产权服务' },
  { path: '/users', icon: '👥', label: '用户管理' },
  { path: '/points', icon: '💠', label: '积分账务' },
  { path: '/audit', icon: '🧾', label: '审计日志' },
];

function logout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_username');
  router.push('/login');
}
</script>

<style scoped>
/* ---------- 整体布局 ---------- */
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--color-ink);
}

/* ---------- 侧栏：玄墨深邃 + 水墨质感 ---------- */
.aside {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: 
    radial-gradient(ellipse at 30% 20%, rgba(201, 168, 106, 0.08), transparent 50%),
    linear-gradient(180deg, #1a1a2e 0%, #16162a 100%);
  border-right: 1px solid rgba(201, 168, 106, 0.2);
  position: relative;
  overflow: hidden;
}

/* 水墨纹理背景 */
.aside::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: 
    radial-gradient(circle at 30% 40%, rgba(201, 168, 106, 0.05), transparent 40%),
    radial-gradient(circle at 70% 60%, rgba(123, 167, 188, 0.03), transparent 35%);
  pointer-events: none;
}

/* ---------- Logo 区域 ---------- */
.brand {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-8) var(--space-6);
  border-bottom: 1px solid rgba(201, 168, 106, 0.15);
  position: relative;
  z-index: 1;
}

.brand-mark {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--color-paper);
  background: 
    radial-gradient(circle at 30% 30%, rgba(201, 168, 106, 0.4), rgba(47, 74, 58, 0.8));
  border: 2px solid rgba(201, 168, 106, 0.5);
  box-shadow: 
    0 0 20px rgba(201, 168, 106, 0.3),
    inset 0 0 10px rgba(0, 0, 0, 0.2);
  transition: var(--transition-slow);
}

.brand:hover .brand-mark {
  transform: rotate(10deg) scale(1.05);
  box-shadow: 
    0 0 30px rgba(201, 168, 106, 0.5),
    inset 0 0 15px rgba(0, 0, 0, 0.3);
}

.brand-text {
  flex: 1;
}

.brand-title {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 4px;
  color: var(--color-paper);
  text-shadow: 0 0 20px rgba(201, 168, 106, 0.3);
}

.brand-sub {
  margin-top: var(--space-1);
  font-size: 12px;
  letter-spacing: 2px;
  color: rgba(201, 168, 106, 0.7);
  font-weight: 300;
}

/* ---------- 导航菜单 ---------- */
.nav {
  flex: 1;
  padding: var(--space-6) var(--space-4);
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-2);
  border-radius: var(--radius-md);
  color: rgba(246, 241, 230, 0.7);
  text-decoration: none;
  font-size: 14px;
  letter-spacing: 2px;
  border-left: 3px solid transparent;
  transition: var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(201, 168, 106, 0.1), transparent);
  opacity: 0;
  transition: var(--transition-normal);
}

.nav-item:hover {
  background: rgba(201, 168, 106, 0.08);
  color: var(--color-paper);
}

.nav-item:hover::before {
  opacity: 1;
}

.nav-item.active {
  background: linear-gradient(90deg, rgba(201, 168, 106, 0.15), rgba(201, 168, 106, 0.05));
  color: var(--color-paper);
  border-left-color: var(--color-gold);
  box-shadow: inset 0 0 20px rgba(201, 168, 106, 0.1);
}

.nav-item.active::before {
  opacity: 1;
}

.nav-icon {
  width: 24px;
  text-align: center;
  font-size: 16px;
  opacity: 0.9;
}

.nav-dot {
  margin-left: auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: transparent;
  transition: var(--transition-normal);
}

.nav-item.active .nav-dot {
  background: var(--color-gold);
  box-shadow: 0 0 10px rgba(201, 168, 106, 0.8);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ---------- 页脚 ---------- */
.aside-footer {
  padding: var(--space-4) var(--space-6);
  position: relative;
  z-index: 1;
}

.footer-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(201, 168, 106, 0.3), transparent);
  margin-bottom: var(--space-4);
}

.footer-quote {
  font-family: var(--font-kai);
  font-size: 13px;
  letter-spacing: 4px;
  text-align: center;
  color: rgba(201, 168, 106, 0.5);
  font-style: italic;
}

/* ---------- 主内容区 ---------- */
.content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ---------- 顶栏：宣纸留白 ---------- */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  flex-shrink: 0;
  padding: 0 var(--space-8);
  background: rgba(246, 241, 230, 0.95);
  border-bottom: 1px solid var(--color-border-light);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 10;
}

/* 顶栏底部水墨线 */
.header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: var(--space-8);
  right: var(--space-8);
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-gold), transparent);
}

.page-title {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 3px;
  color: var(--color-jade);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.title-icon {
  color: var(--color-gold);
  font-size: 10px;
}

.user-info {
  font-size: 14px;
  color: var(--color-text-secondary);
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.user-name {
  color: var(--color-jade);
  font-weight: 600;
  font-family: var(--font-serif);
}

.user-sep {
  color: var(--color-gold);
}

.logout {
  cursor: pointer;
  color: var(--color-text-tertiary);
  transition: var(--transition-normal);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.logout:hover {
  color: var(--color-vermillion);
  background: rgba(192, 60, 59, 0.1);
}

/* ---------- 主内容：宣纸留白 ---------- */
.main {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-8);
  position: relative;
}

/* 滚动条美化 */
.main::-webkit-scrollbar {
  width: 6px;
}

.main::-webkit-scrollbar-track {
  background: transparent;
}

.main::-webkit-scrollbar-thumb {
  background: rgba(201, 168, 106, 0.3);
  border-radius: 3px;
}

.main::-webkit-scrollbar-thumb:hover {
  background: rgba(201, 168, 106, 0.5);
}
</style>
