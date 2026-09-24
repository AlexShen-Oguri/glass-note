import type {Locale} from '../domain/contracts';

export type Round175OrderKey =
  | 'originalName'
  | 'ingredients'
  | 'requests'
  | 'optional'
  | 'brand'
  | 'modification'
  | 'sourceBrand'
  | 'source'
  | 'sourceVersion'
  | 'details'
  | 'hideDetails'
  | 'showCard'
  | 'closeCard'
  | 'copyText'
  | 'shareText'
  | 'viewRecipe'
  | 'addRequest'
  | 'hideRequest'
  | 'requestHint'
  | 'simpleCardHint'
  | 'copied'
  | 'copyUnavailable'
  | 'shared'
  | 'shareCancelled'
  | 'shareUnavailable'
  | 'selectTextHint';

type EightLocales = Record<Locale,string>;

const copy: Record<Round175OrderKey,EightLocales> = {
  originalName: {
    en: 'Original name', zh: '原名', fr: 'Nom d’origine', de: 'Originalname', es: 'Nombre original', ko: '원래 이름', ja: '原名', it: 'Nome originale',
  },
  ingredients: {
    en: 'Ingredients', zh: '材料', fr: 'Ingrédients', de: 'Zutaten', es: 'Ingredientes', ko: '재료', ja: '材料', it: 'Ingredienti',
  },
  requests: {
    en: 'Your request', zh: '你的要求', fr: 'Votre demande', de: 'Dein Wunsch', es: 'Tu petición', ko: '요청 사항', ja: '希望する内容', it: 'La tua richiesta',
  },
  optional: {
    en: 'optional', zh: '可选', fr: 'facultatif', de: 'optional', es: 'opcional', ko: '선택 사항', ja: '任意', it: 'facoltativo',
  },
  brand: {
    en: 'Bottle', zh: '瓶款', fr: 'Bouteille', de: 'Flasche', es: 'Botella', ko: '보틀', ja: 'ボトル', it: 'Bottiglia',
  },
  modification: {
    en: 'Modification', zh: '修改', fr: 'Modification', de: 'Änderung', es: 'Modificación', ko: '변경 사항', ja: '変更', it: 'Modifica',
  },
  sourceBrand: {
    en: 'Source brand', zh: '来源指定品牌', fr: 'Marque de la source', de: 'Quellenmarke', es: 'Marca de la fuente', ko: '출처 지정 브랜드', ja: '出典指定ブランド', it: 'Marca della fonte',
  },
  source: {
    en: 'Source', zh: '来源', fr: 'Source', de: 'Quelle', es: 'Fuente', ko: '출처', ja: '出典', it: 'Fonte',
  },
  sourceVersion: {
    en: 'Version', zh: '版本', fr: 'Version', de: 'Version', es: 'Versión', ko: '버전', ja: '版', it: 'Versione',
  },
  details: {
    en: 'Recipe details', zh: '配方详情', fr: 'Détails de la recette', de: 'Rezeptdetails', es: 'Detalles de la receta', ko: '레시피 상세 정보', ja: 'レシピの詳細', it: 'Dettagli della ricetta',
  },
  hideDetails: {
    en: 'Hide recipe details', zh: '收起配方详情', fr: 'Masquer les détails', de: 'Rezeptdetails ausblenden', es: 'Ocultar detalles de la receta', ko: '레시피 상세 정보 닫기', ja: 'レシピの詳細を閉じる', it: 'Nascondi dettagli della ricetta',
  },
  showCard: {
    en: 'Show card', zh: '出示卡片', fr: 'Afficher la carte', de: 'Karte zeigen', es: 'Mostrar tarjeta', ko: '카드 보여 주기', ja: 'カードを表示', it: 'Mostra scheda',
  },
  closeCard: {
    en: 'Close card', zh: '关闭卡片', fr: 'Fermer la carte', de: 'Karte schließen', es: 'Cerrar tarjeta', ko: '카드 닫기', ja: 'カードを閉じる', it: 'Chiudi scheda',
  },
  copyText: {
    en: 'Copy text', zh: '复制文字', fr: 'Copier le texte', de: 'Text kopieren', es: 'Copiar texto', ko: '텍스트 복사', ja: '文章をコピー', it: 'Copia testo',
  },
  shareText: {
    en: 'Share text', zh: '分享文字', fr: 'Partager le texte', de: 'Text teilen', es: 'Compartir texto', ko: '텍스트 공유', ja: '文章を共有', it: 'Condividi testo',
  },
  viewRecipe: {
    en: 'View recipe', zh: '查看配方', fr: 'Voir la recette', de: 'Rezept ansehen', es: 'Ver receta', ko: '레시피 보기', ja: 'レシピを見る', it: 'Vedi ricetta',
  },
  addRequest: {
    en: 'Add a request or choose a bottle', zh: '加一句要求或指定酒款', fr: 'Ajouter une demande ou choisir une bouteille', de: 'Wunsch hinzufügen oder Flasche wählen', es: 'Añadir una petición o elegir una botella', ko: '요청을 추가하거나 보틀 선택', ja: '希望を加えるかボトルを選ぶ', it: 'Aggiungi una richiesta o scegli una bottiglia',
  },
  hideRequest: {
    en: 'Hide requests and bottle choices', zh: '收起要求与酒款选择', fr: 'Masquer les demandes et les bouteilles', de: 'Wünsche und Flaschen ausblenden', es: 'Ocultar peticiones y botellas', ko: '요청과 보틀 선택 닫기', ja: '希望とボトル選択を閉じる', it: 'Nascondi richieste e bottiglie',
  },
  requestHint: {
    en: 'Only text you enter here appears on the card. Private notes stay private.', zh: '只有在这里输入的文字会出现在卡片上，私人笔记不会加入卡片。', fr: 'Seul le texte saisi ici apparaît sur la carte. Les notes privées restent privées.', de: 'Nur dein eingegebener Text erscheint auf der Karte. Private Notizen bleiben privat.', es: 'Solo el texto que escribas aquí aparece en la tarjeta. Las notas privadas siguen siendo privadas.', ko: '여기에 직접 입력한 글만 카드에 표시됩니다. 비공개 메모는 그대로 비공개입니다.', ja: 'ここに入力した文章だけがカードに表示されます。非公開メモはカードに入りません。', it: 'Solo il testo inserito qui appare sulla scheda. Le note private restano private.',
  },
  simpleCardHint: {
    en: 'The drink, its ingredients and your requests.', zh: '酒名、材料，以及你的要求。', fr: 'Le cocktail, ses ingrédients et vos demandes.', de: 'Der Drink, seine Zutaten und deine Wünsche.', es: 'La bebida, sus ingredientes y tus peticiones.', ko: '음료 이름, 재료, 요청 사항.', ja: '酒名、材料、あなたの希望。', it: 'Il drink, gli ingredienti e le tue richieste.',
  },
  copied: {
    en: 'Card text copied.', zh: '已复制点单卡文字。', fr: 'Texte de la carte copié.', de: 'Kartentext kopiert.', es: 'Texto de la tarjeta copiado.', ko: '카드 텍스트를 복사했습니다.', ja: 'カードの文章をコピーしました。', it: 'Testo della scheda copiato.',
  },
  copyUnavailable: {
    en: 'Copy is unavailable here. Select the card text instead.', zh: '这里无法复制，请改为选择卡片文字。', fr: 'La copie est indisponible ici. Sélectionnez plutôt le texte de la carte.', de: 'Kopieren ist hier nicht verfügbar. Markiere stattdessen den Kartentext.', es: 'No se puede copiar aquí. Selecciona el texto de la tarjeta.', ko: '여기서는 복사할 수 없습니다. 카드 텍스트를 선택하세요.', ja: 'ここではコピーできません。カードの文章を選択하세요。', it: 'La copia non è disponibile qui. Seleziona il testo della scheda.',
  },
  shared: {
    en: 'Card text shared.', zh: '已分享点单卡文字。', fr: 'Texte de la carte partagé.', de: 'Kartentext geteilt.', es: 'Texto de la tarjeta compartido.', ko: '카드 텍스트를 공유했습니다.', ja: 'カードの文章を共有しました。', it: 'Testo della scheda condiviso.',
  },
  shareCancelled: {
    en: 'Sharing cancelled.', zh: '已取消分享。', fr: 'Partage annulé.', de: 'Teilen abgebrochen.', es: 'Se canceló el uso compartido.', ko: '공유를 취소했습니다.', ja: '共有をキャンセルしました。', it: 'Condivisione annullata.',
  },
  shareUnavailable: {
    en: 'Sharing is unavailable here. Copy or select the card text instead.', zh: '这里无法分享，请改为复制或选择卡片文字。', fr: 'Le partage est indisponible ici. Copiez ou sélectionnez plutôt le texte de la carte.', de: 'Teilen ist hier nicht verfügbar. Kopiere oder markiere stattdessen den Kartentext.', es: 'No se puede compartir aquí. Copia o selecciona el texto de la tarjeta.', ko: '여기서는 공유할 수 없습니다. 카드 텍스트를 복사하거나 선택하세요.', ja: 'ここでは共有できません。カードの文章をコピーまたは選択してください。', it: 'La condivisione non è disponibile qui. Copia o seleziona il testo della scheda.',
  },
  selectTextHint: {
    en: 'Press and hold the card text to select it.', zh: '长按卡片文字即可选择。', fr: 'Maintenez le texte de la carte pour le sélectionner.', de: 'Halte den Kartentext gedrückt, um ihn zu markieren.', es: 'Mantén pulsado el texto de la tarjeta para seleccionarlo.', ko: '카드 텍스트를 길게 눌러 선택하세요.', ja: 'カードの文章を長押しして選択してください。', it: 'Tieni premuto il testo della scheda per selezionarlo.',
  },
};

export function orderCopy(locale: Locale, key: Round175OrderKey): string {
  return copy[key][locale];
}

export const round175OrderCopy = copy;
