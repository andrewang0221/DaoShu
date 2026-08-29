# 道枢 · 东方智慧 AI 数字人系统 — 管理员 PC 控制台

Vue3 + Vite + Element Plus 独立管理后台，对接后端管理接口（`/api/v1/admin/*`）。

## 界面设计（国学 × 科技）
- **色彩体系**：黛青（主色）/ 鎏金（点缀）/ 宣纸（底色），登录页与看板为深黛渐变 + 金光晕。
- **字体**：Noto Serif SC / 楷体 衬线字体，标题加宽字距，营造典籍气韵。
- **布局**：固定侧栏 + 独立滚动主区（flex 布局，杜绝内容与菜单重叠），侧栏激活项鎏金描边 + 光点。
- **点缀**：☯ 徽记、云纹光晕、"观天之道 · 执天之行""道法自然 · 无为而治"等题词。

## 功能
| 页面 | 路径 | 功能 |
|---|---|---|
| 登录 | /login | 管理员登录（开发环境验证码 123456） |
| 数据看板 | /dashboard | 6 项统计 + 5 项 MVP 关键指标 + 批量导入知识库 |
| 知识库审核 | /knowledge | 待审队列：采纳 / 驳回 / 退回修改（可附原因） |
| 用户管理 | /users | 用户列表 + 封禁 / 解封 |
| 积分账务 | /points | 积分流水查询 |
| 审计日志 | /audit | 管理操作留痕 |

## 运行
```bash
cd admin
npm install
npm run dev        # http://localhost:5174（vite proxy → 后端 3081）
npm run build      # 产物 dist/
```

前提：后端已启动（`backend`，演示模式即可），登录手机号任意、验证码 123456。

## 对接后端
- 开发：vite proxy 将 `/api` 转发到 `http://localhost:3081`（见 `vite.config.ts`）。
- 生产：将 `admin/dist` 部署到静态服务器，并把 `/api` 反向代理到后端；或修改 `src/api.ts` 的 baseURL 为完整后端地址。

## 后端管理接口（全部需 admin 角色；演示模式自动放行）
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /admin/dashboard | 数据看板 |
| GET | /admin/users | 用户列表 |
| POST | /admin/users/:id/status | 封禁/解封 |
| GET | /admin/points/transactions | 积分流水 |
| GET | /admin/audit-logs | 审计日志 |
| POST | /admin/knowledge/import | 批量导入 81 章 |
| GET | /admin/knowledge/review-queue | 待审队列 |
| POST | /admin/knowledge/review/:id | 审核（approve/reject/needs_revision） |
