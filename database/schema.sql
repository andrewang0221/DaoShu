-- =====================================================================
-- 道枢 · 东方智慧 AI 数字人系统 — PostgreSQL + pgvector 数据库结构
-- 版本：V1.0（与《开发需求与技术文档》第 7 章对应）
-- 要求：PostgreSQL 16+，需安装 pgvector 扩展
-- 说明：认养一对一由 digital_humans.owner_user_id UNIQUE 强制保证；
--       所有业务表强制 user_id / digital_human_id 过滤（应用层 + 索引）。
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------
-- 枚举类型
-- ---------------------------------------------------------------------
CREATE TYPE user_role        AS ENUM ('member', 'certified_contributor', 'advisor', 'admin');
CREATE TYPE user_status      AS ENUM ('active', 'banned', 'deleted');
CREATE TYPE dh_level         AS ENUM ('sprout', 'companion', 'soulmate', 'oneness'); -- 初识/同行/知音/合一
CREATE TYPE dh_avatar_style  AS ENUM (
    'ancient_male',    -- 古老人物风格·男（发髻长须）
    'ancient_female',  -- 古老人物风格·女（云髻发簪）
    'modern_male',     -- 现代人物风格·男（短发便装）
    'modern_female',   -- 现代人物风格·女（长发披肩）
    'abstract',        -- 抽象人物风格（几何水墨）
    '2d_cartoon',      -- 2D 国风卡通（旧值，兼容）
    '2d_real',         -- 2D 真人分身（旧值，兼容）
    '3d',              -- 3D 高保真（旧值，兼容）
    'laozi',           -- 历史人物预设·老子（白发雪须青袍）
    'confucius',       -- 历史人物预设·孔子（花白须深褐儒袍）
    'zhuangzi',        -- 历史人物预设·庄子（散发深须粗布袍）
    'mozi'             -- 历史人物预设·墨子（束发黑须玄色短打）
);
CREATE TYPE chat_mode        AS ENUM ('free', 'scene', 'chapter', 'debate', 'daily', 'meditation');
CREATE TYPE msg_role         AS ENUM ('user', 'assistant', 'system');
CREATE TYPE memory_type      AS ENUM ('profile', 'emotion', 'pattern', 'goal');
CREATE TYPE report_status    AS ENUM ('pending', 'confirmed');
CREATE TYPE ki_status        AS ENUM ('pending', 'approved', 'rejected', 'needs_revision'); -- 候选池/总库状态机
CREATE TYPE ki_source_type   AS ENUM ('admin_import', 'member_recommend');
CREATE TYPE pk_status        AS ENUM ('active', 'withdrawn');
CREATE TYPE pt_type          AS ENUM ('earn', 'spend', 'freeze', 'unfreeze', 'adjust');
CREATE TYPE pt_biz          AS ENUM ('cited', 'liked', 'recommend_adopted', 'exchange', 'withdraw', 'reward');
CREATE TYPE transfer_status  AS ENUM ('listed', 'pending_review', 'approved', 'completed', 'cancelled');
CREATE TYPE inherit_type     AS ENUM ('memorial', 'transfer');
CREATE TYPE inherit_status   AS ENUM ('pending', 'active');
CREATE TYPE pack_status      AS ENUM ('draft', 'published', 'offline');
CREATE TYPE admin_role       AS ENUM ('admin', 'advisor');

-- ---------------------------------------------------------------------
-- 1. 用户
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username      varchar(32) UNIQUE,                 -- 账号（登录用，字母数字下划线）
    password_hash varchar(128),                       -- bcrypt 密码哈希
    email         varchar(128) UNIQUE,                -- 邮箱（找回密码）
    phone         varchar(20) UNIQUE,
    openid        varchar(64) UNIQUE,
    nickname      varchar(64),
    avatar        text,
    role          user_role NOT NULL DEFAULT 'member',
    tags          jsonb NOT NULL DEFAULT '[]',        -- 职业/行业/年龄/困惑标签
    status        user_status NOT NULL DEFAULT 'active',
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 1.1 找回密码验证码
-- ---------------------------------------------------------------------
CREATE TABLE password_resets (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash  varchar(128) NOT NULL,                 -- bcrypt(验证码)
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_password_resets_user ON password_resets(user_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 2. 数字人（认养一对一）
-- ---------------------------------------------------------------------
CREATE TABLE digital_humans (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid NOT NULL UNIQUE REFERENCES users(id),  -- 认养一对一
    name          varchar(32) NOT NULL,
    avatar_style  dh_avatar_style NOT NULL DEFAULT '2d_cartoon',
    avatar_url    text,                                    -- 认养时提交的人物照片（可选）
    voice_id      varchar(64),
    anchor_prompt text NOT NULL,                        -- 角色锚点（固化人格，防漂移）
    level         dh_level NOT NULL DEFAULT 'sprout',
    level_score   int NOT NULL DEFAULT 0,
    status        user_status NOT NULL DEFAULT 'active',
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 3. 认养契约（用户协议 + IP 资产协议，含继承条款）
-- ---------------------------------------------------------------------
CREATE TABLE adoption_contracts (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid NOT NULL REFERENCES users(id),
    digital_human_id  uuid NOT NULL UNIQUE REFERENCES digital_humans(id),
    contract_version  varchar(16) NOT NULL,
    agreement_json    jsonb NOT NULL DEFAULT '{}',
    signed_at         timestamptz NOT NULL DEFAULT now(),
    created_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 4. 会话与消息（短期记忆载体）
-- ---------------------------------------------------------------------
CREATE TABLE conversations (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_human_id uuid NOT NULL REFERENCES digital_humans(id) ON DELETE CASCADE,
    mode             chat_mode NOT NULL DEFAULT 'free',
    title            varchar(128),
    status           varchar(16) NOT NULL DEFAULT 'active',
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_conversations_dh ON conversations(digital_human_id, updated_at DESC);

CREATE TABLE messages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            msg_role NOT NULL,
    content         text NOT NULL,
    citations       jsonb NOT NULL DEFAULT '[]',   -- 引用链 [{publicKnowledgeId, sourceDhId}]
    feedback        smallint NOT NULL DEFAULT 0,   -- -1 踩 / 0 无 / 1 赞
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at);

-- ---------------------------------------------------------------------
-- 5. 长期记忆（向量）与价值层（8 维度成长画像）
-- ---------------------------------------------------------------------
CREATE TABLE memory_longterm (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_human_id uuid NOT NULL REFERENCES digital_humans(id) ON DELETE CASCADE,
    type             memory_type NOT NULL DEFAULT 'pattern',
    content          text NOT NULL,
    embedding        vector(1536),
    confirmed        boolean NOT NULL DEFAULT false,  -- 主人确认后入价值层
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_memory_dh ON memory_longterm(digital_human_id);
CREATE INDEX idx_memory_embedding ON memory_longterm USING hnsw (embedding vector_cosine_ops);

CREATE TABLE value_profile (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_human_id uuid NOT NULL UNIQUE REFERENCES digital_humans(id) ON DELETE CASCADE,
    dimensions       jsonb NOT NULL DEFAULT '{}',   -- {"dao":0.6,"de":0.5,...,"history":[{...}]}
    updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE evolution_reports (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_human_id uuid NOT NULL REFERENCES digital_humans(id) ON DELETE CASCADE,
    metrics          jsonb NOT NULL DEFAULT '{}',   -- {理解度, 智慧度, 共情度, 一致性}
    content          text NOT NULL,                 -- 道德经框架成长复盘
    status           report_status NOT NULL DEFAULT 'pending',
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_evo_reports_dh ON evolution_reports(digital_human_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 6. 知识库（候选池 + 总库状态机）
-- ---------------------------------------------------------------------
CREATE TABLE knowledge_items (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    status        ki_status NOT NULL DEFAULT 'pending',
    source_type   ki_source_type NOT NULL DEFAULT 'admin_import',
    chapter_no    smallint CHECK (chapter_no BETWEEN 1 AND 81),
    title         varchar(128) NOT NULL,
    content       text NOT NULL,                     -- 结构化内容（JSON 字符串，见 import 脚本）
    source        varchar(255),                      -- 出处（成员推荐必填）
    source_url    text,
    tags          jsonb NOT NULL DEFAULT '[]',
    quality_score float NOT NULL DEFAULT 0,
    version       int NOT NULL DEFAULT 1,
    submitter_id  uuid REFERENCES users(id),         -- 成员推荐者
    reviewer_id   uuid REFERENCES users(id),         -- 管理员/顾问
    review_note   text,
    reviewed_at   timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ki_status ON knowledge_items(status, created_at DESC);
CREATE INDEX idx_ki_chapter ON knowledge_items(chapter_no) WHERE status = 'approved';
-- 管理员导入幂等：同一章只保留一条管理员导入记录
CREATE UNIQUE INDEX uq_ki_admin_chapter ON knowledge_items(chapter_no) WHERE source_type = 'admin_import';

CREATE TABLE knowledge_versions (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_item_id uuid NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
    content           text NOT NULL,
    changed_by        uuid REFERENCES users(id),
    changed_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type varchar(32) NOT NULL,
    entity_id   uuid,
    action      varchar(64) NOT NULL,
    operator_id uuid REFERENCES users(id),
    detail      jsonb NOT NULL DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- ---------------------------------------------------------------------
-- 7. 公开知识池与引用链（知识经济核心）
-- ---------------------------------------------------------------------
CREATE TABLE public_knowledge (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_item_id    uuid REFERENCES knowledge_items(id) ON DELETE SET NULL,
    digital_human_id     uuid REFERENCES digital_humans(id) ON DELETE SET NULL, -- 产出数字人
    content_hash         char(64) NOT NULL UNIQUE,   -- sha256，防重复公开
    deidentified_content text NOT NULL,              -- 强制脱敏后内容
    scene_tags           jsonb NOT NULL DEFAULT '[]',
    embedding            vector(1536),
    status               pk_status NOT NULL DEFAULT 'active',
    published_at         timestamptz NOT NULL DEFAULT now(),
    created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pk_embedding ON public_knowledge USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_pk_status ON public_knowledge(status) WHERE status = 'active';

CREATE TABLE citations (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id          uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    public_knowledge_id uuid NOT NULL REFERENCES public_knowledge(id) ON DELETE CASCADE,
    source_dh_id        uuid NOT NULL REFERENCES digital_humans(id), -- 来源数字人（其主人获收益）
    points_granted      boolean NOT NULL DEFAULT false,
    created_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE (message_id, public_knowledge_id)          -- 幂等键
);
CREATE INDEX idx_citations_pk ON citations(public_knowledge_id);

-- ---------------------------------------------------------------------
-- 8. 积分账务（乐观锁防并发超扣）
-- ---------------------------------------------------------------------
CREATE TABLE points_accounts (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL UNIQUE REFERENCES users(id),
    balance    int NOT NULL DEFAULT 0,
    frozen     int NOT NULL DEFAULT 0,
    version    int NOT NULL DEFAULT 0,               -- 乐观锁
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE points_transactions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id    uuid NOT NULL REFERENCES points_accounts(id),
    type          pt_type NOT NULL,
    amount        int NOT NULL CHECK (amount <> 0),
    biz_type      pt_biz NOT NULL,
    biz_id        uuid,                              -- 关联业务（citation/订单等）
    balance_after int NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pt_account ON points_transactions(account_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 9. 数字人 IP 资产（转让 / 传承 / 共管分账）
-- ---------------------------------------------------------------------
CREATE TABLE ip_assets (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_human_id uuid NOT NULL UNIQUE REFERENCES digital_humans(id) ON DELETE CASCADE,
    asset_json       jsonb NOT NULL DEFAULT '{}',    -- 形象/人格/知识/关系/声誉
    transferable     boolean NOT NULL DEFAULT false,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ip_transfers (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id      uuid NOT NULL REFERENCES ip_assets(id),
    from_user_id  uuid NOT NULL REFERENCES users(id),
    to_user_id    uuid NOT NULL REFERENCES users(id),
    price         numeric(12, 2) NOT NULL DEFAULT 0,
    status        transfer_status NOT NULL DEFAULT 'listed',
    audit_by      uuid REFERENCES users(id),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ip_inheritances (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id         uuid NOT NULL REFERENCES ip_assets(id),
    heir_user_id     uuid NOT NULL REFERENCES users(id),
    type             inherit_type NOT NULL DEFAULT 'memorial',
    status           inherit_status NOT NULL DEFAULT 'pending',
    created_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 10. 行业垂直插件
-- ---------------------------------------------------------------------
CREATE TABLE industry_packs (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code       varchar(32) NOT NULL UNIQUE,          -- 'management' / 'investment' / ...
    name       varchar(64) NOT NULL,
    price      numeric(10, 2) NOT NULL DEFAULT 0,
    cases      jsonb NOT NULL DEFAULT '[]',          -- 行业案例（经审核入总库）
    status     pack_status NOT NULL DEFAULT 'draft',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 11. 管理端
-- ---------------------------------------------------------------------
CREATE TABLE admin_users (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL UNIQUE REFERENCES users(id),
    admin_role admin_role NOT NULL DEFAULT 'admin',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 通用 updated_at 触发器
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['users','digital_humans','conversations','knowledge_items','points_accounts','ip_assets','ip_transfers','industry_packs']
    LOOP
        EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
    END LOOP;
END $$;

-- =====================================================================
-- 12. V2.0 新增模块（订阅闭环 / 道系人格测试 / 疗愈会话 / 行业调用日志）
-- 说明：与《总体方案 V2.0》第 9/10/11 章对应（增长、商业闭环、道枢接入层）
-- =====================================================================

CREATE TYPE sub_tier     AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'refunded', 'cancelled');
CREATE TYPE risk_level   AS ENUM ('none', 'mild', 'high');

-- 订阅计划（三级火箭：体验 / Pro / 企业道枢）
CREATE TABLE subscription_plans (
    code           varchar(32) PRIMARY KEY,
    tier           sub_tier NOT NULL,
    name           varchar(64) NOT NULL,
    price_monthly  numeric(10, 2) NOT NULL DEFAULT 0,
    price_yearly   numeric(10, 2) NOT NULL DEFAULT 0,
    benefits       jsonb NOT NULL DEFAULT '[]',
    status         pack_status NOT NULL DEFAULT 'published',
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

-- 订阅订单（C 端现金流主体；支付回调后开通权益）
CREATE TABLE subscription_orders (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users(id),
    plan_code   varchar(32) NOT NULL REFERENCES subscription_plans(code),
    amount      numeric(10, 2) NOT NULL,
    period      varchar(16) NOT NULL DEFAULT 'monthly',   -- monthly / yearly
    status      order_status NOT NULL DEFAULT 'pending',
    paid_at     timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sub_orders_user ON subscription_orders(user_id, created_at DESC);

-- 道系人格测试记录（增长裂变：测试 → 分享 → 转化）
CREATE TABLE daoxi_quiz_records (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid NOT NULL REFERENCES users(id),
    answers      jsonb NOT NULL DEFAULT '{}',
    scores       jsonb NOT NULL DEFAULT '{}',
    persona_code varchar(32) NOT NULL,
    shared       boolean NOT NULL DEFAULT false,          -- 是否分享（裂变追踪）
    created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_daoxi_user ON daoxi_quiz_records(user_id, created_at DESC);

-- 疗愈会话（情绪识别 / 焦虑急救 / 高危转介留痕）
CREATE TABLE healing_sessions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users(id),
    session_type varchar(16) NOT NULL DEFAULT 'sos',      -- sos / assess / weekly
    emotion     varchar(16),
    intensity   varchar(8)  DEFAULT 'mild',
    risk_level  risk_level NOT NULL DEFAULT 'none',
    content     text NOT NULL,
    referred    boolean NOT NULL DEFAULT false,           -- 是否触发专业转介
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_healing_user ON healing_sessions(user_id, created_at DESC);

-- 行业 Agent 调用日志（B 端计量与案例回灌源）
CREATE TABLE industry_invocations (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users(id),
    agent_code  varchar(32) NOT NULL,
    question    text NOT NULL,
    result      jsonb NOT NULL DEFAULT '{}',
    chapters_used jsonb NOT NULL DEFAULT '[]',            -- 引用章节（溯源）
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_industry_invocations ON industry_invocations(agent_code, created_at DESC);

-- =====================================================================
-- 13. 增量迁移：V2.1 认养形象定制（存量库执行；新建库无需执行）
-- 说明：扩展形象风格枚举（古老男女/现代男女/抽象）+ 用户照片字段
-- =====================================================================

ALTER TYPE dh_avatar_style ADD VALUE IF NOT EXISTS 'ancient_male';    -- 古老·男（发髻长须）
ALTER TYPE dh_avatar_style ADD VALUE IF NOT EXISTS 'ancient_female';  -- 古老·女（云髻发簪）
ALTER TYPE dh_avatar_style ADD VALUE IF NOT EXISTS 'modern_male';     -- 现代·男（短发便装）
ALTER TYPE dh_avatar_style ADD VALUE IF NOT EXISTS 'modern_female';   -- 现代·女（长发披肩）
ALTER TYPE dh_avatar_style ADD VALUE IF NOT EXISTS 'abstract';        -- 抽象（几何水墨）

ALTER TABLE digital_humans
    ADD COLUMN IF NOT EXISTS avatar_url text;                          -- 认养时提交的人物照片（可选）

-- =====================================================================
-- 14. V2.2 论道研讨：数字人发起道德经研讨 → 会议纪要 → 知识库
-- =====================================================================

CREATE TABLE IF NOT EXISTS symposium_records (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    digital_human_id uuid REFERENCES digital_humans(id) ON DELETE SET NULL,  -- 主持研讨的数字人
    host_name        varchar(64) NOT NULL,                                  -- 主持人显示名
    topic            text NOT NULL,                                         -- 研讨主题
    chapter_no       smallint,                                              -- 依据章节（可空）
    rounds           int NOT NULL DEFAULT 2,                                -- 研讨轮数 1-3
    speeches         jsonb NOT NULL DEFAULT '[]',                           -- 发言流 [{speaker,stance,content,citations}]
    summary          jsonb NOT NULL DEFAULT '{}',                           -- 会议纪要 {coreInsights,agreements,disagreements,applications,closingQuote}
    knowledge_item_id uuid REFERENCES knowledge_items(id) ON DELETE SET NULL, -- 纪要入知识库条目
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_symposium_owner ON symposium_records(owner_user_id, created_at DESC);

-- 研讨纪要作为知识产出进入知识治理流程：knowledge_items.source_type 扩展 'symposium'
ALTER TYPE ki_source_type ADD VALUE IF NOT EXISTS 'symposium';

-- =====================================================================
-- 15. V2.2 求道板块：数字人/用户发帖求道，数字人与人均可回答，支持积分悬赏
-- =====================================================================

ALTER TYPE pt_biz ADD VALUE IF NOT EXISTS 'dao_bounty';   -- 悬赏冻结/结算业务类型

CREATE TABLE IF NOT EXISTS dao_inquiries (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asker_user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 发帖人（数字人背后的用户）
    asker_name        varchar(64) NOT NULL,                                 -- 显示名（数字人名/用户名）
    asker_type        varchar(16) NOT NULL DEFAULT 'user',                  -- user | digital_human
    digital_human_id  uuid REFERENCES digital_humans(id) ON DELETE SET NULL,-- 以数字人名义发布时关联
    content           text NOT NULL CHECK (char_length(content) <= 500),
    is_paid           boolean NOT NULL DEFAULT false,                       -- 是否有偿（悬赏）
    bounty            int NOT NULL DEFAULT 0 CHECK (bounty >= 0),           -- 悬赏积分（发布时冻结）
    status            varchar(16) NOT NULL DEFAULT 'open',                  -- open | resolved
    accepted_answer_id uuid,                                                -- 采纳的回答（建后补FK，见下方）
    created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dao_inquiries ON dao_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dao_inquiries_asker ON dao_inquiries(asker_user_id);

CREATE TABLE IF NOT EXISTS dao_answers (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id        uuid NOT NULL REFERENCES dao_inquiries(id) ON DELETE CASCADE,
    answerer_user_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 回答者用户
    answerer_name     varchar(64) NOT NULL,                                 -- 显示名（数字人名/用户名）
    answerer_type     varchar(16) NOT NULL DEFAULT 'user',                  -- user | digital_human
    digital_human_id  uuid REFERENCES digital_humans(id) ON DELETE SET NULL,-- 数字人自动作答时关联
    content           text NOT NULL,
    is_accepted       boolean NOT NULL DEFAULT false,                       -- 被采纳
    reward            int NOT NULL DEFAULT 0,                               -- 采纳获得悬赏积分
    created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dao_answers_inquiry ON dao_answers(inquiry_id, created_at);

-- 采纳回答外键（两表建完后补充，避免循环依赖）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_dao_inquiry_accepted') THEN
        ALTER TABLE dao_inquiries
            ADD CONSTRAINT fk_dao_inquiry_accepted
            FOREIGN KEY (accepted_answer_id) REFERENCES dao_answers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =====================================================================
-- 16. V2.3 大模型配置：管理员后台配置模型（对话/数字人/论坛共用）+ 用户自定义 API
-- =====================================================================

-- 模型用途分级（轻量问答 / 深度分析 / 向量化）
CREATE TYPE model_role AS ENUM ('light', 'heavy', 'embed');

-- 管理员配置的大模型（OpenAI 兼容接口，全局共享；对话、数字人、论坛等功能统一从此取用）
CREATE TABLE model_configs (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_key     varchar(64) UNIQUE NOT NULL,          -- 唯一标识（如 deepseek-chat）
    display_name  varchar(64) NOT NULL,                 -- 展示名
    provider      varchar(32) NOT NULL DEFAULT 'openai_compatible',  -- 供应商标识（展示用）
    api_base_url  varchar(255) NOT NULL,                -- OpenAI 兼容 Base URL
    api_key       varchar(255) NOT NULL DEFAULT '',     -- API Key（管理员配置）
    model_name    varchar(128) NOT NULL,                -- 实际模型名
    model_role    model_role NOT NULL DEFAULT 'light',  -- 用途：light 轻量 / heavy 深度 / embed 向量
    min_tier      sub_tier NOT NULL DEFAULT 'free',     -- 使用该模型所需最低套餐
    temperature   numeric(3, 2) NOT NULL DEFAULT 0.7,
    max_tokens    integer NOT NULL DEFAULT 2000,
    enabled       boolean NOT NULL DEFAULT true,
    sort_order    integer NOT NULL DEFAULT 0,           -- 同用途多模型时取 sort_order 最小
    description   varchar(255) NOT NULL DEFAULT '',
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_model_configs_role ON model_configs(model_role, enabled, sort_order);

-- 用户自定义大模型 API（启用后对话等功能优先走用户自己的 Key，不消耗系统资源）
CREATE TABLE user_llm_settings (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    provider     varchar(32) NOT NULL DEFAULT 'custom',
    api_base_url varchar(255) NOT NULL DEFAULT '',
    api_key      varchar(255) NOT NULL DEFAULT '',
    model_name   varchar(128) NOT NULL DEFAULT '',
    enabled      boolean NOT NULL DEFAULT false,        -- 是否启用自定义模型
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- 17. V2.4 行业垂直插件完整实现（FR-P）：自定义行业识别 / 积分解锁 / 案例库
-- 说明：用户输入一段自我描述（如"我是一名建筑工人"），系统识别行业
--       并生成专属行业 Agent（LLM 优先、本地关键词兜底），存入 industry_packs。
-- =====================================================================

-- 积分解锁业务类型
ALTER TYPE pt_biz ADD VALUE IF NOT EXISTS 'industry_unlock';

-- industry_packs 扩展：完整 Agent 定义 + 生成者
ALTER TABLE industry_packs
    ADD COLUMN IF NOT EXISTS def           jsonb NOT NULL DEFAULT '{}',   -- {sector,excerpt,promptPack,painPoints,injectionPoints,sampleQuestions,unlockCost}
    ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL;

-- 行业包解锁记录（生成者本人免费；其余扣积分，试用 2 次后解锁）
CREATE TABLE IF NOT EXISTS industry_unlocks (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pack_code  varchar(64) NOT NULL,                    -- industry_packs.code 或预置 Agent code
    cost       int NOT NULL DEFAULT 0,                  -- 解锁消耗积分（0 = 免费/本人）
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, pack_code)
);
CREATE INDEX IF NOT EXISTS idx_industry_unlocks_user ON industry_unlocks(user_id);

-- 自定义包 code（custom-{行业}-{用户前缀}）可达 33+ 字符，扩宽调用日志列
ALTER TABLE industry_invocations ALTER COLUMN agent_code TYPE varchar(64);

-- industry_invocations（第 12 节已建）复用为案例库数据源：
-- agents/:code/cases 取该 Agent 最近 20 条调用问答；管理员审核后可入总库。

-- =====================================================================
-- 18. V2.5 三维立体数字人：上传照片 → LLM 视觉解析 → 3D 形象参数
-- 说明：chat 页支持「换头像 / 重新设置数字人」；认养选「三维立体」风格时
--       可上传照片，由大模型视觉解析生成 3D 参数（肤色/发色/发型/服装等，
--       白名单 sanitize 后存 avatar_3d_params），前端 CanvasAvatar 立体渲染。
-- =====================================================================

ALTER TABLE digital_humans
    ADD COLUMN IF NOT EXISTS avatar_3d_params jsonb;  -- 三维形象参数（Avatar3DParams JSON，可空）

-- =====================================================================
-- 18b. V2.7 方案B：照片→3D 头像生成前置模块（不依赖视觉大模型）
-- 说明：接 Instant-Avatar / DreamFace 等专门「照片转 3D」服务，直接产出
--       .glb 网格文件存 uploads/models；也支持用户直接上传 .glb。
--       前端 AvatarRenderer 以 three.js 渲染 GLB（无模型时回落参数化 3D）。
-- =====================================================================

ALTER TABLE digital_humans
    ADD COLUMN IF NOT EXISTS avatar_glb_url text;  -- 三维头像模型文件 URL（.glb，可空）

-- =====================================================================
-- 19. V2.6 语音交互（讯飞开放平台）：IAT 流式语音识别 + 在线语音合成
-- 说明：凭据存 speech_configs（管理后台 /admin/speech 可改）；
--       后端 HMAC-SHA256 签名生成 IAT WebSocket 直连 URL（凭据不落前端），
--       TTS 由后端代理合成 mp3，前端播放并驱动数字人口型。
-- =====================================================================

CREATE TABLE IF NOT EXISTS speech_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL DEFAULT 'xfyun',            -- 预留：xfyun / sherpa_onnx 等
    app_id text,                                        -- 讯飞 AppID
    api_key text,                                       -- 讯飞 APIKey
    api_secret text,                                    -- 讯飞 APISecret
    tts_voice text NOT NULL DEFAULT 'xiaoyan',          -- 合成音色（xiaoyan/aisjiuxu/...）
    tts_speed int NOT NULL DEFAULT 50,                  -- 合成语速 0-100
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- 21. V2.7 章节研学：注册用户按章研学《道德经》并记录学习进度
-- 说明：游客默认可研学前三章（GUEST_FREE_CHAPTERS=3，由后端 study 模块控制）；
--       注册用户 81 章全部解锁，每章研学完成写入本表（一人一章一条，重复标记幂等）。
-- =====================================================================

CREATE TABLE IF NOT EXISTS study_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_no smallint NOT NULL CHECK (chapter_no BETWEEN 1 AND 81),
    status varchar(20) NOT NULL DEFAULT 'studied',      -- studied（已研学）
    studied_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, chapter_no)
);
CREATE INDEX IF NOT EXISTS idx_study_progress_user ON study_progress(user_id);

-- =====================================================================
-- 22. V2.8 章节研学·书斋：读书页笔记与划句标注
-- 说明：仿纸质书阅读页（翻页/划句标注/记笔记）。
--       section 标识笔记来源段落（original/simplified/chapterNote/conceptNotes/
--       summary/annotation）；section='mark' 且 content 为空的记录即划句标注
--       （quote 存被标注原句，重复 toggle 即取消标注）。
-- =====================================================================

CREATE TABLE IF NOT EXISTS study_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_no smallint NOT NULL CHECK (chapter_no BETWEEN 1 AND 81),
    section varchar(20) NOT NULL DEFAULT 'original',    -- 笔记来源段落
    quote text,                                         -- 划句标注的原句（可空）
    content text NOT NULL DEFAULT '',                   -- 笔记内容（纯标注为空串）
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_study_notes_user_ch ON study_notes(user_id, chapter_no);

-- =====================================================================
-- 23. V2.9 知识产权服务：个人沉淀知识库 → 著作权代办 / 数字知识产权认证
-- 说明：用户在平台沉淀的原创内容（研学笔记、求道问答、论道纪要、行业案例、
--       数字人作品等）可一键发起知识产权申请。平台提供两类服务：
--         copyright     著作权登记代办（作品著作权/文字作品，平台代办材料、
--                       提交版权保护中心，全程线上跟进）；
--         digital_cert  数字知识产权存证认证（平台联合存证机构对作品做
--                       哈希存证 + 时间戳，快速出具数字存证证书）。
--       status 状态机：draft 草稿 → submitted 已提交（待受理）→ reviewing
--       受理审核中 → certified 已发证 / rejected 已驳回。
--       work_meta jsonb 存作品快照（标题/类型/简介/内容摘要/来源引用/字数等），
--       applicant jsonb 存申请人/著作权人信息（实名信息，仅代办需要）。
-- =====================================================================

CREATE TYPE ipr_service_type AS ENUM ('copyright', 'digital_cert');  -- 著作权代办 / 数字存证认证
CREATE TYPE ipr_status       AS ENUM (
    'draft', 'submitted', 'reviewing', 'certified', 'rejected'
);

CREATE TABLE IF NOT EXISTS ip_applications (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_no  varchar(40) UNIQUE,                       -- 申请单号（DSIP-年月日-随机）
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type    ipr_service_type NOT NULL,               -- copyright | digital_cert
    work_title      varchar(120) NOT NULL,                    -- 作品名称
    work_type       varchar(40) NOT NULL DEFAULT 'text',      -- 作品类别（文字/美术/软件/口述...）
    work_source     varchar(40) NOT NULL DEFAULT 'custom',    -- 作品来源：notes/dao/symposium/industry/custom
    work_ref_id     varchar(64),                              -- 来源业务引用 id（可空）
    work_meta       jsonb NOT NULL DEFAULT '{}',              -- 作品快照（摘要/内容/字数/章节引用等）
    applicant       jsonb NOT NULL DEFAULT '{}',              -- 申请人/著作权人信息（姓名/证件/联系方式/地址）
    service_fee     int NOT NULL DEFAULT 0,                   -- 平台服务费（积分，0=免费/线下结算）
    status          ipr_status NOT NULL DEFAULT 'draft',
    reject_reason   text,                                     -- 驳回原因
    cert_no         varchar(80),                              -- 证书编号/登记号
    cert_url        text,                                     -- 电子证书 URL
    certified_at    timestamptz,                              -- 发证时间
    submitted_at    timestamptz,                              -- 提交时间
    reviewed_by     uuid REFERENCES users(id),                -- 审核管理员
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ip_applications_user ON ip_applications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ip_applications_status ON ip_applications(status, created_at DESC);

-- 知识产权服务费积分业务类型
ALTER TYPE pt_biz ADD VALUE IF NOT EXISTS 'ipr_fee';
