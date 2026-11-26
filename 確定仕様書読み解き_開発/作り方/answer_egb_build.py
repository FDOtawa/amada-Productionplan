# EGB の正解表（answer_egb.json）と OP一覧（oplist_egb.json）を、テストの帳票（懸案の回答を反映したもの）から作る（2026-11-20）
import openpyxl, json, os, sys
sys.stdout.reconfigure(encoding='utf-8')
here = os.path.dirname(os.path.abspath(__file__)); dev = os.path.dirname(here)
f = os.path.join(here, 'egb_test', '確定仕様書読み解き EGB 2027年1月（テスト・回答反映）.xlsx')
rows = list(openpyxl.load_workbook(f)['確定仕様書読み解き'].iter_rows(values_only=True))
g, h = rows[0], rows[1]
ops = [{'no': i - 4, 'grp': g[i], 'name': h[i]} for i in range(5, len(h) - 1)]
json.dump(ops, open(os.path.join(dev, 'oplist_egb.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
ans = [{'ym': r[0], 'name': r[1], 'ser': str(r[2]), 'shimuke': r[3], 'country': r[4], 'ops': [h[i] for i in range(5, len(h) - 1) if r[i] == 1], 'biko': r[-1] or ''} for r in rows[2:]]
json.dump(ans, open(os.path.join(dev, 'answer_egb.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(ops), len(ans)); print([o['name'] for o in ops]); print(sorted({o['grp'] for o in ops})); print(ans[0])
