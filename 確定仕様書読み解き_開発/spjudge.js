// HRB・SRB の確定仕様書：読み取った1ページ分（上の欄・●の行の項目名・備考）から帳票の1行を作る（2026-10-15〜16 にユーザーと決めたきまり）
(function (G) {
  const N = s => String(s || '').normalize('NFKC').replace(/\s+/g, '').toUpperCase();
  const COUNTRIES = ['日本', '米国', '中国', '台湾', '韓国', 'インド', 'タイ', 'ベトナム', 'インドネシア', 'マレーシア', 'フィリピン', 'シンガポール', 'アラブ首長国連邦', 'トルコ', 'メキシコ', 'ブラジル', 'カナダ',
    'オーストラリア', 'ドイツ', 'フランス', 'イタリア', 'スペイン', 'イギリス', 'オランダ', 'ポーランド', 'チェコ', 'ハンガリー', 'ロシア', '南アフリカ', 'サウジアラビア', 'イスラエル', 'エジプト', '欧州',
    // 2026-10-27 追加（一覧に無い国は、似た字の国名に寄せられて間違えていた）
    'ニュージーランド', 'フィンランド', 'スウェーデン', 'ノルウェー', 'デンマーク', 'ベルギー', 'スイス', 'オーストリア', 'ポルトガル', 'アイルランド', 'ギリシャ', 'ルーマニア',
    'スロバキア', 'スロベニア', 'クロアチア', 'ブルガリア', 'セルビア', 'ウクライナ', 'リトアニア', 'ラトビア', 'エストニア', 'ルクセンブルク', 'アルゼンチン', 'チリ', 'コロンビア', 'ペルー',
    'パキスタン', 'バングラデシュ', 'スリランカ', 'カタール', 'クウェート', 'オマーン', 'バーレーン', 'イラン', 'イラク', 'ヨルダン', 'モロッコ', 'チュニジア', 'アルジェリア', 'ナイジェリア',
    'ケニア', 'カザフスタン', 'ミャンマー', 'カンボジア', 'ラオス', 'モンゴル', 'ネパール'];
  const EU = new Set(['欧州', 'ドイツ', 'フランス', 'イタリア', 'スペイン', 'イギリス', 'オランダ', 'ポーランド', 'チェコ', 'ハンガリー',
    'フィンランド', 'スウェーデン', 'ノルウェー', 'デンマーク', 'ベルギー', 'スイス', 'オーストリア', 'ポルトガル', 'アイルランド', 'ギリシャ', 'ルーマニア', 'スロバキア', 'スロベニア',
    'クロアチア', 'ブルガリア', 'セルビア', 'リトアニア', 'ラトビア', 'エストニア', 'ルクセンブルク']);
  // 国名の読み直しで使ってよい字（国名に出てくる字だけ）
  const COUNTRY_CHARS = [...new Set(COUNTRIES.join(''))].join('');
  // 読み取った国名を、決まった国名に寄せる（含まれていればそれ、無ければ文字が一番多く重なる国名）
  function country(raw) {
    const t = N(raw).replace(/[|｜!\[\]【】()]/g, '');
    if (!t) return '';
    for (const c of COUNTRIES.slice().sort((a, b) => b.length - a.length)) if (t.includes(c)) return c;
    let best = '', bs = 0, tie = false;
    for (const c of COUNTRIES) {
      const n = [...c].filter(ch => t.includes(ch)).length, hit = n / c.length;
      if (n < 2) continue;
      if (hit > bs) { bs = hit; best = c; tie = false; } else if (hit === bs) tie = true;
    }
    return bs >= 0.6 && !tie ? best : t;
  }
  const cleanName = s => String(s || '').replace(/^[^A-Za-z0-9(（【぀-ヿ一-鿿]+/, '').replace(/^[|｜!、。・ー一]+/, '').replace(/^[^\x00-\x7f【(（]{1,2}(?=[【(（A-Z])/, '').replace(/[|｜]+$/, '').trim();
  function tons(model) {
    const d = (N(model).match(/^(?:HRBC|HRB|SRB)(\d{4})/) || [])[1]; if (!d) return 0;
    const two = d.slice(0, 2);
    if (two === '50') return d[2] === '0' ? 500 : 50;
    return { '80': 80, '10': 100, '13': 130, '22': 220, '35': 350, '60': 600 }[two] || 0;
  }
  const CTRL = /ASSY|セイギョツイカ|SSY\(?[1IL][0O]\)?/; // 制御ASSY(IO)
  // ●の行の項目名から、当てはまる OP の印を作る
  function marks(dots) {
    const m = new Set();
    for (const raw of dots) {
      const t = N(raw).replace(/[《〈]/g, '(').replace(/[》〉]/g, ')');
      const sp = /^[①②③④⑤⑥⑦⑧⑨⑩]/.test(raw.trim()); // 特殊仕様の行
      // 制御ASSY(IO) の行は説明文（2人操作フットペダル・ロボットIFキット選択時…）が長く、ほかの OP の名前を含むので、この行は制御ASSY だけを見る
      if (/択時/.test(t)) { if (CTRL.test(t)) m.add('制御ASSY(IO)'); continue; }
      // AS-01：「AS-0l」（l を読む）「(A01)+インター」「(AO1)」（S を落とす）も（50205223・50205224）
      if (/AS-?[0O][1IL]/.test(t) || /\(A[S5]?-?[0O][1IL]\)/.test(t) || /レーザ式安全/.test(t) || (/-[0O][1IL]/.test(t) && /インター|安全/.test(t))) m.add('AS-01');
      if (/クラウ|[ウワ]ニング/.test(t) && !/手動/.test(t)) m.add('自動ｸﾗｳﾆﾝｸﾞ'); // 「オート」→「2ート」、「クラウ」→「クフラワ」と読み違えることがある
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
      if (CTRL.test(t)) m.add('制御ASSY(IO)'); // 「制師ASSY(10)」「信族内SSY(10)」（A を落とす。13035872）など
      if (/^指定色/.test(t)) m.add('指定色');
      if (/AGRIP-?A/.test(t)) m.add('AGRIP-A');
      if (/NEWAGRIP-?S|油圧AGRIP-?S/.test(t)) m.add('AGRIP-S');
      // 大型：Y4軸は「ヘビーバックゲージY4軸自動」の行の ● で判断（本体の標準の行「…Y4軸選択時は「無」を選択」は見ない。2026-10-16 ユーザー確認）
      if (/ヘビーバックゲージY4|Y4軸自動/.test(t) && !/本体|選択時/.test(t)) m.add('ﾍﾋﾞｰﾊﾞｯｸｹﾞｰｼﾞY4軸');
      if (/LEDライト/.test(t) && /後方/.test(t)) m.add('後方LED');
      if (/LED.{0,3}[照昭妥属]?明/.test(t) && !/標準/.test(t)) m.add('LED照明'); // 「LED有属明有」（10301115）など
      // ﾜｰｸｾﾝｻはオプションの「ヘビーワークセンサー突き当て」の ● で判断。特殊仕様の中の「ワークセンサツキアテ」（①〜⑧の行。番号を読み落とすことがある）は特殊仕様の「1」で足りる
      if (/ワークセンサ/.test(t) && !sp && /ヘ.?ビ|突/.test(t) && !/ツキアテ|切替|特殊/.test(t)) m.add('ﾜｰｸｾﾝｻ');
      if (/漏電ブレーカ|QF1/.test(t)) m.add('QF1');
      if (/バックゲージ.{0,2}4/.test(t) && !/ヘビー/.test(t)) m.add('Y軸4軸');
      if (/テ[ーバパハ]{1,3}BOX/.test(t)) m.add('ﾃﾊﾟBOX'); // テパBOX・テーパBOX・「テバパBOX」（10301117）
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
    if (!COUNTRIES.includes(cn) && h.country2 && COUNTRIES.includes(country(h.country2))) cn = country(h.country2); // 海外向けの HG の様式は国名が「仕向仕様」の下（2026-10-24）
    if (!COUNTRIES.includes(cn) && h.countryW && COUNTRIES.includes(country(h.countryW))) cn = country(h.countryW); // 国名の字だけで読み直した結果（2026-10-27）
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
    f[27] = m.has('指定色'); f[28] = !!h.tok || /-\d{3,5}/.test(N(h.tokRaw)) || /[A-Z]{2,3}\d?-\d{4}/.test(N(p.notes));
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
  // ===== HG の確定仕様書（2026-10-24 ユーザー提供「HG確定仕様書読み解き.xlsx」の OP一覧と、懸案一覧の正解）=====
  // ● の行の項目名（オプション名の欄だけを読んだもの）から HG の印を作る
  function marksHG(dots) {
    const m = new Set();
    for (const raw of dots) {
      const t = N(raw).replace(/[《〈]/g, '(').replace(/[》〉]/g, ')');
      if (/AS-?[0O&]1|レーザ式安全/.test(t)) m.add(/オプション/.test(t) ? 'AS-01(OP)' : 'AS-01'); // 「オプション」の記載が無ければ AS-01 標準（正解№1）
      if (/[ピビ]ルツ|PSEN|P-?SEN|SENV/.test(t)) m.add('Psen-vip');
      if (/センサ|ンサー/.test(t) && /B[I1L\[]?-?[SL5]|BI|BS/.test(t) && !/ワーク/.test(t)) { // 角度センサー Bi-S／Bi-L 自動1軸・2軸（Bi-S と Bi-L を間違えない）
        const L = /B[I1\[]?-?L/.test(t), two = /2軸|自動2|自.{0,2}2/.test(t);
        m.add((L ? 'Bi-L' : 'Bi-S') + (two ? '2' : '1'));
      }
      if (/^.{0,3}L[EFI][D5O0]/.test(t) && !/ライト/.test(t)) m.add('LED'); // 「LED照明」（「LE5急明」「LFD」などと読み違える）
      if ((/シ[フブプジ]|[シジ][フブプ]ト|L軸シ/.test(t)) && !/脱着|突き?当|ツキアテ|用|リバー|シブル/.test(t)) m.add('Lシフト'); // 「Lシジブト」「Lシプト」「Lジフト」など（「リバーシブル」は除く）
      if (/スライド/.test(t) && /[フブ]ット/.test(t) && /自動|自走/.test(t) && !/手動/.test(t)) m.add('自動ｽﾗｲﾄﾞﾌｯﾄ'); // 「フットペダル 自動スライドフットペダル」「スライドフットペダル 自動(別置き…)」（正解№2）
      if (/[2二]人/.test(t) && /[フブ]ット|ペダル|ベダル/.test(t)) m.add('2人フット');
      if (/ワークセンサ/.test(t)) m.add('ワークセンサ'); // 3段（突き当て標準・先端段差・キット）のどれか
      if (/SF-?1224|1224TL|1224IL/.test(t)) m.add('SF1224TL');
      if (/ハイボディ/.test(t)) m.add('ハイボディ');
      if (/VC-?BOX|VCBOX/.test(t)) m.add('VC-BOX');
      if (/A-?KAS/.test(t)) m.add('A-KAS');
      if (/両手/.test(t)) m.add('両手操作');
    }
    return m;
  }
  function judgeHG(p, opts) {
    opts = opts || {};
    if (p.skip) return { skip: p.skip };
    const h = p.head || {}, model = N(h.model).toUpperCase();
    if (!/^HG\d/.test(model)) return { skip: `HG 以外（${h.model || '機種名が読めない'}）` };
    const dest = cleanName(h.dest), contract = cleanName(h.contract), cust = dest || contract;
    if (/AESA/.test(N(dest)) || (!dest && /AESA/.test(N(contract)))) return { skip: '納入先が AESA' };
    // 国名：HG は客先名から国が分かるときは客先名を使う（正解№9：22404203 は客先 AMADA CANADA なのに国名の欄が「米国」＝確定仕様書の誤り）
    let cn = '';
    if (opts.countryOf) cn = opts.countryOf(h.dest || '') || opts.countryOf(h.contract || '') || '';
    if (!cn) { cn = country(h.country); if (!COUNTRIES.includes(cn) && h.country2 && COUNTRIES.includes(country(h.country2))) cn = country(h.country2); }
    const cnOut = cn === 'アラブ首長国連邦' ? 'UAE' : cn;
    const shimuke = cn === '日本' ? 'DMS' : 'EXP';
    const name = `${model} ${shimuke}`; // HG は AAI を付けない（正解№16）
    const digits = (model.match(/^HG(\d+)/) || [])[1] || '', mid = /^(17|22)/.test(digits), t50 = /^50/.test(digits); // HG17・HG22 は中型、ほかは小型（正解№14）
    const sfx = model.slice(2 + digits.length), robot = /AR[SM]/.test(sfx), atcR = /ATC|R/.test(sfx); // 機種名の数字の後ろ（ATC・ARS・ARM・RM など）
    const m = marksHG(p.dots || []), f = {};
    const as01 = m.has('AS-01') || m.has('AS-01(OP)'), psen = m.has('Psen-vip'), safety = as01 || psen;
    // Y化・B&R：生産計画抽出の HG 備考と同じく、シリアルの下から4桁目（8＝B&R、ほか＝Y化。正解№7）
    const ser = String(h.ser || ''), d4 = ser.length >= 4 ? ser[ser.length - 4] : '', br = d4 === '8';
    f[1] = m.has('Bi-S1'); f[2] = m.has('Bi-S2'); f[3] = m.has('Bi-L1'); f[4] = m.has('Bi-L2');
    const len4 = digits.slice(-1) === '4'; // LED：機種名の最後の数字が 4 なら 4m、ほか（3 など）は 3m（正解№8）
    f[5] = m.has('LED') && !len4; f[6] = m.has('LED') && len4;
    f[7] = m.has('Lシフト'); f[8] = m.has('自動ｽﾗｲﾄﾞﾌｯﾄ'); f[9] = m.has('ワークセンサ');
    f[10] = m.has('自動ｽﾗｲﾄﾞﾌｯﾄ') && m.has('2人フット'); // 自動スライドフット＋2人操作フットペダルで OP（単体では付かない）
    f[11] = psen; f[12] = robot; f[13] = m.has('AS-01'); f[14] = m.has('AS-01(OP)');
    f[15] = !safety && !br; f[16] = !safety && br && !/ARM|ARS|RM|ATC/.test(sfx); // 安全装置（AS-01・Psen-vip）が無いときだけ（正解№5）
    f[17] = m.has('SF1224TL') && !(t50 && shimuke === 'DMS'); f[18] = m.has('SF1224TL') && t50 && shimuke === 'DMS';
    f[22] = psen || /ARS|ARM|RM|ATC/.test(sfx); f[20] = !f[22]; // PSS：Psen-vip か機種名 ARS/ARM/RM/ATC ならオプション、ほかは標準
    f[23] = mid && m.has('VC-BOX') && (psen || /ATC|R/.test(sfx)) && shimuke === 'DMS';
    f[24] = !!h.tok; f[25] = m.has('ハイボディ') && !atcR; f[26] = m.has('A-KAS'); f[27] = m.has('両手操作');
    // シリアルの頭の数字を落として7桁に読んだときは、機種名の頭の2桁で補う（HG2204 → 22…）
    let s2 = h.ser; if (/^\d{7}$/.test(s2 || '') && digits.length >= 2 && s2[0] === digits[1] && !s2.startsWith(digits.slice(0, 2))) s2 = digits[0] + s2;
    return { ym: h.ym, name, ser: s2, shimuke, country: cnOut, cust, kind: mid ? 'HG中型' : 'HG小型', f, biko: '', marks: [...m] };
  }
  // ===== EGB の確定仕様書（2026-11-20：ユーザー提供「EGB確定仕様書読み解きルール.xlsx」と、懸案一覧〔No.1〜30・2027年1月テスト〕の回答）=====
  // 標準機・小型機（生産計画抽出と同じ）：EGB13〇〇・EGB8〇〇〇・EGB6＊＊＊（3桁に 2）は標準機、EGB4〇〇〇・EGB6＊＊＊（3桁に 1）は小型機
  function egbKind(model) {
    const d = (N(model).match(/^EGB(\d{4})/) || [])[1]; if (!d) return '';
    if (d.startsWith('13') || d.startsWith('8')) return '標準機';
    if (d.startsWith('4')) return '小型機';
    if (d.startsWith('6')) { if (d.slice(1).includes('2')) return '標準機'; if (d.slice(1).includes('1')) return '小型機'; }
    return '';
  }
  // 機種名の数字の後ろの記号：E／AE／RE／ARE（機種名だけを見る。仕様書の「代表仕様」の欄は使わない）
  function egbForm(model) {
    const s = (N(model).match(/^EGB\d{4}([A-Z]*)/) || [])[1] || '';
    for (const f of ['ARE', 'AE', 'RE', 'E']) if (s.startsWith(f)) return f;
    return '';
  }
  // ● の行（オプション名の欄だけを読んだもの）の印。1つの行に印が2つ付くこともある（「2人操作フットペダル＋自動スライド…」など）
  // 見るのは行の名前の欄だけ（右の欄の説明「Y3軸からの変更有無」や ※ の注記は読まない）
  // 読み違いを見込んだ形（2026-11-20：白黒のスキャンは字がつぶれる。「中間板」→「中間抜」「由問拓」、「AMTSⅢS」→「A天SIIIS」、「軸」→「較」「還」など）
  const EGB_RE = {
    norm: s => N(s).replace(/[《〈]/g, '(').replace(/[》〉]/g, ')').replace(/※.*$/, ''),
    mid: /^[^\d]?[中由四記][^\d\s.,]?[板抜振坂拓柏株扱析だ]|^中[間問聞商]|^[由記四][問環商]/, // 中間板（2文字目は読み違いが多い：中間板・中問抜・由問拓・中賠板・中牙板・中癌板…）
    agA: /A[GC].{0,3}P[-_]?A/, agM: /A[GC].{0,3}P[-_]?M|手動/, oil: /[油池][圧正]/, amts: /A.{0,3}S|AMTS|AWTS|A天S|天TS|AMNTS|AMT|AMIS|A[LI1]TS|モジュラー|ダイ[ホボ]ル.{0,6}は.{0,10}内に/, // AGRIP-A(油圧)・AGRIP-M(手動)、「中間板．AMTSⅢ（ダイホルダーはAMTSⅢ内に含む）」
    bis: /^.{0,2}[角直色名公鉛折明][度医記諾]|センサ|B[IJ1L\[|]?-?S[I1LⅡ\]|]|BI-?S|B[IJ1L\[|]-S/, // EGB の ● の行の「センサー」は角度センサーだけ（ワークセンサーは外す）
    two: /2軸|自.{0,2}[27](?![0-9])|2(?=[軸較還輸釘男抽])/, one: /1軸|自.{0,2}1(?![0-9])|自動[\]L|I]|1(?=[軸較還輸男抽培])/,
  };
  function egbUnsure(raw) {
    const t = EGB_RE.norm(raw);
    if ((EGB_RE.mid.test(t) || /A[CG].{0,3}P/.test(t)) && !EGB_RE.agA.test(t) && !EGB_RE.agM.test(t) && !EGB_RE.amts.test(t) && !EGB_RE.oil.test(t)) return true; // 中間板の A／M が読めない
    if (EGB_RE.bis.test(t) && !/ワーク/.test(t) && !EGB_RE.two.test(t) && !EGB_RE.one.test(t)) return true; // 角度センサーの軸数が読めない
    return false;
  }
  function egbTags(raw) {
    const s = String(raw || ''), t = EGB_RE.norm(s), m = new Set();
    if (/^[①-⑳]/.test(s.trim()) || /^特殊仕様[①-⑳]/.test(t) || /^\(?\d{1,2}\)?(?![0-9点京占店人PM.]|.?ゲ)/.test(t)) { m.add('SPC'); return m; } // 特殊仕様①〜⑳の行は特殊仕様＝1 で足りる（懸案3）。「①」を「1」と読むこともある
    if (/^制御|ASSY|SSY\(?[1IL\[][0O]\)?/.test(t)) { m.add('CASY'); return m; } // 制御ASSY（IO）
    if (/AR[CS]E/.test(t)) return m; // ARce（ARse）HMIパック・4ieパックは印も帳票も出さない（懸案 全体3）
    // 特殊仕様の「①」を読めずに字のかけら（「すす菩語昌ロボットIF」）になることがあるので、角度センサー・ロボットIF は行の頭の近くにあるときだけ
    const head = re => { const i = t.search(re); return i >= 0 && i <= 4; };
    if (head(EGB_RE.bis) && !/ワーク/.test(t)) m.add(EGB_RE.two.test(t) ? 'BIS2' : 'BIS1'); // 軸数が読めないときは1軸
    if (/[A-Z]S-?[0O][1IL)\]]|AS-?0|\(A[S5]?-?[0O][1IL]\)|レーザ|安全[装六碑]/.test(t)) m.add('AS01');
    if (/[3三][点京占店]?.?ゲ.?ジ|[点占]ゲージ/.test(t)) m.add('G3'); // 「3点」を「3京」「3占」と読むことがある（2026-11-26 2027年2月 60109127・28）
    if (/Y3/.test(t)) m.add('Y3'); // 「Y3軸」のときだけ（6軸・4軸のバックゲージは付けない。懸案4）
    if (/([LしL]シ.?[フブプ]ト|LS軸)/.test(t) && !/Y3|ワークセンサ|標準|無|脱着|突|ツキアテ|用|対応|軸仕/.test(t)) m.add('LS'); // 「バックゲージL軸仕様．Y3軸対応Lシフト3軸」は Y3 の行
    if (/スライド.?[フブ]|スライドフ/.test(t) && !/材料/.test(t)) m.add(/手[動勤]/.test(t) ? 'MF' : 'AF');
    if (/AF軸/.test(t)) m.add('AF');
    if (/[2二]人/.test(t) && /操作|[フブ]ット|[ペベ]ダル/.test(t)) m.add('2P');
    if (/1224/.test(t)) m.add('SF');
    if (/1548/.test(t)) m.add('HSF');
    if (!/^[ダタ]イ/.test(t) && (EGB_RE.agA.test(t) || (EGB_RE.mid.test(t) && (EGB_RE.amts.test(t) || EGB_RE.oil.test(t))) || /モジュラー/.test(t))) m.add('CL'); // AGRIP-A・中間板 AGRIP-A(油圧)・AMTSⅢ（【標準】が無くても。懸案1）・モジュラーツーリングシステム。ダイホルダーの行（「油圧1Vダイホルダー(AGRIP-A必須)」）は外す
    if (/スマー.{0,2}オ[ペベ]|オ[ペベ]レーション|モバイルHMI|ガイダンス|当てモ.{0,6}最/.test(t) && !/モデル/.test(t)) m.add('TAB'); // 国内の様式は2段の行で、上の段（スマートオペレーションパック）が読めないことがある。「…モデル標準仕様」の本体の行は外す
    if (/(ツキアテ|突き?当て?)モニ/.test(t)) m.add('TM');
    if (head(/ロボットI\/?F|ロボットインター/)) m.add('RIF');
    if (/エルゴ/.test(t)) m.add('ERG');
    if (/両手/.test(t)) m.add('BOTH');
    if (/^指定色/.test(t)) m.add('COLOR');
    return m;
  }
  // 備考・製造指示追記情報に OP の記載があるのに ● が無いとき：OP は選ばず、その記載を黄色でマーキング・備考欄に「備考欄記載あり」（懸案2-1）
  // 「【…モデルとの違い】」より後ろは ● の変更の一覧（● と同じ）なので見ない
  const EGB_NOTE = [[/SF-?1548/, ['ﾍﾋﾞｰSF']], [/SF-?1224/, ['SF追従装置']], [/ロボットI\/?F/, ['ﾛﾎﾞｯﾄIF']], [/2人操作/, ['20P/AF', '2人操作ﾌｯﾄﾍﾟﾀﾞﾙ']],
    [/両手操作/, ['特殊仕様']], [/エルゴノミ/, ['ATSAｴﾙｺﾞﾉﾐｸｽ']]];
  function judgeEGB(p, opts) {
    opts = opts || {};
    if (p.skip) return { skip: p.skip };
    const h = p.head || {}, model = N(h.model).replace(/^EGB(\d{4})[O0]?(?=[A-Z])/, 'EGB$1');
    if (/^EGBRBT|^EGBR8T|^EGBRB/.test(model)) return { skip: 'ロボット（EGBRBT）は読み解き不要' };
    if (!/^EGB\d{4}/.test(model)) return { skip: `EGB 以外（${h.model || '機種名が読めない'}）` };
    const kind = egbKind(model), form = egbForm(model), std = kind === '標準機';
    // 国名：海外の様式は「国名」の欄（country2 の位置）、国内の様式は右上の「国名」（country の位置）。読めなければ客先名から
    // 国内と海外で国名の欄の位置が違い、もう一方の位置には日付などがあるので、国名がそのまま読めたときだけ使う（似た字の国名に寄せない。「契約日…」→「ペルー」になった）
    const strict = raw => { const t = N(raw); return COUNTRIES.slice().sort((a, b) => b.length - a.length).find(c => t.includes(c)) || ''; };
    // 字が1つ多い・少ないだけのとき（「マレーシジア」）は、国名の字がすべて入っていれば（3字以上の国名）その国
    const full = raw => { const t = N(raw); return COUNTRIES.filter(c => c.length >= 3 && [...c].every(ch => t.includes(ch))).sort((a, b) => b.length - a.length)[0] || ''; };
    let cn = strict(h.country2) || strict(h.country) || strict(h.country6) || strict(h.country26) || full(h.country2) || full(h.country26);
    if (!cn && h.countryW && COUNTRIES.includes(country(h.countryW))) cn = country(h.countryW);
    if (!COUNTRIES.includes(cn) && opts.countryOf) cn = opts.countryOf(h.dest || '') || opts.countryOf(h.contract || '') || cn;
    const cnOut = cn === 'アラブ首長国連邦' ? 'UAE' : cn, shimuke = cn === '日本' ? 'DMS' : 'EXP'; // 仕向は国内＝DMS、それ以外＝EXP（CE は分けない）
    const dots = p.dots || [], tags = dots.map(egbTags), rowsOf = k => tags.map((m, i) => m.has(k) ? i : -1).filter(i => i >= 0), has = k => rowsOf(k).length > 0;
    const f = {}, hl = new Set(), cond = [], why = {}, NO = {};
    (opts.ops || []).forEach(o => NO[o.name] = o.no);
    const on = (name, rows, reason) => { const no = NO[name]; if (no) f[no] = true; (rows || []).forEach(i => hl.add(i)); if (reason) why[name] = reason; };
    if (form) on(form, null, '機種名 ' + form); // ｾｲｷﾞｮは E・RE・AE・ARE の4列（懸案 全体1）
    if (form === 'AE') on('ATC仕様'); if (form === 'RE') on('ﾛﾎﾞｯﾄ仕様'); if (form === 'ARE') on('ATC付きﾛﾎﾞｯﾄ仕様');
    if (has('BIS2')) on('BI-S2', rowsOf('BIS2')); if (has('BIS1')) on('BI-S1', rowsOf('BIS1'));
    if (has('AS01')) on('AS-01', rowsOf('AS01')); else { on('WOP42'); cond.push('WOP42'); } // AS-01 に ● が無ければ WOP42（機種名に関係なく）
    if (has('G3') && (form === 'ARE' || form === 'RE')) { // 3点ゲージ：ARE は Lｼﾌﾄ・SG軸、RE は SG軸
      if (form === 'ARE') { on('Lｼﾌﾄ', rowsOf('G3')); cond.push('Lｼﾌﾄ'); }
      on('SG軸', rowsOf('G3')); cond.push('SG軸');
    }
    if (std && has('Y3')) on('Y3', rowsOf('Y3')); // 小型機は ● があっても Lｼﾌﾄ・Y3 を付けない
    if (std && has('LS') && !f[NO['Lｼﾌﾄ']]) on('Lｼﾌﾄ', rowsOf('LS'));
    if (has('AF')) on('AF自動ｽﾗｲﾄﾞ', rowsOf('AF')); if (has('MF')) on('手動ｽﾗｲﾄﾞ', rowsOf('MF'));
    if (has('2P') && has('AF')) on('20P/AF', rowsOf('2P')); else if (has('2P')) on('2人操作ﾌｯﾄﾍﾟﾀﾞﾙ', rowsOf('2P'));
    if (has('SF')) on('SF追従装置', rowsOf('SF')); if (has('HSF')) on('ﾍﾋﾞｰSF', rowsOf('HSF'));
    if (has('CL')) { on('ｸﾗﾝﾌﾟ', rowsOf('CL')); cond.push('ｸﾗﾝﾌﾟ'); } // ｸﾗﾝﾌﾟは仕向で分けない
    const tab = has('TAB'); // スマートオペレーションパック（日程表の「ﾓﾊﾞｲﾙHMI★(TAB)」）
    if (tab) { if (std) { on('ﾓﾊﾞｲﾙHMI(TAB)', rowsOf('TAB')); cond.push('TAB'); } on('ﾂｷｱﾃﾓﾆﾀ', rowsOf('TAB')); cond.push('ﾂｷｱﾃﾓﾆﾀ'); }
    if (has('TM') && !f[NO['ﾂｷｱﾃﾓﾆﾀ']]) on('ﾂｷｱﾃﾓﾆﾀ', rowsOf('TM'));
    if (form === 'E' && (has('BIS1') || has('BIS2'))) { on('BIﾂｰﾙﾅﾋﾞ', [...rowsOf('BIS1'), ...rowsOf('BIS2')]); cond.push('BIﾂｰﾙﾅﾋﾞ'); } // 機種名が「E」＋BI-S
    if (has('RIF')) on('ﾛﾎﾞｯﾄIF', rowsOf('RIF'));
    if (has('ERG')) on('ATSAｴﾙｺﾞﾉﾐｸｽ', rowsOf('ERG'));
    if (has('BOTH')) on('特殊仕様', rowsOf('BOTH'), '両手操作');
    if (has('COLOR')) on('指定色', rowsOf('COLOR'));
    const tokT = N(h.tokRaw) + ' ' + N(h.tok);
    if (h.tok || /-\d{3,5}/.test(tokT)) on('特殊仕様', null, '特殊機№');
    // 制御IO：条件に1つでも当たれば1つ。ARE・RE は付けない。小型機はﾛﾎﾞｯﾄIF のときだけ。
    // 制御ASSY（IO）に ● があれば、欄外に IO を書かずにその行をマーキング。条件が無くても制御ASSY（IO）に ● があれば IO（懸案5）
    const io = [];
    if (form !== 'RE' && form !== 'ARE') {
      if (!std) { if (has('RIF')) io.push('ﾛﾎﾞｯﾄIF'); }
      else {
        if (form === 'AE') io.push('AE');
        for (const k of ['AF自動ｽﾗｲﾄﾞ', '手動ｽﾗｲﾄﾞ', 'SF追従装置', 'ﾍﾋﾞｰSF', 'ﾓﾊﾞｲﾙHMI(TAB)', 'ﾛﾎﾞｯﾄIF', '20P/AF', '2人操作ﾌｯﾄﾍﾟﾀﾞﾙ']) if (f[NO[k]]) io.push(k);
        if (has('BOTH')) io.push('両手操作');
      }
      const casy = rowsOf('CASY');
      if (casy.length && !io.length) io.push('制御ASSY（IO）に ●');
      if (io.length) { on('IO', casy); if (!casy.length) cond.push('IO'); }
    }
    // 備考・製造指示追記情報
    // 「【…モデルとの違い】」の変更の一覧（● と同じ）は、次の改訂の表・備考の手前まで外す
    const nt = N(p.notes).replace(/モデル.{0,3}[違遠記]い.*?(?=改[訂町]|備考|$)|モデルより.*?(?=改[訂町]|備考|$)/g, ''), noteKw = [];
    for (const [re, cols] of EGB_NOTE) if (re.test(nt) && !cols.some(c => f[NO[c]])) noteKw.push(re.source.replace(/\\|-\?/g, ''));
    const biko = noteKw.length ? '備考欄記載あり' : '';
    let ser = h.ser;
    return { ym: h.ym, name: `${model} ${shimuke}`, ser, shimuke, country: cnOut, cust: N(h.dest) ? h.dest : h.contract, kind: kind || 'EGB', f, biko,
      plan: { hl: [...hl].sort((a, b) => a - b), cond: [...new Set(cond)], model: form === 'AE' ? 'AE' : '', notes: noteKw }, marks: tags.map(m => [...m].join('+')) };
  }
  const KNOWN = /標準|加圧能力|テーブル長さ|ダイホルダ|受け台|ストッパ|取扱説明|ペンダント|無線デジ|バックゲージ|中間板|[バパ]ーコード|リアガード|サイドガード|突き当て|フットペダル|タッチペン|AMNC|本体|先端段差|クランプ|作動油|韓国仕様|指定色|LED/;
  const known = t => KNOWN.test(N(t)) || marks([t]).size > 0;
  const isCountry = t => COUNTRIES.includes(country(t));
  G.SpJudge = { judge, judgeHG, judgeEGB, egbTags, egbUnsure, egbKind, egbForm, country, tons, marks, marksHG, known, isCountry, COUNTRY_CHARS };
})(window);
