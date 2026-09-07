<template>
  <view class="page">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-content">
        <view class="logo">
          <view class="logo-icon">
            <view class="taiji">
              <view class="taiji-yin"></view>
              <view class="taiji-yang"></view>
              <view class="taiji-dot yin-dot"></view>
              <view class="taiji-dot yang-dot"></view>
            </view>
            <text class="logo-char">道</text>
          </view>
          <view class="logo-text-wrap">
            <text class="logo-text">道枢</text>
            <text class="logo-subtitle">东方智慧AI数字人</text>
          </view>
        </view>
        
        <!-- 电脑端导航 -->
        <view class="nav-links desktop-only">
          <view class="nav-link" @tap="scrollToSection('why')">为何学道</view>
          <view class="nav-link" @tap="scrollToSection('features')">功能特色</view>
          <view class="nav-link" @tap="goToAudience">适用人群</view>
          <view class="nav-link" @tap="goToKnowledgeBase">知识基座</view>
          <view class="nav-link" @tap="scrollToSection('adoption')">认养系统</view>
          <view class="nav-link" @tap="goToDaoBoard">求道板块</view>
          <view class="nav-link" @tap="goToIndustry">行业智囊</view>
          <view class="nav-link" @tap="scrollToSection('market')">知识市场</view>
          <view class="nav-link" @tap="scrollToSection('about')">关于我们</view>
        </view>
        
        <view class="nav-actions">
          <template v-if="isLoggedIn">
            <view class="nav-user" @tap="goMine">
              <text class="nav-user-name">{{ displayName }}</text>
            </view>
            <view class="nav-btn logout-btn" @tap="logout">
              <text class="nav-btn-text">退出</text>
            </view>
          </template>
          <template v-else>
            <view class="nav-btn login-btn" @tap="login">
              <text class="nav-btn-text">登录</text>
            </view>
            <view class="nav-btn register-btn" @tap="register">
              <text class="nav-btn-text">注册</text>
            </view>
          </template>
        </view>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <scroll-view
      class="main-content"
      scroll-y
      :scroll-into-view="scrollIntoId"
      scroll-with-animation
    >
      <!-- 欢迎横幅 - 电脑端全屏 -->
      <view class="hero-section desktop-hero">
        <view class="hero-background">
          <view class="hero-particles"></view>
          <view class="hero-gradient"></view>
          <view class="hero-overlay"></view>
        </view>
        <view class="hero-content">
          <view class="hero-badge">
            <text class="badge-text">☯ 道法自然 · 规律可循 ☯</text>
          </view>
          <view class="hero-title">
            <text class="title-line">道，可道也，</text><text class="title-line">非恒道也</text>
          </view>
          <text class="hero-subtitle">老子五千言，讲的是天地万物运行的规律</text>
          <text class="hero-desc">以马王堆帛书《道德经》甲乙本为底本，正读"恒道"真义——道不是玄虚的信仰，而是自然、社会与人事背后可观察、可总结、可运用的客观规律。道枢以AI为工具，把这套东方自然哲学转化为可对话、可研学、可践行的思维方法。</text>
          
          <view class="hero-stats">
            <view class="stat-item">
              <text class="stat-number">81</text>
              <text class="stat-label">章规律</text>
            </view>
            <view class="stat-item">
              <text class="stat-number">5000</text>
              <text class="stat-label">言要义</text>
            </view>
            <view class="stat-item">
              <text class="stat-number">2500</text>
              <text class="stat-label">年验证</text>
            </view>
            <view class="stat-item">
              <text class="stat-number">1:1</text>
              <text class="stat-label">AI伴学</text>
            </view>
          </view>
          
          <view class="hero-actions">
            <button class="btn-primary large" @tap="startJourney">☯ 开始研学</button>
            <button class="btn-secondary large" @tap="learnMore">了解道枢</button>
          </view>
          
          <view class="hero-hint">
            <text class="hint-text">游客可免费体验，无需登录即可浏览</text>
          </view>
        </view>
      </view>

      <!-- 为什么要学《道德经》 -->
      <view class="section" id="why">
        <view class="section-header">
          <text class="section-title">☯ 为什么要学《道德经》</text>
          <text class="section-subtitle">天之道，损有余而补不足；人之道，损不足以奉有余</text>
        </view>

        <view class="why-intro">
          <view class="why-quote">
            <text class="why-quote-line">老子仰观天文、俯察地理，从天地运行、万物荣枯、人事兴衰中，总结出一套可验证的客观规律——</text>
            <text class="why-quote-line">它不讲神迹信仰，只讲「上善若水，水善利万物而不争」的自然法则；</text>
            <text class="why-quote-line">它不鼓励急功近利，只讲「大器晚成，大音希声，大象无形」的成长规律；</text>
            <text class="why-quote-line">它不主张盲目蛮干，只讲「致虚极，守静笃，万物并作，吾以观复」——静心观察事物循环往复的运行轨迹。</text>
            <text class="why-quote-line">焦虑时读「静为躁君」知静能制动，得意时读「功遂身退」知物极必反，迷茫时读「道法自然」知顺应规律。</text>
          </view>
          <view class="why-intro-stats">
            <view class="why-stat"><text class="why-stat-value">5000</text><text class="why-stat-name">言要义</text></view>
            <view class="why-stat"><text class="why-stat-value">81</text><text class="why-stat-name">章规律</text></view>
            <view class="why-stat"><text class="why-stat-value">道学</text><text class="why-stat-name">根本</text></view>
            <view class="why-stat"><text class="why-stat-value">万世</text><text class="why-stat-name">流传</text></view>
          </view>
        </view>

        <view class="why-grid">
          <view class="why-card" v-for="(item, index) in whyReasons" :key="index">
            <view class="why-card-top">
              <view class="why-figure" :class="item.figure"></view>
              <text class="why-index">{{ item.index }}</text>
            </view>
            <text class="why-title">{{ item.title }}</text>
            <text class="why-quote-src">{{ item.headline }}</text>
            <text class="why-desc">{{ item.description }}</text>
          </view>
        </view>

        <view class="why-footer">
          <text class="why-footer-text">两千五百年前，老子为周守藏室之史，综观历代兴亡、万物消长，出关时留下五千言，把天地人事的规律凝为一书。</text>
          <text class="why-footer-text">两千五百年后，道枢以AI为工具，让这部自然规律之学重新可读、可问、可用——与老子跨越时空对话。</text>
          <view class="why-footer-actions">
            <button class="btn-primary large" @tap="startJourney">☯ 开始研学</button>
            <button class="btn-outline" @tap="goToStudy">浏览经文</button>
          </view>
        </view>
      </view>

      <!-- 功能模块 - 电脑端网格布局 -->
      <view class="section" id="features">
        <view class="section-header">
          <text class="section-title">☯ 研学工具</text>
          <text class="section-subtitle">读原文 · 问AI · 重实践 · 循规律而行</text>
        </view>
        
        <view class="feature-grid desktop-grid">
          <view class="feature-card" v-for="(feature, index) in features" :key="index" @tap="feature.action">
            <view class="feature-icon">
              <text class="icon-text">{{ feature.icon }}</text>
            </view>
            <text class="feature-title">{{ feature.title }}</text>
            <text class="feature-desc">{{ feature.description }}</text>
            <view class="feature-arrow">
              <text class="arrow-text">→</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 原创知识基座 - 系统智慧之源 -->
      <view class="section" id="knowledge-base">
        <view class="section-header">
          <text class="section-title">☯ 知识基座</text>
          <text class="section-subtitle">原文为据 · 注疏为纲 · 规律为宗</text>
        </view>

        <view class="kb-banner">
          <view class="kb-content">
            <view class="kb-tags">
              <view class="kb-tag">
                <text class="kb-tag-text">马王堆帛书甲乙本 · 定本</text>
              </view>
              <view class="kb-tag">
                <text class="kb-tag-text">天道—人道为纲</text>
              </view>
              <view class="kb-tag kb-tag-guest">
                <text class="kb-tag-text">游客可浏览</text>
              </view>
            </view>
            <text class="kb-title">《汪胜岩〈道德经〉证道注（2026 定本）》</text>
            <text class="kb-desc">本系统的知识之源。以「天道—人道之辨」为纲领，考据源流、辨析章句；每章配原创逻辑图解，纠正千年俗解，把老子对自然规律与人事法则的观察，构建为一套完整自洽的东方思维体系。</text>

            <view class="kb-stats">
              <view class="kb-stat">
                <text class="kb-stat-value">81</text>
                <text class="kb-stat-name">章章解析</text>
              </view>
              <view class="kb-stat">
                <text class="kb-stat-value">68</text>
                <text class="kb-stat-name">汪按原注</text>
              </view>
              <view class="kb-stat">
                <text class="kb-stat-value">80+</text>
                <text class="kb-stat-name">逻辑图解</text>
              </view>
              <view class="kb-stat">
                <text class="kb-stat-value">240+</text>
                <text class="kb-stat-name">概念索引</text>
              </view>
            </view>

            <view class="kb-features">
              <view class="kb-feature" v-for="(item, index) in kbFeatures" :key="index">
                <text class="kb-feature-icon">{{ item.icon }}</text>
                <text class="kb-feature-name">{{ item.name }}</text>
              </view>
            </view>

            <view class="kb-actions">
              <button class="btn-primary large" @tap="goToKnowledgeBase">浏览知识库</button>
              <button class="btn-secondary large" @tap="goToKnowledge">研读经文</button>
            </view>
            <view class="kb-hint">
              <text class="kb-hint-text">{{ isLoggedIn ? '登录状态 · 可研读全藏并与AI问答辨析' : '游客模式 · 无需登录即可浏览知识库概要' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 每日一课 - 电脑端双栏布局 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">☯ 每日一章</text>
          <text class="section-subtitle">日读一章 · 日明一理 · 日用一规律</text>
        </view>
        
        <view class="daily-card desktop-daily">
          <view class="daily-left">
            <view class="daily-date">
              <text class="date-day">{{ currentDay }}</text>
              <text class="date-month">{{ currentMonth }}</text>
            </view>
            <view class="daily-chapter">
              <text class="chapter-number">第{{ dailyChapter }}章</text>
              <text class="chapter-title">{{ dailyTitle }}</text>
            </view>
          </view>
          
          <view class="daily-right">
            <view class="daily-content">
              <text class="daily-quote">{{ dailyQuote }}</text>
              <text class="daily-wisdom">{{ dailyWisdom }}</text>
            </view>
            
            <view class="daily-actions">
              <button class="btn-outline" @tap="readChapter">研读本章</button>
              <button class="btn-primary" @tap="discussWithAI">问AI解读</button>
            </view>
          </view>
        </view>
      </view>

      <!-- 章节研学 -->
      <view class="section" id="study">
        <view class="section-header">
          <text class="section-title">☯ 章节研学</text>
          <text class="section-subtitle">按章循序渐进 · 研学进度云端记录</text>
        </view>

        <view class="study-banner">
          <view class="study-stats">
            <view class="study-stat">
              <text class="study-stat-value">81</text>
              <text class="study-stat-name">章章珠玑</text>
            </view>
            <view class="study-stat" v-if="studySummary">
              <text class="study-stat-value">{{ studySummary.studiedCount }}</text>
              <text class="study-stat-name">已研学</text>
            </view>
            <view class="study-stat" v-if="studySummary">
              <text class="study-stat-value">{{ studySummary.percent }}%</text>
              <text class="study-stat-name">完成度</text>
            </view>
            <view class="study-stat" v-else>
              <text class="study-stat-value">3</text>
              <text class="study-stat-name">游客免费试学</text>
            </view>
          </view>

          <view v-if="studySummary" class="study-bar">
            <view class="study-bar-inner" :style="{ width: studySummary.percent + '%' }"></view>
          </view>

          <text class="study-desc">
            {{ studySummary
              ? '学而时习之：读原文、明注解、联实际、用规律——八十一章，章章都是一套可迁移的思维方法。'
              : '游客可免费研学前三章；登录后解锁全部八十一章，研学进度云端同步。' }}
          </text>

          <view class="study-actions">
            <button class="btn-primary large" @tap="goToStudy">
              {{ studySummary ? (studySummary.studiedCount ? '☯ 继续研学' : '☯ 开始研学') : '☯ 免费试学' }}
            </button>
            <button v-if="!isLoggedIn" class="btn-secondary large" @tap="login">登录解锁全部章节</button>
          </view>
        </view>
      </view>

      <!-- 认养数字人 - 电脑端三栏布局 -->
      <view class="section" id="adoption">
        <view class="section-header">
          <text class="section-title">☯ 专属AI研学伙伴</text>
          <text class="section-subtitle">因材施教 · 长期陪伴 · 记录成长</text>
        </view>

        <view class="adoption-grid desktop-adoption">
          <view class="adoption-card">
            <view class="card-icon">🧘</view>
            <text class="card-title">专属导学伙伴</text>
            <text class="card-desc">认养一位AI数字人导师，它记得你的疑问、了解你的进度、陪伴你逐章研读，在《道德经》的规律体系里与你同行。</text>
          </view>

          <view class="adoption-card">
            <view class="card-icon">🧠</view>
            <text class="card-title">长期记忆积累</text>
            <text class="card-desc">专属记忆档案，记录你的研学轨迹与思考脉络，相处越久、了解越深，形成只属于你的学习数据资产。</text>
          </view>

          <view class="adoption-card">
            <view class="card-icon">💎</view>
            <text class="card-title">分享获得回馈</text>
            <text class="card-desc">你的一条优质解答被他人引用，便有积分回流；分享越广、回馈越多，形成知识价值流通的良性循环。</text>
          </view>
        </view>

        <view class="adoption-cta">
          <button class="btn-primary large" @tap="goToAdoption">☯ 认养数字人</button>
        </view>
      </view>

      <!-- 知识市场 - 电脑端展示 -->
      <view class="section" id="market">
        <view class="section-header">
          <text class="section-title">☯ 知识共享市场</text>
          <text class="section-subtitle">心得流通 · 引用有据 · 价值共享</text>
        </view>

        <view class="market-preview desktop-market">
          <view class="market-stats">
            <view class="market-stat">
              <text class="stat-value">{{ marketStats.publicKnowledge }}</text>
              <text class="stat-name">心得公开</text>
            </view>
            <view class="market-stat">
              <text class="stat-value">{{ marketStats.totalCitations }}</text>
              <text class="stat-name">被引用次数</text>
            </view>
            <view class="market-stat">
              <text class="stat-value">{{ marketStats.totalPoints }}</text>
              <text class="stat-name">积分流通</text>
            </view>
          </view>
          
          <view class="market-features">
            <view class="market-feature" v-for="(feature, index) in marketFeatures" :key="index">
              <text class="feature-icon">{{ feature.icon }}</text>
              <text class="feature-name">{{ feature.name }}</text>
              <text class="feature-desc">{{ feature.description }}</text>
            </view>
          </view>
          
          <view class="market-actions">
            <button class="btn-outline" @tap="goToMarket">浏览市场</button>
            <button class="btn-secondary" @tap="publishKnowledge">分享心得</button>
          </view>
        </view>
      </view>

      <!-- 关于我们 -->
      <view class="section" id="about">
        <view class="section-header">
          <text class="section-title">☯ 关于道枢</text>
          <text class="section-subtitle">执行交给工具，判断留给自己</text>
        </view>

        <view class="about-insight">
          <text class="insight-label">— 为什么这个时代，更该学《道德经》 —</text>
          <text class="insight-quote">执行越来越容易，判断越来越值钱</text>
          <text class="insight-desc">AI 让"怎么做"变得前所未有的容易：写方案、敲代码、出设计，一句话即可执行。当执行力被工具迅速拉平，人与人真正的分水岭，就在于"做什么、何时做、做到什么程度、何时放手"的判断力。</text>
          <text class="insight-desc">而《道德经》讲的，正是事物运行的规律与边界——物极必反、知足不辱、知止不殆、欲取先予。这不是消极处世的玄学，而是一套历经两千五百年兴衰验证的正统思维智慧：教人看清方向、把握时机、懂得取舍、守住根本。方向对了，执行才有意义；判断准了，努力才不偏废。这正是它在今天更值得学习、领悟的原因。</text>
          <text class="insight-desc">道枢以 AI 为器、以帛书《道德经》五千言为底本，把这套规律之学变成可对话、可研读、可践行的判断工具——顺境中知止，逆势中蓄力，纷繁中见本。</text>
        </view>

        <view class="about-content">
          <view class="about-text">
            <text class="about-desc">道枢者，道之枢纽也。《道德经》是老子观天文、察地理、鉴人事总结出的规律之学，但年代久远、俗解纷纭，世人往往日用而不知。道枢以AI为工具，打造可认养、可对话、可进化的AI数字人导师，帮你把古人的判断智慧，内化为自己的思维方式。</text>
            <text class="about-desc">与专属数字导师对话研读，可以深入章句、消除疑惑，更能把这些规律运用到职场进退、行业抉择、人际分寸、身心调节之中——规律不在别处，就在每一件需要判断的日常事务里。</text>
            <text class="about-desc">系统立「一源三用」之法：以八十一章为知识源头，经释义层、映射层、应用层三重转化，把抽象的规律之言，变成可对话、可研读、可践行的思维方法与决策工具。</text>
          </view>

          <view class="about-stats">
            <view class="about-stat">
              <text class="stat-icon">📖</text>
              <text class="stat-info">八十一章全本研读</text>
            </view>
            <view class="about-stat">
              <text class="stat-icon">🤖</text>
              <text class="stat-info">AI数字人全程伴学</text>
            </view>
            <view class="about-stat">
              <text class="stat-icon">🔄</text>
              <text class="stat-info">学用结合的实践体系</text>
            </view>
            <view class="about-stat">
              <text class="stat-icon">💰</text>
              <text class="stat-info">知识分享的积分循环</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 页脚 -->
      <view class="footer">
        <view class="footer-content">
          <view class="footer-brand">
            <text class="footer-logo">☯ 道枢 · 东方智慧AI数字人</text>
            <text class="footer-slogan">以经问道 · 以道处世 · 以道驭术</text>
          </view>
          
          <view class="footer-links">
            <view class="footer-section">
              <text class="footer-title">产品</text>
              <text class="footer-link" @tap="goToFeatures">功能特色</text>
              <text class="footer-link" @tap="goToAudience">适用人群</text>
              <text class="footer-link" @tap="goToStudy">章节研学</text>
              <text class="footer-link" @tap="goToSymposium">论道研讨</text>
              <text class="footer-link" @tap="goToDaoBoard">求道板块</text>
              <text class="footer-link" @tap="goToIndustry">行业智囊</text>
              <text class="footer-link" @tap="goToAdoption">认养系统</text>
              <text class="footer-link" @tap="goToMarket">知识市场</text>
            </view>
            
            <view class="footer-section">
              <text class="footer-title">支持</text>
              <text class="footer-link" @tap="goToHelp">帮助中心</text>
              <text class="footer-link" @tap="goToContact">联系我们</text>
              <text class="footer-link" @tap="goToFeedback">意见反馈</text>
            </view>
            
            <view class="footer-section">
              <text class="footer-title">法律</text>
              <text class="footer-link" @tap="goToPrivacy">隐私政策</text>
              <text class="footer-link" @tap="goToTerms">服务条款</text>
              <text class="footer-link" @tap="goToCompliance">合规声明</text>
            </view>
          </view>
          
          <view class="footer-bottom">
            <text class="footer-copyright">© 2024 道德经AI数字人学习系统. 保留所有权利.</text>
            <text class="footer-icp">京ICP备xxxxxxxx号</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 游客模式提示 -->
    <view class="guest-mode" v-if="!isLoggedIn">
      <view class="guest-content">
        <text class="guest-text">您正在以游客模式浏览</text>
        <text class="guest-hint">登录后可体验完整功能</text>
      </view>
      <button class="guest-btn" @tap="login">立即登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useAppStore } from '../../store';
import { api, type StudyChapterList } from '../../api';
import { getToken } from '../../api/request';

const store = useAppStore();
store.restore();

// 章节研学进度（游客/未登录时为 null，显示免费试学）
const studySummary = ref<{ studiedCount: number; percent: number } | null>(null);

// 首页内容区锚点滚动目标（scroll-into-view）
const scrollIntoId = ref('');

async function loadStudySummary() {
  try {
    const res: StudyChapterList = await api.studyChapters();
    const studied = res.studiedCount ?? 0;
    // 游客且无进度时显示免费试学卡片；登录用户/演示模式显示真实进度
    if (res.guest && studied === 0) {
      studySummary.value = null;
      return;
    }
    studySummary.value = {
      studiedCount: studied,
      percent: res.total ? Math.round((studied / res.total) * 100) : 0,
    };
  } catch {
    studySummary.value = null;
  }
}

// 登录状态与账号显示（来自 store，登录/退出后自动同步）
const isLoggedIn = computed(() => store.isLoggedIn);
const displayName = computed(
  () => store.user?.username ?? store.user?.email ?? store.user?.phone ?? '已登录',
);

// 每日一课数据
const currentDay = computed(() => {
  const now = new Date();
  return now.getDate().toString().padStart(2, '0');
});

const currentMonth = computed(() => {
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const now = new Date();
  return months[now.getMonth()];
});

const dailyChapter = ref(1);
const dailyTitle = ref('道，可道也，非恒道也');
const dailyQuote = ref('道，可道也，非恒道也；名，可名也，非恒名也。无名万物之始也，有名万物之母也。');
const dailyWisdom = ref('规律本身难以用语言完全穷尽，但不借助文字便无法传承认知，故老子在此姑且把它命名为"道"。帛书本作"恒道"，汉文帝时避刘恒讳始改"常"字——"恒"字正点出道的核心：恒定、可重复观察验证的客观规律。今日读此章当体会：能被概念说尽的，已不是规律本身；不被名词定义困住，保持开放观察，才能顺应事物自身的运行趋势。');

// 为什么要学《道德经》
const whyReasons = ref([
  {
    index: '一',
    figure: 'wy-fig-cosmos',
    title: '人法地，地法天，天法道，道法自然',
    headline: '自然者，万物自己本来的样子',
    description: '人得大地载养而存，故法地；地得天时运化而生育万物，故法天；天得道之资而运行，故法道。道至上至极、无物可资，自本自根——故道法自然。注本特辨："自然"非今语"自然界"，乃是万物自己本然的样子、无称之言、穷极之辞，层层效法终归于事物自身的运行趋势。'
  },
  {
    index: '二',
    figure: 'wy-fig-four',
    title: '道大，天大，地大，王亦大',
    headline: '国中有四大，而王居一焉',
    description: '域中有四大：道、天、地、王。反归于大道，则道、天、地、人同于一通于大——天地与我并生，万物与我为一，人能体认道之大，便居四大之一。帛书作"王亦大"，王谓体道之君：虚静合道、去人智巧，立自然之教，蓄养天下而不毁万物之自然，是谓天下王。'
  },
  {
    index: '三',
    figure: 'wy-fig-less',
    title: '为学日益，为道日损',
    headline: '损之又损，以至于无为',
    description: '做学问靠加法，每天积累知识；把握规律靠减法，剔除主观妄为与多余干预。五色令人目盲、五音令人耳聋——信息过载反而蒙蔽判断，抓住本质规律，才能少则得、多则惑。'
  },
  {
    index: '四',
    figure: 'wy-fig-rings',
    title: '反者道之动，弱者道之用',
    headline: '祸兮福之所倚，福兮祸之所伏',
    description: '事物发展到极点就会向反面转化，这是老子观察日月盈亏、草木荣枯后总结的循环规律：月满则亏，水满则溢。顺境中留三分余地，逆境中看到转化的可能，按规律行事而非逆势蛮干。'
  },
  {
    index: '五',
    figure: 'wy-fig-target',
    title: '道生一，一生二，二生三，三生万物',
    headline: '万物负阴而抱阳，冲气以为和',
    description: '从统一的本原到对立的两面，再到对立双方交互产生新事物——老子用这个生成模型描述万物演化。本系统以帛书甲乙本为底本，正读「无为」非不为乃不妄为、「不争」非退缩乃不妄争，纠千年俗解之偏。'
  },
  {
    index: '六',
    figure: 'wy-fig-path',
    title: '修之于身，其德乃真；修之于天下，其德乃普',
    headline: '千里之行，始于足下',
    description: '规律的价值在于应用：八十一章从个人身心到组织治理层层展开。AI数字人伴你把古老规律对接到当下场景——职场进退、行业抉择、人际分寸、身心调节，皆可循规律而行，且都从脚下第一步开始。'
  }
]);

// 功能模块数据
const features = ref([
  {
    icon: '☯',
    title: '问道对话',
    description: '提出你的困惑，数字人依经文规律作答，如与老子对谈',
    action: () => goToChat()
  },
  {
    icon: '📜',
    title: '研读经文',
    description: '逐章研读帛书原文，注疏互参，明辨每章主旨',
    action: () => goToKnowledge()
  },
  {
    icon: '📚',
    title: '章节研学',
    description: '八十一章循序渐进，研学进度云端记录',
    action: () => goToStudy()
  },
  {
    icon: '🎭',
    title: '情境推演',
    description: '以现实难题为题，推演老子处此会如何判断抉择',
    action: () => goToChat()
  },
  {
    icon: '🧘',
    title: '静心导引',
    description: '听音入静，致虚守静，观察事物循环往复的规律',
    action: () => goToHealing()
  },
  {
    icon: '🧩',
    title: '道枢权衡',
    description: '以规律观之，八维衡量价值，四维审计决策',
    action: () => goToDaoshu()
  },
  {
    icon: '🌿',
    title: '清心疗愈',
    description: '觉察情绪波动的规律，以理导情，复归于平和',
    action: () => goToHealing()
  },
  {
    icon: '🏛',
    title: '群贤论道',
    description: '老子、庄子、关尹子三席对谈，多角度辨析义理',
    action: () => goToSymposium()
  },
  {
    icon: '❓',
    title: '求道问答',
    description: '发帖提问，学友共答，以积分表谢意',
    action: () => goToDaoBoard()
  },
  {
    icon: '🏗',
    title: '行业应用',
    description: '三百六十行皆有规律可循，生成你的行业应用锦囊',
    action: () => goToIndustry()
  },
  {
    icon: '🎯',
    title: '人群适配',
    description: '不同职业、不同人群，各有切入角度与学法路径',
    action: () => goToAudience()
  },
  {
    icon: '©️',
    title: '知识产权',
    description: '个人沉淀知识库可申请著作权代办与数字知识产权认证',
    action: () => goToIpr()
  }
]);

// 原创知识基座特点（源自汪胜岩注解分析报告）
const kbFeatures = ref([
  { icon: '📜', name: '独尊帛书' },
  { icon: '☯', name: '天人之辨' },
  { icon: '🌀', name: '玄者规律' },
  { icon: '🗺', name: '章章玄图' },
  { icon: '⚖', name: '正读祛蔽' },
  { icon: '🛡', name: '版权限定' }
]);

// 市场特性
const marketFeatures = ref([
  {
    icon: '📖',
    name: '心得公开',
    description: '学友的研读心得与应用案例公开展示'
  },
  {
    icon: '🔗',
    name: '出处可溯',
    description: '每条心得关联章节出处，引用有源'
  },
  {
    icon: '💰',
    name: '积分回馈',
    description: '优质内容被引用，积分自动回馈作者'
  }
]);

// 市场统计数据
const marketStats = ref({
  publicKnowledge: '1,234',
  totalCitations: '5,678',
  totalPoints: '10,000+'
});

onShow(() => {
  store.restore();
  loadStudySummary();
});

onMounted(() => {
  loadStudySummary();
});

// 滚动到指定区域
function scrollToSection(sectionId: string) {
  // #ifdef H5
  const el = document.getElementById(sectionId);
  if (el) {
    const navPx = uni.upx2px(132); // 顶部固定导航栏高度，留出间距
    const top = el.getBoundingClientRect().top + window.scrollY - navPx;
    window.scrollTo({ top: top > 0 ? top : 0, behavior: 'smooth' });
    return;
  }
  // #endif
  // 非 H5 兜底：使用 scroll-view 的 scroll-into-view
  scrollIntoId.value = '';
  nextTick(() => {
    scrollIntoId.value = sectionId;
  });
}

// 导航方法
function startJourney() {
  if (!getToken()) {
    uni.showModal({
      title: '请先登录',
      content: '开始研学需要先登录账号，登录后即可认养数字人并同步研学进度',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) uni.navigateTo({ url: '/pages/login/login' });
      }
    });
    return;
  }
  if (!store.digitalHuman) {
    uni.navigateTo({ url: '/pages/adoption/quiz' });
    return;
  }
  uni.switchTab({ url: '/pages/chat/chat' });
}

function learnMore() {
  scrollToSection('about');
}

function goToChat() {
  if (!store.digitalHuman) {
    uni.showToast({ title: '请先认养数字人', icon: 'none' });
    return;
  }
  uni.switchTab({ url: '/pages/chat/chat' });
}

function goToKnowledge() {
  uni.navigateTo({ url: '/pages/knowledge/knowledge' });
}

function goToKnowledgeBase() {
  uni.navigateTo({ url: '/pages/knowledge-base/knowledge-base' });
}

function goToStudy() {
  uni.switchTab({ url: '/pages/study/study' });
}

function goToHealing() {
  uni.navigateTo({ url: '/pages/healing/healing' });
}

function goToDaoshu() {
  uni.navigateTo({ url: '/pages/daoshu/daoshu' });
}

function goToSymposium() {
  if (!store.digitalHuman) {
    uni.showToast({ title: '请先认养数字人', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: '/pages/symposium/symposium' });
}

function goToDaoBoard() {
  uni.navigateTo({ url: '/pages/dao/dao' });
}

function goToIndustry() {
  uni.navigateTo({ url: '/pages/industry/industry' });
}

function goToAudience() {
  uni.navigateTo({ url: '/pages/audience/audience' });
}

function goToIpr() {
  uni.navigateTo({ url: '/pages/ipr/ipr' });
}

function goToAdoption() {
  if (!getToken()) {
    uni.showModal({
      title: '请先登录',
      content: '认养数字人需要先登录账号',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) uni.navigateTo({ url: '/pages/login/login' });
      }
    });
    return;
  }
  if (store.digitalHuman) {
    uni.switchTab({ url: '/pages/chat/chat' });
  } else {
    uni.navigateTo({ url: '/pages/adoption/quiz' });
  }
}

function goToMarket() {
  uni.switchTab({ url: '/pages/market/market' });
}

function publishKnowledge() {
  uni.navigateTo({ url: '/pages/knowledge/knowledge?mode=publish' });
}

function goToFeatures() {
  scrollToSection('features');
}

function goToHelp() {
  uni.showToast({ title: '帮助中心开发中', icon: 'none' });
}

function goToContact() {
  uni.showToast({ title: '联系我们开发中', icon: 'none' });
}

function goToFeedback() {
  uni.showToast({ title: '意见反馈开发中', icon: 'none' });
}

function goToPrivacy() {
  uni.showToast({ title: '隐私政策开发中', icon: 'none' });
}

function goToTerms() {
  uni.showToast({ title: '服务条款开发中', icon: 'none' });
}

function goToCompliance() {
  uni.showToast({ title: '合规声明开发中', icon: 'none' });
}

function goLogin() {
  if (store.isLoggedIn) {
    uni.switchTab({ url: '/pages/mine/mine' });
    return;
  }
  uni.navigateTo({ url: '/pages/login/login' });
}

function login() {
  goLogin();
}

function register() {
  goLogin();
}

function goMine() {
  uni.switchTab({ url: '/pages/mine/mine' });
}

function logout() {
  uni.showModal({
    title: '退出登录',
    content: `确定退出当前账号「${displayName.value}」吗？`,
    confirmText: '退出',
    success: (r) => {
      if (!r.confirm) return;
      store.logout();
      uni.showToast({ title: '已退出登录', icon: 'none' });
    },
  });
}

function readChapter() {
  uni.navigateTo({ url: '/pages/knowledge/knowledge?chapter=' + dailyChapter.value });
}

function discussWithAI() {
  if (!store.digitalHuman) {
    uni.showToast({ title: '请先认养数字人', icon: 'none' });
    return;
  }
  uni.switchTab({ url: '/pages/chat/chat' });
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-paper);
}

/* 导航栏样式 */
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20rpx);
  border-bottom: 1rpx solid rgba(201, 169, 110, 0.2);
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  height: 88rpx;
}

.logo {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.logo-icon {
  position: relative;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.taiji {
  position: absolute;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(90deg, #1a1a2e 50%, #c9a96e 50%);
  animation: taiji-rotate 20s linear infinite;
  overflow: hidden;
}

@keyframes taiji-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.taiji-yin,
.taiji-yang {
  position: absolute;
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
}

.taiji-yin {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a2e;
}

.taiji-yang {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  background: #c9a96e;
}

.taiji-dot {
  position: absolute;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  z-index: 1;
}

.yin-dot {
  top: 11rpx;
  left: 50%;
  transform: translateX(-50%);
  background: #c9a96e;
}

.yang-dot {
  bottom: 11rpx;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a2e;
}

.logo-char {
  position: relative;
  z-index: 2;
  font-size: 28rpx;
  font-weight: 700;
  color: #c9a96e;
  text-shadow: 0 0 10rpx rgba(26, 26, 46, 0.8);
  font-family: "KaiTi", "STKaiti", serif;
}

.logo-text-wrap {
  display: flex;
  flex-direction: column;
}

.logo-text {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--color-gold);
  letter-spacing: 4rpx;
  font-family: "KaiTi", "STKaiti", serif;
}

.logo-subtitle {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2rpx;
  letter-spacing: 1rpx;
}

.nav-links {
  display: flex;
  gap: 40rpx;
}

.nav-link {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: var(--color-gold);
}

.nav-actions {
  display: flex;
  gap: 20rpx;
}

.nav-btn {
  padding: 10rpx 24rpx;
  border-radius: var(--radius-full);
  font-size: 24rpx;
  font-weight: 600;
}

.login-btn {
  background: transparent;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
}

.register-btn {
  background: var(--gradient-gold);
}

.nav-user {
  display: flex;
  align-items: center;
  max-width: 260rpx;
  padding: 10rpx 20rpx;
}

.nav-user-name {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.92);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.logout-btn {
  background: transparent;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
}

.nav-btn-text {
  color: white;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  margin-top: 88rpx;
}

/* Hero区域 - 电脑端全屏 */
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.hero-particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 30%, rgba(201, 169, 110, 0.3) 0%, transparent 30%),
    radial-gradient(circle at 80% 70%, rgba(52, 152, 219, 0.3) 0%, transparent 30%),
    radial-gradient(circle at 50% 50%, rgba(155, 89, 182, 0.2) 0%, transparent 50%);
}

.hero-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, 
    rgba(26, 26, 46, 0.9) 0%, 
    rgba(26, 26, 46, 0.7) 50%, 
    rgba(26, 26, 46, 0.9) 100%);
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><text x="50" y="50" font-family="serif" font-size="20" fill="rgba(201,169,110,0.05)" text-anchor="middle" dominant-baseline="middle">道</text></svg>');
  background-size: 100px 100px;
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 40rpx;
  text-align: center;
  max-width: 1200rpx;
}

.hero-badge {
  background: rgba(201, 169, 110, 0.2);
  border: 1rpx solid rgba(201, 169, 110, 0.3);
  border-radius: var(--radius-full);
  padding: 12rpx 30rpx;
  margin-bottom: 40rpx;
}

.badge-text {
  font-size: 24rpx;
  color: var(--color-gold);
  font-weight: 600;
  letter-spacing: 2rpx;
}

.hero-title {
  font-size: 80rpx;
  font-weight: 700;
  color: var(--color-gold);
  margin-bottom: 30rpx;
  letter-spacing: 6rpx;
  line-height: 1.2;
}

.title-line {
  display: inline;
}

.hero-subtitle {
  font-size: 40rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 30rpx;
  line-height: 1.5;
}

.hero-desc {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 60rpx;
  line-height: 1.8;
  max-width: 800rpx;
}

.hero-stats {
  display: flex;
  gap: 80rpx;
  margin-bottom: 60rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 48rpx;
  font-weight: 700;
  color: var(--color-gold);
  margin-bottom: 10rpx;
}

.stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.hero-actions {
  display: flex;
  gap: 30rpx;
  margin-bottom: 40rpx;
}

.btn-primary.large {
  padding: 24rpx 60rpx;
  font-size: 32rpx;
}

.btn-secondary.large {
  padding: 24rpx 60rpx;
  font-size: 32rpx;
}

.hero-hint {
  margin-top: 20rpx;
}

.hint-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

/* 区域样式 */
.section {
  padding: 80rpx 60rpx;
  max-width: 1400rpx;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 60rpx;
}

.section-subtitle {
  font-size: 28rpx;
  color: #8a7f6a;
  margin-top: 15rpx;
}

/* 为什么要学《道德经》 */
.why-intro {
  position: relative;
  background: var(--gradient-ink);
  border-radius: var(--radius-lg);
  padding: 60rpx 48rpx;
  margin-bottom: 60rpx;
  box-shadow: var(--shadow-medium);
  overflow: hidden;
}

.why-intro::after {
  content: '道';
  position: absolute;
  top: 50%;
  right: 40rpx;
  transform: translateY(-50%);
  font-size: 180rpx;
  color: rgba(201, 169, 110, 0.08);
  font-weight: bold;
  pointer-events: none;
}

.why-quote {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  position: relative;
  z-index: 1;
  max-width: 900rpx;
}

.why-quote-line {
  color: rgba(255, 255, 255, 0.85);
  font-size: 28rpx;
  line-height: 1.9;
}

.why-quote-line:first-child {
  color: var(--color-gold);
  font-size: 30rpx;
}

.why-intro-stats {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-top: 50rpx;
  padding-top: 40rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.12);
  position: relative;
  z-index: 1;
}

.why-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.why-stat-value {
  color: var(--color-gold);
  font-size: 40rpx;
  font-weight: 700;
}

.why-stat-name {
  color: rgba(255, 255, 255, 0.6);
  font-size: 22rpx;
  margin-top: 6rpx;
}

.why-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 40rpx;
}

.why-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 44rpx 36rpx;
  box-shadow: var(--shadow-soft);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.why-card:hover {
  transform: translateY(-8rpx);
  box-shadow: var(--shadow-medium);
}

.why-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 26rpx;
}

.why-figure {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.why-index {
  font-size: 56rpx;
  font-weight: 700;
  color: rgba(201, 169, 110, 0.25);
  line-height: 1;
  font-family: serif;
}

.wy-fig-cosmos::before {
  content: '';
  width: 84rpx;
  height: 84rpx;
  border-radius: 50%;
  background: radial-gradient(circle,
    var(--color-gold) 0 8rpx,
    transparent 8rpx 14rpx,
    rgba(201, 169, 110, 0.85) 14rpx 16rpx,
    transparent 16rpx 26rpx,
    rgba(201, 169, 110, 0.55) 26rpx 28rpx,
    transparent 28rpx 38rpx,
    rgba(201, 169, 110, 0.3) 38rpx 40rpx,
    transparent 40rpx);
}

.wy-fig-cosmos::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 108rpx;
  height: 108rpx;
  border: 2rpx dashed rgba(201, 169, 110, 0.35);
  border-radius: 50%;
}

.wy-fig-four::before {
  content: '';
  width: 78rpx;
  height: 78rpx;
  background:
    radial-gradient(circle at 50% 50%, var(--color-gold) 0 7rpx, transparent 7rpx),
    radial-gradient(circle at 50% 8%, rgba(201, 169, 110, 0.85) 0 5rpx, transparent 5rpx),
    radial-gradient(circle at 92% 50%, rgba(201, 169, 110, 0.85) 0 5rpx, transparent 5rpx),
    radial-gradient(circle at 50% 92%, rgba(201, 169, 110, 0.85) 0 5rpx, transparent 5rpx),
    radial-gradient(circle at 8% 50%, rgba(201, 169, 110, 0.85) 0 5rpx, transparent 5rpx);
}

.wy-fig-four::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
  width: 72rpx;
  height: 72rpx;
  border: 2rpx solid rgba(201, 169, 110, 0.35);
  border-radius: 8rpx;
}

.wy-fig-less::before {
  content: '';
  width: 22rpx;
  height: 64rpx;
  background: linear-gradient(180deg, var(--color-gold), rgba(201, 169, 110, 0.35));
  border-radius: 6rpx;
}

.wy-fig-less::after {
  content: '';
  width: 22rpx;
  height: 28rpx;
  border: 3rpx solid var(--color-gold);
  border-radius: 6rpx;
}

.wy-fig-rings::before {
  content: '';
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  background: radial-gradient(circle,
    transparent 0 8rpx,
    rgba(201, 169, 110, 0.9) 8rpx 10rpx,
    transparent 10rpx 18rpx,
    rgba(201, 169, 110, 0.65) 18rpx 20rpx,
    transparent 20rpx 28rpx,
    rgba(201, 169, 110, 0.4) 28rpx 30rpx,
    transparent 30rpx);
}

.wy-fig-target::before {
  content: '';
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: radial-gradient(circle,
    var(--color-gold) 0 6rpx,
    transparent 6rpx 12rpx,
    rgba(201, 169, 110, 0.5) 12rpx 15rpx,
    transparent 15rpx 24rpx,
    rgba(201, 169, 110, 0.25) 24rpx 27rpx,
    transparent 27rpx);
}

.wy-fig-target::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100rpx;
  height: 2rpx;
  background: rgba(201, 169, 110, 0.4);
}

.wy-fig-path::before {
  content: '';
  width: 100rpx;
  border-top: 3rpx dashed rgba(201, 169, 110, 0.6);
}

.wy-fig-path::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: var(--color-gold);
  box-shadow: 88rpx 0 0 0 var(--color-gold);
}

.why-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: var(--color-ink);
  line-height: 1.5;
  margin-bottom: 16rpx;
}

.why-quote-src {
  display: inline-block;
  font-size: 24rpx;
  color: var(--color-gold);
  border-left: 4rpx solid var(--color-gold);
  padding-left: 14rpx;
  margin-bottom: 18rpx;
  align-self: flex-start;
}

.why-desc {
  font-size: 26rpx;
  color: #8a7f6a;
  line-height: 1.8;
}

.why-footer {
  text-align: center;
  margin-top: 60rpx;
}

.why-footer-text {
  display: block;
  font-size: 28rpx;
  color: #5a5a5a;
  line-height: 1.9;
  max-width: 800rpx;
  margin: 0 auto 40rpx;
}

.why-footer-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30rpx;
  flex-wrap: wrap;
}

.why-footer-actions .btn-outline {
  padding: 24rpx 60rpx;
  font-size: 32rpx;
}

/* 功能网格 - 电脑端 */
.feature-grid.desktop-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40rpx;
}

.feature-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 40rpx;
  box-shadow: var(--shadow-soft);
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  text-align: center;
}

.feature-card:hover {
  transform: translateY(-8rpx);
  box-shadow: var(--shadow-medium);
}

.feature-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: var(--radius-full);
  background: var(--gradient-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30rpx;
}

.icon-text {
  font-size: 50rpx;
}

.feature-title {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--color-ink);
  margin-bottom: 15rpx;
}

.feature-desc {
  font-size: 28rpx;
  color: #8a7f6a;
  line-height: 1.6;
}

.feature-arrow {
  position: absolute;
  bottom: 30rpx;
  right: 30rpx;
  width: 50rpx;
  height: 50rpx;
  border-radius: var(--radius-full);
  background: rgba(201, 169, 110, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.feature-card:hover .feature-arrow {
  background: var(--color-gold);
}

.arrow-text {
  font-size: 28rpx;
  color: var(--color-gold);
  transition: color 0.3s ease;
}

.feature-card:hover .arrow-text {
  color: white;
}

/* 每日一课 - 电脑端双栏 */
.daily-card.desktop-daily {
  display: flex;
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-medium);
}

.daily-left {
  flex: 1;
  background: var(--gradient-ink);
  color: white;
  padding: 60rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.daily-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
}

.date-day {
  font-size: 80rpx;
  font-weight: 700;
  color: var(--color-gold);
  line-height: 1;
}

.date-month {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 10rpx;
}

.daily-chapter {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chapter-number {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--color-gold);
  margin-bottom: 10rpx;
}

.chapter-title {
  font-size: 40rpx;
  font-weight: 700;
  text-align: center;
}

.daily-right {
  flex: 1;
  padding: 60rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.daily-content {
  margin-bottom: 40rpx;
}

.daily-quote {
  font-size: 36rpx;
  color: var(--color-ink);
  font-style: italic;
  line-height: 1.8;
  margin-bottom: 30rpx;
  padding-left: 30rpx;
  border-left: 6rpx solid var(--color-gold);
}

.daily-wisdom {
  font-size: 28rpx;
  color: #8a7f6a;
  line-height: 1.8;
}

.daily-actions {
  display: flex;
  gap: 20rpx;
}

.btn-outline {
  flex: 1;
  background: transparent;
  color: var(--color-ink);
  border: 2rpx solid #e8e8e8;
  border-radius: var(--radius-full);
  padding: 24rpx;
  font-size: 28rpx;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-outline:hover {
  border-color: var(--color-gold);
  color: var(--color-gold);
}

/* 章节研学 */
.study-banner {
  background: white;
  border-radius: var(--radius-lg);
  padding: 60rpx;
  box-shadow: var(--shadow-medium);
  text-align: center;
}

.study-stats {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 30rpx;
  margin-bottom: 40rpx;
}

.study-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.study-stat-value {
  font-size: 52rpx;
  font-weight: 700;
  color: var(--color-gold);
}

.study-stat-name {
  font-size: 24rpx;
  color: #8a7f6a;
  margin-top: 8rpx;
}

.study-bar {
  height: 18rpx;
  background: #f0ece0;
  border-radius: 10rpx;
  overflow: hidden;
  margin: 0 auto 40rpx;
  max-width: 800rpx;
}

.study-bar-inner {
  height: 100%;
  background: linear-gradient(90deg, #5b6b52, var(--color-gold));
  border-radius: 10rpx;
  transition: width 0.4s ease;
}

.study-desc {
  display: block;
  font-size: 28rpx;
  color: #8a7f6a;
  line-height: 1.8;
  max-width: 800rpx;
  margin: 0 auto 44rpx;
}

.study-actions {
  display: flex;
  justify-content: center;
  gap: 30rpx;
  flex-wrap: wrap;
}

/* 认养数字人 - 电脑端三栏 */
.adoption-grid.desktop-adoption {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40rpx;
  margin-bottom: 40rpx;
}

.adoption-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 50rpx 40rpx;
  text-align: center;
  box-shadow: var(--shadow-soft);
  transition: transform 0.3s ease;
}

.adoption-card:hover {
  transform: translateY(-8rpx);
}

.card-icon {
  font-size: 80rpx;
  margin-bottom: 30rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--color-ink);
  margin-bottom: 20rpx;
  display: block;
}

.card-desc {
  font-size: 26rpx;
  color: #8a7f6a;
  line-height: 1.6;
  display: block;
}

.adoption-cta {
  text-align: center;
}

/* 知识市场 - 电脑端 */
/* 原创知识基座 */
.kb-banner {
  position: relative;
  background: var(--gradient-ink);
  border-radius: var(--radius-lg);
  padding: 60rpx 40rpx;
  overflow: hidden;
  box-shadow: var(--shadow-medium);
}

.kb-banner::before {
  content: '';
  position: absolute;
  top: 20rpx;
  left: 20rpx;
  right: 20rpx;
  bottom: 20rpx;
  border: 2rpx solid rgba(201, 169, 110, 0.25);
  border-radius: var(--radius-md);
  pointer-events: none;
}

.kb-banner::after {
  content: '道';
  position: absolute;
  top: 50%;
  right: 40rpx;
  transform: translateY(-50%);
  font-size: 200rpx;
  color: rgba(201, 169, 110, 0.08);
  font-weight: bold;
  pointer-events: none;
}

.kb-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.kb-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 30rpx;
  justify-content: center;
}

.kb-tag {
  background: rgba(201, 169, 110, 0.15);
  border: 1rpx solid rgba(201, 169, 110, 0.4);
  border-radius: var(--radius-full);
  padding: 8rpx 24rpx;
}

.kb-tag-guest {
  background: rgba(91, 107, 82, 0.35);
  border-color: rgba(91, 107, 82, 0.7);
}

.kb-tag-text {
  color: var(--color-gold);
  font-size: 22rpx;
}

.kb-title {
  display: block;
  color: white;
  font-size: 40rpx;
  font-weight: 700;
  margin-bottom: 20rpx;
}

.kb-desc {
  display: block;
  color: rgba(255, 255, 255, 0.75);
  font-size: 26rpx;
  line-height: 1.8;
  margin-bottom: 40rpx;
  max-width: 900rpx;
  margin-left: auto;
  margin-right: auto;
}

.kb-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 40rpx;
  margin-bottom: 40rpx;
  justify-content: center;
}

.kb-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.kb-stat-value {
  color: var(--color-gold);
  font-size: 44rpx;
  font-weight: 700;
}

.kb-stat-name {
  color: rgba(255, 255, 255, 0.7);
  font-size: 22rpx;
  margin-top: 6rpx;
}

.kb-features {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-bottom: 50rpx;
  justify-content: center;
}

.kb-feature {
  display: flex;
  align-items: center;
  gap: 10rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-full);
  padding: 10rpx 26rpx;
}

.kb-feature-icon {
  font-size: 26rpx;
}

.kb-feature-name {
  color: rgba(255, 255, 255, 0.9);
  font-size: 23rpx;
}

.kb-actions {
  display: flex;
  gap: 30rpx;
  flex-wrap: wrap;
  margin-bottom: 24rpx;
  justify-content: center;
}

.kb-actions button {
  margin: 0;
}

.kb-hint {
  text-align: center;
}

.kb-hint-text {
  color: rgba(255, 255, 255, 0.55);
  font-size: 22rpx;
}

.market-preview.desktop-market {
  background: white;
  border-radius: var(--radius-lg);
  padding: 60rpx;
  box-shadow: var(--shadow-medium);
}

.market-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 50rpx;
  padding-bottom: 50rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.market-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 48rpx;
  font-weight: 700;
  color: var(--color-gold);
  margin-bottom: 10rpx;
}

.stat-name {
  font-size: 26rpx;
  color: #8a7f6a;
}

.market-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40rpx;
  margin-bottom: 50rpx;
}

.market-feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.feature-icon {
  font-size: 60rpx;
  margin-bottom: 20rpx;
}

.feature-name {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-ink);
  margin-bottom: 10rpx;
  display: block;
}

.feature-desc {
  font-size: 24rpx;
  color: #8a7f6a;
  display: block;
}

.market-actions {
  display: flex;
  justify-content: center;
  gap: 30rpx;
}

/* 关于我们 */
.about-insight {
  background: var(--gradient-ink);
  border-radius: var(--radius-lg);
  padding: 56rpx 50rpx;
  margin-bottom: 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.insight-label {
  font-size: 24rpx;
  color: var(--color-gold);
  letter-spacing: 4rpx;
  margin-bottom: 28rpx;
}

.insight-quote {
  font-size: 44rpx;
  font-weight: 700;
  line-height: 1.5;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: var(--color-gold);
  margin-bottom: 32rpx;
}

.insight-desc {
  font-size: 27rpx;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.9;
  text-align: left;
  margin-bottom: 22rpx;
}

.insight-desc:last-child {
  margin-bottom: 0;
}

.about-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 60rpx;
  align-items: start;
}

.about-text {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.about-desc {
  font-size: 28rpx;
  color: #5a5a5a;
  line-height: 1.8;
}

.about-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30rpx;
}

.about-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 30rpx;
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-soft);
}

.stat-icon {
  font-size: 40rpx;
  margin-bottom: 15rpx;
}

.stat-info {
  font-size: 24rpx;
  color: #8a7f6a;
}

/* 页脚 */
.footer {
  background: var(--gradient-ink);
  padding: 80rpx 60rpx 40rpx;
}

.footer-content {
  max-width: 1200rpx;
  margin: 0 auto;
}

.footer-brand {
  text-align: center;
  margin-bottom: 60rpx;
}

.footer-logo {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--color-gold);
  display: block;
  margin-bottom: 10rpx;
}

.footer-slogan {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 60rpx;
  margin-bottom: 60rpx;
}

.footer-section {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.footer-title {
  font-size: 28rpx;
  font-weight: 600;
  color: white;
  margin-bottom: 10rpx;
}

.footer-link {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: color 0.3s ease;
}

.footer-link:hover {
  color: var(--color-gold);
}

.footer-bottom {
  text-align: center;
  padding-top: 40rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.1);
}

.footer-copyright {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-bottom: 10rpx;
}

.footer-icp {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.4);
}

/* 游客模式提示 */
.guest-mode {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20rpx);
  padding: 20rpx 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1rpx solid rgba(201, 169, 110, 0.2);
  z-index: 999;
}

.guest-content {
  display: flex;
  flex-direction: column;
}

.guest-text {
  font-size: 24rpx;
  color: white;
}

.guest-hint {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.6);
}

.guest-btn {
  background: var(--gradient-gold);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  padding: 12rpx 30rpx;
  font-size: 24rpx;
  font-weight: 600;
}

/* 响应式调整 - 电脑端 */
@media (min-width: 768px) {
  .desktop-only {
    display: flex;
  }
  
  .hero-title {
    font-size: 100rpx;
  }
  
  .hero-subtitle {
    font-size: 48rpx;
  }
  
  .hero-desc {
    font-size: 32rpx;
  }
  
  .section {
    padding: 100rpx 80rpx;
  }
  
  .feature-grid.desktop-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .adoption-grid.desktop-adoption {
    grid-template-columns: repeat(3, 1fr);
  }

  .why-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .market-features {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .about-content {
    grid-template-columns: 2fr 1fr;
  }
  
  .footer-links {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 移动端调整 */
@media (max-width: 767px) {
  .desktop-only {
    display: none;
  }
  
  .hero-section {
    min-height: 100vh;
    padding: 0 30rpx;
  }
  
  .hero-title {
    font-size: 62rpx;
    letter-spacing: 4rpx;
    line-height: 1.35;
  }

  .title-line {
    display: block;
  }
  
  .hero-subtitle {
    font-size: 32rpx;
  }
  
  .hero-desc {
    font-size: 26rpx;
  }
  
  .hero-stats {
    gap: 40rpx;
  }
  
  .hero-actions {
    flex-direction: column;
    gap: 20rpx;
  }
  
  .btn-primary.large,
  .btn-secondary.large {
    width: 100%;
  }
  
  .section {
    padding: 60rpx 30rpx;
  }
  
  .feature-grid.desktop-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20rpx;
  }
  
  .feature-card {
    padding: 30rpx;
  }
  
  .daily-card.desktop-daily {
    flex-direction: column;
  }
  
  .daily-left {
    padding: 40rpx;
  }
  
  .daily-right {
    padding: 40rpx;
  }
  
  .adoption-grid.desktop-adoption {
    grid-template-columns: 1fr;
    gap: 20rpx;
  }

  .why-grid {
    grid-template-columns: 1fr;
    gap: 24rpx;
  }

  .why-card {
    padding: 36rpx 30rpx;
  }

  .market-features {
    grid-template-columns: 1fr;
    gap: 30rpx;
  }
  
  .about-insight {
    padding: 44rpx 34rpx;
    margin-bottom: 40rpx;
  }

  .insight-quote {
    font-size: 36rpx;
  }

  .insight-desc {
    font-size: 26rpx;
  }

  .about-content {
    grid-template-columns: 1fr;
    gap: 40rpx;
  }

  .about-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .footer {
    padding: 50rpx 30rpx 30rpx;
  }

  .footer-brand {
    margin-bottom: 36rpx;
  }

  .footer-logo {
    font-size: 32rpx;
  }

  .footer-links {
    grid-template-columns: repeat(2, 1fr);
    gap: 30rpx 24rpx;
    margin-bottom: 36rpx;
  }

  .footer-section {
    gap: 12rpx;
  }

  .footer-section:first-child {
    grid-column: 1 / -1;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 12rpx 28rpx;
  }

  .footer-section:first-child .footer-title {
    width: 100%;
    margin-bottom: 4rpx;
  }

  .footer-title {
    font-size: 26rpx;
  }

  .footer-link {
    font-size: 24rpx;
  }

  .footer-copyright {
    font-size: 22rpx;
  }

  .guest-mode {
    flex-direction: column;
    gap: 15rpx;
    text-align: center;
  }
  
  .guest-btn {
    width: 100%;
  }
}
</style>