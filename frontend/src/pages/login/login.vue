<template>
  <view class="page">
    <TaijiBackButton floating />
    <view class="brand">
      <view class="brand-mark">☯</view>
      <text class="brand-title">道枢</text>
      <text class="brand-sub">东方智慧AI数字人 · 账号系统</text>
    </view>

    <view class="card">
      <view class="tabs">
        <view
          v-for="t in tabs"
          :key="t.key"
          class="tab"
          :class="{ active: tab === t.key }"
          @tap="tab = t.key"
        >
          <text class="tab-text">{{ t.label }}</text>
        </view>
      </view>

      <!-- 登录 -->
      <view v-if="tab === 'login'" class="form">
        <input class="field" v-model="loginForm.account" placeholder="账号 / 邮箱 / 手机号" placeholder-class="ph" />
        <input class="field" v-model="loginForm.password" password placeholder="密码" placeholder-class="ph" />
        <button class="btn primary" :loading="loading" @tap="doLogin">登 录</button>
        <view class="link-row">
          <text class="link" @tap="tab = 'forgot'">忘记密码？</text>
          <text class="link" @tap="tab = 'register'">注册账号</text>
        </view>
      </view>

      <!-- 注册 -->
      <view v-else-if="tab === 'register'" class="form">
        <input class="field" v-model="regForm.username" placeholder="账号（3-32 位字母/数字/下划线）" placeholder-class="ph" />
        <input class="field" v-model="regForm.email" placeholder="邮箱（用于找回密码，选填）" placeholder-class="ph" />
        <input class="field" v-model="regForm.password" password placeholder="密码（6-64 位）" placeholder-class="ph" />
        <input class="field" v-model="regForm.confirm" password placeholder="确认密码" placeholder-class="ph" />
        <button class="btn primary" :loading="loading" @tap="doRegister">注 册</button>
        <view class="link-row">
          <text class="link" @tap="tab = 'login'">已有账号？去登录</text>
        </view>
      </view>

      <!-- 找回密码 -->
      <view v-else class="form">
        <input class="field" v-model="resetForm.account" placeholder="账号 / 邮箱 / 手机号" placeholder-class="ph" />
        <view class="code-row">
          <input class="field code" v-model="resetForm.code" placeholder="验证码" placeholder-class="ph" />
          <view class="code-btn" :class="{ disabled: codeSending }" @tap="sendCode">
            <text class="code-btn-text">{{ codeSending ? secs + 's' : '获取验证码' }}</text>
          </view>
        </view>
        <input class="field" v-model="resetForm.password" password placeholder="新密码（6-64 位）" placeholder-class="ph" />
        <button class="btn primary" :loading="loading" @tap="doReset">重置密码</button>
        <view class="link-row">
          <text class="link" @tap="tab = 'login'">返回登录</text>
        </view>
      </view>
    </view>

    <text class="footnote">「道，可道也，非恒道也」</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAppStore } from '../../store';
import { api } from '../../api';
import TaijiBackButton from '../../components/TaijiBackButton.vue';
import type { AuthUser } from '../../api';

const store = useAppStore();
const tab = ref<'login' | 'register' | 'forgot'>('login');
const tabs = [
  { key: 'login' as const, label: '登录' },
  { key: 'register' as const, label: '注册' },
  { key: 'forgot' as const, label: '找回密码' },
];

const loading = ref(false);
const loginForm = ref({ account: '', password: '' });
const regForm = ref({ username: '', email: '', password: '', confirm: '' });
const resetForm = ref({ account: '', code: '', password: '' });

const codeSending = ref(false);
const secs = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

function finishAuth(res: { token: string; user: AuthUser }) {
  store.setAuth(res.token, res.user);
  uni.showToast({ title: '登录成功', icon: 'success' });
  setTimeout(() => {
    uni.navigateBack({
      fail: () => uni.reLaunch({ url: '/pages/index/index' }),
    });
  }, 600);
}

async function doLogin() {
  if (!loginForm.value.account || !loginForm.value.password) {
    uni.showToast({ title: '请输入账号和密码', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    const res = await api.login(loginForm.value.account, loginForm.value.password);
    finishAuth(res);
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function doRegister() {
  if (!regForm.value.username || !regForm.value.password) {
    uni.showToast({ title: '请输入账号和密码', icon: 'none' });
    return;
  }
  if (regForm.value.password !== regForm.value.confirm) {
    uni.showToast({ title: '两次密码不一致', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    const res = await api.register({
      username: regForm.value.username,
      password: regForm.value.password,
      email: regForm.value.email || undefined,
    });
    finishAuth(res);
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function sendCode() {
  if (codeSending.value) return;
  if (!resetForm.value.account) {
    uni.showToast({ title: '请先输入账号/邮箱', icon: 'none' });
    return;
  }
  codeSending.value = true;
  try {
    const res = await api.forgotPassword(resetForm.value.account);
    uni.showToast({ title: res.message || '验证码已发送', icon: 'none' });
    // 开发环境未配置邮箱服务时，后端会将验证码随 devCode 返回
    if (res.devCode) {
      resetForm.value.code = res.devCode;
      uni.showToast({ title: '验证码：' + res.devCode, icon: 'none', duration: 4000 });
    }
    secs.value = 60;
    timer = setInterval(() => {
      secs.value -= 1;
      if (secs.value <= 0 && timer) {
        clearInterval(timer);
        timer = null;
        codeSending.value = false;
      }
    }, 1000);
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
    codeSending.value = false;
  }
}

async function doReset() {
  if (!resetForm.value.account || !resetForm.value.code || !resetForm.value.password) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    await api.resetPassword(
      resetForm.value.account,
      resetForm.value.code,
      resetForm.value.password,
    );
    uni.showToast({ title: '重置成功，请登录', icon: 'success' });
    tab.value = 'login';
    loginForm.value.account = resetForm.value.account;
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 60rpx 60rpx;
  background:
    radial-gradient(ellipse at 15% 10%, rgba(201, 169, 110, 0.12), transparent 45%),
    radial-gradient(ellipse at 85% 90%, rgba(123, 167, 188, 0.1), transparent 40%),
    linear-gradient(135deg, #1a1a2e 0%, #2a3a4e 50%, #1e3329 100%);
  box-sizing: border-box;
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}
.brand-mark {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  color: #f6f1e6;
  background: radial-gradient(circle at 30% 30%, rgba(201, 169, 110, 0.5), rgba(47, 74, 58, 0.8));
  border: 2rpx solid rgba(201, 169, 110, 0.6);
  margin-bottom: 24rpx;
}
.brand-title {
  font-size: 44rpx;
  font-weight: 700;
  letter-spacing: 8rpx;
  color: #f6f1e6;
}
.brand-sub {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: rgba(246, 241, 230, 0.7);
}

.card {
  width: 100%;
  max-width: 640rpx;
  background: rgba(246, 241, 230, 0.97);
  border-radius: 24rpx;
  border: 1rpx solid rgba(201, 169, 110, 0.4);
  padding: 40rpx;
  box-sizing: border-box;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
}

.tabs {
  display: flex;
  margin-bottom: 40rpx;
  border-bottom: 1rpx solid rgba(26, 26, 46, 0.08);
}
.tab {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  position: relative;
}
.tab-text {
  font-size: 30rpx;
  color: #8a7f6a;
}
.tab.active .tab-text {
  color: #5b6b52;
  font-weight: 700;
}
.tab.active::after {
  content: '';
  position: absolute;
  left: 40%;
  right: 40%;
  bottom: -1rpx;
  height: 6rpx;
  border-radius: 3rpx;
  background: #5b6b52;
}

.form {
  display: flex;
  flex-direction: column;
}
.field {
  height: 92rpx;
  background: #fffdf7;
  border: 1rpx solid #e7e0cf;
  border-radius: 14rpx;
  padding: 0 26rpx;
  font-size: 28rpx;
  color: #1a1a2e;
  margin-bottom: 24rpx;
  box-sizing: border-box;
}
.ph {
  color: #b8ae97;
}
.code-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.code {
  flex: 1;
}
.code-btn {
  width: 200rpx;
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0e9d6;
  border-radius: 14rpx;
  margin-bottom: 24rpx;
}
.code-btn-text {
  font-size: 24rpx;
  color: #5b6b52;
}
.code-btn.disabled {
  opacity: 0.5;
}

.btn {
  margin-top: 16rpx;
  border-radius: 14rpx;
  font-size: 30rpx;
  letter-spacing: 4rpx;
  height: 92rpx;
  line-height: 92rpx;
}
.btn.primary {
  background: linear-gradient(135deg, #5b6b52, #2f4a3a);
  color: #fffdf7;
}
.btn::after {
  border: none;
}

.link-row {
  display: flex;
  justify-content: space-between;
  margin-top: 28rpx;
}
.link {
  font-size: 26rpx;
  color: #5b6b52;
}

.footnote {
  margin-top: 48rpx;
  font-size: 24rpx;
  color: rgba(246, 241, 230, 0.5);
}
</style>