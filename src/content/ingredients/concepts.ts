import {LOCALES, type Catalogue, type Ingredient, type Localized, type MaterialAlias, type MaterialConcept, type RecipeIngredient, type RecipeMaterialRequirement, type RecipeVersion} from '../../domain/contracts';

const L = (en:string,zh:string,fr:string,de:string,es:string,ko:string,ja:string,it:string):Localized=>({en,zh,fr,de,es,ko,ja,it});

/** Explicit reviewed identities. Neither base fields, names nor taxonomy parents add members. */
const reviewedConcepts:MaterialConcept[] = [
  {
    id:'food-generic-whisky', name:L('Whiskey','威士忌','Whisky','Whisky','Whisky','위스키','ウイスキー','Whisky'), kind:'pure-spirit',
    memberIds:['food-generic-whisky','whiskey','bourbon-whiskey','rye-whiskey','scotch-whisky','islay-whisky','irish-whiskey','scotch-bourbon-or-rye-whiskey','japanese-world-whisky','generic-aged-whiskey','tennessee-whiskey','single-malt-scotch-whisky','single-malt-whisky','japanese-whisky','corn-whiskey','rice-whiskey','wheat-whiskey'],
    basis:'Reviewed recipe identities and product-source records identify these as pure grain whiskey styles or same-family source choices. Daily style substitution is approved; fruit, peanut-butter, liqueur, umeshu and butter-washed identities are excluded. Original composition and source style facts remain on each member.',
  },
  {
    id:'rum', name:L('Rum','朗姆酒','Rhum','Rum','Ron','럼','ラム','Rum'), kind:'pure-spirit',
    memberIds:['rum','food-rum','white-rum','light-rum','jamaican-rum','martinique-rum','dark-rum','neutral-white-rum','gold-jamaican-rum','cuban-rum','jamaican-overproof-white-rum','blackstrap-rum','aged-rum','martinique-agricole-rhum','blended-aged-rum','puerto-rican-rum','demerara-rum','dark-jamaican-rum','overproof-jamaican-rum','overproof-demerara-rum','gold-rum','aged-column-still-rum','navy-strength-rum','rhum-agricole','demerara-151-rum','overproof-rum','navy-style-rum','clairin','charanda'],
    basis:'Reviewed recipe names identify unflavored rum styles; OFF rum is a direct generic identity. Retained product sources explicitly name Clairin Communal Rum and Uruapan Charanda Agricole Single Estate Rum. Cane, origin, aging and strength remain source descriptions. Spiced, fruit, coconut, cacao, liqueur and unresolved Ron Smoky identities are excluded.',
  },
  {
    id:'gin', name:L('Gin','金酒','Gin','Gin','Ginebra','진','ジン','Gin'), kind:'pure-spirit',
    memberIds:['gin','old-tom-gin','barrel-aged-gin'],
    basis:'Reviewed plain gin, Old Tom and barrel-aged gin identities are styles of gin without added fruit or tea preparations. Genever, sloe liqueur, fruit-flavored and infused gins retain their identities.',
  },
  {
    id:'tequila', name:L('Tequila','龙舌兰酒','Tequila','Tequila','Tequila','테킬라','テキーラ','Tequila'), kind:'pure-spirit',
    memberIds:['tequila','food-tequila'],
    basis:'Recipe 100% agave tequila and the OFF tequila record identify the same main spirit. The source agave specification remains descriptive and does not upgrade unknown member composition.',
  },
  {
    id:'mezcal', name:L('Mezcal','梅斯卡尔','Mezcal','Mezcal','Mezcal','메스칼','メスカル','Mezcal'), kind:'pure-spirit',
    memberIds:['mezcal','espadin-mezcal'],
    basis:'Reviewed recipe identities name mezcal and its Espadín agave style. Tequila is a separate material identity.',
  },
  {
    id:'brandy', name:L('Brandy','白兰地','Brandy','Brandy','Brandy','브랜디','ブランデー','Brandy'), kind:'pure-spirit',
    memberIds:['brandy','cognac','food-armagnac'],
    basis:'Reviewed generic grape brandy, Cognac and Armagnac identities are grape brandy styles. Pisco remains exact pending a separate style review; apple, pear, plum and sweetened fruit liqueur identities are excluded.',
  },
  {
    id:'apple-brandy', name:L('Apple brandy','苹果白兰地','Eau-de-vie de pomme','Apfelbrandy','Brandy de manzana','애플 브랜디','アップルブランデー','Brandy di mele'), kind:'pure-spirit',
    memberIds:['apple-brandy','calvados','applejack'],
    basis:'Reviewed recipe and product identities name apple brandy, Calvados and applejack as apple spirits. Grape, pear, plum, mixed-fruit eau-de-vie and fruit liqueurs remain independent.',
  },
  {
    id:'vodka', name:L('Vodka','伏特加','Vodka','Wodka','Vodka','보드카','ウォッカ','Vodka'), kind:'pure-spirit', memberIds:['vodka'],
    basis:'Reviewed plain vodka identity. Vanilla, citrus, fruit, spice and other flavored vodka identities are not daily substitutes for plain vodka.',
  },
  {
    id:'saline-solution', name:L('Saline','盐水','Eau salée','Salzwasser','Agua salada','소금물','塩水','Acqua salata'), kind:'recipe-specification',
    memberIds:['saline-solution','saline-five-one','saline-twenty-percent','food-brine'],
    basis:'User-approved ordinary salt-and-water identity, including the direct OFF brine record. 20% by total weight and 5:1 water:salt are retained only in source-row descriptions. No inventory concentration comparison or dose conversion; olive and pickle brines are independent.',
  },
  {
    id:'simple-syrup', name:L('Simple syrup','糖浆','Sirop de sucre','Zuckersirup','Almíbar simple','심플 시럽','シュガーシロップ','Sciroppo semplice'), kind:'recipe-specification',
    memberIds:['simple-syrup','rich-sugar-syrup'],
    basis:'Reviewed plain sugar-and-water syrups differ by recipe ratio, not an added flavor identity. The rich 2:1 source label and notes remain readable without changing doses. Demerara, brown sugar, flavored and compound syrups remain exact.',
  },
  {
    id:'cloves', name:L('Cloves','丁香','Clous de girofle','Gewürznelken','Clavos de olor','정향','クローブ','Chiodi di garofano'), kind:'synonym', memberIds:['cloves','food-clove'],
    basis:'Confirmed recipe cloves and OFF clove record identify the same spice. Legacy aliases are retained for search; they do not infer language or product composition.',
  },
  {
    id:'red-chilli', name:L('Red chilli pepper','红辣椒','Piment rouge','Roter Chili','Chile rojo','빨간 고추','赤唐辛子','Peperoncino rosso'), kind:'synonym', memberIds:['red-chilli','food-red-chili-pepper'],
    basis:'Confirmed recipe red chilli pepper and OFF red chili pepper record are the same ingredient identity. Other peppers and processed forms remain exact.',
  },
];

function materialAliases(ingredient:Ingredient):MaterialAlias[] {
  const source = ingredient.guide?.source;
  const provenance = source ? {sourceId:source.recordId || source.url} : {};
  const aliases:MaterialAlias[] = LOCALES.map(locale=>({value:ingredient.name[locale],locale,ingredientId:ingredient.id,...provenance}));
  // A matching English name confirms this canonical source label's language.
  // Differently worded source labels and flattened aliases do not carry that evidence.
  if (source?.canonicalName) aliases.push({value:source.canonicalName,locale:source.canonicalName===ingredient.name.en?'en':'unknown',ingredientId:ingredient.id,...provenance});
  for (const value of ingredient.guide?.aliases ?? []) aliases.push({value,locale:'unknown',ingredientId:ingredient.id,...provenance});
  return aliases;
}

export function buildMaterialConcepts(ingredients:readonly Ingredient[]):MaterialConcept[] {
  const byId = new Map(ingredients.map(ingredient=>[ingredient.id,ingredient]));
  const assigned = new Set<string>();
  const concepts:MaterialConcept[] = [];
  for (const reviewed of reviewedConcepts) {
    if (!byId.has(reviewed.id)) continue;
    const memberIds = reviewed.memberIds.filter(id=>byId.has(id));
    concepts.push({...reviewed,name:{...reviewed.name},memberIds,aliases:memberIds.flatMap(id=>materialAliases(byId.get(id)!))});
    for (const id of memberIds) assigned.add(id);
  }
  for (const ingredient of byId.values()) {
    if (assigned.has(ingredient.id)) continue;
    concepts.push({id:ingredient.id,name:{...ingredient.name},memberIds:[ingredient.id],kind:'unreviewed',basis:'No reviewed equivalence. Retain this exact legacy identity, source record, aliases and composition facts; no name, base or taxonomy inference.',aliases:materialAliases(ingredient)});
  }
  return concepts;
}

const sourceDisplayRequirements:RecipeMaterialRequirement[] = [
  {
    versionId:'whiskey-highball-batch-f',rowIndex:0,
    originalRow:{ingredientId:'whiskey',amount:2,unit:'oz',note:L('The source leaves the whiskey style open.','来源未限定威士忌风格。','La source laisse le style de whiskey ouvert.','Die Quelle lässt den Whiskey-Stil offen.','La fuente deja abierto el estilo de whiskey.','출처는 위스키 스타일을 열어 둡니다.','出典はウイスキーの種類を限定しません。','La fonte lascia libero lo stile di whiskey.')},
    sourceName:L('Whiskey','威士忌','Whisky','Whisky','Whisky','위스키','ウイスキー','Whisky'),
  },
  {
    versionId:'scotch-and-soda-batch-f',rowIndex:0,
    originalRow:{ingredientId:'scotch-whisky',amount:2,unit:'oz'},
    sourceName:L('Scotch whisky','苏格兰威士忌','Whisky écossais','Scotch Whisky','Whisky escocés','스카치 위스키','スコッチウイスキー','Whisky scozzese'),
  },
  {
    versionId:'hot-toddy-batch-f',rowIndex:3,
    originalRow:{ingredientId:'whiskey',amount:2,unit:'oz',note:L('The source allows bourbon, rye, Irish whiskey, or Scotch.','来源允许波本、黑麦、爱尔兰或苏格兰威士忌。','La source permet bourbon, rye, whiskey irlandais ou Scotch.','Die Quelle erlaubt Bourbon, Rye, Irish Whiskey oder Scotch.','La fuente permite bourbon, centeno, irlandés o Scotch.','출처는 버번, 라이, 아이리시, 스카치를 허용합니다.','出典はバーボン、ライ、アイリッシュ、スコッチを可とします。','La fonte permette bourbon, rye, irlandese o Scotch.')},
    sourceName:L('Bourbon, rye, Irish whiskey, or Scotch','波本、黑麦、爱尔兰或苏格兰威士忌','Bourbon, rye, whiskey irlandais ou Scotch','Bourbon, Rye, Irish Whiskey oder Scotch','Bourbon, centeno, whiskey irlandés o Scotch','버번, 라이, 아이리시 위스키 또는 스카치','バーボン、ライ、アイリッシュウイスキー、またはスコッチ','Bourbon, rye, whiskey irlandese o Scotch'),
  },
  {
    versionId:'virgin-mary-batch-m',rowIndex:2,
    originalRow:{ingredientId:'pickle-brine',amount:10,unit:'ml',note:L('Or olive brine.','也可用橄榄盐水。','Ou saumure d’olives.','Oder Olivenlake.','O salmuera de aceituna.','올리브 절임물로 대체 가능.','オリーブの漬け汁でも可。','Oppure salamoia di olive.')},
    sourceName:L('Pickle or olive brine','腌黄瓜或橄榄盐水','Saumure de cornichons ou d’olives','Gurken- oder Olivenlake','Salmuera de pepinillo o aceituna','피클 또는 올리브 절임물','ピクルスまたはオリーブの漬け汁','Salamoia di cetriolini o olive'),
    acceptedIngredientIds:['pickle-brine','green-olive-brine'],
  },
  {
    versionId:'vermouth-tonic-batch-m',rowIndex:0,
    originalRow:{ingredientId:'food-vermouth',amount:1.5,unit:'oz',note:L('Sweet red or bianco vermouth.','甜红或白味美思。','Vermouth rouge doux ou bianco.','Roter süßer oder weißer Wermut.','Vermut rojo dulce o blanco.','스위트 레드 또는 비앙코 베르무트.','スイートレッドまたはビアンコ。','Vermouth rosso dolce o bianco.')},
    sourceName:L('Sweet red or bianco vermouth','甜红或白味美思','Vermouth rouge doux ou bianco','Roter süßer oder weißer Wermut','Vermut rojo dulce o bianco','스위트 레드 또는 비앙코 베르무트','スイートレッドまたはビアンコ・ベルモット','Vermouth rosso dolce o bianco'),
    acceptedIngredientIds:['sweet-red-vermouth','bianco-vermouth'],
  },
  {
    versionId:'old-cuban-iba',rowIndex:5,
    originalRow:{ingredientId:'sparkling-wine',amount:60,unit:'ml',note:L('Brut Champagne or Prosecco.','干型香槟或普罗塞克。','Champagne brut ou Prosecco.','Brut Champagne oder Prosecco.','Champagne brut o Prosecco.','브뤼 샴페인 또는 프로세코.','ブリュット・シャンパンまたはプロセッコ。','Champagne brut o Prosecco.')},
    sourceName:L('Brut Champagne or Prosecco','干型香槟或普罗塞克','Champagne brut ou Prosecco','Brut Champagne oder Prosecco','Champagne brut o Prosecco','브뤼 샴페인 또는 프로세코','ブリュット・シャンパンまたはプロセッコ','Champagne brut o Prosecco'),
    acceptedIngredientIds:['champagne','prosecco'],
  },
  {
    versionId:'black-velvet-diffords-black-velvet',rowIndex:1,
    originalRow:{ingredientId:'sparkling-wine',amount:2.5,unit:'oz',note:L('The source specifies brut Champagne or sparkling wine.','来源指定干型香槟或起泡酒。','La source précise Champagne brut ou vin effervescent.','Die Quelle nennt Brut-Champagner oder Schaumwein.','La fuente especifica champán brut o espumoso.','출처는 브뤼 샴페인 또는 스파클링 와인을 지정합니다.','出典はブリュットのシャンパンまたはスパークリングワインを指定しています。','La fonte specifica Champagne brut o spumante.')},
    sourceName:L('Brut Champagne or sparkling wine','干型香槟或起泡酒','Champagne brut ou vin effervescent','Brut-Champagner oder Schaumwein','Champán brut o espumoso','브뤼 샴페인 또는 스파클링 와인','ブリュットのシャンパンまたはスパークリングワイン','Champagne brut o spumante'),
    acceptedIngredientIds:['champagne','sparkling-wine'],
  },
  {
    versionId:'connaught-martini-bar-k',rowIndex:2,
    originalRow:{ingredientId:'gin',amount:75,unit:'ml',note:L('This stored version selects gin and a lemon twist. The source independently offers gin or vodka as the spirit and a lemon twist or green olive as the garnish.','当前记录选择金酒与柠檬皮卷；来源允许基酒在金酒或伏特加间选择，装饰则独立选择柠檬皮卷或绿橄榄。','Cette version choisit gin et zeste de citron. La source propose séparément gin ou vodka pour le spiritueux, et zeste de citron ou olive verte pour la garniture.','Diese Version wählt Gin und Zitronenzeste. Die Quelle bietet unabhängig Gin oder Wodka als Spirituose sowie Zitronenzeste oder grüne Olive als Garnitur an.','Esta versión elige ginebra y piel de limón. La fuente permite elegir por separado ginebra o vodka como destilado y piel de limón o aceituna verde como guarnición.','현재 기록은 진과 레몬 트위스트를 선택합니다. 출처는 베이스를 진 또는 보드카에서, 장식을 레몬 트위스트 또는 그린 올리브에서 각각 독립적으로 선택하도록 합니다.','この保存版はジンとレモンツイストを選択。出典ではベースをジンまたはウォッカから、ガーニッシュをレモンツイストまたはグリーンオリーブからそれぞれ選べます。','Questa versione sceglie gin e scorza di limone. La fonte consente di scegliere separatamente gin o vodka come distillato e scorza di limone o oliva verde come guarnizione.')},
    sourceName:L('Gin or vodka','金酒或伏特加','Gin ou vodka','Gin oder Wodka','Ginebra o vodka','진 또는 보드카','ジンまたはウォッカ','Gin o vodka'),
    acceptedIngredientIds:['gin','vodka'],
  },
  {
    versionId:'carino-batch-j',rowIndex:1,
    originalRow:{ingredientId:'yellow-chartreuse',amount:5,unit:'ml',brandId:'brand-chartreuse',note:L('The current page allows Yellow Chartreuse or génépy; this recorded version uses Yellow Chartreuse.','当前页面允许黄色查特酒或 génépy；本记录版本采用黄色查特酒。','La page actuelle permet Chartreuse jaune ou génépy ; cette version retient la Chartreuse jaune.','Die aktuelle Seite erlaubt gelbe Chartreuse oder Génépy; diese erfasste Version nutzt gelbe Chartreuse.','La página actual permite Chartreuse amarilla o génépy; esta versión registra Chartreuse amarilla.','현재 페이지는 옐로 샤르트뢰즈 또는 제네피를 허용하며 이 기록 버전은 옐로 샤르트뢰즈를 사용합니다.','現行ページはイエロー・シャルトリューズまたはジェネピを許容。本記録版はイエローを採用。','La pagina attuale consente Chartreuse gialla o génépy; questa versione registra Chartreuse gialla.')},
    sourceName:L('Yellow Chartreuse or génépy','黄色查特酒或 génépy','Chartreuse jaune ou génépy','Gelbe Chartreuse oder Génépy','Chartreuse amarilla o génépy','옐로 샤르트뢰즈 또는 제네피','イエロー・シャルトリューズまたはジェネピ','Chartreuse gialla o génépy'),
    acceptedIngredientIds:['yellow-chartreuse','genepy-liqueur'],
  },
  {
    versionId:'satans-whiskers-batch-m',rowIndex:3,
    originalRow:{ingredientId:'orange-curacao',amount:0.25,unit:'oz',note:L('Grand Marnier or orange curaçao.','Grand Marnier 或橙味库拉索。','Grand Marnier ou curaçao orange.','Grand Marnier oder Orangen-Curaçao.','Grand Marnier o curaçao de naranja.','그랑 마르니에 또는 오렌지 큐라소.','グランマルニエまたはオレンジキュラソー。','Grand Marnier o curaçao all’arancia.')},
    sourceName:L('Grand Marnier or orange curaçao','Grand Marnier 或橙味库拉索','Grand Marnier ou curaçao orange','Grand Marnier oder Orangen-Curaçao','Grand Marnier o curaçao de naranja','그랑 마르니에 또는 오렌지 큐라소','グランマルニエまたはオレンジキュラソー','Grand Marnier o curaçao all’arancia'),
    acceptedIngredientIds:['grand-marnier','orange-curacao'],
  },
];

/** Full row guard: a changed dose, unit, note, optional flag or brand needs another review. */
export function materialRequirementMatchesRow(requirement:RecipeMaterialRequirement,row:RecipeIngredient):boolean {
  const keys = Object.keys(requirement.originalRow) as (keyof RecipeIngredient)[];
  if (keys.length!==Object.keys(row).length) return false;
  return keys.every(key=>{
    if (!Object.hasOwn(row,key)) return false;
    if (key!=='note') return requirement.originalRow[key]===row[key];
    const expected = requirement.originalRow.note;
    const actual = row.note;
    if (!expected || !actual) return expected===actual;
    return Object.keys(expected).length===Object.keys(actual).length && LOCALES.every(locale=>expected[locale]===actual[locale]);
  });
}

export function buildRecipeMaterialRequirements(versions:readonly RecipeVersion[]):RecipeMaterialRequirement[] {
  const byId = new Map(versions.map(version=>[version.id,version]));
  return sourceDisplayRequirements.filter(requirement=>{
    const row = byId.get(requirement.versionId)?.ingredients[requirement.rowIndex];
    return !!row && materialRequirementMatchesRow(requirement,row);
  }).map(requirement=>({...requirement,originalRow:{...requirement.originalRow,...(requirement.originalRow.note?{note:{...requirement.originalRow.note}}:{})},sourceName:{...requirement.sourceName},...(requirement.acceptedIngredientIds?{acceptedIngredientIds:[...requirement.acceptedIngredientIds]}:{})}));
}

/** Runtime guard also protects edited or synthetic catalogues after the index was built. */
export function recipeMaterialRequirement(catalogue:Catalogue,versionId:string,rowIndex:number):RecipeMaterialRequirement|undefined {
  const row = catalogue.versions.find(version=>version.id===versionId)?.ingredients[rowIndex];
  return row && catalogue.materialRequirements?.find(requirement=>requirement.versionId===versionId && requirement.rowIndex===rowIndex && materialRequirementMatchesRow(requirement,row));
}
