<template>
  <div class="dashboard">
    <!-- Hero：水墨意境 -->
    <section class="hero">
      <div class="hero-bg">
        <div class="ink-circle"></div>
        <div class="ink-circle-2"></div>
      </div>
      <div class="hero-content">
        <div class="hero-icon">☯</div>
        <div class="hero-text">
          <h1 class="hero-title">观天之道 · 执天之行</h1>
          <p class="hero-sub">致虚极，守静笃，万物并作，吾以观复</p>
        </div>
        <el-button class="hero-btn" :loading="importing" @click="doImport">
          批量导入知识库
        </el-button>
      </div>
    </section>

    <!-- 统计卡片：鎏金数字 -->
    <section class="stats">
      <div v-for="card in cards" :key="card.label" class="stat-card">
        <div class="stat-wm">☯</div>
        <div class="stat-value">{{ card.value }}</div>
        <div class="stat-label">{{ card.label }}</div>
        <div class="stat-icon">{{ card.icon }}</div>
      </div>
    </section>

    <!-- MVP 指标 -->
    <section class="metrics">
      <div class="section-header">
        <h2 class="section-title">四项 MVP 关键指标</h2>
        <el-button size="small" plain @click="load">刷新</el-button>
      </div>

      <el-table :data="metricRows" class="metrics-table">
        <el-table-column prop="name" label="指标" width="220" />
        <el-table-column prop="value" label="当前值" width="140">
          <template #default="{ row }">
            <span class="metric-value">{{ row.value }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="desc" label="说明" />
      </el-table>

      <el-alert v-if="data?.tip" class="mt-6" type="info" :title="data.tip" :closable="false" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { adminApi } from '../api';

interface DashboardData {
  stats: Record<string, number>;
  metrics: Record<string, number>;
  tip?: string;
}

const data = ref<DashboardData | null>(null);
const importing = ref(false);

const cards = computed(() => {
  const s = data.value?.stats ?? {};
  return [
    { label: '注册用户', value: s.users ?? 0, icon: '👤' },
    { label: '认养数字人', value: s.digitalHumans ?? 0, icon: '☯' },
    { label: '总库章节', value: s.knowledgeApproved ?? 0, icon: '📚' },
    { label: '待审推荐', value: s.knowledgePending ?? 0, icon: '⏳' },
    { label: '公开知识', value: s.publishedKnowledge ?? 0, icon: '🌐' },
    { label: '引用次数', value: s.citations ?? 0, icon: '🔗' },
  ];
});

const metricRows = computed(() => {
  const m = data.value?.metrics ?? {};
  return [
    { name: '认养 30 日留存率', value: `${m.retention30d ?? 0}%`, desc: '验证认养模式是否成立' },
    { name: '主人主动公开率', value: `${m.publishRate ?? 0}%`, desc: '验证知识经济供给意愿' },
    { name: '知识被引用率', value: `${m.citationRate ?? 0}%`, desc: '验证知识价值流转' },
    { name: '积分兑换率', value: `${m.exchangeRate ?? 0}%`, desc: '验证积分闭环活跃度' },
    { name: '日活 DAU', value: `${m.dau ?? 0}`, desc: '接入埋点后实时统计' },
  ];
});

onMounted(load);

async function load() {
  try {
    data.value = (await adminApi.dashboard()) as DashboardData;
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}

async function doImport() {
  importing.value = true;
  try {
    const r = (await adminApi.importKnowledge()) as { imported: number; tip?: string };
    ElMessage.success(`导入完成：${r.imported} 章${r.tip ? '（' + r.tip + '）' : ''}`);
    load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    importing.value = false;
  }
}
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

/* ---------- Hero：水墨意境 ---------- */
.hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, #1a1a2e 0%, #2a3a4e 50%, #1e3329 100%);
  border: 1px solid rgba(201, 168, 106, 0.3);
  margin-bottom: var(--space-8);
}

.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.ink-circle {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201, 168, 106, 0.2), transparent 70%);
  top: -100px;
  right: -50px;
  animation: float 8s ease-in-out infinite;
}

.ink-circle-2 {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(123, 167, 188, 0.15), transparent 70%);
  bottom: -80px;
  left: 10%;
  animation: float 10s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-12) var(--space-10);
}

.hero-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: var(--color-paper);
  background: 
    radial-gradient(circle at 30% 30%, rgba(201, 168, 106, 0.5), rgba(47, 74, 58, 0.8));
  border: 2px solid rgba(201, 168, 106, 0.6);
  box-shadow: 
    0 0 30px rgba(201, 168, 106, 0.4),
    inset 0 0 20px rgba(0, 0, 0, 0.3);
}

.hero-text {
  flex: 1;
}

.hero-title {
  font-family: var(--font-serif);
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 6px;
  color: var(--color-paper);
  margin: 0 0 var(--space-3) 0;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
}

.hero-sub {
  font-family: var(--font-kai);
  font-size: 16px;
  letter-spacing: 3px;
  color: rgba(201, 168, 106, 0.8);
  margin: 0;
  font-style: italic;
}

.hero-btn {
  background: linear-gradient(135deg, var(--color-gold), #d4a76a);
  border: none;
  color: var(--color-ink);
  font-weight: 600;
  letter-spacing: 2px;
  padding: var(--space-4) var(--space-8);
  box-shadow: var(--shadow-gold);
}

.hero-btn:hover {
  background: linear-gradient(135deg, #d4a76a, var(--color-gold-light));
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(201, 168, 106, 0.5);
}

/* ---------- 统计卡片 ---------- */
.stats {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-5);
  margin-bottom: var(--space-8);
}

.stat-card {
  position: relative;
  overflow: hidden;
  padding: var(--space-6) var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--color-card);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-soft);
  transition: var(--transition-normal);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-medium);
  border-color: var(--color-border);
}

.stat-wm {
  position: absolute;
  right: 10px;
  bottom: 5px;
  font-size: 50px;
  color: rgba(201, 168, 106, 0.08);
}

.stat-value {
  font-family: var(--font-serif);
  font-size: 36px;
  font-weight: 700;
  color: var(--color-jade);
  line-height: 1;
  margin-bottom: var(--space-2);
}

.stat-label {
  font-size: 13px;
  letter-spacing: 1px;
  color: var(--color-text-secondary);
}

.stat-icon {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  font-size: 20px;
  opacity: 0.7;
}

/* ---------- MVP 指标 ---------- */
.metrics {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
}

.section-title {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--color-jade);
  margin: 0;
}

.metrics-table {
  --el-table-header-bg-color: #f8f4e8;
  --el-table-header-text-color: var(--color-jade);
  --el-table-border-color: var(--color-border-light);
  --el-table-row-hover-bg-color: #faf7ee;
}

.metric-value {
  font-family: var(--font-serif);
  font-weight: 700;
  color: var(--color-gold);
  font-size: 16px;
}

/* ---------- 响应式 ---------- */
@media (max-width: 1200px) {
  .stats {
    grid-template-columns: repeat(3, 1fr);
  }
  .hero-content {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
