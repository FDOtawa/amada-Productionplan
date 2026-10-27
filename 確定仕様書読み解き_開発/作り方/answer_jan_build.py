"""2027年1月の正解表（answer_jan.json）を作る：ユーザーが確かめた帳票「HRB・SRB 確定仕様書読み解き 2027年1月結果.xlsx」（デスクトップ）から。
OK の行はそのまま、NG の行はユーザーの「間違い」の欄のとおりに直す（客先名の文字化けは直さない＝比べない。2026-10-27 ユーザー指示）"""
import json, pathlib, openpyxl
here = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path.home() / 'Desktop' / 'HRB・SRB 確定仕様書読み解き 2027年1月結果.xlsx'
ws = openpyxl.load_workbook(src).worksheets[0]
names = {c: ws.cell(3, c).value for c in range(7, 58)}
print({c: n for c, n in names.items() if c >= 49})
rows = []
for r in range(4, ws.max_row + 1):
    v = lambda c: ws.cell(r, c).value
    if not v(3): continue
    rows.append({'ym': v(1), 'name': v(2), 'ser': str(v(3)), 'shimuke': v(4), 'country': v(5), 'cust': v(6),
                 'ops': [names[c] for c in range(7, 58) if v(c) == 1], 'biko': v(58) or ''})
by = {x['ser']: x for x in rows}
def add(ser, *ops): by[ser]['ops'] += [o for o in ops if o not in by[ser]['ops']]
def drop(ser, *ops): by[ser]['ops'] = [o for o in by[ser]['ops'] if o not in ops]
# ユーザーの「間違い」の欄（2026-10-27）
by['10035449']['country'] = 'ニュージーランド'; add('10035449', '自動ｸﾗｳﾆﾝｸﾞ2軸')
by['80255563']['country'] = '韓国'
add('13035872', 'ｾｲｷﾞｮﾂｲｶ(IO)')
add('22045190', '特殊仕様')
for s in ('50205223', '50205224'): add(s, 'AS-01'); drop(s, 'W24（AS-01なし)')
SRB = {n: n for n in names.values()}
led_exp = next(n for n in names.values() if n and n.startswith('LEDﾗｲﾄ') and 'EXP' in n)
tepa = next(n for n in names.values() if n and ('ﾃﾊﾟ' in n or 'テパ' in n))
add('10301115', led_exp)
add('10301117', tepa)
json.dump(rows, open(here / 'answer_jan.json', 'w', encoding='utf-8'), ensure_ascii=False)
print(len(rows), 'rows', led_exp, tepa)
for s in ('10035449', '80255563', '13035872', '22045190', '50205223', '50205224', '10301115', '10301117'): print(s, by[s]['country'], by[s]['ops'])
