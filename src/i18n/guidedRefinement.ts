import type {Locale} from '../domain/contracts';

const copy = {
  stepAromas: ['Aromas', '香气', 'Arômes', 'Aromen', 'Aromas', '향', '香り', 'Aromi'],
  stepPalate: ['Palate', '口感', 'Palais', 'Gaumen', 'Paladar', '맛', '味わい', 'Palato'],
  stepStrength: ['Strength', '酒感', 'Intensité', 'Stärke', 'Intensidad', '도수', '強さ', 'Intensità'],
  stepFirstSip: ['First sip', '第一口', 'Première gorgée', 'Erster Schluck', 'Primer sorbo', '첫 모금', '最初の一口', 'Primo sorso'],
  citrusExample: ['Lemon peel · grapefruit', '柠檬皮 · 葡萄柚', 'Zeste de citron · pamplemousse', 'Zitronenschale · Grapefruit', 'Piel de limón · pomelo', '레몬 껍질 · 자몽', 'レモンピール · グレープフルーツ', 'Scorza di limone · pompelmo'],
  fruitExample: ['Berries · ripe peach', '莓果 · 熟桃', 'Baies · pêche mûre', 'Beeren · reifer Pfirsich', 'Bayas · melocotón maduro', '베리 · 잘 익은 복숭아', 'ベリー · 熟した桃', 'Frutti di bosco · pesca matura'],
  floralExample: ['Orange blossom · violet', '橙花 · 紫罗兰', 'Fleur d’oranger · violette', 'Orangenblüte · Veilchen', 'Azahar · violeta', '오렌지꽃 · 제비꽃', 'オレンジブロッサム · すみれ', 'Fiori d’arancio · violetta'],
  herbalExample: ['Mint · garden herbs', '薄荷 · 花园香草', 'Menthe · herbes du jardin', 'Minze · Gartenkräuter', 'Menta · hierbas frescas', '민트 · 신선한 허브', 'ミント · 庭のハーブ', 'Menta · erbe fresche'],
  spiceExample: ['Ginger · warm baking spice', '姜 · 温暖烘焙香料', 'Gingembre · épices chaudes', 'Ingwer · warme Gewürze', 'Jengibre · especias cálidas', '생강 · 따뜻한 향신료', '生姜 · 温かなスパイス', 'Zenzero · spezie calde'],
  coffeeExample: ['Roasted coffee · cocoa', '烘焙咖啡 · 可可', 'Café torréfié · cacao', 'Röstkaffee · Kakao', 'Café tostado · cacao', '로스팅 커피 · 코코아', '深煎りコーヒー · カカオ', 'Caffè tostato · cacao'],
  sourExample: ['Bright and mouth-watering', '明亮酸爽、生津', 'Vif et salivant', 'Lebhaft und animierend', 'Vivo y jugoso', '산뜻하고 입맛 도는 느낌', '鮮やかで唾液を誘う味', 'Vivace e succoso'],
  sweetExample: ['Soft, ripe sweetness', '柔和成熟的甜味', 'Une douceur souple et mûre', 'Weiche, reife Süße', 'Dulzor suave y maduro', '부드럽고 잘 익은 단맛', 'やわらかく熟した甘み', 'Dolcezza morbida e matura'],
  bitterExample: ['A clean, grown-up edge', '干净利落的微苦', 'Une amertume nette', 'Eine klare, herbe Kante', 'Un amargor limpio', '깔끔하고 성숙한 쌉쌀함', 'すっきり大人びた苦味', 'Un amaro netto e adulto'],
  dryExample: ['Crisp, with little sweetness', '清爽，甜度很低', 'Vif, peu sucré', 'Knackig, kaum süß', 'Seco, con poco dulzor', '깔끔하고 단맛은 적게', 'きりっと、甘さ控えめ', 'Nitido, poco dolce'],
  creamyExample: ['Silky and rounded', '丝滑圆润', 'Soyeux et rond', 'Seidig und rund', 'Sedoso y redondo', '실키하고 둥근 질감', 'なめらかで丸い口当たり', 'Setoso e rotondo'],
  refreshingExample: ['Cool, long and easy', '清凉、轻快、耐饮', 'Frais, léger et désaltérant', 'Kühl, lang und leicht', 'Fresco, largo y ligero', '시원하고 길게 이어지는 산뜻함', '涼やかで軽く、長く楽しめる', 'Fresco, lungo e leggero'],
  preferenceProfile: ['Your preference trail', '你的偏好轨迹', 'Votre fil de préférences', 'Deine Geschmacksspur', 'Tu perfil de preferencias', '나의 취향 흐름', '好みの軌跡', 'Il tuo percorso di gusto'],
  selected: ['selected', '已选', 'sélectionné', 'gewählt', 'seleccionado', '선택됨', '選択中', 'selezionato'],
  reviewStep: ['Review this step', '返回修改此步骤', 'Revoir cette étape', 'Diesen Schritt prüfen', 'Revisar este paso', '이 단계 다시 보기', 'このステップを見直す', 'Rivedi questo passaggio'],
  matchesThese: ['Why it fits', '匹配之处', 'Pourquoi il convient', 'Warum er passt', 'Por qué encaja', '잘 맞는 이유', '合うポイント', 'Perché funziona'],
  keepsOut: ['Leaves out', '已避开', 'Sans', 'Ohne', 'Sin', '제외됨', '除外', 'Senza'],
  openMatch: ['A flexible match for the preferences you left open.', '你保留了开放选择，这杯也因此更灵活。', 'Un accord souple pour les préférences laissées ouvertes.', 'Eine flexible Empfehlung für deine offenen Wünsche.', 'Una opción flexible para lo que dejaste abierto.', '열어 둔 취향에 유연하게 맞는 한 잔입니다.', '指定しなかった好みにも柔軟に寄り添う一杯です。', 'Un abbinamento flessibile per le preferenze lasciate aperte.'],
  resultIntro: ['Match tags refer to the selected recipe version.', '匹配标签基于当前选中的配方版本。', 'Les critères correspondants se réfèrent à la version de recette sélectionnée.', 'Die passenden Merkmale beziehen sich auf die gewählte Rezeptversion.', 'Las etiquetas de coincidencia se refieren a la versión de receta seleccionada.', '일치하는 취향 태그는 선택된 레시피 버전을 기준으로 합니다.', '一致する好みのタグは、選択中のレシピ版に基づきます。', 'Le etichette di corrispondenza si riferiscono alla versione di ricetta selezionata.'],
} satisfies Record<string, readonly [string, string, string, string, string, string, string, string]>;

export type GuidedRefinementKey = keyof typeof copy;
const locales: Locale[] = ['en', 'zh', 'fr', 'de', 'es', 'ko', 'ja', 'it'];

export function gr(locale: Locale, key: GuidedRefinementKey): string {
  return copy[key][locales.indexOf(locale)] ?? copy[key][0];
}
