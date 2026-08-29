import { defineStore } from 'pinia';
import { setToken } from '../api/request';

interface UserInfo {
  id: string;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  role: string;
}
interface DigitalHumanInfo {
  id: string;
  name: string;
  avatarStyle?: string;
  avatarUrl?: string | null;
  avatarGlbUrl?: string | null;
  avatar3dParams?: Record<string, unknown> | null;
}

export const useAppStore = defineStore('app', {
  state: () => ({
    token: '',
    user: null as UserInfo | null,
    digitalHuman: null as DigitalHumanInfo | null,
    quizScores: null as Record<string, number> | null,
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
  },
  actions: {
    setAuth(token: string, user: UserInfo) {
      this.token = token;
      this.user = user;
      setToken(token);
      uni.setStorageSync('token', token);
      uni.setStorageSync('user', JSON.stringify(user));
    },
    setDigitalHuman(dh: DigitalHumanInfo) {
      this.digitalHuman = dh;
      uni.setStorageSync('digitalHuman', JSON.stringify(dh));
    },
    setQuizScores(scores: Record<string, number>) {
      this.quizScores = scores;
      uni.setStorageSync('quizScores', JSON.stringify(scores));
    },
    restore() {
      this.token = uni.getStorageSync('token') || '';
      setToken(this.token);
      try {
        const u = uni.getStorageSync('user');
        this.user = u ? JSON.parse(u) : null;
        const dh = uni.getStorageSync('digitalHuman');
        this.digitalHuman = dh ? JSON.parse(dh) : null;
        const qs = uni.getStorageSync('quizScores');
        this.quizScores = qs ? JSON.parse(qs) : null;
      } catch {
        // 忽略解析错误
      }
    },
    logout() {
      this.token = '';
      this.user = null;
      setToken('');
      uni.removeStorageSync('token');
      uni.removeStorageSync('user');
    },
  },
});
