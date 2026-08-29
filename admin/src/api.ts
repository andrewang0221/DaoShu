import axios from 'axios';

const http = axios.create({ baseURL: '/api/v1', timeout: 30000 });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message ?? err.message ?? '请求失败';
    return Promise.reject(new Error(msg));
  },
);

export const adminApi = {
  login: (account: string, password: string) => http.post('/auth/login', { account, password }),
  dashboard: () => http.get('/admin/dashboard'),
  users: () => http.get('/admin/users'),
  setUserStatus: (id: string, status: 'active' | 'banned') =>
    http.post(`/admin/users/${id}/status`, { status }),
  reviewQueue: () => http.get('/admin/knowledge/review-queue'),
  review: (id: string, action: 'approve' | 'reject' | 'needs_revision', note?: string) =>
    http.post(`/admin/knowledge/review/${id}`, { action, note }),
  importKnowledge: () => http.post('/admin/knowledge/import'),
  pointTransactions: () => http.get('/admin/points/transactions'),
  auditLogs: () => http.get('/admin/audit-logs'),

  // 大模型配置（V2.3）
  models: () => http.get('/admin/models'),
  createModel: (dto: Record<string, unknown>) => http.post('/admin/models', dto),
  updateModel: (id: string, dto: Record<string, unknown>) => http.put(`/admin/models/${id}`, dto),
  deleteModel: (id: string) => http.delete(`/admin/models/${id}`),
  testModel: (dto: Record<string, unknown>) => http.post('/admin/models/test', dto),

  // 套餐配置（V2.3）
  plans: () => http.get('/admin/plans'),
  upsertPlan: (dto: Record<string, unknown>) => http.post('/admin/plans', dto),
  deletePlan: (code: string) => http.delete(`/admin/plans/${code}`),

  // 语音配置（V2.6 · 讯飞）
  speechConfig: () => http.get('/admin/speech'),
  saveSpeechConfig: (dto: Record<string, unknown>) => http.put('/admin/speech', dto),
  testSpeechConfig: (dto: Record<string, unknown>) => http.post('/admin/speech/test', dto),

  // 知识产权审核（V2.9）
  iprStats: () => http.get('/admin/ipr/stats'),
  iprApplications: (status?: string) =>
    http.get(`/admin/ipr/applications${status ? `?status=${status}` : ''}`),
  iprReview: (
    id: string,
    action: 'accept' | 'certify' | 'reject',
    extra?: { reason?: string; certNo?: string; certUrl?: string },
  ) => http.post(`/admin/ipr/applications/${id}/review`, { action, ...extra }),
};
