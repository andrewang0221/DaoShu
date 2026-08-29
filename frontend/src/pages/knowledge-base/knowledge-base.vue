<template>
  <view class="page">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-content">
        <TaijiBackButton />
        <view class="nav-title">
          <text class="title-text">原创知识基座</text>
        </view>
        <view class="nav-badge">
          <text class="badge-text">游客可预览</text>
        </view>
      </view>
    </view>

    <!-- 主要内容 -->
    <scroll-view class="main-content" scroll-y>
      <!-- 作品横幅 -->
      <view class="hero-section">
        <view class="hero-gradient"></view>
        <view class="hero-content">
          <view class="hero-tags">
            <view class="hero-tag">
              <text class="hero-tag-text">帛书甲乙本 · 定本</text>
            </view>
            <view class="hero-tag">
              <text class="hero-tag-text">国家版权登记 2026Z11L0230822</text>
            </view>
          </view>
          <text class="hero-title">原创知识基座</text>
          <text class="hero-book">《汪胜岩〈道德经〉注解（2026 整理本）》</text>
          <text class="hero-desc">以马王堆帛书甲乙本为定本，以"天道—人道之辨"为纲，每章配原创概念逻辑图，构建自洽、彻底、可读、可视的原创解释体系。</text>

          <view class="hero-stats">
            <view class="stat-item">
              <text class="stat-number">81</text>
              <text class="stat-label">章全覆盖</text>
            </view>
            <view class="stat-item">
              <text class="stat-number">68</text>
              <text class="stat-label">汪按原注</text>
            </view>
            <view class="stat-item">
              <text class="stat-number">240+</text>
              <text class="stat-label">概念图引用</text>
            </view>
            <view class="stat-item">
              <text class="stat-number">80+</text>
              <text class="stat-label">原创逻辑图</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 核心特点 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">基座六大支柱</text>
          <text class="section-subtitle">原创解释体系的核心构成</text>
        </view>

        <view class="pillar-grid">
          <view class="pillar-card" v-for="(pillar, index) in pillars" :key="index">
            <view class="pillar-icon">
              <text class="icon-text">{{ pillar.icon }}</text>
            </view>
            <text class="pillar-title">{{ pillar.title }}</text>
            <text class="pillar-sub">{{ pillar.subtitle }}</text>
            <text class="pillar-desc">{{ pillar.description }}</text>
          </view>
        </view>
      </view>

      <!-- 创生谱系 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">宇宙创生谱系</text>
          <text class="section-subtitle">训"玄"为规律 · 道是孕育规律的母体</text>
        </view>

        <view class="genesis-card">
          <view class="genesis-flow">
            <view class="genesis-node" v-for="(node, index) in genesis" :key="index">
              <text class="node-name">{{ node.name }}</text>
              <text class="node-desc">{{ node.desc }}</text>
              <text class="node-arrow" v-if="index < genesis.length - 1">→</text>
            </view>
          </view>
          <view class="genesis-quote">
            <text class="quote-text">"道不是规律，而是孕育规律的母体"——参校元代吴澄《道德真经注》，敢于与历代注家对话</text>
          </view>
        </view>
      </view>

      <!-- 道三分 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">天道—人道之辨</text>
          <text class="section-subtitle">贯穿八十一章的解释总纲</text>
        </view>

        <view class="dao-grid">
          <view class="dao-card" v-for="(dao, index) in daoTiers" :key="index" :class="dao.cls">
            <text class="dao-name">{{ dao.name }}</text>
            <text class="dao-def">{{ dao.definition }}</text>
            <text class="dao-desc">{{ dao.description }}</text>
          </view>
        </view>

        <view class="dao-quote-card">
          <text class="dao-quote">"人道积有积物，天道积虚积无"</text>
          <text class="dao-quote-sub">今世所言《道德经》，多以人道揣度天道——本书还原天道层面的本义</text>
        </view>
      </view>

      <!-- 章节预览（游客可看） -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">章节预览</text>
          <text class="section-subtitle">
            <text v-if="isLoggedIn">登录用户 · 完整研学</text>
            <text v-else>游客模式 · 可预览章旨</text>
          </text>
        </view>

        <view class="chapter-card" v-for="(chapter, index) in previewChapters" :key="index">
          <view class="chapter-head">
            <view class="chapter-no">
              <text class="no-text">第{{ chapter.chapterNo }}章</text>
            </view>
            <text class="chapter-title">{{ chapter.title }}</text>
          </view>
          <text class="chapter-summary">{{ chapter.summary }}</text>
          <view class="chapter-actions">
            <button class="btn-primary small" @tap="readChapter(chapter.chapterNo)">深入研学</button>
            <button class="btn-secondary small" @tap="discussWithAI">与AI讨论</button>
          </view>
        </view>
      </view>

      <!-- 价值评估 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">基座价值</text>
          <text class="section-subtitle">学术 · 应用 · 版权 三重价值</text>
        </view>

        <view class="value-grid">
          <view class="value-card" v-for="(value, index) in values" :key="index">
            <view class="value-head">
              <text class="value-icon">{{ value.icon }}</text>
              <text class="value-name">{{ value.name }}</text>
            </view>
            <text class="value-desc">{{ value.description }}</text>
          </view>
        </view>
      </view>

      <!-- 版权说明 -->
      <view class="section">
        <view class="copyright-card">
          <view class="copyright-head">
            <text class="copyright-icon">🛡</text>
            <text class="copyright-title">著作权登记信息</text>
          </view>
          <view class="copyright-row">
            <text class="copyright-label">登记机构</text>
            <text class="copyright-value">中国版权保护中心</text>
          </view>
          <view class="copyright-row">
            <text class="copyright-label">流水号</text>
            <text class="copyright-value">2026Z11L0230822</text>
          </view>
          <view class="copyright-row">
            <text class="copyright-label">状态</text>
            <text class="copyright-value status-ok">已通过审批 · 待发证</text>
          </view>
          <view class="copyright-row">
            <text class="copyright-label">权属结构</text>
            <text class="copyright-value">注解归汪胜岩 · 编排归整理者</text>
          </view>
        </view>
      </view>

      <view class="footer-space"></view>
    </scroll-view>

    <!-- 底部游客提示条 -->
    <view class="guest-bar" v-if="!isLoggedIn">
      <view class="guest-info">
        <text class="guest-text">游客模式可预览基座概况与章旨</text>
        <text class="guest-hint">登录后解锁81章完整研学与AI问道</text>
      </view>
      <button class="guest-btn" @tap="login">立即登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useAppStore } from '../../store';
import { api, KnowledgeItem } from '../../api';
import TaijiBackButton from '../../components/TaijiBackButton.vue';

const store = useAppStore();
store.restore();
const isLoggedIn = computed(() => store.isLoggedIn);

// 基座六大支柱（源自作品分析报告）
const pillars = ref([
  {
    icon: '📜',
    title: '独尊帛书',
    subtitle: '版本学立场',
    description: '以马王堆帛书甲乙本为定本，全篇用"恒"不用"常"，保留古字，异文标注体例严谨。'
  },
  {
    icon: '☯',
    title: '天道—人道之辨',
    subtitle: '独创解释框架',
    description: '将"道"三分为至道、天道、人道，以"人道积有积物，天道积虚积无"贯穿全部八十一章。'
  },
  {
    icon: '🌀',
    title: '玄＝规律',
    subtitle: '宇宙论重构',
    description: '训"玄"为运动规律，道是孕育规律的母体，第一章与吴澄《道德真经注》逐句参校。'
  },
  {
    icon: '🗺',
    title: '每章原创概念逻辑图',
    subtitle: '可视化体例',
    description: '全书八十余张原创知识架构图，化抽象为可视，先见图、后入文，兼作知识地图。'
  },
  {
    icon: '⚖',
    title: '正读纠偏',
    subtitle: '批流俗误读',
    description: '对"善者不辩""知者不博"等世俗降格解读作正读—误读对照，还原天道本义。'
  },
  {
    icon: '🛡',
    title: '双轨权属标注',
    subtitle: '权责清晰',
    description: '【汪按】原注与【整理者按】严格分离标注，权属链条清晰可查，侵权辨识度高。'
  }
]);

// 创生谱系
const genesis = ref([
  { name: '道', desc: '母体' },
  { name: '玄／一', desc: '规律本身' },
  { name: '有无', desc: '二' },
  { name: '共同体', desc: '三' },
  { name: '万物', desc: '生出' }
]);

// 道三分
const daoTiers = ref([
  {
    name: '至道（恒道）',
    definition: '宇宙第一因',
    description: '不可言说、不可执用',
    cls: 'tier-zhi'
  },
  {
    name: '天道',
    definition: '自然常理',
    description: '万物生出后所表现的常理，积虚积无',
    cls: 'tier-tian'
  },
  {
    name: '人道',
    definition: '人的发明',
    description: '人所制立之道，非自然常理，积有积物',
    cls: 'tier-ren'
  }
]);

// 基座价值
const values = ref([
  {
    icon: '🎓',
    name: '学术价值',
    description: '帛书本全帙注解降低接触最古老版本的门槛；"天道—人道之辨"与"玄＝规律"自成一家之言，可与学院派注本互补。'
  },
  {
    icon: '💡',
    name: '应用价值',
    description: '针对"权谋解老""鸡汤解老"乱象提供严谨路径；每章逻辑图使义理图形化，古典智慧落地现代生活。'
  },
  {
    icon: '🛡',
    name: '版权价值',
    description: '已通过中国版权保护中心著作权登记审批，双轨标注与逐章逻辑图使确权对象明确、维权举证便利。'
  }
]);

// 章节预览（游客可看，后端公开接口 + 内置兜底）
const fallbackChapters: KnowledgeItem[] = [
  {
    chapterNo: 1,
    title: '道可道也',
    summary: '道，可道也，非恒道也；名，可名也，非恒名也。道为万物之母，玄为运动规律，有无同出而异名，同谓之玄。'
  },
  {
    chapterNo: 25,
    title: '有物昆成',
    summary: '有物昆成，先天地生。人法地，地法天，天法道，道法自然——天大、地大、道大，人居其一。'
  },
  {
    chapterNo: 81,
    title: '信言不美',
    summary: '信言不美，美言不信；知者不博，博者不知。天道利而不害，圣人之道为而不争，积实不积辩。'
  }
];
const previewChapters = ref<KnowledgeItem[]>([...fallbackChapters]);

onShow(() => {
  store.restore();
});

onMounted(() => {
  loadPreviewChapters();
});

/** 从检索结果中挑出章节数据：优先解析 content JSON（DB 导入格式），取含章号的条目 */
function pickChapter(items: KnowledgeItem[], no: number): KnowledgeItem | undefined {
  for (const it of items) {
    let inner: Record<string, unknown> | undefined;
    if (typeof it.content === 'string' && it.content.startsWith('{')) {
      try { inner = JSON.parse(it.content) as Record<string, unknown>; } catch { inner = undefined; }
    }
    if (inner && (inner.no === no || typeof inner.rawNo === 'string')) {
      return {
        chapterNo: no,
        title: (inner.title as string) ?? it.title,
        summary: (inner.summary as string) ?? it.summary,
        simplified: (inner.simplified as string) ?? it.simplified,
      };
    }
  }
  return items[0];
}

async function loadPreviewChapters() {
  const nos = [1, 25, 81];
  const results: KnowledgeItem[] = [];
  for (const no of nos) {
    try {
      const items = await api.knowledgeChapter(no);
      const picked = items && items.length > 0 ? pickChapter(items, no) : undefined;
      if (picked) {
        results.push({
          chapterNo: picked.chapterNo ?? no,
          title: picked.title || fallbackChapters.find((c) => c.chapterNo === no)?.title || '',
          summary: picked.summary || picked.simplified || fallbackChapters.find((c) => c.chapterNo === no)?.summary || '',
        });
      } else {
        const fb = fallbackChapters.find((c) => c.chapterNo === no);
        if (fb) results.push(fb);
      }
    } catch {
      // 游客或网络异常时使用内置预览数据
      const fb = fallbackChapters.find((c) => c.chapterNo === no);
      if (fb) results.push(fb);
    }
  }
  if (results.length) previewChapters.value = results;
}

function readChapter(chapterNo?: number) {
  // 跳转学习页阅读器，自动打开该章（含原文/注音/今译/注解/概念图）
  store.pendingStudyChapter = chapterNo ?? 1;
  uni.switchTab({ url: '/pages/study/study' });
}

function discussWithAI() {
  if (!store.digitalHuman) {
    uni.showToast({ title: '请先认养数字人', icon: 'none' });
    return;
  }
  uni.switchTab({ url: '/pages/chat/chat' });
}

function login() {
  if (store.isLoggedIn) {
    uni.switchTab({ url: '/pages/mine/mine' });
    return;
  }
  uni.navigateTo({ url: '/pages/login/login' });
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-paper);
}

/* 顶部导航 */
.nav-bar {
  background: var(--color-ink);
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + env(safe-area-inset-top));
  flex-shrink: 0;
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-back {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.back-icon {
  color: var(--color-gold);
  font-size: 32rpx;
}

.nav-title {
  flex: 1;
  text-align: center;
}

.title-text {
  color: white;
  font-size: 32rpx;
  font-weight: 600;
}

.nav-badge {
  background: rgba(201, 169, 110, 0.2);
  border: 1rpx solid rgba(201, 169, 110, 0.4);
  border-radius: var(--radius-full);
  padding: 6rpx 16rpx;
}

.badge-text {
  color: var(--color-gold);
  font-size: 20rpx;
}

/* 主内容 */
.main-content {
  flex: 1;
  height: 0;
}

/* 作品横幅 */
.hero-section {
  position: relative;
  padding: 80rpx 40rpx 60rpx;
  background: var(--gradient-ink);
  overflow: hidden;
}

.hero-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 70% 20%, rgba(201, 169, 110, 0.15), transparent 60%);
}

.hero-content {
  position: relative;
  text-align: center;
}

.hero-tags {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 30rpx;
}

.hero-tag {
  background: rgba(201, 169, 110, 0.15);
  border: 1rpx solid rgba(201, 169, 110, 0.4);
  border-radius: var(--radius-full);
  padding: 8rpx 24rpx;
}

.hero-tag-text {
  color: var(--color-gold);
  font-size: 22rpx;
}

.hero-title {
  display: block;
  color: white;
  font-size: 52rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
  letter-spacing: 8rpx;
}

.hero-book {
  display: block;
  color: var(--color-gold);
  font-size: 28rpx;
  margin-bottom: 24rpx;
}

.hero-desc {
  display: block;
  color: rgba(255, 255, 255, 0.75);
  font-size: 24rpx;
  line-height: 1.8;
  margin-bottom: 40rpx;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 40rpx;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  color: var(--color-gold);
  font-size: 40rpx;
  font-weight: 700;
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 22rpx;
}

/* 区块 */
.section {
  padding: 50rpx 30rpx 20rpx;
}

.section-header {
  margin-bottom: 30rpx;
}

.section-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: var(--color-ink);
  margin-bottom: 10rpx;
}

.section-subtitle {
  font-size: 24rpx;
  color: #8a7f6a;
}

/* 六大支柱 */
.pillar-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.pillar-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 30rpx 24rpx;
  box-shadow: var(--shadow-soft);
  display: flex;
  flex-direction: column;
}

.pillar-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: var(--radius-md);
  background: rgba(201, 169, 110, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18rpx;
}

.icon-text {
  font-size: 36rpx;
}

.pillar-title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--color-ink);
  margin-bottom: 6rpx;
}

.pillar-sub {
  font-size: 20rpx;
  color: var(--color-gold);
  margin-bottom: 12rpx;
}

.pillar-desc {
  font-size: 22rpx;
  color: #666;
  line-height: 1.7;
}

/* 创生谱系 */
.genesis-card {
  background: var(--gradient-ink);
  border-radius: var(--radius-lg);
  padding: 40rpx 30rpx;
}

.genesis-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 30rpx;
}

.genesis-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  min-width: 100rpx;
}

.node-name {
  color: var(--color-gold);
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 6rpx;
}

.node-desc {
  color: rgba(255, 255, 255, 0.7);
  font-size: 20rpx;
}

.node-arrow {
  position: absolute;
  right: -12rpx;
  top: 8rpx;
  color: rgba(201, 169, 110, 0.7);
  font-size: 28rpx;
}

.genesis-quote {
  border-top: 1rpx solid rgba(201, 169, 110, 0.3);
  padding-top: 24rpx;
}

.quote-text {
  color: rgba(255, 255, 255, 0.85);
  font-size: 22rpx;
  line-height: 1.8;
}

/* 道三分 */
.dao-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.dao-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 26rpx 20rpx;
  box-shadow: var(--shadow-soft);
  border-top: 6rpx solid var(--color-gold);
  display: flex;
  flex-direction: column;
}

.dao-card.tier-zhi {
  border-top-color: var(--color-cinnabar);
}

.dao-card.tier-tian {
  border-top-color: var(--color-jade);
}

.dao-card.tier-ren {
  border-top-color: var(--color-indigo);
}

.dao-name {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--color-ink);
  margin-bottom: 8rpx;
}

.dao-def {
  font-size: 22rpx;
  color: var(--color-gold);
  margin-bottom: 10rpx;
}

.dao-desc {
  font-size: 20rpx;
  color: #666;
  line-height: 1.6;
}

.dao-quote-card {
  background: rgba(201, 169, 110, 0.08);
  border: 1rpx solid rgba(201, 169, 110, 0.3);
  border-radius: var(--radius-lg);
  padding: 30rpx;
  text-align: center;
}

.dao-quote {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: var(--color-ink);
  margin-bottom: 12rpx;
}

.dao-quote-sub {
  font-size: 22rpx;
  color: #8a7f6a;
  line-height: 1.6;
}

/* 章节预览 */
.chapter-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 30rpx;
  box-shadow: var(--shadow-soft);
  margin-bottom: 20rpx;
}

.chapter-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.chapter-no {
  background: var(--gradient-gold);
  border-radius: var(--radius-sm);
  padding: 6rpx 16rpx;
}

.no-text {
  color: var(--color-ink);
  font-size: 22rpx;
  font-weight: 600;
}

.chapter-title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--color-ink);
}

.chapter-summary {
  display: block;
  font-size: 24rpx;
  color: #555;
  line-height: 1.8;
  margin-bottom: 24rpx;
}

.chapter-actions {
  display: flex;
  gap: 20rpx;
}

.btn-primary.small,
.btn-secondary.small {
  padding: 14rpx 32rpx;
  font-size: 24rpx;
  margin: 0;
  flex: 1;
}

.btn-secondary {
  background: white;
}

/* 价值 */
.value-grid {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.value-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 30rpx;
  box-shadow: var(--shadow-soft);
}

.value-head {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 14rpx;
}

.value-icon {
  font-size: 34rpx;
}

.value-name {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--color-ink);
}

.value-desc {
  font-size: 23rpx;
  color: #666;
  line-height: 1.8;
}

/* 版权信息 */
.copyright-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 34rpx 30rpx;
  box-shadow: var(--shadow-soft);
}

.copyright-head {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 24rpx;
}

.copyright-icon {
  font-size: 34rpx;
}

.copyright-title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--color-ink);
}

.copyright-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0ece4;
}

.copyright-row:last-child {
  border-bottom: none;
}

.copyright-label {
  font-size: 24rpx;
  color: #8a7f6a;
}

.copyright-value {
  font-size: 24rpx;
  color: var(--color-ink);
  font-weight: 600;
}

.copyright-value.status-ok {
  color: var(--color-jade);
}

.footer-space {
  height: 140rpx;
}

/* 游客提示条 */
.guest-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-ink);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -8rpx 30rpx rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.guest-info {
  display: flex;
  flex-direction: column;
}

.guest-text {
  color: white;
  font-size: 24rpx;
  font-weight: 600;
}

.guest-hint {
  color: rgba(255, 255, 255, 0.6);
  font-size: 20rpx;
  margin-top: 4rpx;
}

.guest-btn {
  background: var(--gradient-gold);
  color: var(--color-ink);
  border: none;
  border-radius: var(--radius-full);
  padding: 14rpx 36rpx;
  font-size: 24rpx;
  font-weight: 600;
  margin: 0;
}

/* PC 端适配 */
@media (min-width: 768px) {
  .hero-section {
    padding: 100rpx 80rpx 80rpx;
  }

  .hero-title {
    font-size: 64rpx;
  }

  .hero-desc {
    max-width: 800rpx;
    margin-left: auto;
    margin-right: auto;
  }

  .pillar-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .dao-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .value-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .section {
    max-width: 1100px;
    margin: 0 auto;
    width: 100%;
  }

  .chapter-card {
    max-width: 860rpx;
  }
}
</style>
