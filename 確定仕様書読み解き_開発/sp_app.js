// ===== 確定仕様書読み解き HRB・SRB（2026-10-16 組み込み）：PDF（スキャン画像）を1ページずつ読み、OP一覧のきまりで帳票を作る =====
// 読み取りの部品：SpReader（罫線・●）／SpPage（1ページを読む）／SpJudge（● の項目から OP の「1」を決める）。ライブラリは pdf.js・tesseract.js（オフライン版は埋め込み）
const SP_LIBCFG = window.SP_LIB || {};
async function spLibText(k){
  if (SP_LIBCFG.inline) return document.getElementById('lib-' + k).textContent;
  const r = await fetch(SP_LIBCFG[k]); if (!r.ok) throw new Error(`${k} を読み込めません`); return r.text();
}
async function spLibB64(k){ // 文字にした中身（base64）
  if (SP_LIBCFG.inline) return document.getElementById('lib-' + k).textContent.trim();
  const r = await fetch(SP_LIBCFG[k]); if (!r.ok) throw new Error(`${k} を読み込めません`);
  const u = new Uint8Array(await r.arrayBuffer()); let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}
// 文字の読み取り（tesseract）は一度作ったら使い回す。時間短縮のため、いくつか作って複数のページを同時に読む（2026-10-27 ユーザー指示「70枚で25分 → 3分ほどに」）
// 数は PC の CPU の数から（1つは画面と画像の処理に残す。多すぎるとメモリを使うので4まで）
const SP_WORKERS = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1));let spOcr = null, spTw = null;
async function spMakeWorker(){
  if (!spTw) {
    // 本体（core）・日本語の学習データ・worker を1つのスクリプトにする（オフラインでも外から読み込まないように）。
    // 学習データは worker の中の fetch を差し替えて渡す（langPath の http://sp-offline はダミー）
    const feed = `;(function(){var b=atob(${JSON.stringify(await spLibB64('jpn'))}),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);b=null;
var of=self.fetch;self.fetch=function(x,o){return /traineddata/.test(String(x))?Promise.resolve(new Response(u.slice(0))):of(x,o);};})();\n`;
    spTw = URL.createObjectURL(new Blob([await spLibText('tessCore'), '\n;\n', feed, await spLibText('tessWorker')], { type: 'text/javascript' }));
  }
  const mk = Tesseract.createWorker('jpn', 1, { workerPath: spTw, workerBlobURL: false, langPath: 'http://sp-offline', cacheMethod: 'none', gzip: true, errorHandler: () => {} });
  return Promise.race([mk, new Promise((_, ng) => setTimeout(() => ng(new Error('文字の読み取りの準備ができませんでした')), 90000))]);
}
async function spEngine(){
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([await spLibText('pdfWorker')], { type: 'text/javascript' }));
  if (spOcr) return spOcr;
  const first = await spMakeWorker(); // 1つ目で学習データなどの準備を済ませてから、残りを同時に作る
  spOcr = [first, ...await Promise.all(Array.from({ length: SP_WORKERS - 1 }, spMakeWorker))];
  return spOcr;
}
const spIsHRB = h => /^(HRBC|HRB|SRB)\d/.test(String((h && h.model) || '').normalize('NFKC').replace(/\s+/g, '').toUpperCase());
let spCancel = false;
function spProg(title, sub, frac){
  $('spProg').hidden = false; $('spProgTitle').textContent = title; $('spProgSub').textContent = sub || '';
  $('spProgBar').style.width = Math.round(Math.max(0, Math.min(1, frac || 0)) * 100) + '%';
}
$('spProgStop').addEventListener('click', () => { spCancel = true; $('spProgSub').textContent = '中止しています（今のページを読み終えたら止まります）…'; });

// 帳票（Excel）：1〜3行目が見出し（基本の列・OP の区分・OP名）、4行目から1シリアル1行。右端に備考欄。2枚目に読み取りの記録
// 客先は出さない（2026-10-27 ユーザー指示：PDF の文字のつぶれで読み違いが多く、帳票の正解率が下がるため）
const SP_BASE = ['ｱﾏﾀﾞ生産月', '機種名', 'ｼﾘｱﾙ', '仕向', '国名'];
const SP_GRP_FILL = { 'HRB小型・中型': 'FFFFF2CC', 'HRB大型': 'FFE2EFDA', 'SRB': 'FFFCE4D6', '全品': 'FFEDEDED', 'HG': 'FFDDEBF7' };
function spBuildXlsx(rows, log, OPS = SP_HRB_OPS){
  const c0 = SP_BASE.length, last = c0 + OPS.length, W = last + 1;
  const blank = () => Array(W).fill('');
  const r1 = blank(), r2 = blank(), r3 = blank();
  SP_BASE.forEach((h, i) => r1[i] = h); r1[c0] = 'OP'; r1[last] = '備考欄';
  const merges = SP_BASE.map((h, i) => ({ s: { r: 0, c: i }, e: { r: 2, c: i } }));
  merges.push({ s: { r: 0, c: c0 }, e: { r: 0, c: last - 1 } }, { s: { r: 0, c: last }, e: { r: 2, c: last } });
  let st = c0;
  OPS.forEach((op, k) => {
    const c = c0 + k; r3[c] = op.name;
    if (k === 0 || OPS[k - 1].grp !== op.grp) { r2[c] = op.grp; st = c; }
    if (k === OPS.length - 1 || OPS[k + 1].grp !== op.grp) { if (c > st) merges.push({ s: { r: 1, c: st }, e: { r: 1, c } }); }
  });
  const data = rows.map(x => { const a = [x.ym, x.name, x.ser, x.shimuke, x.country]; OPS.forEach(op => a.push(x.f[op.no] ? 1 : '')); a.push(x.biko || ''); return a; });
  const ws = XLSX.utils.aoa_to_sheet([r1, r2, r3, ...data]);
  ws['!merges'] = merges;
  const tw = s => [...String(s)].reduce((n, ch) => n + (/[\u0000-ÿ｡-ﾟ]/.test(ch) ? 1.2 : 2.2), 0);
  ws['!cols'] = [...SP_BASE.map((h, i) => ({ wch: Math.min(60, Math.max(tw(h), ...data.map(a => tw(a[i]))) + 3) })), ...OPS.map(() => ({ wch: 4.2 })), { wch: Math.max(12, ...data.map(a => tw(a[last]) + 2)) }];
  ws['!rows'] = [{ hpt: 20 }, { hpt: 30 }, { hpt: 150 }];
  const MG = { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 }; ws['!margins'] = MG;
  const lg = XLSX.utils.aoa_to_sheet([['ファイル', 'ページ', '結果', 'ｼﾘｱﾙ', '機種名', '理由・メモ', '● の行（読み取った文字）'],
    ...log.map(l => [l.file, l.page, l.result, l.ser || '', l.model || '', l.memo || '', l.dots || ''])]);
  lg['!margins'] = MG;
  lg['!cols'] = [{ wch: 34 }, { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 40 }, { wch: 80 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '確定仕様書読み解き');
  XLSX.utils.book_append_sheet(wb, lg, '読み取りの記録');
  wb.Workbook = { Names: [{ Name: '_xlnm.Print_Titles', Sheet: 0, Ref: "'確定仕様書読み解き'!$1:$3" }, { Name: '_xlnm.Print_Titles', Sheet: 1, Ref: "'読み取りの記録'!$1:$1" }] };
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  try { return spStyle(out, c0, last, OPS); } catch (e) { return out; } // 書式に失敗しても中身は保存できるように
}
// 書式（罫線・見出しの色・OP名の縦書き・中央ぞろえ・枠の固定・A4横）。SheetJS（無償版）は書式を書けないので XML を直す
function spStyle(data, c0, last, OPS){
  const zip = XLSX.CFB.read(new Uint8Array(data), { type: 'buffer' }), dec = e => new TextDecoder().decode(e.content), enc = (e, s) => { e.content = new TextEncoder().encode(s); e.size = e.content.length; };
  const st = XLSX.CFB.find(zip, '/xl/styles.xml'); let sx = dec(st);
  const thin = '<border><left style="thin"><color rgb="FF808080"/></left><right style="thin"><color rgb="FF808080"/></right><top style="thin"><color rgb="FF808080"/></top><bottom style="thin"><color rgb="FF808080"/></bottom><diagonal/></border>';
  let bId = 0, fId = 0, boldId = 0;
  sx = sx.replace(/<borders count="(\d+)">([\s\S]*?)<\/borders>/, (m, n, b) => { bId = +n; return `<borders count="${+n + 1}">${b}${thin}</borders>`; });
  const fills = ['FFDDEBF7', ...Object.values(SP_GRP_FILL)], fill = rgb => `<fill><patternFill patternType="solid"><fgColor rgb="${rgb}"/><bgColor indexed="64"/></patternFill></fill>`;
  sx = sx.replace(/<fills count="(\d+)">([\s\S]*?)<\/fills>/, (m, n, b) => { fId = +n; return `<fills count="${+n + fills.length}">${b}${fills.map(fill).join('')}</fills>`; });
  sx = sx.replace(/<fonts count="(\d+)"([^>]*)>([\s\S]*?)<\/fonts>/, (m, n, a, b) => { boldId = +n; const f0 = (b.match(/<font\b[\s\S]*?<\/font>/) || ['<font><sz val="11"/></font>'])[0]; return `<fonts count="${+n + 1}"${a}>${b}${f0.replace('<font>', '<font><b/>')}</fonts>`; });
  if (!bId || !fId || !boldId) return data;
  const xfs = [], xf = (fillN, bold, al) => { xfs.push(`<xf numFmtId="0" fontId="${bold ? boldId : 0}" fillId="${fillN == null ? 0 : fId + fillN}" borderId="${bId}" xfId="0" applyBorder="1"${fillN == null ? '' : ' applyFill="1"'}${bold ? ' applyFont="1"' : ''}${al ? ` applyAlignment="1"><alignment ${al}/></xf>` : '/>'}`); return xfs.length - 1; };
  const C = 'horizontal="center" vertical="center" wrapText="1"';
  const S = { data: xf(null, false, 'vertical="center"'), flag: xf(null, false, 'horizontal="center" vertical="center"'), head: xf(0, true, C), grp: {}, rot: {} };
  Object.keys(SP_GRP_FILL).forEach((g, i) => { S.grp[g] = xf(i + 1, true, C); S.rot[g] = xf(i + 1, true, C + ' textRotation="255"'); });
  let base = 0;
  sx = sx.replace(/<cellXfs count="(\d+)">([\s\S]*?)<\/cellXfs>/, (m, n, b) => { base = +n; return `<cellXfs count="${+n + xfs.length}">${b}${xfs.join('')}</cellXfs>`; });
  enc(st, sx);
  const col = s => [...s].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  const grpOf = c => (OPS[c - c0] || {}).grp;
  const s1 = XLSX.CFB.find(zip, '/xl/worksheets/sheet1.xml'); let x1 = dec(s1);
  x1 = x1.replace(/<c r="([A-Z]+)(\d+)"([^>]*?)(\/?)>/g, (m, cl, rw, attrs, close) => {
    const c = col(cl), r = +rw; let s;
    if (r === 1) s = S.head;
    else if (r <= 3) s = c >= c0 && c < last ? (r === 2 ? S.grp[grpOf(c)] : S.rot[grpOf(c)]) : S.head;
    else s = c >= c0 && c < last ? S.flag : S.data;
    if (s === undefined) s = r <= 3 ? S.head : S.data;
    attrs = attrs.replace(/\s*\bs="\d+"/, '');
    return `<c r="${cl}${rw}"${attrs} s="${base + s}"${close}>`;
  });
  const top = XLSX.utils.encode_cell({ r: 3, c: c0 });
  x1 = x1.replace(/<sheetView\b[^>]*?(\/>|>[\s\S]*?<\/sheetView>)/, `<sheetView workbookViewId="0"><pane xSplit="${c0}" ySplit="3" topLeftCell="${top}" activePane="bottomRight" state="frozen"/><selection pane="bottomRight" activeCell="${top}" sqref="${top}"/></sheetView>`);
  const page = (x, orient) => {
    x = /<sheetPr[\s>\/]/.test(x) ? x.replace(/<sheetPr(\s[^>]*)?\/>/, '<sheetPr$1><pageSetUpPr fitToPage="1"/></sheetPr>') : x.replace(/(<worksheet[^>]*>)/, '$1<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>');
    return x.replace(/(<pageMargins[^>]*\/>)/, `$1<pageSetup paperSize="9" orientation="${orient}" fitToWidth="1" fitToHeight="0"/><headerFooter><oddFooter>&amp;C&amp;P / &amp;N</oddFooter></headerFooter>`);
  };
  enc(s1, page(x1, 'landscape'));
  const s2 = XLSX.CFB.find(zip, '/xl/worksheets/sheet2.xml');
  if (s2) enc(s2, page(dec(s2).replace(/<c r="([A-Z]+)(\d+)"([^>]*?)(\/?)>/g, (m, cl, rw, attrs, close) => `<c r="${cl}${rw}"${attrs.replace(/\s*\bs="\d+"/, '')} s="${base + (+rw === 1 ? S.head : S.data)}"${close}>`), 'landscape'));
  return XLSX.CFB.write(zip, { fileType: 'zip', type: 'array' });
}

// 読み解きの本体（機種ごとの違いは K：label・want（読むページの機種）・judge・ops。HRB・SRB と HG（2026-10-24）で共通）
async function spRunSpec(files, K){
  const pdfs = files.filter(f => f.kind === 'pdf'), xls = files.filter(f => f.kind !== 'pdf');
  if (!pdfs.length) { showErr('読み解きを開始できません', [{ cause: 'PDF の確定仕様書がありません', fix: `${K.label} の読み解きは、今は PDF だけに対応しています（Excel の確定仕様書はまだ読めません）` }]); return; }
  spCancel = false;
  const rows = [], log = [], seen = new Map(), notes = [], marked = []; // marked：読み解き済みの PDF（取り込んだ PDF ごと）
  const t0 = Date.now();
  try {
    spProg('読み取りの準備をしています', '最初の1回だけ、少し時間がかかります', 0);
    const nt = document.querySelector('#spProg .spp-note'); // 進み具合の画面の説明（2026-10-27：同時に読むようにした）
    if (nt) nt.textContent = 'いくつかのページを同時に読み取っています。読み終わると保存の画面が開きます。読み取り中はほかの操作はできません。';
    const ocr = await spEngine();
    // ページ数を先に数える（進み具合の表示のため）
    const docs = [];
    for (const f of pdfs) docs.push({ f, pdf: await pdfjsLib.getDocument({ data: new Uint8Array(await f.file.arrayBuffer()) }).promise });
    const total = docs.reduce((n, d) => n + d.pdf.numPages, 0);
    const render = async (d, n) => {
      const pg = await d.pdf.getPage(n), vp = pg.getViewport({ scale: 3 }), c = document.createElement('canvas');
      c.width = vp.width; c.height = vp.height;
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      await pg.render({ canvasContext: g, viewport: vp }).promise; pg.cleanup(); return c;
    };
    // 1ページ分：読む → 判定 → 読み解き済みの PDF のページ（2026-10-24 ユーザー指示：帳票に出すページは実装の行を黄色、条件で付けた OP を赤字。ほかのページはそのまま）
    // 「別紙仕様書」探し（赤字の場所）は赤字を書くページだけ（2026-10-27）
    const readOne = async (wi, d, n) => {
      const c = await render(d, n);
      const work = async () => {
        const p = await SpPage.readPage(ocr[wi], c, { want: K.want, keepCanvas: true, noNotes: K.noNotes, known: K.known, countryW: K.countryW }), row = K.judge(p);
        const pl = !row.skip && p.canvas && p.geom ? SpMark.plan(p, K.judge, K.ops) : null;
        if (pl && pl.cond.length) await p.geom.locate();
        return { p, row, pl };
      };
      // 1ページに時間がかかりすぎたら（読み取りが止まったら）、その読み取りを作り直してそのページは飛ばす
      let r, tm; try { r = await Promise.race([work(), new Promise((_, ng) => tm = setTimeout(() => ng(new Error('timeout')), 120000))]); }
      catch (e) {
        if (e && e.message === 'timeout') { try { await ocr[wi].terminate(); } catch (x) {} ocr[wi] = await spMakeWorker(); r = { p: { skip: '読み取りに時間がかかりすぎたため飛ばした' } }; }
        else r = { p: { skip: '読み取りエラー（' + (e && e.message || e) + '）' } };
        r.row = K.judge(r.p);
      } finally { clearTimeout(tm); }
      const { p } = r;
      let cv = c; if (r.pl) { SpMark.draw(p.canvas, p.geom, r.pl); cv = p.canvas; }
      r.jpg = await SpMark.page(cv); r.drawn = !!r.pl;
      c.width = c.height = 0; if (p.canvas) p.canvas.width = p.canvas.height = 0; p.canvas = null;
      return r;
    };
    // 複数のページを同時に読む（読み取りの数だけ）。結果はページの順にまとめる
    const tasks = []; docs.forEach(d => { for (let n = 1; n <= d.pdf.numPages; n++) tasks.push({ d, n }); });
    const res = new Array(tasks.length); let next = 0, done = 0;
    const prog = t => { const left = done ? Math.round((Date.now() - t0) / done * (total - done) / 1000) : 0;
      spProg(`確定仕様書を読み解いています（${done} / ${total} ページ）`, (t ? `ファイル${docs.indexOf(t.d) + 1}「${t.d.f.name}」 ${t.n} / ${t.d.pdf.numPages} ページまで` : `${ocr.length}ページずつ同時に読んでいます`) + (left ? `　残り 約${left >= 60 ? Math.ceil(left / 60) + '分' : left + '秒'}` : ''), done / total); };
    prog(null);
    await Promise.all(ocr.map(async (_, wi) => {
      while (next < tasks.length) {
        if (spCancel) throw new Error('cancel');
        const i = next++, t = tasks[i];
        res[i] = await readOne(wi, t.d, t.n); done++; prog(t);
      }
    }));
    if (spCancel) throw new Error('cancel');
    let i = 0;
    for (const [fi, d] of docs.entries()) {
      const pages = []; let used = 0; // このファイルの読み解き済みの PDF のページと、帳票に出したページの数（2026-10-24）
      for (let n = 1; n <= d.pdf.numPages; n++, i++) {
        const { p, row, jpg, drawn } = res[i], h = p.head || {};
        const L = { file: d.f.name, page: n, ser: row.ser || h.ser, model: h.model, dots: (p.dots || []).join(' ／ ') };
        let use = false;
        if (row.skip) { L.result = '読まない'; L.memo = row.skip; }
        else if (seen.has(row.ser)) { L.result = '重なり'; L.memo = `同じシリアルが ${seen.get(row.ser)} にもあるため、先のページを使いました`; }
        else { seen.set(row.ser, `${d.f.name} の ${n}ページ`); row.cust = hankakuName(row.cust); rows.push(row); L.result = '帳票に出した'; L.memo = row.biko || ''; use = true; used++; }
        log.push(L);
        // 重なりのページは印を付けない（めったに無いので、そのときだけ読み直して印の無いページにする）
        pages.push(drawn && !use ? await SpMark.page(await render(d, n)) : jpg);
      }
      d.pdf.destroy();
      // 帳票に1行も出さなかったファイル（選んだ機種のページが無い）は、読み解き済みの PDF を作らない
      if (used) marked.push({ base: d.f.name.replace(/\.pdf$/i, '') + ' 読み解き済み', ext: '.pdf', type: 'application/pdf', data: SpMark.pdf(pages) });
    }
  } catch (e) {
    $('spProg').hidden = true;
    if (e && e.message === 'cancel') { showErr('読み解きを中止しました', [{ cause: '「中止」が押されました', fix: 'もう一度「読み解き開始」を押すと、最初から読み直します' }]); return; }
    showErr('読み解きができません', [{ cause: `確定仕様書を読み取れませんでした（${(e && e.message) || e}）`, fix: 'ファイルが壊れていないか確かめてください。直らないときは、アプリを開き直してから試してください' }]);
    return;
  }
  $('spProg').hidden = true;
  if (!rows.length) { showErr('保存できるデータがありません', [{ cause: `${K.label} の確定仕様書のページが見つかりませんでした`, fix: `取り込んだ PDF が ${K.label} の確定仕様書か確かめてください（ページごとの結果は記録に残りません）` }]); return; }
  // 生産年月が読めなかった行は、同じ読み解きのほかの行でいちばん多い生産年月で補う（2026-10-24：HG 22402975）
  const ymCount = {}; rows.forEach(r => { if (r.ym) ymCount[r.ym] = (ymCount[r.ym] || 0) + 1; });
  const ymTop = Object.keys(ymCount).sort((a, b) => ymCount[b] - ymCount[a])[0];
  const ymFilled = rows.filter(r => !r.ym && ymTop).map(r => (r.ym = ymTop, r.ser));
  if (ymFilled.length) notes.push(['warn', `生産年月が読めなかった行（${ymFilled.join('・')}）は「${ymTop}」にしました。確定仕様書と見比べてください`]);
  const skipped = log.filter(l => l.result === '読まない'), dup = log.filter(l => l.result === '重なり');
  const why = {}; skipped.forEach(l => { const k = l.memo.replace(/（.*$/, '').replace(/^.+ 以外（.*$|^.+ 以外$/, `${K.label} 以外の機種`); why[k] = (why[k] || 0) + 1; });
  if (skipped.length) notes.push(['info', `読まなかったページ ${skipped.length}：` + Object.entries(why).map(([k, n]) => `${k} ${n}`).join('、')]);
  if (dup.length) notes.push(['info', `同じシリアルのページが ${dup.length} あり、先のページを使いました`]);
  if (xls.length) notes.push(['warn', `Excel の確定仕様書（${xls.map(f => f.name).join('、')}）は、まだ読めないため使っていません`]);
  const am = rows.filter(r => r.biko).length;
  if (am) notes.push(['warn', `備考欄に記載のある行が ${am} 件あります（ｱﾝﾏｯﾁ有など）。確定仕様書と見比べてください`]);
  notes.push(['info', '国名・OP は文字の読み取りです。読み違いが無いか帳票で確かめてください（2枚目のシート「読み取りの記録」にページごとの結果があります）']);
  const mb = marked.reduce((s, m) => s + m.data.length, 0) / 1048576;
  notes.push(['info', `読み解き済みの PDF（${marked.length}つ・計 ${mb.toFixed(1)}MB）も同じフォルダに保存します：${marked.map(m => m.base + '.pdf').join('、')}。実装と判断した行は黄色、● ではなく条件で付けた OP は赤字です`]);
  // 保存ファイル名（2026-10-16 ユーザー指示）：「ボタン名 確定仕様書読み解き 客先の生産月」。生産月が複数あれば「早い月〜遅い月」
  const yk = t => { const m = String(t || '').match(/(\d{4})年(\d{1,2})月/); return m ? +m[1] * 100 + +m[2] : 0; };
  const yms = [...new Set(rows.map(r => r.ym).filter(yk))].sort((a, b) => yk(a) - yk(b));
  const ym = yms.length ? ' ' + (yms.length > 1 ? `${yms[0]}〜${yms[yms.length - 1]}` : yms[0]) : '';
  saveJob = {
    infoHtml: `<div class="save-count"><b>${rows.length}</b>件を読み解き（${log.length}ページを読みました）</div>` + notes.map(([k, t]) => `<div class="note ${k}">${esc(t)}</div>`).join(''),
    name: `${spMachine} 確定仕様書読み解き${ym}`,
    build: () => spBuildXlsx(rows, log, K.ops),
    extras: () => marked, // Excel と一緒に保存するファイル（読み解き済みの PDF）
    done: spReset,
  };
  spLast = { key: spKey(), job: saveJob };
  openSave();
}
let spLast = null;
const spKey = () => spMachine + '|' + spFiles.map(f => f.name + ':' + f.size).join('|');
function spReset(){
  spFiles = []; spMachine = ''; spLast = null;
  document.querySelectorAll('#spList input').forEach(r => r.checked = false);
  showErr(''); spRender(); updateStatus();
}
const spModel = h => String((h && h.model) || '').normalize('NFKC').replace(/\s+/g, '').toUpperCase();
const SP_KINDS = {
  'HRB・SRB': { label: 'HRB・SRB', want: spIsHRB, judge: p => SpJudge.judge(p, { countryOf }), ops: SP_HRB_OPS,
    known: SpJudge.known, countryW: { chars: SpJudge.COUNTRY_CHARS, ok: SpJudge.isCountry } }, // 読み直し（2026-10-27）
  'HG': { label: 'HG', want: h => /^HG\d/.test(spModel(h)), judge: p => SpJudge.judgeHG(p, { countryOf }), ops: SP_HG_OPS, noNotes: true }, // 2026-10-24。HG の判定は備考を使わないので読まない（2026-10-27）
};
for (const k of Object.keys(SP_KINDS)) SP_PROCESSORS[k] = { run: files => (spLast && spLast.key === spKey() ? (saveJob = spLast.job, openSave()) : spRunSpec(files, SP_KINDS[k])) };
