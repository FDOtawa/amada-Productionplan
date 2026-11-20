"""ページの一部を拡大した画像を作る。
使い方: python zoom.py <k|e> <ページ> <x0> <y0> <x1> <y1> <出力.png>
  k=組付仕様書(小型)（標準機。90°回した向き。p49 だけ 270°）、e=(EGB).pdf（小型機。回さない）
  x0..y1 は、ページ画像（k??.jpg / e??.jpg）の幅・高さに対する割合（0〜1）"""
import base64, json, os, random, shutil, subprocess, sys, tempfile, time, urllib.request
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from shot import WS, EDGE
kind, n, x0, y0, x1, y1, out = sys.argv[1], int(sys.argv[2]), *map(float, sys.argv[3:7]), sys.argv[7]
pdf = 'kumi_s_2701.pdf' if kind == 'k' else 'egb_s_2701.pdf'
deg = (270 if n == 49 else 90) if kind == 'k' else 0
port = random.randint(9500, 9899); prof = tempfile.mkdtemp(prefix='zoomprof')
proc = subprocess.Popen([EDGE, '--headless=new', '--disable-gpu', f'--remote-debugging-port={port}', f'--user-data-dir={prof}', 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(150):
        try: ws_url = next(t['webSocketDebuggerUrl'] for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json')) if t.get('type') == 'page'); break
        except Exception: time.sleep(0.2)
    ws = WS(ws_url); k = [0]
    def call(m, **p):
        k[0] += 1; ws.send(json.dumps({'id': k[0], 'method': m, 'params': p}))
        while True:
            r = json.loads(ws.recv())
            if r.get('id') == k[0]: return r.get('result', {})
    call('Page.enable'); call('Page.navigate', url=f'http://127.0.0.1:8790/_test/sptest.html?v={time.time()}'); time.sleep(2)
    js = f"""(async()=>{{while(!window.ready) await new Promise(r=>setTimeout(r,200));
      let c=await render('{pdf}',{n},4); if({deg}) c=SpPage.rotate(c,{deg});
      const X0={x0}*c.width,Y0={y0}*c.height,W=({x1}-{x0})*c.width,H=({y1}-{y0})*c.height;
      const d=document.createElement('canvas'); d.width=W; d.height=H; d.getContext('2d').drawImage(c,X0,Y0,W,H,0,0,W,H); return d.toDataURL('image/png');}})()"""
    v = call('Runtime.evaluate', expression=js, awaitPromise=True, returnByValue=True)['result']['value']
    open(out, 'wb').write(base64.b64decode(v.split(',', 1)[1])); print('saved', out)
finally:
    proc.terminate(); time.sleep(0.5); shutil.rmtree(prof, ignore_errors=True)
