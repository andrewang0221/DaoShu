import os
import base64

# TabBar图标目录
icon_dir = "src/static/tab"

# 简单的PNG图标数据（1x1像素的PNG）
def create_simple_png(width, height, color):
    """创建简单的PNG图片"""
    # PNG文件头
    png_header = b'\x89PNG\r\n\x1a\n'
    
    # IHDR块
    ihdr_data = width.to_bytes(4, 'big') + height.to_bytes(4, 'big') + b'\x08\x02\x00\x00\x00'
    ihdr_crc = b'\x00' * 4  # 简化处理
    ihdr_block = b'IHDR' + ihdr_data + ihdr_crc
    
    # IDAT块（简化）
    idat_data = b'\x00' * (width * height * 3)  # 简化的图像数据
    idat_crc = b'\x00' * 4  # 简化处理
    idat_block = b'IDAT' + idat_data + idat_crc
    
    # IEND块
    iend_crc = b'\x00' * 4  # 简化处理
    iend_block = b'IEND' + iend_crc
    
    return png_header + ihdr_block + idat_block + iend_block

# 创建图标文件
icons = ["home", "chat", "market", "mine"]

for icon_name in icons:
    # 普通状态图标（灰色）
    normal_file = os.path.join(icon_dir, f"{icon_name}.png")
    with open(normal_file, 'wb') as f:
        f.write(create_simple_png(24, 24, '#8a7f6a'))
    
    # 选中状态图标（绿色）
    active_file = os.path.join(icon_dir, f"{icon_name}-active.png")
    with open(active_file, 'wb') as f:
        f.write(create_simple_png(24, 24, '#5b6b52'))
    
    print(f"创建PNG图标: {icon_name}.png 和 {icon_name}-active.png")

print("\nPNG图标创建完成！")