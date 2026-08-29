# 道枢 · 东方智慧 AI 数字人系统前端部署指南

## 项目概述

本项目是道枢 · 东方智慧 AI 数字人系统的前端部分，采用uni-app框架（Vue3 + TypeScript + Vite）开发，支持三端：微信小程序、H5、App。

## 技术栈

- **前端框架**: uni-app (Vue3 + TypeScript + Vite)
- **状态管理**: Pinia
- **UI组件**: 自定义国学风格+科技风设计
- **构建工具**: Vite
- **部署方式**: Docker + Nginx

## 项目结构

```
frontend/
├── src/                    # 源代码
│   ├── pages/              # 页面组件
│   │   ├── index/          # 首页
│   │   ├── chat/           # 对话页面
│   │   ├── knowledge/      # 知识库
│   │   ├── market/         # 知识市场
│   │   ├── mine/           # 个人中心
│   │   └── admin/          # 管理后台
│   ├── components/         # 公共组件
│   ├── styles/             # 样式文件
│   ├── api/                # API接口
│   ├── store/              # 状态管理
│   └── utils/              # 工具函数
├── public/                 # 静态资源
├── dist/                   # 构建输出
├── docker-compose.yml      # Docker编排
├── Dockerfile              # Docker镜像
├── nginx.conf              # Nginx配置
└── deploy.sh               # 部署脚本
```

## 本地开发

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
cd frontend
npm install
```

### 启动开发服务器

```bash
# 启动H5开发服务器
npm run dev:h5

# 启动微信小程序开发服务器
npm run dev:mp-weixin

# 启动App开发服务器
npm run dev:app
```

开发服务器启动后，访问 http://localhost:5173/ 查看H5版本。

### 构建生产版本

```bash
# 构建H5版本
npm run build:h5

# 构建微信小程序版本
npm run build:mp-weixin

# 构建App版本
npm run build:app
```

## 部署方式

### 方式一：手动部署

1. **构建项目**
   ```bash
   npm run build:h5
   ```

2. **上传构建文件**
   将 `dist/build/h5/` 目录上传到服务器的 `/var/www/taoteching/` 目录。

3. **配置Nginx**
   创建Nginx配置文件 `/etc/nginx/conf.d/taoteching.conf`：

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/taoteching;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

4. **重启Nginx**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 方式二：Docker部署

1. **使用Docker Compose**
   ```bash
   # 启动所有服务
   docker-compose up -d
   
   # 查看日志
   docker-compose logs -f
   
   # 停止服务
   docker-compose down
   ```

2. **单独构建前端镜像**
   ```bash
   # 构建镜像
   docker build -t taoteching-frontend .
   
   # 运行容器
   docker run -d -p 80:80 taoteching-frontend
   ```

### 方式三：自动化部署脚本

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 执行部署脚本
./deploy.sh
```

## 服务器配置要求

### 最低配置

- **CPU**: 1核
- **内存**: 1GB
- **硬盘**: 20GB SSD
- **带宽**: 1Mbps

### 推荐配置

- **CPU**: 2核
- **内存**: 4GB
- **硬盘**: 50GB SSD
- **带宽**: 5Mbps

## 域名与SSL配置

### 1. 域名解析

将域名A记录指向服务器IP地址。

### 2. SSL证书配置

使用Let's Encrypt免费SSL证书：

```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 3. 更新Nginx配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # 其他配置...
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 环境变量配置

### 开发环境

创建 `.env.development` 文件：

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### 生产环境

创建 `.env.production` 文件：

```env
VITE_API_BASE_URL=https://api.your-domain.com
VITE_WS_URL=wss://api.your-domain.com
```

## 性能优化

### 1. 构建优化

```bash
# 分析构建产物
npx vue-cli-service build --report

# 启用gzip压缩
npm run build:h5 -- --mode production
```

### 2. Nginx优化

```nginx
# 启用gzip
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/xml+rss
    application/atom+xml
    image/svg+xml;

# 静态资源缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. CDN配置

将静态资源上传到CDN，修改 `vite.config.ts`：

```typescript
export default defineConfig({
  base: 'https://cdn.your-domain.com/',
  // 其他配置...
});
```

## 监控与日志

### 1. 应用监控

- 使用Sentry进行错误监控
- 配置性能监控API

### 2. 服务器监控

```bash
# 查看Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 查看系统资源
htop
df -h
free -m
```

## 故障排查

### 1. 页面空白

检查：
- 路由配置是否正确
- API接口是否正常
- 浏览器控制台是否有错误

### 2. 样式问题

检查：
- CSS变量是否正确定义
- 响应式断点是否合理
- 浏览器兼容性

### 3. 性能问题

检查：
- 网络请求时间
- 资源加载顺序
- 代码分割是否合理

## 更新与维护

### 代码更新

```bash
# 拉取最新代码
git pull origin main

# 安装依赖
npm install

# 构建生产版本
npm run build:h5

# 重启服务
docker-compose restart frontend
```

### 数据库更新

```bash
# 备份数据库
pg_dump -U postgres taoteching > backup.sql

# 执行迁移
npm run migration:run
```

## 联系方式

如有问题，请联系开发团队。

---

**注意**: 请根据实际服务器环境和需求调整配置文件。