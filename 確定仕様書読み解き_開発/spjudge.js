// HRB・SRB の確定仕様書：読み取った1ページ分（上の欄・●の行の項目名・備考）から帳票の1行を作る（2026-10-15〜16 にユーザーと決めたきまり）
(function (G) {
  const N = s => String(s || '').normalize('NFKC').replace(/\s+/g, '').toUpperCase();
  const COUNTRIES = ['日本', '米国', '中国', '台湾', '韓国', 'インド', 'タイ', 'ベトナム', 'インドネシア', 'マレーシア', 'フィリピン', 'シンガポール', 'アラブ首長国連邦', 'トルコ', 'メキシコ', 'ブラジル', 'カナダ',
    'オーストラリア', 'ドイツ', 'フランス', 'イタリア', 'スペイン', 'イギリス', 'オランダ', 'ポーランド', 'チェコ', 'ハンガリー', 'ロシア', '南アフリカ', 'サウジアラビア', 'イスラエル', 'エジプト', '欧州'];
  const EU = new Set(['欧州', 'ドイツ', 'フランス', 'イタリア', 'スペイン', 'イギリス', 'オランダ', 'ポーランド', 'チェコ', 'ハンガリー']);
  // 読み取った国名を、決まった国名に寄せる（含まれていればそれ、無ければ文字が一番多く重なる国名）
  function country(raw) {
    const t = N(raw).replace(/[|｜!\[\]【】()]/g, '');
    if (!t) return '';
    for (const c of COUNTRIES.slice().sort((a, b) => b.length - a.length)) if (t.includes(c)) return c;
    let best = '', bs = 0;
    for (const c of COUNTRIES) { const hit = [...c].filter(ch => t.includes(ch)).length / c.length; if (hit > bs) { bs = hit; best = c; } }
    return bs >= 0.5 ? best : t;
  }
  const cleanName = s => String(s || '').replace(/^[^A-Za-z0-9(（【぀-ヿ一-鿿]+/, '').replace(/^[|｜!、。・ー一]+/, '').replace(/^[^\x00-\x7f【(（]{1,2}(?=[【(（A-Z])/, '').replace(/[|｜]+$/, '').trim();
  function tons(model) {
    const d = (N(model).match(/^(?:HRBC|HRB|SRB)(\d{4})/) || [])[1]; if (!d) return 0;
    const two = d.slice(0, 2);
    if (two === '50') return d[2] === '0' ? 500 : 50;
    return { '80': 80, '10': 100, '13': 130, '22': 220, '35': 350, '60': 600 }[two] || 0;
  }
  // ●の行の項目名から、当てはまる OP の印を作る
  function marks(dots) {
    const m = new Set();
    for (const raw of dots) {
      const t = N(raw).replace(/[《〈]/g, '(').replace(/[》〉]/g, ')');
      const sp = /^[①②③④⑤⑥⑦⑧⑨⑩]/.test(raw.trim()); // 特殊仕様の行
      // 制御ASSY(IO) の行は説明文（2人操作フットペダル・ロボットIFキット選択時…）が長く、ほかの OP の名前を含むので、この行は制御ASSY だけを見る
      if (/択時/.test(t)) { if (/ASSY/.test(t)) m.add('制御ASSY(IO)'); continue; }
      if (/AS-?[0O]1/.test(t) || /レーザ式安全/.test(t) || (/-[0O]1/.test(t) && /インター|安全/.test(t))) m.add('AS-01');
      if (/クラウニング/.test(t) && !/手動/.test(t)) m.add('自動ｸﾗｳﾆﾝｸﾞ'); // 「オート」は「2ート」「2ュート」と読み違えることがある
      if (/シ.?フト/.test(t) && !/脱着|ツキアテ|突き当|突当/.test(t)) m.add('Lｼﾌﾄ'); // 「しシブフト」など
      if (/[角直]度センサ|BI-?[SL](?![A-Z])/.test(t)) { const two = /2軸|自動2/.test(t), one = /1軸|自動1/.test(t);
        if (/BI-?L/.test(t)) m.add(two ? 'BI-L2' : 'BI-L1'); else if (two) m.add('BI-S2'); else m.add('BI-S1'); } // 軸数が読めないときは1軸
      if (/スライドフット|自走制御|AF軸/.test(t) && !/人.{0,2}フット/.test(t)) { if (/手動/.test(t)) m.add('手動ｽﾗｲﾄﾞﾌｯﾄ'); else if (/自動|自走|AF軸/.test(t)) m.add('自動ｽﾗｲﾄﾞﾌｯﾄ'); }
      if (/ロボットI\/?F|ロボットIFキット/.test(t)) m.add('ﾛﾎﾞｯﾄI/F');
      if (/ダイリフトI\/?F/.test(t)) m.add('ﾀﾞｲﾘﾌﾄI/F');
      if (/人.{0,2}フット|二人フット/.test(t)) m.add('二人ﾌｯﾄ'); // 「2人操作」「2人反作」「<人作」など
      if (/20P\+?AF|2OP\+?AF/.test(t)) m.add('20P+AF');
      if (/追従装置|SF-?1(224|548|584)/.test(t) && /SF-?1(224|548|584)/.test(t)) m.add(/1548/.test(t) ? '追従装置SF1548H' : /1584/.test(t) ? '追従装置SF1584' : '追従装置SF1224');
      if (/VC-?BOX|VFユニット/.test(t)) m.add('VFﾕﾆｯﾄ');
      if (/ASSY|セイギョツイカ/.test(t)) m.add('制御ASSY(IO)'); // 「制師ASSY(10)」など
      if (/^指定色/.test(t)) m.add('指定色');
      if (/AGRIP-?A/.test(t)) m.add('AGRIP-A');
      if (/NEWAGRIP-?S|油圧AGRIP-?S/.test(t)) m.add('AGRIP-S');
      if (/ヘビーバックゲージ/.test(t) && /Y4/.test(t)) m.add('ﾍﾋﾞｰﾊﾞｯｸｹﾞｰｼﾞY4軸');
      if (/LEDライト/.test(t) && /後方/.test(t)) m.add('後方LED');
      if (/LED.{0,2}照明/.test(t) && !/標準/.test(t)) m.add('LED照明');
      if (/ワークセンサ/.test(t) && !sp) m.add('ﾜｰｸｾﾝｻ');
      if (/漏電ブレーカ|QF1/.test(t)) m.add('QF1');
      if (/バックゲージ.{0,2}4/.test(t) && !/ヘビー/.test(t)) m.add('Y軸4軸');
      if (/テパBOX|テーパBOX/.test(t)) m.add('ﾃﾊﾟBOX');
    }
    return m;
  }
  // 備考に「有り」と書いてあるのに ● が無い OP（ｱﾝﾏｯﾁ有）
  const NOTE_KEYS = [[/Lシフト/, 'Lｼﾌﾄ'], [/オートクラウニング|自動クラウニング/, '自動ｸﾗｳﾆﾝｸﾞ'], [/2人操作フット|二人フット/, '二人ﾌｯﾄ'], [/制御ASSY|セイギョツイカ/, '制御ASSY(IO)'],
    [/AGRIP-?A/, 'AGRIP-A'], [/追従装置/, '追従装置SF1224'], [/角度センサ/, 'BI-S'], [/ロボットI\/?F/, 'ﾛﾎﾞｯﾄI/F']];
  function mismatch(notes, m) {
    const t = N(notes), out = [];
    for (const [re, k] of NOTE_KEYS) {
      const i = t.search(re); if (i < 0) continue;
      const ctx = t.slice(i, i + 30);
      if (!/有|仕様|追加/.test(ctx)) continue;
      const have = k === 'BI-S' ? (m.has('BI-S1') || m.has('BI-S2')) : k === '追従装置SF1224' ? [...m].some(x => x.startsWith('追従装置')) : m.has(k);
      if (!have) out.push(k);
    }
    return out;
  }
  // 1ページ → 1行（帳票に出さないページは skip）
  function judge(p, opts) {
    opts = opts && !Array.isArray(opts) ? opts : {};
    if (p.skip) return { skip: p.skip };
    const h = p.head || {}, model = N(h.model);
    if (!/^(HRBC|HRB|SRB)\d/.test(model)) return { skip: `HRB・SRB 以外（${h.model || '機種名が読めない'}）` };
    const dest = cleanName(h.dest), contract = cleanName(h.contract), aaiSer = /^AR[A-Z]\d{5}$/.test(N(h.ser)), cust = aaiSer ? 'AAI' : (dest || contract);
    if (/AESA/.test(N(dest)) || (!dest && /AESA/.test(N(contract)))) return { skip: '納入先が AESA' };
    const t = tons(model), srb = model.startsWith('SRB');
    const kind = srb ? (t >= 220 ? 'SRB中型' : 'SRB小型') : t >= 350 ? 'HRB大型' : t === 220 ? 'HRB中型' : 'HRB小型';
    // 国名が読めないときは、客先名（納入先・契約先）から探す（アプリの countryOf）
    let cn = country(h.country);
    if (!COUNTRIES.includes(cn) && opts.countryOf) cn = opts.countryOf(h.dest || '') || opts.countryOf(h.contract || '') || cn;
    const cnOut = cn === 'アラブ首長国連邦' ? 'UAE' : cn;
    const shimuke = cn === '日本' ? 'DMS' : (srb && EU.has(cn)) ? 'CE' : 'EXP';
    const aai = aaiSer || N(cust) === 'AAI';
    const name = `${model} ${shimuke}` + (aai ? ' AAI' : '');
    const m = marks(p.dots || []), atc = /ATC/.test(model), small = kind === 'HRB小型', mid = kind === 'HRB中型', large = kind === 'HRB大型';
    const f = {};
    const ag = m.has('AGRIP-A');
    if (small || mid) {
      f[1] = atc; f[2] = small && m.has('自動ｸﾗｳﾆﾝｸﾞ'); f[3] = mid && m.has('自動ｸﾗｳﾆﾝｸﾞ'); f[4] = m.has('Lｼﾌﾄ');
      f[5] = m.has('BI-S1'); f[6] = m.has('BI-S2'); f[7] = m.has('AS-01'); f[8] = !m.has('AS-01');
      f[9] = ag && small && t !== 130 && shimuke === 'DMS'; f[10] = ag && t === 130 && shimuke === 'DMS'; f[11] = ag && mid && shimuke === 'DMS';
      f[12] = ag && small && t !== 130 && shimuke === 'EXP'; f[13] = ag && t === 130 && shimuke === 'EXP'; f[14] = ag && mid && shimuke === 'EXP';
      f[15] = m.has('自動ｽﾗｲﾄﾞﾌｯﾄ'); f[16] = m.has('手動ｽﾗｲﾄﾞﾌｯﾄ'); f[17] = m.has('ﾛﾎﾞｯﾄI/F'); f[18] = m.has('二人ﾌｯﾄ'); f[19] = m.has('20P+AF'); f[20] = atc;
      f[21] = m.has('追従装置SF1224') && (small || (mid && shimuke === 'DMS')); f[22] = m.has('追従装置SF1224') && mid && shimuke === 'EXP';
      f[23] = m.has('追従装置SF1548H'); f[24] = m.has('VFﾕﾆｯﾄ');
      f[25] = m.has('制御ASSY(IO)') && shimuke === 'DMS'; f[26] = m.has('制御ASSY(IO)') && shimuke !== 'DMS';
      f[42] = aai;
    }
    if (large) {
      f[8] = !m.has('AS-01');
      f[29] = m.has('ﾍﾋﾞｰﾊﾞｯｸｹﾞｰｼﾞY4軸'); f[30] = m.has('BI-L1'); f[31] = m.has('BI-L2'); f[32] = m.has('後方LED'); f[33] = m.has('AS-01');
      f[34] = ag || m.has('AGRIP-S'); f[35] = m.has('ﾛﾎﾞｯﾄI/F') || m.has('ﾀﾞｲﾘﾌﾄI/F'); f[36] = m.has('ﾜｰｸｾﾝｻ');
      f[37] = !m.has('QF1'); f[38] = m.has('QF1'); f[39] = m.has('制御ASSY(IO)'); f[40] = m.has('二人ﾌｯﾄ'); f[41] = atc;
    }
    f[27] = m.has('指定色'); f[28] = !!h.tok;
    if (srb) {
      const exp = shimuke === 'EXP', ce = shimuke === 'CE';
      f[43] = exp && m.has('AS-01'); f[44] = ce && m.has('AS-01'); f[45] = exp && !m.has('AS-01'); f[48] = ce && !m.has('AS-01');
      f[49] = exp && m.has('LED照明'); f[50] = ce && m.has('LED照明'); f[51] = m.has('Y軸4軸'); f[52] = m.has('BI-S1'); f[53] = ce && m.has('ﾃﾊﾟBOX');
    }
    const biko = [];
    if (mismatch(p.notes, m).length) biko.push('ｱﾝﾏｯﾁ有');
    if (m.has('追従装置SF1584')) biko.push('追従装置SF1584 選択あり');
    // シリアルの頭の数字を落として7桁に読んだとき：シリアルの左2桁はトン数（10＝100t、13＝130t…）なので補う
    let ser = h.ser; const code = { 50: '50', 80: '80', 100: '10', 130: '13', 220: '22', 350: '35', 600: '60' }[t];
    if (/^\d{7}$/.test(ser || '') && code && ser[0] === code[1] && !ser.startsWith(code)) ser = code[0] + ser;
    return { ym: h.ym, name, ser, shimuke, country: cnOut, cust, kind, f, biko: biko.join('・'), marks: [...m] };
  }
  G.SpJudge = { judge, country, tons, marks };
})(window);
