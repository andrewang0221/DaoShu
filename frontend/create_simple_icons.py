import os
import struct
import zlib

# TabBar图标目录
icon_dir = "src/static/tab"

def create_png_file(width, height, color):
    """创建简单的PNG文件"""
    # PNG签名
    signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR块
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    ihdr_block = struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # IDAT块（创建简单的图像数据）
    # 每行有1个过滤字节 + width * 3个颜色字节
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # 过滤字节
        for x in range(width):
            # 简单的圆形图标
            cx, cy = width // 2, height // 2
            r = min(width, height) // 2 - 2
            if (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2:
                # 圆形内
                r, g, b = int(color[1:3], 16), int(color[3:5], 16), int(color[5:7], 16)
                raw_data += bytes([r, g, b])
            else:
                # 透明
                raw_data += bytes([255, 255, 255])
    
    compressed_data = zlib.compress(raw_data)
    idat_crc = zlib.crc32(b'IDAT' + compressed_data)
    idat_block = struct.pack('>I', len(compressed_data)) + b'IDAT' + compressed_data + struct.pack('>I', idat_crc)
    
    # IEND块
    iend_crc = zlib.crc32(b'IEND')
    iend_block = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    return signature + ihdr_block + idat_block + iend_block

# 创建图标文件
icons = ["home", "chat", "market", "mine"]

for icon_name in icons:
    # 普通状态图标（灰色）
    normal_file = os.path.join(icon_dir, f"{icon_name}.png")
    with open(normal_file, 'wb') as f:
        f.write(create_png_file(24, 24, '#8a7f6a'))
    
    # 选中状态图标（绿色）
    active_file = os.path.join(icon_dir, f"{icon_name}-active.png")
    with open(active_file, 'wb') as f:
        f.write(create_png_file(24, 24, '#5b6b52'))
    
    print(f"创建PNG图标: {icon_name}.png 和 {icon_name}-active.png")

print("\nPNG图标创建完成！")