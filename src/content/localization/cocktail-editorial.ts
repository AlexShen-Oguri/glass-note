import type {Localized} from '../../domain/contracts';

/** Editorial display translations (2026-09-23), not official name evidence.
 * Existing regional/producer name decisions take precedence. Original titles
 * remain separately available for identification and search.
 * Columns: id | en | zh | fr | de | es | ko | ja | it.
 */
const rows = `
amaretto-sour|Amaretto Sour|杏仁酸酒|Sour à l'amaretto|Amaretto-Sour|Sour de amaretto|아마레토 사워|アマレット・サワー|Sour all'amaretto
houmei|Phoenix Call|凤鸣|Chant du phénix|Ruf des Phönix|Canto del fénix|봉황의 울음|鳳鳴|Canto della fenice
uchimizu|Cooling Sprinkles|洒水纳凉|Fraîcheur d'eau|Kühlendes Wasser|Agua refrescante|물 뿌리기|打ち水|Acqua rinfrescante
shiki|Four Seasons|四季|Quatre saisons|Vier Jahreszeiten|Cuatro estaciones|사계절|四季|Quattro stagioni
inherited-fizz|Inherited Fizz|传承菲士|Fizz en héritage|Geerbter Fizz|Fizz heredado|이어받은 피즈|受け継ぐフィズ|Fizz in eredità
toku-no-shizuku|Drops of Virtue|德之滴|Gouttes de vertu|Tropfen der Tugend|Gotas de virtud|덕의 물방울|徳の雫|Gocce di virtù
musubi|Connection|结缘|Lien|Verbindung|Vínculo|맺음|結び|Legame
silent-note|Silent Note|无声音符|Note silencieuse|Stille Note|Nota silenciosa|고요한 음표|サイレント・ノート|Nota silenziosa
tokiwa|Circle of Time|时环|Cercle du temps|Kreis der Zeit|Círculo del tiempo|시간의 고리|時環|Cerchio del tempo
tefutefu|Butterfly|蝴蝶|Papillon|Schmetterling|Mariposa|나비|てふてふ|Farfalla
classic-rose|Classic Rose|经典玫瑰|Rose classique|Klassische Rose|Rosa clásica|클래식 로즈|クラシックローズ|Rosa classica
yukishiro|Snowmelt|融雪|Fonte des neiges|Schneeschmelze|Deshielo|눈 녹은 물|雪代|Disgelo
tomarigi|Perch|栖木|Perchoir|Sitzstange|Posadero|횃대|止まり木|Posatoio
momochidori|A Thousand Birds|百千鸟|Mille oiseaux|Tausend Vögel|Mil pájaros|수많은 새|百千鳥|Mille uccelli
atarayo|A Night to Cherish|惜夜|Une nuit à chérir|Eine kostbare Nacht|Una noche para atesorar|아쉬운 밤|あたら夜|Una notte da custodire
yuzuriha|Yuzuriha Leaf|交让木|Feuille de yuzuriha|Yuzuriha-Blatt|Hoja de yuzuriha|굴거리나무|楪|Foglia di yuzuriha
hatsuzakura|First Cherry Blossoms|初樱|Premiers cerisiers en fleurs|Erste Kirschblüten|Primeras flores de cerezo|첫 벚꽃|初桜|Primi fiori di ciliegio
umemiyabi|Plum Elegance|梅雅|Élégance de prune|Pflaumeneleganz|Elegancia de ciruela|매화의 우아함|梅雅|Eleganza di prugna
suehiro|Everlasting Prosperity|福寿绵长|Prospérité durable|Bleibender Wohlstand|Prosperidad duradera|끝없는 번영|寿ゑひろ|Prosperità duratura
braver|Braver|更勇敢|Plus brave|Mutiger|Más valiente|더 용감하게|ブレイバー|Più coraggioso
fuga|Elegance|风雅|Élégance|Eleganz|Elegancia|풍아|風雅|Eleganza
seifu|Fresh Breeze|清风|Brise fraîche|Frische Brise|Brisa fresca|청풍|清風|Brezza fresca
konoka|One's Own Flower|己之花|Sa propre fleur|Die eigene Blume|La propia flor|나만의 꽃|己ノ花|Il proprio fiore
brave-symphony|Brave Symphony|勇气交响曲|Symphonie du courage|Mutige Symphonie|Sinfonía valiente|용기의 교향곡|ブレイブ・シンフォニー|Sinfonia coraggiosa
tsukishiro|Moonlight White|月白|Blanc de lune|Mondweiß|Blanco de luna|월백|月白|Bianco di luna
calla-lily|Calla Lily|马蹄莲|Arum|Calla|Cala|칼라 백합|カラーリリー|Calla
hatsune|First Song|初音|Premier chant|Erster Gesang|Primer canto|첫 소리|初音|Primo canto
new-old-days|New Old Days|新旧时光|Nouveaux jours d'antan|Neue alte Zeiten|Nuevos viejos tiempos|새로운 옛날|ニュー・オールド・デイズ|Nuovi vecchi tempi
enishi|Fateful Bond|缘|Lien du destin|Schicksalsband|Lazo del destino|인연|縁|Legame del destino
kasane-aviator|Layered Aviator|重彩飞行家|Aviateur en strates|Vielschichtiger Flieger|Aviador en capas|겹겹의 비행사|重ねアビエーター|Aviatore a strati
maid-in-cuba|Maid in Cuba|古巴女郎|Demoiselle à Cuba|Mädchen auf Kuba|Doncella en Cuba|쿠바의 아가씨|メイド・イン・キューバ|Fanciulla a Cuba
le-latin|The Latin|拉丁风情|Le Latin|Der Lateiner|El latino|라틴|ル・ラタン|Il latino
venceremos|We Shall Overcome|我们终将胜利|Nous vaincrons|Wir werden siegen|Venceremos|우리는 이기리라|ベンセレモス|Vinceremo
clarita|Clarita|克拉丽塔|Clarita|Clarita|Clarita|클라리타|クラリタ|Clarita
carino|Darling|亲爱的|Chéri|Liebling|Cariño|자기야|カリーニョ|Tesoro
pink-me-up|Pink Me Up|粉红好心情|La vie en rose|Rosa macht munter|Ánimo rosa|핑크빛 기분|ピンク・ミー・アップ|Un tocco di rosa
connaught-martini|The Connaught Martini|康诺特马天尼|Martini du Connaught|Connaught-Martini|Martini del Connaught|코넛 마티니|コノート・マティーニ|Martini del Connaught
champagne-pina-colada|Champagne Piña Colada|香槟椰林飘香|Piña colada au champagne|Champagner-Piña-Colada|Piña colada con champán|샴페인 피냐 콜라다|シャンパン・ピニャ・コラーダ|Piña colada allo champagne
vicuna|Vicuña|小羊驼|Vigogne|Vikunja|Vicuña|비쿠냐|ビクーニャ|Vigogna
left-hand|Left Hand|左手|Main gauche|Linke Hand|Mano izquierda|왼손|レフト・ハンド|Mano sinistra
maggie-smith|Maggie Smith|玛吉·史密斯|Maggie Smith|Maggie Smith|Maggie Smith|매기 스미스|マギー・スミス|Maggie Smith
trasatlantico-fizz|Transatlantic Fizz|跨大西洋菲士|Fizz transatlantique|Transatlantik-Fizz|Fizz trasatlántico|대서양 횡단 피즈|トランスアトランティック・フィズ|Fizz transatlantico
belafonte-spritz|Belafonte Spritz|贝拉方特起泡酒|Spritz Belafonte|Belafonte-Spritz|Spritz Belafonte|벨라폰테 스프리츠|ベラフォンテ・スプリッツ|Spritz Belafonte
dauntless-dessert|Dauntless Dessert|无畏甜点|Dessert intrépide|Furchtloses Dessert|Postre intrépido|두려움 없는 디저트|ドーントレス・デザート|Dessert impavido
godfathers-affinity|The Godfather's Affinity|教父之缘|L'affinité du parrain|Die Verbundenheit des Paten|La afinidad del padrino|대부의 인연|ゴッドファーザーズ・アフィニティ|L'affinità del padrino
`;

export const editorialCocktailNames: Record<string, Localized> = Object.fromEntries(
  rows.trim().split('\n').map(row => {
    const [id, en, zh, fr, de, es, ko, ja, it] = row.split('|') as [string, string, string, string, string, string, string, string, string];
    return [id, {en, zh, fr, de, es, ko, ja, it}];
  }),
);
