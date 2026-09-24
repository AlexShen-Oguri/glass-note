import type {Locale} from '../domain/contracts';

const navigationText = {
  libraryKicker: ['Ingredient guide', '材料指南', 'Guide des ingrédients', 'Zutatenführer', 'Guía de ingredientes', '재료 가이드', '材料ガイド', 'Guida agli ingredienti'],
  libraryDescription: [
    'Explore spirits, fruit, herbs and kitchen ingredients with illustrated guides.',
    '从基酒到水果、草本与厨房常备，配合插画认识每一种材料。',
    'Découvrez spiritueux, fruits, aromates et ingrédients de cuisine avec des illustrations.',
    'Entdecke Spirituosen, Früchte, Kräuter und Küchenzutaten mit Illustrationen.',
    'Conoce destilados, frutas, hierbas e ingredientes de cocina con ilustraciones.',
    '증류주부터 과일, 허브, 주방 재료까지 일러스트와 함께 알아보세요.',
    'スピリッツから果物、ハーブ、キッチンの材料まで、イラストで知る。',
    'Scopri distillati, frutta, erbe e ingredienti di cucina con guide illustrate.',
  ],
  pantryKicker: ['Your ingredients', '你的材料', 'Vos ingrédients', 'Deine Zutaten', 'Tus ingredientes', '내 재료', '手元の材料', 'I tuoi ingredienti'],
  pantryDescription: [
    'Save what you have and see what is ready to mix, or nearly there.',
    '记下手边已有的材料，看看现在能调什么、还差什么。',
    'Enregistrez ce que vous avez et voyez quoi préparer, ou ce qui manque encore.',
    'Speichere deinen Vorrat und sieh, was du mixen kannst oder was noch fehlt.',
    'Guarda lo que tienes y descubre qué puedes preparar o qué te falta.',
    '가진 재료를 저장하고 지금 만들 수 있는 칵테일과 부족한 재료를 확인하세요.',
    '手元の材料を保存して、作れる一杯と足りないものを確認できます。',
    'Salva ciò che hai e scopri cosa puoi preparare o cosa manca.',
  ],
  pantryEmpty: ['Start your cabinet', '开始整理酒柜', 'Commencer mon bar', 'Hausbar anlegen', 'Empezar mi bar', '술장 채우기', 'キャビネットを始める', 'Inizia il mio bar'],
  pantrySaved: ['saved', '项已保存', 'enregistrés', 'gespeichert', 'guardados', '개 저장됨', '件を保存', 'salvati'],
} satisfies Record<string, [string, string, string, string, string, string, string, string]>;

export type NavigationKey = keyof typeof navigationText;

const locales: Locale[] = ['en', 'zh', 'fr', 'de', 'es', 'ko', 'ja', 'it'];

export function nav(locale: Locale, key: NavigationKey) {
  return navigationText[key][locales.indexOf(locale)] ?? navigationText[key][0];
}

export function pantryCountLabel(locale: Locale, count?: number) {
  if (!count) return nav(locale, 'pantryEmpty');
  return `${count} ${nav(locale, 'pantrySaved')}`;
}
