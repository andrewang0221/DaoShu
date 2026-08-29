import paramiko

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
    
    # 1. 检查web目录结构
    print("\n1. 检查web目录结构...")
    stdin, stdout, stderr = client.exec_command("find /opt/daodejing-app/web -type f | head -20")
    print("文件列表:")
    print(stdout.read().decode())
    
    # 2. 检查static目录
    print("\n2. 检查static目录...")
    stdin, stdout, stderr = client.exec_command("ls -la /opt/daodejing-app/web/static/")
    print("static目录:")
    print(stdout.read().decode())
    
    # 3. 检查tab目录
    print("\n3. 检查tab目录...")
    stdin, stdout, stderr = client.exec_command("ls -la /opt/daodejing-app/web/static/tab/")
    print("tab目录:")
    print(stdout.read().decode())
    
    # 4. 检查Nginx配置
    print("\n4. 检查Nginx配置...")
    stdin, stdout, stderr = client.exec_command("cat /etc/nginx/conf.d/daodejing.conf")
    print("daodejing.conf配置:")
    print(stdout.read().decode())
    
    # 5. 检查文件内容
    print("\n5. 检查文件内容...")
    stdin, stdout, stderr = client.exec_command("cat /opt/daodejing-app/web/static/tab/home.png")
    content = stdout.read().decode()
    print(f"home.png文件内容 ({len(content)} 字符):")
    print(content[:100] + "..." if len(content) > 100 else content)
    
    print("\n文件检查完成！")
    
except Exception as e:
    print(f"连接失败: {e}")
    import traceback
    traceback.print_exc()
finally:
    client.close()