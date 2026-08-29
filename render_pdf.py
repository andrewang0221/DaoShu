import pymupdf
import os

pdf_path = "E:/mysoft/daodejingAPP/.dumate/20260826-233749-daodejing-pitch/slide_v4.pdf"
output_dir = (
    "E:/mysoft/daodejingAPP/.dumate/20260826-233749-daodejing-pitch/render_v4_full"
)

os.makedirs(output_dir, exist_ok=True)

doc = pymupdf.open(pdf_path)
total_pages = len(doc)
print(f"PDF总页数: {total_pages}")

file_info = []

for i in range(total_pages):
    page = doc[i]
    zoom = 120 / 72
    mat = pymupdf.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat)

    output_path = os.path.join(output_dir, f"page_{i + 1:02d}.png")
    pix.save(output_path)

    size_kb = os.path.getsize(output_path) / 1024
    file_info.append((i + 1, size_kb, pix.width, pix.height))
    print(f"Page {i + 1:02d}: {pix.width}x{pix.height}, {size_kb:.1f} KB")

doc.close()

print(f"\n总共渲染: {len(file_info)} 页")
print(f"保存目录: {output_dir}")

sizes = [x[1] for x in file_info]
print(
    f"\n文件大小统计: min={min(sizes):.1f}KB, max={max(sizes):.1f}KB, avg={sum(sizes) / len(sizes):.1f}KB"
)

# 检查异常（小于10KB视为异常小）
print("\n异常检查:")
for page_num, size_kb, w, h in file_info:
    status = "OK"
    if size_kb < 10:
        status = "WARNING: 文件过小（可能空白）"
    elif size_kb > 500:
        status = "INFO: 文件较大"
    print(f"  Page {page_num:02d}: {size_kb:.1f} KB - {status}")
