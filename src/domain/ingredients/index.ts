import type {Catalogue, Ingredient, Locale, SearchQuery} from '../contracts';
import {matchVersion, scoreTextSearch} from '../search';
import {emptyPantry, type IngredientEntry, type IngredientGroup, type Pantry, type PantryMatch} from './types';
import {familyGroup, ingredientFamily} from './guide';
import {needsPreparationReview,preparationStatus} from '../preparations';
export * from './types';
export * from './guide';

/** Editorial navigation categories, not claims about exact composition. */
export function ingredientGroup(item: Ingredient): IngredientGroup {
  return familyGroup(ingredientFamily(item));
}

export function ingredientEntries(catalogue: Catalogue): IngredientEntry[] {
  return catalogue.ingredients.map(ingredient => {
    const versions = catalogue.versions.filter(v => v.ingredients.some(row => row.ingredientId === ingredient.id));
    const brandIds = new Set(ingredient.brandIds ?? []);
    for (const brand of catalogue.brands) if (brand.ingredientIds.includes(ingredient.id)) brandIds.add(brand.id);
    for (const v of versions) for (const row of v.ingredients) if (row.ingredientId === ingredient.id && row.brandId) brandIds.add(row.brandId);
    return {ingredient, group: ingredientGroup(ingredient), versions,
      cocktailIds: [...new Set(versions.map(v => v.cocktailId))],
      sourceIds: [...new Set(versions.map(v => v.sourceId))], brandIds: [...brandIds]};
  });
}

export function filterIngredientEntries(entries: IngredientEntry[], catalogue: Catalogue, text: string, locale: Locale, group?: IngredientGroup): IngredientEntry[] {
  const scores = new Map<string,number>();
  return entries.filter(entry => {
    if (group && entry.group !== group) return false;
    const brands = catalogue.brands.filter(b => entry.brandIds.includes(b.id)).map(b => b.name);
    const aliases: Partial<Record<string,string>> = {gin:'琴酒 杜松子酒',rum:'兰姆酒 蘭姆酒',whiskey:'威士基',vodka:'伏特加',tequila:'龙舌兰酒 龍舌蘭酒',brandy:'白兰地 白蘭地'};
    const alias = aliases[entry.ingredient.base ?? ''] ?? '';
    const fields = [...Object.values(entry.ingredient.name), entry.ingredient.id, ...brands, alias, ...(entry.ingredient.guide?.aliases ?? [])];
    const score = scoreTextSearch(text, fields);
    scores.set(entry.ingredient.id, score);
    return text.trim().length === 0 || score > 0;
  }).sort((a,b) => (scores.get(b.ingredient.id)??0)-(scores.get(a.ingredient.id)??0) || a.ingredient.name[locale].localeCompare(b.ingredient.name[locale], locale));
}

export const PANTRY_STORAGE_KEY = 'glass-notes.pantry.v1';
export function parsePantry(raw: string | null, catalogue: Catalogue, preserveUnknown = false): Pantry {
  try {
    const parsed = JSON.parse(raw ?? 'null');
    if (!parsed || !Array.isArray(parsed.ingredientIds)) return emptyPantry();
    const valid = new Set(catalogue.ingredients.map(i => i.id));
    const ingredientIds = [...new Set<string>(parsed.ingredientIds.filter((id: unknown): id is string => typeof id === 'string' && (preserveUnknown || valid.has(id))))];
    const brandsByIngredient: Record<string, string[]> = {};
    const entries = ingredientEntries(catalogue);
    for (const id of ingredientIds) {
      const values = parsed.brandsByIngredient?.[id];
      if (!Array.isArray(values)) continue;
      const allowed = new Set(entries.find(e => e.ingredient.id === id)?.brandIds);
      brandsByIngredient[id] = [...new Set<string>(values.filter((v: unknown): v is string => typeof v === 'string' && (preserveUnknown || allowed.has(v))))];
    }
    return {ingredientIds, brandsByIngredient};
  } catch { return emptyPantry(); }
}

export function pantryMatches(catalogue: Catalogue, pantry: Pantry, query: SearchQuery = {}): PantryMatch[] {
  if (!pantry.ingredientIds.length) return [];
  const owned = new Set(pantry.ingredientIds);
  const validIngredients = new Set(catalogue.ingredients.map(i => i.id));
  const score = (m: PantryMatch): [number, number] => [m.missingIngredientIds.length, m.unconfirmedBrands.length + Number(m.preparationNeedsReview)];
  const matches: PantryMatch[] = [];
  for (const cocktail of catalogue.cocktails) {
    const candidates: PantryMatch[] = [];
    for (const versionId of cocktail.versionIds) {
      const version = catalogue.versions.find(v => v.id === versionId && v.cocktailId === cocktail.id);
      if (!version || !matchVersion(catalogue, version, query)) continue;
      if (version.ingredients.some(row => !validIngredients.has(row.ingredientId))) continue;
      const missing = new Set<string>(), optional = new Set<string>();
      const requiredBrands = new Map<string, {ingredientId: string; brandId: string}>();
      for (const row of version.ingredients) {
        if (row.optional) { if (!owned.has(row.ingredientId)) optional.add(row.ingredientId); continue; }
        if (!owned.has(row.ingredientId)) missing.add(row.ingredientId);
        else if (row.brandId && !pantry.brandsByIngredient[row.ingredientId]?.includes(row.brandId)) {
          requiredBrands.set(`${row.ingredientId}:${row.brandId}`, {ingredientId: row.ingredientId, brandId: row.brandId});
        }
      }
      // No hidden pantry staples or family substitutions; ice and garnish stay in method text.
      if (missing.size > 2 || !version.ingredients.some(row => !row.optional && owned.has(row.ingredientId))) continue;
      const unconfirmedBrands = [...requiredBrands.values()];
      const preparationNeedsReview = needsPreparationReview(versionId);
      candidates.push({cocktailId: cocktail.id, versionId, missingIngredientIds: [...missing], optionalMissingIngredientIds: [...optional].filter(id => !missing.has(id)), unconfirmedBrands,
        preparationNeedsReview, preparationStatus:preparationStatus(versionId), status: missing.size ? 'missing' : preparationNeedsReview ? 'preparation-check' : unconfirmedBrands.length ? 'brand-check' : 'ready'});
    }
    candidates.sort((a,b) => score(a)[0] - score(b)[0] || score(a)[1] - score(b)[1] || Number(b.versionId === cocktail.defaultVersionId) - Number(a.versionId === cocktail.defaultVersionId));
    if (candidates[0]) matches.push(candidates[0]);
  }
  return matches.sort((a,b) => score(a)[0] - score(b)[0] || score(a)[1] - score(b)[1] || a.cocktailId.localeCompare(b.cocktailId));
}
