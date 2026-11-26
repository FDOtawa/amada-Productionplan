# 2027年2月 EGB：アプリの結果と、ユーザーが確かめた帳票（赤太字…xlsx の OK の行＋直した3件）を比べる
import json, os, sys, openpyxl
sys.stdout.reconfigure(encoding='utf-8')
f = os.path.join(os.path.expanduser('~'), 'Desktop', '赤太字EGB 確定仕様書読み解き 2027年2月.xlsx')
rows = list(openpyxl.load_workbook(f)['確定仕様書読み解き'].iter_rows(values_only=True))
h = rows[2]
ans = {str(r[2]): {'ym': r[0], 'name': r[1], 'shimuke': r[3], 'country': r[4], 'ops': [h[i] for i in range(5, len(h) - 1) if r[i] == 1], 'biko': r[-1] or ''} for r in rows[3:] if r[2]}
for s in ('60109127', '60109128'): ans[s]['ops'] = sorted(set(ans[s]['ops']) | {'SG軸'})  # 3点ゲージ→SG軸（ユーザー指摘）
res = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out_sp', 'app_egb_feb.json'), encoding='utf-8'))
print('time', res['sec'], 's'); print(res['info'])
got = {r['ser']: r for r in res['rows']}
bad = 0
for ser, a in ans.items():
    r = got.get(ser)
    if not r: print('MISSING', ser); bad += 1; continue
    d = [f"{k}: 帳票={r[k]!r} 正={a[k]!r}" for k in ('ym', 'name', 'shimuke', 'country', 'biko') if (r[k] or '') != (a[k] or '')]
    if sorted(r['ops']) != sorted(a['ops']): d.append(f"OP 多い={sorted(set(r['ops']) - set(a['ops']))} 足りない={sorted(set(a['ops']) - set(r['ops']))}")
    if d: bad += 1; print(ser, '|', ' / '.join(d))
for s in got:
    if s not in ans: print('NEW', s, got[s])
print(f'確かめた行 {len(ans)}：一致 {len(ans) - bad}、違い {bad}、帳票の行 {len(got)}')
