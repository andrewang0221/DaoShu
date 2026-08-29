# 多阶段构建Dockerfile

# 阶段1：构建应用
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建H5版本
RUN npm run build:h5

# 阶段2：生产环境
FROM nginx:alpine

# 复制构建文件
COPY --from=builder /app/dist/build/h5 /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]