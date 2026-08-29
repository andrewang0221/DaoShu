<template>
  <div class="ipr-review">
    <div class="page-header">
      <h2 class="page-title">©️ 知识产权服务</h2>
      <p class="page-desc">著作权代办 · 数字知识产权存证认证申请审核</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-num">{{ stats.total }}</div><div class="stat-label">总申请</div></div>
      <div class="stat-card"><div class="stat-num warn">{{ stats.submitted }}</div><div class="stat-label">待受理</div></div>
      <div class="stat-card"><div class="stat-num info">{{ stats.reviewing }}</div><div class="stat-label">办理中</div></div>
      <div class="stat-card"><div class="stat-num ok">{{ stats.certified }}</div><div class="stat-label">已发证</div></div>
      <div class="stat-card"><div class="stat-num err">{{ stats.rejected }}</div><div class="stat-label">已驳回</div></div>
    </div>

    <div class="content-card">
      <div class="card-header">
        <div class="filter-tabs">
          <span
            v-for="t in tabs"
            :key="t.value"
            class="tab"
            :class="{ active: status === t.value }"
            @click="switchTab(t.value)"
          >{{ t.label }}</span>
        </div>
        <el-button size="small" plain @click="load">刷新</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" class="review-table">
        <el-table-column prop="applicationNo" label="申请单号" width="190" show-overflow-tooltip />
        <el-table-column label="服务类型" width="150">
          <template #default="{ row }">
            <el-tag :type="row.serviceType === 'copyright' ? 'warning' : 'success'" size="small">
              {{ row.serviceType === 'copyright' ? '著作权代办' : '数字存证认证' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="workTitle" label="作品名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="workType" label="作品类别" width="100" />
        <el-table-column label="申请人" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ applicant(row).name || '—' }}
            <div class="sub">{{ row.userPhone || applicant(row).phone || '' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="serviceFee" label="服务费" width="90">
          <template #default="{ row }">{{ row.serviceFee }} 积分</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="170">
          <template #default="{ row }">{{ fmt(row.submittedAt || row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="showDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 'submitted'"
              size="small"
              type="primary"
              @click="doReview(row, 'accept')"
            >受理</el-button>
            <el-button
              v-if="row.status === 'reviewing' || row.status === 'submitted'"
              size="small"
              type="success"
              @click="doReview(row, 'certify')"
            >发证</el-button>
            <el-button
              v-if="row.status !== 'certified' && row.status !== 'rejected'"
              size="small"
              type="danger"
              @click="doReview(row, 'reject')"
            >驳回</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && !rows.length" description="暂无申请记录" />
    </div>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailOpen" title="申请详情" size="480px">
      <div v-if="cur" class="detail">
        <div class="d-section">
          <div class="d-title">作品信息</div>
          <div class="d-row"><span class="d-k">作品名称</span><span class="d-v">{{ cur.workTitle }}</span></div>
          <div class="d-row"><span class="d-k">作品类别</span><span class="d-v">{{ cur.workType }}</span></div>
          <div class="d-row"><span class="d-k">服务类型</span><span class="d-v">{{ cur.serviceType === 'copyright' ? '著作权登记代办' : '数字知识产权存证认证' }}</span></div>
          <div class="d-row"><span class="d-k">作品来源</span><span class="d-v">{{ sourceLabel(cur.workSource) }}</span></div>
          <div class="d-row"><span class="d-k">作品简介</span><span class="d-v">{{ (cur.workMeta as any)?.desc || '—' }}</span></div>
        </div>
        <div class="d-section">
          <div class="d-title">著作权人 / 申请人</div>
          <div class="d-row"><span class="d-k">姓名</span><span class="d-v">{{ applicant(cur).name || '—' }}</span></div>
          <div class="d-row"><span class="d-k">电话</span><span class="d-v">{{ applicant(cur).phone || '—' }}</span></div>
          <div class="d-row"><span class="d-k">邮箱</span><span class="d-v">{{ applicant(cur).email || '—' }}</span></div>
          <div class="d-row"><span class="d-k">证件类型</span><span class="d-v">{{ applicant(cur).idType || '—' }}</span></div>
          <div class="d-row"><span class="d-k">证件号码</span><span class="d-v">{{ applicant(cur).idNo || '—' }}</span></div>
          <div class="d-row"><span class="d-k">通讯地址</span><span class="d-v">{{ applicant(cur).address || '—' }}</span></div>
        </div>
        <div class="d-section">
          <div class="d-title">办理状态</div>
          <div class="d-row"><span class="d-k">当前状态</span><span class="d-v">{{ statusLabel(cur.status) }}</span></div>
          <div class="d-row"><span class="d-k">申请单号</span><span class="d-v">{{ cur.applicationNo }}</span></div>
          <div class="d-row" v-if="cur.certNo"><span class="d-k">证书编号</span><span class="d-v strong">{{ cur.certNo }}</span></div>
          <div class="d-row" v-if="cur.rejectReason"><span class="d-k">驳回原因</span><span class="d-v err">{{ cur.rejectReason }}</span></div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminApi } from '../api';

interface IprApp {
  id: string;
  applicationNo: string;
  serviceType: 'copyright' | 'digital_cert';
  workTitle: string;
  workType: string;
  workSource: string;
  workMeta: Record<string, unknown>;
  applicant: Record<string, unknown>;
  serviceFee: number;
  status: string;
  rejectReason: string | null;
  certNo: string | null;
  submittedAt: string | null;
  createdAt: string;
  userPhone?: string;
}

const tabs = [
  { label: '全部', value: '' },
  { label: '待受理', value: 'submitted' },
  { label: '办理中', value: 'reviewing' },
  { label: '已发证', value: 'certified' },
  { label: '已驳回', value: 'rejected' },
];

const rows = ref<IprApp[]>([]);
const loading = ref(false);
const status = ref('');
const stats = ref({ total: 0, submitted: 0, reviewing: 0, certified: 0, rejected: 0 });
const detailOpen = ref(false);
const cur = ref<IprApp | null>(null);

onMounted(() => {
  load();
  loadStats();
});

async function load() {
  loading.value = true;
  try {
    const res = (await adminApi.iprApplications(status.value || undefined)) as { applications?: IprApp[] };
    rows.value = res.applications ?? [];
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

async function loadStats() {
  try {
    stats.value = (await adminApi.iprStats()) as typeof stats.value;
  } catch {
    /* ignore */
  }
}

function switchTab(v: string) {
  status.value = v;
  load();
}

function applicant(row: IprApp): Record<string, string> {
  return (row.applicant ?? {}) as Record<string, string>;
}

function showDetail(row: IprApp) {
  cur.value = row;
  detailOpen.value = true;
}

function statusLabel(s: string): string {
  return ({ draft: '草稿', submitted: '待受理', reviewing: '办理中', certified: '已发证', rejected: '已驳回' } as Record<string, string>)[s] ?? s;
}
function statusType(s: string): 'info' | 'warning' | 'success' | 'danger' | 'primary' {
  return ({ submitted: 'warning', reviewing: 'primary', certified: 'success', rejected: 'danger' } as Record<string, 'info' | 'warning' | 'success' | 'danger' | 'primary'>)[s] ?? 'info';
}
function sourceLabel(s: string): string {
  return ({ notes: '研学笔记', dao: '求道问答', symposium: '论道纪要', industry: '行业案例', dh_works: '数字人作品', custom: '手动填写' } as Record<string, string>)[s] ?? s;
}
function fmt(d: string | null): string {
  return d ? String(d).replace('T', ' ').slice(0, 16) : '—';
}

async function doReview(row: IprApp, action: 'accept' | 'certify' | 'reject') {
  try {
    if (action === 'accept') {
      await ElMessageBox.confirm(`确认受理申请「${row.workTitle}」？受理后进入材料审核与代办申报流程。`, '受理申请', {
        confirmText: '确认受理',
        cancelText: '取消',
      });
      await adminApi.iprReview(row.id, 'accept');
      ElMessage.success('已受理');
    } else if (action === 'reject') {
      const r = await ElMessageBox.prompt('请输入驳回原因（将通知申请人）', '驳回申请', {
        inputPlaceholder: '如：作品信息不完整 / 材料不符合要求',
        confirmText: '确认驳回',
        cancelText: '取消',
      });
      if (!r.value?.trim()) {
        ElMessage.warning('请填写驳回原因');
        return;
      }
      await adminApi.iprReview(row.id, 'reject', { reason: r.value.trim() });
      ElMessage.success('已驳回');
    } else {
      const r = await ElMessageBox.prompt('发证确认：可填写官方证书编号（留空则系统自动生成编号）', '核发证书', {
        inputPlaceholder: '证书编号（选填）',
        confirmText: '确认发证',
        cancelText: '取消',
      });
      await adminApi.iprReview(row.id, 'certify', { certNo: r.value?.trim() || undefined });
      ElMessage.success('已发证，申请人可在端内查看证书');
    }
    load();
    loadStats();
  } catch (e) {
    if (e === 'cancel' || (e as Error)?.message === 'cancel') return;
    ElMessage.error((e as Error).message);
  }
}
</script>

<style scoped>
.ipr-review {
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
.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}
.stat-card {
  background: var(--color-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  padding: var(--space-5);
  text-align: center;
}
.stat-num {
  font-size: 30px;
  font-weight: 700;
  color: var(--color-jade);
  font-family: var(--font-serif);
}
.stat-num.warn { color: #b8860b; }
.stat-num.info { color: #3a6ea5; }
.stat-num.ok { color: var(--color-jade); }
.stat-num.err { color: var(--color-vermillion); }
.stat-label {
  margin-top: var(--space-1);
  font-size: 13px;
  color: var(--color-text-secondary);
  letter-spacing: 1px;
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
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
}
.filter-tabs {
  display: flex;
  gap: var(--space-2);
}
.tab {
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  color: var(--color-text-secondary);
  background: #f8f4e8;
  transition: var(--transition-normal);
}
.tab.active {
  background: var(--color-jade);
  color: #fff;
}
.review-table {
  --el-table-header-bg-color: #f8f4e8;
  --el-table-header-text-color: var(--color-jade);
  --el-table-border-color: var(--color-border-light);
  --el-table-row-hover-bg-color: #faf7ee;
}
.sub {
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.detail {
  padding: 0 20px;
}
.d-section {
  margin-bottom: 24px;
}
.d-title {
  font-family: var(--font-serif);
  font-weight: 600;
  color: var(--color-jade);
  letter-spacing: 2px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-light);
}
.d-row {
  display: flex;
  padding: 6px 0;
  font-size: 14px;
}
.d-k {
  width: 90px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}
.d-v {
  color: var(--color-text-primary);
  flex: 1;
  word-break: break-all;
}
.d-v.strong {
  color: #b8860b;
  font-weight: 600;
}
.d-v.err {
  color: var(--color-vermillion);
}
</style>
