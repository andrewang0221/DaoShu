<template>
  <div class="plans-page">
    <div class="page-header">
      <h2 class="page-title">💎 套餐管理</h2>
      <p class="page-desc">配置订阅套餐价格与权益；模型「最低套餐」限制按此处的套餐档位（free / pro / enterprise）校验</p>
    </div>

    <div class="content-card">
      <div class="card-header">
        <span>套餐列表</span>
        <el-button size="small" type="primary" @click="openDialog()">新增套餐</el-button>
      </div>

      <el-table :data="plans" v-loading="loading" class="plans-table">
        <el-table-column prop="code" label="标识" width="130" />
        <el-table-column prop="name" label="名称" width="140" />
        <el-table-column label="档位" width="110">
          <template #default="{ row }">
            <el-tag :type="tierTagType(row.tier)" size="small">{{ tierLabel(row.tier) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="月付（元）" width="110">
          <template #default="{ row }">{{ row.priceMonthly }}</template>
        </el-table-column>
        <el-table-column label="年付（元）" width="110">
          <template #default="{ row }">{{ row.priceYearly }}</template>
        </el-table-column>
        <el-table-column label="权益" min-width="320">
          <template #default="{ row }">
            <div class="benefit-list">
              <span v-for="(b, i) in row.benefits" :key="i" class="benefit-item">{{ b }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" plain @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" plain :disabled="isBuiltin(row)" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑套餐' : '新增套餐'" width="620px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="套餐标识" required>
          <el-input v-model="form.code" placeholder="如 pro / pro_plus" :disabled="!!editing && isBuiltin(editing)" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="如 Pro 会员" />
        </el-form-item>
        <el-form-item label="档位" required>
          <el-select v-model="form.tier">
            <el-option label="free（体验档）" value="free" />
            <el-option label="pro（会员档）" value="pro" />
            <el-option label="enterprise（企业档）" value="enterprise" />
          </el-select>
        </el-form-item>
        <el-form-item label="月付价格">
          <el-input-number v-model="form.priceMonthly" :min="0" :step="1" />
          <span class="form-tip">元/月</span>
        </el-form-item>
        <el-form-item label="年付价格">
          <el-input-number v-model="form.priceYearly" :min="0" :step="10" />
          <span class="form-tip">元/年</span>
        </el-form-item>
        <el-form-item label="一句话卖点">
          <el-input v-model="form.tagline" placeholder="展示在订阅页的宣传语" />
        </el-form-item>
        <el-form-item label="权益清单">
          <el-input
            v-model="form.benefitsText"
            type="textarea"
            :rows="6"
            placeholder="每行一条权益，如：&#10;自由问道（无限次）&#10;完整情绪疗愈&#10;行业包 ×3"
          />
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
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminApi } from '../api';

interface PlanRow {
  code: string;
  tier: 'free' | 'pro' | 'enterprise';
  name: string;
  priceMonthly: number;
  priceYearly: number;
  tagline?: string;
  benefits: string[];
  limits?: string[];
}

const plans = ref<PlanRow[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editing = ref<PlanRow | null>(null);

const form = reactive({
  code: '',
  tier: 'pro' as 'free' | 'pro' | 'enterprise',
  name: '',
  priceMonthly: 0,
  priceYearly: 0,
  tagline: '',
  benefitsText: '',
});

onMounted(load);

async function load() {
  loading.value = true;
  try {
    plans.value = (await adminApi.plans()) as PlanRow[];
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

function isBuiltin(row: PlanRow) {
  return ['free', 'pro', 'enterprise'].includes(row.code);
}

function openDialog(row?: PlanRow) {
  editing.value = row ?? null;
  Object.assign(form, {
    code: row?.code ?? '',
    tier: row?.tier ?? 'pro',
    name: row?.name ?? '',
    priceMonthly: row?.priceMonthly ?? 0,
    priceYearly: row?.priceYearly ?? 0,
    tagline: row?.tagline ?? '',
    benefitsText: (row?.benefits ?? []).join('\n'),
  });
  dialogVisible.value = true;
}

async function save() {
  if (!form.code || !form.name) {
    ElMessage.warning('请填写套餐标识与名称');
    return;
  }
  saving.value = true;
  try {
    await adminApi.upsertPlan({
      code: form.code,
      tier: form.tier,
      name: form.name,
      priceMonthly: form.priceMonthly,
      priceYearly: form.priceYearly,
      tagline: form.tagline,
      benefits: form.benefitsText.split('\n').map((s) => s.trim()).filter(Boolean),
    });
    ElMessage.success('已保存');
    dialogVisible.value = false;
    load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    saving.value = false;
  }
}

async function remove(row: PlanRow) {
  try {
    await ElMessageBox.confirm(`确认删除套餐「${row.name}」？已产生的订单不受影响。`, '提示', { type: 'warning' });
  } catch {
    return;
  }
  try {
    await adminApi.deletePlan(row.code);
    ElMessage.success('已删除');
    load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}

function tierLabel(tier: string) {
  return { free: '体验档', pro: '会员档', enterprise: '企业档' }[tier] ?? tier;
}

function tierTagType(tier: string) {
  return { free: 'info', pro: 'warning', enterprise: 'danger' }[tier] ?? 'info';
}
</script>

<style scoped>
.plans-page {
  max-width: 1400px;
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

.plans-table {
  --el-table-header-bg-color: #f8f4e8;
  --el-table-header-text-color: var(--color-jade);
  --el-table-border-color: var(--color-border-light);
  --el-table-row-hover-bg-color: #faf7ee;
}

.benefit-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.benefit-item {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  background: #f4efe2;
  color: var(--color-jade);
}

.form-tip {
  margin-left: var(--space-3);
  font-size: 12px;
  color: var(--color-text-tertiary);
}
</style>
