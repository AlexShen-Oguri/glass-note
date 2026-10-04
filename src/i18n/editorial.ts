import type {Locale} from '../domain/contracts';

const copy = {
  tonight: {zh:'今晚，\n这一杯。',en:'Tonight,\nyour glass.',fr:'Ce soir,\nvotre verre.',de:'Heute Abend,\ndein Glas.',es:'Esta noche,\ntu copa.',ko:'오늘 밤,\n당신의 한 잔.',ja:'今夜、\nあなたの一杯。',it:'Stasera,\nil tuo bicchiere.'},
  journey: {zh:'从今晚的一杯，到你的风味记忆。',en:'From tonight’s glass to your flavour memory.',fr:'Du verre de ce soir à vos souvenirs de saveurs.',de:'Vom heutigen Glas zu deiner Geschmackserinnerung.',es:'De la copa de esta noche a tu memoria de sabores.',ko:'오늘 밤의 한 잔에서 나만의 맛의 기억으로.',ja:'今夜の一杯から、あなたの風味の記憶へ。',it:'Dal bicchiere di stasera al tuo ricordo di sapori.'},
  homeIntro: {zh:'跟着香气与口感，找到此刻想喝的那一杯。',en:'Follow your favourite aromas and textures to a drink for this moment.',fr:'Suivez vos arômes et textures préférés vers le verre du moment.',de:'Finde über deine liebsten Aromen und Texturen ein Glas für diesen Moment.',es:'Sigue tus aromas y texturas favoritos hasta una copa para este momento.',ko:'좋아하는 향과 질감을 따라 지금 마시고 싶은 한 잔을 찾아보세요.',ja:'好きな香りと口当たりから、今飲みたい一杯を。',it:'Segui aromi e consistenze preferiti per trovare il drink di questo momento.'},
  inFocus: {zh:'杯中一页',en:'A glass in focus',fr:'Un verre à découvrir',de:'Ein Glas im Fokus',es:'Una copa en primer plano',ko:'한 잔을 들여다보기',ja:'一杯のページ',it:'Un bicchiere in primo piano'},
  editorial: {zh:'再读一页',en:'One more page',fr:'Encore une page',de:'Noch eine Seite',es:'Una página más',ko:'한 페이지 더',ja:'もう一ページ',it:'Un’altra pagina'},
  preview: {zh:'你的风味，逐渐清晰',en:'Your flavour, taking shape',fr:'Vos saveurs prennent forme',de:'Dein Geschmack nimmt Form an',es:'Tu sabor toma forma',ko:'선명해지는 나만의 맛',ja:'あなたの風味が、形になる',it:'Il tuo gusto prende forma'},
  previewHint: {zh:'这里只记下你的选择，推荐在下一步揭晓。',en:'Your choices so far. Recommendations come next.',fr:'Vos choix jusqu’ici. Les suggestions arrivent ensuite.',de:'Deine bisherigen Entscheidungen. Empfehlungen folgen im nächsten Schritt.',es:'Tus elecciones hasta ahora. Las recomendaciones vienen después.',ko:'지금까지의 선택입니다. 추천은 다음 단계에서 보여드려요.',ja:'ここまでの選択です。おすすめは次のステップで。',it:'Le tue scelte finora. I suggerimenti arrivano al prossimo passo.'},
  resultTitle: {zh:'为你留下这一杯',en:'A glass for you',fr:'Un verre pour vous',de:'Ein Glas für dich',es:'Una copa para ti',ko:'당신을 위한 한 잔',ja:'あなたに、この一杯',it:'Un bicchiere per te'},
  mainPick: {zh:'先从这一杯开始',en:'Start with this glass',fr:'Commencez par ce verre',de:'Beginne mit diesem Glas',es:'Empieza con esta copa',ko:'이 한 잔부터 시작해요',ja:'この一杯から始めよう',it:'Inizia da questo bicchiere'},
  alternatives: {zh:'也可以，换一种风味',en:'Or try another flavour',fr:'Ou explorez une autre saveur',de:'Oder probiere einen anderen Geschmack',es:'O prueba otro sabor',ko:'다른 맛도 만나보세요',ja:'別の風味も、どうぞ',it:'Oppure prova un altro gusto'},
  reason: {zh:'它呼应了你选择的：{labels}。',en:'It reflects your choices: {labels}.',fr:'Il rejoint vos choix : {labels}.',de:'Es greift deine Auswahl auf: {labels}.',es:'Refleja tus elecciones: {labels}.',ko:'선택한 취향과 맞닿아 있어요: {labels}.',ja:'選んだ好みに合う要素：{labels}。',it:'Riprende le tue scelte: {labels}.'},
  sourceDetails: {zh:'配方版本与来源',en:'Recipe versions & sources',fr:'Versions et sources',de:'Rezeptversionen und Quellen',es:'Versiones y fuentes',ko:'레시피 버전과 출처',ja:'レシピの版と出典',it:'Versioni e fonti'},
  tasteQuestion: {zh:'这一杯怎么样？',en:'How was this glass?',fr:'Comment était ce verre ?',de:'Wie war dieses Glas?',es:'¿Qué te pareció esta copa?',ko:'이번 한 잔은 어땠나요?',ja:'この一杯、どうでしたか？',it:'Com’era questo bicchiere?'},
} satisfies Record<string,Record<Locale,string>>;

export type EditorialKey = keyof typeof copy;
export function editorialText(locale:Locale,key:EditorialKey,values:Record<string,string> = {}):string {
  return copy[key][locale].replace(/\{(\w+)\}/g, (match,key:string) => values[key] ?? match);
}
