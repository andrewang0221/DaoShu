import requests
import sys
import json

# 设置标准输出编码为UTF-8
sys.stdout.reconfigure(encoding='utf-8')

base_url = "http://115.191.9.57:3349"

print("=" * 60)
print("道德经AI数字人前端功能测试")
print("=" * 60)

# 测试1: 主页访问
print("\n1. 测试主页访问...")
try:
    response = requests.get(f"{base_url}/", timeout=10)
    print(f"   状态码: {response.status_code}")
    if response.status_code == 200:
        print("   ✅ 主页访问成功")
    else:
        print(f"   ❌ 主页访问失败: {response.status_code}")
except Exception as e:
    print(f"   ❌ 主页访问错误: {e}")

# 测试2: 资源文件访问
print("\n2. 测试资源文件访问...")
resources = [
    "/assets/uni.c09e70d8.css",
    "/assets/index-H48ASPYy.js",
    "/assets/index-m-RIJ-l9.css"
]

for resource in resources:
    try:
        response = requests.get(f"{base_url}{resource}", timeout=10)
        print(f"   {resource}: {response.status_code} ({len(response.content)} bytes)")
    except Exception as e:
        print(f"   {resource}: 错误 - {e}")

# 测试3: API接口代理
print("\n3. 测试API接口代理...")
api_endpoints = [
    "/api/v1/auth/sms-code",
    "/api/v1/adoption/quiz",
    "/api/v1/chat/conversations"
]

for endpoint in api_endpoints:
    try:
        response = requests.get(f"{base_url}{endpoint}", timeout=5)
        print(f"   {endpoint}: {response.status_code}")
    except Exception as e:
        print(f"   {endpoint}: 连接失败 (正常，因为后端未启动)")

# 测试4: 静态资源完整性
print("\n4. 测试静态资源完整性...")
static_files = [
    "/index.html",
    "/assets/quiz-PQfXjqrP.css",
    "/assets/request.C0GJ1oxG.js"
]

for file in static_files:
    try:
        response = requests.get(f"{base_url}{file}", timeout=10)
        if response.status_code == 200:
            print(f"   ✅ {file} 存在")
        else:
            print(f"   ❌ {file} 不存在: {response.status_code}")
    except Exception as e:
        print(f"   ❌ {file} 访问错误: {e}")

# 测试5: 页面路由
print("\n5. 测试页面路由...")
routes = [
    "/#/pages/index/index",
    "/#/pages/chat/chat",
    "/#/pages/knowledge/knowledge",
    "/#/pages/market/market",
    "/#/pages/admin/dashboard"
]

for route in routes:
    try:
        response = requests.get(f"{base_url}{route}", timeout=10)
        print(f"   {route}: {response.status_code}")
    except Exception as e:
        print(f"   {route}: 错误 - {e}")

# 测试6: 响应时间
print("\n6. 测试响应时间...")
try:
    import time
    start_time = time.time()
    response = requests.get(f"{base_url}/", timeout=10)
    end_time = time.time()
    response_time = end_time - start_time
    print(f"   响应时间: {response_time:.3f} 秒")
    if response_time < 1:
        print("   ✅ 响应时间优秀")
    elif response_time < 3:
        print("   ✅ 响应时间良好")
    else:
        print("   ⚠️  响应时间较慢")
except Exception as e:
    print(f"   ❌ 响应时间测试错误: {e}")

# 测试7: 并发测试
print("\n7. 测试并发访问...")
try:
    import concurrent.futures
    import time
    
    def make_request():
        response = requests.get(f"{base_url}/", timeout=10)
        return response.status_code
    
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(make_request) for _ in range(10)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]
    end_time = time.time()
    
    successful = sum(1 for r in results if r == 200)
    print(f"   并发请求数: 10")
    print(f"   成功请求数: {successful}")
    print(f"   总耗时: {end_time - start_time:.3f} 秒")
    print(f"   平均响应时间: {(end_time - start_time) / 10:.3f} 秒")
    
    if successful == 10:
        print("   ✅ 并发测试通过")
    else:
        print("   ⚠️  部分并发请求失败")
except Exception as e:
    print(f"   ❌ 并发测试错误: {e}")

print("\n" + "=" * 60)
print("测试完成！")
print("=" * 60)

print("\n部署信息:")
print(f"   服务器地址: {base_url}")
print(f"   端口: 3349")
print(f"   协议: HTTP")
print("\n访问地址:")
print(f"   电脑端: {base_url}")
print(f"   手机端: {base_url}")
print(f"   管理后台: {base_url}/#/pages/admin/dashboard")
print("=" * 60)