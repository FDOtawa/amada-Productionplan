// 確定仕様書の1ページを読む：向きの判定 → 罫線 → ●の行の項目名 → 上の欄（位置の型で切り出して読む）→ 備考
// 縦の様式と横向きの様式（HRB大型など。2026-10-22 追加）の両方を読む。様式は回したあとの紙の縦横で見分ける
(function (G) {
  const R = G.SpReader;
  const N = s => String(s || '').normalize('NFKC').replace(/\s+/g, '');
  function rotate(cv, deg) {
    const c = document.createElement('canvas'), g = c.getContext('2d');
    if (deg % 180) { c.width = cv.height; c.height = cv.width; } else { c.width = cv.width; c.height = cv.height; }
    g.translate(c.width / 2, c.height / 2); g.rotate(deg * Math.PI / 180); g.drawImage(cv, -cv.width / 2, -cv.height / 2);
    g.setTransform(1, 0, 0, 1, 0, 0); // 回転の設定を戻す（残すと、あとで描く印が回った位置に出る。2026-10-24）
    return c;
  }
  function analyzeGrid(cv) {
    // 細い列の幅の目安は紙の短い辺から（横向きの様式でも列の幅は縦の様式と同じ。2026-10-22）
    const img = R.binarize(cv, 185), unit = Math.round(Math.min(cv.width, cv.height) / 44);
    const lines = R.findLines(img, Math.round(cv.width * 0.06), Math.round(cv.height * 0.02), 3, 0);
    const all = R.markGroups(lines.V, unit).filter(g => g.y1 - g.y0 > cv.height * 0.15);
    // 同じ位置の組が「長いもの」と「途中からのもの」の2つ見つかることがある → 長い方だけ残す（2026-10-24：HG 22402974 で表の上端を見誤った）
    const len = g => g.y1 - g.y0;
    const groups = all.filter((g, i) => !all.some((o, j) => j !== i && Math.abs(o.kx0 - g.kx0) < 6 && o.y0 <= g.y0 + 2 && o.y1 >= g.y1 - 2 && (len(o) > len(g) || (len(o) === len(g) && j < i))));
    return { img, lines, groups };
  }
  // 確定仕様書の向きとして正しいか：「改訂・確定・販売」の列が左端にあり、「確定」の列に ● があり、上の欄の外枠が見つかる。
  // 横向きのページは回す前でも表の横線が縦線に見えて列の組と間違えることがあり、逆さま（270°）だと列の組が右に来るので、ここで外す（2026-10-22）
  function frameOf(cv, A) {
    if (!A.groups.length) return null;
    const { img, lines, groups } = A, main = groups.slice().sort((a, b) => a.kx0 - b.kx0)[0];
    const dots = R.dotsInColumn(img, main).length;
    if (main.kx0 > cv.width * 0.3 || dots < 3) return null;
    const longV = lines.V.filter(v => v.y1 - v.y0 > cv.height * 0.4), longH = lines.H.filter(h => h.x1 - h.x0 > cv.width * 0.5);
    // 外枠：左右は長い横線の端（右の縦線はかすれて見つからないことがある）
    const fL = Math.min(...longH.map(h => h.x0), ...longV.map(v => v.x)), fR = Math.max(...longH.map(h => h.x1));
    const gy = main.y0, fT = Math.min(...longH.filter(h => h.y < gy - 50).map(h => h.y));
    // 外枠（上の欄）が見つからないページは確定仕様書の様式ではない（一覧表など）。そのまま読むと切り出しの大きさがおかしくなる
    if (![fL, fR, fT].every(Number.isFinite) || fR - fL < cv.width * 0.5 || gy - fT < cv.height * 0.08) return null;
    return { main, fL, fR, fT, gy, dots };
  }
  async function ocrText(worker, canvas, psm, white) {
    if (!(canvas.width > 4 && canvas.height > 4)) return { t: '', raw: '', conf: 0 }; // 空の画像を渡すと読み取りが止まる
    await worker.setParameters({ tessedit_pageseg_mode: String(psm), tessedit_char_whitelist: white || '' });
    const r = await worker.recognize(canvas); return { t: N(r.data.text), raw: r.data.text, conf: r.data.confidence };
  }
  // 上の欄の型（縦の HRB の様式。基準：外枠の左 60・右 1142、上の横線 75、オプションの表の上 425 のときの位置）
  // 横向きの様式（HRB大型「20_HRB3506国内標準」など。2026-10-22）：基準 外枠の左 100・右 2365、上の横線 146、表の上 556（3倍の画像で 90°回したときの位置）
  const FORMS = {
    portrait: { T: { L: 60, R: 1142, TOP: 75, GY: 425 }, BOX: {
      ym: [538, 80, 755, 108], ser: [1012, 80, 1142, 108], country: [862, 186, 1142, 209],
      contract: [192, 163, 625, 208], dest: [192, 255, 625, 300], model: [138, 395, 545, 425], tok: [930, 410, 1142, 429] } },
    landscape: { T: { L: 100, R: 2365, TOP: 146, GY: 556 }, BOX: {
      // country2：海外向けの HG の様式（「110_HG2204ATC 海外標準仕様」など）は国名が「仕向仕様」の下にある（2026-10-24）
      ym: [868, 146, 1224, 201], ser: [1611, 146, 1794, 201], country: [1886, 274, 2160, 341], country2: [1546, 378, 1778, 440],
      contract: [290, 280, 925, 338], dest: [290, 381, 925, 440], model: [195, 483, 623, 555], tok: [1082, 521, 1326, 555] } },
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
    // 向き：そのまま・90°・270° を全部試し、確定仕様書として正しい向き（frameOf）のうち「確定」の列の ● がいちばん多い向きを使う（横向きの様式も読む。2026-10-22）
    // 横向きのページは回す前でも表の横線が縦線に見え、● が3つほどある列の組と間違えることがあるので、最初に通った向きでは決めない（2026-10-24：HG の p8・p14・p15）
    let cv = null, A = null, F = null, anyGroups = false;
    for (const d of [0, 90, 270]) {
      const c = d ? rotate(cv0, d) : cv0, B = analyzeGrid(c), G2 = frameOf(c, B);
      if (B.groups.length) anyGroups = true;
      if (G2 && (!F || G2.dots > F.dots)) { cv = c; A = B; F = G2; }
    }
    if (!F) {
      // ラック登録一覧（2026-10-16 ユーザー指示：読まない）は、そのままの向きか 90°回した向きの見出しで見分ける
      if (RACK.test(await titleOf(worker, cv0)) || RACK.test(await titleOf(worker, rotate(cv0, 90)))) return { skip: 'ラック登録一覧（読まない）' };
      return { skip: anyGroups ? '確定仕様書の様式ではない（上の欄が見つからない）' : '確定仕様書の表が見つからない' };
    }
    const { img, lines, groups } = A, { main, fL, fR, fT, gy } = F;
    const form = cv.width > cv.height ? 'landscape' : 'portrait', { T, BOX } = FORMS[form];
    const box = k => { const [x0, y0, x1, y1] = BOX[k], sx = (fR - fL) / (T.R - T.L), sy = (gy - fT) / (T.GY - T.TOP);
      return [fL + (x0 - T.L) * sx, fT + (y0 - T.TOP) * sy, fL + (x1 - T.L) * sx, fT + (y1 - T.TOP) * sy]; };
    const k1 = Math.min(cv.width, cv.height) / 1190; // 解像度の倍率（基準：紙の短い辺が 1190px）
    const lv = R.findLines(img, Math.round(70 * k1), Math.round(22 * k1), Math.round(2 * k1), 0);
    // k は型の名前か [x0, y0, x1, y1]（name は確認用の名前）
    const crop = (k, sc, name) => { const [x0, y0, x1, y1] = Array.isArray(k) ? k : box(k), c = R.eraseLines(cv, img, lv, Math.max(0, x0 + 2 * k1), Math.max(0, y0 + k1), Math.min(cv.width, x1 - 2 * k1), y1 - k1, (sc || 3) * 2 / Math.max(2, 2 * k1));
      if (opts.debug) (opts.crops = opts.crops || {})[name || k] = c.toDataURL(); return c; }; // opts.debug：切り出した画像を opts.crops に残す（確認用）
    // 横向きの様式の特殊機№：機種名の行の縦線から欄を探す（HRB大型・HG の国内向け・海外向けで位置が違う。2026-10-24）
    // 外枠の幅の 42% より右にある最初の縦線が特殊機№の左端、次の縦線が右端。見つからなければ型の位置
    const tokBox = () => {
      if (form !== 'landscape') return 'tok';
      const xs = lines.V.filter(v => v.y0 <= gy - 25 * k1 && v.y0 >= gy - 120 * k1 && v.y1 >= gy - 8 * k1).map(v => v.x).sort((a, b) => a - b);
      const l = xs.find(x => x > fL + 0.42 * (fR - fL)), r = l === undefined ? undefined : xs.find(x => x > l + 50 * k1);
      if (r === undefined) return 'tok';
      const [, y0, , y1] = box('tok'); return [l, y0, r, y1];
    };
    const head = {};
    const AN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    { const r = await ocrText(worker, crop('ym'), 7); const m = r.t.match(/(20)?(\d\d)\D{0,2}(\d{1,2})月/); head.ym = m ? `20${m[2]}年${+m[3]}月` : ''; head.ymRaw = r.t; }
    { const r = await ocrText(worker, crop('ser'), 7, AN); const m = r.t.match(/[A-Z]{0,3}\d{5,8}/); head.ser = m ? m[0] : r.t; }
    { const r = await ocrText(worker, crop('model'), 7, AN + '-._'); const t = r.t.replace(/^[^A-Z]*?[I1L]?RB(?=C?\d)/, 'HRB'), m = t.match(/(HRBC|HRB|SRB|HG|EGB)\d{3,4}[A-Z]*/); head.model = m ? m[0] : r.t; }
    if (opts.want && !opts.want(head)) return { head, dots: [], notes: '', rotated: cv !== cv0, form, early: true };
    { const r = await ocrText(worker, crop(tokBox(), 3, 'tok'), 7, AN + '-'); const m = r.t.match(/[A-Z]{2,3}\d?-\d{3,5}/); head.tok = m ? m[0] : ''; head.tokRaw = r.t; }
    head.country = (await ocrText(worker, crop('country'), 7)).t;
    if (BOX.country2) head.country2 = (await ocrText(worker, crop('country2'), 7)).t; // どちらの国名を使うかは判定（SpJudge）で決める
    // 客先名：日本語の文字の間の空白は消し、英語の単語の間の空白は1つ残す（Amada (India) Pvt. Ltd. など）
    const nameText = r => String(r.raw || '').normalize('NFKC').replace(/\s+/g, ' ').trim().replace(/ (?![!-~])|(?<![!-~]) /g, '');
    head.contract = nameText(await ocrText(worker, crop('contract', 3), 7));
    head.dest = nameText(await ocrText(worker, crop('dest', 3), 7));
    // ●の行の項目名
    const dots = [], dotRows = [];
    for (const g of groups) for (const r of R.rows(img, lines, g)) if (r.dot) dotRows.push(r);
    // 確定仕様書の ● は多くても40ほど。それより多いのは様式の違うページ（読むと時間がかかりすぎる）
    if (dotRows.length > 80) return { skip: `確定仕様書の様式ではない（●が${dotRows.length}個）`, head, form };
    // 横向きの様式は行が細く文字が小さいので、大きめに拡大して読む（2026-10-22）
    const dotScale = form === 'landscape' ? 3 : 2;
    for (const r of dotRows) {
      dots.push((await ocrText(worker, R.cellCanvas(cv, img, r.lx0, r.y0 + k1, r.lx1, r.y1 - k1, dotScale), 6)).t);
    }
    // 備考・製造指示追記情報：表の右側の下半分を読む（横向きの様式は「製造指示追記情報」が表の右の真ん中あたりにあるので、上の 1/4 から）
    const mr = R.rows(img, lines, main), tableRight = mr.length ? Math.max(...mr.map(r => r.lx1)) : cv.width / 2;
    const ny = Math.round(gy + (cv.height - gy) * (form === 'landscape' ? 0.25 : 0.4));
    const notes = (await ocrText(worker, R.eraseLines(cv, img, lv, tableRight + 6 * k1, ny, fR - 4 * k1, cv.height - 30 * k1, 2 / k1 * 1.3), 6)).t;
    // 印を付けるための位置（2026-10-24 ユーザー指示：読み解き済みの PDF に、実装の行を黄色で塗り、条件で付けた OP を赤字で書く）
    // rows：● の行（dots と同じ順）のオプション名の欄（行の中の最初の区切り線まで）／slots：オプションの表の最終行のあとの空いた行
    // 欄の区切り線は行の上端から下端までつながっている（文字の縦線は上下に余白がある）ので、ほぼ全部が黒い縦の列を区切り線とみなす
    const nameRight = r => { for (let x = Math.round(r.lx0 + 40 * k1); x < r.lx1 - 4; x++) if (R.dark(img, x, r.y0 + 1, x + 1, r.y1 - 1) > 0.95 || R.dark(img, x - 1, r.y0 + 1, x + 2, r.y1 - 1) > 0.9) return x; return r.lx1; };
    const inkOf = r => R.dark(img, r.lx0 + 6 * k1, r.y0 + 4, Math.min(r.lx1, r.lx0 + 600 * k1) - 6 * k1, r.y1 - 4);
    let lastUsed = -1; mr.forEach((r, i) => { if (inkOf(r) > 0.004) lastUsed = i; });
    const geom = {
      w: cv.width, h: cv.height,
      rows: dotRows.map(r => ({ x0: r.lx0, y0: r.y0, x1: nameRight(r), y1: r.y1 })),
      slots: mr.slice(lastUsed + 1).map(r => ({ x0: r.lx0, y0: r.y0, x1: r.lx1, y1: r.y1 })),
      rowH: mr.length ? mr.map(r => r.y1 - r.y0).sort((a, b) => a - b)[mr.length >> 1] : 26 * k1,
      bottom: mr.length ? mr[mr.length - 1].y1 : cv.height - 60 * k1, left: mr.length ? mr[0].lx0 : fL,
    };
    return { head, dots, notes, rotated: cv !== cv0, form, geom, canvas: opts.keepCanvas ? cv : undefined };
  }
  G.SpPage = { readPage, rotate };
})(window);
