# EGB 確定仕様書読み解きのテスト（2026-11-20）：目で読んだ eye_*.json に、決まったきまりを当てて試しの帳票を作る
import json, glob, os, re, sys, unicodedata
import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

sys.stdout.reconfigure(encoding='utf-8')
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else HERE

def N(s):  # 比べるための形（全角半角・大文字小文字・空白をそろえる）
    return re.sub(r'\s', '', unicodedata.normalize('NFKC', s or '')).upper()

pages = []
for f in sorted(glob.glob(os.path.join(HERE, 'eye_*.json'))):
    pages += json.load(open(f, encoding='utf-8'))
order = lambda p: (0 if p['page'][0] == 'k' else 1, int(p['page'][1:]))
pages.sort(key=order)

COUNTRY = [('日本', '日本'), ('中国', '中国'), ('CHINA', '中国'), ('香港', '中国'), ('HONGKONG', '中国'), ('台湾', '台湾'), ('TAIWAN', '台湾'),
           ('韓国', '韓国'), ('KOREA', '韓国'), ('米国', '米国'), ('アメリカ', '米国'), ('AMERICA', '米国'), ('USA', '米国'), ('カナダ', 'カナダ'), ('CANADA', 'カナダ'),
           ('オーストラリア', 'オーストラリア'), ('マレーシア', 'マレーシア'), ('MALAYSIA', 'マレーシア'), ('タイ', 'タイ'), ('THAILAND', 'タイ'),
           ('ブラジル', 'ブラジル'), ('BRASIL', 'ブラジル'), ('BRAZIL', 'ブラジル'), ('インド', 'インド'), ('ベトナム', 'ベトナム'), ('メキシコ', 'メキシコ'),
           ('インドネシア', 'インドネシア'), ('シンガポール', 'シンガポール'), ('フィリピン', 'フィリピン'), ('ニュージーランド', 'ニュージーランド')]
def country_of(*texts):
    for t in texts:
        t = N(t)
        for k, v in COUNTRY:
            if N(k) in t: return v
    return ''

def kind_of(model):  # 生産計画抽出と同じ：標準機／小型機
    m = re.match(r'EGB(\d{4})', N(model))
    if not m: return ''
    d = m.group(1)
    if d.startswith('13') or d.startswith('8'): return '標準機'
    if d.startswith('4'): return '小型機'
    if d.startswith('6'):
        if '2' in d[1:]: return '標準機'
        if '1' in d[1:]: return '小型機'
    return ''

def form_of(model):  # E / AE / RE / ARE（機種名だけを見る）
    m = re.match(r'EGB\d{4}([A-Z]*)', N(model))
    s = m.group(1) if m else ''
    for f in ('ARE', 'AE', 'RE', 'E'):
        if s.startswith(f): return f
    return s or '?'

COLS = ['制御装置(AE以外)', '制御装置(AE)', 'BI-S2', 'BI-S1', 'AS-01', 'WOP42', 'SG軸', 'Lｼﾌﾄ', 'Y3', 'AF自動ｽﾗｲﾄﾞ', '手動ｽﾗｲﾄﾞ', 'ﾂｷｱﾃﾓﾆﾀ',
        'SF追従装置', 'ﾍﾋﾞｰSF', 'ｸﾗﾝﾌﾟ', 'IO', 'ﾓﾊﾞｲﾙHMI(TAB)', 'BIﾂｰﾙﾅﾋﾞ', 'ﾛﾎﾞｯﾄIF', 'ATSAｴﾙｺﾞﾉﾐｸｽ', '20P/AF', '2人操作ﾌｯﾄﾍﾟﾀﾞﾙ',
        'ATC仕様', 'ﾛﾎﾞｯﾄ仕様', 'ATC付きﾛﾎﾞｯﾄ仕様', '特殊仕様', '指定色']
GRP = {'制御装置(AE以外)': 'ｾｲｷﾞｮ', '制御装置(AE)': 'ｾｲｷﾞｮ', 'ATC仕様': 'その他', 'ﾛﾎﾞｯﾄ仕様': 'その他', 'ATC付きﾛﾎﾞｯﾄ仕様': 'その他', '特殊仕様': '特殊', '指定色': '特殊'}

rows, recs, issues = [], [], []
def issue(p, what, detail): issues.append([p['page'], p.get('ser', ''), p.get('model', ''), what, detail])

for p in pages:
    if p.get('not_spec'):
        recs.append([p['page'], '', '', '読まない', p['not_spec'], '']); continue
    model = (p.get('model') or '').strip()
    if N(model).startswith('EGBRBT'):
        recs.append([p['page'], p.get('ser', ''), model, '読まない', 'ロボット（EGBRBT）', '']); continue
    if not N(model).startswith('EGB'):
        recs.append([p['page'], p.get('ser', ''), model, '読まない', 'EGB 以外（CR など）', '']); continue
    sel = [s for s in p.get('selected', [])]
    # 見るのは行の名前（「｜」の前）だけ。「｜」のあとは説明（「Y3軸からの変更有無」「自動スライドフット…以外への変更」など）、※ のあとも注記
    # 特殊仕様 ①〜⑳ の行と「制御ASSY（IO）」の行は OP に当てない（特殊仕様＝1 で足りる・IO は単体で見ない）
    SPC = [x for x in sel if re.match(r'^\s*(特殊仕様)?\s*[①-⑳]', x)]
    S = ['' if (x in SPC or N(x).startswith('制御ASSY')) else N(x.split('｜')[0]).split('※')[0] for x in sel]
    spkw = [x for x in SPC if any(N(k) in N(x) for k in ['ロボットIF', 'BI-S', '角度', '追従', 'Lシフト', 'Y3', 'スライドフット', '2人操作', '両手', 'AS-01', 'IO'])]
    if spkw: issue(p, '特殊仕様の欄に OP の名前（特殊仕様＝1 で足り、OP の列には付けていない）', ' / '.join(spkw))
    has = lambda *ws: [s for s, n in zip(sel, S) if all(N(w) in n for w in ws)]
    kind, form = kind_of(model), form_of(model)
    std = kind == '標準機'
    if not kind: issue(p, '標準機・小型機が決められない', model)
    if form == '?': issue(p, '機種名の記号（E・AE・RE・ARE）が読めない', model)
    ctry = country_of(p.get('country', '')) or country_of(p.get('dest', ''), p.get('contract', ''))
    if not ctry: issue(p, '国名が決められない', f"国名欄「{p.get('country', '')}」 納入先「{p.get('dest', '')}」")
    shimuke = 'DMS' if ctry == '日本' else 'EXP'
    ym = p.get('ym', '')
    m = re.search(r'(\d{4})\D+(\d{1,2})', ym)
    ym = f'{m.group(1)}年{int(m.group(2))}月' if m else ym
    v = dict.fromkeys(COLS, '')
    mark, margin, why = [], [], {}
    def on(col, rows_=None, reason=''):
        v[col] = 1
        if rows_: mark.extend(r for r in rows_ if r not in mark)
        why[col] = reason or ' / '.join(rows_ or [])
    # その他（機種名から）・制御装置
    if form == 'AE': on('ATC仕様', reason='機種名 AE'); on('制御装置(AE)', reason='機種名 AE')
    else: on('制御装置(AE以外)', reason=f'機種名 {form}')
    if form == 'RE': on('ﾛﾎﾞｯﾄ仕様', reason='機種名 RE')
    if form == 'ARE': on('ATC付きﾛﾎﾞｯﾄ仕様', reason='機種名 ARE')
    # 角度センサー
    bis = lambda ax: [s for s, n in zip(sel, S) if ('角度センサ' in n or 'BI-S' in n) and ax in n]
    b2, b1 = bis('2軸'), bis('1軸')
    if b2: on('BI-S2', b2)
    if b1: on('BI-S1', b1)
    # AS-01・WOP42
    a = has('AS-01')
    if a: on('AS-01', a)
    else: on('WOP42', reason='AS-01 に ● なし'); margin.append('WOP42')
    # 3点ゲージ（ARE・RE）
    g3 = has('3点ゲージ')
    if g3 and form in ('ARE', 'RE'):
        on('SG軸', g3, '3点ゲージ'); margin.append('SG軸')
        if form == 'ARE': on('Lｼﾌﾄ', g3, '3点ゲージ（ARE）'); margin.insert(len(margin) - 1, 'Lｼﾌﾄ')
    # Lシフト（標準機・単体）・Y3（標準機）
    y3 = [s for s in has('Y3')]
    ls = [s for s, n in zip(sel, S) if ('Lシフト' in n or 'LS軸' in n) and 'Y3' not in n and 'ワークセンサ' not in n and '標準' not in n and 'LシフトМ無'.replace('М','') not in n]
    if std and y3: on('Y3', y3)
    if std and ls and not v['Lｼﾌﾄ']: on('Lｼﾌﾄ', ls, 'Lシフト単体')
    if not std and (y3 or ls): issue(p, '小型機の Lシフト・Y3（付けない）', ' / '.join(y3 + ls))
    # スライドフット・2人操作
    af = [s for s, n in zip(sel, S) if 'スライドフット' in n and ('自動' in n or '(AF)' in n or '自走' in n)] + has('AF軸')
    mf = [s for s, n in zip(sel, S) if 'スライドフット' in n and '手動' in n]
    two = has('2人操作')
    if af: on('AF自動ｽﾗｲﾄﾞ', af)
    if mf: on('手動ｽﾗｲﾄﾞ', mf)
    if two and af: on('20P/AF', two + af, '2人操作＋自動スライドフット')
    elif two: on('2人操作ﾌｯﾄﾍﾟﾀﾞﾙ', two)
    # 追従装置
    sf = [s for s, n in zip(sel, S) if '追従' in n and '1224' in n]
    hsf = [s for s, n in zip(sel, S) if '追従' in n and '1548' in n]
    if sf: on('SF追従装置', sf)
    if hsf: on('ﾍﾋﾞｰSF', hsf)
    other_sf = [s for s, n in zip(sel, S) if '追従' in n and '1224' not in n and '1548' not in n]
    if other_sf: issue(p, '追従装置（SF-1224TL・SF1548 以外）', ' / '.join(other_sf))
    # クランプ
    cl = [s for s, n in zip(sel, S) if not n.startswith('ダイホルダ') and 'AGRIP-A' in n or (('中間板' in n or 'モジュラーツーリング' in n) and 'AMTS' in n)]
    if cl: on('ｸﾗﾝﾌﾟ', cl); margin.append('ｸﾗﾝﾌﾟ')
    if any('AMTS' in n and '中間板' in n and '標準' not in n for n in S): issue(p, '中間板 AMTS（【標準】の無い書き方）をクランプに数えた', ' / '.join(cl))
    # スマートオペレーションパック（TAB）・ツキアテモニタ
    tab = [s for s, n in zip(sel, S) if 'スマートオペレーション' in n or 'モバイルHMI' in n]
    tm = [s for s, n in zip(sel, S) if ('ツキアテモニ' in n or '突き当てモニ' in n or '突当てモニ' in n)]
    if tab:
        if std: on('ﾓﾊﾞｲﾙHMI(TAB)', tab); margin += ['TAB']
        on('ﾂｷｱﾃﾓﾆﾀ', tab, 'スマートオペレーションパック'); margin.append('ﾂｷｱﾃﾓﾆﾀ')
    if tm and not v['ﾂｷｱﾃﾓﾆﾀ']: on('ﾂｷｱﾃﾓﾆﾀ', tm)
    # BIツールナビ（機種名が E ＋ BI-S）
    if form == 'E' and (b1 or b2): on('BIﾂｰﾙﾅﾋﾞ', b1 + b2, '機種名 E＋BI-S'); margin.append('BIﾂｰﾙﾅﾋﾞ')
    # ロボットIF・エルゴノミクス・ARse
    rif = [s for s, n in zip(sel, S) if 'ロボットIF' in n or 'ロボットインター' in n]
    if rif: on('ﾛﾎﾞｯﾄIF', rif)
    if any('6軸バックゲージ' in n for n in S): issue(p, '「6軸バックゲージ【標準】」は Y3 に数えていない', '※の注記に Y3軸バックゲージの記載あり')
    erg = has('エルゴノミクス')
    if erg: on('ATSAｴﾙｺﾞﾉﾐｸｽ', erg)
    arse = [s for s, n in zip(sel, S) if 'ARSE' in n or 'ARCE' in n]
    mark += [r for r in arse if r not in mark]
    # 両手操作
    both = has('両手操作')
    if both: on('特殊仕様', both, '両手操作'); issue(p, '両手操作に ●（特殊仕様＋IO）', ' / '.join(both))
    # 特殊仕様・指定色
    if (p.get('tokushu') or '').strip(): on('特殊仕様', reason='特殊機№ ' + p['tokushu'])
    col = [c for c in p.get('choices', []) if '指定色' in c]
    if col and re.search(r':\s*有', col[0]): on('指定色', reason=col[0])
    # 制御IO
    io_why = []
    if form in ('RE', 'ARE'): pass
    elif not std:
        if rif: io_why.append('ﾛﾎﾞｯﾄIF')
    else:
        if form == 'AE': io_why.append('AE')
        for c in ('AF自動ｽﾗｲﾄﾞ', '手動ｽﾗｲﾄﾞ', 'SF追従装置', 'ﾍﾋﾞｰSF', 'ﾓﾊﾞｲﾙHMI(TAB)', 'ﾛﾎﾞｯﾄIF', '20P/AF', '2人操作ﾌｯﾄﾍﾟﾀﾞﾙ'):
            if v[c]: io_why.append(c)
        if both: io_why.append('両手操作')
    if io_why: v['IO'] = 1; why['IO'] = '・'.join(io_why); margin.append('IO')
    if form in ('RE', 'ARE') and (af or mf or sf or hsf or tab or rif or two):
        issue(p, 'ARE・RE で IO の付く OP があるが IO は付けない', ' / '.join(af + mf + sf + hsf + tab + rif + two))
    for c in ('手動ｽﾗｲﾄﾞ', '2人操作ﾌｯﾄﾍﾟﾀﾞﾙ'):
        if v[c] and std and form not in ('RE', 'ARE'): issue(p, f'{c} で制御IO を付けた（OP表の IO〇 による）', why[c])
    casy = [x for x in sel if N(x).startswith('制御ASSY')]
    if casy and not v['IO']: issue(p, '「制御ASSY（IO）」の行に ● があるが、IO の条件に当たらない（単体では見ない）', casy[0][:40])
    note = ''
    bz = N((p.get('biko') or '') + ' ' + re.split(r'【[^】]*モデルとの違い】', p.get('seizo') or '')[0])  # 「モデルとの違い」の変更一覧は ● と同じなので見ない.replace('SF接続10', 'SF接続IO')
    KW = {'SF1548': ['ﾍﾋﾞｰSF'], 'SF1224': ['SF追従装置'], '追従': ['SF追従装置', 'ﾍﾋﾞｰSF'], '接続IO': ['IO'], '制御IO': ['IO'], 'ロボットIF': ['ﾛﾎﾞｯﾄIF'],
          'Lシフト': ['Lｼﾌﾄ'], 'AS-01': ['AS-01'], '2人操作': ['20P/AF', '2人操作ﾌｯﾄﾍﾟﾀﾞﾙ'], 'スライドフット': ['AF自動ｽﾗｲﾄﾞ', '手動ｽﾗｲﾄﾞ'], '両手操作': ['特殊仕様'], 'Y3': ['Y3'], 'エルゴノミクス': ['ATSAｴﾙｺﾞﾉﾐｸｽ']}
    kws = [k for k, cs in KW.items() if N(k) in bz and not any(v[c] for c in cs)]
    if kws: note = '備考欄記載あり'; issue(p, '備考・製造指示追記情報に OP の記載があるが、● が無い（' + '・'.join(kws) + '）', ((p.get('biko') or '') + ' ／ ' + (p.get('seizo') or '')).strip(' ／'))
    if form == 'AE': mark.insert(0, '（機種名の AE 部分）')
    name = f'{model} {shimuke}'
    rows.append([ym, name, p.get('ser', ''), shimuke, ctry] + [v[c] for c in COLS] + [note])
    recs.append([p['page'], p.get('ser', ''), model, '帳票に出した', f'{kind}・{form}', ' / '.join(sel), p.get('seizo', ''), p.get('biko', ''), p.get('unsure', '')])
    p['_mark'], p['_margin'], p['_why'] = mark, margin, why

# 帳票（並びはシリアル順）
BASE = ['ｱﾏﾀﾞ生産月', '機種名', 'ｼﾘｱﾙ', '仕向', '国名']
wb = openpyxl.Workbook(); ws = wb.active; ws.title = '確定仕様書読み解き'
thin = Side(style='thin', color='999999'); B = Border(left=thin, right=thin, top=thin, bottom=thin)
head = PatternFill('solid', fgColor='DDEBF7')
ws.append([''] * len(BASE) + [GRP.get(c, 'OP') for c in COLS] + [''])
ws.append(BASE + COLS + ['備考欄'])
for c in ws[1] + ws[2]:
    c.fill = head; c.border = B; c.font = Font(bold=True, size=9); c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
for c in ws[2][len(BASE):len(BASE) + len(COLS)]:
    c.alignment = Alignment(horizontal='center', vertical='bottom', text_rotation=255)
ws.row_dimensions[2].height = 110
for r in sorted(rows, key=lambda r: r[2]):
    ws.append(r)
for row in ws.iter_rows(min_row=3):
    for c in row: c.border = B; c.font = Font(size=9); c.alignment = Alignment(horizontal='center' if c.column > 3 else 'left', vertical='center')
for i, w in enumerate([11, 22, 11, 6, 13] + [4] * len(COLS) + [24], 1):
    ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = w
ws.freeze_panes = 'F3'
ws.page_setup.orientation = 'landscape'; ws.page_setup.paperSize = 9; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
ws.sheet_properties.pageSetUpPr.fitToPage = True

w2 = wb.create_sheet('マーキングと欄外')
w2.append(['ページ', 'ｼﾘｱﾙ', '機種名', '黄色のマーキング（● の行）', '欄外の赤字', '「1」の根拠'])
for p in pages:
    if '_mark' not in p: continue
    w2.append([p['page'], p.get('ser', ''), p.get('model', ''), '\n'.join(p['_mark']), '\n'.join(dict.fromkeys(p['_margin'])), '\n'.join(f'{k}：{x}' for k, x in p['_why'].items())])
w3 = wb.create_sheet('読み取りの記録')
w3.append(['ページ', 'ｼﾘｱﾙ', '機種名', '扱い', '理由・種類', '● の行（目で読んだもの）', '製造指示追記情報', '備考', '読み取りで迷った所'])
for r in recs: w3.append(r)
for w in (w2, w3):
    for c in w[1]: c.fill = head; c.font = Font(bold=True, size=9); c.border = B
    for row in w.iter_rows(min_row=2):
        for c in row: c.alignment = Alignment(wrap_text=True, vertical='top'); c.font = Font(size=9); c.border = B
    for col, wd in zip('ABCDEFGHI', [7, 11, 16, 50, 16, 60, 40, 30, 40]): w.column_dimensions[col].width = wd
wb.save(os.path.join(OUT, '確定仕様書読み解き EGB 2027年1月（テスト）.xlsx'))

wi = openpyxl.Workbook(); x = wi.active; x.title = '懸案'
x.append(['No', '懸案', '件数', '対象（ページ・シリアル）', '例（仕様書の記載）', '今回の扱い（テスト）', '回答（記入欄）'])
DO = {'中間板 AMTS（【標準】の無い書き方）をクランプに数えた': 'ｸﾗﾝﾌﾟ＝1 にした',
      '「6軸バックゲージ【標準】」は Y3 に数えていない': 'Y3・Lｼﾌﾄ とも付けていない',
      '特殊仕様の欄に OP の名前（特殊仕様＝1 で足り、OP の列には付けていない）': '特殊仕様＝1 だけ（HRB と同じ考え）',
      '「制御ASSY（IO）」の行に ● があるが、IO の条件に当たらない（単体では見ない）': 'IO は付けていない',
      '手動ｽﾗｲﾄﾞ で制御IO を付けた（OP表の IO〇 による）': 'IO＝1 にした',
      '2人操作ﾌｯﾄﾍﾟﾀﾞﾙ で制御IO を付けた（OP表の IO〇 による）': 'IO＝1 にした'}
groups = {}
for pg, ser, mdl, what, detail in issues:
    key = '備考・製造指示追記情報に OP の記載があるが、● が無い' if what.startswith('備考・製造指示') else what
    groups.setdefault(key, []).append((pg, ser, mdl, what, detail))
for i, (k, items) in enumerate(groups.items(), 1):
    if k.startswith('備考・製造指示'):
        for j, (pg, ser, mdl, what, detail) in enumerate(items):
            x.append([f'{i}-{j + 1}', what, 1, f'{pg} {ser} {mdl}', detail[:300], '備考欄に「備考欄記載あり」', ''])
        continue
    x.append([i, k, len(items), chr(10).join(f'{pg} {ser} {mdl}' for pg, ser, mdl, *_ in items), items[0][4][:200], DO.get(k, ''), ''])
GEN = [
    ('ｾｲｷﾞｮの2列（制御装置(AE以外)・制御装置(AE)）を帳票に入れた', '全行', 'OP表の区分「ｾｲｷﾞｮ」', '全行どちらかに1（AE だけ「AE」、ARE・RE・E は「AE以外」）'),
    ('板金「ALL」の列は入れていない', '全行', 'OP表の区分「板金」ALL', '列なし'),
    ('ARce HMIパック（小型機 EGB6013RE の様式）はマーキングだけ', 'e13 60109110', 'ARce 4ieパック・ARce HMIパック（仕様書は「ARce」）', '帳票には出さない'),
    ('2人操作ﾌｯﾄﾍﾟﾀﾞﾙ＋自動ｽﾗｲﾄﾞﾌｯﾄのとき', '今回は該当なし', 'OP表：2人操作ﾌｯﾄﾍﾟﾀﾞﾙは単独のときだけ', '20P/AF＝1・AF自動ｽﾗｲﾄﾞ＝1、2人操作ﾌｯﾄﾍﾟﾀﾞﾙは付けない'),
    ('帳票の並び', '全行', '', 'シリアルの順（標準機・小型機をまとめて1枚）'),
]
for j, (k, tgt, ex, do) in enumerate(GEN, 1):
    x.append([f'全体{j}', k, '', tgt, ex, do, ''])
for c in x[1]: c.fill = head; c.font = Font(bold=True, size=9); c.border = B
for row in x.iter_rows(min_row=2):
    for c in row: c.alignment = Alignment(wrap_text=True, vertical='top'); c.font = Font(size=9); c.border = B
    row[6].fill = PatternFill('solid', fgColor='FFF2CC')
for col, wd in zip('ABCDEFG', [5, 36, 5, 30, 50, 24, 30]): x.column_dimensions[col].width = wd
wi.save(os.path.join(OUT, 'EGB確定仕様書読み解き 懸案一覧 2027年1月（テスト）.xlsx'))
print('rows', len(rows), 'issues', len(issues), 'pages', len(pages))
