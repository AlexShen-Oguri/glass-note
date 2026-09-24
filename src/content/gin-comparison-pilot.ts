import type {Localized} from '../domain/contracts';

export const GIN_COMPARISON_PILOT_VERSION_ID='gin-and-tonic-diffords-gin-and-tonic';
export const GIN_COMPARISON_PILOT_INGREDIENT_ID='gin';

export interface GinComparisonPilotBottle {
  bottleId: 'tanqueray-london-dry'|'bombay-sapphire-london-dry'|'hendricks-original';
  supportedIngredientId: typeof GIN_COMPARISON_PILOT_INGREDIENT_ID;
  flavourSummary: Localized;
  evidence: {
    title: string;
    url: string;
    checkedAt: string;
    basis: 'producer';
    retrieval: 'official-page-open'|'official-page-search-extract';
  };
  /** The catalogue value may describe one market; the user's physical bottle must be checked separately. */
  actualBottleAbv: null;
}

const L=(en:string,zh:string,fr:string,de:string,es:string,ko:string,ja:string,it:string):Localized=>({en,zh,fr,de,es,ko,ja,it});

export const ginComparisonPilot={
  versionId:GIN_COMPARISON_PILOT_VERSION_ID,
  ingredientId:GIN_COMPARISON_PILOT_INGREDIENT_ID,
  evidenceCheckedAt:'2026-09-16T02:28:14.320Z',
  bottles:[
    {
      bottleId:'tanqueray-london-dry',
      supportedIngredientId:GIN_COMPARISON_PILOT_INGREDIENT_ID,
      flavourSummary:L(
        'The producer describes piney juniper, peppery coriander, aromatic angelica and sweet liquorice, with an herbal taste and floral finish.',
        '厂商描述为松针般杜松子、辛香芫荽、芳香当归与甜甘草，并呈现草本口感和花香收尾。',
        'Le producteur décrit un genièvre résineux, de la coriandre poivrée, de l’angélique aromatique et de la réglisse douce, avec un goût herbacé et une finale florale.',
        'Der Hersteller beschreibt harzigen Wacholder, pfeffrigen Koriander, aromatische Angelika und süßes Süßholz sowie einen Kräutergeschmack mit floralem Finish.',
        'El productor describe enebro resinoso, cilantro especiado, angélica aromática y regaliz dulce, con sabor herbal y final floral.',
        '생산자는 솔 향의 주니퍼, 후추 같은 코리앤더, 향긋한 안젤리카와 달콤한 감초, 허브 풍미와 플로럴 피니시를 설명합니다.',
        'メーカーは、松のようなジュニパー、胡椒を思わせるコリアンダー、香り高いアンゼリカ、甘いリコリス、ハーバルな味わいとフローラルな余韻を挙げています。',
        'Il produttore descrive ginepro resinoso, coriandolo pepato, angelica aromatica e liquirizia dolce, con gusto erbaceo e finale floreale.',
      ),
      evidence:{title:'Tanqueray London Dry Gin — Tanqueray GB',url:'https://www.tanqueray.com/en-gb/tanqueray-london-dry-gin',checkedAt:'2026-09-16T02:28:14.320Z',basis:'producer',retrieval:'official-page-open'},
      actualBottleAbv:null,
    },
    {
      bottleId:'bombay-sapphire-london-dry',
      supportedIngredientId:GIN_COMPARISON_PILOT_INGREDIENT_ID,
      flavourSummary:L(
        'The producer describes delicate juniper, bright citrus and subtle spice from ten botanicals.',
        '厂商描述十种植物香料带来细致杜松子、明亮柑橘与含蓄辛香。',
        'Le producteur décrit un genièvre délicat, des agrumes vifs et une épice discrète issus de dix botaniques.',
        'Der Hersteller beschreibt feinen Wacholder, lebhafte Zitrusnoten und dezente Würze aus zehn Botanicals.',
        'El productor describe enebro delicado, cítricos vivos y especias sutiles procedentes de diez botánicos.',
        '생산자는 열 가지 보태니컬에서 오는 섬세한 주니퍼, 밝은 시트러스와 은은한 스파이스를 설명합니다.',
        'メーカーは、10種のボタニカルによる繊細なジュニパー、鮮やかな柑橘、穏やかなスパイスを挙げています。',
        'Il produttore descrive ginepro delicato, agrumi vivaci e spezie leggere provenienti da dieci botaniche.',
      ),
      evidence:{title:'Bombay Sapphire Gin — Bombay Sapphire Distillery',url:'https://shop.bombaysapphire.com/collections/all-gin/products/bombay-sapphire',checkedAt:'2026-09-16T02:28:14.320Z',basis:'producer',retrieval:'official-page-open'},
      actualBottleAbv:null,
    },
    {
      bottleId:'hendricks-original',
      supportedIngredientId:GIN_COMPARISON_PILOT_INGREDIENT_ID,
      flavourSummary:L(
        'The producer describes rose and cucumber over eleven botanicals, giving a light, floral and refreshing profile.',
        '厂商描述玫瑰与黄瓜叠加于十一种植物香料之上，呈现轻盈、花香与清新的风格。',
        'Le producteur décrit la rose et le concombre sur onze botaniques, pour un profil léger, floral et rafraîchissant.',
        'Der Hersteller beschreibt Rose und Gurke über elf Botanicals, mit einem leichten, floralen und erfrischenden Profil.',
        'El productor describe rosa y pepino sobre once botánicos, con un perfil ligero, floral y refrescante.',
        '생산자는 11가지 보태니컬 위에 장미와 오이가 더해진 가볍고 플로럴하며 산뜻한 프로필을 설명합니다.',
        'メーカーは、11種のボタニカルにバラとキュウリを重ねた、軽やかでフローラル、爽やかな個性を挙げています。',
        'Il produttore descrive rosa e cetriolo su undici botaniche, per un profilo leggero, floreale e rinfrescante.',
      ),
      evidence:{title:'Hendrick’s Original — Hendrick’s US',url:'https://us.hendricksgin.com/hendricks-original/',checkedAt:'2026-09-16T02:28:14.320Z',basis:'producer',retrieval:'official-page-search-extract'},
      actualBottleAbv:null,
    },
  ] satisfies readonly GinComparisonPilotBottle[],
} as const;

export function ginComparisonPilotBottle(bottleId:string):GinComparisonPilotBottle|undefined {
  return ginComparisonPilot.bottles.find(record=>record.bottleId===bottleId);
}
