import type {Locale, Localized} from '../../domain/contracts';
import type {ResearchMaterial, ResearchPreparation, ResearchWork} from '../topics';

/**
 * The research pages are source records, so their localized copy lives in an
 * overlay.  This keeps the canonical fields in topics.ts and topics-eleven.ts
 * immutable while allowing the reading view to carry reviewed draft text.
 */
export interface ResearchMaterialView {
  name: string;
  amount?: string;
}

export interface ResearchPreparationView {
  id: string;
  name: string;
  ingredients: ResearchMaterialView[];
  method: string[];
}

export interface ResearchWorkView {
  id: string;
  title: string;
  author: string;
  bar?: string;
  region?: string;
  /** Localized display of the source's award or competition stage. */
  stage?: string;
  /** Kept as an alias for callers that use the canonical field name. */
  award?: string;
  materials: ResearchMaterialView[];
  original?: string;
  method?: string[];
  disclosure: NonNullable<ResearchWork['disclosure']>;
  summary?: string;
  preparations?: ResearchPreparationView[];
  missingDetails?: string[];
  source?: ResearchWork['source'];
}

export interface ResearchMaterialOverlay {
  name: Localized;
  /** Textual amounts are localized too; numeric units remain source exact. */
  amount?: Localized;
}

export interface ResearchPreparationOverlay {
  id: string;
  name: Localized;
  ingredients: ResearchMaterialOverlay[];
  method: Localized[];
}

export interface ResearchWorkOverlay {
  materials?: ResearchMaterialOverlay[];
  method?: Localized[];
  preparations?: ResearchPreparationOverlay[];
  region: Localized;
  stage: Localized;
  summary: Localized;
  missingDetails?: Localized[];
}

const L = (en: string, zh: string, fr: string, de: string, es: string, ko: string, ja: string, it: string): Localized => ({en, zh, fr, de, es, ko, ja, it});
const same = (value: string): Localized => L(value, value, value, value, value, value, value, value);
const amount = (value: string | Localized): Localized => typeof value === 'string' ? same(value) : value;
const material = (name: Localized | string, value?: Localized | string): ResearchMaterialOverlay => ({
  name: typeof name === 'string' ? same(name) : name,
  ...(value === undefined ? {} : {amount: typeof value === 'string' ? amount(value) : value}),
});
const preparation = (id: string, name: Localized | string, ingredients: ResearchMaterialOverlay[], method: Localized[]): ResearchPreparationOverlay => ({
  id,
  name: typeof name === 'string' ? same(name) : name,
  ingredients,
  method,
});
type LocalizedValues = [string, string, string, string, string, string, string, string];
const methods = (...steps: LocalizedValues[]): Localized[] => steps.map(([en, zh, fr, de, es, ko, ja, it]) => L(en, zh, fr, de, es, ko, ja, it));
const gap = (en: string, zh: string, fr: string, de: string, es: string, ko: string, ja: string, it: string): Localized => L(en, zh, fr, de, es, ko, ja, it);

const region = {
  australia: L('Australia', '澳大利亚', 'Australie', 'Australien', 'Australia', '호주', 'オーストラリア', 'Australia'),
  belgium: L('Belgium', '比利时', 'Belgique', 'Belgien', 'Bélgica', '벨기에', 'ベルギー', 'Belgio'),
  dubai: L('Dubai, UAE', '迪拜，阿联酋', 'Dubaï, Émirats arabes unis', 'Dubai, VAE', 'Dubái, EAU', '두바이, 아랍에미리트', 'ドバイ、アラブ首長国連邦', 'Dubai, Emirati Arabi Uniti'),
  france: L('France', '法国', 'France', 'Frankreich', 'Francia', '프랑스', 'フランス', 'Francia'),
  germany: L('Germany', '德国', 'Allemagne', 'Deutschland', 'Alemania', '독일', 'ドイツ', 'Germania'),
  italy: L('Italy', '意大利', 'Italie', 'Italien', 'Italia', '이탈리아', 'イタリア', 'Italia'),
  japan: L('Japan', '日本', 'Japon', 'Japan', 'Japón', '일본', '日本', 'Giappone'),
  mexicoCity: L('Mexico City', '墨西哥城', 'Mexico', 'Mexiko-Stadt', 'Ciudad de México', '멕시코시티', 'メキシコシティ', 'Città del Messico'),
  southAfrica: L('South Africa', '南非', 'Afrique du Sud', 'Südafrika', 'Sudáfrica', '남아프리카공화국', '南アフリカ', 'Sudafrica'),
  southKorea: L('South Korea', '韩国', 'Corée du Sud', 'Südkorea', 'Corea del Sur', '대한민국', '韓国', 'Corea del Sud'),
  spain: L('Spain', '西班牙', 'Espagne', 'Spanien', 'España', '스페인', 'スペイン', 'Spagna'),
  unitedKingdom: L('United Kingdom', '英国', 'Royaume-Uni', 'Vereinigtes Königreich', 'Reino Unido', '영국', 'イギリス', 'Regno Unito'),
  unitedStates: L('United States', '美国', 'États-Unis', 'Vereinigte Staaten', 'Estados Unidos', '미국', 'アメリカ合衆国', 'Stati Uniti'),
};

const stage = {
  australia2016: L('Australia winner · global finalist', '澳大利亚赛区优胜者 · 全球决赛入围者', 'Vainqueur australien · finaliste mondial', 'Australischer Sieger · globaler Finalist', 'Ganador de Australia · finalista mundial', '호주 우승자 · 글로벌 결선 진출자', 'オーストラリア優勝者 · 世界大会ファイナリスト', 'Vincitore australiano · finalista globale'),
  belgium2018: L('Belgium winner · global finalist', '比利时赛区优胜者 · 全球决赛入围者', 'Vainqueur belge · finaliste mondial', 'Belgischer Sieger · globaler Finalist', 'Ganador de Bélgica · finalista mundial', '벨기에 우승자 · 글로벌 결선 진출자', 'ベルギー優勝者 · 世界大会ファイナリスト', 'Vincitore del Belgio · finalista globale'),
  dubai2016: L('Dubai winner · global finalist', '迪拜赛区优胜者 · 全球决赛入围者', 'Vainqueur de Dubaï · finaliste mondial', 'Sieger aus Dubai · globaler Finalist', 'Ganador de Dubái · finalista mundial', '두바이 우승자 · 글로벌 결선 진출자', 'ドバイ優勝者 · 世界大会ファイナリスト', 'Vincitore di Dubai · finalista globale'),
  france2016: L('France winner · global finalist', '法国赛区优胜者 · 全球决赛入围者', 'Vainqueur de France · finaliste mondial', 'Französischer Sieger · globaler Finalist', 'Ganador de Francia · finalista mundial', '프랑스 우승자 · 글로벌 결선 진출자', 'フランス優勝者 · 世界大会ファイナリスト', 'Vincitore della Francia · finalista globale'),
  france2018: L('France winner · global finalist', '法国赛区优胜者 · 全球决赛入围者', 'Vainqueur de France · finaliste mondial', 'Französischer Sieger · globaler Finalist', 'Ganador de Francia · finalista mundial', '프랑스 우승자 · 글로벌 결선 진출자', 'フランス優勝者 · 世界大会ファイナリスト', 'Vincitore della Francia · finalista globale'),
  germany2018: L('Germany winner · global finalist', '德国赛区优胜者 · 全球决赛入围者', 'Vainqueur d’Allemagne · finaliste mondial', 'Deutscher Sieger · globaler Finalist', 'Ganador de Alemania · finalista mundial', '독일 우승자 · 글로벌 결선 진출자', 'ドイツ優勝者 · 世界大会ファイナリスト', 'Vincitore della Germania · finalista globale'),
  italy2016: L('Italy winner · global finalist', '意大利赛区优胜者 · 全球决赛入围者', 'Vainqueur d’Italie · finaliste mondial', 'Italienischer Sieger · globaler Finalist', 'Ganador de Italia · finalista mundial', '이탈리아 우승자 · 글로벌 결선 진출자', 'イタリア優勝者 · 世界大会ファイナリスト', 'Vincitore dell’Italia · finalista globale'),
  italy2018: L('Italy winner · global finalist', '意大利赛区优胜者 · 全球决赛入围者', 'Vainqueur d’Italie · finaliste mondial', 'Italienischer Sieger · globaler Finalist', 'Ganador de Italia · finalista mundial', '이탈리아 우승자 · 글로벌 결선 진출자', 'イタリア優勝者 · 世界大会ファイナリスト', 'Vincitore dell’Italia · finalista globale'),
  japan2018: L('Japan winner · global finalist', '日本赛区优胜者 · 全球决赛入围者', 'Vainqueur du Japon · finaliste mondial', 'Japanischer Sieger · globaler Finalist', 'Ganador de Japón · finalista mundial', '일본 우승자 · 글로벌 결선 진출자', '日本優勝者 · 世界大会ファイナリスト', 'Vincitore del Giappone · finalista globale'),
  mexicoCity2016: L('Mexico City winner · global finalist', '墨西哥城赛区优胜者 · 全球决赛入围者', 'Vainqueur de Mexico · finaliste mondial', 'Sieger aus Mexiko-Stadt · globaler Finalist', 'Ganador de Ciudad de México · finalista mundial', '멕시코시티 우승자 · 글로벌 결선 진출자', 'メキシコシティ優勝者 · 世界大会ファイナリスト', 'Vincitore di Città del Messico · finalista globale'),
  southAfrica2018: L('South Africa winner · global finalist', '南非赛区优胜者 · 全球决赛入围者', 'Vainqueur d’Afrique du Sud · finaliste mondial', 'Südafrikanischer Sieger · globaler Finalist', 'Ganador de Sudáfrica · finalista mundial', '남아프리카공화국 우승자 · 글로벌 결선 진출자', '南アフリカ優勝者 · 世界大会ファイナリスト', 'Vincitore del Sudafrica · finalista globale'),
  southKorea2018: L('South Korea winner · global finalist', '韩国赛区优胜者 · 全球决赛入围者', 'Vainqueur de Corée du Sud · finaliste mondial', 'Südkoreanischer Sieger · globaler Finalist', 'Ganador de Corea del Sur · finalista mundial', '대한민국 우승자 · 글로벌 결선 진출자', '韓国優勝者 · 世界大会ファイナリスト', 'Vincitore della Corea del Sud · finalista globale'),
  spain2016: L('Spain winner · global finalist', '西班牙赛区优胜者 · 全球决赛入围者', 'Vainqueur d’Espagne · finaliste mondial', 'Spanischer Sieger · globaler Finalist', 'Ganador de España · finalista mundial', '스페인 우승자 · 글로벌 결선 진출자', 'スペイン優勝者 · 世界大会ファイナリスト', 'Vincitore della Spagna · finalista globale'),
  spain2018: L('Spain winner · global finalist', '西班牙赛区优胜者 · 全球决赛入围者', 'Vainqueur d’Espagne · finaliste mondial', 'Spanischer Sieger · globaler Finalist', 'Ganador de España · finalista mundial', '스페인 우승자 · 글로벌 결선 진출자', 'スペイン優勝者 · 世界大会ファイナリスト', 'Vincitore della Spagna · finalista globale'),
  unitedKingdom2016: L('United Kingdom winner · global finalist', '英国赛区优胜者 · 全球决赛入围者', 'Vainqueur du Royaume-Uni · finaliste mondial', 'Sieger des Vereinigten Königreichs · globaler Finalist', 'Ganador del Reino Unido · finalista mundial', '영국 우승자 · 글로벌 결선 진출자', '英国優勝者 · 世界大会ファイナリスト', 'Vincitore del Regno Unito · finalista globale'),
  unitedKingdomGlobal2016: L('United Kingdom winner · 2016 global winner', '英国赛区优胜者 · 2016 全球冠军', 'Vainqueur du Royaume-Uni · vainqueur mondial 2016', 'Sieger des Vereinigten Königreichs · globaler Sieger 2016', 'Ganador del Reino Unido · ganador global de 2016', '영국 우승자 · 2016 글로벌 우승', '英国優勝者 · 2016年グローバル優勝', 'Vincitore del Regno Unito · vincitore globale 2016'),
  unitedStates2024: L('Work contributing to the 2024 U.S. Bartender of the Year win', '助力 2024 美国年度调酒师夺冠的作品', 'Création ayant contribué au titre de Bartender of the Year 2024 aux États-Unis', 'Werk, das zum US-Titel Bartender of the Year 2024 beitrug', 'Obra que contribuyó al título Bartender of the Year 2024 en EE. UU.', '2024년 미국 Bartender of the Year 우승에 기여한 작품', '2024年米国 Bartender of the Year 優勝に貢献した作品', 'Creazione che ha contribuito al titolo Bartender of the Year 2024 negli Stati Uniti'),
  bacardi2019: L('Japan national finalist · Bacardí Legacy 2019', '日本全国决赛入围者 · 2019 Bacardí Legacy', 'Finaliste national japonais · Bacardí Legacy 2019', 'Japanischer nationaler Finalist · Bacardí Legacy 2019', 'Finalista nacional de Japón · Bacardí Legacy 2019', 'Bacardí Legacy 2019 일본 내셔널 결선 진출자', 'Bacardí Legacy 2019 日本国内ファイナリスト', 'Finalista nazionale giapponese · Bacardí Legacy 2019'),
};

const identitySummary = (title: string, author: string, place: Localized, stageName: Localized): Localized => L(
  `The cited official page identifies ${title} by ${author} in ${place.en} at the ${stageName.en}; this research record does not claim a recipe.`,
  `引用的官方页面确认 ${author} 的作品《${title}》代表${place.zh}并进入${stageName.zh}；本研究记录不声称包含配方。`,
  `La page officielle citée identifie ${title} de ${author} pour ${place.fr}, au stade « ${stageName.fr} » ; cette fiche de recherche ne revendique aucune recette.`,
  `Die zitierte offizielle Seite führt ${title} von ${author} für ${place.de} in der Phase „${stageName.de}“; dieser Forschungseintrag beansprucht kein Rezept.`,
  `La página oficial citada identifica ${title}, de ${author}, por ${place.es}, en la fase «${stageName.es}»; esta ficha de investigación no afirma contener una receta.`,
  `인용한 공식 페이지는 ${author}의 ${title}을(를) ${place.ko}의 ${stageName.ko}(으)로 확인합니다. 이 연구 기록은 레시피를 제공한다고 주장하지 않습니다.`,
  `引用した公式ページは、${author}の${title}を${place.ja}の「${stageName.ja}」として確認しています。この研究記録はレシピを収録したものではありません。`,
  `La pagina ufficiale citata identifica ${title} di ${author} per ${place.it}, nella fase «${stageName.it}»; questa scheda di ricerca non dichiara una ricetta.`,
);

const identityGap = (stageName: Localized): Localized => gap(
  `Recipe quantities and a complete method are not included in this research record for the ${stageName.en.toLowerCase()} entry.`,
  `本研究记录未收录这条${stageName.zh}作品的配方用量和完整手法。`,
  `Les quantités et la méthode complète ne figurent pas dans cette fiche pour l’entrée « ${stageName.fr} ».`,
  `Für den Eintrag „${stageName.de}“ enthält dieser Forschungseintrag keine Mengen und keine vollständige Methode.`,
  `Esta ficha no incluye cantidades ni un método completo para la obra «${stageName.es}».`,
  `이 연구 기록에는 ${stageName.ko} 작품의 분량과 전체 제조법이 포함되어 있지 않습니다.`,
  `この研究記録には「${stageName.ja}」作品の分量と全工程を収録していません。`,
  `Questa scheda non include quantità né metodo completo per l’opera «${stageName.it}».`,
);

const bacardiSummary = (title: string, author: string): Localized => L(
  `The cited Bacardí Japan release lists ${title} by ${author} among the five 2019 Japan national finalists; this record does not claim a complete recipe.`,
  `引用的 Bacardí Japan 发布资料将 ${author} 的作品《${title}》列为 2019 年日本全国五强之一；本记录不声称包含完整配方。`,
  `La publication japonaise de Bacardí citée classe ${title} de ${author} parmi les cinq finalistes nationaux japonais de 2019 ; cette fiche ne revendique pas une recette complète.`,
  `Die zitierte Veröffentlichung von Bacardí Japan führt ${title} von ${author} unter den fünf japanischen nationalen Finalisten 2019; dieser Eintrag beansprucht kein vollständiges Rezept.`,
  `La publicación japonesa de Bacardí citada incluye ${title}, de ${author}, entre los cinco finalistas nacionales de Japón de 2019; esta ficha no afirma contener una receta completa.`,
  `인용한 Bacardí Japan 자료는 ${author}의 ${title}을(를) 2019년 일본 내셔널 결선 진출 5개 작품 중 하나로 소개합니다. 이 기록은 완전한 레시피를 제공한다고 주장하지 않습니다.`,
  `引用した Bacardí Japan の資料は、${author}の${title}を2019年日本国内ファイナリスト5作品の一つとして掲載しています。この記録は完全なレシピを収録したものではありません。`,
  `La pubblicazione giapponese Bacardí citata include ${title} di ${author} tra i cinque finalisti nazionali giapponesi del 2019; questa scheda non dichiara una ricetta completa.`,
);

const bacardiGap = (): Localized => gap(
  'The cited finalist release lists the materials but does not provide their quantities or a complete method.',
  '引用的入围资料列出材料，但未提供用量或完整手法。',
  'La publication des finalistes citée liste les ingrédients, sans quantités ni méthode complète.',
  'Die zitierte Finalistenveröffentlichung nennt die Zutaten, aber keine Mengen und keine vollständige Methode.',
  'La publicación citada de los finalistas enumera los ingredientes, pero no sus cantidades ni un método completo.',
  '인용한 결선 자료는 재료를 나열하지만 분량과 전체 제조법은 제공하지 않습니다.',
  '引用したファイナリスト資料は材料を列挙していますが、分量と全工程は示していません。',
  'La pubblicazione citata dei finalisti elenca gli ingredienti, ma non le quantità né il metodo completo.',
);

const identityOverlay = (title: string, author: string, place: Localized, stageName: Localized): ResearchWorkOverlay => ({
  region: place,
  stage: stageName,
  summary: identitySummary(title, author, place, stageName),
  missingDetails: [identityGap(stageName)],
});

const researchMaterialOverlays: Record<string, ResearchWorkOverlay> = {
  'patron-2018-godfathers-affinity': {
    region: region.unitedKingdom,
    stage: stage.unitedKingdom2016,
    materials: [
      material('Patrón Silver', amount('45 ml')),
      material('Martini Ambrato', amount('15 ml')),
      material(L('Coriander seed soda', '芫荽籽苏打水', 'Soda aux graines de coriandre', 'Koriandersamen-Soda', 'Soda de semilla de cilantro', '고수 씨앗 소다', 'コリアンダーシードソーダ', 'Soda ai semi di coriandolo'), amount('75 ml')),
      material(L('Pickled dry crab apple reduction', '腌渍干海棠果浓缩液', 'Réduction de pommettes sèches marinées', 'Reduktion aus eingelegten getrockneten Holzäpfeln', 'Reducción de manzana silvestre seca en escabeche', '절인 말린 야생사과 농축액', 'ピクルスにした乾燥クラブアップル・リダクション', 'Riduzione di mele selvatiche secche marinate'), amount('15 ml')),
      material(L('Fresh lime juice', '新鲜青柠汁', 'Jus de citron vert frais', 'Frischer Limettensaft', 'Zumo de lima fresco', '신선한 라임 주스', 'フレッシュライムジュース', 'Succo di lime fresco'), amount('7.5 ml')),
      material(L('Lime zest spray', '青柠皮喷雾', 'Spray de zeste de citron vert', 'Limettenzesten-Spray', 'Spray de piel de lima', '라임 제스트 스프레이', 'ライムゼストスプレー', 'Spray di scorza di lime'), L('to finish', '收尾', 'pour finir', 'zum Abschluss', 'para terminar', '마무리용', '仕上げ用', 'per finire')),
      material(L('Apple crisp', '苹果脆片', 'Croquant de pomme', 'Apfelchip', 'Crujiente de manzana', '사과 크리스프', 'アップルクリスプ', 'Croccante di mela'), L('garnish', '装饰', 'garniture', 'Garnitur', 'decoración', '가니시', '飾り', 'guarnizione')),
    ],
    method: methods(
      ['Shake every ingredient except the soda with cubed ice.', '除苏打水外，将所有材料与方冰一起摇匀。', 'Shaker tous les ingrédients sauf le soda avec des glaçons en cubes.', 'Alle Zutaten außer dem Soda mit Eiswürfeln shaken.', 'Agitar todos los ingredientes salvo el soda con hielo en cubos.', '소다를 제외한 모든 재료를 각얼음과 함께 셰이크한다.', 'ソーダ以外の全材料を角氷とともにシェイクする。', 'Shakerare tutti gli ingredienti tranne la soda con ghiaccio a cubetti.'],
      ['Double-strain over cubed ice, top with coriander seed soda and finish with lime-zest spray.', '方冰上双重过滤，补入芫荽籽苏打水，并以青柠皮喷雾收尾。', 'Filtrer deux fois sur des glaçons en cubes, compléter de soda aux graines de coriandre et terminer avec le spray de zeste de citron vert.', 'Über Eiswürfel doppelt abseihen, mit Koriandersamen-Soda auffüllen und mit Limettenzesten-Spray abschließen.', 'Colar dos veces sobre hielo en cubos, completar con soda de semilla de cilantro y terminar con el spray de piel de lima.', '각얼음 위에 더블 스트레인하고 고수 씨앗 소다를 채운 뒤 라임 제스트 스프레이로 마무리한다.', '角氷にダブルストレインし、コリアンダーシードソーダを注ぎ、ライムゼストスプレーで仕上げる。', 'Filtrare due volte su ghiaccio a cubetti, colmare con soda ai semi di coriandolo e finire con lo spray di scorza di lime.'],
      ['Garnish with an apple crisp.', '以苹果脆片装饰。', 'Garnir d’un croquant de pomme.', 'Mit einem Apfelchip garnieren.', 'Decorar con un crujiente de manzana.', '사과 크리스프로 가니시한다.', 'アップルクリスプを飾る。', 'Guarnire con un croccante di mela.'],
    ),
    summary: L(
      'The official recipe preserves the competition serve, including two bespoke components; their component formulas are not supplied on this page.',
      '官方配方保留赛事成品，包括两项特制材料；该页面没有提供它们的组成公式。',
      'La recette officielle conserve le service du concours, avec deux préparations spécifiques dont les formules ne sont pas fournies sur cette page.',
      'Das offizielle Rezept bewahrt den Wettbewerbsdrink einschließlich zweier eigener Komponenten; ihre Rezepturen werden auf dieser Seite nicht angegeben.',
      'La receta oficial conserva el servicio del concurso, con dos componentes propios cuyas fórmulas no aparecen en esta página.',
      '공식 레시피는 두 가지 별도 재료를 포함한 대회 서브를 그대로 싣지만, 이 페이지에는 그 구성 공식이 없습니다.',
      '公式レシピは二つの特製材料を含む大会時のサーブを掲載していますが、このページに各材料の配合はありません。',
      'La ricetta ufficiale conserva il servizio della competizione, con due componenti dedicati di cui questa pagina non fornisce le formule.',
    ),
    missingDetails: [
      gap('Coriander seed soda: composition, carbonation and preparation are not published.', '芫荽籽苏打水：未公开组成、充气方式和制备过程。', 'Soda aux graines de coriandre : composition, gazéification et préparation non publiées.', 'Koriandersamen-Soda: Zusammensetzung, Karbonisierung und Zubereitung sind nicht veröffentlicht.', 'Soda de semilla de cilantro: no se publican su composición, carbonatación ni preparación.', '고수 씨앗 소다: 구성, 탄산화와 제조법이 공개되지 않았습니다.', 'コリアンダーシードソーダ：組成、炭酸化、調製法は公開されていません。', 'Soda ai semi di coriandolo: composizione, carbonatazione e preparazione non pubblicate.'),
      gap('Pickled dry crab apple reduction: composition and preparation are not published.', '腌渍干海棠果浓缩液：未公开组成和制备过程。', 'Réduction de pommettes sèches marinées : composition et préparation non publiées.', 'Reduktion aus eingelegten getrockneten Holzäpfeln: Zusammensetzung und Zubereitung sind nicht veröffentlicht.', 'Reducción de manzana silvestre seca en escabeche: no se publican su composición ni preparación.', '절인 말린 야생사과 농축액: 구성과 제조법이 공개되지 않았습니다.', 'ピクルスにした乾燥クラブアップル・リダクション：組成と調製法は公開されていません。', 'Riduzione di mele selvatiche secche marinate: composizione e preparazione non pubblicate.'),
      gap('Lime zest spray and apple crisp: quantities and preparation are not specified.', '青柠皮喷雾与苹果脆片：未注明用量和制备过程。', 'Spray de zeste de citron vert et croquant de pomme : quantités et préparation non précisées.', 'Limettenzesten-Spray und Apfelchip: Mengen und Zubereitung sind nicht angegeben.', 'Spray de piel de lima y crujiente de manzana: no se indican cantidades ni preparación.', '라임 제스트 스프레이와 사과 크리스프: 분량과 제조법이 명시되지 않았습니다.', 'ライムゼストスプレーとアップルクリスプ：分量と調製法は指定されていません。', 'Spray di scorza di lime e croccante di mela: quantità e preparazione non specificate.'),
    ],
  },
  'patron-2018-dauntless-dessert': {
    region: region.germany,
    stage: stage.germany2018,
    materials: [
      material('Patrón Reposado', amount('52.5 ml')),
      material(L('Grapefruit oleo acid', '葡萄柚果皮油糖酸液（Oleo Acid）', 'Oleo-acide de pamplemousse', 'Grapefruit-Oleo-Säure', 'Oleoácido de pomelo', '자몽 올레오 애시드', 'グレープフルーツ・オレオアシッド', 'Oleo-acido di pompelmo'), amount('30 ml')),
      material(L('Black tea syrup', '红茶糖浆', 'Sirop de thé noir', 'Schwarzteesirup', 'Jarabe de té negro', '홍차 시럽', '紅茶シロップ', 'Sciroppo di tè nero'), amount('15 ml')),
      material(L('Bergamot spirits', '佛手柑烈酒', 'Spiritueux de bergamote', 'Bergamotte-Spirituose', 'Destilado de bergamota', '베르가모트 스피릿', 'ベルガモット・スピリッツ', 'Distillato alla bergamotta'), amount(L('1 bar spoon', '1 吧匙', '1 cuillère de bar', '1 Barlöffel', '1 cuchara de bar', '바 스푼 1개', 'バースプーン1杯', '1 cucchiaino da bar'))),
      material(L('Absinthe', '苦艾酒', 'Absinthe', 'Absinth', 'Absenta', '압생트', 'アブサン', 'Assenzio'), amount(L('1 bar spoon', '1 吧匙', '1 cuillère de bar', '1 Barlöffel', '1 cuchara de bar', '바 스푼 1개', 'バースプーン1杯', '1 cucchiaino da bar'))),
      material(L('Grapefruit zest', '葡萄柚皮', 'Zeste de pamplemousse', 'Grapefruitzeste', 'Piel de pomelo', '자몽 제스트', 'グレープフルーツゼスト', 'Scorza di pompelmo'), amount(L('garnish', '装饰', 'garniture', 'Garnitur', 'decoración', '가니시', '飾り', 'guarnizione'))),
    ],
    method: methods(
      ['Add all finished-serve ingredients to a shaker with ice.', '将成品配方的所有材料加入装冰的摇壶。', 'Ajouter tous les ingrédients du service final dans un shaker avec de la glace.', 'Alle Zutaten des fertigen Drinks mit Eis in einen Shaker geben.', 'Añadir todos los ingredientes del servicio final a una coctelera con hielo.', '완성 서브의 모든 재료를 얼음이 든 셰이커에 넣는다.', '完成品の全材料を氷の入ったシェイカーに入れる。', 'Aggiungere tutti gli ingredienti del drink finito in uno shaker con ghiaccio.'],
      ['Shake for 15–20 seconds.', '摇匀 15–20 秒。', 'Shaker pendant 15–20 secondes.', '15–20 Sekunden shaken.', 'Agitar durante 15–20 segundos.', '15–20초 동안 셰이크한다.', '15～20秒間シェイクする。', 'Shakerare per 15–20 secondi.'],
      ['Double-strain into a cordial glass and garnish with grapefruit zest.', '双重过滤入 cordial 杯，以葡萄柚皮装饰。', 'Filtrer deux fois dans un verre à cordial et garnir de zeste de pamplemousse.', 'Doppelt in ein Cordialglas abseihen und mit Grapefruitzeste garnieren.', 'Colar dos veces en una copa cordial y decorar con piel de pomelo.', '코디얼 글라스에 더블 스트레인하고 자몽 제스트로 가니시한다.', 'コーディアルグラスにダブルストレインし、グレープフルーツゼストを飾る。', 'Filtrare due volte in un bicchiere da cordial e guarnire con scorza di pompelmo.'],
    ),
    preparations: [
      preparation('grapefruit-oleo-acid', L('Grapefruit oleo acid', '葡萄柚果皮油糖酸液（Oleo Acid）', 'Oleo-acide de pamplemousse', 'Grapefruit-Oleo-Säure', 'Oleoácido de pomelo', '자몽 올레오 애시드', 'グレープフルーツ・オレオアシッド', 'Oleo-acido di pompelmo'), [
        material(L('Grapefruit zest', '葡萄柚皮', 'Zeste de pamplemousse', 'Grapefruitzeste', 'Piel de pomelo', '자몽 제스트', 'グレープフルーツゼスト', 'Scorza di pompelmo'), L('zest of 10 grapefruits', '10 个葡萄柚的皮', 'zestes de 10 pamplemousses', 'Schale von 10 Grapefruits', 'ralladura de 10 pomelos', '자몽 10개의 제스트', 'グレープフルーツ10個分の皮', 'scorza di 10 pompelmi')),
        material(L('Sugar', '糖', 'Sucre', 'Zucker', 'Azúcar', '설탕', '砂糖', 'Zucchero'), amount('2 lb')),
        material(L('Malic acid', '苹果酸', 'Acide malique', 'Apfelsäure', 'Ácido málico', '말산', 'リンゴ酸', 'Acido malico'), amount('2.5 oz')),
        material(L('Water', '水', 'Eau', 'Wasser', 'Agua', '물', '水', 'Acqua'), amount('1 L')),
      ],
      methods(
        ['Combine the grapefruit zests and sugar in a sealable or vacuum bag.', '将葡萄柚皮和糖装入可密封袋或真空袋中混合。', 'Mélanger les zestes de pamplemousse et le sucre dans un sac refermable ou sous vide.', 'Grapefruitzesten und Zucker in einem verschließbaren oder Vakuumbeutel vermengen.', 'Mezclar las pieles de pomelo y el azúcar en una bolsa sellable o de vacío.', '밀봉 백 또는 진공 백에 자몽 제스트와 설탕을 넣고 섞는다.', 'グレープフルーツの皮と砂糖を密閉袋または真空袋に入れて合わせる。', 'Unire le scorze di pompelmo e lo zucchero in un sacchetto richiudibile o sottovuoto.'],
        ['Rest for 24–48 hours, until the oils have been drawn from the zests.', '静置 24–48 小时，直到果皮中的油脂被析出。', 'Laisser reposer 24–48 heures, jusqu’à extraction des huiles des zestes.', '24–48 Stunden ruhen lassen, bis die Öle aus den Zesten gezogen sind.', 'Dejar reposar 24–48 horas, hasta extraer los aceites de las pieles.', '제스트에서 오일이 빠져나올 때까지 24–48시간 둔다.', '皮からオイルが引き出されるまで24～48時間置く。', 'Lasciare riposare 24–48 ore, finché gli oli non vengono estratti dalle scorze.'],
        ['Separately dissolve the malic acid in the water.', '另将苹果酸溶解在水中。', 'Dissoudre séparément l’acide malique dans l’eau.', 'Die Apfelsäure separat im Wasser auflösen.', 'Disolver por separado el ácido málico en el agua.', '말산을 물에 따로 녹인다.', 'リンゴ酸を水に別途溶かす。', 'Sciogliere separatamente l’acido malico nell’acqua.'],
        ['Add that solution to the grapefruit-and-sugar mixture, stir until the sugar dissolves, then strain out the zests.', '将该溶液加入葡萄柚皮与糖的混合物，搅拌至糖溶解，再滤出果皮。', 'Ajouter cette solution au mélange de pamplemousse et de sucre, remuer jusqu’à dissolution du sucre, puis filtrer les zestes.', 'Diese Lösung zur Grapefruit-Zucker-Mischung geben, rühren, bis sich der Zucker löst, dann die Zesten abseihen.', 'Añadir la solución a la mezcla de pomelo y azúcar, remover hasta disolver el azúcar y colar las pieles.', '그 용액을 자몽과 설탕 혼합물에 넣고 설탕이 녹을 때까지 저은 다음 제스트를 거른다.', 'その溶液をグレープフルーツと砂糖の混合物に加え、砂糖が溶けるまで混ぜてから皮をこす。', 'Aggiungere la soluzione al composto di pompelmo e zucchero, mescolare finché lo zucchero si scioglie, poi filtrare le scorze.'],
      ),
      ),
      preparation('black-tea-syrup', L('Black tea syrup', '红茶糖浆', 'Sirop de thé noir', 'Schwarzteesirup', 'Jarabe de té negro', '홍차 시럽', '紅茶シロップ', 'Sciroppo di tè nero'), [
        material(L('Black tea bags', '红茶茶包', 'Sachets de thé noir', 'Schwarzteebeutel', 'Bolsitas de té negro', '홍차 티백', '紅茶のティーバッグ', 'Bustine di tè nero'), L('10 bags', '10 包', '10 sachets', '10 Teebeutel', '10 bolsitas', '티백 10개', 'ティーバッグ10個', '10 bustine')),
        material(L('Hot water', '热水', 'Eau chaude', 'Heißes Wasser', 'Agua caliente', '뜨거운 물', '湯', 'Acqua calda'), amount('1 L')),
        material(L('Sugar', '糖', 'Sucre', 'Zucker', 'Azúcar', '설탕', '砂糖', 'Zucchero'), amount('1 lb')),
      ],
      methods(
        ['Steep the tea bags in the hot water for approximately 5–8 minutes.', '将茶包在热水中浸泡约 5–8 分钟。', 'Infuser les sachets de thé dans l’eau chaude pendant environ 5–8 minutes.', 'Die Teebeutel etwa 5–8 Minuten im heißen Wasser ziehen lassen.', 'Infusionar las bolsitas en el agua caliente durante aproximadamente 5–8 minutos.', '티백을 뜨거운 물에 약 5–8분간 우린다.', 'ティーバッグを湯に約5～8分浸す。', 'Lasciare in infusione le bustine nell’acqua calda per circa 5–8 minuti.'],
        ['Remove the tea bags, add the sugar and stir until completely dissolved.', '取出茶包，加入糖并搅拌至完全溶解。', 'Retirer les sachets, ajouter le sucre et remuer jusqu’à dissolution complète.', 'Teebeutel entfernen, Zucker hinzufügen und rühren, bis er vollständig gelöst ist.', 'Retirar las bolsitas, añadir el azúcar y remover hasta que se disuelva por completo.', '티백을 빼고 설탕을 넣어 완전히 녹을 때까지 저어 준다.', 'ティーバッグを取り出し、砂糖を加えて完全に溶けるまで混ぜる。', 'Rimuovere le bustine, aggiungere lo zucchero e mescolare finché non è completamente sciolto.'],
      ),
      ),
    ],
    summary: L(
      'The official page discloses the serve and both bespoke preparations; the compact card keeps preparation facts separate from this editorial note.',
      '官方页面公开成品与两项特制材料的做法；卡片将制作事实与编辑摘要分开。',
      'La page officielle publie le service et les deux préparations spécifiques ; la fiche sépare les faits de préparation de cette note éditoriale.',
      'Die offizielle Seite veröffentlicht den Drink und beide eigenen Zubereitungen; die Karte trennt die Zubereitungsfakten von dieser redaktionellen Notiz.',
      'La página oficial publica el servicio y las dos preparaciones propias; la ficha separa los datos de preparación de esta nota editorial.',
      '공식 페이지는 완성 서브와 두 가지 별도 제조법을 공개하며, 카드에서는 제조 사실과 이 편집 메모를 분리합니다.',
      '公式ページは完成品と二つの特製材料の調製法を公開しており、カードでは調製の事実とこの編集メモを分けています。',
      'La pagina ufficiale pubblica il servizio e le due preparazioni dedicate; la scheda separa i fatti di preparazione da questa nota editoriale.',
    ),
    missingDetails: [
      gap('Bergamot spirits: the source does not publish its composition or preparation.', '佛手柑烈酒：来源未公开其组成或制备过程。', 'Spiritueux de bergamote : composition et préparation non publiées par la source.', 'Bergamotte-Spirituose: Zusammensetzung und Zubereitung werden von der Quelle nicht veröffentlicht.', 'Destilado de bergamota: la fuente no publica su composición ni preparación.', '베르가모트 스피릿: 출처는 구성과 제조법을 공개하지 않습니다.', 'ベルガモット・スピリッツ：出典は組成と調製法を公開していません。', 'Distillato alla bergamotta: la fonte non ne pubblica composizione e preparazione.'),
      gap('Grapefruit zest garnish: the source does not specify a quantity or preparation.', '葡萄柚皮装饰：来源未注明用量或制备过程。', 'Garniture de zeste de pamplemousse : quantité et préparation non précisées par la source.', 'Grapefruitzesten-Garnitur: Menge und Zubereitung werden von der Quelle nicht angegeben.', 'Guarnición de piel de pomelo: la fuente no indica cantidad ni preparación.', '자몽 제스트 가니시: 출처는 분량과 제조법을 명시하지 않습니다.', 'グレープフルーツゼストの飾り：出典は分量と調製法を指定していません。', 'Guarnizione di scorza di pompelmo: la fonte non specifica quantità o preparazione.'),
      gap('The source publishes the two preparations, but does not state a finished batch yield or storage life.', '来源公开两项预制材料的做法，但未注明成品批量产量或保存期限。', 'La source publie les deux préparations, sans préciser le rendement du lot ni sa durée de conservation.', 'Die Quelle veröffentlicht beide Zubereitungen, nennt aber weder die Ausbeute noch die Haltbarkeit der Charge.', 'La fuente publica las dos preparaciones, pero no indica el rendimiento final ni la conservación del lote.', '출처는 두 가지 제조법을 공개하지만 완성 배치의 수율과 보관 기간은 밝히지 않습니다.', '出典は二つの調製法を公開していますが、完成バッチの収量と保存期間は記載していません。', 'La fonte pubblica le due preparazioni, ma non indica resa finale o durata di conservazione del lotto.'),
    ],
  },
  'world-class-us-2024-such-great-heights': {
    region: region.unitedStates,
    stage: stage.unitedStates2024,
    materials: [
      material('Ron Zacapa Rum Edición Negra', amount('0.75 oz')),
      material(L('Coconut cold brew', '椰子冷萃', 'Cold brew de coco', 'Kokos-Cold-Brew', 'Cold brew de coco', '코코넛 콜드브루', 'ココナッツ・コールドブリュー', 'Cold brew al cocco'), amount('0.75 oz')),
      material(L('Pineapple amaro liqueur', '菠萝 amaro 利口酒', 'Liqueur amaro à l’ananas', 'Ananas-Amaro-Likör', 'Licor amaro de piña', '파인애플 아마로 리큐르', 'パイナップル・アマーロリキュール', 'Liquore amaro all’ananas'), amount('0.3 oz')),
      material(L('Sherry', '雪莉酒', 'Xérès', 'Sherry', 'Jerez', '셰리', 'シェリー', 'Sherry'), amount('0.3 oz')),
      material(L('Coffee-ground sugar dust', '咖啡粉糖尘', 'Poussière de sucre au café moulu', 'Zuckerstaub mit gemahlenem Kaffee', 'Polvo de azúcar con café molido', '커피 가루 설탕 더스트', 'コーヒーグラウンド・シュガーダスト', 'Zucchero in polvere al caffè macinato'), L('garnish', '装饰', 'garniture', 'Garnitur', 'decoración', '가니시', '飾り', 'guarnizione')),
    ],
    method: methods(
      ['Shake the rum, coconut cold brew, pineapple amaro liqueur and sherry with ice.', '将朗姆酒、椰子冷萃、菠萝 amaro 利口酒和雪莉酒加冰摇匀。', 'Shaker le rhum, le cold brew de coco, la liqueur amaro à l’ananas et le xérès avec de la glace.', 'Rum, Kokos-Cold-Brew, Ananas-Amaro-Likör und Sherry mit Eis shaken.', 'Agitar el ron, el cold brew de coco, el licor amaro de piña y el jerez con hielo.', '럼, 코코넛 콜드브루, 파인애플 아마로 리큐르와 셰리를 얼음과 함께 셰이크한다.', 'ラム、ココナッツ・コールドブリュー、パイナップル・アマーロリキュール、シェリーを氷とともにシェイクする。', 'Shakerare il rum, il cold brew al cocco, il liquore amaro all’ananas e lo sherry con ghiaccio.'],
      ['Strain into a martini glass.', '过滤入马提尼杯。', 'Filtrer dans un verre à martini.', 'In ein Martiniglas abseihen.', 'Colar en una copa de martini.', '마티니 글라스에 스트레인한다.', 'マティーニグラスにこす。', 'Filtrare in una coppetta martini.'],
      ['Finish with coffee-ground sugar dust.', '以咖啡粉糖尘收尾。', 'Terminer avec la poussière de sucre au café moulu.', 'Mit Zuckerstaub mit gemahlenem Kaffee abschließen.', 'Terminar con polvo de azúcar con café molido.', '커피 가루 설탕 더스트로 마무리한다.', 'コーヒーグラウンド・シュガーダストで仕上げる。', 'Finire con zucchero in polvere al caffè macinato.'],
    ),
    preparations: [
      preparation('coconut-cold-brew', L('Coconut cold brew', '椰子冷萃', 'Cold brew de coco', 'Kokos-Cold-Brew', 'Cold brew de coco', '코코넛 콜드브루', 'ココナッツ・コールドブリュー', 'Cold brew al cocco'), [
      material(L('Coconut water and freshly ground coffee beans', '椰子水与新鲜研磨的咖啡豆', 'Eau de coco et grains de café fraîchement moulus', 'Kokoswasser und frisch gemahlene Kaffeebohnen', 'Agua de coco y granos de café recién molidos', '코코넛 워터와 갓 간 커피 원두', 'ココナッツウォーターと挽きたてのコーヒー豆', 'Acqua di cocco e chicchi di caffè macinati al momento'), L('official page states “1:4”; direction and weight/volume basis are not specified', '官方页面写作“1:4”；未说明比例方向，也未说明按重量还是体积。', 'La page officielle indique « 1:4 » ; le sens du ratio et sa base en poids ou en volume ne sont pas précisés.', 'Die offizielle Seite nennt „1:4“; Richtung sowie Gewichts- oder Volumenbasis sind nicht angegeben.', 'La página oficial indica «1:4»; no especifica la dirección ni si la base es peso o volumen.', '공식 페이지는 “1:4”로 표기하지만 비율의 방향과 중량·부피 기준은 명시하지 않습니다.', '公式ページは「1:4」と記載していますが、比率の向きと重量・容量の基準は示していません。', 'La pagina ufficiale indica “1:4”; non specifica il verso del rapporto né se la base sia il peso o il volume.')),
      ],
      methods(
        ['Combine coconut water and freshly ground coffee beans in the published but underspecified 1:4 relationship.', '按来源公布但未充分说明的 1:4 关系，将椰子水与新鲜研磨的咖啡豆混合。', 'Mélanger l’eau de coco et les grains de café fraîchement moulus selon le ratio publié de 1:4, dont les modalités restent imprécises.', 'Kokoswasser und frisch gemahlene Kaffeebohnen im veröffentlichten, aber nicht näher bestimmten Verhältnis 1:4 vermengen.', 'Mezclar el agua de coco y los granos de café recién molidos en la relación publicada de 1:4, cuyos detalles no se especifican.', '공개되었지만 세부 기준이 없는 1:4 비율로 코코넛 워터와 갓 간 커피 원두를 섞는다.', '公開されているものの詳細が定められていない1:4の関係で、ココナッツウォーターと挽きたてのコーヒー豆を合わせる。', 'Unire acqua di cocco e chicchi di caffè macinati al momento nel rapporto pubblicato di 1:4, privo di ulteriori specifiche.'],
        ['Leave to saturate overnight, then fine-strain through a paper filter.', '浸泡至隔夜充分萃取，再用纸滤器细滤。', 'Laisser saturer toute une nuit, puis filtrer finement à travers un filtre en papier.', 'Über Nacht sättigen lassen und anschließend durch einen Papierfilter fein abseihen.', 'Dejar saturar durante la noche y después colar finamente con un filtro de papel.', '하룻밤 포화되도록 둔 다음 종이 필터로 곱게 거른다.', '一晩飽和させ、その後ペーパーフィルターで細かくこす。', 'Lasciare saturare per una notte, poi filtrare finemente con un filtro di carta.'],
      ),
      ),
    ],
    missingDetails: [
      gap('Coconut cold brew: the source gives “1:4” but does not define the ratio direction or whether it is by mass or volume.', '椰子冷萃：来源写作“1:4”，但未说明比例方向，也未说明按重量还是体积。', 'Cold brew de coco : la source indique « 1:4 », sans préciser le sens du ratio ni s’il est massique ou volumique.', 'Kokos-Cold-Brew: Die Quelle nennt „1:4“, definiert aber weder die Richtung noch die Gewichts- oder Volumenbasis.', 'Cold brew de coco: la fuente indica «1:4», pero no define la dirección ni si se trata de peso o volumen.', '코코넛 콜드브루: 출처는 “1:4”라고 하지만 비율의 방향과 중량·부피 기준을 정의하지 않습니다.', 'ココナッツ・コールドブリュー：出典は「1:4」としていますが、比率の向きと重量・容量の基準を定義していません。', 'Cold brew al cocco: la fonte indica “1:4”, ma non definisce il verso né se il rapporto sia in peso o volume.'),
      gap('Pineapple amaro liqueur: brand, composition and preparation are not published.', '菠萝 amaro 利口酒：未公开品牌、组成和制备过程。', 'Liqueur amaro à l’ananas : marque, composition et préparation non publiées.', 'Ananas-Amaro-Likör: Marke, Zusammensetzung und Zubereitung sind nicht veröffentlicht.', 'Licor amaro de piña: no se publican marca, composición ni preparación.', '파인애플 아마로 리큐르: 브랜드, 구성과 제조법이 공개되지 않았습니다.', 'パイナップル・アマーロリキュール：ブランド、組成、調製法は公開されていません。', 'Liquore amaro all’ananas: marca, composizione e preparazione non pubblicate.'),
      gap('Coffee-ground sugar dust: proportions, preparation and serving quantity are not published.', '咖啡粉糖尘：未公开比例、制备过程和每杯用量。', 'Poussière de sucre au café moulu : proportions, préparation et quantité par verre non publiées.', 'Zuckerstaub mit gemahlenem Kaffee: Verhältnis, Zubereitung und Serviermenge sind nicht veröffentlicht.', 'Polvo de azúcar con café molido: no se publican proporciones, preparación ni cantidad por servicio.', '커피 가루 설탕 더스트: 비율, 제조법과 서빙 분량이 공개되지 않았습니다.', 'コーヒーグラウンド・シュガーダスト：配合、調製法、1杯分の量は公開されていません。', 'Zucchero in polvere al caffè macinato: proporzioni, preparazione e quantità per servizio non pubblicate.'),
    ],
    summary: L(
      'Diageo Bar Academy describes this as one of the cocktails that helped Stanyard win the 2024 U.S. title and publishes the cold-brew preparation.',
      'Diageo Bar Academy 将其描述为帮助 Stanyard 赢得 2024 年美国冠军的作品之一，并公开冷萃制法。',
      'Diageo Bar Academy présente cette création comme l’un des cocktails ayant contribué au titre américain 2024 de Stanyard et publie la préparation du cold brew.',
      'Diageo Bar Academy beschreibt diesen Drink als einen der Cocktails, die Stanyard zum US-Titel 2024 verhalfen, und veröffentlicht die Zubereitung des Cold-Brew.',
      'Diageo Bar Academy describe esta obra como uno de los cócteles que ayudaron a Stanyard a ganar el título estadounidense de 2024 y publica la preparación del cold brew.',
      'Diageo Bar Academy는 이 음료를 Stanyard의 2024년 미국 우승에 기여한 칵테일 중 하나로 소개하고 콜드브루 제조법을 공개합니다.',
      'Diageo Bar Academyは、この作品をStanyardの2024年米国タイトル獲得に貢献したカクテルの一つとして紹介し、コールドブリューの調製法を公開しています。',
      'Diageo Bar Academy descrive questa creazione come uno dei cocktail che hanno contribuito al titolo statunitense 2024 di Stanyard e pubblica la preparazione del cold brew.',
    ),
  },
  'world-class-us-2024-apples-for-whales': {
    region: region.unitedStates,
    stage: stage.unitedStates2024,
    materials: [
      material(L('Apple-infused Ketel One Family Made Vodka', '苹果浸泡的 Ketel One Family Made Vodka', 'Vodka Ketel One Family Made infusée à la pomme', 'Mit Apfel infundierter Ketel One Family Made Vodka', 'Vodka Ketel One Family Made infusionado con manzana', '사과 인퓨즈드 Ketel One Family Made Vodka', 'りんごをインフューズした Ketel One Family Made Vodka', 'Vodka Ketel One Family Made infusa alla mela'), amount('1.5 oz')),
      material(L('Apple cordial', '苹果 cordial', 'Cordial de pomme', 'Apfel-Cordial', 'Cordial de manzana', '애플 코디얼', 'アップル・コーディアル', 'Cordial di mela'), amount('1 oz')),
      material(L('Clarified apple juice', '澄清苹果汁', 'Jus de pomme clarifié', 'Geklärter Apfelsaft', 'Zumo de manzana clarificado', '클래리파이드 애플 주스', '澄清りんごジュース', 'Succo di mela chiarificato'), amount('0.5 oz')),
      material(L('Celery-cardamom bitters', '芹菜豆蔻苦精', 'Bitter de céleri et cardamome', 'Sellerie-Kardamom-Bitters', 'Amargos de apio y cardamomo', '셀러리·카다멈 비터스', 'セロリ・カルダモンビターズ', 'Bitter di sedano e cardamomo'), amount(L('1 drop', '1 滴', '1 goutte', '1 Tropfen', '1 gota', '1방울', '1滴', '1 goccia'))),
      material(L('Clarified apple-juice ice cubes', '澄清苹果汁冰块', 'Glaçons de jus de pomme clarifié', 'Eiswürfel aus geklärtem Apfelsaft', 'Cubitos de hielo de zumo de manzana clarificado', '클래리파이드 애플 주스 아이스 큐브', '澄清りんごジュースの氷', 'Cubetti di ghiaccio di succo di mela chiarificato'), amount(L('3 cubes', '3 块', '3 glaçons', '3 Eiswürfel', '3 cubitos', '얼음 3개', '3個', '3 cubetti'))),
      material(L('Bee pollen granules', '蜂花粉颗粒', 'Granules de pollen d’abeille', 'Bienenpollen-Granulat', 'Gránulos de polen de abeja', '벌 화분 알갱이', 'ビーポーレン顆粒', 'Granuli di polline d’api'), L('dusting', '撒面', 'saupoudrage', 'zum Bestäuben', 'para espolvorear', '소량 뿌리기', '振りかける', 'da spolverare')),
    ],
    method: methods(
      ['Stir the infused vodka, cordial, clarified juice and bitters with three clarified apple-juice ice cubes.', '将浸泡伏特加、cordial、澄清果汁和苦精与 3 块澄清苹果汁冰块搅拌。', 'Remuer la vodka infusée, le cordial, le jus clarifié et les bitters avec trois glaçons de jus de pomme clarifié.', 'Den infundierten Wodka, Cordial, geklärten Saft und Bitters mit drei Eiswürfeln aus geklärtem Apfelsaft rühren.', 'Remover el vodka infusionado, el cordial, el zumo clarificado y los amargos con tres cubitos de hielo de zumo de manzana clarificado.', '인퓨즈드 보드카, 코디얼, 클래리파이드 주스와 비터스를 클래리파이드 애플 주스 얼음 3개와 함께 스터한다.', 'インフューズドウォッカ、コーディアル、澄清ジュース、ビターズを澄清りんごジュースの氷3個とともにステアする。', 'Mescolare la vodka infusa, il cordial, il succo chiarificato e i bitter con tre cubetti di ghiaccio di succo di mela chiarificato.'],
      ['Pour into a martini glass.', '倒入马提尼杯。', 'Verser dans un verre à martini.', 'In ein Martiniglas gießen.', 'Verter en una copa de martini.', '마티니 글라스에 따른다.', 'マティーニグラスに注ぐ。', 'Versare in una coppetta martini.'],
      ['Dust the surface with bee-pollen granules.', '在表面撒上蜂花粉颗粒。', 'Saupoudrer la surface de granules de pollen d’abeille.', 'Die Oberfläche mit Bienenpollen-Granulat bestäuben.', 'Espolvorear la superficie con gránulos de polen de abeja.', '표면에 벌 화분 알갱이를 뿌린다.', '表面にビーポーレン顆粒を振りかける。', 'Spolverare la superficie con granuli di polline d’api.'],
    ),
    preparations: [
      preparation('apple-infused-vodka', L('Apple-infused Ketel One Family Made Vodka', '苹果浸泡的 Ketel One Family Made Vodka', 'Vodka Ketel One Family Made infusée à la pomme', 'Mit Apfel infundierter Ketel One Family Made Vodka', 'Vodka Ketel One Family Made infusionado con manzana', '사과 인퓨즈드 Ketel One Family Made Vodka', 'りんごをインフューズした Ketel One Family Made Vodka', 'Vodka Ketel One Family Made infusa alla mela'), [
        material('Ketel One Family Made Vodka', amount('12.5 oz')),
        material(L('Apple discards — cores, solids and similar remnants', '苹果弃料——果核、果肉固形物及类似残余', 'Déchets de pomme — trognons, matières solides et résidus similaires', 'Apfelreste — Kerngehäuse, feste Bestandteile und ähnliche Reste', 'Desechos de manzana — corazones, sólidos y restos similares', '사과 부산물 — 씨방, 고형물 및 유사한 잔여물', 'りんごの廃棄部分 — 芯、固形物などの残り', 'Scarti di mela — torsoli, parti solide e residui simili'), L('quantity not specified', '未注明用量', 'quantité non précisée', 'Menge nicht angegeben', 'cantidad no especificada', '분량 미지정', '量の指定なし', 'quantità non specificata')),
      ],
      methods(
        ['Place the apple discards and vodka in a vessel.', '将苹果弃料和伏特加放入容器。', 'Placer les déchets de pomme et la vodka dans un récipient.', 'Apfelreste und Wodka in ein Gefäß geben.', 'Colocar los desechos de manzana y el vodka en un recipiente.', '사과 부산물과 보드카를 용기에 넣는다.', 'りんごの廃棄部分とウォッカを容器に入れる。', 'Mettere gli scarti di mela e la vodka in un contenitore.'],
        ['Infuse under refrigeration for 48 hours.', '冷藏浸泡 48 小时。', 'Infuser au réfrigérateur pendant 48 heures.', '48 Stunden gekühlt ziehen lassen.', 'Infusionar en refrigeración durante 48 horas.', '냉장 상태로 48시간 인퓨즈한다.', '冷蔵で48時間インフューズする。', 'Lasciare in infusione in frigorifero per 48 ore.'],
        ['Fine-strain and keep refrigerated in an airtight container until use.', '细滤后冷藏于密封容器中，直至使用。', 'Filtrer finement et conserver au réfrigérateur dans un récipient hermétique jusqu’à utilisation.', 'Fein abseihen und bis zur Verwendung gekühlt in einem luftdichten Behälter aufbewahren.', 'Colar finamente y conservar refrigerado en un recipiente hermético hasta su uso.', '곱게 거른 뒤 밀폐 용기에 담아 사용할 때까지 냉장 보관한다.', '細かくこし、密閉容器で使用時まで冷蔵保存する。', 'Filtrare finemente e conservare in frigorifero in un contenitore ermetico fino all’uso.'],
      ),
      ),
    ],
    missingDetails: [
      gap('Apple cordial: composition and preparation are not published.', '苹果 cordial：未公开组成和制备过程。', 'Cordial de pomme : composition et préparation non publiées.', 'Apfel-Cordial: Zusammensetzung und Zubereitung sind nicht veröffentlicht.', 'Cordial de manzana: no se publican su composición ni preparación.', '애플 코디얼: 구성과 제조법이 공개되지 않았습니다.', 'アップル・コーディアル：組成と調製法は公開されていません。', 'Cordial di mela: composizione e preparazione non pubblicate.'),
      gap('Clarified apple juice and its ice cubes: the clarification method is not published.', '澄清苹果汁及其冰块：未公开澄清方法。', 'Jus de pomme clarifié et ses glaçons : méthode de clarification non publiée.', 'Geklärter Apfelsaft und die daraus hergestellten Eiswürfel: Klärungsmethode nicht veröffentlicht.', 'Zumo de manzana clarificado y sus cubitos: no se publica el método de clarificación.', '클래리파이드 애플 주스와 그 얼음: 클래리파이 방법이 공개되지 않았습니다.', '澄清りんごジュースとその氷：澄清方法は公開されていません。', 'Succo di mela chiarificato e relativi cubetti: metodo di chiarificazione non pubblicato.'),
      gap('Celery-cardamom bitters: composition and preparation are not published.', '芹菜豆蔻苦精：未公开组成和制备过程。', 'Bitters de céleri et cardamome : composition et préparation non publiées.', 'Sellerie-Kardamom-Bitters: Zusammensetzung und Zubereitung sind nicht veröffentlicht.', 'Amargos de apio y cardamomo: no se publican su composición ni preparación.', '셀러리·카다멈 비터스: 구성과 제조법이 공개되지 않았습니다.', 'セロリ・カルダモンビターズ：組成と調製法は公開されていません。', 'Bitter di sedano e cardamomo: composizione e preparazione non pubblicate.'),
      gap('Bee-pollen granules: the serving quantity is only described as a dusting.', '蜂花粉颗粒：每杯用量仅描述为撒面。', 'Granules de pollen d’abeille : la quantité par verre est seulement décrite comme un saupoudrage.', 'Bienenpollen-Granulat: Die Serviermenge wird nur als Bestäuben beschrieben.', 'Gránulos de polen de abeja: la cantidad por servicio solo se describe como un espolvoreado.', '벌 화분 알갱이: 서빙 분량은 소량 뿌리기로만 설명되어 있습니다.', 'ビーポーレン顆粒：1杯分の量は「振りかける」とだけ記載されています。', 'Granuli di polline d’api: la quantità per servizio è descritta solo come una spolverata.'),
    ],
    summary: L(
      'The official recipe publishes the apple-vodka infusion but names the cordial, clarified juice, bitters and custom ice without their component formulas.',
      '官方配方公开苹果伏特加浸泡法，但苹果 cordial、澄清果汁、苦精和定制冰块未附完整组成。',
      'La recette officielle publie l’infusion de vodka à la pomme, mais nomme le cordial, le jus clarifié, les bitters et la glace dédiée sans leurs formules.',
      'Das offizielle Rezept veröffentlicht die Apfel-Wodka-Infusion, nennt aber Cordial, geklärten Saft, Bitters und eigenes Eis ohne deren Rezepturen.',
      'La receta oficial publica la infusión de vodka con manzana, pero nombra el cordial, el zumo clarificado, los amargos y el hielo propio sin sus fórmulas.',
      '공식 레시피는 사과 보드카 인퓨전은 공개하지만 코디얼, 클래리파이드 주스, 비터스와 전용 얼음의 구성 공식은 싣지 않습니다.',
      '公式レシピはりんごウォッカのインフュージョンを公開していますが、コーディアル、澄清ジュース、ビターズ、特製氷の配合は示していません。',
      'La ricetta ufficiale pubblica l’infusione della vodka alla mela, ma indica cordial, succo chiarificato, bitter e ghiaccio dedicato senza fornirne le formule.',
    ),
  },
  'patron-2016-song-of-the-sea': identityOverlay('Song of the Sea', 'Nick Cozens', region.australia, stage.australia2016),
  'patron-2016-bell-of-jalisco': identityOverlay('The Bell of Jalisco', 'Mike McGinty', region.unitedKingdom, stage.unitedKingdomGlobal2016),
  'patron-2016-el-pacto': identityOverlay('El Pacto', 'Fernando Fastuca', region.spain, stage.spain2016),
  'patron-2016-pimiento-goloso': identityOverlay('Pimiento Goloso', 'Brice Martaud', region.france, stage.france2016),
  'patron-2016-patron-atole': identityOverlay('Patrón Atole', 'Nicola Ruggiero', region.italy, stage.italy2016),
  'patron-2016-augurio': identityOverlay('Augurio', 'Macario Vazquez', region.mexicoCity, stage.mexicoCity2016),
  'patron-2016-jalisco-swizzle': identityOverlay('Jalisco Swizzle', 'Sudeera Fernando', region.dubai, stage.dubai2016),
  'patron-2018-cielo-de-jalisco': identityOverlay('Cielo de Jalisco', 'Antonio Rosato', region.italy, stage.italy2018),
  'patron-2018-coral-and-coast': identityOverlay('Coral & Coast', 'Thomas Begbie', region.belgium, stage.belgium2018),
  'patron-2018-mayagarita': identityOverlay('Mayagarita', 'François Descamps', region.france, stage.france2018),
  'patron-2018-harmony': identityOverlay('Harmony', 'Bruce Dorfling', region.southAfrica, stage.southAfrica2018),
  'patron-2018-wind': identityOverlay('Wind', 'Yeray Monforte', region.spain, stage.spain2018),
  'patron-2018-best-promise': identityOverlay('The Best Promise', 'Mitsuhiro Nakamura', region.japan, stage.japan2018),
  'patron-2018-muldejewangk': identityOverlay('The Muldejewangk', 'Abby Wegener', region.australia, stage.australia2016),
  'patron-2018-kosmos': identityOverlay('KOSMOS', 'Pat Park', region.southKorea, stage.southKorea2018),
  'legacy-2019-evolver': {region: region.japan, stage: stage.bacardi2019, summary: bacardiSummary('EVOLVER', '岡沼弘泰'), missingDetails: [bacardiGap()]},
  'legacy-2019-oracion': {region: region.japan, stage: stage.bacardi2019, summary: bacardiSummary('oracion', '佐藤麻美'), missingDetails: [bacardiGap()]},
  'legacy-2019-possibilita': {region: region.japan, stage: stage.bacardi2019, summary: bacardiSummary('Possibilita', '高宮裕輔'), missingDetails: [bacardiGap()]},
  'legacy-2019-logos': {region: region.japan, stage: stage.bacardi2019, summary: bacardiSummary('LOGOS', '西野真司'), missingDetails: [bacardiGap()]},
  'legacy-2019-partir': {region: region.japan, stage: stage.bacardi2019, summary: bacardiSummary('PARTIR', '水岸直也'), missingDetails: [bacardiGap()]},
};

export const researchWorkLocalization = researchMaterialOverlays;
/** Alias kept short for callers that only need the overlay table. */
export const researchLocalization = researchWorkLocalization;

const isResearchMaterial = (value: ResearchWork['materials'][number] | ResearchMaterial): value is ResearchMaterial => 'name' in value;

const sourceMaterialName = (value: ResearchWork['materials'][number], locale: Locale): string => isResearchMaterial(value) ? value.name[locale] : value[locale];
const canonicalMaterialName = (value: ResearchWork['materials'][number]): string => isResearchMaterial(value) ? value.name.en : value.en;
const sourceMaterialAmount = (value: ResearchWork['materials'][number]): string | undefined => isResearchMaterial(value) ? value.amount : undefined;

const originalMaterialNames = (work: ResearchWork): string[] | undefined => {
  if (!work.original) return undefined;
  // The source uses a full-width slash between materials; ASCII slashes can
  // occur inside a material description, such as Bacardí's 1/2 reduction note.
  const names = work.original.split('／').map(value => value.trim()).filter(Boolean);
  return names.length === work.materials.length ? names : undefined;
};

const localizedMaterial = (source: ResearchWork['materials'][number], locale: Locale, translation?: ResearchMaterialOverlay, canonicalName?: string): ResearchMaterialView => {
  const name = translation?.name[locale] ?? sourceMaterialName(source, locale);
  const sourceAmount = sourceMaterialAmount(source);
  const translatedAmount = translation?.amount?.[locale];
  const result: ResearchMaterialView = {name: canonicalName ?? name};
  if (translatedAmount !== undefined || sourceAmount !== undefined) result.amount = canonicalName === undefined ? (translatedAmount ?? sourceAmount) : sourceAmount;
  return result;
};

const localizedPreparation = (source: ResearchPreparation, locale: Locale, translation?: ResearchPreparationOverlay, showOriginal = false): ResearchPreparationView => {
  const sourceName = source.name.en;
  const translatedName = translation?.name[locale] ?? source.name[locale];
  const ingredients = source.ingredients.map((item, index) => localizedMaterial(item, locale, translation?.ingredients[index], showOriginal ? item.name.en : undefined));
  const translatedMethod = translation?.method ?? source.method.map(value => same(value));
  return {
    id: source.id,
    name: showOriginal ? sourceName : translatedName,
    ingredients,
    method: showOriginal ? [...source.method] : translatedMethod.map(value => value[locale]),
  };
};

/**
 * Return one immutable reading view for a research row. `showOriginal` only
 * changes source facts (materials, amounts, methods and preparations); the
 * region, stage, editorial summary and disclosure notes stay in the reader's
 * chosen language.  Bacardí rows carry the Japanese list in `original`, so it
 * is used as the canonical material list when the original view is selected.
 */
export function getResearchWorkView(work: ResearchWork, locale: Locale, showOriginal = false): ResearchWorkView {
  const overlay = researchWorkLocalization[work.id];
  const originalNames = originalMaterialNames(work);
  const materials = work.materials.map((item, index) => {
    const canonicalName = showOriginal ? (originalNames?.[index] ?? canonicalMaterialName(item)) : undefined;
    return localizedMaterial(item, locale, overlay?.materials?.[index], canonicalName);
  });
  const translatedMethod = overlay?.method ?? work.method?.map(value => same(value));
  const originalMethod = work.method ? [...work.method] : undefined;
  const preparations = work.preparations?.map(prep => localizedPreparation(prep, locale, overlay?.preparations?.find(value => value.id === prep.id), showOriginal));
  const regionText = overlay?.region[locale] ?? work.region;
  const stageText = overlay?.stage[locale] ?? work.award;
  const summaryText = overlay?.summary[locale] ?? work.summary?.[locale];
  const sourceGaps = overlay?.missingDetails ?? work.missingDetails;
  const disclosure = work.disclosure ?? (work.method?.length ? 'ingredients-only' : 'identity-only');
  const view: ResearchWorkView = {
    id: work.id,
    title: work.title,
    author: work.author,
    materials,
    disclosure,
    ...(work.bar === undefined ? {} : {bar: work.bar}),
    ...(regionText === undefined ? {} : {region: regionText}),
    ...(stageText === undefined ? {} : {stage: stageText, award: stageText}),
    ...(work.original === undefined ? {} : {original: work.original}),
    ...(translatedMethod === undefined ? {} : {method: showOriginal ? originalMethod : translatedMethod.map(value => value[locale])}),
    ...(summaryText === undefined ? {} : {summary: summaryText}),
    ...(preparations === undefined ? {} : {preparations}),
    ...(sourceGaps === undefined ? {} : {missingDetails: sourceGaps.map(value => typeof value === 'string' ? value : value[locale])}),
    ...(work.source === undefined ? {} : {source: {...work.source}}),
  };
  return view;
}
