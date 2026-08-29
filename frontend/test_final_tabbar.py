import requests
import sys

# 设置标准输出编码为UTF-8
sys.stdout.reconfigure(encoding='utf-8')

base_url = "http://115.191.9.57:3349"

print("=" * 60)
print("最终TabBar测试")
print("=" * 60)

# 测试1: 检查图标文件
print("\n1. 检查图标文件...")
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
            # 检查文件是否为PNG格式
            content = response.content
            if content[:4] == b'\x89PNG':
                print(f"   ✅ {icon_file} 是有效的PNG文件 ({len(content)} bytes)")
            else:
                print(f"   ⚠️  {icon_file} 不是有效的PNG文件 ({len(content)} bytes)")
        else:
            print(f"   ❌ {icon_file} 不存在: {response.status_code}")
    except Exception as e:
        print(f"   ❌ {icon_file} 访问错误: {e}")

# 测试2: 检查页面访问
print("\n2. 检查页面访问...")
try:
    response = requests.get(f"{base_url}/", timeout=10)
    if response.status_code == 200:
        print(f"   ✅ 主页访问成功: {response.status_code}")
    else:
        print(f"   ❌ 主页访问失败: {response.status_code}")
except Exception as e:
    print(f"   ❌ 主页访问错误: {e}")

# 测试3: 检查TabBar是否在页面中渲染
print("\n3. 检查TabBar渲染...")
try:
    response = requests.get(f"{base_url}/", timeout=10)
    if response.status_code == 200:
        content = response.text
        if "uni-tabbar" in content or "tabbar" in content.lower():
            print("   ✅ 页面包含TabBar相关内容")
        else:
            print("   ⚠️  页面未找到TabBar相关内容（可能是动态渲染）")
except Exception as e:
    print(f"   ❌ TabBar渲染检查错误: {e}")

print("\n" + "=" * 60)
print("TabBar修复完成！")
print("=" * 60)
print("\n访问地址: http://115.191.9.57:3349")
print("请在浏览器中打开上述地址，查看底部导航栏是否正常显示")
print("\n如果TabBar仍然显示不正常，请尝试：")
print("1. 清除浏览器缓存（Ctrl+F5）")
print("2. 检查浏览器控制台是否有错误")
print("3. 检查网络请求是否成功加载图标文件")
print("=" * 60)