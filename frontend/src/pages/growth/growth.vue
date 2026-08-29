<template>
  <view class="page">
    <TaijiBackButton floating />
    <view class="hero">
      <view class="hero-title">增长与裂变</view>
      <view class="hero-sub">道系人格测试 · 每日箴言 · 邀请共学</view>
    </view>

    <!-- 道系人格测试 -->
    <view class="section">
      <view class="section-title">道系人格测试（8 维 → 16 型）</view>
      <view v-if="!quizDone">
        <view v-if="quizQuestions.length" class="quiz-card">
          <view class="quiz-progress">第 {{ currentQ + 1 }} / {{ quizQuestions.length }} 题</view>
          <view class="quiz-question">{{ quizQuestions[currentQ].text }}</view>
          <view v-for="(opt, j) in quizQuestions[currentQ].options" :key="j" class="quiz-option" @tap="selectOption(opt.score)">
            {{ opt.label }}
          </view>
        </view>
      </view>

      <view v-else class="result-card">
        <view class="persona-badge" :style="{ background: personaColor }">
          <view class="persona-title">{{ personaTitle }}</view>
          <view class="persona-mode">{{ mode }}</view>
        </view>
        <view class="persona-desc">{{ personaDesc }}</view>
        <view class="score-grid">
          <view v-for="(score, key) in scores" :key="key" class="score-item">
            <view class="score-bar-bg"><view class="score-bar" :style="{ width: (score / 5 * 100) + '%' }"></view></view>
            <text class="score-key">{{ dimLabels[key] || key }}</text>
            <text class="score-val">{{ score }}</text>
          </view>
        </view>
        <view class="share-section">
          <view class="share-title">分享你的道系人格</view>
          <view class="share-card" :style="{ background: personaColor }">
            <view class="share-persona">{{ personaTitle }}</view>
            <view class="share-judge">{{ personaJudge }}</view>
            <view class="share-text">{{ shareText }}</view>
          </view>
          <view class="btn primary" @tap="copyShare">复制分享文案</view>
        </view>
      </view>
    </view>

    <!-- 每日箴言卡 -->
    <view class="section">
      <view class="section-title">每日箴言卡</view>
      <view class="proverb-card" :style="{ background: proverbDesign.primary }">
        <view class="proverb-quote">{{ proverbQuote }}</view>
        <view class="proverb-modern">{{ proverbModern }}</view>
        <view class="proverb-source">{{ proverbSource }}</view>
        <view class="proverb-action">{{ proverbAction }}</view>
      </view>
      <view class="btn" @tap="loadProverb">刷新今日箴言</view>
    </view>

    <!-- 邀请文案 -->
    <view class="section">
      <view class="section-title">邀请好友共学</view>
      <view class="invite-card">
        <view class="invite-text">{{ inviteText }}</view>
        <view class="btn primary" @tap="copyInvite">复制邀请语</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../api';
import TaijiBackButton from '../../components/TaijiBackButton.vue';

const quizQuestions = ref<any[]>([]);
const currentQ = ref(0);
const answers = ref<Record<string, number>>({});
const quizDone = ref(false);

const personaTitle = ref('');
const personaDesc = ref('');
const personaJudge = ref('');
const personaColor = ref('#5b6b52');
const mode = ref('');
const scores = ref<Record<string, number>>({});
const shareText = ref('');

const dimLabels: Record<string, string> = {
  dao: '道', de: '德', wuwei: '无为', rou: '柔', jing: '静', pu: '朴', zhizu: '知足', ziran: '自然'
};

const proverbQuote = ref('');
const proverbModern = ref('');
const proverbSource = ref('');
const proverbAction = ref('');
const proverbDesign = ref({ primary: '#3B4E63' });

const inviteText = ref('');

onMounted(async () => {
  try {
    const quiz = await api.daoxiQuiz();
    quizQuestions.value = quiz.questions || [];
  } catch {
    uni.showToast({ title: '加载测试失败', icon: 'none' });
  }
  loadProverb();
  loadInvite();
});

function selectOption(score: number) {
  const q = quizQuestions.value[currentQ.value];
  answers.value[q.id] = score;
  if (currentQ.value < quizQuestions.value.length - 1) {
    currentQ.value++;
  } else {
    submitQuiz();
  }
}

async function submitQuiz() {
  try {
    const r = await api.submitDaoxiQuiz(answers.value);
    quizDone.value = true;
    personaTitle.value = r.persona?.title || '';
    personaDesc.value = r.persona?.desc || '';
    personaJudge.value = r.persona?.judge || '';
    personaColor.value = r.persona?.shareColor || '#5b6b52';
    mode.value = r.mode || '';
    scores.value = r.scores || {};
    shareText.value = r.shareCard?.shareText || '';
  } catch {
    uni.showToast({ title: '提交失败', icon: 'none' });
  }
}

async function loadProverb() {
  try {
    const r = await api.dailyProverb();
    proverbQuote.value = r.quote || '';
    proverbModern.value = r.modern || '';
    proverbSource.value = r.source || '';
    proverbAction.value = r.action || '';
    proverbDesign.value = r.design || { primary: '#3B4E63' };
  } catch {
    uni.showToast({ title: '加载箴言失败', icon: 'none' });
  }
}

async function loadInvite() {
  try {
    const r = await api.inviteText(personaTitle.value);
    inviteText.value = r.text || '';
  } catch {
    uni.showToast({ title: '加载邀请失败', icon: 'none' });
  }
}

function copyShare() {
  const text = `我的道系人格是【${personaTitle.value}】\n${personaJudge.value}\n\n${shareText.value}\n\n来测测你的？`;
  uni.setClipboardData({ data: text, success: () => uni.showToast({ title: '已复制', icon: 'success' }) });
}

function copyInvite() {
  uni.setClipboardData({ data: inviteText.value, success: () => uni.showToast({ title: '已复制', icon: 'success' }) });
}
</script>

<style scoped>
.page { padding: 30rpx; background: #f7f3ea; min-height: 100vh; }
.hero { padding: 40rpx 10rpx 30rpx; text-align: center; }
.hero-title { font-size: 44rpx; font-weight: 700; letter-spacing: 6rpx; color: #3a3226; }
.hero-sub { margin-top: 12rpx; font-size: 26rpx; color: #8a7f6a; }
.section { margin-bottom: 40rpx; }
.section-title { font-size: 30rpx; font-weight: 600; color: #3a3226; margin-bottom: 20rpx; padding-left: 16rpx; border-left: 6rpx solid #b8a477; }
.quiz-card { background: #fffdf7; border-radius: 20rpx; padding: 40rpx; box-shadow: 0 4rpx 16rpx rgba(90, 80, 60, 0.06); }
.quiz-progress { font-size: 24rpx; color: #8a7f6a; margin-bottom: 20rpx; }
.quiz-question { font-size: 32rpx; font-weight: 600; color: #3a3226; margin-bottom: 30rpx; line-height: 1.5; }
.quiz-option { padding: 24rpx; border: 2rpx solid #e0d8c8; border-radius: 16rpx; margin-bottom: 16rpx; font-size: 28rpx; color: #3a3226; background: #fff; }
.quiz-option:active { background: #f7f3ea; }
.result-card { background: #fffdf7; border-radius: 20rpx; padding: 40rpx; box-shadow: 0 4rpx 16rpx rgba(90, 80, 60, 0.06); }
.persona-badge { border-radius: 20rpx; padding: 40rpx; text-align: center; margin-bottom: 24rpx; }
.persona-title { font-size: 40rpx; font-weight: 700; color: #fff; letter-spacing: 4rpx; }
.persona-mode { font-size: 24rpx; color: rgba(255, 255, 255, 0.9); margin-top: 8rpx; }
.persona-desc { font-size: 26rpx; color: #3a3226; line-height: 1.6; margin-bottom: 24rpx; }
.score-grid { margin-bottom: 24rpx; }
.score-item { display: flex; align-items: center; margin-bottom: 12rpx; }
.score-bar-bg { flex: 1; height: 12rpx; background: #e8e0d0; border-radius: 6rpx; overflow: hidden; margin-right: 16rpx; }
.score-bar { height: 100%; background: #5b6b52; border-radius: 6rpx; }
.score-key { width: 80rpx; font-size: 24rpx; color: #8a7f6a; }
.score-val { width: 40rpx; font-size: 24rpx; font-weight: 600; color: #5b6b52; }
.share-section { margin-top: 30rpx; border-top: 1rpx solid #e0d8c8; padding-top: 30rpx; }
.share-title { font-size: 28rpx; font-weight: 600; color: #3a3226; margin-bottom: 20rpx; }
.share-card { border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.share-persona { font-size: 36rpx; font-weight: 700; color: #fff; }
.share-judge { font-size: 26rpx; color: rgba(255, 255, 255, 0.9); margin-top: 8rpx; }
.share-text { font-size: 24rpx; color: rgba(255, 255, 255, 0.85); margin-top: 12rpx; line-height: 1.5; }
.btn { padding: 20rpx 40rpx; border-radius: 40rpx; text-align: center; font-size: 28rpx; font-weight: 600; margin-top: 20rpx; background: #efe6d5; color: #3a3226; }
.btn.primary { background: #b8a477; color: #fdfaf2; }
.proverb-card { border-radius: 20rpx; padding: 40rpx; margin-bottom: 20rpx; color: #fff; }
.proverb-quote { font-size: 36rpx; font-weight: 600; line-height: 1.6; margin-bottom: 20rpx; }
.proverb-modern { font-size: 26rpx; opacity: 0.9; line-height: 1.5; margin-bottom: 16rpx; }
.proverb-source { font-size: 22rpx; opacity: 0.7; margin-bottom: 16rpx; }
.proverb-action { font-size: 26rpx; background: rgba(255, 255, 255, 0.2); padding: 16rpx; border-radius: 12rpx; }
.invite-card { background: #fffdf7; border-radius: 20rpx; padding: 30rpx; }
.invite-text { font-size: 26rpx; color: #3a3226; line-height: 1.6; margin-bottom: 20rpx; }
</style>