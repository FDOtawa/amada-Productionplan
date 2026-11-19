# オフライン版（デスクトップ用）HTMLを作る: python build_offline.py
# 事前に: npm i xlsx@0.18.5  （node_modules/xlsx/dist/xlsx.full.min.js を使用）
import base64, io, pathlib
from PIL import Image
s = pathlib.Path('index.html').read_text(encoding='utf-8')
tag = '<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>'
lib = pathlib.Path('node_modules/xlsx/dist/xlsx.full.min.js').read_text(encoding='utf-8').replace('</script', '<\\/script')
s = s.replace(tag, '<script>' + lib + '</script>')
im = Image.open('icon.ico').convert('RGBA').resize((64, 64)); b = io.BytesIO(); im.save(b, 'PNG')
s = s.replace('<title>アマダ生産計画抽出</title>', '<title>アマダ生産計画抽出</title>\n<link rel="icon" type="image/png" href="data:image/png;base64,' + base64.b64encode(b.getvalue()).decode() + '">', 1)
pathlib.Path('アマダ生産計画抽出.html').write_text(s, encoding='utf-8')
print('アマダ生産計画抽出.html を作成しました')
