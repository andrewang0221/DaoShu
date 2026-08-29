import paramiko
import time
import os
import stat

# 服务器配置
hostname = "115.191.9.57"
port = 22
username = "root"
password = "Wsy123456+"

# 本地构建目录
local_build_dir = "dist/build/h5"

# 远程部署目录
remote_deploy_dir = "/opt/daodejing-app/web"

# 创建SSH客户端
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

def upload_directory(sftp, local_dir, remote_dir):
    """上传整个目录"""
    # 创建远程目录
    try:
        sftp.mkdir(remote_dir)
    except:
        pass
    
    # 遍历本地目录
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        # 使用正斜杠替换反斜杠
        remote_path = remote_dir + "/" + item
        
        if os.path.isdir(local_path):
            # 递归上传子目录
            upload_directory(sftp, local_path, remote_path)
        else:
            # 上传文件
            print(f"上传文件: {local_path} -> {remote_path}")
            sftp.put(local_path, remote_path)
            # 设置权限
            sftp.chmod(remote_path, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)

try:
    # 连接到服务器
    print(f"连接到服务器 {hostname}:{port}...")
    client.connect(hostname, port, username, password, timeout=30)
    print("SSH连接成功！")
    
    # 1. 清空现有web目录
    print("\n1. 清空现有web目录...")
    stdin, stdout, stderr = client.exec_command(f"rm -rf {remote_deploy_dir}/*")
    stderr_content = stderr.read().decode()
    if stderr_content:
        print(f"清空目录时出错: {stderr_content}")
    else:
        print("清空目录成功")
    
    # 2. 上传构建文件
    print("\n2. 上传构建文件...")
    sftp = client.open_sftp()
    upload_directory(sftp, local_build_dir, remote_deploy_dir)
    sftp.close()
    print("文件上传完成")
    
    # 3. 设置正确的权限
    print("\n3. 设置文件权限...")
    commands = [
        f"chmod -R 755 {remote_deploy_dir}",
        f"chown -R nginx:nginx {remote_deploy_dir}",
        "find /opt/daodejing-app/web -type d -exec chmod 755 {} \\;",
        "find /opt/daodejing-app/web -type f -exec chmod 644 {} \\;"
    ]
    
    for cmd in commands:
        print(f"执行命令: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        stderr_content = stderr.read().decode()
        if stderr_content:
            print(f"错误: {stderr_content}")
        else:
            print("成功")
    
    # 4. 检查目录结构
    print("\n4. 检查目录结构...")
    stdin, stdout, stderr = client.exec_command(f"find {remote_deploy_dir} -type f | head -10")
    print("文件列表:")
    print(stdout.read().decode())
    
    # 5. 检查index.html内容
    print("\n5. 检查index.html内容...")
    stdin, stdout, stderr = client.exec_command(f"cat {remote_deploy_dir}/index.html")
    print("index.html内容:")
    print(stdout.read().decode())
    
    # 6. 重新测试访问
    print("\n6. 重新测试访问...")
    stdin, stdout, stderr = client.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3349/")
    response_code = stdout.read().decode()
    print(f"本地访问响应代码: {response_code}")
    
    # 7. 检查Nginx错误日志
    print("\n7. 检查Nginx错误日志...")
    stdin, stdout, stderr = client.exec_command("tail -10 /var/log/nginx/error.log")
    print("最近的Nginx错误日志:")
    print(stdout.read().decode())
    
    # 8. 重新加载Nginx
    print("\n8. 重新加载Nginx...")
    stdin, stdout, stderr = client.exec_command("systemctl reload nginx")
    stderr_content = stderr.read().decode()
    if stderr_content:
        print(f"重新加载Nginx时出错: {stderr_content}")
    else:
        print("Nginx重新加载成功")
    
    # 9. 最终测试
    print("\n9. 最终测试...")
    stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3349/ | head -5")
    print("访问响应:")
    print(stdout.read().decode())
    
    print("\n修复完成！")
    
except Exception as e:
    print(f"连接失败: {e}")
    import traceback
    traceback.print_exc()
finally:
    client.close()