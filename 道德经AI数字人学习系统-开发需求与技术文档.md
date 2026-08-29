# 道枢 · 东方智慧 AI 数字人系统 — 开发功能需求与技术文档

| 项目 | 内容 |
|---|---|
| 文档版本 | V1.0 |
| 状态 | 开发基线（待评审） |
| 关联文档 | 《道德经AI数字人学习系统-总体方案.md》（V1.0，含 6 项已确认决策；系统现名"道枢 · 东方智慧 AI 数字人系统"） |
| 技术路线 | 方案 A：全栈 TypeScript（uni-app + NestJS + PostgreSQL/pgvector + Redis），预留 Python FastAPI AI 服务与 Go 演进路径 |

---

## 1. 项目概述

### 1.1 背景与目标
以《道德经》81 章为知识源头，构建"**可认养、可进化、可产生知识价值**"的 AI 数字人学习系统。用户（认养人）通过与专属数字人对话学习高维智慧，并将其迁移到行业、择业、个人发展、处世四大场景；数字人产出的知识经脱敏公开后供他人引用，形成"养育 → 产出 → 引用 → 收益回流"的知识共生经济。

### 1.2 项目范围
**包含**：
- 用户与认证、认养体系、六大对话模式、自学习与进化引擎
- 知识库治理（管理员导入 + 成员推荐 + 采纳审核）
- 知识市场（公开/引用溯源/积分）、数字人 IP 资产管理（转让/传承）
- 数字人双形态（2D/3D）渲染、行业垂直插件、管理后台
- MVP 到规模化的完整技术底座

**不包含（V1）**：现金支付与提现（P3 后接入）、区块链资产化、3D 高保真自研引擎（P4 评估）、App 原生双端（用 H5 壳先行）。

### 1.3 角色定义
| 角色 | 说明 | 权限要点 |
|---|---|---|
| 游客 | 未登录浏览 | 只读每日一课试看 |
| 成员（认养人） | 已登录并认养数字人 | 对话、学习、推荐知识、公开知识、积分 |
| 认证荐者 | 连续优质贡献升级 | 更高积分系数、提审优先 |
| 领域顾问 | 国学专家 | 高争议条目终审 |
| 管理员 | 平台运营 | 知识库导入/审核、用户管理、账务、内容安全 |

---

## 2. 术语表

| 术语 | 定义 |
|---|---|
| 数字人 | 用户认养的 AI 导师实体，含形象/人格/记忆/知识积累 |
| 认养 | 用户与数字人建立一对一绑定关系的动作 |
| 认养契约 | 用户协议 + 数字人 IP 资产协议 |
| 角色锚点 | 固化数字人人格与价值观的系统提示词（不可被进化漂移） |
| 总库 | 经管理员采纳的权威知识库（对外检索唯一来源） |
| 候选池 | 成员推荐、待审核的知识条目 |
| 引用链 | 公开知识被他人问答引用的溯源关系（内容指纹 + 来源） |
| 质量分 | 知识条目的质量评分，参与积分收益计算 |
| 价值层 | 主人在道德经 8 维度上的成长画像（知识图谱） |
| 共管分账 | 引用收益进入平台托管账户，按主人 70% / 平台 30% 自动分账 |

---

## 3. 总体架构

### 3.1 逻辑架构

```
┌─────────────────────────────────────────────────────────────┐
│ 客户端层：uni-app 编译三端（微信小程序 / H5 / App 壳）           │
│   ├─ 对话界面（文字 + 语音流式）  ├─ 数字人渲染（Live2D/three.js）│
│   └─ 认养/进化/知识市场/IP 资产 界面                            │
├─────────────────────────────────────────────────────────────┤
│ 接入层：Nginx / API 网关（限流、鉴权、WAF、SSL）                │
├─────────────────────────────────────────────────────────────┤
│ 应用服务层（NestJS，无状态，可水平扩容）                        │
│   ├─ 业务 API 模块：用户/认养/对话/学习/知识/积分/IP/管理         │
│   ├─ WebSocket 网关：实时对话、语音事件、通知                     │
│   └─ BullMQ 消费者：进化批处理、审核、积分结算、脱敏流水          │
├─────────────────────────────────────────────────────────────┤
│ AI 编排层                                                     │
│   ├─ MVP：NestJS + LangChain.js（解析/导师/场景/思辨/进化/知识） │
│   └─ 预留：Python FastAPI 独立 AI 服务（质量分模型、embedding）  │
├─────────────────────────────────────────────────────────────┤
│ 数据层                                                        │
│   PostgreSQL + pgvector（关系 + 向量）   Redis（缓存/会话/队列）  │
│   OSS/COS（音视频资产）                                        │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 技术栈总览（决策依据见总体方案 8.2）

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | uni-app（Vue3 + TS + Vite）、Pinia、uview-plus/NutUI | 一套代码三端 |
| 数字人 2D | Live2D Cubism SDK | 口型/表情参数 |
| 数字人 3D | three.js / 小程序 WebGL | 低端机降级 2D |
| 后端 | NestJS（Node.js + TS）、Socket.IO、BullMQ | 主服务 |
| AI | LangChain.js（MVP）→ FastAPI（预留）、DeepSeek/通义/豆包 | Agent 编排 |
| 语音 | 阿里/腾讯/讯飞/豆包 ASR+TTS 云 API | 流式低延迟 |
| 数据库 | PostgreSQL 16 + pgvector | 关系 + 向量一体 |
| 缓存 | Redis 7 | 会话/短期记忆/限流 |
| 对象存储 | 阿里云 OSS / 腾讯云 COS | 音视频、上传 |
| 部署 | Docker Compose → K8s；Sentry + Prometheus + Grafana | 轻量起步 |

---

## 4. 功能需求（FR）

> 优先级定义：**P0**=MVP 必须（2-4 月）；**P1**=P2 阶段（4-7 月）；**P2**=P3 阶段（7-10 月）；**P3**=P4 阶段（10-12 月）。
> 验收要点为关键判据，详细用例在开发前由产品补充。

### 4.1 用户与认证（FR-U）

| 编号 | 功能 | 说明 | 优先级 | 验收要点 |
|---|---|---|---|---|
| FR-U01 | 注册登录 | 手机号+验证码、微信授权、游客浏览 | P0 | 三端可用；JWT 会话；游客可试看 |
| FR-U02 | 角色体系 | 成员/认证荐者/领域顾问/管理员 | P0 | 权限中间件生效，越权返回 403 |
| FR-U03 | 用户画像 | 职业/行业/年龄/困惑标签，用于个性化 | P0 | 标签影响章节推荐与对话上下文 |
| FR-U04 | 账号安全 | 密码找回、登录设备管理、注销（含数据删除） | P1 | 注销触发记忆与个人数据清除 |

### 4.2 认养系统（FR-A）

| 编号 | 功能 | 说明 | 优先级 | 验收要点 |
|---|---|---|---|---|
| FR-A01 | 价值观初测 | 8 维度（道/德/无为/柔/静/朴/知足/自然）问卷 | P0 | 结果写入价值层；可重测 |
| FR-A02 | 数字人诞生 | 命名、选形象（默认 2D 卡通）、选音色 | P0 | 生成唯一 digital_human_id |
| FR-A03 | 认养契约 | 签署用户协议 + IP 资产协议（含继承条款） | P0 | 电子签署留痕；未签不可用核心功能 |
| FR-A04 | 一对一绑定 | user_id ↔ digital_human_id 唯一映射 | P0 | 数据库唯一约束；防重复认养 |
| FR-A05 | 认养等级 | 初识→同行→知音→合一，按互动深度升级 | P1 | 升级条件含"主人确认的成长反馈"，防刷 |
| FR-A06 | 认养面板 | 理解度、进化雷达图、成长时间线 | P1 | 数据来自进化引擎输出 |

### 4.3 对话互动（FR-C）— 核心

| 编号 | 功能 | 说明 | 优先级 | 验收要点 |
|---|---|---|---|---|
| FR-C01 | 自由问道 | 任意提问，AI 从原文+注疏+场景库作答 | P0 | 引用须带原文出处；流式输出 |
| FR-C02 | 场景推演 | 输入真实困境，多方案推演 | P0 | 输出含"道德经依据 + 行动建议" |
| FR-C03 | 章节研学 | 逐章精读，三视角切换（训诂/哲学/教练） | P0 | 视角切换保持上下文一致 |
| FR-C04 | 思辨对练 | AI 扮演反方辩论（如"无为=躺平？"） | P1 | 辩论有立场、有引用、可终止 |
| FR-C05 | 每日一课 | 每日一章节+箴言+行动任务 | P0 | 定时推送；打卡记录 |
| FR-C06 | 静心导引 | 语音冥想引导（致虚极守静笃） | P1 | 纯音频播放；背景音可选 |
| FR-C07 | 语音对话 | ASR→LLM→TTS→口型驱动全链路 | P1 | 端到端延迟 < 3s；可随时切文字 |
| FR-C08 | 会话管理 | 短期记忆续接、历史回看、删除会话 | P0 | 会话隔离；删除不可恢复 |

### 4.4 自学习与进化引擎（FR-E）

| 编号 | 功能 | 说明 | 优先级 | 验收要点 |
|---|---|---|---|---|
| FR-E01 | 三层记忆 | 短期(Redis)/长期(向量)/价值层(图谱) | P0（长期记忆）/ P1（价值层） | 记忆按 user 隔离；检索可追溯 |
| FR-E02 | 隐式学习 | 自动提取用词风格、情绪、困境模式 | P1 | 提取结果进"待确认"队列 |
| FR-E03 | 主动探问 | "入静复盘"主动提问 | P1 | 频率可配置；可关闭 |
| FR-E04 | 反馈闭环 | 赞/踩、纠正、满意度确认 | P0 | 反馈写入进化权重 |
| FR-E05 | 成长复盘 | 定期用道德经框架生成复盘报告 | P1 | 报告需主人确认后入价值层 |
| FR-E06 | 进化度量 | 理解度/智慧度/共情度/一致性评分 | P1 | 面板展示；分数可解释 |
| FR-E07 | 一致性保障 | 角色锚点固化 + 定期审计 + 漂移回滚 | P1 | 审计定时任务；回滚有记录 |
| FR-E08 | 遗忘权 | 删除任意记忆片段 | P1 | 删除后检索不可命中（合规） |

### 4.5 知识库治理（FR-K）

| 编号 | 功能 | 说明 | 优先级 | 验收要点 |
|---|---|---|---|---|
| FR-K01 | 管理员导入 | 批量导入 JSON/CSV/文档；原文版本/注疏/标签/来源 | P0 | 支持帛书甲乙本；导入校验报错定位 |
| FR-K02 | 权威源管理 | 白名单标注，权威源条目可自动采纳 | P1 | 白名单配置在管理后台 |
| FR-K03 | 成员推荐 | 结构化提交：内容+出处(必填)+章节+理由 | P0 | 无出处不可提交（前端+后端双校验） |
| FR-K04 | 审核状态机 | pending→AI初审→approved/rejected/needs_revision | P0 | 状态迁移唯一；留痕 |
| FR-K05 | AI 初审 | 查重/原文比对/幻觉检测/格式检查 | P0 | 命中即自动驳回并通知 |
| FR-K06 | 领域顾问终审 | 高争议条目指派专家 | P1 | 指派与结论记录 |
| FR-K07 | 版本与回滚 | 知识条目版本化，可回滚 | P1 | 回滚保留审计 |
| FR-K08 | 采纳激励 | 采纳→贡献者积分；被引→贡献者分成 | P0（积分）/ P1（分成） | 与积分模块联动 |

### 4.6 知识市场与积分（FR-M）

| 编号 | 功能 | 说明 | 优先级 | 验收要点 |
|---|---|---|---|---|
| FR-M01 | 公开/私有 | 默认私有；逐条显式公开；强制脱敏 | P0 | 脱敏规则（姓名/公司/手机号）生效 |
| FR-M02 | 知识池 | 公开知识入库，打标（章节/场景/质量分） | P0 | 向量索引仅对总库+公开池 |
| FR-M03 | 引用溯源 | 答案引用生成引用链（内容指纹+来源） | P0 | 展示"引用 @XX 的 N 条洞见"可溯源 |
| FR-M04 | 积分获取 | 被引/点赞/收藏/推荐采纳 → 积分 | P0 | 流水可查；防刷规则生效 |
| FR-M05 | 积分消耗 | 兑换课程/算力/装扮，后期提现 | P1 | 兑换扣减原子性 |
| FR-M06 | 质量分 | f(质量,被引频次,复购率) | P1 | 分数定期重算（异步） |
| FR-M07 | 付费引用 | 高价条目单次付费/订阅，70/30 托管分账 | P2 | 需支付资质；税务代扣 |
| FR-M08 | 积分商城 | 兑换中心 | P1 | 库存与并发扣减正确 |

### 4.7 数字人 IP 资产（FR-I）

| 编号 | 功能 | 说明 | 优先级 | 验收要点 |
|---|---|---|---|---|
| FR-I01 | 资产包 | 形象×人格×知识×关系×声誉 聚合视图 | P1 | 资产页面数据完整 |
| FR-I02 | 共管分账 | 收益入托管账户，70/30 自动分账 | P2 | 分账流水与对账一致 |
| FR-I03 | 转让 | 满 6 个月且等级≥同行可挂牌；隐私脱敏交接 | P2 | 转让后隐私记忆不可见；审核双签 |
| FR-I04 | 传承 | 设置传承人；身故转纪念型或接管 | P2 | 契约条款 + 后台流程 |
| FR-I05 | 交易市场 | 挂牌/出价/成交/手续费 | P3 | 防投机规则（频次限制） |

### 4.8 数字人形态与渲染（FR-R）

| 编号 | 功能 | 说明 | 优先级 | 验收要点 |
|---|---|---|---|---|
| FR-R01 | 统一渲染抽象层 | 形态热切换，Agent 逻辑无关 | P0（2D）/ P1（多形态） | 切换不丢会话 |
| FR-R02 | 2D 国风卡通 | Live2D 口型/眨眼/神态，默认免费 | P0 | 低端机流畅（≥30fps） |
| FR-R03 | 2D 真人分身 | MetaStudio/HeyGen 类，Pro 解锁 | P1 | 按分钟计费可配额 |
| FR-R04 | 3D 高保真 | 云端渲染，增值计费 | P2 | 低端/弱网自动降级 2D |
| FR-R05 | 音色定制 | 多音色选择/克隆（合规授权） | P1 | 音色授权文件留档 |

### 4.9 学习系统（FR-L）

| 编号 | 功能 | 说明 | 优先级 | 验收要点 |
|---|---|---|---|---|
| FR-L01 | 学习路径 | 81 章按主题（道论/德论/处世/管理/养生）组织 | P0 | 路径完成度跟踪 |
| FR-L02 | 认知档案 | 对话思维模式记录与成长报告 | P1 | 报告由进化引擎生成 |
| FR-L03 | 每日打卡 | 学习日历、连续天数 | P0 | 打卡防刷（每日一次） |
| FR-L04 | 感悟社区 | 分享"我的道德经应用案例"，AI 精选点评 | P1 | 内容审核合规 |

### 4.10 行业垂直插件（FR-P）

| 编号 | 功能 | 说明 | 优先级 | 验收要点 |
|---|---|---|---|---|
| FR-P01 | 行业对话包 | 企业管理/投资/销售谈判/产品经理/教师/创业者 | P1 | 包内对话带行业知识注入 |
| FR-P02 | 解锁购买 | 单包订阅/买断 | P1 | 与支付（后期）联动 |
| FR-P03 | 行业案例库 | 每包配 20+ 行业案例 | P1 | 案例经管理员审核入总库 |

### 4.11 管理后台（FR-AD）

| 编号 | 功能 | 说明 | 优先级 | 验收要点 |
|---|---|---|---|---|
| FR-AD01 | 知识库管理 | 导入/审核队列/版本/回滚 | P0 | 审核队列按状态筛选 |
| FR-AD02 | 用户与认养管理 | 用户查询/封禁/认养关系 | P0 | 操作审计 |
| FR-AD03 | 积分账务 | 流水查询/冻结/补偿 | P1 | 对账报表 |
| FR-AD04 | 内容安全 | AI 生成内容审核、敏感词、举报处理 | P0 | 接入内容安全 API |
| FR-AD05 | 数据看板 | DAU/留存/公开率/被引率/兑换率 | P1 | 四项 MVP 指标可视化 |

### 4.12 支付（FR-PAY，后期）

| 编号 | 功能 | 说明 | 优先级 | 验收要点 |
|---|---|---|---|---|
| FR-PAY01 | 支付接入 | 微信/支付宝，订阅与单次 | P2 | 支付回调幂等 |
| FR-PAY02 | 提现 | 积分提现/收益提现，代扣代缴 | P2 | 实名 + 税务合规 |
| FR-PAY03 | 分账 | 托管账户 70/30 自动分账 | P2 | 与对账一致 |

---

## 5. 非功能需求（NFR）

| 类别 | 指标 | 说明 |
|---|---|---|
| 性能-API | 非 LLM 接口 P95 < 300ms | 网关+Redis 缓存兜底 |
| 性能-LLM | 首字响应 < 2s，流式输出 | 模型分级 + RAG 前置 |
| 性能-语音 | 端到端 < 3s（ASR→LLM→TTS） | 流式三通道并行 |
| 性能-渲染 | 2D ≥ 30fps（低端机），弱网自动降级 | Live2D 参数精简 |
| 并发 | 支持 1000 并发在线；目标 10 万日活（演进） | 无状态 + Redis 会话 |
| 可用性 | 99.9%；关键链路容灾 | 多实例 + 数据库备份 |
| 安全 | 传输 TLS；存储加密；敏感字段脱敏 | 记忆/画像加密存储 |
| 数据隔离 | 认养一对一数据硬隔离 | 所有查询强制 user_id 过滤 |
| 合规 | 生成式 AI 内容标识；个人信息保护法；深度合成标识 | 契约先行 + 审核留痕 |
| 可扩展 | 服务无状态、水平扩容；AI 服务可独立拆分 | 模块边界清晰 |

---

## 6. 技术架构与选型（详细）

### 6.1 前端（uni-app 三端）
- **工程**：uni-app（Vue3 + TS + Vite），目录按模块分包；微信小程序分包加载（主包 < 2MB）。
- **状态**：Pinia（用户/认养/会话/积分），本地持久化用 uni.storage。
- **网络**：封装 request（JWT 注入、401 刷新、错误提示）；WebSocket 统一管理（心跳/重连）。
- **数字人渲染**：
  - 2D：Live2D Cubism SDK for Web/小程序，口型参数由后端 TTS 返回的 phoneme/viseme 驱动。
  - 3D：H5 用 three.js（GLTF 模型 + 表情 blendshape）；小程序用 canvas WebGL 组件；设备分级（FPS 检测）降级。
- **性能**：虚拟列表（消息流）、图片懒加载、语音流式播放（AudioContext）、退出页面释放渲染资源。

### 6.2 后端（NestJS）
- **模块划分**（与 FR 对应）：AuthModule、UserModule、AdoptionModule、ChatModule、EvolutionModule、KnowledgeModule、MarketModule、PointsModule、IpAssetModule、AdminModule、IndustryPackModule。
- **WebSocket**：Socket.IO + Redis adapter；事件协议见 8.3。
- **任务队列**：BullMQ（Redis）：evolution-report、audit-ai-review、points-settle、dedup-deidentify、quality-recalc。
- **鉴权**：JWT（Access 2h + Refresh 7d）；RBAC 守卫 + 数据级权限（user_id 强制过滤）。
- **限流**：@nestjs/throttler + Redis 分布式令牌桶；积分/引用类接口独立配额。

### 6.3 数据层
- **PostgreSQL 16 + pgvector**：关系表 + 向量列（embedding 1536 维，HNSW 索引）。
- **Redis 7**：会话、短期记忆（TTL 24h）、缓存（RAG 结果、每日一课）、限流计数、BullMQ。
- **对象存储**：音视频、用户头像、Live2D 模型包、导入文件。

### 6.4 AI 编排层
- MVP：NestJS 内嵌 LangChain.js，Agent 见第 10 章；LLM 统一经 OpenAI 兼容接口（DeepSeek/通义/豆包）。
- 预留：Python FastAPI 服务承载 embedding 流水线、质量分模型、进化批处理（体积大、计算重的离线任务）。
- **成本控制**：模型分级路由（轻问答 deepseek-chat / 深度研学 deepseek-reasoner）；相似问题缓存；RAG 召回前置过滤。

### 6.5 数字人层
- 抽象接口：`render(avatarId, viseme) / speak(text, voice) / gesture(type)`，形态为可插拔适配器。
- 语音：ASR（流式，结果增量返回）、TTS（流式音频 + phoneme 回调），云 API 选型对比见 11.2。

### 6.6 部署与运维
- MVP：Docker Compose（nginx + api + worker + postgres + redis）；云厂商单可用区起步。
- 演进：多实例 + 负载均衡 → K8s（Deployment/HPA/Ingress）；AI 服务独立部署。
- 监控：Sentry（前端/后端错误）、Prometheus + Grafana（QPS/延迟/队列积压/LLM 成本）、日志收集 Loki/ELK。
- CI/CD：GitHub Actions：lint → test → build image → 部署（Compose 阶段 SSH 部署；K8s 阶段 ArgoCD）。

---

## 7. 数据库设计

### 7.1 ER 概览
```
users 1─1 adoption_contracts 1─1 digital_humans
digital_humans 1─N conversations 1─N messages
digital_humans 1─N memory_longterm  1─N evolution_reports
digital_humans 1─1 value_profile
knowledge_items（含候选池状态） 1─N knowledge_versions
knowledge_items 1─N public_knowledge  1─N citations
users 1─N contributions（推荐/采纳记录）
users 1─1 points_accounts  1─N points_transactions
digital_humans 1─1 ip_assets  1─N ip_transfers / ip_inheritances
```

### 7.2 核心表结构（主要字段）

**users**：id(PK)、phone、openid、nickname、avatar、role(enum)、tags(jsonb)、status、created_at
**digital_humans**：id(PK)、owner_user_id(FK, unique)、name、avatar_style(enum: 2d_cartoon/2d_real/3d)、voice_id、anchor_prompt(text, 角色锚点)、level(enum)、level_score、created_at
**adoption_contracts**：id(PK)、user_id(FK)、digital_human_id(FK, unique)、contract_version、signed_at、agreement_json(jsonb)
**conversations**：id(PK)、digital_human_id(FK)、mode(enum: free/scene/chapter/debate/daily/meditation)、title、status、created_at
**messages**：id(PK)、conversation_id(FK)、role(enum: user/assistant/system)、content(text)、citations(jsonb, 引用链)、feedback(smallint, -1/0/1)、created_at
**memory_longterm**：id(PK)、digital_human_id(FK)、type(enum: profile/emotion/pattern/goal)、content(text)、embedding(vector)、confirmed(bool)、created_at；索引：digital_human_id + HNSW(embedding)
**value_profile**：id(PK)、digital_human_id(FK, unique)、dimensions(jsonb：8 维度分数+历史)、updated_at
**evolution_reports**：id(PK)、digital_human_id(FK)、metrics(jsonb：理解度/智慧度/共情度/一致性)、content(text)、status(enum: pending/confirmed)、created_at
**knowledge_items**：id(PK)、status(enum: pending/approved/rejected/needs_revision)、source_type(enum: admin_import/member_recommend)、chapter_no(smallint)、content(text)、source(text)、source_url、tags(jsonb)、quality_score(float)、version(int)、submitter_id(FK)、reviewer_id(FK)、review_note、created_at
**knowledge_versions**：id(PK)、knowledge_item_id(FK)、content(text)、changed_by、changed_at
**audit_logs**：id(PK)、entity_type、entity_id、action、operator_id、detail(jsonb)、created_at
**public_knowledge**：id(PK)、knowledge_item_id(FK)、digital_human_id(FK，产出数字人)、content_hash(unique)、deidentified_content(text)、scene_tags(jsonb)、embedding(vector)、status、published_at
**citations**：id(PK)、message_id(FK)、public_knowledge_id(FK)、source_dh_id(FK)、points_granted(bool)、created_at
**points_accounts**：id(PK)、user_id(FK, unique)、balance(int)、frozen(int)、version(int, 乐观锁)
**points_transactions**：id(PK)、account_id(FK)、type(enum: earn/spend/freeze/unfreeze/adjust)、amount、biz_type(enum: cited/liked/recommend_adopted/exchange/withdraw)、biz_id、balance_after、created_at
**ip_assets**：id(PK)、digital_human_id(FK, unique)、asset_json(jsonb：形象/人格/知识/关系/声誉)、transferable(bool)、created_at
**ip_transfers**：id(PK)、asset_id(FK)、from_user_id、to_user_id、price、status(enum)、audit_by、created_at
**ip_inheritances**：id(PK)、asset_id(FK)、heir_user_id、type(enum: memorial/transfer)、status、created_at
**industry_packs**：id(PK)、code(unique)、name、price、cases(jsonb)、status、created_at
**admin_users**：id(PK)、user_id(FK, unique)、admin_role(enum)、created_at

### 7.3 关键约束与索引
- digital_humans.owner_user_id 唯一 → 认养一对一。
- 所有业务表带 digital_human_id / user_id 外键，查询强制过滤。
- points_transactions 用乐观锁（version）防并发超扣。
- public_knowledge.content_hash 唯一 → 防重复公开。

---

## 8. API 设计

### 8.1 通用规范
- 前缀 `/api/v1`；REST 风格；JSON；错误码格式 `{ code, message, data }`。
- 鉴权：`Authorization: Bearer <JWT>`；RBAC 角色守卫。
- 错误码段：401 认证 / 403 权限 / 404 不存在 / 409 冲突 / 422 校验 / 429 限流 / 5xx 服务。
- 分页：`?page=1&pageSize=20` 返回 `{ list, total, page, pageSize }`。

### 8.2 模块接口清单

**Auth**
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /auth/sms-code | 发送验证码（限流 1/60s） |
| POST | /auth/login | 登录（手机号/微信），返回 Access+Refresh |
| POST | /auth/refresh | 刷新令牌 |
| POST | /auth/logout | 登出 |
| DELETE | /auth/account | 注销账号（触发数据清除任务） |

**Adoption**
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /adoption/quiz | 获取价值观初测问卷 |
| POST | /adoption/quiz | 提交初测结果 |
| POST | /adoption/digital-human | 创建数字人（命名/形象/音色） |
| POST | /adoption/contract | 签署认养契约 |
| GET | /adoption/panel | 认养面板（等级/理解度/雷达） |

**Chat**
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /chat/conversations | 会话列表 |
| POST | /chat/conversations | 新建会话（mode 指定） |
| GET | /chat/conversations/:id/messages | 历史消息 |
| POST | /chat/conversations/:id/messages | 发送消息（文字，SSE/WS 流式返回） |
| DELETE | /chat/conversations/:id | 删除会话 |
| WS | /ws/chat | 语音对话（音频流 + 事件） |

**Evolution**
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /evolution/memory | 长期记忆列表（可删除） |
| DELETE | /evolution/memory/:id | 删除记忆片段（遗忘权） |
| GET | /evolution/reports | 成长复盘列表 |
| POST | /evolution/reports/:id/confirm | 确认复盘入价值层 |
| GET | /evolution/metrics | 进化度量数据 |

**Knowledge**
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /knowledge/items | 总库检索（带章节/标签过滤） |
| POST | /knowledge/recommend | 成员推荐提交 |
| GET | /knowledge/recommendations/me | 我的推荐与状态 |
| POST | /admin/knowledge/import | 管理员批量导入（JSON/CSV） |
| GET | /admin/knowledge/review-queue | 审核队列 |
| POST | /admin/knowledge/:id/review | 审核（approve/reject/revision） |
| GET | /admin/knowledge/:id/versions | 版本历史 |
| POST | /admin/knowledge/:id/rollback | 回滚到指定版本 |

**Market**
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /market/publish | 公开知识（含脱敏确认） |
| GET | /market/items | 公开知识池列表 |
| GET | /market/items/:id/citations | 引用明细 |
| GET | /market/points/me | 我的积分与流水 |
| GET | /market/shop | 积分商城 |
| POST | /market/shop/exchange | 积分兑换 |

**IpAsset**
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /ip/asset | 资产包视图 |
| GET | /ip/asset/revenue | 收益流水（托管分账） |
| POST | /ip/transfer/list | 挂牌转让 |
| POST | /ip/transfer/:id/accept | 接受转让（审核后） |
| POST | /ip/inheritance | 设置传承人 |

**Admin**
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /admin/dashboard | 数据看板（四项 MVP 指标） |
| GET | /admin/users | 用户管理 |
| POST | /admin/users/:id/status | 封禁/解封 |
| GET | /admin/points | 积分账务查询 |
| POST | /admin/points/adjust | 积分调整（留痕） |
| GET | /admin/audit-logs | 审计日志 |

### 8.3 WebSocket 协议（/ws/chat）
```
client → server:
  { type: 'audio_start', conversationId }
  { type: 'audio_chunk', data: <base64 音频> }
  { type: 'audio_end' }
  { type: 'cancel' }
server → client:
  { type: 'asr_partial', text }        # 识别中间结果
  { type: 'thinking' }                  # LLM 开始
  { type: 'text_delta', delta }         # 流式文字
  { type: 'audio_delta', data, viseme } # 流式音频 + 口型参数
  { type: 'citations', list }           # 引用链
  { type: 'done', messageId }
  { type: 'error', code, message }
```
心跳：`ping/pong` 每 30s；断线重连指数退避；语音结束 2s 内必须回 `done`。

---

## 9. 关键流程设计

### 9.1 对话请求全链路（自由问道）
```
用户输入 → 校验/限流 → 组装上下文（短期记忆+命中长期记忆 TopK）
→ RAG 检索（总库：原文/注疏/场景；公开知识池：命中引用候选）
→ 模型分级路由 → 人设锚点 + Agent 指令 → LLM 流式生成
→ 并行：文字流推送 / TTS 合成 / 引用链提取
→ 会话持久化 → 异步：隐式学习提取、反馈入队
→ 引用命中公开知识 → 异步积分结算（见 9.3）
```

### 9.2 知识审核状态机
```
pending ──AI初审──► 自动驳回 rejected（查重命中/无出处）
     │
     └──► 管理员终审 ──► approved（入总库，记贡献者）
                 ├──► rejected
                 └──► needs_revision ──提交者修改──► pending
批准后：写入 knowledge_items(approved) → 打 embedding → 入向量索引 → 通知贡献者 + 积分入账
```

### 9.3 引用溯源与积分结算（异步，幂等）
```
消息落库时提取 citations（内容指纹比对 public_knowledge.content_hash）
→ BullMQ 任务 points-settle（按 citation 去重，幂等键 message_id+pk_id）
→ 更新：来源贡献者积分 + 产出数字人主人积分（若不同）
→ 风控：单条 citation 积分上限；异常频次告警
```

### 9.4 进化批处理（每日/每周）
```
定时触发 → 汇总近 N 日对话/反馈 → 计算四维指标（LLM 评分 + 规则打分）
→ 生成成长复盘（LLM，道德经框架）→ 推送主人确认
→ 确认后写 value_profile → 等级判定（防刷校验）→ 通知面板更新
```

### 9.5 IP 转让/传承
```
转让：主人挂牌（校验满6月+等级）→ 平台审核 → 隐私记忆脱敏快照（移交包=公开知识+通用人格+声誉）
     → 受让方确认 → 过户（digital_humans.owner_user_id 更新）→ 原主人隐私记忆归档销毁
传承：主人设置传承人（契约条款）→ 身故证明核验（后台人工）→ 纪念型（冻结进化，保留公开）或接管（传承人成为新主人）
```

---

## 10. AI 编排与提示词设计

### 10.1 Agent 清单
| Agent | 职责 | 触发 | 输出 |
|---|---|---|---|
| 解析 Agent | 原文/注疏解读 + RAG 检索 | 任何提问先执行 | 检索证据 + 释义 |
| 导师 Agent | 苏格拉底式对话主控，人设锚点 | 自由问道/章节研学 | 对话流 |
| 场景 Agent | 行业/择业/处世推演 | 场景推演模式 | 多方案 + 行动建议 |
| 思辨 Agent | 反方辩论 | 思辨对练模式 | 有立场辩论 |
| 进化 Agent | 记忆提取/复盘/一致性审计 | 异步批处理 | 结构化记忆/报告 |
| 知识 Agent | 脱敏/质量分/内容安全 | 公开与入库 | 校验结果 |

### 10.2 人设锚点模板（system prompt 骨架）
```
你是「{数字人名}」，一位以《道德经》为思想根基的智慧导师，被{主人名}认养。
【不可动摇的锚点】1. 以原文为据，引用必带章节，不编造；2. 苏格拉底式引导，多问少答；
3. 价值观：守正、不谄媚、不强求；4. 回答贴合主人的行业与人生阶段。
【可进化区域】知识广度、共情表达、场景迁移能力。
【边界】不提供医疗/法律/投资承诺；涉及敏感话题引导至专业机构。
```

### 10.3 RAG 检索策略
1. 检索域：总库（原文+注疏+行业案例）→ 公开知识池（引用候选）→ 长期记忆（个性化）。
2. 召回：pgvector 余弦相似度 TopK（总库 8 + 公开池 5 + 记忆 5），HNSW 索引。
3. 重排：LLM 相关性打分（轻量模型）；引用必须带 chapter_no 出处，输出前校验。
4. 防幻觉：引用文本与 knowledge_items.content 逐字比对，不一致剔除。

### 10.4 模型分级与成本控制
| 场景 | 模型档 | 说明 |
|---|---|---|
| 轻问答/意图识别/打分 | 小模型（deepseek-chat） | 低延迟低成本 |
| 章节研学/深度推演 | 大模型（deepseek-reasoner） | 高推理质量 |
| TTS/ASR | 云 API 按量 | 缓存常见片段 |
- 相似问题缓存（Redis，LLM 答案 hash 命中 24h）；每日每用户免费额度 + 高级模式计积分。

---

## 11. 数字人集成设计

### 11.1 渲染抽象层接口
```
interface AvatarRenderer {
  init(avatarConfig): Promise<void>
  render(viseme: VisemeFrame): void      // 口型/表情参数
  gesture(type: 'nod'|'listen'|'think'): void
  setEmotion(emotion: 'calm'|'warm'|'serious'): void
  dispose(): void
}
实现：Live2DRenderer / VideoAvatarRenderer(2D真人) / ThreeDRenderer(3D)
```

### 11.2 ASR/TTS 选型对比
| 供应商 | ASR | TTS | 特色 | 备注 |
|---|---|---|---|---|
| 阿里云 | 流式 | 流式+phoneme | 中文好、生态全 | 默认推荐 |
| 腾讯云 | 流式 | 流式 | 微信生态整合 | 小程序侧优 |
| 讯飞 | 流式 | 情感合成 | 语音老牌、方言 | 冥想音色佳 |
| 豆包/火山 | 流式 | 多音色 | 数字人配套 | 2D 分身配套 |
- 抽象 VoiceProvider 接口，按指标（延迟/成本/音色质量）可切换；TTS 返回 viseme 时间轴供口型驱动。

### 11.3 降级与容错
- 设备分级（FPS/内存）：低端 → 仅 2D 静态 + 文字；中端 → 2D 动效；高端 → 3D。
- 语音失败降级文字；ASR 超时降级手动输入；LLM 超时重试一次后返回兜底文案（"此问题超出当前学识，建议从第 X 章重读"）。
- 云 API 配额熔断：月度预算告警，超限自动切备用供应商。

---

## 12. 部署与运维

### 12.1 MVP 部署拓扑（Docker Compose）
```
nginx:443 ──► api(2实例) ──► postgres+pgvector(主)
                │  └──► redis
                ├─► worker(BullMQ 消费者)
                └─► ws 网关（api 内嵌）
对象存储：OSS/COS（外部）
```

### 12.2 环境变量清单（示例）
```
DATABASE_URL / REDIS_URL / JWT_SECRET / JWT_REFRESH_SECRET
LLM_API_KEY / LLM_BASE_URL / LLM_MODEL_LIGHT / LLM_MODEL_HEAVY
ASR_PROVIDER / ASR_* / TTS_PROVIDER / TTS_*
OSS_ENDPOINT / OSS_ACCESS_KEY / OSS_SECRET
CONTENT_SAFETY_API_KEY / SENTRY_DSN / ADMIN_INIT_PHONE
POINTS_RULES_JSON（积分参数） / ADOPTION_MIN_DAYS_FOR_TRANSFER
```

### 12.3 CI/CD 与监控
- 流水线：push → lint+test → build image → tag → 部署。
- 告警：接口错误率 > 1%、P95 > 500ms、队列积压 > 1000、LLM 日成本超预算。
- 备份：PG 每日全量 + WAL；OSS 版本控制。

---

## 13. 开发计划（WBS）

### P0 内容工程（第 1-2 月）
| 任务 | 产出 |
|---|---|
| 81 章结构化知识库 JSON 模板 | schema + 首批 20 章数据 |
| 注疏与版本对照数据 | 帛书甲乙本/王弼/河上公 |
| 知识图谱初版（概念-章节-场景） | 节点与关系数据 |
| 场景映射矩阵 + 3 个行业包案例 | 内容文档 |

### P1 MVP（第 2-4 月）
| 任务 | 产出 |
|---|---|
| 工程骨架（uni-app + NestJS + PG + Redis + Docker Compose） | 可运行环境 |
| Auth + 认养（问卷/诞生/契约/绑定） | FR-U、FR-A |
| 对话（自由问道/章节研学/每日一课，文字流式 + RAG） | FR-C01/03/05/08 |
| 知识库治理（管理员导入 + 成员推荐 + 审核状态机 + AI 初审） | FR-K 核心 |
| 知识市场最小闭环（公开/脱敏/引用溯源/积分） | FR-M01/02/03/04 |
| 长期记忆（向量化 + 检索 + 反馈闭环） | FR-E01/04 |
| 管理后台（知识审核 + 内容安全 + 用户） | FR-AD01/02/04 |
| 100 人种子内测 + 四项指标埋点 | 数据看板初版 |

### P2 互动升级（第 4-7 月）
- 语音对话全链路（ASR/TTS/口型）+ 2D 真人分身 + 3D 试点
- 进化引擎（探问/复盘/度量/一致性审计/遗忘权）+ 进化面板
- 思辨对练、静心导引、认知档案、价值层图谱
- 微信小程序上线、积分商城、行业包 x3
- 推荐采纳分成、领域顾问终审

### P3 商业化（第 7-10 月）
- 支付接入 + 付费引用 + 70/30 托管分账
- IP 资产包视图 + 转让流程（含隐私脱敏交接）
- 社区、企业版、数据看板完整版

### P4 规模化（第 10-12 月）
- 3D 全量、App 壳、IP 交易市场与传承功能
- 数字人 IP 内容号矩阵、K8s 迁移

---

## 14. 测试策略

| 类型 | 范围 | 要点 |
|---|---|---|
| 单元测试 | 服务层/工具 | 积分账务并发、审核状态机、脱敏规则 |
| 集成测试 | API + DB | 认养唯一约束、引用幂等结算、限流 |
| E2E | 三端核心链路 | 认养→对话→公开→被引→积分 |
| AI 评测 | 对话质量 | 道德经引用准确率（原文比对）、幻觉率 < 2%、人设一致性 |
| 性能压测 | API/WS/语音 | 1000 并发；首字 < 2s；语音 < 3s |
| 安全测试 | 越权/注入/刷单 | user_id 越权、积分并发刷、推荐刷采纳 |
| 合规测试 | 内容安全 | 敏感词拦截、AI 标识、脱敏漏检 |

---

## 15. 风险与合规

| 风险 | 等级 | 应对 |
|---|---|---|
| AI 编造原文 | 高 | RAG 逐字校验 + 知识池双关 + AI 评测门禁 |
| 隐私泄露 | 高 | 加密存储、默认私有、强制脱敏、遗忘权 |
| 人格漂移/越狱 | 中 | 角色锚点 + 一致性审计 + 回滚 |
| 积分刷单/薅羊毛 | 中 | 令牌桶限流 + 收益公式 + 风控告警 |
| 虚拟财产法律空白 | 中 | 契约先行、规则透明、限制投机 |
| 拟人化伦理争议 | 中 | 明示 AI 本质、契约写清边界 |
| 成本失控（LLM/语音） | 高 | 模型分级 + 缓存 + 预算熔断 |
| 政策合规（深度合成标识） | 中 | 内容标识 + 审核留痕 |

---

## 16. 附录

### 16.1 决策记录（来自总体方案）
| # | 决策点 | 选择 |
|---|---|---|
| 1 | 认养关系 | 严格一对一 |
| 2 | 变现路径 | 先积分闭环，后现金分成 |
| 3 | 隐私默认值 | 默认私有，显式公开 |
| 4 | 收益归属 | 数字人 IP 与平台共管（70/30） |
| 5 | 数字人形态 | 2D 与 3D 双形态并行，用户自选 |
| 6 | 知识库治理 | 管理员导入 + 成员推荐 + 管理员采纳 |
| 7 | 技术路线 | 方案 A 全栈 TS，预留 Go/Python 演进 |

### 16.2 待确认事项
1. 积分经济参数（采纳奖励分值、被引分成比例、兑换比率）。
2. 认养契约（用户协议 + 资产协议）法务初稿。
3. 数字人形象美术方向（2D 国风 / 3D 写实）与首批形象资产。
4. LLM/语音云供应商合同与预算额度。
5. 域名、ICP 备案、内容安全服务开通。

### 16.3 参考技术来源
- [开源中文实时语音数字人方案（icemaple77/digital-human）](https://github.com/icemaple77/digital-human)
- [华为云 MetaStudio 分身数字人](https://www.huaweicloud.com/intl/zh-cn/product/metastudio.html)
- [基于大语言模型的对外汉语教学数字人系统（知网）](https://wap.cnki.net/touch/web/Journal/Article/DMWJ202510006.html)
- [AI 数字人全流程制作指南（百度开发者）](https://developer.baidu.com/article/detail.html?id=6052775)

---

*本文档为开发基线，模块级 PRD 与数据库 DDL 在进入对应阶段前细化。*
