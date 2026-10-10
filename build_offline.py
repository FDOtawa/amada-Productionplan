# オフライン版（デスクトップ用）HTMLを作る: python build_offline.py
# 事前に: npm i xlsx@0.18.5  （node_modules/xlsx/dist/xlsx.full.min.js を使用）
# node が無い場合は xlsx.full.min.js（0.18.5）を別に用意して: python build_offline.py <xlsx.full.min.jsのパス>
import base64, io, os, pathlib, sys
from PIL import Image
s = pathlib.Path('index.html').read_text(encoding='utf-8')
tag = '<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>'
assert tag in s, 'index.html に xlsx の読み込みタグが見つかりません'
lib_path = sys.argv[1] if len(sys.argv) > 1 else 'node_modules/xlsx/dist/xlsx.full.min.js'
lib = pathlib.Path(lib_path).read_text(encoding='utf-8').replace('</script', '<\\/script')
s = s.replace(tag, '<script>' + lib + '</script>')
im = Image.open(next(p for p in ('画像・ﾛｺﾞ/icon.ico', 'icon.ico') if os.path.exists(p))).convert('RGBA').resize((64, 64)); b = io.BytesIO(); im.save(b, 'PNG')
s = s.replace('<title>アマダ生産計画抽出</title>', '<title>アマダ生産計画抽出</title>\n<link rel="icon" type="image/png" href="data:image/png;base64,' + base64.b64encode(b.getvalue()).decode() + '">', 1)
pathlib.Path('アマダ生産計画抽出.html').write_text(s, encoding='utf-8')
print('アマダ生産計画抽出.html を作成しました')
