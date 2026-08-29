import paramiko
import time
import os
import json

# 服务器配置
hostname = "115.191.9.57"
port = 22
username = "root"
password = "Wsy123456+"

# 本地构建目录
local_build_dir = "dist/build/h5"

# 远程部署目录
remote_deploy_dir = "/var/www/daodejing-frontend"

# 创建SSH客户端
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    # 连接到服务器
    print(f"连接到服务器 {hostname}:{port}...")
    client.connect(hostname, port, username, password, timeout=30)
    print("SSH连接成功！")
    
    # 检查现有Nginx配置
    print("\n检查现有Nginx配置...")
    stdin, stdout, stderr = client.exec_command("cat /etc/nginx/nginx.conf")
    nginx_config = stdout.read().decode()
    print("Nginx主配置文件:")
    print(nginx_config[:500] + "..." if len(nginx_config) > 500 else nginx_config)
    
    # 检查端口3349的配置
    print("\n检查端口3349的配置...")
    stdin, stdout, stderr = client.exec_command("grep -r '3349' /etc/nginx/ || echo '未找到3349配置'")
    config_files = stdout.read().decode()
    print("包含3349的配置文件:")
    print(config_files)
    
    # 检查现有的daodejing-app配置
    print("\n检查现有的daodejing-app配置...")
    stdin, stdout, stderr = client.exec_command("ls -la /opt/daodejing-app/ || echo '目录不存在'")
    print("daodejing-app目录:")
    print(stdout.read().decode())
    
    # 检查Nginx配置文件目录
    print("\n检查Nginx配置文件目录...")
    stdin, stdout, stderr = client.exec_command("ls -la /etc/nginx/conf.d/")
    print("conf.d目录:")
    print(stdout.read().decode())
    
    # 创建部署目录
    print(f"\n创建部署目录 {remote_deploy_dir}...")
    stdin, stdout, stderr = client.exec_command(f"mkdir -p {remote_deploy_dir}")
    stderr_content = stderr.read().decode()
    if stderr_content:
        print(f"创建目录时出错: {stderr_content}")
    else:
        print("部署目录创建成功")
    
    # 检查目录权限
    stdin, stdout, stderr = client.exec_command(f"ls -la /var/www/ | grep daodejing")
    print("目录权限:")
    print(stdout.read().decode())
    
    print("\n环境检查完成！")
    
except Exception as e:
    print(f"连接失败: {e}")
    import traceback
    traceback.print_exc()
finally:
    client.close()