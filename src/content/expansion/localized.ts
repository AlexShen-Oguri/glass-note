import type {Locale, Localized} from '../../domain/contracts';

export const L = (en: string, zh: string, fr: string, de: string, es: string, ko: string, ja: string, it: string): Localized => ({en, zh, fr, de, es, ko, ja, it});
export const S = (en: string[], zh: string[], fr: string[], de: string[], es: string[], ko: string[], ja: string[], it: string[]): Record<Locale, string[]> => ({en, zh, fr, de, es, ko, ja, it});
export const ibaLabel = L('IBA official web recipe', 'IBA 官方网页', 'Recette officielle IBA', 'Offizielles IBA-Webrezept', 'Receta oficial IBA', 'IBA 공식 웹 레시피', 'IBA公式ウェブレシピ', 'Ricetta web ufficiale IBA');
