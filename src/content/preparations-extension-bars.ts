import type {Localized} from '../domain/contracts';
import type {RecipePreparation} from '../domain/preparations/types';

const L=(en:string,zh:string,fr:string,de:string,es:string,ko:string,ja:string,it:string):Localized=>({en,zh,fr,de,es,ko,ja,it});
const checkedAt='2026-09-16';

const partialSummary=L(
  'The source publishes part of this preparation, but leaves one or more details unresolved.',
  '来源公开了部分预制信息，但仍有一项或多项细节未说明。',
  'La source publie une partie de la préparation, mais certains détails restent inconnus.',
  'Die Quelle veröffentlicht einen Teil der Vorbereitung, lässt aber Details offen.',
  'La fuente publica parte de la preparación, pero deja algunos detalles sin resolver.',
  '출처가 사전 준비의 일부를 공개하지만 한 가지 이상의 세부 사항은 확인되지 않습니다.',
  '出典は仕込みの一部を公開していますが、未解決の詳細があります。',
  'La fonte pubblica parte della preparazione, ma lascia alcuni dettagli irrisolti.',
);
const unpublishedFormula=L(
  'The cited page does not publish the formula, quantities, method, yield, or storage.',
  '引用页面未公开配方组成、用量、方法、产量或保存方式。',
  'La page citée ne publie ni formule, ni quantités, ni méthode, ni rendement, ni conservation.',
  'Die zitierte Seite nennt weder Rezeptur, Mengen, Methode, Ausbeute noch Lagerung.',
  'La página citada no publica fórmula, cantidades, método, rendimiento ni conservación.',
  '인용 페이지에는 배합, 분량, 제조법, 완성량, 보관법이 공개되지 않았습니다.',
  '引用ページには配合、分量、作り方、出来上がり量、保存方法の記載がありません。',
  'La pagina citata non pubblica formula, quantità, metodo, resa o conservazione.',
);

const connaughtSource={title:'How to make the Connaught Bar Martini — Club Oenologique',url:'https://cluboenologique.com/story/how-to-make-the-connaught-bar-martini/'};
const coupetteSource={title:'Three contemporary autumn cocktail recipes to try now — MR PORTER',url:'https://www.mrporter.com/en-ca/journal/lifestyle/three-contemporary-autumn-cocktail-recipes-to-try-now-568978'};
const jiggerSource={title:'Jigger & Pony Singapore Sling — Imbibe',url:'https://imbibemagazine.com/recipe/jigger-pony-singapore-sling/'};
const maggieSource={title:'Maggie Smith — Death & Co Market',url:'https://www.deathandcompanymarket.com/blogs/recipes/maggie-smith'};

const connaught:RecipePreparation={
  versionId:'connaught-martini-bar-k',status:'partial',summary:partialSummary,
  gaps:[L(
    'The house vermouth blend and the formulas behind the available bitters are not disclosed.',
    '自制味美思调和液及可选苦精的具体配方均未公开。',
    'L’assemblage de vermouths maison et les formules des bitters disponibles ne sont pas publiés.',
    'Die Haus-Wermutmischung und die Rezepturen der verfügbaren Bitters sind nicht veröffentlicht.',
    'No se publican la mezcla de vermuts de la casa ni las fórmulas de los bitters disponibles.',
    '하우스 베르무트 블렌드와 선택 가능한 비터스의 배합은 공개되지 않았습니다.',
    'ハウス・ベルモットブレンドと選択可能なビターズの配合は非公開です。',
    'La miscela di vermouth della casa e le formule dei bitter disponibili non sono pubblicate.',
  )],
  checkedAt,cards:[
    {
      id:'connaught-vermouth-blend',ingredientId:'connaught-vermouth-blend',
      title:L('Connaught vermouth blend','Connaught 味美思调和液','Assemblage de vermouths du Connaught','Connaught-Wermutmischung','Mezcla de vermuts del Connaught','코넛 베르무트 블렌드','コノートのベルモットブレンド','Miscela di vermouth del Connaught'),
      role:'prepared-ingredient',status:'undisclosed',inputs:[],steps:[],gaps:[unpublishedFormula],sources:[connaughtSource],
    },
    {
      id:'connaught-bitters-selection',ingredientId:'connaught-bitters-selection',
      title:L('Connaught bitters selection','Connaught 苦精选择','Sélection de bitters du Connaught','Connaught-Bitters-Auswahl','Selección de bitters del Connaught','코넛 비터스 셀렉션','コノートのビターズセレクション','Selezione di bitter del Connaught'),
      role:'prepared-ingredient',status:'undisclosed',inputs:[],steps:[],gaps:[unpublishedFormula],sources:[connaughtSource],
    },
  ],
};

const coupette:RecipePreparation={
  versionId:'champagne-pina-colada-bar-k',status:'partial',summary:partialSummary,
  gaps:[L(
    'The cordial has a published base ratio but no complete method or exact citric-acid amount; the coconut-sorbet formula and scoop mass are absent.',
    '柯迪尔有公开基础比例，但没有完整方法或柠檬酸确切用量；椰子雪葩配方与单勺质量也未公开。',
    'Le cordial a un ratio de base publié, sans méthode complète ni quantité exacte d’acide citrique ; la formule du sorbet et la masse des boules manquent.',
    'Für das Cordial ist ein Grundverhältnis veröffentlicht, aber keine vollständige Methode oder genaue Zitronensäuremenge; Sorbetrezeptur und Kugelmasse fehlen.',
    'El cordial tiene una proporción base publicada, pero no método completo ni cantidad exacta de ácido cítrico; faltan la fórmula del sorbete y el peso de las bolas.',
    '코디얼의 기본 비율은 공개됐지만 전체 제조법과 정확한 구연산 양은 없으며, 코코넛 소르베 배합과 스쿱 무게도 없습니다.',
    'コーディアルの基本比率は公開されていますが、全工程とクエン酸の正確な量は不明です。ココナッツソルベの配合とスクープ重量もありません。',
    'Il cordial ha un rapporto base pubblicato, ma non un metodo completo né la quantità esatta di acido citrico; mancano formula del sorbetto e peso delle palline.',
  )],
  checkedAt,cards:[
    {
      id:'coupette-pineapple-cordial',ingredientId:'pineapple-cordial',
      title:L('Coupette pineapple cordial','Coupette 菠萝柯迪尔','Cordial d’ananas de Coupette','Coupette-Ananas-Cordial','Cordial de piña de Coupette','쿠페트 파인애플 코디얼','クーペットのパイナップルコーディアル','Cordial all’ananas di Coupette'),
      role:'prepared-ingredient',status:'partial',
      inputs:[
        L('2 parts pineapple juice','菠萝汁 2 份','2 parts de jus d’ananas','2 Teile Ananassaft','2 partes de zumo de piña','파인애플 주스 2파트','パイナップルジュース2','2 parti di succo d’ananas'),
        L('1 part caster sugar','细砂糖 1 份','1 part de sucre semoule','1 Teil feiner Zucker','1 parte de azúcar fino','캐스터 슈거 1파트','上白糖1','1 parte di zucchero semolato'),
        L('Citric acid to taste','柠檬酸，按口味添加','Acide citrique selon le goût','Zitronensäure nach Geschmack','Ácido cítrico al gusto','구연산, 맛에 맞게','クエン酸、味を見て','Acido citrico a gusto'),
      ],
      steps:[],
      gaps:[L(
        'The source gives the ratio and says to add citric acid to taste, but does not state the mixing method, acid quantity, yield, or storage.',
        '来源给出比例并说明柠檬酸按口味添加，但未说明混合方法、酸的用量、产量或保存方式。',
        'La source donne le ratio et l’acide au goût, sans méthode de mélange, quantité d’acide, rendement ni conservation.',
        'Die Quelle nennt Verhältnis und Zitronensäure nach Geschmack, aber keine Mischmethode, Säuremenge, Ausbeute oder Lagerung.',
        'La fuente da la proporción y el ácido al gusto, pero no método de mezcla, cantidad de ácido, rendimiento ni conservación.',
        '출처는 비율과 구연산을 맛에 맞게 넣는다고만 하며 혼합법, 산의 양, 완성량, 보관법은 밝히지 않습니다.',
        '出典は比率とクエン酸を味で調整することだけを示し、混ぜ方、酸の量、出来上がり量、保存方法は不明です。',
        'La fonte indica rapporto e acido a gusto, ma non metodo di miscelazione, quantità di acido, resa o conservazione.',
      )],
      sources:[coupetteSource],
    },
    {
      id:'coupette-coconut-sorbet',ingredientId:'coconut-sorbet',
      title:L('Coupette coconut sorbet','Coupette 椰子雪葩','Sorbet coco de Coupette','Coupette-Kokossorbet','Sorbete de coco de Coupette','쿠페트 코코넛 소르베','クーペットのココナッツソルベ','Sorbetto al cocco di Coupette'),
      role:'prepared-ingredient',status:'undisclosed',inputs:[],steps:[],gaps:[L(
        'The source calls for two small scoops but gives no formula, scoop mass, method, yield, or storage.',
        '来源要求两小勺，但未说明配方、单勺质量、方法、产量或保存方式。',
        'La source demande deux petites boules, sans formule, masse, méthode, rendement ni conservation.',
        'Die Quelle verlangt zwei kleine Kugeln, nennt aber keine Rezeptur, Masse, Methode, Ausbeute oder Lagerung.',
        'La fuente pide dos bolas pequeñas, sin fórmula, peso, método, rendimiento ni conservación.',
        '출처는 작은 스쿱 2개를 요구하지만 배합, 스쿱 무게, 제조법, 완성량, 보관법은 없습니다.',
        '出典は小さなスクープ2杯とするだけで、配合、重量、作り方、出来上がり量、保存方法は不明です。',
        'La fonte richiede due piccole palline, senza formula, peso, metodo, resa o conservazione.',
      )],sources:[coupetteSource],
    },
  ],
};

const jigger:RecipePreparation={
  versionId:'singapore-sling-jigger-pony-bar-k',status:'partial',summary:partialSummary,
  gaps:[L(
    'The pineapple mass is approximate, and the source does not say whether the rhubarb juice and sugar are equal by weight or volume.',
    '菠萝用量为近似值，且来源未说明大黄汁与糖的等量关系按质量还是体积计算。',
    'La masse d’ananas est approximative, et la source ne précise pas si rhubarbe et sucre sont égaux en poids ou en volume.',
    'Die Ananasmenge ist ungefähr, und die Quelle sagt nicht, ob Rhabarbersaft und Zucker nach Gewicht oder Volumen gleich sind.',
    'La cantidad de piña es aproximada, y la fuente no indica si ruibarbo y azúcar se igualan por peso o volumen.',
    '파인애플 양은 근사치이며 루바브 주스와 설탕의 동량 기준이 중량인지 부피인지 출처에 없습니다.',
    'パイナップル量は概算で、ルバーブ果汁と砂糖を重量と容量のどちらで同量にするかは不明です。',
    'La quantità di ananas è approssimativa e la fonte non dice se succo di rabarbaro e zucchero siano uguali per peso o volume.',
  )],
  checkedAt,cards:[
    {
      id:'jigger-pineapple-lapsang-gin',ingredientId:'pineapple-lapsang-infused-gin',
      title:L('Pineapple and Lapsang Souchong-infused gin','菠萝正山小种浸泡金酒','Gin infusé à l’ananas et au Lapsang Souchong','Gin mit Ananas und Lapsang Souchong','Ginebra infusionada con piña y Lapsang Souchong','파인애플·랍상 수숑 인퓨즈드 진','パイナップルとラプサンスーチョンのインフューズドジン','Gin infuso con ananas e Lapsang Souchong'),
      role:'prepared-ingredient',status:'partial',
      inputs:[
        L('1 pineapple, peeled and chopped, about 3 cups','菠萝 1 个，去皮切块，约 3 杯','1 ananas pelé et coupé, environ 3 tasses','1 Ananas, geschält und gehackt, etwa 3 Tassen','1 piña pelada y troceada, unas 3 tazas','껍질 벗겨 자른 파인애플 1개, 약 3컵','皮をむいて刻んだパイナップル1個、約3カップ','1 ananas pelato e tagliato, circa 3 tazze'),
        L('0.75 g Lapsang Souchong tea','正山小种茶 0.75 克','0,75 g de thé Lapsang Souchong','0,75 g Lapsang-Souchong-Tee','0,75 g de té Lapsang Souchong','랍상 수숑 차 0.75g','ラプサンスーチョン茶0.75g','0,75 g di tè Lapsang Souchong'),
        L('1 × 750 ml bottle London dry gin','伦敦干金酒 750 毫升 1 瓶','1 bouteille de 750 ml de London dry gin','1 Flasche London Dry Gin à 750 ml','1 botella de 750 ml de London dry gin','런던 드라이 진 750ml 1병','ロンドンドライジン750ml 1本','1 bottiglia da 750 ml di London dry gin'),
      ],
      steps:[
        L('Combine the pineapple, tea, and gin in a sealed container.','将菠萝、茶与金酒放入密封容器。','Réunir ananas, thé et gin dans un récipient fermé.','Ananas, Tee und Gin in einem verschlossenen Behälter verbinden.','Combina piña, té y ginebra en un recipiente cerrado.','파인애플, 차, 진을 밀폐 용기에 넣습니다.','パイナップル、茶、ジンを密閉容器に入れる。','Unire ananas, tè e gin in un contenitore sigillato.'),
        L('Refrigerate for 24 hours.','冷藏 24 小时。','Réfrigérer 24 heures.','24 Stunden kühlen.','Refrigera 24 horas.','24시간 냉장합니다.','24時間冷蔵する。','Refrigerare per 24 ore.'),
        L('Strain, bottle, refrigerate, and use within 2 weeks.','过滤、装瓶、冷藏，并在 2 周内使用。','Filtrer, embouteiller, réfrigérer et utiliser sous 2 semaines.','Abseihen, abfüllen, kühlen und innerhalb von 2 Wochen verwenden.','Cuela, embotella, refrigera y usa en 2 semanas.','거르고 병에 담아 냉장하며 2주 안에 사용합니다.','濾して瓶詰めし、冷蔵して2週間以内に使う。','Filtrare, imbottigliare, refrigerare e usare entro 2 settimane.'),
      ],
      equipment:L('Sealed container, refrigerator, strainer, and bottle','密封容器、冰箱、滤具与瓶子','Récipient fermé, réfrigérateur, filtre et bouteille','Verschlossener Behälter, Kühlschrank, Sieb und Flasche','Recipiente cerrado, nevera, colador y botella','밀폐 용기, 냉장고, 거름망, 병','密閉容器、冷蔵庫、濾し器、瓶','Contenitore sigillato, frigorifero, filtro e bottiglia'),
      timing:L('24-hour refrigerated infusion; use within 2 weeks','冷藏浸泡 24 小时；2 周内使用','Infusion au froid 24 heures ; utiliser sous 2 semaines','24 Stunden gekühlt ziehen; innerhalb von 2 Wochen verwenden','Infusión refrigerada de 24 horas; usar en 2 semanas','24시간 냉장 인퓨징, 2주 내 사용','冷蔵で24時間抽出、2週間以内に使用','Infusione refrigerata di 24 ore; usare entro 2 settimane'),
      gaps:[L(
        'The pineapple is described as one fruit or about 3 cups; exact prepared mass and final yield are not stated.',
        '菠萝以 1 个或约 3 杯描述；未说明处理后的确切质量与最终产量。',
        'L’ananas est donné comme un fruit ou environ 3 tasses ; masse préparée exacte et rendement final non indiqués.',
        'Die Ananas wird als eine Frucht oder etwa 3 Tassen angegeben; genaue vorbereitete Masse und Endausbeute fehlen.',
        'La piña se describe como una fruta o unas 3 tazas; no se indican masa preparada exacta ni rendimiento final.',
        '파인애플은 1개 또는 약 3컵으로만 설명되며 손질 후 정확한 중량과 최종 완성량은 없습니다.',
        'パイナップルは1個または約3カップとのみ記載され、下処理後の正確な重量と最終量は不明です。',
        'L’ananas è descritto come un frutto o circa 3 tazze; massa preparata esatta e resa finale non indicate.',
      )],
      sources:[jiggerSource],
    },
    {
      id:'jigger-rhubarb-puree',ingredientId:'rhubarb-puree',
      title:L('Sweetened rhubarb purée','加糖大黄泥','Purée de rhubarbe sucrée','Gesüßtes Rhabarberpüree','Puré de ruibarbo endulzado','가당 루바브 퓌레','加糖ルバーブピューレ','Purea di rabarbaro zuccherata'),
      role:'prepared-ingredient',status:'partial',
      inputs:[
        L('About 2 lb rhubarb, washed and chopped','大黄约 2 磅，洗净切块','Environ 2 lb de rhubarbe, lavée et coupée','Etwa 2 lb Rhabarber, gewaschen und gehackt','Unas 2 lb de ruibarbo, lavado y troceado','씻어 자른 루바브 약 2lb','洗って刻んだルバーブ約2lb','Circa 2 lb di rabarbaro, lavato e tagliato'),
        L('White sugar equal to the extracted rhubarb juice','与所得大黄汁等量的白糖','Sucre blanc en quantité égale au jus extrait','Weißer Zucker in gleicher Menge wie der gewonnene Rhabarbersaft','Azúcar blanco en cantidad igual al zumo extraído','추출한 루바브 주스와 동량의 백설탕','抽出したルバーブ果汁と同量の白砂糖','Zucchero bianco pari al succo di rabarbaro estratto'),
      ],
      steps:[
        L('Bake the rhubarb at 150°F, or the oven’s lowest setting, for about 1 hour until tender.','大黄以 150°F（约 66°C）或烤箱最低温烤约 1 小时，至软。','Cuire la rhubarbe à 150°F, ou au minimum du four, environ 1 heure jusqu’à tendreté.','Rhabarber bei 150°F oder niedrigster Ofenstufe etwa 1 Stunde weich backen.','Hornea el ruibarbo a 150°F, o al mínimo del horno, cerca de 1 hora hasta que esté tierno.','루바브를 150°F 또는 오븐 최저 온도에서 약 1시간 부드러워질 때까지 굽습니다.','ルバーブを150°Fまたはオーブン最低温度で約1時間、柔らかくなるまで焼く。','Cuocere il rabarbaro a 150°F, o al minimo del forno, per circa 1 ora finché tenero.'),
        L('Juice it, or blend and strain through cheesecloth, to obtain about 7 oz of liquid.','榨汁，或搅打后用纱布过滤，得到约 7 盎司液体。','Extraire le jus, ou mixer puis filtrer sur étamine, pour obtenir environ 7 oz de liquide.','Entsaften oder mixen und durch Käsetuch filtern, um etwa 7 oz Flüssigkeit zu erhalten.','Extrae el zumo, o licua y cuela por gasa, para obtener unas 7 oz de líquido.','주스를 내거나 블렌딩 후 면포로 걸러 약 7oz 액체를 얻습니다.','搾汁するか、ブレンドしてチーズクロスで濾し、約7ozの液体を得る。','Estrarre il succo, oppure frullare e filtrare con garza, per ottenere circa 7 oz di liquido.'),
        L('Heat the juice with an equal amount of white sugar over medium heat until dissolved; cool, bottle, refrigerate, and use within 1 week.','大黄汁与等量白糖以中火加热至溶解；冷却、装瓶、冷藏，并在 1 周内使用。','Chauffer le jus avec autant de sucre blanc à feu moyen jusqu’à dissolution ; refroidir, embouteiller, réfrigérer et utiliser sous 1 semaine.','Saft mit gleicher Menge weißem Zucker bei mittlerer Hitze auflösen; kühlen, abfüllen und innerhalb 1 Woche verwenden.','Calienta el zumo con igual cantidad de azúcar blanco a fuego medio hasta disolver; enfría, embotella, refrigera y usa en 1 semana.','주스와 동량의 백설탕을 중불에서 녹을 때까지 가열한 뒤 식혀 병에 담고 냉장해 1주 내 사용합니다.','果汁と同量の白砂糖を中火で溶かし、冷まして瓶詰めし、冷蔵して1週間以内に使う。','Scaldare il succo con pari quantità di zucchero bianco a fuoco medio fino a scioglimento; raffreddare, imbottigliare, refrigerare e usare entro 1 settimana.'),
      ],
      timing:L('About 1 hour baking; use the finished purée within 1 week','约烤 1 小时；成品 1 周内使用','Environ 1 heure de cuisson ; utiliser sous 1 semaine','Etwa 1 Stunde backen; innerhalb 1 Woche verwenden','Cerca de 1 hora de horno; usar en 1 semana','약 1시간 굽고 완성품은 1주 내 사용','約1時間加熱、完成品は1週間以内に使用','Circa 1 ora di cottura; usare entro 1 settimana'),
      temperature:L('150°F (about 66°C), or the oven’s lowest setting','150°F（约 66°C）或烤箱最低温','150°F (environ 66°C), ou minimum du four','150°F (etwa 66°C) oder niedrigste Ofenstufe','150°F (unos 66°C), o mínimo del horno','150°F(약 66°C) 또는 오븐 최저 온도','150°F（約66°C）またはオーブン最低温度','150°F (circa 66°C), o minimo del forno'),
      gaps:[L(
        'The source does not say whether equal rhubarb juice and sugar are measured by weight or volume; final yield is not stated.',
        '来源未说明大黄汁与糖的等量关系按质量还是体积；也未说明最终产量。',
        'La source ne précise pas si jus et sucre sont égaux en poids ou en volume ; rendement final non indiqué.',
        'Die Quelle sagt nicht, ob Saft und Zucker nach Gewicht oder Volumen gleich sind; Endausbeute fehlt.',
        'La fuente no indica si zumo y azúcar se igualan por peso o volumen; no se da rendimiento final.',
        '루바브 주스와 설탕의 동량 기준이 중량인지 부피인지, 최종 완성량이 얼마인지는 공개되지 않았습니다.',
        '果汁と砂糖を重量と容量のどちらで同量にするか、最終量は不明です。',
        'La fonte non dice se succo e zucchero siano uguali per peso o volume; resa finale non indicata.',
      )],
      sources:[jiggerSource],
    },
  ],
};

const maggie:RecipePreparation={
  versionId:'maggie-smith-bar-k',status:'partial',summary:partialSummary,
  gaps:[L(
    'The honey syrup has a published ratio but no mass-versus-volume convention or exact water temperature; the orgeat formula is not published.',
    '蜂蜜糖浆有公开比例，但未说明质量／体积口径或确切水温；杏仁糖浆配方未公开。',
    'Le sirop de miel a un ratio publié, sans convention poids-volume ni température exacte de l’eau ; la formule de l’orgeat n’est pas publiée.',
    'Der Honigsirup hat ein veröffentlichtes Verhältnis, aber keine Gewichts-/Volumenkonvention oder genaue Wassertemperatur; die Orgeatrezeptur fehlt.',
    'El sirope de miel tiene proporción publicada, pero no convención de peso o volumen ni temperatura exacta; la fórmula del orgeat no se publica.',
    '허니 시럽의 비율은 공개됐지만 중량·부피 기준과 정확한 물 온도는 없으며 오르제 배합은 공개되지 않았습니다.',
    'ハニーシロップの比率は公開されていますが、重量・容量の基準と正確な湯温は不明で、オルジェの配合は非公開です。',
    'Lo sciroppo di miele ha un rapporto pubblicato, senza convenzione peso-volume né temperatura esatta; la formula dell’orzata non è pubblicata.',
  )],
  checkedAt,cards:[
    {
      id:'maggie-wildflower-honey-syrup',ingredientId:'honey-syrup',
      title:L('Wildflower honey syrup','野花蜂蜜糖浆','Sirop de miel de fleurs','Wildblütenhonigsirup','Sirope de miel de flores','야생화 허니 시럽','ワイルドフラワーハニーシロップ','Sciroppo di miele millefiori'),
      role:'prepared-ingredient',status:'partial',
      inputs:[
        L('2 parts wildflower honey','野花蜂蜜 2 份','2 parts de miel de fleurs','2 Teile Wildblütenhonig','2 partes de miel de flores','야생화 꿀 2파트','ワイルドフラワーハニー2','2 parti di miele millefiori'),
        L('1 part hot water','热水 1 份','1 part d’eau chaude','1 Teil heißes Wasser','1 parte de agua caliente','뜨거운 물 1파트','熱湯1','1 parte di acqua calda'),
      ],
      steps:[
        L('Whisk the honey and hot water until blended.','将蜂蜜与热水搅打至均匀。','Fouetter miel et eau chaude jusqu’à homogénéité.','Honig und heißes Wasser glatt verrühren.','Bate la miel y el agua caliente hasta integrar.','꿀과 뜨거운 물을 고르게 섞일 때까지 휘젓습니다.','蜂蜜と熱湯を均一になるまで混ぜる。','Sbattere miele e acqua calda fino a uniformità.'),
        L('Transfer to a container, refrigerate, and use within 2 weeks.','装入容器，冷藏，并在 2 周内使用。','Transférer dans un récipient, réfrigérer et utiliser sous 2 semaines.','In einen Behälter füllen, kühlen und innerhalb von 2 Wochen verwenden.','Pasa a un recipiente, refrigera y usa en 2 semanas.','용기에 옮겨 냉장하고 2주 내 사용합니다.','容器に移し、冷蔵して2週間以内に使う。','Trasferire in un contenitore, refrigerare e usare entro 2 settimane.'),
      ],
      timing:L('Use within 2 weeks under refrigeration','冷藏并在 2 周内使用','Utiliser sous 2 semaines au réfrigérateur','Gekühlt innerhalb von 2 Wochen verwenden','Usar refrigerado en 2 semanas','냉장해 2주 내 사용','冷蔵で2週間以内に使用','Usare refrigerato entro 2 settimane'),
      gaps:[L(
        'The source does not say whether the two-to-one ratio is by weight or volume, or give the water temperature or final yield.',
        '来源未说明 2:1 比例按质量还是体积，也未给水温或最终产量。',
        'La source ne précise pas si le ratio deux pour un est en poids ou en volume, ni la température de l’eau ou le rendement.',
        'Die Quelle sagt nicht, ob das Verhältnis zwei zu eins nach Gewicht oder Volumen gilt, und nennt weder Wassertemperatur noch Ausbeute.',
        'La fuente no indica si la proporción dos a uno es por peso o volumen, ni la temperatura del agua o el rendimiento.',
        '2:1 비율이 중량인지 부피인지, 물 온도와 최종 완성량이 얼마인지는 출처에 없습니다.',
        '2対1が重量比か容量比か、湯温と最終量は不明です。',
        'La fonte non dice se il rapporto due a uno sia per peso o volume, né temperatura dell’acqua o resa.',
      )],
      sources:[maggieSource],
    },
    {
      id:'maggie-orgeat',ingredientId:'orgeat',
      title:L('Maggie Smith orgeat','Maggie Smith 杏仁糖浆','Orgeat du Maggie Smith','Orgeat für Maggie Smith','Orgeat del Maggie Smith','Maggie Smith 오르제','Maggie Smithのオルジェ','Orzata del Maggie Smith'),
      role:'prepared-ingredient',status:'undisclosed',inputs:[],steps:[],gaps:[unpublishedFormula],sources:[maggieSource],
    },
  ],
};

export const barExtensionPreparations:RecipePreparation[]=[connaught,coupette,jigger,maggie];
export default barExtensionPreparations;
