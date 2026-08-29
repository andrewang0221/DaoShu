<template>
  <div class="users-page">
    <div class="page-header">
      <h2 class="page-title">👥 用户管理</h2>
      <p class="page-desc">用户与认养管理</p>
    </div>

    <div class="content-card">
      <div class="card-header">
        <span>用户列表</span>
        <el-button size="small" plain @click="load">刷新</el-button>
      </div>

      <el-table :data="users" v-loading="loading" class="users-table">
        <el-table-column prop="id" label="ID" width="220" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="nickname" label="昵称" width="140" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : row.role === 'member' ? 'primary' : 'info'">
              {{ row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '已封禁' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="200" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'active'"
              size="small"
              type="danger"
              plain
              @click="toggle(row, 'banned')"
            >
              封禁
            </el-button>
            <el-button v-else size="small" type="success" plain @click="toggle(row, 'active')">
              解封
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminApi } from '../api';

interface UserRow {
  id: string;
  phone?: string;
  nickname?: string;
  role: string;
  status: 'active' | 'banned';
  createdAt?: string;
}

const users = ref<UserRow[]>([]);
const loading = ref(false);

onMounted(load);

async function load() {
  loading.value = true;
  try {
    users.value = (await adminApi.users()) as UserRow[];
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

async function toggle(row: UserRow, status: 'active' | 'banned') {
  const action = status === 'banned' ? '封禁' : '解封';
  try {
    await ElMessageBox.confirm(`确认${action}用户 ${row.phone ?? row.id} ？`, '提示', { type: 'warning' });
  } catch {
    return;
  }
  try {
    await adminApi.setUserStatus(row.id, status);
    ElMessage.success(`${action}成功`);
    load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}
</script>

<style scoped>
.users-page {
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

.users-table {
  --el-table-header-bg-color: #f8f4e8;
  --el-table-header-text-color: var(--color-jade);
  --el-table-border-color: var(--color-border-light);
  --el-table-row-hover-bg-color: #faf7ee;
}
</style>
