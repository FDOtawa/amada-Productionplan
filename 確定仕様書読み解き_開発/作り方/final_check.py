"""最終テストの突き合わせ用：懸案（残り）と、OP ごと・ファイルごとの件数 → デスクトップ"""
import pathlib, openpyxl
from openpyxl.styles import Alignment, Border, Side, PatternFill, Font
src = openpyxl.load_workbook(r'C:\Users\0029\Desktop\確定仕様書読み解き HRB 2026年12月（最終テスト）.xlsx').active
ops = [(c, src.cell(3, c).value, src.cell(2, c).value) for c in range(7, src.max_column) if src.cell(3, c).value]
grp = None; G = []
for c, name, g in ops:
    if g: grp = g
    G.append((c, name, grp))
rows = list(range(4, src.max_row + 1))
wb = openpyxl.Workbook(); ws = wb.active; ws.title = '懸案（残り）'
thin = Side(style='thin', color='A6A6A6'); bd = Border(left=thin, right=thin, top=thin, bottom=thin)
H = PatternFill('solid', fgColor='DDEBF7'); Y = PatternFill('solid', fgColor='FFF2CC')
def table(sh, head, data, widths):
    sh.append(head)
    for d in data: sh.append(d)
    for r in sh.iter_rows():
        for c in r:
            c.border = bd; c.alignment = Alignment(vertical='top', wrap_text=True)
            if c.row == 1: c.fill = H; c.font = Font(bold=True)
    for i, w in enumerate(widths, 1): sh.column_dimensions[openpyxl.utils.get_column_letter(i)].width = w
table(ws, ['No', '内容', '正解（記入欄）'], [
    [1, '昨日の懸案29件と HRB大型の4件は、すべて回答どおりに反映しました。新しく迷った所はありません。', ''],
    [2, '読まなかったページ：HRB p5（ラック登録一覧）、KD p29・p31（納入先 AESA）、KD p30・p32（ラック登録一覧）、組付仕様書 p1〜41（HG・EGB・ロボット・ATC レイアウト。HRB 以外）', ''],
    [3, '突き比べで違いがあれば、シリアルと OP名をこの表に書き込んでください。', ''],
], [5, 100, 40])
for c in ws['C']:
    if c.row > 1: c.fill = Y
s2 = wb.create_sheet('OPごとの件数')
data = []
for c, name, g in G:
    n = sum(1 for r in rows if src.cell(r, c).value == 1)
    sers = [str(src.cell(r, 3).value) for r in rows if src.cell(r, c).value == 1]
    data.append([g, name, n, '、'.join(sers) if n <= 12 else f'（{n}台）'])
table(s2, ['区分', 'OP名', '「1」の件数', 'シリアル（12台以下のとき）'], data, [16, 26, 10, 110])
s3 = wb.create_sheet('ファイルごと')
table(s3, ['ファイル', '読んだページ', '帳票の行', '読まなかったページ'], [
    ['2026年12月 (HRB).pdf', '32ページ', 31, 'p5 ラック登録一覧'],
    ['2026年12月 (KD).pdf', '32ページ', 28, 'p29・31 AESA、p30・32 ラック登録一覧'],
    ['2026年12月 (SRB).pdf', '1ページ', 1, ''],
    ['【ベンディング 先行配布】組付仕様書(中型)2026年12月生産.pdf', '42ページ', 1, 'HRB 以外（HG・EGB・ロボット・ATC レイアウト）。HRB3506 の p42 だけ読む'],
    ['合計', '', 61, ''],
], [52, 12, 10, 60])
out = pathlib.Path(r'C:\Users\0029\Desktop\確定仕様書読み解き 懸案一覧 HRB 2026年12月（最終テスト）.xlsx')
wb.save(out); print(out)
for d in data: print(d[0], d[1], d[2])
