import requests
import sys

# 设置标准输出编码为UTF-8
sys.stdout.reconfigure(encoding='utf-8')

base_url = "http://115.191.9.57:3349"

print("=" * 60)
print("TabBar功能测试")
print("=" * 60)

# 测试1: 检查TabBar图标文件
print("\n1. 检查TabBar图标文件...")
icon_files = [
    "/static/tab/home.png",
    "/static/tab/home-active.png",
    "/static/tab/chat.png",
    "/static/tab/chat-active.png",
    "/static/tab/market.png",
    "/static/tab/market-active.png",
    "/static/tab/mine.png",
    "/static/tab/mine-active.png"
]

for icon_file in icon_files:
    try:
        response = requests.get(f"{base_url}{icon_file}", timeout=10)
        if response.status_code == 200:
            print(f"   ✅ {icon_file} 存在 ({len(response.content)} bytes)")
        else:
            print(f"   ❌ {icon_file} 不存在: {response.status_code}")
    except Exception as e:
        print(f"   ❌ {icon_file} 访问错误: {e}")

# 测试2: 检查CSS文件
print("\n2. 检查CSS文件...")
css_files = [
    "/assets/uni.c09e70d8.css",
    "/assets/index-zVLr8UVQ.css"
]

for css_file in css_files:
    try:
        response = requests.get(f"{base_url}{css_file}", timeout=10)
        if response.status_code == 200:
            print(f"   ✅ {css_file} 存在 ({len(response.content)} bytes)")
        else:
            print(f"   ❌ {css_file} 不存在: {response.status_code}")
    except Exception as e:
        print(f"   ❌ {css_file} 访问错误: {e}")

# 测试3: 检查页面访问
print("\n3. 检查页面访问...")
pages = [
    "/",
    "/#/pages/index/index",
    "/#/pages/chat/chat",
    "/#/pages/market/market",
    "/#/pages/mine/mine"
]

for page in pages:
    try:
        response = requests.get(f"{base_url}{page}", timeout=10)
        print(f"   {page}: {response.status_code}")
    except Exception as e:
        print(f"   {page}: 错误 - {e}")

# 测试4: 检查响应内容
print("\n4. 检查响应内容...")
try:
    response = requests.get(f"{base_url}/", timeout=10)
    if response.status_code == 200:
        content = response.text
        if "tabbar" in content.lower() or "tab-bar" in content.lower():
            print("   ✅ 页面包含TabBar相关内容")
        else:
            print("   ⚠️  页面未找到TabBar相关内容")
        
        if "uni-tabbar" in content:
            print("   ✅ 页面包含uni-tabbar类")
        else:
            print("   ⚠️  页面未找到uni-tabbar类")
except Exception as e:
    print(f"   ❌ 响应内容检查错误: {e}")

print("\n" + "=" * 60)
print("TabBar测试完成！")
print("=" * 60)
print("\n访问地址: http://115.191.9.57:3349")
print("请在浏览器中打开上述地址查看底部导航栏效果")
print("=" * 60)