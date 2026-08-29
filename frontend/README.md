# 道枢 · 东方智慧 AI 数字人系统 — 前端（uni-app 三端）

uni-app Vue3 + TypeScript，一套代码编译 **微信小程序 / H5 / App**。

## 目录结构
```
frontend/
├── index.html                     # H5 入口
├── vite.config.ts                 # Vite + uni 插件（dev 端口 5173）
├── src/
│   ├── main.ts / App.vue          # 应用入口（Pinia 挂载）
│   ├── manifest.json              # 三端配置（小程序 appid 待填）
│   ├── pages.json                 # 7 个页面路由
│   ├── env.ts                     # API_BASE / LIVE2D_MODEL_URL 配置
│   ├── api/request.ts             # uni.request 封装（JWT 注入/错误提示）
│   ├── api/index.ts               # 全部接口与类型
│   ├── store/index.ts             # Pinia：token/用户/数字人
│   ├── components/
│   │   ├── AvatarRenderer.vue     # 数字人渲染组件（Live2D→画布自动降级）
│   │   ├── canvas-avatar.ts       # 内置 2D 国风卡通（呼吸/眨眼/口型，三端通用）
│   │   └── live2d-avatar.ts       # Live2D 适配器（H5，pixi-live2d-display）
│   └── pages/
│       ├── index/index.vue        # 首页（功能导航）
│       ├── chat/chat.vue          # 对话（数字人 + 消息流 + 引用展示）
│       ├── adoption/quiz.vue      # 价值观初测（8 维度）
│       ├── adoption/create.vue    # 创建数字人 + 认养契约
│       ├── knowledge/knowledge.vue# 知识库检索 + 成员推荐
│       ├── market/market.vue      # 知识市场（公开洞见 + 知识池）
│       └── mine/mine.vue          # 我的（积分 + 兑换）
└── dist/build/h5                  # H5 构建产物
└── dist/build/mp-weixin           # 小程序构建产物
```

## 运行
```bash
cd frontend
npm install

# H5（浏览器，需后端已启动）
npm run dev:h5        # http://localhost:5173
npm run build:h5      # 产物 dist/build/h5

# 微信小程序（用微信开发者工具导入 dist/build/mp-weixin）
npm run dev:mp-weixin
npm run build:mp-weixin

# App（HBuilderX 云打包或本地基座）
npm run build:app
```

## 对接后端
- 默认对接本机后端 `http://localhost:3081/api/v1`（见 `src/env.ts`）。
- 小程序/App 端需将 `API_BASE` 改为线上 HTTPS 域名，并在微信公众平台配置 request 合法域名。
- 后端已开启 CORS（`Access-Control-Allow-Origin` 回显来源），H5 跨域直连可用。

## 数字人渲染
- **默认**：内置 Canvas 2D 国风卡通数字人 —— 道家发髻造型，呼吸浮动、随机眨眼、说话口型开合，三端通用（`canvas-avatar.ts`）。
- **Live2D（H5 可选）**：在 `src/env.ts` 配置 `LIVE2D_MODEL_URL` 指向 `.model3.json` 模型，并确保页面加载 Cubism Core 运行时（`live2dcubismcore.min.js`）；加载失败自动降级画布数字人。
- 对话中 `speaking` 状态驱动口型与"言说中"指示灯。

## 已完成验证
- ✅ `npm run build:h5` 构建通过
- ✅ `npm run build:mp-weixin` 构建通过（42 个产物文件，可直接导入微信开发者工具）
- ✅ dev:h5 启动可访问（http://localhost:5173）
- ✅ 后端 CORS 放行（Origin: http://localhost:5173 → Access-Control-Allow-Origin 回显）
