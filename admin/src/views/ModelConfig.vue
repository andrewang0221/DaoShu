<template>
  <div class="models-page">
    <div class="page-header">
      <h2 class="page-title">🧠 大模型配置</h2>
      <p class="page-desc">配置系统大模型（对话、数字人、论道研讨、求道板块统一调用）；用户也可在「我的-大模型设置」配置自有 API 优先使用</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-num">{{ models.length }}</div>
        <div class="stat-label">模型总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ enabledCount }}</div>
        <div class="stat-label">已启用</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ readyCount }}</div>
        <div class="stat-label">已配 Key 可用</div>
      </div>
      <div class="stat-card" :class="{ warn: noKeyCount > 0 }">
        <div class="stat-num">{{ noKeyCount }}</div>
        <div class="stat-label">缺 API Key</div>
      </div>
    </div>

    <div class="content-card">
      <div class="card-header">
        <span>模型列表</span>
        <el-button size="small" type="primary" @click="openDialog()">新增模型</el-button>
      </div>

      <el-table :data="models" v-loading="loading" class="models-table">
        <el-table-column prop="displayName" label="展示名" width="140" />
        <el-table-column prop="modelKey" label="标识" width="140" />
        <el-table-column prop="provider" label="供应商" width="110" />
        <el-table-column prop="modelName" label="模型名" width="170" />
        <el-table-column label="用途" width="100">
          <template #default="{ row }">
            <el-tag :type="roleTagType(row.modelRole)" size="small">
              {{ roleLabel(row.modelRole) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最低套餐" width="100">
          <template #default="{ row }">
            <el-tag :type="row.minTier === 'free' ? 'info' : row.minTier === 'pro' ? 'warning' : 'danger'" size="small" effect="plain">
              {{ tierLabel(row.minTier) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="API Key" width="130">
          <template #default="{ row }">
            <span v-if="row.apiKey" class="key-ok">{{ maskKey(row.apiKey) }}</span>
            <span v-else class="key-missing">未配置</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="apiBaseUrl" label="Base URL" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" plain @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="success" plain :loading="testingId === row.id" @click="test(row)">测试</el-button>
            <el-button size="small" :type="row.enabled ? 'warning' : 'primary'" plain @click="toggle(row)">
              {{ row.enabled ? '停用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" plain @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑模型' : '新增模型'" width="640px" destroy-on-close>
      <el-form :model="form" label-width="110px">
        <el-form-item label="供应商">
          <el-select v-model="form.provider" placeholder="选择供应商（自动填 Base URL）" @change="onProviderChange">
            <el-option v-for="p in PROVIDERS" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="展示名" required>
          <el-input v-model="form.displayName" placeholder="如：DeepSeek 对话模型" />
        </el-form-item>
        <el-form-item label="模型标识" required>
          <el-input v-model="form.modelKey" placeholder="唯一标识，如 deepseek-chat" :disabled="!!editing" />
        </el-form-item>
        <el-form-item label="Base URL" required>
          <el-input v-model="form.apiBaseUrl" placeholder="https://api.deepseek.com/v1" />
        </el-form-item>
        <el-form-item label="API Key" :required="!editing">
          <el-input
            v-model="form.apiKey"
            type="password"
            show-password
            :placeholder="editing ? '留空则沿用原 Key' : 'sk-...'"
          />
        </el-form-item>
        <el-form-item label="模型名" required>
          <el-input v-model="form.modelName" placeholder="deepseek-chat" />
        </el-form-item>
        <el-form-item label="用途分级">
          <el-radio-group v-model="form.modelRole">
            <el-radio value="light">轻量（日常问答）</el-radio>
            <el-radio value="heavy">深度（复盘分析）</el-radio>
            <el-radio value="embed">向量（记忆检索）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="最低套餐">
          <el-select v-model="form.minTier">
            <el-option label="体验版（free）" value="free" />
            <el-option label="Pro 会员" value="pro" />
            <el-option label="企业版（enterprise）" value="enterprise" />
          </el-select>
        </el-form-item>
        <el-form-item label="温度">
          <el-input-number v-model="form.temperature" :min="0" :max="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="Max Tokens">
          <el-input-number v-model="form.maxTokens" :min="256" :max="32768" :step="256" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="99" />
          <span class="form-tip">同用途多模型时，取排序最小且可用的</span>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="备注说明（用户端可见）" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminApi } from '../api';

interface ModelRow {
  id: string;
  modelKey: string;
  displayName: string;
  provider: string;
  apiBaseUrl: string;
  apiKey: string;
  modelName: string;
  modelRole: 'light' | 'heavy' | 'embed';
  minTier: 'free' | 'pro' | 'enterprise';
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  sortOrder: number;
  description: string;
}

const PROVIDERS = [
  { label: 'DeepSeek', value: 'deepseek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { label: '通义千问（DashScope）', value: 'qwen', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { label: '智谱 GLM', value: 'glm', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  { label: 'Moonshot Kimi', value: 'moonshot', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { label: '豆包（火山方舟）', value: 'doubao', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-pro-32k' },
  { label: '硅基流动', value: 'siliconflow', baseUrl: 'https://api.siliconflow.cn/v1', model: 'Qwen/Qwen2.5-7B-Instruct' },
  { label: 'OpenAI', value: 'openai', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { label: '自定义（OpenAI 兼容）', value: 'custom', baseUrl: '', model: '' },
];

const models = ref<ModelRow[]>([]);
const loading = ref(false);
const saving = ref(false);
const testingId = ref('');
const dialogVisible = ref(false);
const editing = ref<ModelRow | null>(null);

const form = reactive({
  provider: 'deepseek',
  displayName: '',
  modelKey: '',
  apiBaseUrl: '',
  apiKey: '',
  modelName: '',
  modelRole: 'light' as 'light' | 'heavy' | 'embed',
  minTier: 'free' as 'free' | 'pro' | 'enterprise',
  temperature: 0.7,
  maxTokens: 2000,
  enabled: true,
  sortOrder: 0,
  description: '',
});

const enabledCount = computed(() => models.value.filter((m) => m.enabled).length);
const readyCount = computed(() => models.value.filter((m) => m.enabled && m.apiKey).length);
const noKeyCount = computed(() => models.value.filter((m) => !m.apiKey).length);

onMounted(load);

async function load() {
  loading.value = true;
  try {
    models.value = (await adminApi.models()) as ModelRow[];
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

function onProviderChange(value: string) {
  const p = PROVIDERS.find((x) => x.value === value);
  if (!p) return;
  if (p.baseUrl) form.apiBaseUrl = p.baseUrl;
  if (p.model) form.modelName = p.model;
  if (!form.displayName) form.displayName = p.label;
}

function openDialog(row?: ModelRow) {
  editing.value = row ?? null;
  Object.assign(form, {
    provider: row?.provider ?? 'deepseek',
    displayName: row?.displayName ?? '',
    modelKey: row?.modelKey ?? '',
    apiBaseUrl: row?.apiBaseUrl ?? '',
    apiKey: '',
    modelName: row?.modelName ?? '',
    modelRole: row?.modelRole ?? 'light',
    minTier: row?.minTier ?? 'free',
    temperature: row?.temperature ?? 0.7,
    maxTokens: row?.maxTokens ?? 2000,
    enabled: row?.enabled ?? true,
    sortOrder: row?.sortOrder ?? 0,
    description: row?.description ?? '',
  });
  dialogVisible.value = true;
}

async function save() {
  if (!form.displayName || !form.modelKey || !form.apiBaseUrl || !form.modelName) {
    ElMessage.warning('请填写展示名、模型标识、Base URL 与模型名');
    return;
  }
  if (!editing.value && !form.apiKey) {
    ElMessage.warning('新增模型必须填写 API Key');
    return;
  }
  saving.value = true;
  try {
    const payload: Record<string, unknown> = { ...form };
    if (!form.apiKey) delete payload.apiKey; // 留空沿用原 Key
    if (editing.value) await adminApi.updateModel(editing.value.id, payload);
    else await adminApi.createModel(payload);
    ElMessage.success(editing.value ? '已更新' : '已新增');
    dialogVisible.value = false;
    load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    saving.value = false;
  }
}

async function test(row: ModelRow) {
  testingId.value = row.id;
  try {
    const r = (await adminApi.testModel({ id: row.id })) as { ok: boolean; message: string };
    if (r.ok) ElMessage.success(r.message);
    else ElMessage.error(r.message);
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    testingId.value = '';
  }
}

async function toggle(row: ModelRow) {
  try {
    const payload = { ...row, enabled: !row.enabled };
    delete payload.apiKey; // 不修改已保存的 Key
    await adminApi.updateModel(row.id, payload);
    ElMessage.success(row.enabled ? '已停用' : '已启用');
    load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}

async function remove(row: ModelRow) {
  try {
    await ElMessageBox.confirm(`确认删除模型「${row.displayName}」？`, '提示', { type: 'warning' });
  } catch {
    return;
  }
  try {
    await adminApi.deleteModel(row.id);
    ElMessage.success('已删除');
    load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}

function maskKey(key: string) {
  if (!key) return '';
  if (key.length <= 10) return `${key.slice(0, 2)}****`;
  return `${key.slice(0, 6)}****${key.slice(-4)}`;
}

function roleLabel(role: string) {
  return { light: '轻量', heavy: '深度', embed: '向量' }[role] ?? role;
}

function roleTagType(role: string) {
  return { light: 'primary', heavy: 'warning', embed: 'success' }[role] ?? 'info';
}

function tierLabel(tier: string) {
  return { free: '体验版', pro: 'Pro', enterprise: '企业版' }[tier] ?? tier;
}
</script>

<style scoped>
.models-page {
  max-width: 1500px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--space-6);
}

.page-title {
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 3px;
  color: var(--color-jade);
  margin: 0 0 var(--space-2) 0;
}

.page-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-soft);
  padding: var(--space-5) var(--space-6);
  text-align: center;
}

.stat-card.warn .stat-num {
  color: var(--color-vermillion, #c03c3b);
}

.stat-num {
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-jade);
}

.stat-label {
  margin-top: var(--space-1);
  font-size: 13px;
  color: var(--color-text-secondary);
  letter-spacing: 2px;
}

.content-card {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
  font-family: var(--font-serif);
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--color-jade);
}

.models-table {
  --el-table-header-bg-color: #f8f4e8;
  --el-table-header-text-color: var(--color-jade);
  --el-table-border-color: var(--color-border-light);
  --el-table-row-hover-bg-color: #faf7ee;
}

.key-ok {
  font-family: monospace;
  font-size: 12px;
  color: var(--color-jade);
}

.key-missing {
  color: var(--color-vermillion, #c03c3b);
  font-size: 12px;
}

.form-tip {
  margin-left: var(--space-3);
  font-size: 12px;
  color: var(--color-text-tertiary);
}
</style>
