import type {Catalogue, RecipeVersion} from '../contracts';
import {evaluateOwnedVersion, type OwnedVersionMatch} from '../ingredients/presence';
import type {Pantry, RecipeMaterialResolution} from '../ingredients/types';
import {compileMaterialResolver, materialPurchaseOptions} from '../ingredients/canonical';
import type {RestockSuggestion} from './types';

export type PresenceDecisionShelf = 'ready' | 'check' | 'missing';

export interface PresenceCombination {
  ingredientIds: [string] | [string, string];
  cocktails: Array<{
    cocktailId: string;
    readyVersions: OwnedVersionMatch[];
    needsReviewVersions: OwnedVersionMatch[];
    jointlyUnlocked: boolean;
  }>;
}

export function rankPresenceCombinations(
  catalogue: Catalogue,
  pantry: Pantry,
  ingredientCount?: 1 | 2,
  eligibility: {eligibleVersionIds?: ReadonlySet<string>} = {},
): PresenceCombination[] {
  const resolver = compileMaterialResolver(catalogue);
  const versions = new Map(catalogue.versions.map(item => [item.id, item]));
  const defaultVersions = new Map(catalogue.cocktails.map(item => [item.id, item.defaultVersionId]));
  const sources = new Set(catalogue.sources.map(item => item.id));
  const candidates: Array<{version: RecipeVersion; unmetRows: RecipeMaterialResolution[]; options: PresenceCombination['ingredientIds'][]}> = [];
  const ingredientIds = new Set<string>();
  const known = resolver.ingredients;

  for (const cocktail of catalogue.cocktails) {
    const matches = [...new Set(cocktail.versionIds)].flatMap(id => {
      const version = versions.get(id);
      if (!version || version.cocktailId !== cocktail.id || !sources.has(version.sourceId)) return [];
      const match = evaluateOwnedVersion(catalogue, version, pantry, resolver);
      return match ? [match] : [];
    });
    // A different already-covered source is still the same drink, not a gain.
    if (matches.some(match => match.missingIngredientIds.length === 0)) continue;
    for (const match of matches) {
      if (eligibility.eligibleVersionIds && !eligibility.eligibleVersionIds.has(match.versionId)) continue;
      const version = versions.get(match.versionId)!;
      const resolutions = match.materialResolutions ?? version.ingredients.map((_row, rowIndex) => ({
        rowIndex, ...resolver.resolveRecipeMaterial(version, rowIndex, pantry.ingredientIds),
      }));
      const unmetRows = resolutions.filter(row => !version.ingredients[row.rowIndex]!.optional && row.match === 'missing')
        .map(row => ({...row, candidateIngredientIds: row.candidateIngredientIds.filter(id => known.has(id))}));
      const options = materialPurchaseOptions(unmetRows, ingredientCount ?? 2);
      if (!options.length) continue;
      candidates.push({version, unmetRows, options});
      for (const option of options) for (const id of option) ingredientIds.add(id);
    }
  }

  const ids = [...ingredientIds].sort();
  const choices: PresenceCombination['ingredientIds'][] = [];
  for (let left = 0; left < ids.length; left += 1) {
    if (ingredientCount !== 2) choices.push([ids[left]!]);
    if (ingredientCount !== 1) {
      for (let right = left + 1; right < ids.length; right += 1) choices.push([ids[left]!, ids[right]!]);
    }
  }

  const results: PresenceCombination[] = [];
  for (const choice of choices) {
    const used = new Set<string>();
    const groups = new Map<string, PresenceCombination['cocktails'][number]>();
    for (const candidate of candidates) {
      if (!candidate.options.some(option => option.every(id => choice.includes(id)))) continue;
      const match = evaluateOwnedVersion(catalogue, candidate.version, {
        ingredientIds: [...pantry.ingredientIds, ...choice], brandsByIngredient: pantry.brandsByIngredient,
      }, resolver);
      if (!match || match.missingIngredientIds.length) continue;
      // A purchase contributes only if removing it loses an actual newly completed source.
      for (const id of choice) if (candidate.unmetRows.some(row =>
        row.candidateIngredientIds.includes(id) && !choice.some(other => other !== id && row.candidateIngredientIds.includes(other)))) used.add(id);
      const group = groups.get(match.cocktailId) ?? {
        cocktailId: match.cocktailId,
        readyVersions: [],
        needsReviewVersions: [],
        jointlyUnlocked: choice.length === 2,
      };
      if (candidate.options.some(option => option.length === 1 && choice.includes(option[0]))) group.jointlyUnlocked = false;
      (decisionShelf(match) === 'ready' ? group.readyVersions : group.needsReviewVersions).push(match);
      groups.set(match.cocktailId, group);
    }
    // Every purchased item must serve at least one actual new source version.
    // This makes deficit-based candidate pruning equivalent to full enumeration.
    if (used.size !== choice.length) continue;
    const cocktails = [...groups.values()];
    for (const group of cocktails) {
      const defaultId = defaultVersions.get(group.cocktailId);
      const order = (a: OwnedVersionMatch, b: OwnedVersionMatch) => compare(
        decisionRank(a, a.versionId === defaultId), decisionRank(b, b.versionId === defaultId),
      ) || a.versionId.localeCompare(b.versionId);
      group.readyVersions.sort(order);
      group.needsReviewVersions.sort(order);
    }
    cocktails.sort((a, b) => Number(Boolean(b.readyVersions.length)) - Number(Boolean(a.readyVersions.length))
      || a.cocktailId.localeCompare(b.cocktailId));
    results.push({ingredientIds: choice, cocktails});
  }
  const readyCount = (plan: PresenceCombination) => plan.cocktails.filter(item => item.readyVersions.length).length;
  return results.sort((a, b) => readyCount(b) - readyCount(a)
    || (b.cocktails.length - readyCount(b)) - (a.cocktails.length - readyCount(a))
    || a.ingredientIds.length - b.ingredientIds.length
    || a.ingredientIds.join('\u0000').localeCompare(b.ingredientIds.join('\u0000')));
}

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
  const resolver = compileMaterialResolver(catalogue);
  return catalogue.cocktails
    .map((cocktail) => cocktail.versionIds
      .map((id) => {
        const version = catalogue.versions.find((item) => item.id === id);
        return version ? evaluateOwnedVersion(catalogue, version, pantry, resolver) : null;
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
  return rankPresenceCombinations(catalogue, pantry, 1).map(plan => ({
    ingredientId: plan.ingredientIds[0],
    readyCocktailIds: plan.cocktails.filter(item => item.readyVersions.length).map(item => item.cocktailId).sort(),
    reviewCocktailIds: plan.cocktails.filter(item => !item.readyVersions.length).map(item => item.cocktailId).sort(),
    versionIds: plan.cocktails.flatMap(item => [...item.readyVersions, ...item.needsReviewVersions].map(match => match.versionId)).sort(),
  }));
}
