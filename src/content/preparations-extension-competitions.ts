import {L} from './expansion/localized';
import type {RecipePreparation} from '../domain/preparations/types';

const checkedAt = '2026-09-16';

const diffordClarita = {title:'Clarita — Difford’s Guide current published recipe',url:'https://www.diffordsguide.com/cocktails/recipe/4158/clarita'};
const diffordCarino = {title:'Cariño — Difford’s Guide current published recipe',url:'https://www.diffordsguide.com/cocktails/recipe/4420/carino'};
const cocktailLovers = {title:'The class of Bacardí Legacy 2019 — The Cocktail Lovers',url:'https://thecocktaillovers.com/the-class-of-bacardi-legacy-2019/'};

export const competitionExtensionPreparations: RecipePreparation[] = [
  {
    versionId:'clarita-batch-j',status:'partial',checkedAt,
    summary:L(
      'The source discloses the 20% saline formula, but does not publish a preparation method, yield beyond the listed formula, or storage guidance.',
      '来源公开了 20% 盐水配方，但未公开制作步骤、配方之外的产量或保存说明。',
      'La source publie la formule saline à 20 %, mais pas de méthode, de rendement au-delà de la formule ni de conservation.',
      'Die Quelle veröffentlicht die 20%ige Salzlösung, jedoch keine Herstellung, zusätzliche Ausbeute oder Lagerhinweise.',
      'La fuente publica la fórmula salina al 20 %, pero no el método, el rendimiento más allá de la fórmula ni su conservación.',
      '출처는 20% 식염수 배합을 공개하지만 제조법, 배합 외 수율, 보관 지침은 공개하지 않습니다.',
      '出典は20%食塩水の配合を公開していますが、作り方、配合以上の出来上がり量、保存方法は未記載です。',
      'La fonte pubblica la formula salina al 20%, ma non metodo, resa oltre la formula o conservazione.',
    ),
    gaps:[L('Mixing method and storage guidance are not disclosed.','混合方法与保存说明未公开。','Méthode de mélange et conservation non publiées.','Mischmethode und Lagerung sind nicht veröffentlicht.','No se publican método de mezcla ni conservación.','혼합 방법과 보관 지침은 공개되지 않았습니다.','混合方法と保存方法は未記載です。','Metodo di miscelazione e conservazione non pubblicati.')],
    cards:[{
      id:'clarita-20-percent-saline',ingredientId:'saline-solution',title:L('20% saline solution','20% 盐水溶液','Solution saline à 20 %','20%ige Salzlösung','Solución salina al 20 %','20% 식염수','20%食塩水','Soluzione salina al 20%'),role:'prepared-ingredient',status:'partial',
      inputs:[L('20 g sea salt','海盐 20 克','20 g de sel marin','20 g Meersalz','20 g de sal marina','바다 소금 20g','海塩20g','20 g di sale marino'),L('80 g water','水 80 克','80 g d’eau','80 g Wasser','80 g de agua','물 80g','水80g','80 g d’acqua')],
      steps:[],gaps:[L('The source gives the ratio but no mixing, yield, or storage instructions.','来源给出比例，但没有混合、产量或保存说明。','La source donne le ratio sans méthode, rendement ni conservation.','Die Quelle nennt das Verhältnis, aber keine Mischung, Ausbeute oder Lagerung.','La fuente da la proporción, pero no mezcla, rendimiento ni conservación.','출처는 비율만 제시하며 혼합, 수율, 보관법은 없습니다.','出典は比率のみで、混合、出来上がり量、保存方法は未記載です。','La fonte dà il rapporto ma non metodo, resa o conservazione.')],sources:[diffordClarita],
    }],
  },
  {
    versionId:'carino-batch-j',status:'partial',checkedAt,
    summary:L(
      'The source discloses Eric van Beek’s vanilla-syrup formula and heating method; yield and storage guidance remain unpublished.',
      '来源公开了 Eric van Beek 的香草糖浆配方与加热方法；产量和保存说明仍未公开。',
      'La source publie la formule et la chauffe du sirop de vanille d’Eric van Beek ; rendement et conservation restent non publiés.',
      'Die Quelle veröffentlicht Eric van Beeks Vanillesirup-Rezeptur und Erhitzung; Ausbeute und Lagerung fehlen.',
      'La fuente publica la fórmula y el calentamiento del sirope de vainilla de Eric van Beek; faltan rendimiento y conservación.',
      '출처는 에릭 판 베이크의 바닐라 시럽 배합과 가열법을 공개하며 수율과 보관 지침은 미공개입니다.',
      '出典はEric van Beekのバニラシロップ配合と加熱法を公開。出来上がり量と保存方法は未記載です。',
      'La fonte pubblica formula e riscaldamento dello sciroppo alla vaniglia di Eric van Beek; resa e conservazione restano inedite.',
    ),
    gaps:[L('Finished yield and storage guidance are not disclosed.','成品产量与保存说明未公开。','Rendement final et conservation non publiés.','Fertige Ausbeute und Lagerung sind nicht veröffentlicht.','No se publican rendimiento final ni conservación.','완성 수율과 보관 지침은 공개되지 않았습니다.','出来上がり量と保存方法は未記載です。','Resa finale e conservazione non pubblicate.')],
    cards:[{
      id:'carino-vanilla-syrup',ingredientId:'vanilla-syrup',title:L('Eric van Beek’s vanilla syrup','Eric van Beek 香草糖浆','Sirop de vanille d’Eric van Beek','Eric van Beeks Vanillesirup','Sirope de vainilla de Eric van Beek','에릭 판 베이크의 바닐라 시럽','Eric van Beekのバニラシロップ','Sciroppo alla vaniglia di Eric van Beek'),role:'prepared-ingredient',status:'partial',
      inputs:[L('1 kg caster sugar','细砂糖 1 千克','1 kg de sucre semoule','1 kg feiner Zucker','1 kg de azúcar fino','캐스터 슈거 1kg','上白糖1kg','1 kg di zucchero semolato'),L('500 g water','水 500 克','500 g d’eau','500 g Wasser','500 g de agua','물 500g','水500g','500 g d’acqua'),L('2 vanilla pods, split open','香草荚 2 根，剖开','2 gousses de vanille fendues','2 Vanilleschoten, aufgeschnitten','2 vainas de vainilla abiertas','바닐라 빈 2개, 갈라 열기','バニラ2本、切り開く','2 baccelli di vaniglia, aperti')],
      steps:[L('Vacuum-seal all ingredients in a bag.','所有材料装袋真空密封。','Mettre tous les ingrédients sous vide dans un sac.','Alle Zutaten in einem Beutel vakuumieren.','Sella al vacío todos los ingredientes en una bolsa.','모든 재료를 봉투에 넣어 진공 밀봉합니다.','全材料を袋に入れて真空包装する。','Sigillare sottovuoto tutti gli ingredienti in un sacchetto.'),L('Hold sous vide at 65 °C until the sugar dissolves.','以 65°C 低温加热，直至糖溶解。','Cuire sous vide à 65 °C jusqu’à dissolution du sucre.','Bei 65 °C sous vide halten, bis sich der Zucker löst.','Mantén al vacío a 65 °C hasta que se disuelva el azúcar.','설탕이 녹을 때까지 65°C 수비드로 유지합니다.','砂糖が溶けるまで65℃で湯煎する。','Tenere sottovuoto a 65 °C finché lo zucchero si scioglie.')],
      gaps:[L('Finished yield and storage guidance are not disclosed.','成品产量与保存说明未公开。','Rendement final et conservation non publiés.','Fertige Ausbeute und Lagerung sind nicht veröffentlicht.','No se publican rendimiento final ni conservación.','완성 수율과 보관 지침은 공개되지 않았습니다.','出来上がり量と保存方法は未記載です。','Resa finale e conservazione non pubblicate.')],sources:[diffordCarino],
    }],
  },
  {
    versionId:'pink-me-up-batch-j',status:'partial',checkedAt,
    summary:L(
      'The interview names orgeat syrup but does not disclose the formula or preparation needed to reproduce that component exactly.',
      '访谈列出杏仁糖浆，但未公开精确复现该材料所需的配方或制作方法。',
      'L’entretien nomme l’orgeat sans publier la formule ou la préparation nécessaire pour le reproduire exactement.',
      'Das Interview nennt Orgeat, veröffentlicht aber keine Rezeptur oder Herstellung für eine exakte Reproduktion.',
      'La entrevista nombra el orgeat, pero no publica la fórmula ni la preparación para reproducirlo exactamente.',
      '인터뷰는 오르자를 명시하지만 이를 정확히 재현할 배합이나 제조법은 공개하지 않습니다.',
      'インタビューはオルジェを記載しますが、正確に再現するための配合と製法は未公開です。',
      'L’intervista indica l’orzata ma non pubblica formula o preparazione per riprodurla esattamente.',
    ),
    gaps:[L('Orgeat formula, method, yield, and storage are not disclosed.','杏仁糖浆的配方、方法、产量与保存方式未公开。','Formule, méthode, rendement et conservation de l’orgeat non publiés.','Orgeat-Rezeptur, Methode, Ausbeute und Lagerung sind nicht veröffentlicht.','No se publican fórmula, método, rendimiento ni conservación del orgeat.','오르자 배합, 제조법, 수율, 보관법은 공개되지 않았습니다.','オルジェの配合、製法、出来上がり量、保存方法は未記載です。','Formula, metodo, resa e conservazione dell’orzata non pubblicati.')],
    cards:[{
      id:'pink-me-up-orgeat',ingredientId:'orgeat',title:L('Orgeat syrup','杏仁糖浆','Sirop d’orgeat','Orgeat-Sirup','Sirope de orgeat','오르자 시럽','オルジェシロップ','Sciroppo d’orzata'),role:'prepared-ingredient',status:'undisclosed',inputs:[],steps:[],
      gaps:[L('The source names the syrup only; formula, quantities, method, yield, and storage are not disclosed.','来源仅列出糖浆名称；配方、用量、方法、产量与保存均未公开。','La source ne donne que le nom ; formule, quantités, méthode, rendement et conservation ne sont pas publiés.','Die Quelle nennt nur den Sirup; Rezeptur, Mengen, Methode, Ausbeute und Lagerung fehlen.','La fuente solo nombra el sirope; no publica fórmula, cantidades, método, rendimiento ni conservación.','출처는 시럽 이름만 밝히며 배합, 분량, 제조법, 수율, 보관법은 공개하지 않습니다.','出典は名称のみ。配合、分量、製法、出来上がり量、保存方法は未記載です。','La fonte nomina soltanto lo sciroppo; formula, quantità, metodo, resa e conservazione non sono pubblicati.')],sources:[cocktailLovers],
    }],
  },
];

export default competitionExtensionPreparations;
