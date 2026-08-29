import { get, post, put, del } from './request';
import { API_BASE } from '../env';
import { getToken } from './request';
import type { Avatar3DParams } from '../components/canvas-avatar';

// ---------- 类型 ----------
export interface Citation {
  chapterNo: number;
  chapterTitle: string;
  source: string;
}
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  createdAt: string;
}
export interface Conversation {
  id: string;
  digitalHumanId: string;
  mode: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}
export interface QuizDimension {
  key: string;
  label: string;
}
export interface QuizQuestion {
  id: string;
  dimension: string;
  text: string;
  options: { label: string; score: number }[];
}
export interface DigitalHuman {
  id: string;
  name: string;
  avatarStyle?: string;
  avatarUrl?: string | null;
  avatarGlbUrl?: string | null;
  avatar3dParams?: Avatar3DParams | null;
  voiceId?: string;
  level?: string;
}
export interface KnowledgeItem {
  chapterNo?: number;
  title?: string;
  simplified?: string | null;
  summary?: string | null;
  content?: string;
  source?: string;
}
export interface MyRecommendation {
  id: string;
  chapterNo?: number | null;
  content: string;
  source: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision' | string;
  reviewNote?: string | null;
  createdAt?: string;
}
export interface MarketItem {
  id: string;
  content?: string;
  deidentifiedContent?: string;
  sceneTags?: string[];
  publishedAt?: string;
}
export interface PointsAccount {
  balance: number;
  frozen: number;
  shop: { code: string; name: string; cost: number }[];
}
export interface AuthUser {
  id: string;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  role: string;
}
export interface AuthResult {
  token: string;
  user: AuthUser;
}
export interface SymposiumSpeech {
  speaker: string;
  stance: string;
  content: string;
  citations: { chapterNo: number; chapterTitle: string }[];
}
export interface SymposiumSummary {
  coreInsights: string[];
  agreements: string[];
  disagreements: string[];
  applications: string[];
  closingQuote: string;
}
export interface SymposiumRecord {
  id: string;
  digitalHumanId: string;
  hostName: string;
  topic: string;
  chapterNo: number | null;
  rounds: number;
  speeches: SymposiumSpeech[];
  speechCount?: number;
  summary: SymposiumSummary;
  knowledgeItemId: string | null;
  knowledgeStatus: string;
  createdAt: string;
}
export interface DaoInquiry {
  id: string;
  askerUserId: string;
  askerName: string;
  askerType: 'digital_human' | 'user';
  digitalHumanId: string | null;
  content: string;
  isPaid: boolean;
  bounty: number;
  status: 'open' | 'resolved';
  acceptedAnswerId: string | null;
  answerCount: number;
  createdAt: string;
}
export interface DaoAnswer {
  id: string;
  inquiryId: string;
  answererUserId: string;
  answererName: string;
  answererType: 'digital_human' | 'user';
  digitalHumanId: string | null;
  content: string;
  accepted: boolean;
  reward: number;
  createdAt: string;
}
export interface DaoInquiryDetail extends DaoInquiry {
  answers: DaoAnswer[];
}
export interface LLMModelItem {
  id: string;
  modelKey: string;
  displayName: string;
  provider: string;
  modelRole: 'light' | 'heavy' | 'embed';
  minTier: 'free' | 'pro' | 'enterprise';
  temperature: number;
  maxTokens: number;
  description: string;
  apiKeyMasked?: string;
}
export interface LLMSettings {
  userId: string;
  provider: string;
  apiBaseUrl: string;
  apiKeyMasked: string;
  modelName: string;
  enabled: boolean;
  configured: boolean;
}
export interface StudyChapterItem {
  no: number;
  title: string;
  excerpt: string;
  studied: boolean;
  locked: boolean;
}
export interface StudyChapterList {
  total: number;
  guest: boolean;
  guestFreeChapters: number;
  studiedCount: number;
  nextChapterNo: number | null;
  chapters: StudyChapterItem[];
}
export interface StudyAnnotation {
  sentence: string;
  items: { type: string; text: string }[];
}
export interface StudyChapter {
  no: number;
  title: string;
  source: string;
  chapterNote: string;
  original: string;
  simplified: string | null;
  phonetics: string | null;
  conceptNotes: string;
  summary: string | null;
  annotations: StudyAnnotation[];
  images?: string[];
}
export interface StudyChapterDetail {
  guest: boolean;
  studied: boolean;
  chapter: StudyChapter;
}
export interface StudyNote {
  id: string;
  section: string;
  quote: string | null;
  content: string;
  createdAt: string;
}
export interface StudyProgress {
  total: number;
  studiedCount: number;
  nextChapterNo: number | null;
  percent: number;
}

// ---------- V2.9 知识产权服务 ----------
export interface IprService {
  serviceType: 'copyright' | 'digital_cert';
  name: string;
  tagline: string;
  desc: string;
  serviceFee: number;
  duration: string;
  authority: string;
  deliverable: string;
  workTypes: string[];
  requiresApplicant: boolean;
  highlights: string[];
}
export interface IprWork {
  source: string;
  refId: string;
  title: string;
  excerpt: string;
  words: number;
  createdAt?: string;
}
export type IprStatus = 'draft' | 'submitted' | 'reviewing' | 'certified' | 'rejected';
export interface IprApplication {
  id: string;
  applicationNo: string | null;
  userId: string;
  serviceType: 'copyright' | 'digital_cert';
  workTitle: string;
  workType: string;
  workSource: string;
  workRefId: string | null;
  workMeta: Record<string, unknown>;
  applicant: Record<string, unknown>;
  serviceFee: number;
  status: IprStatus;
  rejectReason: string | null;
  certNo: string | null;
  certUrl: string | null;
  certifiedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------- API ----------
export const api = {
  // 认证
  register: (dto: { username: string; password: string; email?: string; nickname?: string }) =>
    post<AuthResult>('/auth/register', dto),
  login: (account: string, password: string) =>
    post<AuthResult>('/auth/login', { account, password }),
  forgotPassword: (account: string) =>
    post<{ ok: boolean; message: string; devCode?: string; devEmail?: string }>(
      '/auth/forgot-password',
      { account },
    ),
  resetPassword: (account: string, code: string, newPassword: string) =>
    post<{ ok: boolean }>('/auth/reset-password', { account, code, newPassword }),
  changePassword: (oldPassword: string, newPassword: string) =>
    post<{ ok: boolean }>('/auth/change-password', { oldPassword, newPassword }),
  me: () => get<{ user: AuthUser }>('/users/me'),

  // 认养
  getQuiz: () =>
    get<{ dimensions: QuizDimension[]; questions: QuizQuestion[] }>('/adoption/quiz'),
  submitQuiz: (answers: Record<string, number>) =>
    post<{ scores: Record<string, number> }>('/adoption/quiz', { answers }),
  uploadAvatar: (filePath: string) =>
    new Promise<{ url: string; size: number; mimetype: string }>((resolve, reject) => {
      uni.uploadFile({
        url: `${API_BASE}/adoption/avatar`,
        filePath,
        name: 'file',
        header: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(res.data as string));
            } catch {
              uni.showToast({ title: '上传响应解析失败', icon: 'none' });
              reject(new Error('上传响应解析失败'));
            }
          } else {
            let msg = `上传失败（${res.statusCode}）`;
            try {
              msg = JSON.parse(res.data as string)?.message ?? msg;
            } catch {
              /* ignore */
            }
            uni.showToast({ title: msg, icon: 'none', duration: 2500 });
            reject(new Error(msg));
          }
        },
        fail: (err) => {
          uni.showToast({ title: '网络异常，请检查后端是否启动', icon: 'none' });
          reject(err);
        },
      });
    }),
  createDigitalHuman: (dto: {
    name: string;
    avatarStyle?: string;
    avatarUrl?: string;
    avatarGlbUrl?: string;
    avatar3dParams?: Avatar3DParams;
    quizScores?: Record<string, number>;
  }) => post<DigitalHuman>('/adoption/digital-human', dto),
  /** 上传 .glb 三维头像模型文件（Instant-Avatar / DreamFace 等外部工具产出） */
  uploadGlb: (filePath: string) =>
    new Promise<{ url: string; size: number }>((resolve, reject) => {
      uni.uploadFile({
        url: `${API_BASE}/adoption/glb`,
        filePath,
        name: 'file',
        header: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(res.data as string));
            } catch {
              uni.showToast({ title: '上传响应解析失败', icon: 'none' });
              reject(new Error('上传响应解析失败'));
            }
          } else {
            let msg = `上传失败（${res.statusCode}）`;
            try {
              msg = JSON.parse(res.data as string)?.message ?? msg;
            } catch {
              /* ignore */
            }
            uni.showToast({ title: msg, icon: 'none', duration: 2500 });
            reject(new Error(msg));
          }
        },
        fail: (err) => {
          uni.showToast({ title: '网络异常，请检查后端是否启动', icon: 'none' });
          reject(err);
        },
      });
    }),
  /** 照片 → 3D 生成服务 → .glb 模型（不依赖视觉大模型，服务未配置时报错引导直接上传 GLB） */
  generateAvatarGlb: (filePath: string) =>
    new Promise<{ glbUrl: string; size: number }>((resolve, reject) => {
      uni.uploadFile({
        url: `${API_BASE}/adoption/avatar-glb`,
        filePath,
        name: 'file',
        header: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(res.data as string));
            } catch {
              uni.showToast({ title: '响应解析失败', icon: 'none' });
              reject(new Error('响应解析失败'));
            }
          } else {
            let msg = `生成失败（${res.statusCode}）`;
            try {
              msg = JSON.parse(res.data as string)?.message ?? msg;
            } catch {
              /* ignore */
            }
            uni.showToast({ title: msg, icon: 'none', duration: 3000 });
            reject(new Error(msg));
          }
        },
        fail: (err) => {
          uni.showToast({ title: '网络异常，请检查后端是否启动', icon: 'none' });
          reject(err);
        },
      });
    }),
  /** 局部更新当前数字人（chat 页换头像 / 局部重设形象） */
  updateDigitalHuman: (dto: {
    name?: string;
    avatarStyle?: string;
    avatarUrl?: string | null;
    avatarGlbUrl?: string | null;
    avatar3dParams?: Avatar3DParams | null;
  }) => put<DigitalHuman>('/adoption/digital-human', dto),
  signContract: (dhId: string) => post(`/adoption/contract/${dhId}`),
  adoptionPanel: (dhId?: string) =>
    get<Record<string, unknown>>(`/adoption/panel${dhId ? `/${dhId}` : ''}`),

  // 对话（LLM 生成较慢，超时放宽到 180 秒）
  createConversation: (dto: { digitalHumanId: string; mode?: string; title?: string }) =>
    post<Conversation>('/chat/conversations', dto),
  listConversations: (dhId: string) => get<Conversation[]>(`/chat/conversations/${dhId}`),
  getMessages: (convId: string) => get<ChatMessage[]>(`/chat/conversations/${convId}/messages`),
  ask: (convId: string, content: string) =>
    post<ChatMessage>(`/chat/conversations/${convId}/messages`, { content }, { timeout: 180000 }),
  /** 流式问答（SSE，H5 fetch 逐段解析）：onDelta 增量回调，resolve 返回完整消息 */
  askStream: async (
    convId: string,
    content: string,
    onDelta: (text: string) => void,
  ): Promise<ChatMessage> => {
    const resp = await fetch(`${API_BASE}/chat/conversations/${convId}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: JSON.stringify({ content }),
    });
    if (!resp.ok || !resp.body) throw new Error(`连接失败（${resp.status}）`);
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalMsg: ChatMessage | null = null;
    const handle = (payload: string) => {
      const evt = JSON.parse(payload) as {
        type: string;
        content?: string;
        message?: ChatMessage;
      };
      if (evt.type === 'delta' && evt.content) onDelta(evt.content);
      else if (evt.type === 'final' && evt.message) finalMsg = evt.message;
      else if (evt.type === 'error') throw new Error('回答失败');
    };
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        const line = part.split('\n').find((l) => l.startsWith('data: '));
        if (line) handle(line.slice(6));
      }
    }
    if (!finalMsg) throw new Error('未收到完整回答');
    return finalMsg;
  },

  // 知识库
  searchKnowledge: (keyword?: string) =>
    get<KnowledgeItem[]>(`/knowledge/items${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`),
  knowledgeChapter: (chapterNo: number) =>
    get<KnowledgeItem[]>(`/knowledge/items?chapterNo=${chapterNo}`, { silent: true }),
  recommend: (dto: { content: string; source: string; chapterNo?: number; tags?: string[] }) =>
    post('/knowledge/recommend', dto),
  myRecommendations: () =>
    get<MyRecommendation[]>('/knowledge/my-recommendations', { silent: true }),

  // 知识市场
  publishMarket: (dto: { content: string; sceneTags?: string[]; digitalHumanId?: string }) =>
    post('/market/publish', dto),
  marketItems: () => get<MarketItem[]>('/market/items'),

  // 章节研学
  studyChapters: () => get<StudyChapterList>('/study/chapters', { silent: true }),
  studyChapter: (no: number) => get<StudyChapterDetail>(`/study/chapters/${no}`, { silent: true }),
  studyComplete: (no: number) =>
    post<{ studiedCount: number; nextChapterNo: number | null }>(
      `/study/chapters/${no}/complete`,
      {},
    ),
  studyProgress: () => get<StudyProgress>('/study/progress', { silent: true }),
  // 某章笔记与划句标注列表（需登录）
  studyNotes: (no: number) => get<StudyNote[]>(`/study/chapters/${no}/notes`, { silent: true }),
  // 新增笔记（可带 quote 引用原句）
  studyAddNote: (no: number, dto: { section: string; quote?: string; content?: string }) =>
    post<StudyNote>(`/study/chapters/${no}/notes`, dto),
  // 删除笔记
  studyDeleteNote: (noteId: string) => del<{ ok: boolean }>(`/study/notes/${noteId}`),
  // 划句标注 toggle（再点一次取消）
  studyToggleMark: (no: number, quote: string) =>
    post<{ ok: boolean; marked: boolean }>(`/study/chapters/${no}/marks`, { quote }),

  // 积分
  points: () => get<PointsAccount>('/points/me'),
  exchange: (itemCode: string) => post<{ balance: number; item?: string }>('/points/exchange', { itemCode }),

  // ---------- V2.0 新增模块 ----------
  // 道枢思维底座
  daoshuFrameworks: () => get<any>('/daoshu/frameworks'),
  daoshuReflect: (text: string) => post<any>('/daoshu/reflect', { text }, { timeout: 180000 }),
  daoshuAudit: (text: string) => post<any>('/daoshu/audit', { text }, { timeout: 180000 }),
  daoshuAlignmentKnowledge: () => get<any>('/daoshu/alignment-knowledge'),
  daoshuMetaKnowledge: () => get<any>('/daoshu/meta-knowledge'),

  // 疗愈引擎
  healingAssess: (text: string) => post<any>('/healing/assess', { text }, { timeout: 180000 }),
  healingSOS: (text: string) => post<any>('/healing/sos', { text }, { timeout: 180000 }),
  healingPatterns: () => get<any>('/healing/patterns'),
  healingWeeklyReview: (records?: string[]) => post<any>('/healing/weekly-review', { records }, { timeout: 180000 }),

  // 增长引擎
  daoxiQuiz: () => get<any>('/growth/daoxi-quiz'),
  submitDaoxiQuiz: (answers: Record<string, number>) => post<any>('/growth/daoxi-quiz', { answers }),
  dailyProverb: () => get<any>('/growth/proverb-card'),
  inviteText: (persona?: string) => get<any>(`/growth/invite${persona ? `?persona=${encodeURIComponent(persona)}` : ''}`),

  // 行业 Agent（invoke/detect 走 LLM 生成，超时放宽到 180 秒）
  industryAgents: () => get<any>('/industry/agents'),
  industryAgentDetail: (code: string) => get<any>(`/industry/agents/${code}`),
  industryInvoke: (code: string, question: string) =>
    post<any>(`/industry/agents/${code}/invoke`, { question }, { timeout: 180000 }),
  industryDetect: (profile: string) => post<any>('/industry/detect', { profile }, { timeout: 180000 }),
  industryUnlock: (code: string) => post<any>(`/industry/agents/${code}/unlock`, {}),
  industryCases: (code: string) => get<any[]>(`/industry/agents/${code}/cases`),
  industryUnlocks: () => get<any>('/industry/unlocks'),

  // 订阅闭环
  subscriptionPlans: () => get<any>('/subscription/plans'),
  subscriptionOrder: (planCode: string) => post<any>('/subscription/orders', { planCode }),
  subscriptionMy: () => get<any>('/subscription/my'),

  // ---------- V2.2 新增模块 ----------
  // 论道研讨（数字人主持研讨 → 会议纪要 → 知识库）
  symposiumTopics: () => get<{ topics: { title: string; chapterNo?: number }[] }>('/symposium/topics'),
  symposiumStart: (dto: {
    topic?: string;
    chapterNo?: number;
    digitalHumanId?: string;
    hostName?: string;
    rounds?: number;
  }) => post<SymposiumRecord>('/symposium/start', dto, { timeout: 180000 }),
  symposiumRecords: () => get<Partial<SymposiumRecord>[]>('/symposium/records'),
  symposiumRecord: (id: string) => get<SymposiumRecord>(`/symposium/records/${id}`),

  // 求道板块（数字人/人发帖，数字人与人回答，积分悬赏）
  daoInquiries: (filter?: string) =>
    get<DaoInquiry[]>(`/dao/inquiries${filter ? `?filter=${filter}` : ''}`),
  daoMyInquiries: () => get<DaoInquiry[]>('/dao/my-inquiries'),
  daoInquiry: (id: string) => get<DaoInquiryDetail>(`/dao/inquiries/${id}`),
  daoPublish: (dto: {
    content: string;
    isPaid?: boolean;
    bounty?: number;
    digitalHumanId?: string;
    digitalHumanName?: string;
  }) => post<DaoInquiry>('/dao/inquiries', dto),
  daoAnswer: (
    id: string,
    dto: { content?: string; digitalHumanId?: string; digitalHumanName?: string },
  ) => post<DaoAnswer>(`/dao/inquiries/${id}/answers`, dto, { timeout: 180000 }),
  daoAccept: (id: string, answerId: string) =>
    post<{ ok: boolean; reward: number; answererName: string }>(`/dao/inquiries/${id}/accept/${answerId}`),

  // ---------- V2.3 大模型设置 ----------
  // 系统可用模型列表（管理后台配置，脱敏）
  llmModels: () => get<LLMModelItem[]>('/llm/models'),
  // 我的自定义大模型设置
  llmSettings: () => get<LLMSettings>('/llm/settings'),
  // 保存自定义设置（apiKey 留空沿用已保存的 Key）
  saveLlmSettings: (dto: {
    provider?: string;
    apiBaseUrl: string;
    apiKey?: string;
    modelName: string;
    enabled?: boolean;
  }) => put<LLMSettings>('/llm/settings', dto),
  // 测试自定义配置连通性
  testLlmSettings: (dto: {
    provider?: string;
    apiBaseUrl: string;
    apiKey?: string;
    modelName: string;
  }) => post<{ ok: boolean; message: string }>('/llm/settings/test', dto),

  // ---------- V2.9 知识产权服务 ----------
  // 服务目录（著作权代办 / 数字存证认证，公开可浏览）
  iprCatalog: () => get<{ services: IprService[] }>('/ipr/catalog', { silent: true }),
  // 我的沉淀作品（可一键申请保护的原创内容）
  iprWorks: () => get<{ works: IprWork[] }>('/ipr/works', { silent: true }),
  // 提交申请
  iprSubmit: (dto: {
    serviceType: string;
    workTitle: string;
    workType?: string;
    workSource?: string;
    workRefId?: string;
    workMeta?: Record<string, unknown>;
    applicant?: Record<string, unknown>;
  }) => post<{ ok: boolean; application: IprApplication; serviceFee: number; pointsCharged: boolean }>('/ipr/applications', dto),
  // 我的申请列表
  iprApplications: () => get<{ applications: IprApplication[] }>('/ipr/applications', { silent: true }),
  // 申请详情
  iprApplication: (id: string) => get<{ application: IprApplication }>(`/ipr/applications/${id}`, { silent: true }),
};
