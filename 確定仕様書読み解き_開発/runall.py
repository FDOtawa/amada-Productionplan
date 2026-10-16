"""4つの PDF を全部読み、判定して、正解表（answer.json）と突き合わせる"""
import json, pathlib, sys, time
here = pathlib.Path(__file__).parent
sys.path.insert(0, str(here))
import cdp
files = sys.argv[1:] or ['pdf/hrb12.pdf', 'pdf/kd12.pdf', 'pdf/srb12.pdf', 'pdf/kumi12.pdf']
expr = "(async()=>{const OPS=await (await fetch('oplist.json')).json();const out=[];for(const f of %s){const pages=await readPdf(f);for(const p of pages){out.push({file:f,page:p.page,ms:p.ms,raw:{head:p.head,dots:p.dots,skip:p.skip,rot:p.rotated},row:SpJudge.judge(p,OPS)});}}return out;})()" % json.dumps(files)
t0 = time.time()
res = cdp.run('page.html', [expr])[0]
(here / 'run_result.json').write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding='utf-8')
print('time', round(time.time() - t0), 's  pages', len(res))
