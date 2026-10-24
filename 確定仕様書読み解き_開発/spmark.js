// 読み解き済みの PDF（2026-10-24 ユーザー指示）：読み解いたページに印を付けて、PDF にまとめる
// ① 帳票で「1」にした OP の根拠の ● の行は、オプション名の欄を黄色の蛍光ペンで塗る
// ② ● ではなく条件で付けた OP（W24・標準ﾌﾞﾚｰｶ・特殊仕様・ATC 装置など）は、オプションの表の最終行のあとの空いた行に、1行に1つずつ赤字で書き、黄色で塗る
//    （空いた行が足りなければ表の下に続ける。文字の大きさは確定仕様書の行の高さに合わせる。備考欄などの枠は使わない）
(function (G) {
  // 赤字で書くときの名前（帳票の列名と変えるもの。2026-10-24 ユーザー指示「LEDケーブルKDのみ は LEDケーブル で OK」）
  const LABEL = { 'LEDｹｰﾌﾞﾙKDのみ': 'LEDｹｰﾌﾞﾙ' };
  // どの行を塗り、どの OP を赤字にするか。judge(p) は帳票の1行（f＝OP の番号 → 実装）を返す関数、ops は [{ no, name }]
  // 条件の OP：● が1つも無くても「1」になる OP。そのほかは、その行だけで「1」になる行と、その行を外すと「1」が消える行を根拠とする
  function plan(p, judge, ops) {
    const row = judge(p); if (!row || row.skip) return null;
    const dots = p.dots || [], on = Object.keys(row.f).filter(k => row.f[k]).map(Number);
    const bare = judge({ ...p, dots: [] }).f || {}, hl = new Set(), cond = [];
    for (const k of on) {
      if (bare[k]) { cond.push(k); continue; }
      dots.forEach((d, i) => {
        if (judge({ ...p, dots: [d] }).f[k] || !judge({ ...p, dots: dots.filter((_, j) => j !== i) }).f[k]) hl.add(i);
      });
    }
    const name = k => { const n = (ops.find(o => o.no === k) || {}).name || String(k); return LABEL[n] || n; };
    return { hl: [...hl].sort((a, b) => a - b), cond: cond.map(name) };
  }
  const MARK = 'rgb(255,238,40)', RED = '#E00000';
  // 印を描く（cv は読み取りに使ったページの画像。回した向きのまま）
  function draw(cv, geom, pl) {
    const g = cv.getContext('2d'), hh = Math.max(10, geom.rowH);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = MARK; // 文字が透けるように「乗算」で塗る
    for (const i of pl.hl) { const r = geom.rows[i]; if (r) g.fillRect(r.x0 + 2, r.y0 + 2, r.x1 - r.x0 - 4, r.y1 - r.y0 - 3); }
    g.restore();
    if (!pl.cond.length) return;
    // 赤字（2026-10-24 ユーザー指示）：「別紙仕様書」のある表の最後の項目から1行あけて、1行に1つずつ。
    // 文字は2行分くらいの大きさ（マス目には合わせない）。黄色の蛍光ペンも塗る
    const fs = Math.round(hh * 1.5), lh = hh * 2, s0 = geom.slots[0];
    g.font = `bold ${fs}px "BIZ UDPGothic","Yu Gothic UI","Meiryo",sans-serif`; g.textBaseline = 'middle';
    // 書く場所：「別紙仕様書」のある表に入りきればそこ。無い・入りきらないときは、最後の項目のあとに入りきる表（左から順）。どれにも入りきらなければ空きのいちばん大きい表
    const fits = a => a && a.bottom - (a.y1 + hh) >= pl.cond.length * lh - 2;
    const areas = (geom.areas || []).slice().sort((p, q) => p.x0 - q.x0);
    let a = fits(geom.anchor) ? geom.anchor : areas.find(fits);
    if (!a && geom.anchor) a = geom.anchor;
    if (!a && areas.length) a = areas.slice().sort((p, q) => (q.bottom - q.y1) - (p.bottom - p.y1))[0];
    const x = (a ? a.x0 : s0 ? s0.x0 : geom.left) + Math.round(hh * 0.3);
    const top = a ? a.y1 + hh : (s0 ? s0.y0 : geom.bottom) + hh, bottom = a && a.bottom - top >= lh ? a.bottom : cv.height - 4;
    // 下に入りきらないときは落とさず、右の列に続ける
    const per = Math.max(1, Math.floor((bottom - top) / lh)), colW = Math.max(...pl.cond.map(t => g.measureText(t).width)) + hh * 1.5;
    pl.cond.forEach((t, j) => {
      const xx = x + Math.floor(j / per) * colW, y0 = top + (j % per) * lh, y1 = y0 + lh;
      const w = g.measureText(t).width, pad = Math.round(hh * 0.15);
      g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = MARK; g.fillRect(xx - pad, y0 + pad, w + pad * 2, lh - pad * 2); g.restore();
      g.fillStyle = RED; g.fillText(t, xx, (y0 + y1) / 2 + 1);
    });
  }
  // 画像（JPEG）のページから PDF を作る。pages：[{ jpg: Uint8Array, w, h（画素）, dpi }]
  function pdf(pages) {
    const enc = new TextEncoder(), parts = [], offs = []; let size = 0;
    const put = x => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); size += b.length; };
    const obj = (n, body) => { offs[n] = size; put(`${n} 0 obj\n`); body(); put('\nendobj\n'); };
    put('%PDF-1.4\n'); put(new Uint8Array([37, 226, 227, 207, 211, 10])); // 2行目は「中身がバイナリ」の印
    const n = pages.length, kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
    obj(1, () => put('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => put(`<< /Type /Pages /Count ${n} /Kids [${kids}] >>`));
    pages.forEach((pg, i) => {
      const P = 3 + i * 3, C = P + 1, I = P + 2, k = 72 / (pg.dpi || 150), W = (pg.w * k).toFixed(2), H = (pg.h * k).toFixed(2);
      const cs = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
      obj(P, () => put(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 ${I} 0 R >> >> /Contents ${C} 0 R >>`));
      obj(C, () => put(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`));
      obj(I, () => { put(`<< /Type /XObject /Subtype /Image /Width ${pg.w} /Height ${pg.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.jpg.length} >>\nstream\n`); put(pg.jpg); put('\nendstream'); });
    });
    const total = 3 + n * 3, xref = size;
    put(`xref\n0 ${total}\n0000000000 65535 f \n` + offs.slice(1, total).map(o => String(o).padStart(10, '0') + ' 00000 n \n').join(''));
    put(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    const out = new Uint8Array(size); let p = 0; for (const b of parts) { out.set(b, p); p += b.length; } return out;
  }
  // ページの画像を、PDF に入れる大きさ（dpi）に縮めて JPEG にする（ファイルを軽くするため。読み取りは 216dpi＝3倍で行う）
  // 標準は 130dpi・画質 0.6（2026-10-24 ユーザー指示「10MB は重たいので 70% ほどに」：150dpi・0.7 の 311KB/ページ → 219KB/ページ。細かい字も読める）
  const DPI = 130, QUALITY = 0.6;
  async function page(cv, dpi, quality) {
    dpi = dpi || DPI; quality = quality || QUALITY;
    const s = dpi / 216, c = document.createElement('canvas');
    c.width = Math.round(cv.width * s); c.height = Math.round(cv.height * s);
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(cv, 0, 0, c.width, c.height);
    const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', quality));
    return { jpg: new Uint8Array(await blob.arrayBuffer()), w: c.width, h: c.height, dpi };
  }
  G.SpMark = { plan, draw, pdf, page };
})(window);
