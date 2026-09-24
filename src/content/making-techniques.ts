import type {Localized} from '../domain/contracts';

export interface MakingTechniqueSource {title: string; url: string}

export interface MakingTechnique {
  id: string;
  title: Localized;
  body: Localized;
  sources: MakingTechniqueSource[];
  checkedAt: string;
}

const localized = (en: string, zh: string, fr: string, de: string, es: string, ko: string, ja: string, it: string): Localized => ({en, zh, fr, de, es, ko, ja, it});
const techniqueCheckedAt = '2026-09-10';

/**
 * Short, source-linked technique cards. They are optional general guidance;
 * recipe requirements always come from the selected version's own snapshot.
 */
export const makingTechniques: MakingTechnique[] = [
  {
    id: 'shake',
    title: localized('Shake', '摇制', 'Shaker', 'Shaken', 'Agitar', '셰이크', 'シェイク', 'Shaker'),
    body: localized(
      'In the cited IBA examples, ingredients go into a shaker and are shaken with ice before straining. Follow the selected recipe for its exact ice, shaking, and straining instructions.',
      '所列 IBA 示例会将材料放入摇壶，加冰摇制后再过滤。具体冰块、摇制和过滤要求请以所选配方为准。',
      'Dans les exemples IBA cités, les ingrédients sont placés dans un shaker puis secoués avec de la glace avant d’être filtrés. Suivez la recette sélectionnée pour les consignes exactes de glace, de shake et de filtration.',
      'In den genannten IBA-Beispielen kommen die Zutaten in einen Shaker und werden mit Eis geschüttelt, bevor sie abgeseiht werden. Für genaue Angaben zu Eis, Schütteln und Abseihen gilt das ausgewählte Rezept.',
      'En los ejemplos citados de la IBA, los ingredientes se ponen en una coctelera y se agitan con hielo antes de colarlos. Sigue la receta elegida para conocer sus indicaciones exactas sobre hielo, agitado y colado.',
      '인용한 IBA 예시에서는 재료를 셰이커에 넣고 얼음과 함께 흔든 뒤 거릅니다. 얼음, 셰이킹, 거르기에 관한 정확한 지시는 선택한 레시피를 따르세요.',
      '引用したIBAの例では、材料をシェーカーに入れ、氷とともに振ってからこします。氷・シェイク・こし方の正確な指示は、選択したレシピに従ってください。',
      'Negli esempi IBA citati, gli ingredienti vengono messi nello shaker e agitati con ghiaccio prima di essere filtrati. Per ghiaccio, shakerata e filtraggio segui le istruzioni esatte della ricetta selezionata.',
    ),
    sources: [
      {title: 'South Side — IBA', url: 'https://iba-world.com/iba-cocktail/south-side/'},
      {title: 'Last Word — IBA', url: 'https://iba-world.com/iba-cocktail/last-word/'},
    ],
    checkedAt: techniqueCheckedAt,
  },
  {
    id: 'stir',
    title: localized('Stir', '搅拌', 'Remuer', 'Rühren', 'Remover', '스터', 'ステア', 'Mescolare'),
    body: localized(
      'The cited IBA versions place ingredients and ice in a mixing glass, stir, and strain when specified. Keep the selected source attached to the exact vessel, ice, and straining instructions.',
      '所列 IBA 版本会把材料和冰放入调酒杯，搅拌后按来源要求过滤。具体容器、冰块和过滤步骤始终以所选来源为准。',
      'Les versions IBA citées placent les ingrédients et la glace dans un verre à mélange, remuent, puis filtrent lorsque la recette le demande. Gardez la source sélectionnée liée aux consignes exactes de verre, de glace et de filtration.',
      'In den genannten IBA-Versionen werden Zutaten und Eis in ein Rührglas gegeben, gerührt und nach Vorgabe abgeseiht. Für Gefäß, Eis und Abseihen bleiben die genauen Angaben des ausgewählten Quellrezepts maßgeblich.',
      'En las versiones citadas de la IBA, los ingredientes y el hielo se ponen en un vaso mezclador, se remueven y se cuelan cuando se indica. Mantén vinculada la fuente elegida a sus instrucciones exactas sobre vaso, hielo y colado.',
      '인용한 IBA 버전에서는 재료와 얼음을 믹싱 글라스에 넣고 저은 뒤 필요할 때 거릅니다. 사용하는 용기, 얼음, 거르기 지시는 선택한 출처에 연결된 내용을 따르세요.',
      '引用したIBAの版では、材料と氷をミキシンググラスに入れて混ぜ、指定があればこします。容器・氷・こし方は、選択した出典の正確な指示に結び付けてください。',
      'Nelle versioni IBA citate, ingredienti e ghiaccio vengono messi in un mixing glass, mescolati e filtrati quando previsto. Per bicchiere, ghiaccio e filtraggio valgono le istruzioni esatte della fonte selezionata.',
    ),
    sources: [
      {title: 'Manhattan — IBA', url: 'https://iba-world.com/iba-cocktail/manhattan/'},
      {title: 'Cardinale — IBA', url: 'https://iba-world.com/iba-cocktail/cardinale/'},
    ],
    checkedAt: techniqueCheckedAt,
  },
  {
    id: 'build',
    title: localized('Build', '杯中直调', 'Direct au verre', 'Direkt im Glas', 'Montar en vaso', '빌드', 'ビルド', 'Build'),
    body: localized(
      'Build means assembling ingredients directly in the serving glass; the cited IBA examples specify a highball with ice. Follow the selected source for order, ice, and any top-up instruction.',
      '杯中直调是指直接在饮用杯中加入材料；所列 IBA 示例指定在加冰的高球杯中完成。加入顺序、冰块和补满要求请以所选来源为准。',
      'Le build consiste à assembler les ingrédients directement dans le verre de service ; les exemples IBA cités indiquent un highball avec de la glace. Suivez la source sélectionnée pour l’ordre, la glace et tout complément.',
      'Beim Build werden die Zutaten direkt im Servierglas zusammengestellt; die genannten IBA-Beispiele verwenden ein mit Eis gefülltes Highball-Glas. Für Reihenfolge, Eis und eventuelles Auffüllen gilt die ausgewählte Quelle.',
      'Montar significa reunir los ingredientes directamente en el vaso de servicio; los ejemplos citados de la IBA indican un highball con hielo. Sigue la fuente elegida para el orden, el hielo y cualquier indicación de completar.',
      '빌드는 서빙 글라스에 재료를 직접 넣어 완성하는 방식입니다. 인용한 IBA 예시는 얼음을 채운 하이볼 글라스를 지정합니다. 순서, 얼음, 채우기 지시는 선택한 출처를 따르세요.',
      'ビルドは提供するグラスに材料を直接組み立てる方法です。引用したIBAの例では氷を入れたハイボールを指定しています。順番・氷・満たし方は選択した出典に従ってください。',
      'Il build consiste nel comporre gli ingredienti direttamente nel bicchiere di servizio; gli esempi IBA citati indicano un highball con ghiaccio. Per ordine, ghiaccio ed eventuale rabbocco segui la fonte selezionata.',
    ),
    sources: [
      {title: 'Cuba Libre — IBA', url: 'https://iba-world.com/iba-cocktail/cuba-libre/'},
      {title: 'Sex on the Beach — IBA', url: 'https://iba-world.com/iba-cocktail/sex-on-the-beach/'},
    ],
    checkedAt: techniqueCheckedAt,
  },
  {
    id: 'muddle',
    title: localized('Muddle', '捣压', 'Piler', 'Muddeln', 'Macerar', '머들', 'マドル', 'Pestare'),
    body: localized(
      'The cited IBA examples gently muddle ingredients such as lime, sugar, bitters, or ginger before adding the remaining ingredients. Do not infer force or timing; use the selected recipe’s wording.',
      '所列 IBA 示例会先轻柔捣压青柠、糖、苦精或姜等材料，再加入其余材料。力度和时间不能自行推断，请使用所选配方的原文措辞。',
      'Les exemples IBA cités pilent doucement des éléments comme le citron vert, le sucre, les bitters ou le gingembre avant d’ajouter le reste. N’inférez ni la force ni la durée ; suivez le texte de la recette sélectionnée.',
      'In den genannten IBA-Beispielen werden Zutaten wie Limette, Zucker, Bitters oder Ingwer sanft zerdrückt, bevor die übrigen Zutaten dazukommen. Kraft und Dauer dürfen nicht abgeleitet werden; maßgeblich ist der Wortlaut des ausgewählten Rezepts.',
      'En los ejemplos citados de la IBA se machacan suavemente ingredientes como lima, azúcar, bitters o jengibre antes de añadir el resto. No deduzcas la fuerza ni el tiempo; usa las indicaciones de la receta elegida.',
      '인용한 IBA 예시에서는 라임, 설탕, 비터스, 생강 같은 재료를 부드럽게 머들한 뒤 나머지 재료를 넣습니다. 힘과 시간은 추정하지 말고 선택한 레시피의 표현을 따르세요.',
      '引用したIBAの例では、ライム・砂糖・ビターズ・しょうがなどをやさしくつぶしてから残りの材料を加えます。強さや時間を推測せず、選択したレシピの表現に従ってください。',
      'Negli esempi IBA citati si pestano delicatamente ingredienti come lime, zucchero, bitter o zenzero prima di aggiungere il resto. Non dedurre forza o durata: usa le parole della ricetta selezionata.',
    ),
    sources: [
      {title: 'Caipirinha — IBA', url: 'https://iba-world.com/iba-cocktail/caipirinha/'},
      {title: 'Penicillin — IBA', url: 'https://iba-world.com/iba-cocktail/penicillin/'},
    ],
    checkedAt: techniqueCheckedAt,
  },
  {
    id: 'strain',
    title: localized('Strain', '过滤', 'Filtrer', 'Abseihen', 'Colar', '스트레인', 'ストレイン', 'Filtrare'),
    body: localized(
      'Straining separates the mixed drink from ice or solids before serving. The cited IBA examples include both ordinary and double straining, so use the selected recipe’s named strainer and serving vessel.',
      '过滤是在饮用前将酒液与冰块或固体材料分开。所列 IBA 示例既有普通过滤，也有双重过滤，请使用所选配方指定的滤器和饮用杯。',
      'La filtration sépare la boisson mélangée de la glace ou des éléments solides avant le service. Les exemples IBA cités utilisent une filtration simple ou double ; suivez le filtre et le verre indiqués par la recette sélectionnée.',
      'Beim Abseihen wird das gemischte Getränk vor dem Servieren von Eis oder festen Bestandteilen getrennt. Die genannten IBA-Beispiele verwenden einfaches und doppeltes Abseihen; folge dem im ausgewählten Rezept genannten Sieb und Gefäß.',
      'Colar separa la bebida mezclada del hielo o de los sólidos antes de servir. Los ejemplos citados de la IBA incluyen colado simple y doble; usa el colador y el vaso que indique la receta elegida.',
      '스트레인은 제공 전에 혼합된 음료에서 얼음이나 고형물을 분리하는 과정입니다. 인용한 IBA 예시에는 일반 거르기와 더블 스트레인이 모두 있으므로 선택한 레시피가 지정한 도구와 글라스를 사용하세요.',
      'ストレインは、提供前に混ぜた液体から氷や固形物を分けることです。引用したIBAの例には通常のこし方とダブルストレインの両方があるため、選択したレシピ指定の器具とグラスを使ってください。',
      'Filtrare separa la bevanda miscelata dal ghiaccio o dai solidi prima del servizio. Gli esempi IBA citati includono filtraggio semplice e doppio: usa il colino e il bicchiere indicati dalla ricetta selezionata.',
    ),
    sources: [
      {title: 'South Side — IBA', url: 'https://iba-world.com/iba-cocktail/south-side/'},
      {title: 'Cardinale — IBA', url: 'https://iba-world.com/iba-cocktail/cardinale/'},
    ],
    checkedAt: techniqueCheckedAt,
  },
];
