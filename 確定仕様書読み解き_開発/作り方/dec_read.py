# 12月の確定仕様書を目で読んだ結果（正解表のもと）
# f=ファイル, p=ページ, ym=生産年月, ser, model=機種名欄, country=国名, dest=仕向仕様, cust=納入先（空なら契約先）, contract=契約先,
# tok=特殊機№, on=実装の行（OP一覧の名称に当たる ● の行）, note=備考・製造指示追記情報, skip=読まない理由
R = []
def add(**k): R.append(k)
add(f='HRB', p=1, ym='2026年12月', ser='10035441', model='HRB1003', country='インド', dest='オーバーシーズ', cust='【インド】Novateur', contract='Amada (India) Pvt. Ltd. - Technical Center', tok='',
    on=['AS-01'], note='')
add(f='HRB', p=2, ym='2026年12月', ser='10035442', model='HRBC1003', country='中国', dest='中国', cust='【CHINA】北京埃鉑精密製造有限公司', contract='AMADA HONGKONG', tok='',
    on=[], note='製造指示追記情報：-ダイホルダ中国手配')
add(f='HRB', p=3, ym='2026年12月', ser='10035443', model='HRBC1003', country='中国', dest='中国', cust='【CHINA】常州偉泰科技股分有限公司', contract='AMADA HONGKONG', tok='',
    on=[], note='製造指示追記情報：-ダイホルダ中国手配')
add(f='HRB', p=4, ym='2026年12月', ser='10395111', model='HRB1003ATC', country='インド', dest='オーバーシーズ', cust='Amada (India) Pvt. Ltd. - Technical Center', contract='Amada (India) Pvt. Ltd. - Technical Center', tok='',
    on=['AGRIP-A', 'AS-01', 'BI-S1', '手動ｽﾗｲﾄﾞﾌｯﾄ', '制御ASSY(IO)'], note='')
add(f='HRB', p=5, skip='ラック登録一覧')
add(f='HRB', p=6, ym='2026年12月', ser='13035858', model='HRB1303', country='日本', dest='国内', cust='(株)辻田鉄工', contract='(株)辻田鉄工', tok='',
    on=['BI-S2'], note='安全装置「モデル標準【AS-01】」の行に●なし／備考：省エネ補助金採択…／製造指示：80周年メモリアルプレート')
add(f='HRB', p=7, ym='2026年12月', ser='13035859', model='HRB1303', country='日本', dest='国内', cust='(株)藤縄電機製作所', contract='(株)新金谷', tok='',
    on=['AS-01', '追従装置SF1224', 'ｵｰﾄｸﾗｳﾆﾝｸﾞ', '制御ASSY(IO)'], note='備考：省エネ補助金…／製造指示：80周年メモリアルプレート')
add(f='HRB', p=8, ym='2026年12月', ser='13035860', model='HRB1303', country='日本', dest='国内', cust='河合ハウス工業(株)', contract='河合ハウス工業(株)', tok='',
    on=['ｵｰﾄｸﾗｳﾆﾝｸﾞ'], note='安全装置「モデル標準【AS-01】」の行に●なし／備考：省エネ補助金…／製造指示：80周年メモリアルプレート')
add(f='HRB', p=9, ym='2026年12月', ser='13035861', model='HRB1303', country='タイ', dest='タイランド', cust='Amada Asia Pacific Co.,Ltd', contract='Amada Asia Pacific Co.,Ltd', tok='',
    on=['ｵｰﾄｸﾗｳﾆﾝｸﾞ'], note='')
add(f='HRB', p=10, ym='2026年12月', ser='13035862', model='HRB1303', country='アラブ首長国連邦', dest='オーバーシーズ', cust='Amada Middle East FZCO', contract='Amada Middle East FZCO', tok='',
    on=['AS-01', 'ｵｰﾄｸﾗｳﾆﾝｸﾞ'], note='')
add(f='HRB', p=11, ym='2026年12月', ser='13035863', model='HRB1303', country='インド', dest='オーバーシーズ', cust='Amada (India) Pvt. Ltd. - Technical Center', contract='Amada (India) Pvt. Ltd. - Technical Center', tok='',
    on=['AS-01', 'ｵｰﾄｸﾗｳﾆﾝｸﾞ'], note='')
add(f='HRB', p=12, ym='2026年12月', ser='13035864', model='HRB1303', country='台湾', dest='台湾', cust='AMADA TAIWAN INC.', contract='AMADA TAIWAN INC.', tok='',
    on=['AS-01'], note='備考：AMADA TAIWAN 仕様書NO.M202612003')
add(f='HRB', p=13, ym='2026年12月', ser='13035865', model='HRB1303', country='ベトナム', dest='オーバーシーズ', cust='【ベトナム】Foxconnベトナム', contract='AMADA VIETNAM', tok='',
    on=['AS-01', 'BI-S2', '二人ﾌｯﾄ', '制御ASSY(IO)'], note='製造指示追記情報：7/31：2人操作フットペダル、制御ASSY IO 無⇒有（改訂*1・*2）')
add(f='HRB', p=14, ym='2026年12月', ser='13035866', model='HRB1303', country='ベトナム', dest='オーバーシーズ', cust='【ベトナム】Foxconnベトナム', contract='AMADA VIETNAM', tok='',
    on=['AS-01', 'BI-S2', '二人ﾌｯﾄ', '制御ASSY(IO)'], note='製造指示追記情報：7/31：2人操作フットペダル、制御ASSY IO 無⇒有（改訂*3・*4）')
add(f='HRB', p=15, ym='2026年12月', ser='13035867', model='HRBC1303', country='中国', dest='中国', cust='【CHINA】六安市聯東環境試験設備有限公司', contract='AMADA HONGKONG', tok='',
    on=[], note='製造指示追記情報：-ダイホルダ中国手配')
add(f='HRB', p=16, ym='2026年12月', ser='13035869', model='HRBC1303', country='中国', dest='中国', cust='CHINA', contract='AMADA HONGKONG', tok='',
    on=[], note='製造指示追記情報：-ダイホルダ中国手配')
add(f='HRB', p=17, ym='2026年12月', ser='13035870', model='HRBC1303', country='中国', dest='中国', cust='CHINA', contract='AMADA HONGKONG', tok='',
    on=[], note='製造指示追記情報：-ダイホルダ中国手配')
add(f='HRB', p=18, ym='2026年12月', ser='22045187', model='HRB2204', country='日本', dest='国内', cust='(株)ソーゴ', contract='(株)ソーゴ', tok='BD1-4868',
    on=['AGRIP-A', 'AS-01', 'ｵｰﾄｸﾗｳﾆﾝｸﾞ'], note='特殊仕様①〜⑤（ワークセンサツキアテ等）／製造指示：⑤フットペダルスタンド高さ変更 ⑥下部テーブル高さ915 ⑦2Vダイホルダー ⑧ベースプレート、80周年メモリアルプレート')
add(f='HRB', p=19, ym='2026年12月', ser='22045188', model='HRB2204', country='日本', dest='国内', cust='(株)ソーゴ', contract='(株)ソーゴ', tok='BD1-4869',
    on=['AGRIP-A', 'AS-01', 'ｵｰﾄｸﾗｳﾆﾝｸﾞ'], note='特殊仕様①〜⑤（ワークセンサツキアテ等）／製造指示：⑤〜⑧（フットペダルスタンド等）、80周年メモリアルプレート')
add(f='HRB', p=20, ym='2026年12月', ser='22405193', model='HRB2204', country='インド', dest='オーバーシーズ', cust='Amada (India) Pvt. Ltd. - Technical Center', contract='Amada (India) Pvt. Ltd. - Technical Center', tok='',
    on=['AS-01', 'ｵｰﾄｸﾗｳﾆﾝｸﾞ'], note='')
add(f='HRB', p=21, ym='2026年12月', ser='22405194', model='HRBC2204', country='中国', dest='中国', cust='【CHINA】浙江艾隆科技有限公司', contract='AMADA HONGKONG', tok='',
    on=[], note='製造指示追記情報：-ダイホルダ中国手配')
add(f='HRB', p=22, ym='2026年12月', ser='22405195', model='HRB2204', country='インド', dest='オーバーシーズ', cust='Amada (India) Pvt. Ltd. - Technical Center', contract='Amada (India) Pvt. Ltd. - Technical Center', tok='',
    on=['ｵｰﾄｸﾗｳﾆﾝｸﾞ'], note='')
add(f='HRB', p=23, ym='2026年12月', ser='50205219', model='HRB5020', country='日本', dest='国内', cust='テラルクリタ(株)', contract='テラルクリタ(株)', tok='',
    on=['AS-01', 'BI-S1'], note='備考：土岐工場にて出荷前の立会い有り／製造指示：80周年メモリアルプレート')
add(f='HRB', p=24, ym='2026年12月', ser='50205220', model='HRB5020', country='インド', dest='オーバーシーズ', cust='Amada (India) Pvt. Ltd. - Technical Center', contract='Amada (India) Pvt. Ltd. - Technical Center', tok='',
    on=[], note='')
add(f='HRB', p=25, ym='2026年12月', ser='50205221', model='HRB5020', country='タイ', dest='タイランド', cust='AMADA', contract='AMADA THAILAND', tok='',
    on=[], note='製造指示追記情報：ダイホルダーは現地手配')
add(f='HRB', p=26, ym='2026年12月', ser='50205222', model='HRB5020', country='タイ', dest='タイランド', cust='AMADA THAILAND', contract='AMADA THAILAND', tok='',
    on=[], note='製造指示追記情報：ダイホルダーは現地手配')
add(f='HRB', p=27, ym='2026年12月', ser='80255548', model='HRB8025', country='台湾', dest='台湾', cust='AMADA TAIWAN INC.', contract='AMADA TAIWAN INC.', tok='',
    on=['AS-01'], note='備考：AMADA TAIWAN 仕様書NO.M202612002')
add(f='HRB', p=28, ym='2026年12月', ser='80255549', model='HRB8025', country='日本', dest='国内', cust='(有)小山溶接工業', contract='(株)S・S・K', tok='',
    on=['AGRIP-A'], note='安全装置「販売モデル「AS-01」」の行に●なし／中間板 AGRIP-A の行に●／備考：相模原補助金…12月検収／製造指示：80周年メモリアルプレート')
add(f='HRB', p=29, ym='2026年12月', ser='80255550', model='HRB8025', country='日本', dest='国内', cust='(株)アマダベンディングS部', contract='(株)アマダベンディングS部', tok='',
    on=['AS-01'], note='見込み生産機')
add(f='HRB', p=30, ym='2026年12月', ser='80255551', model='HRB8025', country='日本', dest='国内', cust='(株)アマダベンディングS部', contract='(株)アマダベンディングS部', tok='',
    on=['AS-01'], note='見込み生産機')
add(f='HRB', p=31, ym='2026年12月', ser='80255552', model='HRB8025', country='日本', dest='国内', cust='(株)アマダベンディングS部', contract='(株)アマダベンディングS部', tok='',
    on=['AS-01'], note='見込み生産機')
add(f='HRB', p=32, ym='2026年12月', ser='80255553', model='HRBC8025', country='中国', dest='中国', cust='【CHINA】永諧科技(チュウ州)有限公司', contract='AMADA HONGKONG', tok='',
    on=[], note='製造指示追記情報：-ダイホルダ中国手配')
KD_N = '①{m}AAI AAI・CAROLINA工場向け ②KD部品 2026年12月生産 ③中間板：SGRIP仕様 ④取説：現地手配 ⑤オートクラウニング仕様'
add(f='KD', p=1, ym='2026年12月', ser='ARB10553', model='HRB1003', country='米国', dest='アマダアメリカ', cust='AAI', contract='AAI', tok='', on=['AS-01', 'ｵｰﾄｸﾗｳﾆﾝｸﾞ'], note=KD_N.format(m='HRB1003'))
for i, s in [(2, 'ARB10554'), (3, 'ARB10555'), (4, 'ARB10556')]:
    add(f='KD', p=i, ym='2026年12月', ser=s, model='HRB1003', country='米国', dest='アマダアメリカ', cust='AAI', contract='AAI', tok='', on=['AS-01', 'ｵｰﾄｸﾗｳﾆﾝｸﾞ'], note=KD_N.format(m='HRB1003'))
for i, s in [(5, 'ARB20414'), (6, 'ARB20415'), (7, 'ARB20416'), (8, 'ARB20417')]:
    add(f='KD', p=i, ym='2026年12月', ser=s, model='HRB2204', country='米国', dest='アマダアメリカ', cust='AAI', contract='AAI', tok='', on=['AS-01', '二人ﾌｯﾄ', '制御ASSY(IO)', 'ｵｰﾄｸﾗｳﾆﾝｸﾞ', 'Lｼﾌﾄ'], note=KD_N.format(m='HRB2204') + ' ⑥Lシフト仕様')
for i, s in [(9, 'ARB30317'), (10, 'ARB30318'), (11, 'ARB30319'), (12, 'ARB30320')]:
    add(f='KD', p=i, ym='2026年12月', ser=s, model='HRB1303', country='米国', dest='アマダアメリカ', cust='AAI', contract='AAI', tok='', on=['AS-01', 'ｵｰﾄｸﾗｳﾆﾝｸﾞ', 'Lｼﾌﾄ'], note=KD_N.format(m='HRB1303') + ' ⑥Lシフト仕様')
add(f='KD', p=13, ym='2026年12月', ser='ARB30339', model='HRB1303', country='米国', dest='アマダアメリカ', cust='AAI', contract='AAI', tok='', on=['AS-01', 'ｵｰﾄｸﾗｳﾆﾝｸﾞ'], note=KD_N.format(m='HRB1303'))
for i, s in [(14, 'ARB30340'), (15, 'ARB30341'), (16, 'ARB30342')]:
    add(f='KD', p=i, ym='2026年12月', ser=s, model='HRB1303', country='米国', dest='アマダアメリカ', cust='AAI', contract='AAI', tok='', on=['AS-01', 'ｵｰﾄｸﾗｳﾆﾝｸﾞ'], note=KD_N.format(m='HRB1303'))
for i, s in [(17, 'ARB30343'), (18, 'ARB30344'), (19, 'ARB30345'), (20, 'ARB30346')]:
    add(f='KD', p=i, ym='2026年12月', ser=s, model='HRB1303', country='米国', dest='アマダアメリカ', cust='AAI', contract='AAI', tok='', on=['AS-01', 'ｵｰﾄｸﾗｳﾆﾝｸﾞ', 'Lｼﾌﾄ'], note=KD_N.format(m='HRB1303') + ' ⑥Lシフト仕様')
for i, s in [(21, 'ARB80377'), (22, 'ARB80378'), (23, 'ARB80379'), (24, 'ARB80380')]:
    add(f='KD', p=i, ym='2026年12月', ser=s, model='HRB8025', country='米国', dest='アマダアメリカ', cust='AAI', contract='AAI', tok='', on=['AS-01'], note='①HRB8025AAI AAI・CAROLINA工場向け ②KD部品 2026年12月生産 ③中間板：SGRIP仕様 ④取説：現地手配')
for i, s in [(25, 'ARC10090'), (26, 'ARC10091'), (27, 'ARC10092'), (28, 'ARC10093')]:
    add(f='KD', p=i, ym='2026年12月', ser=s, model='HRB1003ATC', country='米国', dest='アマダアメリカ', cust='AAI', contract='AAI', tok='', on=['AGRIP-A', 'AS-01', 'BI-S1', '自動ｽﾗｲﾄﾞﾌｯﾄ', '制御ASSY(IO)', 'ｵｰﾄｸﾗｳﾆﾝｸﾞ', 'Lｼﾌﾄ'], note='①HRB1003ATCAAI AAI・CAROLINA工場向け ②KD部品 2026年12月生産 ③取説：現地手配')
add(f='KD', p=29, skip='AESA 向け（納入先 AESA）'); add(f='KD', p=30, skip='ラック登録一覧'); add(f='KD', p=31, skip='AESA 向け（納入先 AESA）'); add(f='KD', p=32, skip='ラック登録一覧')
