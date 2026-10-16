# オフライン版（デスクトップ用）HTMLを作る: python build_offline.py
# 事前に: npm i xlsx@0.18.5  （node_modules/xlsx/dist/xlsx.full.min.js を使用）
# node が無い場合は xlsx.full.min.js（0.18.5）を別に用意して: python build_offline.py <xlsx.full.min.jsのパス>
import base64, io, os, pathlib, re, sys
from PIL import Image
s = pathlib.Path('index.html').read_text(encoding='utf-8')
tag = '<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>'
assert tag in s, 'index.html に xlsx の読み込みタグが見つかりません'
lib_path = sys.argv[1] if len(sys.argv) > 1 else 'node_modules/xlsx/dist/xlsx.full.min.js'
lib = pathlib.Path(lib_path).read_text(encoding='utf-8').replace('</script', '<\\/script')
s = s.replace(tag, '<script>' + lib + '</script>')
# 確定仕様書読み解き（2026-10-16）：pdf.js・tesseract.js と日本語の学習データを lib/ から埋め込む（オフラインで外から読み込まない）
js = lambda n: pathlib.Path('lib', n).read_text(encoding='utf-8').replace('</script', '<\\/script').replace('<!--', '<\\!--')
for n in ('pdf.min.js', 'tesseract.min.js'):
    t = f'<script src="lib/{n}"></script>'; assert t in s, t
    s = s.replace(t, '<script>' + js(n) + '</script>')
cfg = re.search(r'<script id="spLibCfg">.*?</script>', s); assert cfg, 'spLibCfg'
plain = lambda k, body: f'<script type="text/plain" id="lib-{k}">{body}</script>'
s = s[:cfg.start()] + plain('pdfWorker', js('pdf.worker.min.js')) + plain('tessWorker', js('worker.min.js')) + plain('tessCore', js('tesseract-core-simd-lstm.wasm.js')) \
    + plain('jpn', base64.b64encode(pathlib.Path('lib', 'jpn.traineddata.gz').read_bytes()).decode()) + '<script>window.SP_LIB = { inline: true };</script>' + s[cfg.end():]
im = Image.open(next(p for p in ('画像・ﾛｺﾞ/icon.ico', 'icon.ico') if os.path.exists(p))).convert('RGBA').resize((64, 64)); b = io.BytesIO(); im.save(b, 'PNG')
s = s.replace('<title>生産管理システム</title>', '<title>生産管理システム</title>\n<link rel="icon" type="image/png" href="data:image/png;base64,' + base64.b64encode(b.getvalue()).decode() + '">', 1)
pathlib.Path('生産管理システム.html').write_text(s, encoding='utf-8')
print('生産管理システム.html を作成しました')
