<template>
  <div class="audit-page">
    <div class="page-header">
      <h2 class="page-title">🧾 审计日志</h2>
      <p class="page-desc">操作审计留痕</p>
    </div>

    <div class="content-card">
      <div class="card-header">
        <span>操作记录</span>
        <el-button size="small" plain @click="load">刷新</el-button>
      </div>

      <el-alert v-if="tip" class="m-4" type="info" :title="tip" :closable="false" />

      <el-table :data="rows" v-loading="loading" class="audit-table">
        <el-table-column prop="id" label="ID" width="220" />
        <el-table-column prop="entityType" label="实体" width="140" />
        <el-table-column prop="entityId" label="实体ID" width="220" />
        <el-table-column prop="action" label="动作" width="160" />
        <el-table-column prop="operatorId" label="操作者" width="220" />
        <el-table-column prop="detail" label="详情" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="时间" width="200" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { adminApi } from '../api';

interface LogRow {
  id?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  operatorId?: string;
  detail?: string;
  createdAt?: string;
}

const rows = ref<LogRow[]>([]);
const tip = ref('');
const loading = ref(false);

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const res = (await adminApi.auditLogs()) as unknown;
    if (Array.isArray(res)) {
      rows.value = res as LogRow[];
    } else {
      const obj = res as { list?: LogRow[]; tip?: string };
      rows.value = obj.list ?? [];
      tip.value = obj.tip ?? '';
    }
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.audit-page {
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

.m-4 {
  margin: var(--space-4);
}

.audit-table {
  --el-table-header-bg-color: #f8f4e8;
  --el-table-header-text-color: var(--color-jade);
  --el-table-border-color: var(--color-border-light);
  --el-table-row-hover-bg-color: #faf7ee;
}
</style>
