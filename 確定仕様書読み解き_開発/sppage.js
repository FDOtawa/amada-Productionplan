// 確定仕様書の1ページを読む：向きの判定 → 罫線 → ●の行の項目名 → 上の欄（位置の型で切り出して読む）→ 備考
(function (G) {
  const R = G.SpReader;
  const N = s => String(s || '').normalize('NFKC').replace(/\s+/g, '');
  function rotate(cv, deg) {
    const c = document.createElement('canvas'), g = c.getContext('2d');
    if (deg % 180) { c.width = cv.height; c.height = cv.width; } else { c.width = cv.width; c.height = cv.height; }
    g.translate(c.width / 2, c.height / 2); g.rotate(deg * Math.PI / 180); g.drawImage(cv, -cv.width / 2, -cv.height / 2);
    return c;
  }
  function analyzeGrid(cv) {
    const img = R.binarize(cv, 185), unit = Math.round(cv.width / 44);
    const lines = R.findLines(img, Math.round(cv.width * 0.06), Math.round(cv.height * 0.02), 3, 0);
    const groups = R.markGroups(lines.V, unit).filter(g => g.y1 - g.y0 > cv.height * 0.15);
    return { img, lines, groups };
  }
  async function ocrText(worker, canvas, psm, white) {
    if (!(canvas.width > 4 && canvas.height > 4)) return { t: '', raw: '', conf: 0 }; // 空の画像を渡すと読み取りが止まる
    await worker.setParameters({ tessedit_pageseg_mode: String(psm), tessedit_char_whitelist: white || '' });
    const r = await worker.recognize(canvas); return { t: N(r.data.text), raw: r.data.text, conf: r.data.confidence };
  }
  // 上の欄の型（縦の HRB の様式。基準：外枠の左 60・右 1142、上の横線 75、オプションの表の上 425 のときの位置）
  const T = { L: 60, R: 1142, TOP: 75, GY: 425 };
  const BOX = {
    ym: [538, 80, 755, 108], ser: [1012, 80, 1142, 108], country: [862, 186, 1142, 209],
    contract: [192, 163, 625, 208], dest: [192, 255, 625, 300], model: [138, 395, 545, 425], tok: [930, 410, 1142, 429],
  };
  // 読まないページ（2026-10-16 ユーザー指示：ラック登録一覧は読み解きしない）：ページの上の帯（見出し）を読んで見分ける
  const RACK = /ラック|登録一覧|STOCKER|ストッカ/i;
  async function titleOf(worker, cv) {
    const h = Math.round(cv.height * 0.09), c = document.createElement('canvas'); c.width = cv.width; c.height = h;
    c.getContext('2d').drawImage(cv, 0, 0, cv.width, h, 0, 0, cv.width, h);
    return (await ocrText(worker, c, 6)).t;
  }
  // 1ページ分（opts.want(head) が false のページは、上の欄の機種名を読んだところで止める＝HRB・SRB 以外を早く飛ばす）
  async function readPage(worker, cv0, opts) {
    opts = opts || {};
    let cv = cv0, A = analyzeGrid(cv);
    if (!A.groups.length) {
      if (RACK.test(await titleOf(worker, cv0))) return { skip: 'ラック登録一覧（読まない）' };
      for (const d of [90, 270]) {
        const c = rotate(cv0, d), B = analyzeGrid(c); if (!B.groups.length) continue;
        if (RACK.test(await titleOf(worker, c))) return { skip: 'ラック登録一覧（読まない）' };
        cv = c; A = B; break;
      }
    }
    if (!A.groups.length) return { skip: '確定仕様書の表が見つからない' };
    const { img, lines, groups } = A;
    const main = groups.slice().sort((a, b) => a.kx0 - b.kx0)[0];
    const longV = lines.V.filter(v => v.y1 - v.y0 > cv.height * 0.4), longH = lines.H.filter(h => h.x1 - h.x0 > cv.width * 0.5);
    // 外枠：左右は長い横線の端（右の縦線はかすれて見つからないことがある）
    const fL = Math.min(...longH.map(h => h.x0), ...longV.map(v => v.x)), fR = Math.max(...longH.map(h => h.x1));
    const gy = main.y0, fT = Math.min(...longH.filter(h => h.y < gy - 50).map(h => h.y));
    // 外枠（上の欄）が見つからないページは確定仕様書の様式ではない（一覧表など）。そのまま読むと切り出しの大きさがおかしくなる
    if (![fL, fR, fT].every(Number.isFinite) || fR - fL < cv.width * 0.5 || gy - fT < cv.height * 0.08) return { skip: '確定仕様書の様式ではない（上の欄が見つからない）' };
    const box = k => { const [x0, y0, x1, y1] = BOX[k], sx = (fR - fL) / (T.R - T.L), sy = (gy - fT) / (T.GY - T.TOP);
      return [fL + (x0 - T.L) * sx, fT + (y0 - T.TOP) * sy, fL + (x1 - T.L) * sx, fT + (y1 - T.TOP) * sy]; };
    const k1 = cv.width / 1190; // 解像度の倍率（基準 1190px 幅）
    const lv = R.findLines(img, Math.round(70 * k1), Math.round(22 * k1), Math.round(2 * k1), 0);
    const crop = (k, sc) => { const [x0, y0, x1, y1] = box(k); return R.eraseLines(cv, img, lv, Math.max(0, x0 + 2 * k1), Math.max(0, y0 + k1), Math.min(cv.width, x1 - 2 * k1), y1 - k1, (sc || 3) * 2 / Math.max(2, 2 * k1)); };
    const head = {};
    const AN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    { const r = await ocrText(worker, crop('ym'), 7); const m = r.t.match(/(20)?(\d\d)\D{0,2}(\d{1,2})月/); head.ym = m ? `20${m[2]}年${+m[3]}月` : ''; head.ymRaw = r.t; }
    { const r = await ocrText(worker, crop('ser'), 7, AN); const m = r.t.match(/[A-Z]{0,3}\d{5,8}/); head.ser = m ? m[0] : r.t; }
    { const r = await ocrText(worker, crop('model'), 7, AN + '-._'); const t = r.t.replace(/^[^A-Z]*?[I1L]?RB(?=C?\d)/, 'HRB'), m = t.match(/(HRBC|HRB|SRB|HG|EGB)\d{3,4}[A-Z]*/); head.model = m ? m[0] : r.t; }
    if (opts.want && !opts.want(head)) return { head, dots: [], notes: '', rotated: cv !== cv0, early: true };
    { const r = await ocrText(worker, crop('tok'), 7, AN + '-'); const m = r.t.match(/[A-Z]{2,3}\d?-\d{3,5}/); head.tok = m ? m[0] : ''; head.tokRaw = r.t; }
    head.country = (await ocrText(worker, crop('country'), 7)).t;
    // 客先名：日本語の文字の間の空白は消し、英語の単語の間の空白は1つ残す（Amada (India) Pvt. Ltd. など）
    const nameText = r => String(r.raw || '').normalize('NFKC').replace(/\s+/g, ' ').trim().replace(/ (?![!-~])|(?<![!-~]) /g, '');
    head.contract = nameText(await ocrText(worker, crop('contract', 3), 7));
    head.dest = nameText(await ocrText(worker, crop('dest', 3), 7));
    // ●の行の項目名
    const dots = [], dotRows = [];
    for (const g of groups) for (const r of R.rows(img, lines, g)) if (r.dot) dotRows.push(r);
    // 確定仕様書の ● は多くても40ほど。それより多いのは様式の違うページ（読むと時間がかかりすぎる）
    if (dotRows.length > 80) return { skip: `確定仕様書の様式ではない（●が${dotRows.length}個）`, head };
    for (const r of dotRows) {
      dots.push((await ocrText(worker, R.cellCanvas(cv, img, r.lx0, r.y0 + k1, r.lx1, r.y1 - k1, 2), 6)).t);
    }
    // 備考・製造指示追記情報：表の右側の下半分を読む
    const mr = R.rows(img, lines, main), tableRight = mr.length ? Math.max(...mr.map(r => r.lx1)) : cv.width / 2;
    const notes = (await ocrText(worker, R.eraseLines(cv, img, lv, tableRight + 6 * k1, Math.round(gy + (cv.height - gy) * 0.4), fR - 4 * k1, cv.height - 30 * k1, 2 / k1 * 1.3), 6)).t;
    return { head, dots, notes, rotated: cv !== cv0 };
  }
  G.SpPage = { readPage, rotate };
})(window);
