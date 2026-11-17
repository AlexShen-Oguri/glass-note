import type {DrinkStrengthContent, DrinkStrengthProfile, IngredientStrengthReference, StrengthSource} from '../domain/making/drink-strength';

const source=(title:string,url:string,market?:string,checkedAt='2026-10-23'):StrengthSource=>({title,url,checkedAt,...(market?{market}:{})});
const iba=(slug:string,title:string):StrengthSource=>source(title,`https://iba-world.com/iba-cocktail/${slug}/`,undefined,'2026-09-05');
const example=(ingredientId:string,low:number,high:number,sources:StrengthSource[],bottleIds?:string[],brandIds?:string[]):IngredientStrengthReference=>({ingredientId,low,high,basis:'producer-example',sources,...(bottleIds?{bottleIds}:{}),...(brandIds?{brandIds}:{})});
const model=(ingredientId:string,abv:number,slug:string,explanation:string):IngredientStrengthReference=>({
  ingredientId,low:abv,high:abv,basis:'editorial-assumption',sources:[iba(slug,explanation)],
});

// Deliberately curated examples, not catalogue-wide extremes. These are reference
// products/markets, never evidence of the user's physical bottle or a whole style.
const ginSources=[
  source('Bombay Sapphire London Dry Gin — Bombay Sapphire Shop','https://shop.bombaysapphire.com/collections/gin/products/bombay-sapphire','UK','2026-09-08'),
  source('Tanqueray London Dry Gin — Tanqueray US','https://www.tanqueray.com/en-us/tanqueray-london-dry-gin','US','2026-09-08'),
];
const bourbonSource=source('Knob Creek 9 Year Old Bourbon — Knob Creek','https://www.knobcreek.com/whiskies/9-year-old-bourbon-whiskey','US','2026-09-08');
const ryeSources=[
  source('US*1 Single Barrel Rye — Michter’s','https://michters.com/whiskeys/','US','2026-09-08'),
  source('Rittenhouse Rye — Heaven Hill Distillery','https://heavenhilldistillery.com/rittenhouse-rye.php','US','2026-09-08'),
];
const rumSource=source('BACARDÍ Superior Rum — BACARDÍ US','https://www.bacardi.com/us/en/our-rums/superior-rum/','US','2026-09-08');

const references:IngredientStrengthReference[]=[
  example('gin',40,47.3,ginSources,['bombay-sapphire-london-dry','tanqueray-london-dry']),
  example('campari',24,24,[source('Campari Bitter — Campari US','https://www.campari.com/en-us/our-products/campari/','US','2026-09-08')],['campari-bitter-liqueur']),
  example('sweet-red-vermouth',16,16,[source('Dolin Rouge: 16% producer example','https://www.dolin.fr/en/products/red-vermouth/','France')]),
  example('dry-vermouth',18,18,[source('MARTINI Extra Dry','https://www.martini.com/products/martini-extra-dry/','Producer listing','2026-09-09')],['martini-extra-dry-vermouth']),
  // The reviewed white-rum example is a neutral white rum, a narrower material;
  // it does not claim that every white rum is 40% or change catalogue mappings.
  example('white-rum',40,40,[rumSource]),
  example('neutral-white-rum',40,40,[rumSource],['bacardi-superior-carta-blanca']),
  example('tequila',40,40,[source('Patrón Silver Tequila — Patrón','https://www.patrontequila.com/products/patron-silver.html','US','2026-09-08')],['patron-silver']),
  example('triple-sec',40,40,[source('Cointreau L’Unique: 40.0% ABV producer example','https://www.cointreau.com/us/en/products/cointreau','US')],undefined,['brand-cointreau']),
  example('bourbon-whiskey',50,50,[bourbonSource],['knob-creek-9-bourbon']),
  example('rye-whiskey',42.4,50,ryeSources,['michters-us1-rye','rittenhouse-rye']),
  // The IBA source OR is bourbon or rye. These two reviewed products illustrate
  // that allowed choice, without expanding to all whiskies or all bottle values.
  example('whiskey',42.4,50,[ryeSources[0]!,bourbonSource]),
  example('citron-vodka',40,40,[source('Le Citron Vodka — Grey Goose UK','https://www.greygoose.com/en-gb/products/le-citron.html','UK','2026-09-08')],['grey-goose-le-citron']),
  // Keep the reference narrow enough for Moscow Mule's explicit Smirnoff row;
  // a selected different vodka still uses that bottle's own recorded strength.
  example('vodka',37.5,37.5,[
    source('Smirnoff No. 21 Classic Vodka','https://www.smirnoff.com/en-ie/products/vodkas-and-flavours/smirnoff-no-21-vodka','Ireland: 37.5% example','2026-09-09'),
  ],['smirnoff-no-21-vodka']),
  example('coffee-liqueur',20,20,[source('Kahlúa Original: 20% producer example; Ohio 21.5% variant excluded','https://www.kahlua.com/en-us/products/original-coffee-liqueur/','US, excluding Ohio')],undefined,['brand-kahlua']),
  example('falernum',11,11,[source('John D. Taylor Velvet Falernum: 11% official producer portfolio example','https://alpenz.com/product-falernum.html','US official importer portfolio')]),
  example('allspice-dram',22.5,22.5,[source('St. Elizabeth Allspice Dram: 22.5% official producer portfolio example','https://alpenz.com/product-allspice.html','US official importer portfolio')],undefined,['brand-st-elizabeth']),
  example('martinique-agricole-rhum',43,43,[source('Rhum J.M V.S.O.P: 43% aged agricole producer example; not Martinique molasses rum','https://rhumjmusa.com/our-rums/','US')]),
  example('jamaican-rum',40,40,[source('Signature Blend — Appleton Estate','https://www.appletonestate.com/en-us/rums/signature/','US','2026-09-08')],['appleton-estate-signature']),
  example('orange-curacao',40,40,[source('Ferrand Dry Curaçao original: 40% producer portfolio example','https://www.maisonferrand.co.uk/portfolio/ferrand-curacao','UK, original 70 cl')]),
  example('prosecco',11,11,[source('La Marca Prosecco DOC Treviso Brut: 11% producer example','https://www.lamarca.it/bouquet-collection/prosecco-doc-treviso-brut/','Italy, DOC Treviso Brut')]),
  example('aperol',11,11,[source('Aperol: 11% producer example','https://www.aperol.com/our-products/aperol/','Producer 70 cl / 1 L listing')],undefined,['brand-aperol']),
  model('blackstrap-rum',40,'jungle-bird','Editorial 40% simulation assumption, not a measured or producer ABV; IBA establishes blackstrap identity only. Enter the actual bottle strength.'),
  model('martinique-rum',40,'mai-tai','Editorial 40% simulation assumption, not a measured or producer ABV; IBA specifies Martinique molasses rum, not agricole. Enter the actual bottle strength.'),
  model('blended-aged-rum',40,'three-dots-and-a-dash','Editorial 40% simulation assumption, not a measured or producer ABV; IBA establishes blended aged rum identity only. Enter the actual bottle strength.'),
  example('angostura-bitters',44.7,44.7,[
    source('ANGOSTURA aromatic bitters: producer product identity','https://angosturabitters.com/portfolio/aromatic-bitters/','Producer 200 ml label'),
    source('ANGOSTURA aromatic bitters: 44.7% alc./vol. visually verified on producer 200 ml label','https://angosturabitters.com/wp-content/uploads/2025/06/Large_Aromatic2022.png','Producer 200 ml label'),
  ],undefined,['brand-angostura-aromatic']),
  // Zero here is an explicit unfortified/non-fermented composition model. IBA
  // composition does not establish measured 0%, and real products may differ.
  ...([
    ['pineapple-juice','jungle-bird','fresh pineapple juice'],
    ['lime-juice','daiquiri','fresh lime juice'],
    ['orange-juice','three-dots-and-a-dash','fresh orange juice'],
    ['cranberry-juice','cosmopolitan','unfortified cranberry juice'],
    ['lemon-juice','whiskey-sour','fresh lemon juice'],
    ['demerara-syrup','jungle-bird','sugar-and-water demerara syrup'],
    ['honey-syrup','three-dots-and-a-dash','honey-and-water syrup'],
    ['simple-syrup','whiskey-sour','sugar-and-water syrup'],
    ['orgeat','mai-tai','unfortified orgeat syrup'],
    ['espresso','espresso-martini','unfortified brewed espresso'],
    ['soda-water','mojito','plain carbonated water'],
    ['plain-water','old-fashioned','plain water'],
    ['ginger-beer','moscow-mule','a non-alcoholic ginger beer mixer'],
    ['pink-grapefruit-soda','paloma','an unfortified grapefruit soda mixer'],
    ['superfine-sugar','daiquiri','plain sugar'],
    ['white-cane-sugar','mojito','plain cane sugar'],
    ['sugar-cube','old-fashioned','a plain sugar cube'],
    ['mint-sprigs','mojito','fresh mint'],
    ['salt','paloma','plain salt'],
  ] as const).map(([id,slug,composition])=>model(id,0,slug,`Editorial 0% composition assumption, not measured: ${composition}; the recipe identifies the ingredient, not its tested alcohol content. Replace if fortified or fermented.`)),
];

// These fingerprints were authored from the reviewed source snapshots. Do not
// derive them from the live catalogue: a changed snapshot must lose this sidecar.
const profiles:DrinkStrengthProfile[]=[
  {
    "versionId": "negroni-iba",
    "sourceId": "iba-negroni",
    "fingerprint": "762470cdea13ba98fc277b6b7fd5af4a7687d2d123ed3201c220025302998eb6",
    "format": "short",
    "formatBasis": "editorial",
    "formatReason": "compact-rocks",
    "sources": [
      {
        "title": "IBA Negroni: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/negroni/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial short-drink judgment: Compact stirred aperitif in an old fashioned glass; the recipe has no soda or juice lengthener.",
        "url": "https://iba-world.com/iba-cocktail/negroni/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {}
  },
  {
    "versionId": "jungle-bird-iba",
    "sourceId": "iba-jungle-bird",
    "fingerprint": "0b03aaab2df3812f662333c0a173adfbb909188f0af77c3564f9e9a7a719bd67",
    "format": "long",
    "formatBasis": "editorial",
    "formatReason": "tropical-long",
    "sources": [
      {
        "title": "IBA Jungle Bird: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/jungle-bird/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial long-drink judgment: Editorial tropical juice serve: pineapple, lime and syrup lengthen the rum-and-bitter base, shaken and served over ice. Rocks glass alone does not determine this label.",
        "url": "https://iba-world.com/iba-cocktail/jungle-bird/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {}
  },
  {
    "versionId": "three-dots-and-a-dash-iba",
    "sourceId": "iba-three-dots-and-a-dash",
    "fingerprint": "57b8aaa95091fceab2dc06011acd37d1cfb2b45215e33bc4f43b16b978e48871",
    "format": "long",
    "formatBasis": "editorial",
    "formatReason": "crushed-long",
    "sources": [
      {
        "title": "IBA Three Dots and a Dash: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/three-dots-and-a-dash/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial long-drink judgment: Flash-blended tropical serve in a footed copo, filled with more crushed ice. This label follows the service format.",
        "url": "https://iba-world.com/iba-cocktail/three-dots-and-a-dash/",
        "checkedAt": "2026-10-23"
      },
      {
        "title": "Editorial volume assumption: 1 ml per dash, so two dashes = 2 ml; dasher output varies.",
        "url": "https://iba-world.com/iba-cocktail/three-dots-and-a-dash/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {
      "three-dots-and-a-dash-iba:7": 2
    }
  },
  {
    "versionId": "daiquiri-iba",
    "sourceId": "iba-daiquiri",
    "fingerprint": "98becfa96de535054fdf840e9c3ac27562217fc2319a7340809f6757df45b2dc",
    "format": "short",
    "formatBasis": "editorial",
    "formatReason": "compact-strained",
    "sources": [
      {
        "title": "IBA Daiquiri: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/daiquiri/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial short-drink judgment: Shaken and strained into a chilled cocktail glass, with no top-up service.",
        "url": "https://iba-world.com/iba-cocktail/daiquiri/",
        "checkedAt": "2026-10-23"
      },
      {
        "title": "Editorial volume assumption: omit incremental dissolved-sugar volume for these two barspoons of solid sugar; 0 ml is not a universal solid conversion.",
        "url": "https://iba-world.com/iba-cocktail/daiquiri/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {
      "daiquiri-iba:2": 0
    }
  },
  {
    "versionId": "dry-martini-iba",
    "sourceId": "iba-dry-martini",
    "fingerprint": "fc5ae1edb545b3633e15382cb5d5dcfe11192424aa2890c7d97c042ae90d0780",
    "format": "short",
    "formatBasis": "editorial",
    "formatReason": "compact-strained",
    "sources": [
      {
        "title": "IBA Dry Martini: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/dry-martini/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial short-drink judgment: Stirred and strained into a martini cocktail glass, with no lengthener.",
        "url": "https://iba-world.com/iba-cocktail/dry-martini/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {}
  },
  {
    "versionId": "margarita-iba",
    "sourceId": "iba-margarita",
    "fingerprint": "ab29b072bb5f40e59e821e74af58a32d089f395d3d5fdef76bd450c295e18bd5",
    "format": "short",
    "formatBasis": "editorial",
    "formatReason": "compact-strained",
    "sources": [
      {
        "title": "IBA Margarita: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/margarita/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial short-drink judgment: Shaken sour served strained in a chilled cocktail glass.",
        "url": "https://iba-world.com/iba-cocktail/margarita/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {}
  },
  {
    "versionId": "mojito-iba",
    "sourceId": "iba-mojito",
    "fingerprint": "6df67888717d024331e8c541065149e63a4f07a0d5b509ae040a25b1220dcf55",
    "format": "long",
    "formatBasis": "editorial",
    "formatReason": "soda-long",
    "sources": [
      {
        "title": "IBA Mojito: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/mojito/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial long-drink judgment: Built with ice and topped up with soda; the source leaves glass style and soda volume unspecified.",
        "url": "https://iba-world.com/iba-cocktail/mojito/",
        "checkedAt": "2026-10-23"
      },
      {
        "title": "Editorial volume assumptions: 60 ml soda top-up; 0 ml for reviewed mint and incremental dissolved-sugar volume. Neither is a source measurement.",
        "url": "https://iba-world.com/iba-cocktail/mojito/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {
      "mojito-iba:2": 0,
      "mojito-iba:3": 0,
      "mojito-iba:4": 60
    }
  },
  {
    "versionId": "whiskey-sour-iba",
    "sourceId": "iba-whiskey-sour",
    "fingerprint": "885502cac0eb993b0ed68eff623eb0794aa0747cdc76ab91968cf9b3585804d2",
    "format": "short",
    "formatBasis": "editorial",
    "formatReason": "compact-strained",
    "sources": [
      {
        "title": "IBA Whiskey Sour: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/whiskey-sour/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial short-drink judgment: Shaken sour served in a cobbler glass, or an old fashioned glass for the rocks serve; optional egg does not determine the category.",
        "url": "https://iba-world.com/iba-cocktail/whiskey-sour/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {}
  },
  {
    "versionId": "manhattan-iba",
    "sourceId": "iba-manhattan",
    "fingerprint": "db191917203620466f27f1e12ffdf1fd8e77117806e3def2b6e299f3ca4becaf",
    "format": "short",
    "formatBasis": "editorial",
    "formatReason": "compact-strained",
    "sources": [
      {
        "title": "IBA Manhattan: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/manhattan/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial short-drink judgment: Stirred spirit-and-vermouth drink strained into a chilled cocktail glass.",
        "url": "https://iba-world.com/iba-cocktail/manhattan/",
        "checkedAt": "2026-10-23"
      },
      {
        "title": "Editorial volume assumption: 1 ml per dash for the one aromatic-bitters dash; dasher output varies.",
        "url": "https://iba-world.com/iba-cocktail/manhattan/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {
      "manhattan-iba:2": 1
    }
  },
  {
    "versionId": "old-fashioned-iba",
    "sourceId": "iba-old-fashioned",
    "fingerprint": "e956318eaad72743f0ea72b678b67c3d1c2b5b3cb91513c9aaf77bc69129d664",
    "format": "short",
    "formatBasis": "editorial",
    "formatReason": "compact-rocks",
    "sources": [
      {
        "title": "IBA Old Fashioned: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/old-fashioned/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial short-drink judgment: Built whiskey serve in an old fashioned glass, with only small bitters-and-water additions rather than a top-up mixer.",
        "url": "https://iba-world.com/iba-cocktail/old-fashioned/",
        "checkedAt": "2026-10-23"
      },
      {
        "title": "Editorial volume assumptions: three 1 ml dashes each of bitters and plain water; source says a few, not three. Omit incremental dissolved sugar-cube volume (0 ml).",
        "url": "https://iba-world.com/iba-cocktail/old-fashioned/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {
      "old-fashioned-iba:1": 0,
      "old-fashioned-iba:2": 3,
      "old-fashioned-iba:3": 3
    }
  },
  {
    "versionId": "cosmopolitan-iba",
    "sourceId": "iba-cosmopolitan",
    "fingerprint": "6b5c6d01b645650a5e84327bee3565f30704874af7c355763d9f95e4a8fb6be6",
    "format": "short",
    "formatBasis": "editorial",
    "formatReason": "compact-strained",
    "sources": [
      {
        "title": "IBA Cosmopolitan: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/cosmopolitan/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial short-drink judgment: Shaken and strained into a large cocktail glass; cranberry juice does not itself force a long-drink classification.",
        "url": "https://iba-world.com/iba-cocktail/cosmopolitan/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {}
  },
  {
    "versionId": "espresso-martini-iba",
    "sourceId": "iba-espresso-martini",
    "fingerprint": "2a50701f5747049544836528cd0f905c45ec0b458ccc2e6097fb3bd8e4f809c0",
    "format": "short",
    "formatBasis": "editorial",
    "formatReason": "compact-strained",
    "sources": [
      {
        "title": "IBA Espresso Martini: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/espresso-martini/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial short-drink judgment: Shaken and strained into a chilled cocktail glass; the espresso dose needs a separate volume assumption.",
        "url": "https://iba-world.com/iba-cocktail/espresso-martini/",
        "checkedAt": "2026-10-23"
      },
      {
        "title": "Editorial volume assumption: 30 ml for the one espresso; shot size is not specified by the source.",
        "url": "https://iba-world.com/iba-cocktail/espresso-martini/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {
      "espresso-martini-iba:3": 30
    }
  },
  {
    "versionId": "boulevardier-iba",
    "sourceId": "iba-boulevardier",
    "fingerprint": "cb208b0c2b9613a44f6d9a9b53a176fcba606fe0fb89f401ce37d2afc4fdf798",
    "format": "short",
    "formatBasis": "editorial",
    "formatReason": "compact-strained",
    "sources": [
      {
        "title": "IBA Boulevardier: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/boulevardier/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial short-drink judgment: Stirred spirit-and-aperitif drink strained into a chilled cocktail glass.",
        "url": "https://iba-world.com/iba-cocktail/boulevardier/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {}
  },
  {
    "versionId": "americano-iba",
    "sourceId": "iba-americano",
    "fingerprint": "2453bf182054355e1f5b24853285bfc4af7f319a5e44dbb9d49ac450f6556143",
    "format": "long",
    "formatBasis": "editorial",
    "formatReason": "soda-long",
    "sources": [
      {
        "title": "IBA Americano: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/americano/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial long-drink judgment: Editorial soda-lengthened aperitif, built over ice; the old fashioned glass does not by itself make it short.",
        "url": "https://iba-world.com/iba-cocktail/americano/",
        "checkedAt": "2026-10-23"
      },
      {
        "title": "Editorial volume assumption: 60 ml soda splash; the source does not fix splash size.",
        "url": "https://iba-world.com/iba-cocktail/americano/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {
      "americano-iba:2": 60
    }
  },
  {
    "versionId": "spritz-iba",
    "sourceId": "iba-spritz",
    "fingerprint": "992d186e4ef81b56e23c4ffda317f84c90a4c2262798c8354f022212d7622bd7",
    "format": "long",
    "formatBasis": "editorial",
    "formatReason": "soda-long",
    "sources": [
      {
        "title": "IBA Spritz: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/spritz/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial long-drink judgment: Sparkling wine-and-aperitif serve built with ice and a soda splash in a wine glass.",
        "url": "https://iba-world.com/iba-cocktail/spritz/",
        "checkedAt": "2026-10-23"
      },
      {
        "title": "Editorial volume assumption: 60 ml soda splash; the source does not fix splash size.",
        "url": "https://iba-world.com/iba-cocktail/spritz/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {
      "spritz-iba:2": 60
    }
  },
  {
    "versionId": "gin-fizz-iba",
    "sourceId": "iba-gin-fizz",
    "fingerprint": "dfe228a1a00c5225abb893ab6e5b22613a505e953088a191e8195082c6d6d648",
    "format": "long",
    "formatBasis": "editorial",
    "formatReason": "soda-long",
    "sources": [
      {
        "title": "IBA Gin Fizz: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/gin-fizz/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial long-drink judgment: Shaken base lengthened with soda in a thin tall tumbler; the source specifically serves it without ice.",
        "url": "https://iba-world.com/iba-cocktail/gin-fizz/",
        "checkedAt": "2026-10-23"
      },
      {
        "title": "Editorial volume assumption: 60 ml soda splash; the source does not fix splash size.",
        "url": "https://iba-world.com/iba-cocktail/gin-fizz/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {
      "gin-fizz-iba:3": 60
    }
  },
  {
    "versionId": "tom-collins-iba",
    "sourceId": "iba-john-collins",
    "fingerprint": "0590d1327f300e7cda8acdc51e8d20be0652188cab2437590ffa402539982c40",
    "format": "long",
    "formatBasis": "editorial",
    "formatReason": "soda-long",
    "sources": [
      {
        "title": "IBA Tom Collins: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/john-collins/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial long-drink judgment: Highball serve built over ice with a measured 60 ml soda portion; source note specifies Old Tom gin for Tom Collins.",
        "url": "https://iba-world.com/iba-cocktail/john-collins/",
        "checkedAt": "2026-10-23"
      }
    ],
    "rowReferences": {
      "tom-collins-iba:0": {
        "ingredientId": "gin",
        "low": 40,
        "high": 40,
        "basis": "editorial-assumption",
        "sources": [
          {
            "title": "Editorial Old Tom gin 40% simulation assumption, not a measured or producer ABV. IBA specifies Old Tom identity only; replace with the actual bottle strength.",
            "url": "https://iba-world.com/iba-cocktail/john-collins/",
            "checkedAt": "2026-10-23"
          }
        ]
      }
    },
    "volumeMl": {}
  },
  {
    "versionId": "moscow-mule-iba",
    "sourceId": "iba-moscow-mule",
    "fingerprint": "e53525013741f09061db86c6583e9dea8467b47f7ebcfd4a997bed02b89dee3f",
    "format": "long",
    "formatBasis": "editorial",
    "formatReason": "soda-long",
    "sources": [
      {
        "title": "IBA Moscow Mule: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/moscow-mule/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial long-drink judgment: Vodka base lengthened with a measured 120 ml ginger beer, served in a mule cup or rocks glass.",
        "url": "https://iba-world.com/iba-cocktail/moscow-mule/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {}
  },
  {
    "versionId": "mai-tai-iba",
    "sourceId": "iba-mai-tai",
    "fingerprint": "5356e2f6c5678d6dae2eb710a7451e76c931e5e5f2a486da88ab4a2cee2d8e88",
    "format": "long",
    "formatBasis": "editorial",
    "formatReason": "tropical-long",
    "sources": [
      {
        "title": "IBA Mai-Tai: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/mai-tai/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial long-drink judgment: Editorial tropical over-ice serve poured into a double rocks or highball glass; the two allowed glass shapes remain source facts.",
        "url": "https://iba-world.com/iba-cocktail/mai-tai/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {}
  },
  {
    "versionId": "paloma-iba",
    "sourceId": "iba-paloma",
    "fingerprint": "26c4059ccbe0f1eeddbe786f51b1ba80e898aae669bc2de8384c61a9c8c21a90",
    "format": "long",
    "formatBasis": "editorial",
    "formatReason": "soda-long",
    "sources": [
      {
        "title": "IBA Paloma: source composition and serving method",
        "url": "https://iba-world.com/iba-cocktail/paloma/",
        "checkedAt": "2026-09-05"
      },
      {
        "title": "Editorial long-drink judgment: Tequila base lengthened with measured pink grapefruit soda in a highball over ice.",
        "url": "https://iba-world.com/iba-cocktail/paloma/",
        "checkedAt": "2026-10-23"
      },
      {
        "title": "Editorial volume assumption: omit incremental volume for this reviewed salt pinch (0 ml), not a general pinch conversion.",
        "url": "https://iba-world.com/iba-cocktail/paloma/",
        "checkedAt": "2026-10-23"
      }
    ],
    "volumeMl": {
      "paloma-iba:2": 0
    }
  },
];

export const drinkStrengthContent:DrinkStrengthContent={references,profiles};
