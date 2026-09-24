import type {Catalogue, SearchQuery} from '../contracts';
import {
  diversifyContextResults,
  rankForContext,
  type ContextEvidence,
  type ContextResult,
  type ContextSelection,
} from '../context';
import {
  evaluateOwnedVersion,
  type OwnedVersionMatch,
} from '../ingredients/presence';
import type {Pantry} from '../ingredients/types';
import {searchCocktails} from '../search';
import type {TasteState} from '../taste';

export interface PantryContextResult extends ContextResult {
  pantryMatch: OwnedVersionMatch;
}

interface CocktailCandidates {
  cocktailId: string;
  baseReady: boolean;
  missingCount: number;
  matches: OwnedVersionMatch[];
}

export function rankForPantry(
  catalogue: Catalogue,
  query: SearchQuery,
  taste: TasteState,
  selection: ContextSelection,
  evidence: readonly ContextEvidence[],
  pantry: Pantry,
): PantryContextResult[] {
  if (pantry.ingredientIds.length === 0) return [];

  const versions = new Map(catalogue.versions.map((version) => [version.id, version]));
  const cocktails = new Map(catalogue.cocktails.map((cocktail) => [cocktail.id, cocktail]));
  const candidates: CocktailCandidates[] = [];

  for (const searched of searchCocktails(catalogue, query)) {
    const eligible = searched.versionIds.flatMap((versionId) => {
      const version = versions.get(versionId);
      if (!version) return [];
      const match = evaluateOwnedVersion(catalogue, version, pantry);
      return match && match.missingIngredientIds.length < 3 ? [match] : [];
    });
    if (eligible.length === 0) continue;

    const baseReady = eligible.some((match) => match.baseReady);
    const baseTier = eligible.filter((match) => match.baseReady === baseReady);
    const missingCount = Math.min(...baseTier.map((match) => match.missingIngredientIds.length));
    candidates.push({
      cocktailId: searched.cocktailId,
      baseReady,
      missingCount,
      matches: baseTier.filter((match) => match.missingIngredientIds.length === missingCount),
    });
  }

  candidates.sort((left, right) =>
    Number(right.baseReady) - Number(left.baseReady)
    || left.missingCount - right.missingCount,
  );

  const ranked: PantryContextResult[] = [];
  for (let start = 0; start < candidates.length;) {
    const first = candidates[start]!;
    let end = start + 1;
    while (
      end < candidates.length
      && candidates[end]!.baseReady === first.baseReady
      && candidates[end]!.missingCount === first.missingCount
    ) end += 1;

    const tier = candidates.slice(start, end);
    const matchByVersion = new Map(tier.flatMap((candidate) =>
      candidate.matches.map((match) => [match.versionId, match] as const)));
    const tierCocktails = tier.flatMap((candidate) => {
      const cocktail = cocktails.get(candidate.cocktailId);
      if (!cocktail) return [];
      const versionIds = candidate.matches.map((match) => match.versionId);
      return [{
        ...cocktail,
        versionIds,
        defaultVersionId: versionIds.includes(cocktail.defaultVersionId)
          ? cocktail.defaultVersionId
          : versionIds[0]!,
      }];
    });
    const tierCatalogue: Catalogue = {...catalogue, cocktails: tierCocktails};
    for (const result of rankForContext(tierCatalogue, query, taste, selection, evidence)) {
      const pantryMatch = matchByVersion.get(result.selectedVersionId);
      if (pantryMatch) ranked.push({...result, pantryMatch});
    }
    start = end;
  }

  return ranked;
}

export function diversifyPantryResults(
  catalogue: Catalogue,
  results: readonly PantryContextResult[],
  limit = 6,
): PantryContextResult[] {
  const topLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 6;
  const diversified: PantryContextResult[] = [];

  for (let start = 0; start < results.length;) {
    const first = results[start]!;
    const baseReady = first.pantryMatch.baseReady;
    const missingCount = first.pantryMatch.missingIngredientIds.length;
    let end = start + 1;
    while (
      end < results.length
      && results[end]!.pantryMatch.baseReady === baseReady
      && results[end]!.pantryMatch.missingIngredientIds.length === missingCount
    ) end += 1;

    const tier = results.slice(start, end);
    const availableSlots = Math.max(0, topLimit - diversified.length);
    diversified.push(...diversifyContextResults(catalogue, tier, availableSlots) as PantryContextResult[]);
    start = end;
  }

  return diversified;
}
