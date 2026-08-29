import requests
import sys
import re

# 设置标准输出编码为UTF-8
sys.stdout.reconfigure(encoding='utf-8')

base_url = "http://115.191.9.57:3349"

print("=" * 60)
print("TabBar样式检查")
print("=" * 60)

# 测试1: 检查CSS文件内容
print("\n1. 检查CSS文件内容...")
css_url = f"{base_url}/assets/uni.c09e70d8.css"
try:
    response = requests.get(css_url, timeout=10)
    if response.status_code == 200:
        css_content = response.text
        
        # 检查是否有TabBar相关样式
        tabbar_patterns = [
            r'\.uni-tabbar',
            r'\.uni-tabbar__icon',
            r'\.uni-tabbar__label',
            r'\.uni-tabbar__item',
            r'tabbar',
            r'tab-bar'
        ]
        
        found_patterns = []
        for pattern in tabbar_patterns:
            if re.search(pattern, css_content, re.IGNORECASE):
                found_patterns.append(pattern)
        
        if found_patterns:
            print(f"   ✅ CSS文件包含TabBar样式: {', '.join(found_patterns)}")
        else:
            print("   ⚠️  CSS文件未找到TabBar样式")
    else:
        print(f"   ❌ CSS文件访问失败: {response.status_code}")
except Exception as e:
    print(f"   ❌ CSS文件检查错误: {e}")

# 测试2: 检查TabBar样式文件
print("\n2. 检查TabBar样式文件...")
tabbar_css_url = f"{base_url}/assets/tabbar.css"
try:
    response = requests.get(tabbar_css_url, timeout=10)
    if response.status_code == 200:
        print(f"   ✅ TabBar样式文件存在 ({len(response.content)} bytes)")
    else:
        print(f"   ⚠️  TabBar样式文件不存在: {response.status_code}")
except Exception as e:
    print(f"   ❌ TabBar样式文件检查错误: {e}")

# 测试3: 检查页面HTML内容
print("\n3. 检查页面HTML内容...")
try:
    response = requests.get(f"{base_url}/", timeout=10)
    if response.status_code == 200:
        html_content = response.text
        
        # 检查是否有TabBar相关元素
        tabbar_html_patterns = [
            r'class="uni-tabbar"',
            r'class="uni-tabbar__icon"',
            r'class="uni-tabbar__label"',
            r'class="uni-tabbar__item"',
            r'data-testid="tabbar"',
            r'id="tabbar"'
        ]
        
        found_html_patterns = []
        for pattern in tabbar_html_patterns:
            if re.search(pattern, html_content, re.IGNORECASE):
                found_html_patterns.append(pattern)
        
        if found_html_patterns:
            print(f"   ✅ HTML包含TabBar元素: {', '.join(found_html_patterns)}")
        else:
            print("   ⚠️  HTML未找到TabBar元素（可能是动态加载）")
        
        # 检查是否有JavaScript文件
        js_files = re.findall(r'src="([^"]*\.js)"', html_content)
        if js_files:
            print(f"   ✅ 页面包含JavaScript文件: {len(js_files)}个")
except Exception as e:
    print(f"   ❌ HTML内容检查错误: {e}")

# 测试4: 检查JavaScript文件
print("\n4. 检查JavaScript文件...")
try:
    response = requests.get(f"{base_url}/", timeout=10)
    if response.status_code == 200:
        html_content = response.text
        js_files = re.findall(r'src="([^"]*\.js)"', html_content)
        
        for js_file in js_files:
            js_url = f"{base_url}{js_file}"
            js_response = requests.get(js_url, timeout=10)
            if js_response.status_code == 200:
                js_content = js_response.text
                
                # 检查是否有TabBar相关代码
                tabbar_js_patterns = [
                    r'tabbar',
                    r'tab-bar',
                    r'uni-tabbar',
                    r'TabBar'
                ]
                
                found_js_patterns = []
                for pattern in tabbar_js_patterns:
                    if re.search(pattern, js_content, re.IGNORECASE):
                        found_js_patterns.append(pattern)
                
                if found_js_patterns:
                    print(f"   ✅ {js_file} 包含TabBar代码: {', '.join(found_js_patterns)}")
                else:
                    print(f"   ⚠️  {js_file} 未找到TabBar代码")
except Exception as e:
    print(f"   ❌ JavaScript文件检查错误: {e}")

print("\n" + "=" * 60)
print("TabBar样式检查完成！")
print("=" * 60)
print("\n如果TabBar仍然显示不正常，可能的原因：")
print("1. TabBar样式未正确加载")
print("2. TabBar图标文件路径不正确")
print("3. TabBar组件未正确渲染")
print("4. 浏览器缓存问题")
print("\n建议：")
print("1. 清除浏览器缓存后重试")
print("2. 检查浏览器控制台是否有错误")
print("3. 检查网络请求是否成功")
print("=" * 60)