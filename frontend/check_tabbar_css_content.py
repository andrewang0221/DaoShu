import requests
import sys

# 设置标准输出编码为UTF-8
sys.stdout.reconfigure(encoding='utf-8')

base_url = "http://115.191.9.57:3349"

print("=" * 60)
print("检查TabBar样式文件内容")
print("=" * 60)

# 检查TabBar样式文件
tabbar_css_url = f"{base_url}/assets/tabbar.css"
try:
    response = requests.get(tabbar_css_url, timeout=10)
    if response.status_code == 200:
        css_content = response.text
        print(f"TabBar样式文件内容 ({len(css_content)} 字符):")
        print("-" * 40)
        print(css_content)
        print("-" * 40)
        
        # 检查样式是否有效
        if ".uni-tabbar" in css_content:
            print("✅ 包含.tabbar样式")
        else:
            print("❌ 未包含.tabbar样式")
            
        if ".uni-tabbar__icon" in css_content:
            print("✅ 包含.tabbar__icon样式")
        else:
            print("❌ 未包含.tabbar__icon样式")
            
        if ".uni-tabbar__label" in css_content:
            print("✅ 包含.tabbar__label样式")
        else:
            print("❌ 未包含.tabbar__label样式")
    else:
        print(f"❌ TabBar样式文件访问失败: {response.status_code}")
except Exception as e:
    print(f"❌ TabBar样式文件检查错误: {e}")

print("\n" + "=" * 60)
print("检查完成！")
print("=" * 60)