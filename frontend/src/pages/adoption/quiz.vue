<template>
  <view class="page">
    <TaijiBackButton floating />
    <view class="intro">
      认养之前，先测一测你的价值观底色 —— 它将决定你的数字人如何与你同行。
    </view>

    <view v-for="(q, qi) in questions" :key="q.id" class="q-card">
      <view class="q-index">{{ qi + 1 }} / {{ questions.length }}</view>
      <view class="q-text">{{ q.text }}</view>
      <view
        v-for="(opt, oi) in q.options"
        :key="oi"
        class="opt"
        :class="{ picked: answers[q.id] === opt.score }"
        @tap="pick(q.id, opt.score)"
      >
        {{ opt.label }}
      </view>
    </view>

    <view class="submit-btn" :class="{ disabled: !ready }" @tap="submit">提交，诞生数字人</view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { api, QuizQuestion } from '../../api';
import { getToken } from '../../api/request';
import TaijiBackButton from '../../components/TaijiBackButton.vue';
import { useAppStore } from '../../store';

const store = useAppStore();
store.restore();
const questions = ref<QuizQuestion[]>([]);
const answers = ref<Record<string, number>>({});

const ready = computed(
  () => questions.value.length > 0 && questions.value.every((q) => answers.value[q.id] !== undefined),
);

onLoad(async () => {
  try {
    const quiz = await api.getQuiz();
    questions.value = quiz.questions;
  } catch (e: unknown) {
    const msg = (e as Error)?.message || '';
    if (!getToken() || msg.includes('登录') || msg.includes('令牌') || msg.includes('认证')) {
      uni.showModal({
        title: '请先登录',
        content: '认养数字人需要先登录账号，登录后再来测一测吧',
        confirmText: '去登录',
        cancelText: '返回',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({ url: '/pages/login/login' });
          } else {
            // 取消登录引导：返回上一页，避免困在空白问卷页
            uni.navigateBack({
              fail: () => uni.switchTab({ url: '/pages/index/index' }),
            });
          }
        }
      });
    } else {
      uni.showToast({ title: '加载问卷失败，请稍后重试', icon: 'none' });
    }
  }
});

function pick(qid: string, score: number) {
  answers.value[qid] = score;
}

async function submit() {
  if (!ready.value) {
    uni.showToast({ title: '请完成全部题目', icon: 'none' });
    return;
  }
  uni.showLoading({ title: '参悟中…' });
  try {
    const { scores } = await api.submitQuiz(answers.value);
    store.setQuizScores(scores);
    uni.hideLoading();
    uni.navigateTo({ url: '/pages/adoption/create' });
  } catch {
    uni.hideLoading();
  }
}
</script>

<style scoped>
.page {
  padding: 30rpx;
  padding-top: calc(120rpx + env(safe-area-inset-top));
}
.intro {
  font-size: 26rpx;
  color: #8a7f6a;
  line-height: 1.8;
  margin-bottom: 24rpx;
  padding: 20rpx;
  background: #efe6d5;
  border-radius: 16rpx;
}
.q-card {
  background: #fffdf7;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(90, 80, 60, 0.06);
}
.q-index {
  font-size: 22rpx;
  color: #b3a88f;
  margin-bottom: 10rpx;
}
.q-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #3a3226;
  margin-bottom: 20rpx;
}
.opt {
  padding: 20rpx 24rpx;
  border: 2rpx solid #e8dfc8;
  border-radius: 14rpx;
  font-size: 26rpx;
  color: #5a4f3d;
  margin-bottom: 14rpx;
}
.opt.picked {
  border-color: #5b6b52;
  background: #f0f3ea;
  color: #3a3226;
}
.submit-btn {
  margin-top: 20rpx;
  height: 88rpx;
  border-radius: 44rpx;
  background: #5b6b52;
  color: #fdfaf2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  letter-spacing: 4rpx;
}
.submit-btn.disabled {
  opacity: 0.5;
}
</style>
