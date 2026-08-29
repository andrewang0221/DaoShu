import paramiko
import time
import os

# 服务器配置
hostname = "115.191.9.57"
port = 22
username = "root"
password = "Wsy123456+"

# 创建SSH客户端
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    # 连接到服务器
    print(f"连接到服务器 {hostname}:{port}...")
    client.connect(hostname, port, username, password, timeout=30)
    print("SSH连接成功！")
    
    # 检查服务器环境
    print("\n检查服务器环境...")
    stdin, stdout, stderr = client.exec_command("uname -a")
    print("系统信息:", stdout.read().decode().strip())
    
    stdin, stdout, stderr = client.exec_command("node -v")
    print("Node.js版本:", stdout.read().decode().strip())
    
    stdin, stdout, stderr = client.exec_command("npm -v")
    print("npm版本:", stdout.read().decode().strip())
    
    stdin, stdout, stderr = client.exec_command("nginx -v")
    print("Nginx版本:", stderr.read().decode().strip())
    
    # 检查现有业务
    print("\n检查现有业务...")
    stdin, stdout, stderr = client.exec_command("ps aux | grep -E 'node|nginx|java' | grep -v grep")
    print("运行中的服务:\n", stdout.read().decode().strip())
    
    stdin, stdout, stderr = client.exec_command("netstat -tlnp | grep -E '80|443|3349'")
    print("端口使用情况:\n", stdout.read().decode().strip())
    
    # 检查磁盘空间
    print("\n检查磁盘空间...")
    stdin, stdout, stderr = client.exec_command("df -h")
    print("磁盘使用情况:\n", stdout.read().decode().strip())
    
    print("\n环境检查完成！")
    
except Exception as e:
    print(f"连接失败: {e}")
finally:
    client.close()