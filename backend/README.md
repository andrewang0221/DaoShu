# 道枢 · 东方智慧 AI 数字人系统 — 后端

NestJS + PostgreSQL/pgvector 后端（对应《开发需求与技术文档》技术路线方案 A）。

## 目录结构
```
backend/
├── src/
│   ├── main.ts                     # 启动入口（全局前缀 /api/v1）
│   ├── app.module.ts               # 模块装配（全局 AuthGuard/RolesGuard）
│   ├── common.ts                   # 鉴权守卫 / 角色守卫 / 当前用户装饰器 / 演示模式
│   ├── database/                   # PostgreSQL 连接池（pg）
│   ├── auth/                       # 短信验证码 + 登录（JWT）
│   ├── users/                      # 用户信息
│   ├── adoption/                   # 认养：价值观初测 / 创建数字人 / 契约 / 面板
│   ├── chat/                       # 对话：知识检索(RAG) / 问答 / WebSocket 网关
│   ├── knowledge/                  # 知识库治理：成员推荐 / 管理员审核 / 批量导入
│   ├── points/                     # 积分账务（乐观锁防超扣）
│   └── market/                     # 知识市场：公开 / 知识池 / 引用溯源
├── .env.example                    # 环境变量模板
└── package.json
```

## 快速开始（演示模式，无需数据库）
```bash
cd backend
cp .env.example .env          # 默认 DEMO_MODE=true
npm install
npm run start:dev             # 或 npm run build && npm run start:prod
# 服务: http://localhost:3081/api/v1（3080 已被 Web GUI 占用）
```

启动后先访问健康检查确认服务状态：
- `GET /api/v1/health` → `{"status":"ok","mode":"demo","kbChapters":81,...}`
- `GET /api/v1` → 服务信息与常用接口速览
- 其余业务路径返回 404 属正常（仅注册了具体路由）。

演示模式下：
- 认证自动放行（无需真实令牌）；
- 聊天/知识检索使用本地 JSON 知识库（`../knowledge-base/taoteching-wsy-2026.json`）；
- 会话、积分、知识池为内存实现，重启即清空。

## 完整模式（接入 PostgreSQL）
1. 安装 PostgreSQL 16 + pgvector 扩展，执行建表：
   ```bash
   psql -U postgres -c "CREATE DATABASE taoteching;"
   psql -U postgres -d taoteching -f ../database/schema.sql
   ```
2. 导入 81 章知识库：
   ```bash
   cd backend && DATABASE_URL=postgres://postgres:postgres@localhost:5432/taoteching \
     node ../tools/import-knowledge.mjs
   ```
3. 配置 `.env`：`DEMO_MODE=false`、`DATABASE_URL=...`、`JWT_SECRET=...`
4. `npm run start:prod`

## 大模型接入（可选）
`.env` 配置 `LLM_API_KEY`（OpenAI 兼容接口，如 DeepSeek）后，问答走大模型深度解读；
未配置时自动降级为"本地知识检索模式"（返回原文/小结/注解摘录）。

## 常用接口（前缀 /api/v1）
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /auth/sms-code | 发送验证码（dev 固定 123456） |
| POST | /auth/login | 登录，返回 JWT |
| GET | /users/me | 当前用户 |
| GET | /adoption/quiz | 价值观初测问卷（8 维度） |
| POST | /adoption/quiz | 提交初测，写入价值层 |
| POST | /adoption/digital-human | 创建数字人（认养） |
| POST | /adoption/contract/:dhId | 签署认养契约 |
| GET | /adoption/panel/:dhId? | 认养面板 |
| POST | /chat/conversations | 新建会话 |
| POST | /chat/conversations/:id/messages | 提问（知识检索+可选LLM） |
| GET | /chat/conversations/:id/messages | 历史消息 |
| POST | /knowledge/recommend | 成员推荐知识（出处必填） |
| GET | /knowledge/items?keyword= | 检索总库 |
| POST | /admin/knowledge/import | 管理员批量导入知识库 |
| GET | /admin/knowledge/review-queue | 待审队列 |
| POST | /admin/knowledge/review/:id | 审核（approve/reject/needs_revision） |
| GET | /points/me | 积分与商城 |
| POST | /points/exchange | 积分兑换 |
| POST | /market/publish | 公开知识（脱敏后） |
| GET | /market/items | 知识池列表 |
| GET | /market/items/:id/citations | 引用溯源 |

WebSocket：`ws://localhost:3080`，事件见 `src/chat/chat.gateway.ts`（chat → thinking/answer/error）。
