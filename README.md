# 道枢 · 东方智慧 AI 数字人系统 — 根目录说明

## 目录结构
```
testpro/
├── 道德经AI数字人学习系统-总体方案.md        # 总体方案（含 7 项决策）
├── 道德经AI数字人学习系统-开发需求与技术文档.md # 开发需求与技术文档（16 章）
├── 汪胜岩道德经注解2026.md                   # 原始注解文本（内容源）
├── knowledge-base/                          # P0 结构化知识库
│   ├── taoteching-wsy-2026.json             # 81 章结构化 JSON（已生成）
│   └── README.md                            # JSON 结构说明
├── tools/
│   ├── parse-taoteching.mjs                 # MD → JSON 解析脚本（已跑通）
│   ├── import-knowledge.mjs                 # JSON → PostgreSQL 导入脚本
│   └── smoke-test.mjs                       # 后端冒烟测试
├── database/
│   └── schema.sql                           # PostgreSQL+pgvector 建表脚本
├── backend/                                 # NestJS 后端（见 backend/README.md）
└── admin/                                   # 管理员 PC 控制台（Vue3+Element Plus，见 admin/README.md）
```

## 当前进度（MVP 第一阶段 + 前端 MVP）
- ✅ P0 内容工程：81 章结构化知识库（原文/简体/注音/逐句注解/小结，按语 100% 保留）
- ✅ 数据库 DDL：users / digital_humans / 认养契约 / 会话消息 / 记忆向量 / 知识状态机 / 公开池引用链 / 积分账务 / IP 资产
- ✅ 后端骨架 + 核心模块：认证 / 认养 / 对话(RAG) / 知识治理 / 积分 / 知识市场（演示模式可运行）
- ✅ 后端测试：build 0 错误 + 冒烟测试 23/23 通过
- ✅ 前端 uni-app（三端）：7 页面（首页/对话+数字人/认养/知识库/市场/我的）+ API 层 + Pinia + 数字人渲染组件（Canvas 国风卡通三端通用 + Live2D H5 适配降级）
- ✅ 前端验证：H5 构建通过、小程序构建通过、dev:h5 可访问、后端 CORS 放行
- ✅ 管理员 PC 控制台（admin/）：登录/数据看板/知识库审核（采纳/驳回/退回+批量导入）/用户管理/积分账务/审计日志 + 后端 AdminModule 接口
- ✅ 管理台验证：后端 build+冒烟 23/23、admin build 通过、dev 可访问、proxy 联调通过
- ⏳ 数字人语音（ASR/TTS + 口型驱动）— 接入阶段
- ⏳ 进化引擎（记忆向量化、成长复盘）— 接入阶段

## 快速体验（演示模式）
```bash
# 1. 启动后端（演示模式，无需数据库）
cd backend && npm install && npm run start:dev   # http://localhost:3081/api/v1

# 2. 启动前端 H5
cd frontend && npm install && npm run dev:h5      # http://localhost:5173
# 小程序：微信开发者工具导入 frontend/dist/build/mp-weixin
```

## 技术栈（决策 #7）
uni-app(Vue3+TS) · NestJS · PostgreSQL16+pgvector · Redis · BullMQ · LangChain.js(预留 Python FastAPI AI 服务) · Live2D(H5)
