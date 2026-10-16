"""確定仕様書読み解き（HRB・SRB）の読み取りを index.html に組み込む（何度でも流せる：印の間を差し替える）
python apply_engine.py   … 確定仕様書読み解き_開発 の spreader.js・sppage.js・spjudge.js・sp_app.js・oplist.json を埋め込む"""
import json, pathlib, re
here = pathlib.Path(__file__).parent
p = here.parent / 'index.html'; s = p.read_text(encoding='utf-8')
def once(a, b):
    global s
    if b in s: return
    assert s.count(a) == 1, a[:80]; s = s.replace(a, b)

# 1) ライブラリ（開発中は lib/ から。オフライン版は build_offline.py が埋め込む）
X = '<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>'
once(X, X + '\n<script src="lib/pdf.min.js"></script>\n<script src="lib/tesseract.min.js"></script>\n'
     "<script id=\"spLibCfg\">window.SP_LIB = { pdfWorker: 'lib/pdf.worker.min.js', tessWorker: 'lib/worker.min.js', tessCore: 'lib/tesseract-core-simd-lstm.wasm.js', jpn: 'lib/jpn.traineddata.gz' };</script>")

# 2) 進み具合の画面
once('<div class="saved" id="saved" hidden role="status"></div>', '''<div class="saved" id="saved" hidden role="status"></div>
  <div class="dlg save-dlg" id="spProg" hidden>
    <div class="save-box spp-box" role="dialog" aria-modal="true" aria-labelledby="spProgTitle">
      <div class="save-title"><span class="gem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg></span><span id="spProgTitle">確定仕様書を読み解いています</span></div>
      <div class="spp-sub" id="spProgSub"></div>
      <div class="spp-track"><div class="spp-bar" id="spProgBar"></div></div>
      <div class="spp-note">1ページずつ読み取っています（1ページ数秒）。読み終わると保存の画面が開きます。読み取り中はほかの操作はできません。</div>
      <div class="save-actions"><button type="button" id="spProgStop" class="save-cancel">中止</button></div>
    </div>
  </div>''')
once('.note.info{background:#FFF7DA;color:#5A4500;border:1px solid #F0D27A}', '''.note.info{background:#FFF7DA;color:#5A4500;border:1px solid #F0D27A}
.spp-box{width:820px}
.spp-sub{font-size:17px;color:#2b3440;margin:14px 0 12px;min-height:24px}
.spp-track{height:20px;border-radius:10px;background:#E3E8EE;box-shadow:inset 0 1px 3px rgba(0,0,0,.28);overflow:hidden}
.spp-bar{height:100%;width:0;border-radius:10px;background:linear-gradient(#7CC2FF,#1F78D8 60%,#1660B5);box-shadow:inset 0 1px 0 rgba(255,255,255,.6);transition:width .4s}
.spp-note{font-size:14px;color:#5b6570;margin-top:12px}''')

# 3) 読み取りの本体（印の間を差し替え）
src = lambda n: (here / n).read_text(encoding='utf-8').strip()
ops = [{'no': o['no'], 'grp': o['grp'], 'name': o['name']} for o in json.load(open(here / 'oplist.json', encoding='utf-8'))]
engine = ('/* SP_ENGINE_BEGIN（確定仕様書読み解き_開発 から apply_engine.py で埋め込み。直すときは向こうを直して流し直す） */\n'
          + src('spreader.js') + '\n' + src('sppage.js') + '\n' + src('spjudge.js') + '\n'
          + '// OP一覧（デスクトップ「HRB読み解き.xlsx」の OP一覧。帳票の列の順・区分）\nconst SP_HRB_OPS = ' + json.dumps(ops, ensure_ascii=False) + ';\n'
          + src('sp_app.js') + '\n/* SP_ENGINE_END */')
if '/* SP_ENGINE_BEGIN' in s:
    s = re.sub(r'/\* SP_ENGINE_BEGIN[\s\S]*?/\* SP_ENGINE_END \*/', lambda m: engine, s)
else:
    a = "const SP_PROCESSORS = {}; // 機種ごとの読み解き（まだ無い）\nvar spFiles = [], spMachine = '';"
    assert s.count(a) == 1
    s = s.replace(a, "const SP_PROCESSORS = {}; // 機種ごとの読み解き（HRB・SRB は下で登録。2026-10-16）\nvar spFiles = [], spMachine = '';\n" + engine)

# 4) 保存画面：確定仕様書読み解きのページでは saveJob（読み解きの結果）を保存する
once("let lastYM = '', lastInfo = null;", "let lastYM = '', lastInfo = null;\nlet saveJob = null; // 確定仕様書読み解きの保存（{ infoHtml, name, build, done }）。生産計画抽出では使わない\nconst curJob = () => (curPage === 'spec' ? saveJob : null);")
once("""  if (!lastRows.length) return;
  $('saveInfo').innerHTML = lastInfo ?""", """  const job = curJob();
  if (!job && !lastRows.length) return;
  $('saveInfo').innerHTML = job ? job.infoHtml : lastInfo ?""")
once("  $('saveName').value = defaultName();", "  $('saveName').value = job ? job.name : defaultName();")
once("  const data = buildWorkbook(XLSX, lastRows, PROCESSORS[machine]);\n  if (canPickDir) {",
     "  const job = curJob(), data = job ? job.build() : buildWorkbook(XLSX, lastRows, PROCESSORS[machine]);\n  if (canPickDir) {")
once("  try { downloadXlsx(name + '.xlsx', buildWorkbook(XLSX, lastRows, PROCESSORS[machine]));",
     "  try { const job = curJob(); downloadXlsx(name + '.xlsx', job ? job.build() : buildWorkbook(XLSX, lastRows, PROCESSORS[machine]));")
once("  clearTimeout(showDone.t); showDone.t = setTimeout(() => d.hidden = true, 6000);\n  resetAll();",
     "  clearTimeout(showDone.t); showDone.t = setTimeout(() => d.hidden = true, 6000);\n  const job = curJob();\n  if (job) { saveJob = null; job.done(); return; } // 確定仕様書読み解き：そのページの取り込み・機種をクリア\n  resetAll();")
p.write_text(s, encoding='utf-8'); print('ok', len(s))
