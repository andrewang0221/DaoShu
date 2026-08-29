<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="ink-circle"></div>
      <div class="ink-circle-2"></div>
      <div class="ink-circle-3"></div>
    </div>
    
    <div class="login-container">
      <div class="login-card">
        <div class="card-header">
          <div class="brand-mark">☯</div>
          <h1 class="brand-title">道枢</h1>
          <p class="brand-sub">东方智慧AI数字人 · 管理控制台</p>
          <div class="divider"></div>
        </div>

        <div class="card-body">
          <el-form @submit.prevent="login">
            <el-form-item>
              <el-input 
                v-model="account" 
                placeholder="管理员账号" 
                size="large"
                class="custom-input"
              />
            </el-form-item>
            <el-form-item>
              <el-input 
                v-model="password" 
                type="password" 
                placeholder="密码" 
                size="large"
                show-password
                class="custom-input"
              />
            </el-form-item>
            <el-button 
              type="primary" 
              size="large" 
              class="login-btn" 
              :loading="loading" 
              @click="login"
            >
              入 道 登 录
            </el-button>
          </el-form>
        </div>

        <div class="card-footer">
          <p class="footer-quote">「道可道，非常道」</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { adminApi } from '../api';

const router = useRouter();
const account = ref('admin');
const password = ref('');
const loading = ref(false);

async function login() {
  if (!account.value || !password.value) {
    ElMessage.warning('请输入账号和密码');
    return;
  }
  loading.value = true;
  try {
    const res = (await adminApi.login(account.value, password.value)) as {
      token: string;
      user: { username?: string; phone?: string; role: string };
    };
    if (res.user.role !== 'admin') {
      throw new Error('当前账号无管理员权限');
    }
    localStorage.setItem('admin_token', res.token);
    localStorage.setItem('admin_username', res.user.username ?? res.user.phone ?? account.value);
    router.push('/dashboard');
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: 
    radial-gradient(ellipse at 15% 20%, rgba(201, 168, 106, 0.12), transparent 45%),
    radial-gradient(ellipse at 85% 80%, rgba(123, 167, 188, 0.1), transparent 40%),
    radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.05), transparent 60%),
    linear-gradient(135deg, #1a1a2e 0%, #2a3a4e 50%, #1e3329 100%);
  overflow: hidden;
  position: relative;
}

/* ---------- 水墨背景动画 ---------- */
.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.ink-circle {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201, 168, 106, 0.15), transparent 60%);
  top: -150px;
  right: -100px;
  animation: float 12s ease-in-out infinite;
}

.ink-circle-2 {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(123, 167, 188, 0.1), transparent 60%);
  bottom: -100px;
  left: 10%;
  animation: float 15s ease-in-out infinite reverse;
}

.ink-circle-3 {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201, 168, 106, 0.08), transparent 60%);
  top: 40%;
  left: 40%;
  animation: float 18s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-30px) scale(1.05); }
}

/* ---------- 登录卡片 ---------- */
.login-container {
  position: relative;
  z-index: 10;
}

.login-card {
  width: 420px;
  background: rgba(246, 241, 230, 0.97);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(201, 168, 106, 0.4);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 40px rgba(201, 168, 106, 0.2);
  overflow: hidden;
  backdrop-filter: blur(20px);
}

/* ---------- 卡片头部 ---------- */
.card-header {
  text-align: center;
  padding: var(--space-10) var(--space-8) var(--space-6);
  background: 
    radial-gradient(ellipse at 50% 0%, rgba(201, 168, 106, 0.15), transparent 60%),
    linear-gradient(180deg, rgba(246, 241, 230, 1), rgba(246, 241, 230, 0.95));
}

.brand-mark {
  width: 72px;
  height: 72px;
  margin: 0 auto var(--space-4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: var(--color-paper);
  background: 
    radial-gradient(circle at 30% 30%, rgba(201, 168, 106, 0.5), rgba(47, 74, 58, 0.8));
  border: 2px solid rgba(201, 168, 106, 0.6);
  box-shadow: 
    0 0 30px rgba(201, 168, 106, 0.4),
    inset 0 0 20px rgba(0, 0, 0, 0.3);
  transition: var(--transition-slow);
}

.brand-mark:hover {
  transform: rotate(15deg) scale(1.05);
}

.brand-title {
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 8px;
  color: var(--color-jade);
  margin: 0 0 var(--space-2) 0;
}

.brand-sub {
  font-size: 14px;
  letter-spacing: 3px;
  color: var(--color-text-secondary);
  margin: 0;
}

.divider {
  width: 80px;
  height: 2px;
  margin: var(--space-5) auto 0;
  background: linear-gradient(90deg, transparent, var(--color-gold), transparent);
}

/* ---------- 卡片主体 ---------- */
.card-body {
  padding: var(--space-6) var(--space-8);
}

.custom-input :deep(.el-input__wrapper) {
  border-radius: var(--radius-md);
  box-shadow: 0 0 0 1px var(--color-border-light) inset;
}

.custom-input :deep(.el-input__wrapper:hover),
.custom-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--color-jade) inset;
}

.login-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
  letter-spacing: 8px;
  font-weight: 600;
  border-radius: var(--radius-md);
  margin-top: var(--space-4);
  background: linear-gradient(135deg, var(--color-jade), var(--color-jade-light));
  border: none;
  box-shadow: 0 4px 15px rgba(47, 74, 58, 0.3);
}

.login-btn:hover {
  background: linear-gradient(135deg, var(--color-jade-light), var(--color-jade));
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(47, 74, 58, 0.4);
}

/* ---------- 卡片底部 ---------- */
.card-footer {
  text-align: center;
  padding: var(--space-5) var(--space-8);
  background: rgba(246, 241, 230, 0.5);
  border-top: 1px solid rgba(201, 168, 106, 0.2);
}

.footer-quote {
  font-family: var(--font-kai);
  font-size: 14px;
  letter-spacing: 3px;
  color: var(--color-text-secondary);
  margin: 0;
  font-style: italic;
}

/* ---------- 响应式 ---------- */
@media (max-width: 480px) {
  .login-card {
    width: 90vw;
    margin: var(--space-4);
  }
  .card-header {
    padding: var(--space-8) var(--space-6) var(--space-5);
  }
  .brand-title {
    font-size: 24px;
    letter-spacing: 6px;
  }
}
</style>
