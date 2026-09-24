/** Editorial transliterations, not producer-name evidence. Latin-script
 * locales retain brand trademarks; CJK locales use a readable local form.
 * Source brandName and product name are never overwritten.
 * Columns: original | zh | ko | ja.
 */
const rows = `
Tanqueray|添加利|탱커레이|タンカレー
Bombay Sapphire|孟买蓝宝石|봄베이 사파이어|ボンベイ・サファイア
Hendrick’s|亨利爵士|헨드릭스|ヘンドリックス
Sipsmith|希普史密斯|십스미스|シップスミス
The Botanist|植物学家|더 보타니스트|ザ・ボタニスト
Four Pillars|四柱|포 필라스|フォー・ピラーズ
Monkey 47|猴王47|몽키 47|モンキー47
Fords|福特|포즈|フォーズ
Aviation|飞行|에비에이션|アビエーション
Malfy|马尔菲|말피|マルフィ
Gin Mare|海洋之心|진 마레|ジン・マーレ
KI NO BI|季之美|키노비|季の美
Nikka|日果|닛카|ニッカ
Citadelle|城堡|시타델|シタデル
Martin Miller’s|马丁·米勒|마틴 밀러|マーティン・ミラーズ
NOLET’S|诺莱|놀렛|ノレット
Leopold Bros|利奥波德兄弟|레오폴드 브라더스|レオポルド・ブラザーズ
Hayman’s|海曼|헤이먼스|ヘイマンズ
Bluecoat|蓝衣|블루코트|ブルーコート
St. George Spirits|圣乔治|세인트 조지|セント・ジョージ
Barr Hill|巴尔山|바 힐|バー・ヒル
Greenhook Ginsmiths|绿钩|그린훅 진스미스|グリーンフック・ジンスミス
KOVAL|科瓦尔|코발|コーヴァル
Watershed Distillery|分水岭酒厂|워터셰드 증류소|ウォーターシェッド蒸留所
Drumshanbo|德拉姆香波|드럼샨보|ドラムシャンボ
Buffalo Trace|水牛足迹|버팔로 트레이스|バッファロー・トレース
Maker’s Mark|美格|메이커스 마크|メーカーズマーク
Wild Turkey|威凤凰|와일드 터키|ワイルドターキー
Blanton’s|布兰顿|블랜튼|ブラントン
Woodford Reserve|伍德福珍藏|우드포드 리저브|ウッドフォードリザーブ
Jameson|尊美醇|제임슨|ジェムソン
Redbreast|知更鸟|레드브레스트|レッドブレスト
Bulleit|布莱特|불릿|ブレット
Knob Creek|诺布溪|놉 크릭|ノブクリーク
Four Roses|四玫瑰|포 로지스|フォアローゼズ
Old Forester|老林人|올드 포레스터|オールドフォレスター
Jack Daniel’s|杰克丹尼|잭 다니엘|ジャックダニエル
Michter’s|酩帝诗|믹터스|ミクターズ
Sazerac|萨泽拉克|사제락|サゼラック
Rittenhouse|里滕豪斯|리튼하우스|リッテンハウス
Glenfiddich|格兰菲迪|글렌피딕|グレンフィディック
Hibiki|响|히비키|響
Yamazaki|山崎|야마자키|山崎
Johnnie Walker|尊尼获加|조니 워커|ジョニーウォーカー
Crown Royal|皇冠|크라운 로열|クラウンローヤル
Mount Gay|盖伊山|마운트 게이|マウントゲイ
Appleton Estate|阿普尔顿庄园|애플턴 에스테이트|アプルトン・エステート
Flor de Caña|甘蔗之花|플로르 데 카냐|フロール・デ・カーニャ
Rhum Barbancourt|巴班库|바방쿠르|バルバンクール
Planteray|普朗特雷|플랜터레이|プランテレー
Diplomático|外交官|디플로마티코|ディプロマティコ
El Dorado|黄金国|엘 도라도|エル・ドラド
Espolòn|艾斯波隆|에스폴론|エスポロン
Tequila Ocho|奥乔|오초|オチョ
Fortaleza|福塔雷萨|포르탈레사|フォルタレサ
Herradura|赫拉杜拉|에라두라|エラドゥーラ
Don Julio|唐胡里奥|돈 훌리오|ドン・フリオ
Patrón|培恩|패트론|パトロン
Casamigos|卡萨米戈斯|카사미고스|カサミーゴス
el Jimador|吉马多|엘 히마도르|エル・ヒマドール
Milagro|米拉格罗|밀라그로|ミラグロ
Novo Fogo|新火|노보 포고|ノヴォ・フォゴ
Del Maguey|德尔马盖|델 마게이|デル・マゲイ
Montelobos|狼山|몬테로보스|モンテロボス
Ketel One|一号酒壶|케텔 원|ケテルワン
Belvedere|雪树|벨베디어|ベルヴェデール
Grey Goose|灰雁|그레이 구스|グレイグース
Chopin|肖邦|쇼팽|ショパン
Tito’s|蒂托|티토스|ティトーズ
Reyka|雷卡|레이카|レイカ
Crystal Head|水晶头骨|크리스털 헤드|クリスタルヘッド
Stoli|斯托利|스톨리|ストリ
Hennessy|轩尼诗|헤네시|ヘネシー
Rémy Martin|人头马|레미 마르탱|レミーマルタン
Martell|马爹利|마르텔|マーテル
Courvoisier|馥华诗|쿠르부아지에|クルボアジェ
St-Rémy|圣雷米|생레미|サンレミ
Torres|桃乐丝|토레스|トーレス
Laird’s|莱尔德|레어드|レアード
Lepanto|勒班陀|레판토|レパント
Roku|六|로쿠|六
Beefeater|必富达|비피터|ビーフィーター
Plymouth|普利茅斯|플리머스|プリマス
Bacardí|百加得|바카디|バカルディ
Havana Club|哈瓦那俱乐部|하바나 클럽|ハバナクラブ
Haku|白|하쿠|白
Campari|金巴利|캄파리|カンパリ
Clairin|克莱林|클레랭|クレラン
Habitation Velier|哈比塔雄维利耶|아비타시옹 벨리에|アビタシオン・ヴェリエ
Neon Seas|霓虹海|네온 시즈|ネオン・シーズ
Probitas|普罗比塔斯|프로비타스|プロビタス
Blue Note|蓝调音符|블루 노트|ブルー・ノート
Rhum Clément|克莱蒙|클레망|クレマン
WhistlePig|口哨猪|휘슬피그|ホイッスルピッグ
Neisson|内松|네송|ネイソン
Papalin|帕帕林|파팔린|パパリン
Rolling Fork|罗林福克|롤링 포크|ローリング・フォーク
Zaya|扎亚|자야|ザヤ
Saint James|圣詹姆斯|세인트 제임스|セントジェームス
Privateer|私掠者|프라이버티어|プライヴァティア
Mhoba|姆霍巴|므호바|ムホバ
Worthy Park|沃西公园|워시 파크|ワーシー・パーク
River Antoine|安托万河|리버 앙투안|リバー・アントワーヌ
Cruzan|克鲁赞|크루잔|クルーザン
Two James|双詹姆斯|투 제임스|トゥー・ジェームズ
Pelacañas|佩拉卡尼亚斯|펠라카냐스|ペラカニャス
Bumbu|邦布|붐부|ブンブ
Pusser’s|普瑟|퍼서스|パッサーズ
Roaming Road|漫游之路|로밍 로드|ローミング・ロード
Holmes Cay|霍姆斯礁|홈스 케이|ホームズ・ケイ
MilHòc|米洛克|밀록|ミロック
George Dickel|乔治·迪克尔|조지 디켈|ジョージ・ディッケル
Auchentoshan|欧肯特轩|오켄토션|オーヘントッシャン
Alambique Serrano|塞拉诺蒸馏器|알람비케 세라노|アランビケ・セラーノ
Chairman’s Reserve|主席珍藏|체어맨스 리저브|チェアマンズ・リザーヴ
Mater|马特|마테르|マーテル
Uruapan|乌鲁阿潘|우루아판|ウルアパン
Hampden Estate|汉普顿庄园|햄든 에스테이트|ハンプデン・エステート
Providence|普罗维登斯|프로비던스|プロヴィデンス
Willett|威利特|윌렛|ウィレット
High Wire Distilling|高线酒厂|하이 와이어 증류소|ハイワイヤー蒸留所
Angel’s Envy|天使之嫉|엔젤스 엔비|エンジェルズ・エンヴィ
Smoke Wagon|烟雾马车|스모크 왜건|スモーク・ワゴン
Evan Williams|埃文·威廉斯|에반 윌리엄스|エヴァン・ウィリアムス
Traveller|旅人|트래블러|トラベラー
Henry McKenna|亨利·麦肯纳|헨리 맥케나|ヘンリー・マッケンナ
Heaven Hill|天堂山|헤븐 힐|ヘヴン・ヒル
Ron Carúpano|卡鲁帕诺|론 카루파노|ロン・カルパノ
High N’ Wicked|高野|하이 앤 위키드|ハイ・アンド・ウィキッド
Jim Beam|金宾|짐 빔|ジムビーム
Old Overholt|老奥弗霍特|올드 오버홀트|オールド・オーヴァーホルト
Transcontinental Rum Line|洲际朗姆航线|트랜스컨티넨탈 럼 라인|トランスコンチネンタル・ラム・ライン
Penelope|佩内洛普|페넬로페|ペネロペ
Saint Rhum|圣朗姆|생 럼|サン・ラム
Shakara|沙卡拉|샤카라|シャカラ
Hamilton|汉密尔顿|해밀턴|ハミルトン
J.P. Wiser’s|怀瑟|제이피 와이저스|J.P.ワイザーズ
Redwood Empire|红杉帝国|레드우드 엠파이어|レッドウッド・エンパイア
Yellowstone|黄石|옐로스톤|イエローストーン
Denizen|德尼森|데니즌|デニゼン
Rhum J.M|杰艾姆|제이엠 럼|J.Mラム
Savage & Cooke|萨维奇与库克|새비지 앤 쿠크|サヴェージ＆クック
Bunnahabhain|布纳哈本|부나하벤|ブナハーブン
Talisker|泰斯卡|탈리스커|タリスカー
UAIS|乌艾斯|우아스|ウアシュ
The Busker|街头艺人|더 버스커|ザ・バスカー
Père Labat|拉巴神父|페르 라바|ペール・ラバ
Coruba|科鲁巴|코루바|コルバ
Rum Fire|朗姆之火|럼 파이어|ラム・ファイヤー
Laws|劳斯|로즈|ロウズ
Widow Jane|寡妇简|위도우 제인|ウィドウ・ジェーン
Sagamore Spirit|萨加摩|사카모어 스피릿|サガモア・スピリット
Ardbeg|雅柏|아드벡|アードベッグ
Kentucky Owl|肯塔基猫头鹰|켄터키 아울|ケンタッキー・アウル
Macallan|麦卡伦|맥캘란|マッカラン
Yellow Spot|黄点|옐로 스팟|イエロースポット
Glenmorangie|格兰杰|글렌모렌지|グレンモーレンジィ
Angostura|安高斯图拉|앙고스투라|アンゴスチュラ
Pinhook|平胡克|핀훅|ピンフック
Wilderness Trail|荒野之径|윌더니스 트레일|ウィルダネス・トレイル
The Real McCoy|真麦考伊|더 리얼 맥코이|ザ・リアル・マッコイ
Old Grand-Dad|老祖父|올드 그랜대드|オールド・グランダッド
Copalli|科帕利|코팔리|コパリ
Wyoming Whiskey|怀俄明威士忌|와이오밍 위스키|ワイオミング・ウイスキー
Wray & Nephew|雷与侄|레이 앤 네퓨|レイ＆ネフュー
Westland|西境|웨스트랜드|ウェストランド
Uncle Nearest|尼尔斯特叔叔|엉클 니어리스트|アンクル・ニアレスト
The Famous Grouse|威雀|페이머스 그라우스|フェイマス・グラウス
Ten to One|十比一|텐 투 원|テン・トゥー・ワン
Teeling|帝霖|틸링|ティーリング
Suntory|三得利|산토리|サントリー
Stranahan’s|斯特拉纳汉|스트라나한|ストラナハンズ
Starward|星向|스타워드|スターワード
Skrewball|怪咖|스크루볼|スクリューボール
Smith & Cross|史密斯与克罗斯|스미스 앤 크로스|スミス＆クロス
SIA|西雅|시아|シア
Russell’s Reserve|罗素珍藏|러셀 리저브|ラッセルズ・リザーヴ
Rabbit Hole|兔子洞|래빗 홀|ラビット・ホール
R.L. Seale’s|西尔|알엘 실|R.L.シールズ
Powers|鲍尔斯|파워스|パワーズ
Oban|欧本|오반|オーバン
Monkey Shoulder|猴肩|몽키 숄더|モンキーショルダー
Minor Case|迈诺凯斯|마이너 케이스|マイナー・ケース
Mellow Corn|醇玉米|멜로 콘|メロウ・コーン
Mars|本坊火星|마르스|マルス
Lot 40|第40号|롯 40|ロット40
Lemon Hart|柠檬哈特|레몬 하트|レモンハート
Laphroaig|拉弗格|라프로익|ラフロイグ
Larceny|盗窃|라세니|ラーセニー
Kikori|樵|키코리|キコリ
High West|高西|하이 웨스트|ハイウエスト
Heaven’s Door|天堂之门|헤븐스 도어|ヘヴンズ・ドア
Havana Club (Puerto Rico)|哈瓦那俱乐部（波多黎各）|하바나 클럽 (푸에르토리코)|ハバナクラブ（プエルトリコ）
Green Spot|绿点|그린 스팟|グリーンスポット
Goslings|高斯林|고슬링스|ゴスリングス
Glenfarclas|格兰花格|글렌파클라스|グレンファークラス
Foursquare|四方|포스퀘어|フォースクエア
English Harbour|英国港|잉글리시 하버|イングリッシュ・ハーバー
Elijah Craig|以利亚·克雷格|일라이저 크레이그|イライジャ・クレイグ
Edradour|艾德拉多|에드라두어|エドラダワー
Don Q|唐Q|돈 큐|ドンQ
Compass Box|指南针|컴퍼스 박스|コンパス・ボックス
Coconut Cartel|椰子联盟|코코넛 카르텔|ココナッツ・カルテル
Canerock|蔗石|케인록|ケインロック
Bushmills|布什米尔|부쉬밀|ブッシュミルズ
Basil Hayden|巴兹尔·海登|바질 헤이든|ベイゼル・ヘイデン
Balcones|巴尔科内斯|발코네스|バルコネス
Baker’s|贝克|베이커스|ベイカーズ
Highland Park|高原骑士|하이랜드 파크|ハイランドパーク
Aberfeldy|艾柏迪|아버펠디|アバフェルディ
Empress 1908|皇后1908|엠프레스 1908|エンプレス1908
BarSol|巴尔索|바르솔|バルソル
The Lost Explorer|迷途探险家|더 로스트 익스플로러|ザ・ロスト・エクスプローラー
Baron-Fuenté|巴龙富恩特|바롱 퓌엔테|バロン・フエンテ
Quarter Proof|夸特普鲁夫|쿼터 프루프|クォーター・プルーフ
Second Sip|第二口|세컨드 십|セカンド・シップ
Etter|埃特|에터|エター
Graham’s|格雷厄姆|그레이엄|グラハム
Won Soju|元烧酒|원소주|ウォンソジュ
Mijenta|米亨塔|미헨타|ミヘンタ
Clear Creek|清溪|클리어 크릭|クリア・クリーク
Cobrafire|眼镜蛇之火|코브라파이어|コブラファイア
Hana Soju|花烧酒|하나 소주|ハナソジュ
Chambéryzette|香贝丽泽|샹베리제트|シャンベリゼット
Kura|藏|쿠라|蔵
Alvear|阿尔韦阿尔|알베아르|アルベアル
Procera|普罗塞拉|프로세라|プロセラ
Don Fulano|唐富拉诺|돈 풀라노|ドン・フラノ
Hallasan|汉拏山|한라산|ハルラサン
Andong Jinmaek|安东真麦|안동 진맥|安東ジンメク
KHEE|喜|키|キー
Tres Agaves|三株龙舌兰|트레스 아가베스|トレス・アガベス
Hangar 1|一号机库|행어 원|ハンガー・ワン
La Clandestine|隐秘|라 클랑데스틴|ラ・クランデスティーヌ
Gin Lane 1751|金酒巷1751|진 레인 1751|ジン・レーン1751
Ming River|明河|밍 리버|ミン・リバー
Mezcalum|梅斯卡伦|메스칼룸|メスカルム
Mezcal Amarás|阿玛拉斯|메스칼 아마라스|メスカル・アマラス
Luksusowa|卢克苏索瓦|룩수소바|ルクスソーヴァ
Lustau|卢斯涛|루스타우|ルスタウ
Avuá|阿武阿|아부아|アヴア
Mumm Napa|玛姆纳帕|멈 나파|マム・ナパ
Adrien Camut|阿德里安·卡缪|아드리앙 카뮈|アドリアン・カミュ
Arette|阿雷特|아레테|アレッテ
Rey Campero|乡野之王|레이 캄페로|レイ・カンペロ
Homare|誉|호마레|ほまれ
Kubota|久保田|쿠보타|久保田
Fee Brothers|斐氏兄弟|피 브라더스|フィー・ブラザーズ
Astraea|阿斯特莱亚|아스트라이아|アストレア
Alma del Jaguar|美洲豹之魂|알마 델 하구아르|アルマ・デル・ハグアル
Lágrimas del Valle|山谷之泪|라그리마스 델 바예|ラグリマス・デル・バジェ
El Tesoro|宝藏|엘 테소로|エル・テソロ
Cazcanes|卡斯卡内斯|카스카네스|カスカネス
Cimarrón|西马龙|시마론|シマロン
Siete Leguas|七里格|시에테 레구아스|シエテ・レグアス
Scofflaw|蔑法者|스코플로|スコッフロー
Truman|杜鲁门|트루먼|トルーマン
Ginepraio|吉内普拉约|지네프라이오|ジネプライオ
Roger Groult|罗杰·格鲁|로제 그루|ロジェ・グルー
Finlandia|芬兰|핀란디아|フィンランディア
Lobos 1707|狼群1707|로보스 1707|ロボス1707
Mala Mía|马拉米亚|말라 미아|マラ・ミア
El Búho|猫头鹰|엘 부오|エル・ブオ
Abelha|蜜蜂|아벨랴|アベーリャ
Valdespino|瓦尔德斯皮诺|발데스피노|バルデスピノ
Maison Rouge|红屋|메종 루주|メゾン・ルージュ
Teremana|特雷玛纳|테레마나|テレマナ
LALO|拉罗|랄로|ラロ
La Marca|拉马卡|라 마르카|ラ・マルカ
Perrier-Jouët|巴黎之花|페리에 주에|ペリエ・ジュエ
Grand Mayan|大玛雅|그랜드 마얀|グランド・マヤン
Gran Centenario|百年|그란 센테나리오|グラン・センテナリオ
Woody Creek|伍迪溪|우디 크릭|ウッディー・クリーク
Bosscal|博斯卡尔|보스칼|ボスカル
Mal Bien|马尔比恩|말 비엔|マル・ビエン
Bittermens|比特曼|비터멘스|ビターメンズ
Mezcal Unión|联合梅斯卡尔|메스칼 우니온|メスカル・ウニオン
Aqua Perfecta|完美之水|아쿠아 퍼펙타|アクア・ペルフェクタ
Pierde Almas|失魂|피에르데 알마스|ピエルデ・アルマス
Mizu|水|미즈|ミズ
Mayenda|玛延达|마옌다|マイエンダ
Del Professore|教授|델 프로페소레|デル・プロフェッソーレ
Xicaru|西卡鲁|시카루|シカル
Ferrand|费朗|페랑|フェラン
Christian Drouin|克里斯蒂安·德鲁安|크리스티앙 드루앵|クリスチャン・ドルーアン
Żubrówka|野牛草|주브로브카|ズブロッカ
Tanglin|东陵|탱글린|タングリン
Sandeman|山地文|샌드맨|サンデマン
RIGHT|莱特|라이트|ライト
Regans’|里根|리건스|リーガンズ
Ransom|赎金|랜섬|ランサム
Prairie|草原|프레리|プレーリー
Peychaud’s|佩肖|페이쇼|ペイショーズ
Pernod|保乐|페르노|ペルノ
Olmeca Altos|奥美加阿尔托斯|올메카 알토스|オルメカ・アルトス
Noilly Prat|诺伊丽普拉特|노일리 프랏|ノイリー・プラット
Nahmias|纳赫米亚斯|나미아스|ナーミアス
Martini & Rossi|马天尼罗西|마티니 앤 로시|マルティーニ＆ロッシ
Luxardo|卢萨朵|룩사르도|ルクサルド
Lunazul|蓝月|루나술|ルナスール
Kübler|屈布勒|퀴블러|キュブラー
La Gritona|呐喊者|라 그리토나|ラ・グリトナ
Korbel|科贝尔|코벨|コーベル
Ilegal|非法|일리걸|イリーガル
Good Vodka|好伏特加|굿 보드카|グッド・ウォッカ
Fonseca|丰塞卡|폰세카|フォンセカ
ElVelo|面纱|엘 벨로|エルヴェロ
El Tequileño|特基莱尼奥|엘 테킬레뇨|エル・テキレーニョ
Dolin|多林|돌랭|ドラン
Corte Vetusto|古老宫廷|코르테 베투스토|コルテ・ヴェトゥスト
Cocchi|科奇|코키|コッキ
Clase Azul|蓝色珍藏|클라세 아줄|クラセ・アスール
Cinzano|仙山露|친자노|チンザノ
Cazadores|猎人|카사도레스|カサドレス
Carpano|卡帕诺|카르파노|カルパノ
Bulldog|斗牛犬|불독|ブルドッグ
Brennivín|布伦尼文|브레니빈|ブレニヴィン
Bozal|博萨尔|보살|ボサル
Bols|波士|볼스|ボルス
Bayab|巴亚布|바야브|バヤブ
Baldoria|巴尔多里亚|발도리아|バルドリア
Archipelago|群岛|아키펠라고|アーキペラゴ
Absolut|绝对|앱솔루트|アブソルート
Aalborg|奥尔堡|올보르|オールボー
1615|1615|1615|1615
123 Organic Tequila|123有机龙舌兰|123 유기농 테킬라|123オーガニック・テキーラ
Gekkeikan|月桂冠|겟케이칸|月桂冠
Seagram’s|施格兰|시그램|シーグラム
Hakkaisan|八海山|핫카이산|八海山
Nonino|诺尼诺|노니노|ノニーノ
Smirnoff|斯米诺|스미노프|スミノフ
Chinola|奇诺拉|치놀라|チノラ
G.E. Massenez|马塞内|지이 마스네|G.E.マスネ
Kahlúa|甘露|깔루아|カルーア
Yoshi|良|요시|ヨシ
Chartreuse|查特酒|샤르트뢰즈|シャルトリューズ
Atheras Spirits|阿瑟拉斯|아테라스 스피리츠|アセラス・スピリッツ
Liquore delle Sirene|海妖利口酒|리쿠오레 델레 시레네|リクオーレ・デッレ・シレーネ
Green Key|绿钥匙|그린 키|グリーン・キー
Giffard|吉发得|지파드|ジファール
Alma Tepec|阿尔玛特佩克|알마 테펙|アルマ・テペック
BroVo|布罗沃|브로보|ブローヴォ
Tia Maria|玛丽亚阿姨|티아 마리아|ティア・マリア
Casoni 1814|卡索尼1814|카소니 1814|カソーニ1814
Apologue|寓言|아폴로그|アポローグ
Fernet-Branca|菲奈布兰卡|페르넷 브랑카|フェルネット・ブランカ
Jules Theuriet|朱尔·特里耶|쥘 튀리에|ジュール・テュリエ
Veda|吠陀|베다|ヴェーダ
Scuppoz|斯库波兹|스쿠포츠|スクッポズ
Tempus Fugit|时光飞逝|템푸스 푸지트|テンプス・フュージット
Combier|孔比耶|콤비에|コンビエ
Marasso|马拉索|마라소|マラッソ
Victoria Distillers|维多利亚酒厂|빅토리아 디스틸러스|ヴィクトリア・ディスティラーズ
Marzadro|马扎德罗|마르차드로|マルツァドロ
Alpeggio|阿尔佩焦|알페조|アルペッジョ
Meunier|默尼耶|뫼니에|ムニエ
Rothman & Winter|罗思曼与温特|로스먼 앤 윈터|ロスマン＆ウィンター
Caffè Borghetti|博尔盖蒂咖啡|카페 보르게티|カフェ・ボルゲッティ
Kota|科塔|코타|コタ
VETZ|韦茨|베츠|ヴェッツ
Ginrosa|金罗莎|진로사|ジンローザ
Nux Alpina|阿尔卑斯核桃|눅스 알피나|ヌックス・アルピナ
Trader Vic's|维克商人|트레이더 빅스|トレーダー・ヴィックス
Rockey’s|罗基|로키스|ロッキーズ
Romana|罗马娜|로마나|ロマーナ
Marie Brizard|玛丽白莎|마리 브리자드|マリー・ブリザール
Galliano|加利安诺|갈리아노|ガリアーノ
Baileys|百利|베일리스|ベイリーズ
Ancho Reyes|安乔雷耶斯|안초 레예스|アンチョ・レイエス
Zirbenz|齐尔本茨|치르벤츠|ツィルベンツ
Don Ciccio & Figli|唐奇乔父子|돈 치초 에 필리|ドン・チッチョ・エ・フィーリ
Becherovka|贝赫洛夫卡|베헤로프카|ベヘロフカ
Braulio|布劳利奥|브라울리오|ブラウリオ
Nixta|尼克斯塔|닉스타|ニクスタ
Barrow’s|巴罗|배로스|バロウズ
Suze|苏兹|수즈|スーズ
Strega|女巫|스트레가|ストレーガ
St Elizabeth|圣伊丽莎白|세인트 엘리자베스|セント・エリザベス
St-Germain|圣日耳曼|생제르맹|サンジェルマン
Solerno|索莱尔诺|솔레르노|ソレルノ
Southern Comfort|南方舒适|서던 컴포트|サザン・カンフォート
Roots|根源|루츠|ルーツ
Ramazzotti|拉玛佐蒂|라마초티|ラマゾッティ
Pimm’s|皮姆|핌스|ピムス
Paolucci|保卢奇|파올루치|パオルッチ
Pallini|帕利尼|팔리니|パッリーニ
Mr Black|布莱克先生|미스터 블랙|ミスター・ブラック
Mount Rigi|瑞吉山|마운트 리기|マウント・リギ
Midori|蜜多丽|미도리|ミドリ
Mandarine Napoleon|拿破仑蜜柑|만다린 나폴레옹|マンダリン・ナポレオン
Licor 43|43号利口酒|리코르 43|リコール43
Legendre|勒让德尔|르장드르|ルジャンドル
Lejay|乐杰|르제|ルジェ
Kronan|克罗南|크로난|クローナン
John D. Taylor’s|约翰·泰勒|존 디 테일러|ジョン・D・テイラーズ
Italicus|意塔利克斯|이탈리쿠스|イタリクス
Heering|樱桃海灵|히링|ヒーリング
Grand Marnier|柑曼怡|그랑 마르니에|グラン・マルニエ
Faccia Brutto|怪脸|파차 브루토|ファッチャ・ブルット
Enrico Toro|恩里科·托罗|엔리코 토로|エンリコ・トロ
Drambuie|杜林标|드람뷔|ドランブイ
Cynar|西娜|치나르|チナール
Cointreau|君度|코앵트로|コアントロー
Chareau|夏露|샤로|シャロー
Chambord|香博|샹보르|シャンボール
Cédilla|塞迪亚|세딜라|セディーラ
Boomsma|布姆斯玛|붐스마|ブームスマ
Bénédictine|廊酒|베네딕틴|ベネディクティン
Aperol|阿佩罗|아페롤|アペロール
Montenegro|黑山|몬테네그로|モンテネグロ
Averna|阿韦尔纳|아베르나|アヴェルナ
Caravella|卡拉维拉|카라벨라|カラヴェッラ
Mathilde|玛蒂尔德|마틸드|マチルド
Edmond Briottet|埃德蒙·布里奥特|에드몽 브리오테|エドモン・ブリオッテ
DeKuyper|迪凯堡|디카이퍼|デカイパー
Domaine de Canton|广州庄园|도멘 드 캉통|ドメーヌ・ド・カントン
di Amore|迪阿莫雷|디 아모레|ディ・アモーレ
Soho|苏荷|소호|ソーホー
Gran Malo|格兰马洛|그란 말로|グラン・マロ
Tingala|廷加拉|팅갈라|ティンガラ
Eda Rhyne Distilling Company|埃达莱恩酒厂|에다 라인 증류소|エダ・ライン蒸留所
J. Rieger & Co.|里格尔公司|제이 리거 앤 코|J.リーガー＆コー
Carolans|卡罗兰|캐롤런스|キャロランズ
Somrus|索姆鲁斯|솜루스|ソムルス
Cantera Negra|黑采石场|칸테라 네그라|カンテラ・ネグラ
Riga Black Balsam|里加黑香脂|리가 블랙 발삼|リガ・ブラック・バルサム
Stella Rosa|罗莎之星|스텔라 로사|ステラ・ローザ
Vedrenne|维德雷纳|베드렌느|ヴェドレンヌ
Jeppson's Malort|杰普森苦艾|젭슨스 말로트|ジェプソンズ・マロート
Dubonnet|杜本内|뒤보네|デュボネ
Bonal|博纳尔|보날|ボナル
Savoia|萨沃亚|사보이아|サヴォイア
Cardamaro|卡达马罗|카르다마로|カルダマーロ
Lillet|利莱|릴레|リレ
Cappelletti|卡佩莱蒂|카펠레티|カッペレッティ
Van Oosten|范奥斯滕|반 오스텐|ヴァン・オーステン
Jägermeister|野格|예거마이스터|イエーガーマイスター
Malibu|马利宝|말리부|マリブ
Gordon's|哥顿|고든스|ゴードンズ
Captain Morgan|摩根船长|캡틴 모건|キャプテン・モルガン
Chivas Regal|芝华士|시바스 리갈|シーバスリーガル
Ballantine's|百龄坛|발렌타인|バランタイン
Jose Cuervo|豪帅|호세 쿠엘보|ホセ・クエルボ
The Balvenie|百富|발베니|バルヴェニー
Aberlour|亚伯乐|아벨라워|アベラワー
Dewar’s|帝王|듀어스|デュワーズ
Bell’s|金铃|벨스|ベル
Whyte & Mackay|怀特麦凯|화이트 앤 맥케이|ホワイト＆マッカイ
The Singleton|苏格登|싱글톤|ザ・シングルトン
Royal Brackla|皇家布莱克拉|로열 브라클라|ロイヤル・ブラックラ
Jura|朱拉|주라|ジュラ
Connemara|康尼马拉|코네마라|カネマラ
Glendalough|格兰达洛|글렌달록|グレンダロッホ
Pikesville|派克斯维尔|파이크스빌|パイクスヴィル
Bowmore|波摩|보모어|ボウモア
1800 Tequila|1800龙舌兰|1800 데킬라|1800テキーラ
El Mayor|埃尔马约尔|엘 마요르|エル・マヨール
Cincoro|辛科罗|싱코로|シンコロ
Sierra|西耶拉|시에라|シエラ
Casa Dragones|龙之家|카사 드라고네스|カサ・ドラゴネス
Código 1530|科迪戈1530|코디고 1530|コディゴ1530
Cascahuín|卡斯卡温|카스카윈|カスカウィン
Tapatío|塔帕蒂奥|타파티오|タパティオ
DeLeón|德莱昂|데레온|デレオン
Tres Generaciones|三代|트레스 헤네라시오네스|トレス・ヘネラシオネス
Volcan de Mi Tierra|故土火山|볼칸 데 미 티에라|ボルカン・デ・ミ・ティエラ
Brugal|布鲁格尔|브루갈|ブルガル
Matusalem|马杜莎兰|마투살렘|マツサレム
Lamb’s|兰姆|램스|ラムズ
Tanduay|丹都艾|탄두아이|タンドゥアイ
Old Monk|老僧|올드 몽크|オールド・モンク
Bounty|邦蒂|바운티|バウンティ
Kirk & Sweeney|柯克与斯威尼|커크 앤 스위니|カーク＆スウィーニー
Kraken|海怪|크라켄|クラーケン
Santa Teresa|圣特蕾莎|산타 테레사|サンタ・テレサ
Facundo|法昆多|파쿤도|ファクンド
Myers’s|迈尔斯|마이어스|マイヤーズ
Pampero|潘佩罗|팜페로|パンペロ
Barceló|巴塞罗|바르셀로|バルセロ
Damoiseau|达穆瓦索|다무아조|ダモワゾー
Kōloa|科洛阿|콜로아|コロア
Papa’s Pilar|帕帕皮拉尔|파파스 필라|パパズ・ピラー
Proof and Wood|普鲁夫伍德|프루프 앤 우드|プルーフ＆ウッド
Cihuatán|希瓦坦|시우아탄|シワタン
Prichard’s|普里查德|프리처즈|プリチャーズ
Dictador|独裁者|딕타도르|ディクタドール
No. 3|三号|넘버 3|ナンバー3
James Gin|詹姆斯金酒|제임스 진|ジェームズ・ジン
Whitley Neill|惠特利尼尔|휘틀리 닐|ウィットリー・ニール
Cotswolds|科茨沃尔德|코츠월드|コッツウォルズ
Gray Whale|灰鲸|그레이 웨일|グレイ・ホエール
Isle of Harris|哈里斯岛|아일 오브 해리스|アイル・オブ・ハリス
Boatyard|船坞|보트야드|ボートヤード
Kyrö|屈勒|퀴로|キュロ
Mermaid|美人鱼|머메이드|マーメイド
Ukiyo|浮世|우키요|浮世
Jaisalmer|斋沙默尔|자이살메르|ジャイサルメール
The Lakes|湖区|더 레이크스|ザ・レイクス
Cadenhead's|凯德黑德|케이든헤드|ケイデンヘッド
Edinburgh Gin|爱丁堡金酒|에든버러 진|エディンバラ・ジン
Eden Mill|伊甸磨坊|이든 밀|エデン・ミル
Condesa|孔德萨|콘데사|コンデサ
Saigon Baigur|西贡百古|사이공 바이구르|サイゴン・バイグル
Scapegrace|斯凯普格雷斯|스케이프그레이스|スケープグレース
Farmer's|农夫|파머스|ファーマーズ
Castle & Key|城堡与钥匙|캐슬 앤 키|キャッスル＆キー
Still Austin|斯蒂尔奥斯汀|스틸 오스틴|スティル・オースティン
Journeyman|旅匠|저니맨|ジャーニーマン
Waterloo|滑铁卢|워털루|ウォータールー
Magellan|麦哲伦|마젤란|マゼラン
Cîroc|诗珞克|시락|シロック
Beluga|白鲸|벨루가|ベルーガ
Nemiroff|尼米罗夫|네미로프|ネミロフ
Glen's|格伦|글렌스|グレンズ
Neft|石油|네프트|ネフチ
Koskenkorva|科斯肯科瓦|코스켄코르바|コスケンコルヴァ
Krupnik|克鲁普尼克|크루프니크|クルプニク
AU Vodka|澳金伏特加|에이유 보드카|AUウォッカ
Chase|蔡斯|체이스|チェイス
Van Gogh|梵高|반 고흐|ヴァン・ゴッホ
Purity|纯净|퓨리티|ピュリティ
Deep Eddy|深涡|딥 에디|ディープ・エディ
Crop|禾田|크롭|クロップ
Smoke Lab|烟雾实验室|스모크 랩|スモーク・ラボ
Fundador|创始人|푼다도르|フンダドール
D’USSÉ|杜赛|뒤세|デュセ
Asbach|阿斯巴赫|아스바흐|アスバッハ
Camus|卡慕|까뮤|カミュ
Frapin|法拉宾|프라팡|フラパン
Hine|御鹿|하인|ハイン
Hardy|哈迪|하디|ハーディ
Davidoff|大卫杜夫|다비도프|ダビドフ
Ararat|亚拉拉特|아라라트|アララット
Christian Brothers|基督兄弟|크리스천 브라더스|クリスチャン・ブラザーズ
Paul Masson|保罗马森|폴 매슨|ポール・マッソン
Carlos I|卡洛斯一世|카를로스 1세|カルロス1世
Château du Breuil|布勒伊城堡|샤토 뒤 브뢰유|シャトー・ド・ブルイユ
Sassy|萨西|사시|サッシー
Janneau|珍诺|잔노|ジャノー
Clés des Ducs|公爵之钥|클레 데 뒤크|クレ・デ・デューク
Sempé|桑佩|상페|サンペ
Jules Gautret|朱尔戈特雷|쥘 고트레|ジュール・ゴートレ
Branson|布兰森|브랜슨|ブランソン
Schladerer|施拉德尔|슐라데러|シュラーダラー
Kammer-Kirsch|卡默基尔施|카머 키르슈|カマー・キルシュ
Sauza|索萨|사우사|サウザ
`;

export const editorialBottleBrands = Object.fromEntries(rows.trim().split('\n').map(row => {
  const [original, zh, ko, ja] = row.split('|') as [string, string, string, string];
  return [original, {zh, ko, ja}];
}));
