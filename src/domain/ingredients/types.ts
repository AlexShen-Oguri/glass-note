import type {Ingredient, RecipeVersion} from '../contracts';

export const INGREDIENT_GROUPS = ['spirits', 'liqueurs', 'wines', 'bitters', 'mixers', 'fresh', 'herbs', 'spices', 'sweeteners', 'tea-coffee', 'dairy', 'nuts-grains', 'cooking', 'other'] as const;
export type IngredientGroup = typeof INGREDIENT_GROUPS[number];
export interface IngredientEntry {
  ingredient: Ingredient;
  group: IngredientGroup;
  versions: RecipeVersion[];
  cocktailIds: string[];
  sourceIds: string[];
  brandIds: string[];
}
export interface Pantry {
  ingredientIds: string[];
  /** A brand is owned only for this explicitly selected ingredient. */
  brandsByIngredient: Record<string, string[]>;
}
export interface PantryMatch {
  cocktailId: string;
  versionId: string;
  missingIngredientIds: string[];
  optionalMissingIngredientIds: string[];
  unconfirmedBrands: Array<{ingredientId: string; brandId: string}>;
  preparationNeedsReview?: boolean;
  preparationStatus?: 'disclosed'|'partial'|'inspiration'|'unreviewed';
  status: 'ready' | 'brand-check' | 'preparation-check' | 'missing';
}
export const emptyPantry = (): Pantry => ({ingredientIds: [], brandsByIngredient: {}});
