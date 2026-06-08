import base64
import sys

content_b64 = sys.argv[1]
target_path = sys.argv[2]

content = base64.b64decode(content_b64).decode('utf-8')
with open(target_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"File written to {target_path}, size: {len(content)} bytes")
