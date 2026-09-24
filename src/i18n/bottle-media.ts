import type {Locale} from '../domain/contracts';

const texts = {
  image: [
    'Product image', '产品图', 'Image du produit', 'Produktbild',
    'Imagen del producto', '제품 이미지', '製品画像', 'Immagine del prodotto',
  ],
  photoSource: [
    'Photo source', '照片来源', 'Source de la photo', 'Fotoquelle',
    'Fuente de la foto', '사진 출처', '写真の出典', 'Fonte della foto',
  ],
  sourceImage: [
    'Source product image', '来源产品图', 'Image produit issue de la source', 'Produktbild aus der Quelle',
    'Imagen del producto de la fuente', '출처 제품 이미지', '出典元の製品画像', 'Immagine prodotto dalla fonte',
  ],
  packaging: [
    'Packaging note', '包装说明', 'Note sur l’emballage', 'Hinweis zur Verpackung',
    'Nota sobre el envase', '패키지 안내', 'パッケージについて', 'Nota sulla confezione',
  ],
  reviewNote: [
    'Image review note · English', '图片核对备注 · 英语', 'Note de vérification · anglais', 'Bildprüfnotiz · Englisch',
    'Nota de revisión · inglés', '이미지 검토 메모 · 영어', '画像確認メモ · 英語', 'Nota di verifica · inglese',
  ],
  packagingMayVary: [
    'Packaging and labelled ABV may differ by market or release. Check the label on the bottle you use.',
    '包装与瓶标度数可能因销售地区或批次而不同，请以手中实物的瓶标为准。',
    'L’emballage et le degré peuvent varier selon le marché ou l’édition. Vérifiez l’étiquette de votre bouteille.',
    'Verpackung und Alkoholgehalt können je nach Markt oder Abfüllung abweichen. Prüfe das Etikett deiner Flasche.',
    'El envase y la graduación pueden variar según el mercado o la edición. Revisa la etiqueta de tu botella.',
    '시장이나 출시 시기에 따라 포장과 라벨 도수가 다를 수 있습니다. 실제 사용하는 보틀의 라벨을 확인하세요.',
    '市場や発売時期によって包装と表示度数が異なる場合があります。使うボトルのラベルを確認してください。',
    'Confezione e gradazione possono variare secondo il mercato o l’edizione. Controlla l’etichetta della tua bottiglia.',
  ],
  unavailable: [
    'Product image unavailable', '暂无产品图', 'Image du produit indisponible', 'Produktbild nicht verfügbar',
    'Imagen del producto no disponible', '제품 이미지 없음', '製品画像はありません', 'Immagine del prodotto non disponibile',
  ],
} satisfies Record<string, [string, string, string, string, string, string, string, string]>;

const locales: Locale[] = ['en', 'zh', 'fr', 'de', 'es', 'ko', 'ja', 'it'];

export type BottleMediaKey = keyof typeof texts;

export const bottleMediaText = (locale: Locale, key: BottleMediaKey) =>
  texts[key][locales.indexOf(locale)] ?? texts[key][0];
