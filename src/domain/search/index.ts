import {preparationStatus} from '../preparations';
import {MIXING_METHODS} from '../contracts';
import type {
  Base,
  Brand,
  Catalogue,
  Cocktail,
  Exclusion,
  Ingredient,
  MeasureUnit,
  MixingMethod,
  RecipeIngredient,
  RecipeVersion,
  SearchQuery,
  SearchResult,
  UnitPreference,
} from '../contracts';
import {normalizeSearchText, scoreTextSearch} from './text';

export {normalizeSearchText, scoreTextSearch, TEXT_SEARCH_SCORE} from './text';

const MILLILITRES_PER_US_FLUID_OUNCE = 29.5735295625;

type TextMatchReason =
  | 'cocktail-name'
  | 'cocktail-alias'
  | 'ingredient'
  | 'brand'
  | 'combined';

interface TextMatch {
  quality: number;
  reason?: TextMatchReason;
}

interface SearchContext {
  ingredientsById: Map<string, Ingredient>;
  brandsById: Map<string, Brand>;
  cocktailsById: Map<string, Cocktail>;
}

export function matchVersion(
  catalogue: Catalogue,
  version: RecipeVersion,
  query: SearchQuery,
): boolean {
  const context = createSearchContext(catalogue);
  const cocktail = context.cocktailsById.get(version.cocktailId);
  return matchesVersion(version, cocktail, query, context);
}

export function searchCocktails(
  catalogue: Catalogue,
  query: SearchQuery,
): SearchResult[] {
  const context = createSearchContext(catalogue);
  const versionsById = indexFirstById(catalogue.versions);
  const results: Array<SearchResult & {category: Cocktail['category']}> = [];
  const seenCocktailIds = new Set<string>();

  for (const cocktail of catalogue.cocktails) {
    if (seenCocktailIds.has(cocktail.id)) continue;
    seenCocktailIds.add(cocktail.id);

    const matchingVersions: RecipeVersion[] = [];
    const seenVersionIds = new Set<string>();

    for (const versionId of cocktail.versionIds) {
      if (seenVersionIds.has(versionId)) continue;
      seenVersionIds.add(versionId);

      const version = versionsById.get(versionId);
      if (!version || version.cocktailId !== cocktail.id) continue;
      if (matchesVersion(version, cocktail, query, context)) {
        matchingVersions.push(version);
      }
    }

    if (matchingVersions.length === 0) continue;

    const versionIds = matchingVersions.map(({id}) => id);
    const selectedVersionId = versionIds.includes(cocktail.defaultVersionId)
      ? cocktail.defaultVersionId
      : versionIds[0];
    if (!selectedVersionId) continue;

    const score = matchingVersions.reduce(
      (best, version) =>
        Math.max(best, textMatch(version, cocktail, query.text, context).quality),
      0,
    );

    results.push({
      cocktailId: cocktail.id,
      versionIds,
      selectedVersionId,
      score,
      reasons: matchingReasonTags(query),
      category: cocktail.category,
    });
  }

  results.sort((left, right) => {
    const qualityDifference = right.score - left.score;
    if (qualityDifference !== 0) return qualityDifference;

    const classicDifference = categoryRank(left.category) - categoryRank(right.category);
    if (classicDifference !== 0) return classicDifference;

    return compareIds(left.cocktailId, right.cocktailId);
  });

  return results.map(({category: _category, ...result}) => result);
}

export function formatAmount(
  amount: number | null,
  unit: MeasureUnit,
  preference: UnitPreference,
): {amount: string; unit: MeasureUnit} {
  if (amount === null) return {amount: '', unit};

  if (unit === 'ml' && preference === 'oz') {
    return {
      amount: formatNumber(amount / MILLILITRES_PER_US_FLUID_OUNCE),
      unit: 'oz',
    };
  }

  if (unit === 'oz' && preference === 'ml') {
    return {
      amount: formatNumber(amount * MILLILITRES_PER_US_FLUID_OUNCE),
      unit: 'ml',
    };
  }

  return {amount: formatNumber(amount), unit};
}

function matchesVersion(
  version: RecipeVersion,
  cocktail: Cocktail | undefined,
  query: SearchQuery,
  context: SearchContext,
): boolean {
  const ingredients = resolveIngredients(version.ingredients, context.ingredientsById);
  if (query.recipeCategory === 'classic' && (cocktail?.category !== 'classic' || version.origin)) return false;
  if (query.recipeCategory && query.recipeCategory !== 'classic' && version.origin?.kind !== query.recipeCategory) return false;
  if (query.collection && !cocktail?.collections?.includes(query.collection)) return false;
  if (query.preparationDisclosed && preparationStatus(version.id) !== 'disclosed') return false;

  if (hasValues(query.bases) && !matchesBase(version, ingredients, query.bases)) {
    return false;
  }

  if (
    hasValues(query.brandIds) &&
    !version.ingredients.some(
      ({brandId}) => brandId !== undefined && query.brandIds?.includes(brandId),
    )
  ) {
    return false;
  }

  if (
    hasValues(query.ingredientIds) &&
    !matchesIngredientIds(
      version.ingredients,
      query.ingredientIds,
      query.ingredientMode ?? 'all',
      context.ingredientsById,
    )
  ) {
    return false;
  }

  if (
    hasValues(query.methods) &&
    !matchesMixingMethods(version, query.methods)
  ) {
    return false;
  }

  if (hasValues(query.flavours) && !hasIntersection(version.flavours, query.flavours)) {
    return false;
  }

  if (hasValues(query.tastes) && !hasIntersection(version.tastes, query.tastes)) {
    return false;
  }

  if (
    hasValues(query.strengths) &&
    (version.strength === null || !query.strengths.includes(version.strength))
  ) {
    return false;
  }

  if (
    hasValues(query.approachability) &&
    (version.approachability === null ||
      !query.approachability.includes(version.approachability))
  ) {
    return false;
  }

  if (hasValues(query.excluded) && !passesExclusions(ingredients, query.excluded)) {
    return false;
  }

  if (
    hasValues(query.excludedIngredientIds) &&
    !passesIngredientIdExclusions(
      ingredients,
      query.excludedIngredientIds,
      context.ingredientsById,
    )
  ) {
    return false;
  }

  const hasTextQuery = normalizeSearchText(query.text ?? '').length > 0;
  return !hasTextQuery || textMatch(version, cocktail, query.text, context).quality > 0;
}

function createSearchContext(catalogue: Catalogue): SearchContext {
  return {
    ingredientsById: indexFirstById(catalogue.ingredients),
    brandsById: indexFirstById(catalogue.brands),
    cocktailsById: indexFirstById(catalogue.cocktails),
  };
}

function indexFirstById<T extends {id: string}>(items: T[]): Map<string, T> {
  const index = new Map<string, T>();
  for (const item of items) {
    if (!index.has(item.id)) index.set(item.id, item);
  }
  return index;
}

function resolveIngredients(
  recipeIngredients: RecipeIngredient[],
  ingredientsById: Map<string, Ingredient>,
): Array<{recipeIngredient: RecipeIngredient; ingredient?: Ingredient}> {
  return recipeIngredients.map((recipeIngredient) => ({
    recipeIngredient,
    ingredient: ingredientsById.get(recipeIngredient.ingredientId),
  }));
}

function matchesBase(
  version: RecipeVersion,
  ingredients: Array<{ingredient?: Ingredient}>,
  selectedBases: Base[],
): boolean {
  if (selectedBases.includes('none') && version.strength === 'none') return true;

  return ingredients.some(
    ({ingredient}) =>
      ingredient?.base !== undefined &&
      ingredient.base !== 'none' &&
      selectedBases.includes(ingredient.base),
  );
}

/** Optional and required recipe rows are both explicit listed-ingredient evidence. */
function matchesIngredientIds(
  recipeIngredients: RecipeIngredient[],
  selectedIds: string[],
  mode: 'all' | 'any',
  ingredientsById: Map<string, Ingredient>,
): boolean {
  if (selectedIds.some((id) => !ingredientsById.has(id))) return false;

  const listedIds = new Set(recipeIngredients.map(({ingredientId}) => ingredientId));
  return mode === 'any'
    ? selectedIds.some((id) => listedIds.has(id))
    : selectedIds.every((id) => listedIds.has(id));
}

function matchesMixingMethods(
  version: RecipeVersion,
  selectedMethods: MixingMethod[],
): boolean {
  if (!Array.isArray(version.originalSteps) || version.originalSteps.length === 0) return false;
  if (!Array.isArray(version.mixingMethods)) return false;

  return version.mixingMethods.some((evidence) =>
    evidence != null &&
    MIXING_METHODS.includes(evidence.method) &&
    selectedMethods.includes(evidence.method) &&
    evidence.sourceId === version.sourceId &&
    Array.isArray(evidence.stepIndexes) &&
    evidence.stepIndexes.length > 0 &&
    evidence.stepIndexes.every(
      (index) => Number.isInteger(index) && index >= 0 && index < version.originalSteps!.length,
    ),
  );
}

function passesExclusions(
  ingredients: Array<{ingredient?: Ingredient}>,
  exclusions: Exclusion[],
): boolean {
  for (const {ingredient} of ingredients) {
    if (!ingredient || !ingredient.compositionKnown) return false;
    if (ingredient.base !== undefined && exclusions.includes(ingredient.base)) return false;
    if (hasIntersection(ingredient.exclusionTags, exclusions)) return false;
  }

  return true;
}

function passesIngredientIdExclusions(
  ingredients: Array<{recipeIngredient: RecipeIngredient; ingredient?: Ingredient}>,
  excludedIds: string[],
  ingredientsById: Map<string, Ingredient>,
): boolean {
  if (excludedIds.some((id) => !ingredientsById.has(id))) return false;

  for (const {recipeIngredient, ingredient} of ingredients) {
    if (!ingredient || !ingredient.compositionKnown) return false;
    if (excludedIds.includes(recipeIngredient.ingredientId)) return false;
  }

  return true;
}

function textMatch(
  version: RecipeVersion,
  cocktail: Cocktail | undefined,
  rawQuery: string | undefined,
  context: SearchContext,
): TextMatch {
  const query = rawQuery ?? '';
  if (!normalizeSearchText(query)) return {quality: 0};

  const cocktailNames = cocktail
    ? Object.values(cocktail.name)
    : [];
  const cocktailAliases = cocktail
    ? cocktail.aliases
    : [];
  const ingredientNames: string[] = [];
  const brandNames: string[] = [];

  for (const recipeIngredient of version.ingredients) {
    const ingredient = context.ingredientsById.get(recipeIngredient.ingredientId);
    if (ingredient) {
      ingredientNames.push(
        ...Object.values(ingredient.name),
      );
    }

    if (recipeIngredient.brandId) {
      const brand = context.brandsById.get(recipeIngredient.brandId);
      if (brand) brandNames.push(brand.name);
    }
  }

  const candidates: Array<{quality: number; reason: TextMatchReason; weight: number}> = [
    {quality: scoreTextSearch(query, cocktailNames), reason: 'cocktail-name', weight: 4},
    {quality: scoreTextSearch(query, cocktailAliases), reason: 'cocktail-alias', weight: 3},
    {quality: scoreTextSearch(query, ingredientNames), reason: 'ingredient', weight: 2},
    {quality: scoreTextSearch(query, brandNames), reason: 'brand', weight: 2},
  ];

  const allFields = [
    ...cocktailNames,
    ...cocktailAliases,
    ...ingredientNames,
    ...brandNames,
  ];
  candidates.push({
    quality: scoreTextSearch(query, allFields),
    reason: 'combined',
    weight: 1,
  });
  const best = candidates.reduce((current, candidate) => {
    if (candidate.quality !== current.quality) {
      return candidate.quality > current.quality ? candidate : current;
    }
    return candidate.weight > current.weight ? candidate : current;
  });
  return best.quality > 0
    ? {quality: best.quality + best.weight * 100, reason: best.reason}
    : {quality: 0};
}

function matchingReasonTags(query: SearchQuery): string[] {
  const reasons: string[] = [];
  if (normalizeSearchText(query.text ?? '')) reasons.push('text');
  if (hasValues(query.bases)) reasons.push('base');
  if (hasValues(query.brandIds)) reasons.push('brand');
  if (hasValues(query.ingredientIds)) reasons.push('ingredient');
  if (hasValues(query.methods)) reasons.push('method');
  if (hasValues(query.flavours)) reasons.push('flavour');
  if (hasValues(query.tastes)) reasons.push('taste');
  if (hasValues(query.strengths)) reasons.push('strength');
  if (hasValues(query.approachability)) reasons.push('approachability');
  if (hasValues(query.excluded)) reasons.push('exclusion');
  if (hasValues(query.excludedIngredientIds)) reasons.push('ingredient-exclusion');
  return reasons;
}

function hasValues<T>(values: T[] | undefined): values is T[] {
  return values !== undefined && values.length > 0;
}

function hasIntersection<T>(left: T[], right: T[]): boolean {
  return left.some((value) => right.includes(value));
}

function categoryRank(category: Cocktail['category']): number {
  return category === 'classic' ? 0 : 1;
}

function compareIds(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}
