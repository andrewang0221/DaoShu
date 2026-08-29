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
        remote_path = os.path.join(remote_dir, item)
        
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
    
    # 1. 备份现有web目录
    print("\n1. 备份现有web目录...")
    backup_dir = f"{remote_deploy_dir}.backup.{int(time.time())}"
    stdin, stdout, stderr = client.exec_command(f"cp -r {remote_deploy_dir} {backup_dir}")
    stderr_content = stderr.read().decode()
    if stderr_content:
        print(f"备份时出错: {stderr_content}")
    else:
        print(f"备份成功: {backup_dir}")
    
    # 2. 清空现有web目录
    print("\n2. 清空现有web目录...")
    stdin, stdout, stderr = client.exec_command(f"rm -rf {remote_deploy_dir}/*")
    stderr_content = stderr.read().decode()
    if stderr_content:
        print(f"清空目录时出错: {stderr_content}")
    else:
        print("清空目录成功")
    
    # 3. 上传构建文件
    print("\n3. 上传构建文件...")
    sftp = client.open_sftp()
    upload_directory(sftp, local_build_dir, remote_deploy_dir)
    sftp.close()
    print("文件上传完成")
    
    # 4. 设置正确的权限
    print("\n4. 设置文件权限...")
    stdin, stdout, stderr = client.exec_command(f"chmod -R 755 {remote_deploy_dir}")
    stderr_content = stderr.read().decode()
    if stderr_content:
        print(f"设置权限时出错: {stderr_content}")
    else:
        print("权限设置成功")
    
    # 5. 检查Nginx配置
    print("\n5. 检查Nginx配置...")
    stdin, stdout, stderr = client.exec_command("nginx -t")
    nginx_test = stdout.read().decode()
    nginx_error = stderr.read().decode()
    print(f"Nginx配置测试: {nginx_test}")
    if nginx_error:
        print(f"Nginx配置错误: {nginx_error}")
    
    # 6. 重新加载Nginx
    print("\n6. 重新加载Nginx...")
    stdin, stdout, stderr = client.exec_command("systemctl reload nginx")
    stderr_content = stderr.read().decode()
    if stderr_content:
        print(f"重新加载Nginx时出错: {stderr_content}")
    else:
        print("Nginx重新加载成功")
    
    # 7. 验证部署
    print("\n7. 验证部署...")
    stdin, stdout, stderr = client.exec_command(f"ls -la {remote_deploy_dir}")
    print("部署目录内容:")
    print(stdout.read().decode())
    
    # 8. 测试访问
    print("\n8. 测试访问...")
    stdin, stdout, stderr = client.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3349/")
    response_code = stdout.read().decode()
    print(f"本地访问响应代码: {response_code}")
    
    # 9. 检查进程状态
    print("\n9. 检查进程状态...")
    stdin, stdout, stderr = client.exec_command("ps aux | grep daodejing | grep -v grep")
    processes = stdout.read().decode()
    print("daodejing相关进程:")
    print(processes)
    
    # 10. 检查端口状态
    print("\n10. 检查端口状态...")
    stdin, stdout, stderr = client.exec_command("netstat -tlnp | grep 3349")
    port_status = stdout.read().decode()
    print("端口3349状态:")
    print(port_status)
    
    print("\n" + "="*50)
    print("部署完成！")
    print("="*50)
    print(f"访问地址: http://115.191.9.57:3349")
    print(f"备份目录: {backup_dir}")
    print("="*50)
    
except Exception as e:
    print(f"部署失败: {e}")
    import traceback
    traceback.print_exc()
finally:
    client.close()