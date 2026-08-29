import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  // 部署在 3349 站点 /admin 子路径下
  base: '/admin/',
  server: {
    port: 5174,
    host: '0.0.0.0',
    proxy: {
      // 管理控制台 → 后端（后端全局前缀 /api/v1）
      '/api': {
        target: 'http://localhost:3081',
        changeOrigin: true,
      },
    },
  },
});
