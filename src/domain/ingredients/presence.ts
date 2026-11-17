import type {Bottle} from '../bottles/types';
import type {Catalogue, RecipeVersion} from '../contracts';
import {needsPreparationReview, preparationStatus} from '../preparations';
import {compileMaterialResolver, materialPurchaseOptions, type MaterialResolver} from './canonical';
import type {Pantry, PantryMatch} from './types';

export interface OwnedVersionMatch extends PantryMatch {
  baseReady: boolean;
  missingBaseIngredientIds: string[];
}

export function evaluateOwnedVersion(
  catalogue: Catalogue,
  version: RecipeVersion,
  pantry: Pantry,
  resolver: MaterialResolver = compileMaterialResolver(catalogue),
): OwnedVersionMatch | null {
  const ingredients = resolver.ingredients;
  if (version.ingredients.some((row) => !ingredients.has(row.ingredientId))) return null;

  const missing = new Set<string>();
  const optionalMissing = new Set<string>();
  const missingBases = new Set<string>();
  const requiredBrands = new Map<string, {ingredientId: string; brandId: string}>();

  const materialResolutions = version.ingredients.map((row, rowIndex) => ({
    rowIndex, ...resolver.resolveRecipeMaterial(version,rowIndex,pantry.ingredientIds),
  }));
  const missingRequiredRows = materialResolutions.filter(resolution =>
    !version.ingredients[resolution.rowIndex]!.optional && resolution.match === 'missing');
  const preferredPurchases = materialPurchaseOptions(missingRequiredRows)[0];
  for (const id of preferredPurchases ?? missingRequiredRows.map(row => row.canonicalId)) missing.add(id);
  for (const [rowIndex, row] of version.ingredients.entries()) {
    const ingredient = ingredients.get(row.ingredientId)!;
    const resolution = materialResolutions[rowIndex]!;
    if (row.optional) {
      if (resolution.match === 'missing' && !resolution.candidateIngredientIds.some(id => missing.has(id))) optionalMissing.add(resolution.canonicalId);
      continue;
    }
    if (resolution.match === 'missing') {
      if (ingredient.base !== undefined && ingredient.base !== 'none') {
        missingBases.add(resolution.canonicalId);
      }
      continue;
    }
    const brand = row.brandId ? resolver.brands.get(row.brandId) : undefined;
    const ownsBrand = row.brandId && resolution.supplyIngredientIds.some(id =>
      pantry.brandsByIngredient[id]?.includes(row.brandId!) && (!brand || brand.ingredientIds.includes(id)),
    );
    const originalSupplies = row.brandId ? resolver.resolveMaterial(row.ingredientId, resolution.supplyIngredientIds).supplyIngredientIds : [];
    const allowedAlternativeOwned = row.brandId && resolution.supplyIngredientIds.some(id => !originalSupplies.includes(id));
    if (row.brandId && !ownsBrand && !allowedAlternativeOwned) {
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
    ...(catalogue.materialConcepts?.length || catalogue.materialRequirements?.length ? {materialResolutions} : {}),
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
