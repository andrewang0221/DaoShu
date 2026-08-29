<template>
  <div class="speech-page">
    <div class="page-card">
      <div class="card-head">
        <div>
          <div class="card-title">🎙️ 语音配置 · 科大讯飞</div>
          <div class="card-sub">
            语音识别（IAT）与语音合成（TTS）共用同一组讯飞凭据；签名在后端完成，Key 不下发前端
          </div>
        </div>
        <div class="state-chip" :class="cfg.configured ? 'on' : 'off'">
          {{ cfg.configured ? (cfg.enabled ? '已启用' : '已停用') : '未配置' }}
        </div>
      </div>

      <div class="form-grid">
        <div class="field">
          <label>AppID</label>
          <input v-model="form.appId" placeholder="讯飞应用 AppID（如 da87294c）" />
        </div>
        <div class="field">
          <label>API Key</label>
          <input v-model="form.apiKey" :placeholder="cfg.apiKeyMasked ? `已保存（${cfg.apiKeyMasked}），留空沿用` : '讯飞 APIKey'" />
        </div>
        <div class="field">
          <label>API Secret</label>
          <input v-model="form.apiSecret" :placeholder="cfg.apiSecretMasked ? `已保存（${cfg.apiSecretMasked}），留空沿用` : '讯飞 APISecret'" />
        </div>
        <div class="field">
          <label>合成音色</label>
          <select v-model="form.ttsVoice">
            <option v-for="v in voices" :key="v.code" :value="v.code">{{ v.label }}</option>
          </select>
        </div>
        <div class="field">
          <label>合成语速（{{ form.ttsSpeed }} / 100）</label>
          <input v-model.number="form.ttsSpeed" type="range" min="0" max="100" step="5" />
        </div>
        <div class="field">
          <label>启用状态</label>
          <div class="switch-row">
            <button class="mini-btn" :class="{ primary: form.enabled }" @click="form.enabled = !form.enabled">
              {{ form.enabled ? '已启用' : '已停用' }}
            </button>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存配置' }}</button>
        <button class="btn ghost" :disabled="testing" @click="test">{{ testing ? '测试中…' : '连通性测试' }}</button>
      </div>

      <div v-if="testResult" class="test-result" :class="testResult.ok ? 'ok' : 'fail'">
        {{ testResult.message }}
      </div>

      <div v-if="cfg.source === 'env'" class="env-note">
        当前使用服务器环境变量兜底配置；保存后将存入数据库并优先生效
      </div>

      <div class="usage-tip">
        <div class="tip-title">使用说明</div>
        <ul>
          <li>H5 聊天页：麦克风按钮按住说话（语音提问）、🔊 开关数字人语音播报（口型同步）</li>
          <li>麦克风需要 HTTPS 或 localhost 环境的浏览器授权</li>
          <li>音色 xiaoyan（小燕）/ aisjiuxu（许久）等为讯飞免费基础发音人</li>
          <li>讯飞免费额度：每天 500 次调用（识别+合成共额）</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { adminApi } from '../api';

const cfg = ref<any>({});
const form = reactive({
  appId: '',
  apiKey: '',
  apiSecret: '',
  ttsVoice: 'xiaoyan',
  ttsSpeed: 50,
  enabled: true,
});
const saving = ref(false);
const testing = ref(false);
const testResult = ref<{ ok: boolean; message: string } | null>(null);

const voices = [
  { code: 'xiaoyan', label: '小燕 · 女声标准（免费）' },
  { code: 'aisjiuxu', label: '许久 · 男声磁性（免费）' },
  { code: 'aisxping', label: '小萍 · 女声甜美（免费）' },
  { code: 'aisjying', label: '小婧 · 女声活泼（免费）' },
  { code: 'aisbabyxu', label: '许小宝 · 童声（免费）' },
];

async function load() {
  cfg.value = await adminApi.speechConfig();
  form.appId = cfg.value.appId ?? '';
  form.ttsVoice = cfg.value.ttsVoice ?? 'xiaoyan';
  form.ttsSpeed = cfg.value.ttsSpeed ?? 50;
  form.enabled = cfg.value.enabled ?? true;
}

async function save() {
  if (!form.appId.trim()) {
    testResult.value = { ok: false, message: 'AppID 不能为空' };
    return;
  }
  saving.value = true;
  testResult.value = null;
  try {
    const r: any = await adminApi.saveSpeechConfig({
      appId: form.appId,
      apiKey: form.apiKey,
      apiSecret: form.apiSecret,
      ttsVoice: form.ttsVoice,
      ttsSpeed: form.ttsSpeed,
      enabled: form.enabled,
    });
    testResult.value = { ok: true, message: r?.message || '配置已保存' };
    form.apiKey = '';
    form.apiSecret = '';
    await load();
  } catch (e: any) {
    testResult.value = { ok: false, message: e.message };
  } finally {
    saving.value = false;
  }
}

async function test() {
  testing.value = true;
  testResult.value = null;
  try {
    const r: any = await adminApi.testSpeechConfig({
      appId: form.appId,
      apiKey: form.apiKey,
      apiSecret: form.apiSecret,
      ttsVoice: form.ttsVoice,
      ttsSpeed: form.ttsSpeed,
    });
    testResult.value = { ok: !!r.ok, message: r.message };
  } catch (e: any) {
    testResult.value = { ok: false, message: e.message };
  } finally {
    testing.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.speech-page {
  max-width: 760px;
  margin: 0 auto;
}
.page-card {
  background: #fff;
  border: 1px solid rgba(201, 168, 106, 0.25);
  border-radius: 14px;
  padding: 28px 32px;
  box-shadow: 0 4px 24px rgba(42, 36, 26, 0.06);
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.card-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--color-jade, #2f4a3a);
}
.card-sub {
  margin-top: 6px;
  font-size: 13px;
  color: #9a8f78;
}
.state-chip {
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 12px;
  letter-spacing: 1px;
  white-space: nowrap;
}
.state-chip.on {
  background: rgba(91, 138, 76, 0.12);
  color: #5b8a4c;
}
.state-chip.off {
  background: rgba(192, 60, 59, 0.1);
  color: #c03c3b;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 24px;
}
.field label {
  display: block;
  font-size: 13px;
  color: #6b5f4a;
  margin-bottom: 6px;
  letter-spacing: 1px;
}
.field input,
.field select {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #ddd3bd;
  border-radius: 8px;
  font-size: 14px;
  color: #3a3226;
  background: #fffdf7;
  outline: none;
}
.field input:focus,
.field select:focus {
  border-color: #c9a86a;
}
.field input[type='range'] {
  padding: 0;
  border: none;
  accent-color: #5b8a4c;
}
.actions {
  display: flex;
  gap: 14px;
  margin-top: 26px;
}
.btn {
  padding: 10px 28px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #5b6b52, #2f4a3a);
  color: #f6f1e6;
  font-size: 14px;
  letter-spacing: 2px;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.btn.ghost {
  background: transparent;
  border: 1px solid #c9a86a;
  color: #8a6d3b;
}
.test-result {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
}
.test-result.ok {
  background: rgba(91, 138, 76, 0.1);
  color: #4c7a3d;
}
.test-result.fail {
  background: rgba(192, 60, 59, 0.08);
  color: #c03c3b;
}
.env-note {
  margin-top: 14px;
  font-size: 12px;
  color: #b3852f;
  background: rgba(201, 168, 106, 0.12);
  padding: 8px 14px;
  border-radius: 6px;
}
.usage-tip {
  margin-top: 26px;
  border-top: 1px dashed #e8dfc8;
  padding-top: 16px;
}
.tip-title {
  font-size: 13px;
  font-weight: 600;
  color: #6b5f4a;
  margin-bottom: 8px;
  letter-spacing: 1px;
}
.usage-tip ul {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: #9a8f78;
  line-height: 1.9;
}
.switch-row {
  display: flex;
  align-items: center;
  height: 40px;
}
.mini-btn {
  padding: 8px 22px;
  border: 1px solid #ddd3bd;
  border-radius: 20px;
  background: #f3eee2;
  color: #9a8f78;
  font-size: 13px;
  cursor: pointer;
}
.mini-btn.primary {
  background: rgba(91, 138, 76, 0.15);
  border-color: #5b8a4c;
  color: #4c7a3d;
}
</style>
