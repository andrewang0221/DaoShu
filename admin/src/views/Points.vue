<template>
  <div class="points-page">
    <div class="page-header">
      <h2 class="page-title">💎 积分账务</h2>
      <p class="page-desc">积分流水查询</p>
    </div>

    <div class="content-card">
      <div class="card-header">
        <span>流水记录</span>
        <el-button size="small" plain @click="load">刷新</el-button>
      </div>

      <el-alert v-if="tip" class="m-4" type="info" :title="tip" :closable="false" />

      <el-table :data="rows" v-loading="loading" class="points-table">
        <el-table-column prop="id" label="ID" width="220" />
        <el-table-column prop="phone" label="用户" width="140" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.amount > 0 ? '#6b8e6b' : '#c03c3b' }">{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="bizType" label="业务" width="140" />
        <el-table-column prop="balanceAfter" label="余额" width="100" />
        <el-table-column prop="createdAt" label="时间" width="200" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { adminApi } from '../api';

interface TxRow {
  id?: string;
  phone?: string;
  type?: string;
  amount?: number;
  bizType?: string;
  balanceAfter?: number;
  createdAt?: string;
}

const rows = ref<TxRow[]>([]);
const tip = ref('');
const loading = ref(false);

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const res = (await adminApi.pointTransactions()) as { list: TxRow[]; tip?: string };
    rows.value = res.list ?? [];
    tip.value = res.tip ?? '';
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.points-page {
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

.points-table {
  --el-table-header-bg-color: #f8f4e8;
  --el-table-header-text-color: var(--color-jade);
  --el-table-border-color: var(--color-border-light);
  --el-table-row-hover-bg-color: #faf7ee;
}
</style>
