<template>
  <view class="page">
    <TaijiBackButton floating />
    <view class="hero">
      <view class="hero-badge">道枢 · 为谁而来</view>
      <text class="hero-title">同一部经典，照进六种人生</text>
      <text class="hero-sub">《道德经》不是学问，是具体处境里的活法。</text>
      <text class="hero-desc">看看下面六个场景——如果有一个像你，道枢就是为你准备的。</text>
    </view>

    <!-- 六大用户群体 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">他们在用道枢</text>
        <text class="section-subtitle">六类用户 · 六个具体场景</text>
      </view>

      <view v-for="(g, i) in groups" :key="i" class="group-card">
        <view class="group-head">
          <text class="group-icon">{{ g.icon }}</text>
          <view class="group-title-block">
            <text class="group-title">{{ g.title }}</text>
            <text class="group-tagline">{{ g.tagline }}</text>
          </view>
        </view>

        <view class="scene-box">
          <text class="scene-label">📖 场景</text>
          <text class="scene-text">{{ g.scene }}</text>
        </view>

        <view class="use-box">
          <text class="use-label">🧭 在道枢</text>
          <text class="use-text">{{ g.usage }}</text>
        </view>

        <view class="gain-box">
          <text class="gain-label">🎁 收获</text>
          <text class="gain-text">{{ g.gain }}</text>
        </view>

        <view class="group-actions">
          <view class="group-btn" @tap="goFeature(g.feature)">{{ g.featureText }}</view>
        </view>
      </view>
    </view>

    <!-- 四重价值 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">你将获得什么</text>
        <text class="section-subtitle">不止读经，更是可积累的智慧资产</text>
      </view>

      <view class="value-grid">
        <view v-for="(v, i) in values" :key="i" class="value-card">
          <text class="value-icon">{{ v.icon }}</text>
          <text class="value-title">{{ v.title }}</text>
          <text class="value-desc">{{ v.desc }}</text>
        </view>
      </view>

      <view class="value-stats">
        <view class="v-stat">
          <text class="v-num">81</text>
          <text class="v-label">章原创注解</text>
        </view>
        <view class="v-stat">
          <text class="v-num">1:1</text>
          <text class="v-label">专属数字人</text>
        </view>
        <view class="v-stat">
          <text class="v-num">4</text>
          <text class="v-label">角色研讨</text>
        </view>
        <view class="v-stat">
          <text class="v-num">∞</text>
          <text class="v-label">问道可能</text>
        </view>
      </view>
    </view>

    <!-- 行动区 -->
    <view class="cta">
      <text class="cta-title">道不远人，始于今日一问</text>
      <text class="cta-desc">游客可直接体验问答与知识基座；认养数字人后，开启长期陪伴与专属成长。</text>
      <view class="cta-actions">
        <button class="btn-primary large" @tap="startJourney">开始问道之旅</button>
        <button class="btn-secondary large" @tap="goKnowledgeBase">先看看知识基座</button>
      </view>
      <text class="cta-hint">无需付费 · 游客可预览 · 注册即享完整功能</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useAppStore } from '../../store';
import TaijiBackButton from '../../components/TaijiBackButton.vue';

const store = useAppStore();
store.restore();

const groups = [
  {
    icon: '💼',
    title: '职场中坚 · 内耗的管理者',
    tagline: '越用力，越疲惫',
    scene: '35 岁的项目经理，团队士气低落、上级层层施压。凌晨还在改方案，白天开不完的会，晋升的焦虑和带人的疲惫一起压过来。',
    usage: '与认养的数字人导师复盘真实管理困境：用「无为而治」推演授权方案，用道枢思维四维审计做取舍，把「上医治未病」变成管理动作。',
    gain: '一套贴合自己处境的带团队心法：从"用力管人"到"顺势成事"，减少内耗，睡得着觉。',
    feature: 'chat',
    featureText: '去与数字人推演我的处境',
  },
  {
    icon: '🚀',
    title: '创业者与经营者',
    tagline: '在不确定中找确定',
    scene: '民宿主理人，行业内卷、现金流紧绷。夜里常怀疑自己选错了赛道，白天还要给团队打气。重大决策前，没有人可以商量。',
    usage: '把决策难题带进论道研讨：数字人主持、老子庄子关尹子三方碰撞，输出会议纪要与行动建议；悬赏发帖求道，让其他数字人也来作答。',
    gain: '重大决策前的"第二大脑"：不替你拍板，但让你看清每个选项背后的道与势，减少情绪化决策。',
    feature: 'symposium',
    featureText: '发起一场决策研讨',
  },
  {
    icon: '👨‍👩‍👧',
    title: '家长与亲子家庭',
    tagline: '想教孩子，先教自己',
    scene: '想陪 10 岁的女儿读经典，却只会背"道可道"，孩子追问一句"什么意思"就卡住。说教多了怕逆反，不说又怕错过了启蒙窗口。',
    usage: '认养一位数字人陪孩子逐章研学：孩子提问，数字人以故事和苏格拉底式追问引导，不直接给答案；家长旁听，自己也长一层理解。',
    gain: '一个不评判、不说教的"经典私教"：亲子共学有话聊，孩子的价值观成长看得见、留得下。',
    feature: 'knowledge',
    featureText: '从第一章开始共学',
  },
  {
    icon: '🎓',
    title: '学生与传统文化学习者',
    tagline: '啃原文，不再劝退',
    scene: '备考之余想读《道德经》原典，一翻书：古字生僻、注解各说各话、帛书本传世本对不上，三天热度就搁下了。',
    usage: '81 章逐章精读，三视角切换（原文 / 今译 / 概念逻辑图）；研讨里听庄子如何用"虚舟"讲不争，疑问随手发进求道板块。',
    gain: '一部随身携带、可追问的"活注解"：观点有出处、引文可溯源，学习成果沉淀为自己的研学档案。',
    feature: 'knowledge',
    featureText: '进入章节研学',
  },
  {
    icon: '🌊',
    title: '高压情绪人群',
    tagline: '先安顿身心，再谈道理',
    scene: '连续加班后失眠、胸闷、刷手机停不下来。道理都懂——"别焦虑"——但情绪不听道理，凌晨三点依然清醒。',
    usage: '睡前打开静心导引："致虚极，守静笃"的呼吸练习；情绪上来时用焦虑急救三步法，5 分钟把心拉回来；每周生成情绪复盘。',
    gain: '一套 3-5 分钟就能完成的自我安顿工具：不依赖意志力，用方法把心带回清净，情绪周报让你看见自己的变化。',
    feature: 'healing',
    featureText: '体验静心导引',
  },
  {
    icon: '🍵',
    title: '银发修心群体',
    tagline: '退休不是终点，是修行的开始',
    scene: '退休两年，读书、遛弯、含饴弄孙，但总觉得少了点什么——想找同好论道，身边却没人聊得来"道可道"。',
    usage: '每日一课精进打卡；与数字人聊天，它记得你的人生故事和上次聊的话题；发起论道研讨，跟老子庄子"隔空对谈"。',
    gain: '一个越用越懂你的智慧伙伴：记得你的故事、接得住你的话头，研学档案记录每一天的精进。',
    feature: 'symposium',
    featureText: '发起一场论道研讨',
  },
];

const values = [
  {
    icon: '📜',
    title: '一部活的经典',
    desc: '81 章帛书定本原创注解，每章配概念逻辑图，可对话、可追问、可溯源。',
  },
  {
    icon: '🧘',
    title: '一位专属导师',
    desc: '认养 1:1 数字人，长期记忆你的处境与成长，越用越懂你，绝不说教式灌输。',
  },
  {
    icon: '📈',
    title: '一份成长档案',
    desc: '八维道系人格画像、进化报告、情绪周报——看得见的改变，留得下的足迹。',
  },
  {
    icon: '💎',
    title: '一份智慧资产',
    desc: '你的洞见可入知识库、可被引用得积分；研讨纪要沉淀为公共智慧，价值流转。',
  },
];

function goFeature(feature: string) {
  const dhReady = !!store.digitalHuman;
  const routes: Record<string, string> = {
    chat: dhReady ? '/pages/chat/chat' : '/pages/adoption/quiz',
    symposium: dhReady ? '/pages/symposium/symposium' : '/pages/adoption/quiz',
    knowledge: '/pages/knowledge/knowledge',
    healing: '/pages/healing/healing',
  };
  const url = routes[feature] ?? '/pages/chat/chat';
  if ((feature === 'chat' || feature === 'symposium') && !dhReady) {
    uni.showToast({ title: '先认养数字人，体验更完整', icon: 'none' });
  }
  uni.navigateTo({ url });
}

function startJourney() {
  if (!store.digitalHuman) {
    uni.navigateTo({ url: '/pages/adoption/quiz' });
    return;
  }
  uni.navigateTo({ url: '/pages/chat/chat' });
}

function goKnowledgeBase() {
  uni.navigateTo({ url: '/pages/knowledge-base/knowledge-base' });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-paper);
}

.hero {
  background: var(--gradient-ink);
  padding: 120rpx 40rpx 80rpx;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-badge {
  display: inline-block;
  background: rgba(201, 169, 110, 0.2);
  border: 1rpx solid rgba(201, 169, 110, 0.3);
  border-radius: var(--radius-full);
  padding: 10rpx 28rpx;
  margin-bottom: 30rpx;
  color: var(--color-gold);
  font-size: 22rpx;
  letter-spacing: 2rpx;
}

.hero-title {
  display: block;
  font-size: 52rpx;
  font-weight: 700;
  color: var(--color-gold);
  letter-spacing: 4rpx;
  margin-bottom: 24rpx;
}

.hero-sub {
  display: block;
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20rpx;
}

.hero-desc {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.7;
}

.section {
  padding: 70rpx 30rpx 0;
}

.section-header {
  text-align: center;
  margin-bottom: 50rpx;
}

.section-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: var(--color-ink);
}

.section-subtitle {
  display: block;
  font-size: 26rpx;
  color: #8a7f6a;
  margin-top: 12rpx;
}

/* 群体卡片 */
.group-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  padding: 36rpx 30rpx;
  margin-bottom: 30rpx;
}

.group-head {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 26rpx;
}

.group-icon {
  width: 90rpx;
  height: 90rpx;
  border-radius: var(--radius-full);
  background: rgba(201, 169, 110, 0.1);
  font-size: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.group-title-block {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.group-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--color-ink);
}

.group-tagline {
  font-size: 22rpx;
  color: var(--color-gold);
  margin-top: 6rpx;
}

.scene-box,
.use-box,
.gain-box {
  border-radius: var(--radius-md);
  padding: 20rpx 24rpx;
  margin-bottom: 16rpx;
}

.scene-box {
  background: #fafaf7;
}

.use-box {
  background: rgba(52, 152, 219, 0.05);
}

.gain-box {
  background: rgba(91, 107, 82, 0.07);
}

.scene-label,
.use-label,
.gain-label {
  display: block;
  font-size: 22rpx;
  font-weight: 600;
  margin-bottom: 10rpx;
}

.scene-label { color: #8a7f6a; }
.use-label { color: var(--color-tech-blue); }
.gain-label { color: var(--color-jade); }

.scene-text,
.use-text,
.gain-text {
  font-size: 26rpx;
  color: #4a4a4a;
  line-height: 1.75;
}

.gain-text {
  color: #3d4a37;
}

.group-actions {
  margin-top: 8rpx;
}

.group-btn {
  text-align: center;
  border: 2rpx solid var(--color-gold);
  color: var(--color-gold);
  border-radius: var(--radius-full);
  padding: 18rpx;
  font-size: 26rpx;
  font-weight: 600;
}

/* 价值 */
.value-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.value-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  padding: 34rpx 28rpx;
  display: flex;
  flex-direction: column;
}

.value-icon {
  font-size: 52rpx;
  margin-bottom: 20rpx;
}

.value-title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--color-ink);
  margin-bottom: 14rpx;
}

.value-desc {
  font-size: 24rpx;
  color: #8a7f6a;
  line-height: 1.7;
}

.value-stats {
  display: flex;
  justify-content: space-around;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  padding: 40rpx 20rpx;
  margin-top: 30rpx;
}

.v-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.v-num {
  font-size: 44rpx;
  font-weight: 700;
  color: var(--color-gold);
}

.v-label {
  font-size: 22rpx;
  color: #8a7f6a;
  margin-top: 8rpx;
}

/* CTA */
.cta {
  background: var(--gradient-ink);
  padding: 90rpx 40rpx 100rpx;
  text-align: center;
  margin-top: 70rpx;
}

.cta-title {
  display: block;
  font-size: 42rpx;
  font-weight: 700;
  color: var(--color-gold);
  margin-bottom: 24rpx;
}

.cta-desc {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.8;
  margin-bottom: 50rpx;
}

.cta-actions {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 30rpx;
}

.btn-primary.large {
  background: var(--gradient-gold);
  color: var(--color-ink);
  border: none;
  border-radius: var(--radius-full);
  padding: 26rpx;
  font-size: 32rpx;
  font-weight: 700;
}

.btn-secondary.large {
  background: transparent;
  color: var(--color-gold);
  border: 2rpx solid var(--color-gold);
  border-radius: var(--radius-full);
  padding: 26rpx;
  font-size: 32rpx;
  font-weight: 600;
}

.cta-hint {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.5);
}

/* 电脑端 */
@media (min-width: 768px) {
  .hero {
    padding: 140rpx 60rpx 100rpx;
  }

  .hero-title {
    font-size: 64rpx;
  }

  .section {
    max-width: 1000rpx;
    margin: 0 auto;
    padding: 90rpx 40rpx 0;
  }

  .value-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .cta-actions {
    flex-direction: row;
    justify-content: center;
  }

  .btn-primary.large,
  .btn-secondary.large {
    padding: 26rpx 80rpx;
  }
}
</style>
