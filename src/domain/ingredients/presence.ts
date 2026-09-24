import type {Bottle} from '../bottles/types';
import type {Catalogue, RecipeVersion} from '../contracts';
import {needsPreparationReview, preparationStatus} from '../preparations';
import type {Pantry, PantryMatch} from './types';

export interface OwnedVersionMatch extends PantryMatch {
  baseReady: boolean;
  missingBaseIngredientIds: string[];
}

export function evaluateOwnedVersion(
  catalogue: Catalogue,
  version: RecipeVersion,
  pantry: Pantry,
): OwnedVersionMatch | null {
  const ingredients = new Map(catalogue.ingredients.map((ingredient) => [ingredient.id, ingredient]));
  if (version.ingredients.some((row) => !ingredients.has(row.ingredientId))) return null;

  const owned = new Set(pantry.ingredientIds);
  const missing = new Set<string>();
  const optionalMissing = new Set<string>();
  const missingBases = new Set<string>();
  const requiredBrands = new Map<string, {ingredientId: string; brandId: string}>();

  for (const row of version.ingredients) {
    const ingredient = ingredients.get(row.ingredientId)!;
    if (row.optional) {
      if (!owned.has(row.ingredientId)) optionalMissing.add(row.ingredientId);
      continue;
    }
    if (!owned.has(row.ingredientId)) {
      missing.add(row.ingredientId);
      if (ingredient.base !== undefined && ingredient.base !== 'none') {
        missingBases.add(row.ingredientId);
      }
      continue;
    }
    if (row.brandId && !pantry.brandsByIngredient[row.ingredientId]?.includes(row.brandId)) {
      requiredBrands.set(`${row.ingredientId}\u0000${row.brandId}`, {
        ingredientId: row.ingredientId,
        brandId: row.brandId,
      });
    }
  }

  const missingIngredientIds = [...missing];
  const missingBaseIngredientIds = [...missingBases];
  const unconfirmedBrands = [...requiredBrands.values()];
  const preparationNeedsReview = needsPreparationReview(version.id);
  return {
    cocktailId: version.cocktailId,
    versionId: version.id,
    missingIngredientIds,
    optionalMissingIngredientIds: [...optionalMissing].filter((id) => !missing.has(id)),
    unconfirmedBrands,
    preparationNeedsReview,
    preparationStatus: preparationStatus(version.id),
    status: missingIngredientIds.length > 0
      ? 'missing'
      : preparationNeedsReview
        ? 'preparation-check'
        : unconfirmedBrands.length > 0
          ? 'brand-check'
          : 'ready',
    baseReady: missingBaseIngredientIds.length === 0,
    missingBaseIngredientIds,
  };
}

export function mergeOwnedPantry(pantry: Pantry, ownedBottles: readonly Bottle[]): Pantry {
  const ingredientIds = new Set(pantry.ingredientIds);
  const brandsByIngredient: Record<string, string[]> = Object.fromEntries(
    Object.entries(pantry.brandsByIngredient).map(([ingredientId, brandIds]) => [
      ingredientId,
      [...brandIds],
    ]),
  );

  for (const bottle of ownedBottles) {
    for (const ingredientId of bottle.ingredientIds) {
      ingredientIds.add(ingredientId);
      brandsByIngredient[ingredientId] = [
        ...new Set([...(brandsByIngredient[ingredientId] ?? []), bottle.brandId]),
      ];
    }
  }

  return {ingredientIds: [...ingredientIds], brandsByIngredient};
}
