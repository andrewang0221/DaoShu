<template>
  <div class="knowledge-review">
    <div class="page-header">
      <h2 class="page-title">📜 知识库审核</h2>
      <p class="page-desc">成员推荐 · 待审队列</p>
    </div>

    <div class="content-card">
      <div class="card-header">
        <span>待审列表</span>
        <el-button size="small" plain @click="load">刷新</el-button>
      </div>

      <el-table :data="queue" v-loading="loading" class="review-table">
        <el-table-column prop="id" label="ID" width="200" />
        <el-table-column prop="chapterNo" label="章节" width="70" />
        <el-table-column prop="title" label="标题" width="160" />
        <el-table-column prop="source" label="出处" width="180" show-overflow-tooltip />
        <el-table-column prop="content" label="内容" show-overflow-tooltip />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="review(row, 'approve')">采纳</el-button>
            <el-button size="small" type="warning" @click="review(row, 'needs_revision')">退回修改</el-button>
            <el-button size="small" type="danger" @click="review(row, 'reject')">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && !queue.length" description="暂无待审条目" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminApi } from '../api';

interface QueueItem {
  id: string;
  chapterNo?: number;
  title: string;
  source?: string;
  content?: string;
  reason?: string;
  createdAt?: string;
}

const queue = ref<QueueItem[]>([]);
const loading = ref(false);

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const res = (await adminApi.reviewQueue()) as unknown;
    queue.value = Array.isArray(res) ? (res as QueueItem[]) : [];
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

async function review(row: QueueItem, action: 'approve' | 'reject' | 'needs_revision') {
  const actionText = { approve: '采纳', reject: '驳回', needs_revision: '退回修改' }[action];
  let note = '';
  if (action !== 'approve') {
    try {
      const r = await ElMessageBox.prompt(`请输入${actionText}原因（可选）`, actionText, {
        inputPlaceholder: '原因说明',
      });
      note = r.value ?? '';
    } catch {
      return;
    }
  }
  try {
    await adminApi.review(row.id, action, note);
    ElMessage.success(`${actionText}成功`);
    load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}
</script>

<style scoped>
.knowledge-review {
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

.review-table {
  --el-table-header-bg-color: #f8f4e8;
  --el-table-header-text-color: var(--color-jade);
  --el-table-border-color: var(--color-border-light);
  --el-table-row-hover-bg-color: #faf7ee;
}
</style>
