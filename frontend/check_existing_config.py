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
    
    # 查看现有的daodejing.conf配置
    print("\n查看现有的daodejing.conf配置...")
    stdin, stdout, stderr = client.exec_command("cat /etc/nginx/conf.d/daodejing.conf")
    config_content = stdout.read().decode()
    print("daodejing.conf内容:")
    print(config_content)
    
    # 查看daodejing-app目录结构
    print("\n查看daodejing-app目录结构...")
    stdin, stdout, stderr = client.exec_command("find /opt/daodejing-app -type f -name \"*.js\" | head -20")
    print("JS文件:")
    print(stdout.read().decode())
    
    # 查看web目录内容
    print("\n查看web目录内容...")
    stdin, stdout, stderr = client.exec_command("ls -la /opt/daodejing-app/web/")
    print("web目录:")
    print(stdout.read().decode())
    
    # 检查当前端口3349的响应
    print("\n检查当前端口3349的响应...")
    stdin, stdout, stderr = client.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3349/ || echo '无法连接'")
    response_code = stdout.read().decode()
    print(f"端口3349响应代码: {response_code}")
    
    # 检查进程
    print("\n检查Node.js进程...")
    stdin, stdout, stderr = client.exec_command("ps aux | grep daodejing | grep -v grep")
    processes = stdout.read().decode()
    print("daodejing相关进程:")
    print(processes)
    
    print("\n配置检查完成！")
    
except Exception as e:
    print(f"连接失败: {e}")
    import traceback
    traceback.print_exc()
finally:
    client.close()