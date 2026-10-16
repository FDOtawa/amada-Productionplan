// 確定仕様書（スキャン画像）の読み取りの部品：罫線の検出・表の行と「確定」列・●の判定・セルの切り出し
(function (G) {
  // 画像（canvas）→ 白黒の配列
  function binarize(cv, th) {
    const { width: w, height: h } = cv, d = cv.getContext('2d').getImageData(0, 0, w, h).data, b = new Uint8Array(w * h);
    for (let i = 0, j = 0; j < b.length; i += 4, j++) b[j] = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) < (th || 170) ? 1 : 0;
    return { w, h, b };
  }
  // 長い横線・縦線（minLen 以上の黒の連続）を探す。返り値：{y,x0,x1}／{x,y0,y1}
  function findLines(img, minH, minV, gapH = 3, gapV = 0) {
    const { w, h, b } = img, H = [], V = [];
    // かすれ・切れ目（横線は gapH px まで、縦線は gapV px まで）は線が続いているとみなす
    for (let y = 0; y < h; y++) {
      let st = -1, last = -10;
      for (let x = 0; x <= w; x++) {
        if (x < w && b[y * w + x]) { if (x - last > gapH + 1) { if (st >= 0 && last - st >= minH) H.push({ y, x0: st, x1: last }); st = x; } last = x; }
      }
      if (st >= 0 && last - st >= minH) H.push({ y, x0: st, x1: last });
    }
    for (let x = 0; x < w; x++) {
      let st = -1, last = -10;
      for (let y = 0; y <= h; y++) {
        if (y < h && b[y * w + x]) { if (y - last > gapV + 1) { if (st >= 0 && last - st >= minV) V.push({ x, y0: st, y1: last }); st = y; } last = y; }
      }
      if (st >= 0 && last - st >= minV) V.push({ x, y0: st, y1: last });
    }
    return { H: mergeH(H), V: mergeV(V) };
  }
  function mergeH(L) { // 隣り合う y の線をまとめる
    L.sort((a, b) => a.y - b.y || a.x0 - b.x0); const out = [];
    for (const l of L) {
      const m = out.find(o => Math.abs(o.y1 - l.y) <= 2 && l.x0 <= o.x1 + 8 && l.x1 >= o.x0 - 8);
      if (m) { m.y1 = l.y; m.x0 = Math.min(m.x0, l.x0); m.x1 = Math.max(m.x1, l.x1); } else out.push({ y: l.y, y1: l.y, x0: l.x0, x1: l.x1 });
    }
    return out.map(o => ({ y: (o.y + o.y1) / 2, x0: o.x0, x1: o.x1 }));
  }
  function mergeV(L) {
    L.sort((a, b) => a.x - b.x || a.y0 - b.y0); const out = [];
    for (const l of L) {
      const m = out.find(o => Math.abs(o.x1 - l.x) <= 2 && l.y0 <= o.yb + 8 && l.y1 >= o.ya - 8);
      if (m) { m.x1 = l.x; m.ya = Math.min(m.ya, l.y0); m.yb = Math.max(m.yb, l.y1); } else out.push({ x: l.x, x1: l.x, ya: l.y0, yb: l.y1 });
    }
    return out.map(o => ({ x: (o.x + o.x1) / 2, y0: o.ya, y1: o.yb }));
  }
  // 「改訂・確定・販売」の3つの細い列の組を探す（縦線が狭い間隔で4本並ぶところ）
  function markGroups(V, unit) {
    const all = V.filter(v => v.y1 - v.y0 > unit * 4).sort((a, b) => a.x - b.x), out = [];
    const ov = (a, b) => Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 0.6 * Math.max(a.y1 - a.y0, b.y1 - b.y0) * 0.5;
    for (let i = 0; i < all.length; i++) {
      const vs = [all[i], ...all.slice(i + 1).filter(v => ov(v, all[i]))]; // 同じ高さの範囲にある縦線だけで見る
      if (vs.length < 4) continue;
      const g = [vs[0], vs[1], vs[2], vs[3]], d = [g[1].x - g[0].x, g[2].x - g[1].x, g[3].x - g[2].x];
      if (d.every(x => x > unit * 0.6 && x < unit * 1.6) && Math.max(...d) - Math.min(...d) < unit * 0.4) {
        const y0 = Math.max(...g.map(v => v.y0)), y1 = Math.min(...g.map(v => v.y1));
        if (y1 - y0 > unit * 4) out.push({ kx0: g[1].x, kx1: g[2].x, lx: g[3].x, y0, y1 });
      }
    }
    return out;
  }
  // 黒の割合
  function dark(img, x0, y0, x1, y1) {
    const { w, b } = img; let n = 0, t = 0;
    for (let y = Math.round(y0); y < Math.round(y1); y++) for (let x = Math.round(x0); x < Math.round(x1); x++) { t++; n += b[y * w + x]; }
    return t ? n / t : 0;
  }
  // ● の判定：中心 (cx,cy)・半径 R の丸。真ん中は真っ黒、外接する四角の四隅は白、上下の黒さがそろう（▲ は上が細いので外す。漢字は隅にも線がある）
  const avg4 = (a, b, c, d) => (a + b + c + d) / 4;
  function isDotAt(img, cx, cy, R) {
    const sq = dark(img, cx - R, cy - R, cx + R, cy + R);
    const core = dark(img, cx - R * 0.5, cy - R * 0.5, cx + R * 0.5, cy + R * 0.5);
    const a = R * 0.75, b2 = R * 1.15, corner = avg4(dark(img, cx - b2, cy - b2, cx - a, cy - a), dark(img, cx + a, cy - b2, cx + b2, cy - a),
      dark(img, cx - b2, cy + a, cx - a, cy + b2), dark(img, cx + a, cy + a, cx + b2, cy + b2));
    const k = Math.max(2, Math.round(R * 0.7)), yc = Math.round(cy); // 中心から上下に同じ行数ずつ
    const top = dark(img, cx - R, yc - k, cx + R, yc), bot = dark(img, cx - R, yc + 1, cx + R, yc + 1 + k);
    return sq > 0.5 && sq < 0.98 && core > 0.8 && corner < 0.45 && Math.min(top, bot) / Math.max(top, bot, 1e-6) > 0.5;
  }
  const isDot = (img, x0, y0, x1, y1) => isDotAt(img, (x0 + x1) / 2, (y0 + y1) / 2, Math.min(x1 - x0, y1 - y0) / 2);
  // 「確定」の列の中の ● を探す：列の中央の帯で黒の塊（縦に連続する黒の行）を見つけ、丸いもの（▲ は除く）だけ残す
  function dotsInColumn(img, g) {
    const x0 = g.kx0 + 3, x1 = g.kx1 - 3, out = [];
    let st = -1;
    for (let y = Math.round(g.y0); y <= Math.round(g.y1) + 1; y++) {
      const on = y <= g.y1 && dark(img, x0 + (x1 - x0) * 0.2, y, x1 - (x1 - x0) * 0.2, y + 1) > 0.25;
      if (on && st < 0) st = y;
      if (!on && st >= 0) {
        const hgt = y - st, cy = (st + y - 1) / 2;
        if (hgt >= (x1 - x0) * 0.25 && hgt <= (x1 - x0) * 0.9) {
          // 横の広がり：その高さの黒の左端・右端
          // 真ん中あたりの黒い所から左右へ、黒が続く所まで（列の縦線は含めない）
          const isOn = x => dark(img, x, cy - 1, x + 1, cy + 2) > 0.5;
          let c0 = -1; for (let d = 0; d < (x1 - x0) / 2 && c0 < 0; d++) { const m = Math.round((x0 + x1) / 2); if (isOn(m - d)) c0 = m - d; else if (isOn(m + d)) c0 = m + d; }
          if (c0 < 0) { st = -1; continue; }
          let l = c0, r = c0; while (l - 1 >= x0 - 2 && isOn(l - 1)) l--; while (r + 1 <= x1 + 2 && isOn(r + 1)) r++;
          const wd = r - l + 1, cx = (l + r) / 2;
          if (wd > hgt * 0.6 && wd < hgt * 1.5 && isDotAt(img, cx, cy, Math.max(wd, hgt) / 2)) out.push(cy);
        }
        st = -1;
      }
    }
    return out;
  }
  // 表の行：組の中の横線で区切る（左端が「改訂」の線より左から始まり、項目の列の先まで届く線）
  function rows(img, lines, g) {
    const hs = lines.H.filter(h => h.x0 <= g.kx0 + 4 && h.x1 >= g.lx + 20 && h.y >= g.y0 - 3 && h.y <= g.y1 + 3).sort((a, b) => a.y - b.y);
    const dots = dotsInColumn(img, g), out = [];
    for (let i = 0; i + 1 < hs.length; i++) {
      const y0 = hs[i].y, y1 = hs[i + 1].y; if (y1 - y0 < 8) continue;
      if (y0 < g.y0 + 6) continue; // 一番上の行は見出し（改訂・確定・販売）
      // 項目の右端：その行の高さにかかる、項目の列より右で一番近い長い縦線（表の右の区切り）。無ければ横線の右端
      let right = Math.min(hs[i].x1, hs[i + 1].x1);
      for (const v of lines.V) if (v.x > g.lx + 60 && v.x < right && v.y0 <= y0 + 3 && v.y1 >= y1 - 3 && v.y1 - v.y0 > (g.y1 - g.y0) * 0.3) right = v.x;
      out.push({ y0, y1, dot: dots.some(d => d > y0 + 1 && d < y1 - 1), lx0: g.lx + 2, lx1: right - 2 });
    }
    return out;
  }
  // 罫線を消したセルの画像（OCR 用）。scale 倍に拡大
  // セルの切り出し（OCR 用）：拡大し、セルの中の縦の区切り線（高さの大半が黒い列）を白く消す
  function cellCanvas(src, img, x0, y0, x1, y1, scale) {
    const c0 = cellCanvas0(src, img, x0, y0, x1, y1, scale), g = c0.getContext('2d');
    for (let x = Math.round(x0); x < x1; x++) if (dark(img, x, y0 + 2, x + 1, y1 - 2) > 0.85) { g.fillStyle = '#fff'; g.fillRect((x - x0 - 1) * scale, 0, 3 * scale, c0.height); }
    return c0;
  }
  function cellCanvas0(src, img, x0, y0, x1, y1, scale) {
    const w = Math.max(1, Math.round(x1 - x0)), h = Math.max(1, Math.round(y1 - y0)), c = document.createElement('canvas');
    c.width = w * scale; c.height = h * scale; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = true;
    g.drawImage(src, x0, y0, w, h, 0, 0, c.width, c.height);
    return c;
  }
  // 上の欄（ヘッダー）のセル：yTop〜yBot の間の横線で帯に分け、帯ごとに縦線で区切る
  function headerCells(lines, xL, xR, yTop, yBot) {
    const hs = lines.H.filter(h => h.y >= yTop - 2 && h.y <= yBot + 2 && h.x1 - h.x0 > (xR - xL) * 0.15).map(h => h.y).sort((a, b) => a - b);
    const ys = []; for (const y of hs) if (!ys.length || y - ys[ys.length - 1] > 8) ys.push(y);
    const cells = [];
    for (let i = 0; i + 1 < ys.length; i++) {
      const y0 = ys[i], y1 = ys[i + 1];
      const xs = lines.V.filter(v => v.y0 <= y0 + 4 && v.y1 >= y1 - 4 && v.x >= xL - 3 && v.x <= xR + 3).map(v => v.x).sort((a, b) => a - b);
      const xx = []; for (const x of xs) if (!xx.length || x - xx[xx.length - 1] > 6) xx.push(x);
      for (let j = 0; j + 1 < xx.length; j++) if (xx[j + 1] - xx[j] > 12) cells.push({ band: i, x0: xx[j], x1: xx[j + 1], y0, y1 });
    }
    return cells;
  }
  // 罫線を白く消した画像（範囲 x0〜x1・y0〜y1 を切り出して scale 倍）
  function eraseLines(src, img, lines, x0, y0, x1, y1, scale) {
    const c = cellCanvas0(src, img, x0, y0, x1, y1, scale), g = c.getContext('2d'); g.fillStyle = '#fff';
    for (const h of lines.H) if (h.y >= y0 - 3 && h.y <= y1 + 3) { const th = Math.max(3, src.width / 400); g.fillRect((h.x0 - x0 - 2) * scale, (h.y - y0 - th / 2) * scale, (h.x1 - h.x0 + 4) * scale, th * scale); }
    for (const v of lines.V) if (v.y1 >= y0 && v.y0 <= y1) { const tv = Math.max(3, src.width / 400); g.fillRect((v.x - x0 - tv / 2) * scale, (v.y0 - y0 - 2) * scale, tv * scale, (v.y1 - v.y0 + 4) * scale); }
    return c;
  }
  G.SpReader = { eraseLines, headerCells, binarize, findLines, markGroups, rows, isDot, isDotAt, dotsInColumn, dark, cellCanvas };
})(window);
