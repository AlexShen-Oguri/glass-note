import type {Catalogue} from '../contracts';
import {evaluateOwnedVersion, type OwnedVersionMatch} from '../ingredients/presence';
import type {Pantry} from '../ingredients/types';
import type {RestockSuggestion} from './types';

export type PresenceDecisionShelf = 'ready' | 'check' | 'missing';

export function decisionShelf(match: OwnedVersionMatch): PresenceDecisionShelf {
  if (match.missingIngredientIds.length) return 'missing';
  return match.preparationNeedsReview || match.unconfirmedBrands.length ? 'check' : 'ready';
}

function compare(left: number[], right: number[]): number {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const delta = (left[index] ?? 0) - (right[index] ?? 0);
    if (delta) return delta;
  }
  return 0;
}

function decisionRank(value: OwnedVersionMatch, isDefault: boolean): number[] {
  return [
    value.missingIngredientIds.length
      ? 2
      : value.preparationNeedsReview || value.unconfirmedBrands.length
        ? 1
        : 0,
    value.missingIngredientIds.length,
    value.unconfirmedBrands.length + Number(value.preparationNeedsReview),
    isDefault ? 0 : 1,
  ];
}

export function decisionsForPresence(
  catalogue: Catalogue,
  pantry: Pantry,
): OwnedVersionMatch[] {
  return catalogue.cocktails
    .map((cocktail) => cocktail.versionIds
      .map((id) => {
        const version = catalogue.versions.find((item) => item.id === id);
        return version ? evaluateOwnedVersion(catalogue, version, pantry) : null;
      })
      .filter((item): item is OwnedVersionMatch => Boolean(item))
      .sort((left, right) => compare(
        decisionRank(left, left.versionId === cocktail.defaultVersionId),
        decisionRank(right, right.versionId === cocktail.defaultVersionId),
      ) || left.versionId.localeCompare(right.versionId))[0])
    .filter((item): item is OwnedVersionMatch => Boolean(item))
    .sort((left, right) => compare(
      decisionRank(left, false),
      decisionRank(right, false),
    ) || left.cocktailId.localeCompare(right.cocktailId));
}

export function rankPresenceUnlocks(
  catalogue: Catalogue,
  pantry: Pantry,
): RestockSuggestion[] {
  const byIngredient = new Map<string, {
    ready: Set<string>;
    review: Set<string>;
    versions: Set<string>;
  }>();

  for (const cocktail of catalogue.cocktails) {
    const matches = cocktail.versionIds
      .map((id) => {
        const version = catalogue.versions.find((item) => item.id === id);
        return version ? evaluateOwnedVersion(catalogue, version, pantry) : null;
      })
      .filter((item): item is OwnedVersionMatch => Boolean(item));
    if (matches.some((item) => item.missingIngredientIds.length === 0)) continue;

    for (const match of matches) {
      if (match.missingIngredientIds.length !== 1) continue;
      const ingredientId = match.missingIngredientIds[0]!;
      const version = catalogue.versions.find((item) => item.id === match.versionId)!;
      const simulated = evaluateOwnedVersion(catalogue, version, {
        ingredientIds: [...new Set([...pantry.ingredientIds, ingredientId])],
        brandsByIngredient: pantry.brandsByIngredient,
      });
      if (!simulated || simulated.missingIngredientIds.length) continue;

      const group = byIngredient.get(ingredientId) ?? {
        ready: new Set<string>(),
        review: new Set<string>(),
        versions: new Set<string>(),
      };
      (decisionShelf(simulated) === 'ready' ? group.ready : group.review).add(cocktail.id);
      group.versions.add(version.id);
      byIngredient.set(ingredientId, group);
    }
  }

  return [...byIngredient]
    .map(([ingredientId, group]) => {
      for (const id of group.ready) group.review.delete(id);
      return {
        ingredientId,
        readyCocktailIds: [...group.ready].sort(),
        reviewCocktailIds: [...group.review].sort(),
        versionIds: [...group.versions].sort(),
      };
    })
    .sort((left, right) => (
      right.readyCocktailIds.length - left.readyCocktailIds.length
      || right.reviewCocktailIds.length - left.reviewCocktailIds.length
      || left.ingredientId.localeCompare(right.ingredientId)
    ));
}
