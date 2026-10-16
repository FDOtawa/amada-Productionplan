"""run_result.json と answer.json をシリアルで突き合わせ"""
import json, pathlib
here = pathlib.Path(__file__).parent
res = json.load(open(here / 'run_result.json', encoding='utf-8')); ans = json.load(open(here / 'answer.json', encoding='utf-8'))
ops = json.load(open(here / 'oplist.json', encoding='utf-8')); no2name = {o['no']: o['name'] for o in ops}
A = {a['ser']: a for a in ans}
got = {}; skipped = []
for r in res:
    row = r['row']
    if row.get('skip'): skipped.append((r['file'], r['page'], row['skip'], (r['raw'].get('head') or {}).get('ser'))); continue
    got[row['ser']] = (r, row)
print('pages', len(res), 'rows', len(got), 'skipped', len(skipped))
for s in skipped: print('  skip', s)
bad = 0
for ser, a in A.items():
    if ser not in got: print('MISSING', ser, a['name']); bad += 1; continue
    r, row = got[ser]; diffs = []
    for k in ('ym', 'name', 'shimuke', 'country', 'cust', 'biko'):
        if (row.get(k) or '') != (a.get(k) or ''): diffs.append(f"{k}: 読={row.get(k)!r} 正={a.get(k)!r}")
    gotops = sorted(no2name[int(k)] for k, v in row['f'].items() if v); want = sorted(a['ops'])
    if gotops != want: diffs.append(f"OP 多い={sorted(set(gotops)-set(want))} 足りない={sorted(set(want)-set(gotops))}")
    if diffs: print(ser, r['file'], 'p', r['page'], '|', ' / '.join(diffs))
for ser in got:
    if ser not in A: print('EXTRA', ser, got[ser][0]['file'], got[ser][0]['page'], got[ser][1]['name'])
