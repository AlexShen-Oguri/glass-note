import type {Localized} from '../contracts';
export interface PreparationCard {
  id: string; ingredientId?: string; title: Localized;
  role: 'prepared-ingredient' | 'process';
  status: 'disclosed' | 'partial' | 'undisclosed';
  inputs: Localized[]; steps: Localized[];
  equipment?: Localized; timing?: Localized; temperature?: Localized; yield?: Localized;
  gaps: Localized[];
  sources: Array<{title: string; url: string}>;
}
export interface RecipePreparation {
  versionId: string; status: 'disclosed' | 'partial' | 'inspiration';
  summary: Localized; gaps: Localized[]; cards: PreparationCard[];
  checkedAt: string;
}
