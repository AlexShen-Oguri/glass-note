export const LOCALES = ['en', 'zh', 'fr', 'de', 'es', 'ko', 'ja', 'it'] as const;
export type Locale = (typeof LOCALES)[number];
export type Localized = Record<Locale, string>;
export type UnitPreference = 'ml' | 'oz';
export type Flavour = 'citrus' | 'fruit' | 'floral' | 'herbal' | 'spice' | 'coffee';
export type Taste = 'sour' | 'sweet' | 'bitter' | 'dry' | 'creamy' | 'refreshing';
export type Strength = 'none' | 'low' | 'medium' | 'strong';
export type Approachability = 'gentle' | 'balanced' | 'bold';
export type Base = 'gin' | 'rum' | 'tequila' | 'whiskey' | 'vodka' | 'brandy' | 'mezcal' | 'cachaca' | 'grappa' | 'none';
export type Exclusion = 'egg' | 'dairy' | Base;
export const MIXING_METHODS = ['shake', 'stir', 'build', 'blend', 'hot'] as const;
export type MixingMethod = (typeof MIXING_METHODS)[number];
export interface MixingMethodEvidence {
  method: MixingMethod;
  sourceId: string;
  /** Zero-based indexes in this version's originalSteps, not translated steps. */
  stepIndexes: number[];
  /** Review of the archived steps; not a new live source-page check. */
  reviewedAt: string;
}

export type IngredientFamily = 'spirit' | 'liqueur' | 'wine' | 'bitters' | 'beer' | 'citrus' | 'berry' | 'cherry' | 'apple' | 'pear' | 'stone-fruit' | 'grape' | 'tropical' | 'banana' | 'pineapple' | 'coconut' | 'melon' | 'herb' | 'flower' | 'leaf' | 'root' | 'vegetable' | 'pepper' | 'mushroom' | 'seaweed' | 'cinnamon' | 'star-anise' | 'vanilla' | 'spice' | 'seed' | 'nut' | 'grain' | 'legume' | 'tea' | 'coffee' | 'cocoa' | 'juice' | 'soda' | 'water' | 'syrup' | 'honey' | 'sugar' | 'milk' | 'cream' | 'cheese' | 'egg' | 'oil' | 'vinegar' | 'sauce' | 'preserve' | 'salt' | 'pantry';
export interface IngredientGuide {
  family: IngredientFamily;
  /** Original taxonomy labels, retained as evidence rather than recipe substitutions. */
  parents: string[];
  aliases: string[];
  source?: {title: string; url: string; recordId: string; canonicalName: string; license: string; licenseUrl: string};
  nameOrigin?: Partial<Record<Locale, 'source' | 'draft' | 'fallback'>>;
}

export interface Ingredient {
  id: string;
  name: Localized;
  base?: Base;
  /** Categories explicitly known from the ingredient composition. */
  exclusionTags: Exclusion[];
  /** False for an unresolved compound ingredient, never inferred safe. */
  compositionKnown: boolean;
  brandIds?: string[];
  guide?: IngredientGuide;
}
export interface Brand { id: string; name: string; ingredientIds: string[] }
export type MeasureUnit = 'ml' | 'oz' | 'g' | 'tsp' | 'tbsp' | 'pinch' | 'bunch' | 'barspoon' | 'dash' | 'drop' | 'spray' | 'piece' | 'top' | 'part';
export interface RecipeIngredient {
  ingredientId: string;
  amount: number | null;
  unit: MeasureUnit;
  note?: Localized;
  optional?: boolean;
  brandId?: string;
}
export interface Source {
  id: string;
  title: string;
  url: string;
  author?: string;
  book?: string;
  checkedAt: string;
}
export interface RecipeVersion {
  /** Source-specific attribution; never inferred from a cocktail's name. */
  origin?: {kind:'competition'|'bar';topicId:string;countryCodes:string[];event?:string;year?:number;venue?:string};
  id: string;
  cocktailId: string;
  label: Localized;
  sourceId: string;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: Record<Locale, string[]>;
  originalLanguage: Locale;
  /** Paraphrased text, unless its content is explicitly an attributed quotation. */
  originalSteps?: string[];
  /** Source-backed final mixing techniques; absent means unclassified. */
  mixingMethods?: MixingMethodEvidence[];
  glass: Localized;
  garnish: Localized;
  flavours: Flavour[];
  tastes: Taste[];
  strength: Strength | null;
  approachability: Approachability | null;
  profileBasis: 'editorial' | 'source';
  profileNote: Localized;
  sourceChecked: boolean;
  translationStatus: 'draft' | 'reviewed';
  bar?: {name: string; address: string; url?: string};
}
export interface Cocktail {
  id: string;
  name: Localized;
  /** Untranslated source identity, separate from editorial display names. */
  originalName?: string;
  editorialNameLocales?: Locale[];
  /** Stable pre-display-overlay title for existing personal snapshot fingerprints. */
  snapshotName?: Localized;
  aliases: string[];
  category: 'classic' | 'curated' | 'alcohol-free';
  /** Editorial collections include both Japanese creations and Japan-inspired recipes. */
  collections?: 'japan'[];
  description: Localized;
  versionIds: string[];
  defaultVersionId: string;
  /** Colour supports honest photo placeholders. */
  accent: string;
}
export interface Catalogue {
  cocktails: Cocktail[];
  versions: RecipeVersion[];
  ingredients: Ingredient[];
  brands: Brand[];
  sources: Source[];
}
export interface SearchQuery {
  recipeCategory?:'classic'|'competition'|'bar';
  preparationDisclosed?: boolean;
  collection?: 'japan';
  text?: string;
  bases?: Base[];
  /** Exact IDs explicitly listed in the recipe, without substitutions. */
  ingredientIds?: string[];
  /** Defaults to all when ingredientIds is nonempty. */
  ingredientMode?: 'all' | 'any';
  excludedIngredientIds?: string[];
  /** Multiple selected techniques match any; other dimensions still intersect. */
  methods?: MixingMethod[];
  brandIds?: string[];
  flavours?: Flavour[];
  tastes?: Taste[];
  strengths?: Strength[];
  approachability?: Approachability[];
  excluded?: Exclusion[];
  locale?: Locale;
}
export interface SearchResult {
  cocktailId: string;
  versionIds: string[];
  selectedVersionId: string;
  score: number;
  /** Stable machine-readable tags, not untranslated user-facing copy. */
  reasons: string[];
}
export interface MediaAsset {
  uri: string;
  thumbnailUri?: string;
  sourceUrl: string;
  author: string;
  license?: string;
  licenseUrl?: string;
  origin?: 'photograph' | 'ai-generated' | 'ai-styled';
  referenceUrl?: string;
  /** Photography is a drink illustration unless tied to an exact source version. */
  kind: 'drink-illustration' | 'recipe-version';
  versionId?: string;
}
export const EMPTY_QUERY: SearchQuery = {};
