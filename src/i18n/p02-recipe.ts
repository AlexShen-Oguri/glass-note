import type {Locale} from '../domain/contracts';

type P02RecipeKey = 'moreActions' | 'hideMoreActions' | 'exactSource';

const copy: Record<P02RecipeKey, Record<Locale, string>> = {
  moreActions: {
    en: 'More actions', zh: '更多操作', fr: 'Plus d’actions', de: 'Weitere Aktionen',
    es: 'Más acciones', ko: '추가 작업', ja: 'その他の操作', it: 'Altre azioni',
  },
  hideMoreActions: {
    en: 'Hide more actions', zh: '收起更多操作', fr: 'Masquer les actions', de: 'Weitere Aktionen ausblenden',
    es: 'Ocultar más acciones', ko: '추가 작업 닫기', ja: 'その他の操作を閉じる', it: 'Nascondi altre azioni',
  },
  exactSource: {
    en: 'Exact source version', zh: '确切来源版本', fr: 'Version source exacte', de: 'Genaue Quellversion',
    es: 'Versión exacta de la fuente', ko: '정확한 출처 버전', ja: '正確な出典版', it: 'Versione esatta della fonte',
  },
};

export function p02RecipeText(locale: Locale, key: P02RecipeKey): string {
  return copy[key][locale];
}
