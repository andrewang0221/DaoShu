<template>
  <view class="page">
    <TaijiBackButton floating />
    <view class="head-card">
      <view class="head-title">大模型设置</view>
      <view class="head-desc">对话、数字人、论道研讨与求道板块共用大模型。未启用自定义模型时使用系统模型；启用后优先走您自己的 API（不消耗系统资源）。</view>
    </view>

    <!-- 系统模型（管理后台配置） -->
    <view class="section-title">系统模型（管理员配置）</view>
    <view v-if="models.length === 0" class="empty-tip">管理员尚未配置模型，可先使用自定义模型</view>
    <view v-for="m in models" :key="m.id" class="model-card">
      <view class="model-head">
        <view class="model-name">{{ m.displayName }}</view>
        <view class="model-role" :class="m.modelRole">{{ roleLabel(m.modelRole) }}</view>
      </view>
      <view class="model-row">
        <text class="model-label">模型名</text>
        <text class="model-value">{{ m.modelName }}</text>
      </view>
      <view class="model-row">
        <text class="model-label">供应商</text>
        <text class="model-value">{{ m.provider }}</text>
      </view>
      <view class="model-row">
        <text class="model-label">适用套餐</text>
        <text class="model-value">{{ tierLabel(m.minTier) }} 及以上</text>
      </view>
      <view v-if="m.description" class="model-desc">{{ m.description }}</view>
    </view>

    <!-- 自定义模型 -->
    <view class="section-title">自定义大模型 API</view>
    <view class="form-card">
      <view class="switch-row">
        <view>
          <view class="switch-label">启用自定义模型</view>
          <view class="switch-sub">{{ settings.enabled ? '已启用：对话等将优先使用您的 API' : '未启用：使用系统模型' }}</view>
        </view>
        <switch :checked="settings.enabled" color="#5b6b52" @change="onToggleEnabled" />
      </view>

      <view class="form-item">
        <view class="form-label">供应商</view>
        <picker :range="providerNames" @change="onProviderChange">
          <view class="picker-value">{{ providerLabel || '选择供应商（自动填入地址）' }}</view>
        </picker>
      </view>

      <view class="form-item">
        <view class="form-label">Base URL <text class="req">*</text></view>
        <input
          v-model="form.apiBaseUrl"
          class="form-input"
          placeholder="https://api.deepseek.com/v1"
          placeholder-class="ph"
        />
      </view>

      <view class="form-item">
        <view class="form-label">API Key <text class="req">*</text></view>
        <input
          v-model="form.apiKey"
          class="form-input"
          password
          :placeholder="settings.apiKeyMasked ? `已保存 ${settings.apiKeyMasked}，留空沿用` : 'sk-...'"
          placeholder-class="ph"
        />
      </view>

      <view class="form-item">
        <view class="form-label">模型名 <text class="req">*</text></view>
        <input
          v-model="form.modelName"
          class="form-input"
          placeholder="如 deepseek-chat"
          placeholder-class="ph"
        />
      </view>

      <view class="btn-row">
        <view class="btn ghost" :class="{ disabled: testing }" @tap="test">
          {{ testing ? '测试中…' : '测试连接' }}
        </view>
        <view class="btn solid" :class="{ disabled: saving }" @tap="save">
          {{ saving ? '保存中…' : '保存设置' }}
        </view>
      </view>
      <view v-if="testResult" class="test-result" :class="testResult.ok ? 'ok' : 'fail'">
        {{ testResult.message }}
      </view>
    </view>

    <view class="foot-tip">提示：自定义接口需兼容 OpenAI Chat Completions 协议（DeepSeek / 通义 / 智谱 / Kimi 等均支持）。向量记忆检索仍使用系统模型。</view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api, LLMModelItem, LLMSettings } from '../../api';
import TaijiBackButton from '../../components/TaijiBackButton.vue';

const PROVIDERS = [
  { label: 'DeepSeek', value: 'deepseek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { label: '通义千问', value: 'qwen', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { label: '智谱 GLM', value: 'glm', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  { label: 'Kimi（Moonshot）', value: 'moonshot', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { label: 'OpenAI', value: 'openai', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { label: '自定义', value: 'custom', baseUrl: '', model: '' },
];

const models = ref<LLMModelItem[]>([]);
const settings = ref<Partial<LLMSettings>>({});
const form = ref({ apiBaseUrl: '', apiKey: '', modelName: '', provider: 'custom' });
const saving = ref(false);
const testing = ref(false);
const testResult = ref<{ ok: boolean; message: string } | null>(null);

const providerNames = PROVIDERS.map((p) => p.label);
const providerLabel = computed(() => PROVIDERS.find((p) => p.value === form.value.provider)?.label ?? '');

onShow(load);

async function load() {
  try {
    const [modelList, s] = await Promise.all([api.llmModels(), api.llmSettings()]);
    models.value = modelList;
    settings.value = s;
    form.value.apiBaseUrl = s.apiBaseUrl ?? '';
    form.value.modelName = s.modelName ?? '';
    form.value.provider = s.provider ?? 'custom';
  } catch {
    // 后端未启动等
  }
}

function onProviderChange(e: { detail: { value: number } }) {
  const p = PROVIDERS[Number(e.detail.value)];
  if (!p) return;
  form.value.provider = p.value;
  if (p.baseUrl) form.value.apiBaseUrl = p.baseUrl;
  if (p.model) form.value.modelName = p.model;
}

async function onToggleEnabled(e: { detail: { value: boolean } }) {
  const enabled = e.detail.value;
  if (enabled && !settings.value.configured && !form.value.apiKey) {
    uni.showToast({ title: '请先保存完整的自定义配置', icon: 'none' });
    setTimeout(() => uni.redirectTo({ url: '/pages/llm-settings/llm-settings' }), 600);
    return;
  }
  try {
    settings.value = await api.saveLlmSettings({
      provider: form.value.provider,
      apiBaseUrl: form.value.apiBaseUrl,
      apiKey: form.value.apiKey || undefined,
      modelName: form.value.modelName,
      enabled,
    });
    uni.showToast({ title: enabled ? '已启用自定义模型' : '已切回系统模型', icon: 'none' });
  } catch {
    // 错误已提示
  }
}

async function save() {
  if (!form.value.apiBaseUrl || !form.value.modelName) {
    uni.showToast({ title: '请填写 Base URL 与模型名', icon: 'none' });
    return;
  }
  if (!form.value.apiKey && !settings.value.apiKeyMasked) {
    uni.showToast({ title: '请填写 API Key', icon: 'none' });
    return;
  }
  saving.value = true;
  try {
    settings.value = await api.saveLlmSettings({
      provider: form.value.provider,
      apiBaseUrl: form.value.apiBaseUrl,
      apiKey: form.value.apiKey || undefined,
      modelName: form.value.modelName,
      enabled: settings.value.enabled ?? false,
    });
    form.value.apiKey = '';
    uni.showToast({ title: '已保存', icon: 'success' });
  } catch {
    // 错误已提示
  } finally {
    saving.value = false;
  }
}

async function test() {
  if (!form.value.apiBaseUrl || !form.value.modelName) {
    uni.showToast({ title: '请先填写 Base URL 与模型名', icon: 'none' });
    return;
  }
  testing.value = true;
  testResult.value = null;
  try {
    testResult.value = await api.testLlmSettings({
      provider: form.value.provider,
      apiBaseUrl: form.value.apiBaseUrl,
      apiKey: form.value.apiKey || undefined,
      modelName: form.value.modelName,
    });
  } catch {
    testResult.value = { ok: false, message: '测试请求失败，请检查网络与地址' };
  } finally {
    testing.value = false;
  }
}

function roleLabel(role: string) {
  return { light: '轻量问答', heavy: '深度分析', embed: '向量检索' }[role] ?? role;
}

function tierLabel(tier: string) {
  return { free: '体验版', pro: 'Pro 会员', enterprise: '企业版' }[tier] ?? tier;
}
</script>

<style scoped>
.page {
  padding: 30rpx 30rpx 60rpx;
}
.head-card {
  background: linear-gradient(135deg, #5b6b52, #7a8a6a);
  border-radius: 24rpx;
  padding: 40rpx 30rpx;
  color: #fdfaf2;
  margin-bottom: 30rpx;
}
.head-title {
  font-size: 36rpx;
  font-weight: 600;
  letter-spacing: 4rpx;
}
.head-desc {
  margin-top: 14rpx;
  font-size: 24rpx;
  line-height: 1.7;
  opacity: 0.9;
}
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #3a3226;
  margin: 30rpx 0 16rpx;
}
.empty-tip {
  background: #fffdf7;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 26rpx;
  color: #8a7f6a;
  margin-bottom: 16rpx;
}
.model-card {
  background: #fffdf7;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(90, 80, 60, 0.06);
}
.model-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}
.model-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #3a3226;
}
.model-role {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 18rpx;
  background: #eef0e6;
  color: #5b6b52;
}
.model-role.heavy {
  background: #f5ecdc;
  color: #9a7b3f;
}
.model-role.embed {
  background: #e8eef0;
  color: #4a6a78;
}
.model-row {
  display: flex;
  justify-content: space-between;
  padding: 8rpx 0;
}
.model-label {
  font-size: 24rpx;
  color: #8a7f6a;
}
.model-value {
  font-size: 24rpx;
  color: #3a3226;
}
.model-desc {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #b3a88f;
  line-height: 1.6;
}
.form-card {
  background: #fffdf7;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(90, 80, 60, 0.06);
}
.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #efe9da;
  margin-bottom: 24rpx;
}
.switch-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #3a3226;
}
.switch-sub {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #8a7f6a;
}
.form-item {
  margin-bottom: 24rpx;
}
.form-label {
  font-size: 24rpx;
  color: #8a7f6a;
  margin-bottom: 10rpx;
}
.req {
  color: #c03c3b;
}
.picker-value {
  background: #f7f3e8;
  border-radius: 12rpx;
  padding: 18rpx 20rpx;
  font-size: 26rpx;
  color: #3a3226;
}
.form-input {
  background: #f7f3e8;
  border-radius: 12rpx;
  padding: 18rpx 20rpx;
  font-size: 26rpx;
  color: #3a3226;
}
.ph {
  color: #c9bfa8;
}
.btn-row {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}
.btn {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  border-radius: 40rpx;
  font-size: 28rpx;
}
.btn.solid {
  background: #5b6b52;
  color: #fdfaf2;
}
.btn.ghost {
  background: #eef0e6;
  color: #5b6b52;
}
.btn.disabled {
  opacity: 0.6;
}
.test-result {
  margin-top: 20rpx;
  padding: 18rpx 20rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  line-height: 1.6;
  word-break: break-all;
}
.test-result.ok {
  background: #ecf2e8;
  color: #4a6a3f;
}
.test-result.fail {
  background: #f7e9e8;
  color: #a0433f;
}
.foot-tip {
  margin-top: 30rpx;
  font-size: 22rpx;
  color: #b3a88f;
  line-height: 1.7;
}
</style>
