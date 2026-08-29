import requests
import sys

# 设置标准输出编码为UTF-8
sys.stdout.reconfigure(encoding='utf-8')

url = "http://115.191.9.57:3315/"

print(f"检查参考网站: {url}")

try:
    response = requests.get(url, timeout=10)
    print(f"状态码: {response.status_code}")
    print(f"响应头: {dict(response.headers)}")
    print(f"响应内容长度: {len(response.text)} 字符")
    
    if response.status_code == 200:
        print("\n✅ 访问成功！")
        print("\n响应内容前1000字符:")
        print(response.text[:1000])
    else:
        print(f"\n❌ 访问失败，状态码: {response.status_code}")
        
except requests.exceptions.RequestException as e:
    print(f"❌ 请求错误: {e}")
except Exception as e:
    print(f"❌ 其他错误: {e}")