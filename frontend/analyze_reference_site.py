import requests
import sys
import re

# 设置标准输出编码为UTF-8
sys.stdout.reconfigure(encoding='utf-8')

url = "http://115.191.9.57:3315/"

print(f"分析参考网站布局: {url}")

try:
    response = requests.get(url, timeout=10)
    if response.status_code == 200:
        html_content = response.text
        
        # 提取关键布局元素
        print("\n1. 页面标题:")
        title_match = re.search(r'<title>(.*?)</title>', html_content, re.IGNORECASE)
        if title_match:
            print(f"   {title_match.group(1)}")
        
        # 提取CSS样式
        print("\n2. 关键样式变量:")
        css_vars = re.findall(r'--([\w-]+):\s*([^;]+);', html_content)
        for var_name, var_value in css_vars[:10]:  # 只显示前10个
            print(f"   --{var_name}: {var_value}")
        
        # 提取布局结构
        print("\n3. 页面结构分析:")
        sections = re.findall(r'<section[^>]*class="([^"]*)"', html_content)
        print(f"   找到 {len(sections)} 个section元素")
        for i, section in enumerate(sections[:5]):  # 只显示前5个
            print(f"   {i+1}. class=\"{section}\"")
        
        # 提取导航栏
        print("\n4. 导航栏分析:")
        nav_match = re.search(r'<nav[^>]*>(.*?)</nav>', html_content, re.DOTALL)
        if nav_match:
            nav_content = nav_match.group(1)
            nav_items = re.findall(r'<a[^>]*>(.*?)</a>', nav_content)
            print(f"   导航项数量: {len(nav_items)}")
            for item in nav_items[:5]:  # 只显示前5个
                print(f"   - {item.strip()}")
        
        # 提取响应式设计
        print("\n5. 响应式设计:")
        media_queries = re.findall(r'@media[^{]*\{[^}]*\}', html_content)
        print(f"   找到 {len(media_queries)} 个媒体查询")
        
        # 提取JavaScript框架
        print("\n6. 技术栈:")
        scripts = re.findall(r'<script[^>]*src="([^"]*)"', html_content)
        print(f"   外部脚本数量: {len(scripts)}")
        for script in scripts[:5]:
            print(f"   - {script}")
        
        # 提取图片
        print("\n7. 图片资源:")
        images = re.findall(r'<img[^>]*src="([^"]*)"', html_content)
        print(f"   图片数量: {len(images)}")
        for img in images[:5]:
            print(f"   - {img}")
        
        # 分析页面布局
        print("\n8. 页面布局特点:")
        if "hero" in html_content.lower():
            print("   ✅ 有Hero区域（大标题+副标题）")
        if "feature" in html_content.lower():
            print("   ✅ 有功能特性展示")
        if "footer" in html_content.lower():
            print("   ✅ 有页脚")
        if "responsive" in html_content.lower() or "mobile" in html_content.lower():
            print("   ✅ 支持响应式设计")
        
        print("\n9. 设计风格:")
        if "dark" in html_content.lower() or "theme" in html_content.lower():
            print("   🎨 深色主题")
        if "gold" in html_content.lower():
            print("   🎨 金色点缀")
        if "glass" in html_content.lower():
            print("   🎨 玻璃效果")
        if "gradient" in html_content.lower():
            print("   🎨 渐变效果")
        
        print("\n" + "="*60)
        print("参考网站分析完成！")
        print("="*60)
        
except Exception as e:
    print(f"分析错误: {e}")
    import traceback
    traceback.print_exc()