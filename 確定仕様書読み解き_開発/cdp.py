"""ヘッドレス Edge で http://127.0.0.1:8770/<page> を開き、JS を評価する小道具： python cdp.py page.html "expr" [保存先png(値のpngを保存)]"""
import sys, json, time, subprocess, pathlib, urllib.request, base64
here = pathlib.Path(__file__).parent
sys.path.insert(0, str(here.parent / 'pylib'))
import websocket
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
PORT = 9386
def run(page, exprs):
    proc = subprocess.Popen([EDGE, '--headless=new', '--disable-gpu', f'--remote-debugging-port={PORT}', f'--user-data-dir={here / "edgeprof2"}', 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                ws_url = next(t['webSocketDebuggerUrl'] for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json')) if t.get('type') == 'page'); break
            except Exception: time.sleep(0.2)
        ws = websocket.create_connection(ws_url, max_size=None, suppress_origin=True)
        n = [0]
        def call(method, **params):
            n[0] += 1; ws.send(json.dumps({'id': n[0], 'method': method, 'params': params}))
            while True:
                m = json.loads(ws.recv())
                if m.get('id') == n[0]:
                    if 'error' in m: raise RuntimeError(m['error'])
                    return m.get('result', {})
        call('Page.enable'); call('Runtime.enable'); call('Page.navigate', url=f'http://127.0.0.1:8770/{page}?v={time.time()}'); time.sleep(1.5)
        res = []
        for e in exprs:
            r = call('Runtime.evaluate', expression=e, awaitPromise=True, returnByValue=True, timeout=1800000)
            if 'exceptionDetails' in r: raise RuntimeError(json.dumps(r['exceptionDetails'], ensure_ascii=False)[:2000])
            res.append(r['result'].get('value'))
        return res
    finally:
        proc.kill()
if __name__ == '__main__':
    v = run(sys.argv[1], [sys.argv[2]])[0]
    if isinstance(v, dict) and 'png' in v and len(sys.argv) > 3:
        pathlib.Path(sys.argv[3]).write_bytes(base64.b64decode(v.pop('png').split(',', 1)[1]))
    print(json.dumps(v, ensure_ascii=False)[:6000])
