#!/bin/bash

# 道枢 · 东方智慧 AI 数字人系统前端部署脚本
# 用于将前端项目部署到远程服务器

echo "=========================================="
echo "道枢 · 东方智慧 AI 数字人系统前端部署脚本"
echo "=========================================="

# 检查Node.js和npm版本
echo "1. 检查环境..."
node -v
npm -v

# 安装依赖
echo "2. 安装项目依赖..."
npm install

# 构建H5版本
echo "3. 构建H5版本..."
npm run build:h5

# 检查构建结果
if [ -d "dist/build/h5" ]; then
    echo "✅ H5构建成功！"
    echo "构建目录: dist/build/h5"
    
    # 显示构建文件
    echo "构建文件列表:"
    ls -la dist/build/h5/
    
    echo ""
    echo "=========================================="
    echo "部署说明:"
    echo "1. 将 dist/build/h5/ 目录上传到服务器"
    echo "2. 配置Nginx或Apache服务器"
    echo "3. 设置正确的路由重写规则"
    echo "=========================================="
    echo ""
    echo "Nginx配置示例:"
    echo "server {"
    echo "    listen 80;"
    echo "    server_name your-domain.com;"
    echo "    root /path/to/dist/build/h5;"
    echo "    index index.html;"
    echo ""
    echo "    location / {"
    echo "        try_files \$uri \$uri/ /index.html;"
    echo "    }"
    echo "}"
    echo ""
    echo "Apache配置示例:"
    echo "RewriteEngine On"
    echo "RewriteCond %{REQUEST_FILENAME} !-f"
    echo "RewriteCond %{REQUEST_FILENAME} !-d"
    echo "RewriteRule ^(.*)$ index.html [L]"
    
else
    echo "❌ 构建失败！"
    exit 1
fi

echo ""
echo "部署脚本执行完成！"