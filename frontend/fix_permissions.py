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
    
    # 1. 检查目录权限
    print("\n1. 检查目录权限...")
    stdin, stdout, stderr = client.exec_command("ls -la /opt/daodejing-app/")
    print("daodejing-app目录权限:")
    print(stdout.read().decode())
    
    # 2. 检查web目录权限
    print("\n2. 检查web目录权限...")
    stdin, stdout, stderr = client.exec_command("ls -la /opt/daodejing-app/web/")
    print("web目录权限:")
    print(stdout.read().decode())
    
    # 3. 检查assets目录权限
    print("\n3. 检查assets目录权限...")
    stdin, stdout, stderr = client.exec_command("ls -la /opt/daodejing-app/web/assets/")
    print("assets目录权限:")
    print(stdout.read().decode())
    
    # 4. 检查Nginx用户
    print("\n4. 检查Nginx用户...")
    stdin, stdout, stderr = client.exec_command("ps aux | grep nginx | grep master")
    print("Nginx master进程:")
    print(stdout.read().decode())
    
    # 5. 检查Nginx配置
    print("\n5. 检查Nginx配置...")
    stdin, stdout, stderr = client.exec_command("cat /etc/nginx/conf.d/daodejing.conf")
    print("daodejing.conf配置:")
    print(stdout.read().decode())
    
    # 6. 检查index.html内容
    print("\n6. 检查index.html内容...")
    stdin, stdout, stderr = client.exec_command("cat /opt/daodejing-app/web/index.html")
    print("index.html内容:")
    print(stdout.read().decode())
    
    # 7. 修复权限
    print("\n7. 修复权限...")
    commands = [
        "chmod -R 755 /opt/daodejing-app",
        "chown -R nginx:nginx /opt/daodejing-app/web",
        "chmod -R 755 /opt/daodejing-app/web",
        "chmod -R 755 /opt/daodejing-app/web/assets"
    ]
    
    for cmd in commands:
        print(f"执行命令: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        stderr_content = stderr.read().decode()
        if stderr_content:
            print(f"错误: {stderr_content}")
        else:
            print("成功")
    
    # 8. 重新测试访问
    print("\n8. 重新测试访问...")
    stdin, stdout, stderr = client.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3349/")
    response_code = stdout.read().decode()
    print(f"本地访问响应代码: {response_code}")
    
    # 9. 检查Nginx错误日志
    print("\n9. 检查Nginx错误日志...")
    stdin, stdout, stderr = client.exec_command("tail -20 /var/log/nginx/error.log")
    print("最近的Nginx错误日志:")
    print(stdout.read().decode())
    
    print("\n权限修复完成！")
    
except Exception as e:
    print(f"连接失败: {e}")
    import traceback
    traceback.print_exc()
finally:
    client.close()