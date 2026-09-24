/** Finite catalogue vocabulary, authored editorial translations rather than a
 * runtime machine-translation service. Longest phrases win; uncovered words
 * are reported by the catalogue tests. Columns: source|en|zh|fr|de|es|ko|ja|it.
 * Source aliases separated by ~ share one translation row.
 */
export const bottleProductRows = `
London Dry Gin|London dry gin|伦敦干金酒|Gin sec de Londres|London Dry Gin|Ginebra seca de Londres|런던 드라이 진|ロンドン・ドライ・ジン|Gin London Dry
Kentucky Straight Bourbon|Kentucky straight bourbon|肯塔基纯正波本|Bourbon straight du Kentucky|Kentucky Straight Bourbon|Bourbon puro de Kentucky|켄터키 스트레이트 버번|ケンタッキー・ストレート・バーボン|Bourbon straight del Kentucky
Single Malt Scotch Whisky|Single malt Scotch whisky|苏格兰单一麦芽威士忌|Whisky écossais single malt|Single Malt Scotch Whisky|Whisky escocés de malta única|싱글 몰트 스카치 위스키|シングルモルト・スコッチウイスキー|Whisky scozzese single malt
Blended Scotch Whisky|Blended Scotch whisky|苏格兰调和威士忌|Whisky écossais d'assemblage|Blended Scotch Whisky|Whisky escocés mezclado|블렌디드 스카치 위스키|ブレンデッド・スコッチウイスキー|Whisky scozzese miscelato
Single Barrel|Single barrel|单桶|Fût unique|Einzelfass|Barrica única|싱글 배럴|シングルバレル|Botte singola
Small Batch|Small batch|小批次|Petit lot|Kleine Charge|Lote pequeño|스몰 배치|スモールバッチ|Piccoli lotti
Bottled In Bond|Bottled in bond|保税装瓶|Embouteillé sous douane|Bottled in Bond|Embotellado bajo fianza|보틀드 인 본드|ボトルド・イン・ボンド|Bottled in Bond
Cask Strength|Cask strength|原桶强度|Brut de fût|Fassstärke|Grado de barrica|캐스크 스트렝스|カスクストレングス|Grado pieno
Navy Strength|Navy strength|海军强度|Force navale|Navy Strength|Graduación naval|네이비 스트렝스|ネイビーストレングス|Gradazione navale
Barrel Aged~Barrel-Aged|Barrel-aged|桶陈|Vieilli en fût|Fassgereift|Añejado en barrica|배럴 숙성|樽熟成|Invecchiato in botte
Barrel Finished|Barrel-finished|过桶|Affiné en fût|Fassveredelt|Acabado en barrica|배럴 피니시|樽仕上げ|Affinato in botte
Year Old~Years Old~Years~Year~Años~Anos|years|年|ans|Jahre|años|년|年|anni
Old No|Old No.|老字号|Ancien n°|Old Nr.|Antiguo n.º|올드 넘버|オールド・ナンバー|Vecchio n.
No Ten~No. Ten|No. Ten|十号|N° dix|Nr. Zehn|N.º diez|넘버 텐|ナンバーテン|N. dieci
No~Number|No.|号|N°|Nr.|N.º|넘버|ナンバー|N.
100 Proof|100 proof|100美制酒精度|100 proof|100 Proof|100 proof|100 프루프|100プルーフ|100 proof
Straight Rye Whiskey|Straight rye whiskey|纯正黑麦威士忌|Whiskey de seigle straight|Straight Rye Whiskey|Whiskey puro de centeno|스트레이트 라이 위스키|ストレート・ライウイスキー|Whiskey di segale straight
Rye Whiskey~Rye Whisky|Rye whiskey|黑麦威士忌|Whiskey de seigle|Roggenwhiskey|Whiskey de centeno|라이 위스키|ライウイスキー|Whiskey di segale
Irish Whiskey|Irish whiskey|爱尔兰威士忌|Whiskey irlandais|Irischer Whiskey|Whiskey irlandés|아이리시 위스키|アイリッシュウイスキー|Whiskey irlandese
Tennessee Whiskey|Tennessee whiskey|田纳西威士忌|Whiskey du Tennessee|Tennessee Whiskey|Whiskey de Tennessee|테네시 위스키|テネシーウイスキー|Whiskey del Tennessee
Canadian Whisky|Canadian whisky|加拿大威士忌|Whisky canadien|Kanadischer Whisky|Whisky canadiense|캐나디안 위스키|カナディアンウイスキー|Whisky canadese
Single Pot Still|Single pot still|单一壶式蒸馏|Single pot still|Single Pot Still|Single pot still|싱글 팟 스틸|シングル・ポットスチル|Single pot still
Pot Still|Pot still|壶式蒸馏|Alambic traditionnel|Pot Still|Alambique tradicional|팟 스틸|ポットスチル|Alambicco tradizionale
Single Malt|Single malt|单一麦芽|Single malt|Single Malt|Malta única|싱글 몰트|シングルモルト|Single malt
Single Grain|Single grain|单一谷物|Single grain|Single Grain|Grano único|싱글 그레인|シングルグレーン|Single grain
Peanut Butter|Peanut butter|花生酱|Beurre de cacahuète|Erdnussbutter|Mantequilla de cacahuete|땅콩버터|ピーナッツバター|Burro di arachidi
Black Label|Black label|黑牌|Étiquette noire|Schwarzes Etikett|Etiqueta negra|블랙 라벨|ブラックラベル|Etichetta nera
Red Label|Red label|红牌|Étiquette rouge|Rotes Etikett|Etiqueta roja|레드 라벨|レッドラベル|Etichetta rossa
Blue Label|Blue label|蓝牌|Étiquette bleue|Blaues Etikett|Etiqueta azul|블루 라벨|ブルーラベル|Etichetta blu
Japanese Harmony|Japanese harmony|和谐|Harmonie japonaise|Japanische Harmonie|Armonía japonesa|재패니즈 하모니|ジャパニーズハーモニー|Armonia giapponese
Navy Grog|Navy grog|海军格罗格|Grog naval|Navy Grog|Grog naval|네이비 그로그|ネイビー・グロッグ|Grog navale
Overproof|Overproof|高度|Haute teneur en alcool|Hochprozentig|Alta graduación|오버프루프|オーバープルーフ|Alta gradazione
Original Dark|Original dark|经典深色|Brun original|Original dunkel|Oscuro original|오리지널 다크|オリジナル・ダーク|Scuro originale
Original Spiced Gold|Original spiced gold|经典香料金|Épicé doré original|Original würzig-gold|Dorado especiado original|오리지널 스파이스드 골드|オリジナル・スパイスド・ゴールド|Dorato speziato originale
White Rum~Rhum Blanc|White rum|白朗姆酒|Rhum blanc|Weißer Rum|Ron blanco|화이트 럼|ホワイトラム|Rum bianco
Dark Rum|Dark rum|深色朗姆酒|Rhum brun|Dunkler Rum|Ron oscuro|다크 럼|ダークラム|Rum scuro
Light Rum|Light rum|浅色朗姆酒|Rhum léger|Heller Rum|Ron claro|라이트 럼|ライトラム|Rum chiaro
Aged Rum|Aged rum|陈年朗姆酒|Rhum vieux|Gereifter Rum|Ron añejo|숙성 럼|熟成ラム|Rum invecchiato
Rhum Agricole~Agricole Rhum~Agricole Rum|Agricole rum|农业朗姆酒|Rhum agricole|Rhum agricole|Ron agrícola|아그리콜 럼|アグリコール・ラム|Rum agricolo
Spiced Rum|Spiced rum|香料朗姆酒|Rhum épicé|Gewürzrum|Ron especiado|스파이스드 럼|スパイスドラム|Rum speziato
Gold Rum|Gold rum|金朗姆酒|Rhum doré|Goldener Rum|Ron dorado|골드 럼|ゴールドラム|Rum dorato
Black Strap|Black strap|黑糖蜜|Mélasse noire|Schwarze Melasse|Melaza negra|블랙스트랩|ブラックストラップ|Melassa nera
High Ester|High ester|高酯|Riche en esters|Esterreich|Alto en ésteres|고에스테르|ハイエステル|Ricco di esteri
Long Fermentation|Long fermentation|长时间发酵|Longue fermentation|Lange Gärung|Fermentación larga|장기 발효|長期発酵|Lunga fermentazione
Reserva Exclusiva|Exclusive reserve|专属珍藏|Réserve exclusive|Exklusive Reserve|Reserva exclusiva|익스클루시브 리저브|エクスクルーシブ・リザーヴ|Riserva esclusiva
Gran Reserva~Grande Reserve~Grande Réserve|Grand reserve|高级珍藏|Grande réserve|Große Reserve|Gran reserva|그랑 리저브|グラン・リザーヴ|Gran riserva
Estate Reserve|Estate reserve|庄园珍藏|Réserve du domaine|Gutsreserve|Reserva de la finca|에스테이트 리저브|エステート・リザーヴ|Riserva della tenuta
Signature Blend|Signature blend|招牌调和|Assemblage signature|Signature-Mischung|Mezcla de la casa|시그니처 블렌드|シグネチャー・ブレンド|Miscela della casa
Blanco~Blanc~White~Bianco~Blanche|White|白|Blanc|Weiß|Blanco|화이트|ホワイト|Bianco
Plata~Silver|Silver|银|Argent|Silber|Plata|실버|シルバー|Argento
Reposado|Reposado|短期陈酿|Reposado|Reposado|Reposado|레포사도|レポサド|Reposado
Extra Añejo~Extra Anejo|Extra-aged|特陈|Extra-vieilli|Extra gereift|Extra añejo|엑스트라 아네호|エクストラ・アネホ|Extra invecchiato
Añejo~Anejo~Aged~Viejo~Vieux|Aged|陈年|Vieilli|Gereift|Añejo|숙성|熟成|Invecchiato
Cristalino|Cristalino|水晶陈酿|Cristalino|Cristalino|Cristalino|크리스탈리노|クリスタリーノ|Cristalino
Joven|Young|年轻|Jeune|Jung|Joven|호벤|ホベン|Giovane
Espadín~Espadin|Espadín|剑叶龙舌兰|Espadín|Espadín|Espadín|에스파딘|エスパディン|Espadín
Tobala~Tobalá|Tobalá|托巴拉龙舌兰|Tobalá|Tobalá|Tobalá|토발라|トバラ|Tobalá
Cuishe|Cuishe|库伊谢龙舌兰|Cuishe|Cuishe|Cuishe|쿠이셰|クイシェ|Cuishe
Ensamble|Blend|混合品种|Assemblage|Mischung|Ensamble|앙상블|エンサンブル|Miscela
Eau de Vie|Eau-de-vie|水果白兰地|Eau-de-vie|Obstbrand|Aguardiente de fruta|오드비|オー・ド・ヴィ|Acquavite
Eau de Vie de Poire|Pear eau-de-vie|梨白兰地|Eau-de-vie de poire|Birnenbrand|Aguardiente de pera|배 오드비|洋梨のオー・ド・ヴィ|Acquavite di pere
Apple Brandy|Apple brandy|苹果白兰地|Eau-de-vie de pomme|Apfelbrand|Brandy de manzana|애플 브랜디|アップルブランデー|Brandy di mele
Pisco|Pisco|皮斯科|Pisco|Pisco|Pisco|피스코|ピスコ|Pisco
Cognac|Cognac|干邑|Cognac|Cognac|Coñac|코냑|コニャック|Cognac
Calvados|Calvados|卡尔瓦多斯|Calvados|Calvados|Calvados|칼바도스|カルヴァドス|Calvados
Armagnac|Armagnac|雅文邑|Armagnac|Armagnac|Armañac|아르마냑|アルマニャック|Armagnac
Brandy|Brandy|白兰地|Brandy|Weinbrand|Brandy|브랜디|ブランデー|Brandy
Applejack|Applejack|苹果杰克|Applejack|Applejack|Applejack|애플잭|アップルジャック|Applejack
Gin|Gin|金酒|Gin|Gin|Ginebra|진|ジン|Gin
Vodka|Vodka|伏特加|Vodka|Wodka|Vodka|보드카|ウォッカ|Vodka
Whiskey~Whisky|Whisky|威士忌|Whisky|Whisky|Whisky|위스키|ウイスキー|Whisky
Bourbon|Bourbon|波本|Bourbon|Bourbon|Bourbon|버번|バーボン|Bourbon
Rum~Rhum~Ron|Rum|朗姆酒|Rhum|Rum|Ron|럼|ラム|Rum
Tequila|Tequila|龙舌兰酒|Tequila|Tequila|Tequila|테킬라|テキーラ|Tequila
Mezcal|Mezcal|梅斯卡尔|Mezcal|Mezcal|Mezcal|메스칼|メスカル|Mezcal
Cachaça~Cachaca|Cachaça|卡莎萨|Cachaça|Cachaça|Cachaça|카샤사|カシャーサ|Cachaça
Aquavit~Akvavit|Aquavit|阿夸维特|Aquavit|Aquavit|Aquavit|아쿠아비트|アクアヴィット|Acquavite scandinava
Genever|Genever|荷式金酒|Genièvre|Genever|Ginebra holandesa|제네버|ジュネヴァ|Genever
Shochu|Shochu|烧酎|Shōchū|Shōchū|Shōchū|쇼추|焼酎|Shōchū
Soju|Soju|烧酒|Soju|Soju|Soju|소주|ソジュ|Soju
Junmai Daiginjo|Junmai daiginjo|纯米大吟酿|Junmai daiginjo|Junmai Daiginjō|Junmai daiginjo|준마이 다이긴조|純米大吟醸|Junmai daiginjo
Junmai Ginjo|Junmai ginjo|纯米吟酿|Junmai ginjo|Junmai Ginjō|Junmai ginjo|준마이 긴조|純米吟醸|Junmai ginjo
Junmai|Junmai|纯米|Junmai|Junmai|Junmai|준마이|純米|Junmai
Daiginjo|Daiginjo|大吟酿|Daiginjo|Daiginjō|Daiginjo|다이긴조|大吟醸|Daiginjo
Sake|Sake|清酒|Saké|Sake|Sake|사케|日本酒|Sakè
Baijiu|Baijiu|白酒|Baijiu|Baijiu|Baijiu|바이주|白酒|Baijiu
Grappa|Grappa|格拉帕|Grappa|Grappa|Grappa|그라파|グラッパ|Grappa
Absinthe|Absinthe|苦艾酒|Absinthe|Absinth|Absenta|압생트|アブサン|Assenzio
Sweet Vermouth|Sweet vermouth|甜味美思|Vermouth doux|Süßer Wermut|Vermut dulce|스위트 베르무트|スイートベルモット|Vermouth dolce
Dry Vermouth|Dry vermouth|干味美思|Vermouth sec|Trockener Wermut|Vermut seco|드라이 베르무트|ドライベルモット|Vermouth secco
Vermouth|Vermouth|味美思|Vermouth|Wermut|Vermut|베르무트|ベルモット|Vermouth
Port Wine~Port|Port|波特酒|Porto|Portwein|Oporto|포트와인|ポートワイン|Porto
Sherry|Sherry|雪莉酒|Xérès|Sherry|Jerez|셰리|シェリー|Sherry
Madeira|Madeira|马德拉酒|Madère|Madeira|Madeira|마데이라|マデイラ|Madeira
Champagne|Champagne|香槟|Champagne|Champagner|Champán|샴페인|シャンパン|Champagne
Prosecco|Prosecco|普罗塞克|Prosecco|Prosecco|Prosecco|프로세코|プロセッコ|Prosecco
Brut|Brut|天然干型|Brut|Brut|Brut|브뤼|ブリュット|Brut
Fino|Fino|菲诺|Fino|Fino|Fino|피노|フィノ|Fino
Amontillado|Amontillado|阿蒙蒂亚多|Amontillado|Amontillado|Amontillado|아몬티야도|アモンティリャード|Amontillado
Oloroso|Oloroso|欧罗索|Oloroso|Oloroso|Oloroso|올로로소|オロロソ|Oloroso
Pedro Ximenez~Pedro Ximénez|Pedro Ximénez|佩德罗希梅内斯|Pedro Ximénez|Pedro Ximénez|Pedro Ximénez|페드로 히메네스|ペドロ・ヒメネス|Pedro Ximénez
Cream Sherry|Cream sherry|奶油雪莉|Xérès cream|Cream Sherry|Jerez cream|크림 셰리|クリーム・シェリー|Sherry cream
Liqueur~Liquore~Licor|Liqueur|利口酒|Liqueur|Likör|Licor|리큐어|リキュール|Liquore
Bitter Liqueur|Bitter liqueur|苦味利口酒|Liqueur amère|Bitterlikör|Licor amargo|비터 리큐어|ビターリキュール|Liquore amaro
Herbal Liqueur|Herbal liqueur|草本利口酒|Liqueur aux plantes|Kräuterlikör|Licor de hierbas|허브 리큐어|ハーブリキュール|Liquore alle erbe
Coffee Liqueur|Coffee liqueur|咖啡利口酒|Liqueur de café|Kaffeelikör|Licor de café|커피 리큐어|コーヒーリキュール|Liquore al caffè
Cream Liqueur|Cream liqueur|奶油利口酒|Liqueur à la crème|Sahnelikör|Licor de crema|크림 리큐어|クリームリキュール|Liquore alla crema
Irish Cream|Irish cream|爱尔兰奶油|Crème irlandaise|Irische Sahne|Crema irlandesa|아이리시 크림|アイリッシュ・クリーム|Crema irlandese
Cold Brew|Cold brew|冷萃|Infusion à froid|Kalt aufgebrüht|Infusión en frío|콜드 브루|コールドブリュー|Infusione a freddo
Crème de Cassis~Creme de Cassis|Blackcurrant liqueur|黑加仑利口酒|Crème de cassis|Schwarzer Johannisbeerlikör|Licor de grosella negra|블랙커런트 리큐어|カシスリキュール|Liquore di ribes nero
Crème de Cacao~Creme de Cacao|Cocoa liqueur|可可利口酒|Crème de cacao|Kakaolikör|Licor de cacao|카카오 리큐어|カカオリキュール|Liquore al cacao
Crème de Menthe~Creme de Menthe|Mint liqueur|薄荷利口酒|Crème de menthe|Minzlikör|Licor de menta|민트 리큐어|ミントリキュール|Liquore alla menta
Crème de Violette~Creme de Violette|Violet liqueur|紫罗兰利口酒|Crème de violette|Veilchenlikör|Licor de violeta|바이올렛 리큐어|ヴァイオレットリキュール|Liquore alla violetta
Crème de Banane~Creme de Banane|Banana liqueur|香蕉利口酒|Crème de banane|Bananenlikör|Licor de plátano|바나나 리큐어|バナナリキュール|Liquore alla banana
Crème de Mûre~Creme de Mure|Blackberry liqueur|黑莓利口酒|Crème de mûre|Brombeerlikör|Licor de mora|블랙베리 리큐어|ブラックベリーリキュール|Liquore di more
Crème de Pêche~Creme de Peche|Peach liqueur|桃子利口酒|Crème de pêche|Pfirsichlikör|Licor de melocotón|복숭아 리큐어|ピーチリキュール|Liquore alla pesca
Creme de Framboise~Crème de Framboise|Raspberry liqueur|覆盆子利口酒|Crème de framboise|Himbeerlikör|Licor de frambuesa|라즈베리 리큐어|ラズベリーリキュール|Liquore al lampone
Creme de Moka|Mocha liqueur|摩卡利口酒|Crème de moka|Mokkalikör|Licor de moka|모카 리큐어|モカリキュール|Liquore alla moka
Creme de Noyaux|Stone-fruit kernel liqueur|核果仁利口酒|Crème de noyaux|Steinobstkernlikör|Licor de huesos de fruta|핵과 씨앗 리큐어|核果の種リキュール|Liquore di noccioli
Amaretto|Amaretto|杏仁利口酒|Amaretto|Amaretto|Amaretto|아마레토|アマレット|Amaretto
Amaro|Amaro|阿玛罗苦酒|Amaro|Amaro|Amaro|아마로|アマーロ|Amaro
Aperitivo~Aperitif~L Aperitivo~L Aperitvo|Aperitif|开胃酒|Apéritif|Aperitif|Aperitivo|아페리티프|アペリティフ|Aperitivo
Digestif|Digestif|餐后酒|Digestif|Digestif|Digestivo|디제스티프|ディジェスティフ|Digestivo
Bitters|Bitters|苦精|Bitters|Bitter|Amargos|비터스|ビターズ|Bitter
Bitter|Bitter|苦味|Amer|Bitter|Amargo|비터|ビター|Amaro
Triple Sec|Triple sec|橙味利口酒|Triple sec|Triple Sec|Triple seco|트리플 섹|トリプルセック|Triple sec
Curaçao~Curacao|Curaçao|库拉索橙酒|Curaçao|Curaçao|Curaçao|퀴라소|キュラソー|Curaçao
Maraschino|Maraschino|马拉斯奇诺樱桃酒|Marasquin|Maraschino|Marrasquino|마라스키노|マラスキーノ|Maraschino
Limoncello|Limoncello|柠檬甜酒|Limoncello|Limoncello|Limoncello|리몬첼로|リモンチェッロ|Limoncello
Sambuca|Sambuca|桑布卡茴香酒|Sambuca|Sambuca|Sambuca|삼부카|サンブーカ|Sambuca
Falernum|Falernum|法勒纳姆|Falernum|Falernum|Falernum|팔레르눔|ファレルナム|Falernum
Schnapps|Schnapps|香甜酒|Schnaps|Schnaps|Schnapps|슈냅스|シュナップス|Schnapps
Punsch|Punsch|潘趣利口酒|Punsch|Punsch|Punsch|펀슈|プンシュ|Punsch
Genepy~Génépy|Génépy|高山艾草酒|Génépy|Génépy|Génépy|제네피|ジェネピ|Génépy
Rakomelo|Rakomelo|蜂蜜拉基酒|Rakomelo|Rakomelo|Rakomelo|라코멜로|ラコメロ|Rakomelo
Anisette|Anisette|茴香利口酒|Anisette|Anislikör|Anís dulce|아니제트|アニゼット|Anisetta
Horchata|Horchata|欧洽塔|Horchata|Horchata|Horchata|오르차타|オルチャータ|Horchata
Pimento Dram~Allspice Dram|Allspice dram|多香果利口酒|Liqueur de piment de la Jamaïque|Pimentlikör|Licor de pimienta de Jamaica|올스파이스 리큐어|オールスパイス・ドラム|Liquore al pimento
Blood Orange|Blood orange|血橙|Orange sanguine|Blutorange|Naranja sanguina|블러드 오렌지|ブラッドオレンジ|Arancia rossa
Sour Cherry|Sour cherry|酸樱桃|Griotte|Sauerkirsche|Guinda|사워 체리|サワーチェリー|Amarena
Sour Apple|Sour apple|酸苹果|Pomme acidulée|Saurer Apfel|Manzana ácida|사워 애플|サワーアップル|Mela aspra
Passion Fruit|Passion fruit|百香果|Fruit de la passion|Passionsfrucht|Maracuyá|패션프루트|パッションフルーツ|Frutto della passione
Macadamia Nut|Macadamia nut|夏威夷果|Noix de macadamia|Macadamianuss|Nuez de macadamia|마카다미아|マカダミアナッツ|Noce di macadamia
Green Tea|Green tea|绿茶|Thé vert|Grüner Tee|Té verde|녹차|緑茶|Tè verde
Green Chile|Green chile|青辣椒|Piment vert|Grüne Chili|Chile verde|풋고추|青唐辛子|Peperoncino verde
Chili Pepper~Chile Poblano~Mexican Chile~Ancho Chile|Chile pepper|辣椒|Piment|Chili|Chile|고추|唐辛子|Peperoncino
Stone Pine|Stone pine|石松|Pin cembro|Zirbelkiefer|Pino cembro|잣나무|スイス松|Pino cembro
Blackcurrant~Black Currant~Cassis~Currant|Blackcurrant|黑加仑|Cassis|Schwarze Johannisbeere|Grosella negra|블랙커런트|カシス|Ribes nero
Blackberry~Mure~Mûre|Blackberry|黑莓|Mûre|Brombeere|Mora|블랙베리|ブラックベリー|Mora
Raspberry~Framboise|Raspberry|覆盆子|Framboise|Himbeere|Frambuesa|라즈베리|ラズベリー|Lampone
Strawberry|Strawberry|草莓|Fraise|Erdbeere|Fresa|딸기|ストロベリー|Fragola
Pineapple|Pineapple|菠萝|Ananas|Ananas|Piña|파인애플|パイナップル|Ananas
Banana~Banane|Banana|香蕉|Banane|Banane|Plátano|바나나|バナナ|Banana
Coconut~Coco|Coconut|椰子|Noix de coco|Kokosnuss|Coco|코코넛|ココナッツ|Cocco
Orange~Orancio~D Orange|Orange|橙|Orange|Orange|Naranja|오렌지|オレンジ|Arancia
Lemon~Le Citron~Con Limone|Lemon|柠檬|Citron|Zitrone|Limón|레몬|レモン|Limone
Lime|Lime|青柠|Citron vert|Limette|Lima|라임|ライム|Lime
Apricot~Abricot|Apricot|杏|Abricot|Aprikose|Albaricoque|살구|アプリコット|Albicocca
Peach~Peche~Pêche|Peach|桃|Pêche|Pfirsich|Melocotón|복숭아|ピーチ|Pesca
Pear~Poire|Pear|梨|Poire|Birne|Pera|배|洋梨|Pera
Apple|Apple|苹果|Pomme|Apfel|Manzana|사과|アップル|Mela
Cherry|Cherry|樱桃|Cerise|Kirsche|Cereza|체리|チェリー|Ciliegia
Grapefruit~Pamplemousse|Grapefruit|葡萄柚|Pamplemousse|Grapefruit|Pomelo|자몽|グレープフルーツ|Pompelmo
Lychee~Lichi Li|Lychee|荔枝|Litchi|Litschi|Lichi|리치|ライチ|Litchi
Guava|Guava|番石榴|Goyave|Guave|Guayaba|구아바|グアバ|Guava
Mango|Mango|芒果|Mangue|Mango|Mango|망고|マンゴー|Mango
Melon|Melon|蜜瓜|Melon|Melone|Melón|멜론|メロン|Melone
Quince|Quince|榅桲|Coing|Quitte|Membrillo|모과|マルメロ|Mela cotogna
Fig|Fig|无花果|Figue|Feige|Higo|무화과|イチジク|Fico
Persimmon|Persimmon|柿子|Kaki|Kaki|Caqui|감|柿|Cachi
Acai~Açaí|Açaí|巴西莓|Açaï|Açaí|Açaí|아사이|アサイー|Açaí
Tamarindo|Tamarind|罗望子|Tamarin|Tamarinde|Tamarindo|타마린드|タマリンド|Tamarindo
Yuzu|Yuzu|日本柚子|Yuzu|Yuzu|Yuzu|유자|柚子|Yuzu
Bergamotto~Bergamot|Bergamot|佛手柑|Bergamote|Bergamotte|Bergamota|베르가모트|ベルガモット|Bergamotto
Coffee~Cafe~Caffé~Caffe|Coffee|咖啡|Café|Kaffee|Café|커피|コーヒー|Caffè
Espresso|Espresso|浓缩咖啡|Espresso|Espresso|Espresso|에스프레소|エスプレッソ|Espresso
Cacao~Cocoa|Cocoa|可可|Cacao|Kakao|Cacao|카카오|カカオ|Cacao
Chocolate|Chocolate|巧克力|Chocolat|Schokolade|Chocolate|초콜릿|チョコレート|Cioccolato
Hazelnut|Hazelnut|榛子|Noisette|Haselnuss|Avellana|헤이즐넛|ヘーゼルナッツ|Nocciola
Walnut~Nocino|Walnut|核桃|Noix|Walnuss|Nuez|호두|クルミ|Noce
Pistacchio|Pistachio|开心果|Pistache|Pistazie|Pistacho|피스타치오|ピスタチオ|Pistacchio
Vanilla~Vanille|Vanilla|香草|Vanille|Vanille|Vainilla|바닐라|バニラ|Vaniglia
Ginger|Ginger|姜|Gingembre|Ingwer|Jengibre|생강|ジンジャー|Zenzero
Cinnamon|Cinnamon|肉桂|Cannelle|Zimt|Canela|계피|シナモン|Cannella
Mint~Menta|Mint|薄荷|Menthe|Minze|Menta|민트|ミント|Menta
Spearmint~Menthe Verte|Spearmint|留兰香|Menthe verte|Grüne Minze|Hierbabuena|스피어민트|スペアミント|Menta verde
Basil|Basil|罗勒|Basilic|Basilikum|Albahaca|바질|バジル|Basilico
Lemongrass~Citronnelle|Lemongrass|香茅|Citronnelle|Zitronengras|Hierba limón|레몬그라스|レモングラス|Citronella
Elderflower|Elderflower|接骨木花|Fleur de sureau|Holunderblüte|Flor de saúco|엘더플라워|エルダーフラワー|Fiori di sambuco
Matcha|Matcha|抹茶|Matcha|Matcha|Matcha|말차|抹茶|Matcha
Mushroom|Mushroom|蘑菇|Champignon|Pilz|Seta|버섯|キノコ|Funghi
Pandan|Pandan|斑斓叶|Pandan|Pandan|Pandán|판단|パンダン|Pandan
Aloe|Aloe|芦荟|Aloès|Aloe|Aloe|알로에|アロエ|Aloe
Hay|Hay|干草|Foin|Heu|Heno|건초|干し草|Fieno
Saffron|Saffron|藏红花|Safran|Safran|Azafrán|사프란|サフラン|Zafferano
Gentiane~Gentian|Gentian|龙胆|Gentiane|Enzian|Genciana|용담|ゲンチアナ|Genziana
Mastic|Mastic|乳香|Mastic|Mastix|Almáciga|매스틱|マスティハ|Mastice
Bison Grass|Bison grass|野牛草|Herbe de bison|Büffelgras|Hierba de bisonte|들소풀|バイソングラス|Erba del bisonte
Potato|Potato|马铃薯|Pomme de terre|Kartoffel|Patata|감자|ポテト|Patata
Rice|Rice|米|Riz|Reis|Arroz|쌀|米|Riso
Rye|Rye|黑麦|Seigle|Roggen|Centeno|라이|ライ麦|Segale
Corn|Corn|玉米|Maïs|Mais|Maíz|옥수수|トウモロコシ|Mais
Wheat|Wheat|小麦|Blé|Weizen|Trigo|밀|小麦|Grano
Malt|Malt|麦芽|Malt|Malz|Malta|몰트|モルト|Malto
Sloe|Sloe|黑刺李|Prunelle|Schlehe|Endrina|슬로|スロー|Prugnolo
Original~Originale~L Original|Original|经典原版|Original|Original|Original|오리지널|オリジナル|Originale
Dry~Seco~Sec|Dry|干型|Sec|Trocken|Seco|드라이|ドライ|Secco
Extra Dry|Extra dry|特干|Extra-sec|Extra trocken|Extra seco|엑스트라 드라이|エクストラ・ドライ|Extra secco
Sweet|Sweet|甜型|Doux|Süß|Dulce|스위트|スイート|Dolce
Red~Rosso~Rouge|Red|红|Rouge|Rot|Rojo|레드|レッド|Rosso
Green~Verde~Verte|Green|绿|Vert|Grün|Verde|그린|グリーン|Verde
Yellow|Yellow|黄|Jaune|Gelb|Amarillo|옐로|イエロー|Giallo
Black~Negra~Noir|Black|黑|Noir|Schwarz|Negro|블랙|ブラック|Nero
Blue|Blue|蓝|Bleu|Blau|Azul|블루|ブルー|Blu
Gold~Oro|Gold|金|Or|Gold|Oro|골드|ゴールド|Oro
Pink~Rosa~Rose~Rosé|Rosé|玫瑰色|Rosé|Rosé|Rosado|로제|ロゼ|Rosato
Amber~Ambré|Amber|琥珀|Ambré|Bernstein|Ámbar|앰버|アンバー|Ambrato
Double|Double|双倍|Double|Doppelt|Doble|더블|ダブル|Doppio
Triple|Triple|三重|Triple|Dreifach|Triple|트리플|トリプル|Triplo
Reserve~Reserva|Reserve|珍藏|Réserve|Reserve|Reserva|리저브|リザーヴ|Riserva
Select~Selection|Selection|精选|Sélection|Auswahl|Selección|셀렉트|セレクト|Selezione
Premium|Premium|优选|Premium|Premium|Prémium|프리미엄|プレミアム|Premium
Deluxe|Deluxe|豪华|De luxe|Deluxe|De lujo|디럭스|デラックス|Lusso
Rare|Rare|珍稀|Rare|Selten|Raro|레어|レア|Raro
Special|Special|特选|Spécial|Spezial|Especial|스페셜|スペシャル|Speciale
Classic~Clasico~Clásico~Classico|Classic|经典|Classique|Klassisch|Clásico|클래식|クラシック|Classico
Organic|Organic|有机|Biologique|Bio|Orgánico|유기농|オーガニック|Biologico
Botanical|Botanical|植物|Botanique|Botanisch|Botánico|보태니컬|ボタニカル|Botanico
Herbal|Herbal|草本|Aux plantes|Kräuter|Herbal|허브|ハーブ|Alle erbe
Aromatic|Aromatic|芳香|Aromatique|Aromatisch|Aromático|아로마틱|アロマティック|Aromatico
Spiced~Spicy|Spiced|香料|Épicé|Würzig|Especiado|스파이스드|スパイスド|Speziato
Handmade|Handmade|手工|Artisanal|Handgemacht|Artesanal|수제|ハンドメイド|Artigianale
Straight|Straight|纯正|Straight|Straight|Puro|스트레이트|ストレート|Straight
Blended~Blend|Blended|调和|Assemblage|Verschnitt|Mezcla|블렌디드|ブレンデッド|Miscelato
Barreled|Barreled|桶陈|Mis en fût|Fassgelagert|En barrica|배럴 숙성|樽熟成|In botte
Barrel~Cask|Cask|橡木桶|Fût|Fass|Barrica|캐스크|樽|Botte
American|American|美国|Américain|Amerikanisch|Americano|아메리칸|アメリカン|Americano
Irish|Irish|爱尔兰|Irlandais|Irisch|Irlandés|아이리시|アイリッシュ|Irlandese
Japanese|Japanese|日本|Japonais|Japanisch|Japonés|재패니즈|ジャパニーズ|Giapponese
Scotch~Scottish|Scottish|苏格兰|Écossais|Schottisch|Escocés|스카치|スコッチ|Scozzese
Canadian|Canadian|加拿大|Canadien|Kanadisch|Canadiense|캐나디안|カナディアン|Canadese
Jamaican|Jamaican|牙买加|Jamaïcain|Jamaikanisch|Jamaicano|자메이카|ジャマイカン|Giamaicano
British|British|英国|Britannique|Britisch|Británico|브리티시|ブリティッシュ|Britannico
Mexican|Mexican|墨西哥|Mexicain|Mexikanisch|Mexicano|멕시칸|メキシカン|Messicano
Swedish|Swedish|瑞典|Suédois|Schwedisch|Sueco|스웨디시|スウェディッシュ|Svedese
Swiss~Suisse|Swiss|瑞士|Suisse|Schweizer|Suizo|스위스|スイス|Svizzero
Spanish|Spanish|西班牙|Espagnol|Spanisch|Español|스페니시|スパニッシュ|Spagnolo
Italian|Italian|意大利|Italien|Italienisch|Italiano|이탈리안|イタリアン|Italiano
French|French|法国|Français|Französisch|Francés|프렌치|フレンチ|Francese
Australian|Australian|澳大利亚|Australien|Australisch|Australiano|오스트레일리안|オーストラリアン|Australiano
Haitian|Haitian|海地|Haïtien|Haitianisch|Haitiano|아이티|ハイチ|Haitiano
Grenadian|Grenadian|格林纳达|Grenadien|Grenadisch|Granadino|그레나다|グレナダ|Grenadino
Cream~Crema|Cream|奶油|Crème|Sahne|Crema|크림|クリーム|Crema
Wine~Vino|Wine|葡萄酒|Vin|Wein|Vino|와인|ワイン|Vino
Spirit|Spirit|烈酒|Spiritueux|Spirituose|Aguardiente|스피릿|スピリッツ|Distillato
Proof|Proof|美制酒精度|Proof|Proof|Proof|프루프|プルーフ|Proof
`;
