import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', component: () => import('./views/Login.vue') },
    {
      path: '/',
      component: () => import('./Layout.vue'),
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', component: () => import('./views/Dashboard.vue'), meta: { title: '数据看板' } },
        { path: 'models', component: () => import('./views/ModelConfig.vue'), meta: { title: '大模型配置' } },
        { path: 'speech', component: () => import('./views/SpeechConfig.vue'), meta: { title: '语音配置' } },
        { path: 'plans', component: () => import('./views/Plans.vue'), meta: { title: '套餐管理' } },
        { path: 'knowledge', component: () => import('./views/KnowledgeReview.vue'), meta: { title: '知识库审核' } },
        { path: 'ipr', component: () => import('./views/IprReview.vue'), meta: { title: '知识产权服务' } },
        { path: 'users', component: () => import('./views/Users.vue'), meta: { title: '用户管理' } },
        { path: 'points', component: () => import('./views/Points.vue'), meta: { title: '积分账务' } },
        { path: 'audit', component: () => import('./views/AuditLogs.vue'), meta: { title: '审计日志' } },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const token = localStorage.getItem('admin_token');
  if (!token && to.path !== '/login') return '/login';
  if (token && to.path === '/login') return '/dashboard';
  return true;
});

export default router;
