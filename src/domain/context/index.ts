import type {Catalogue, RecipeVersion, SearchQuery} from '../contracts';
import {searchCocktails} from '../search';
import {rankWithTaste, validateTasteState, type TasteState} from '../taste';
import {
  CONTEXT_REASONS,
  OCCASIONS,
  SEASONS,
  type ContextEvidence,
  type ContextReason,
  type ContextResult,
  type ContextSelection,
} from './types';

export * from './types';

const OCCASION_VALUES = new Set<string>(OCCASIONS);
const SEASON_VALUES = new Set<string>(SEASONS);
const REASON_VALUES = new Set<string>(CONTEXT_REASONS);
const SHA256 = /^[a-f0-9]{64}$/;

export function normalizeContextSelection(value: ContextSelection): ContextSelection {
  const candidate = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const selection: ContextSelection = {};
  if (typeof candidate.occasion === 'string' && OCCASION_VALUES.has(candidate.occasion)) {
    selection.occasion = candidate.occasion as ContextSelection['occasion'];
  }
  if (typeof candidate.season === 'string' && SEASON_VALUES.has(candidate.season)) {
    selection.season = candidate.season as ContextSelection['season'];
  }
  return selection;
}

export function rankForContext(
  catalogue: Catalogue,
  query: SearchQuery,
  taste: TasteState,
  selectionValue: ContextSelection,
  evidence: readonly ContextEvidence[],
): ContextResult[] {
  const selection = normalizeContextSelection(selectionValue);
  if (!selection.occasion && !selection.season) {
    return rankWithTaste(catalogue, query, taste).map((result) => ({
      ...result,
      contextReasons: [],
      contextScore: 0,
    }));
  }

  const validatedTaste = validateTasteState(taste);
  const searched = searchCocktails(catalogue, query);
  const cocktails = indexFirst(catalogue.cocktails);
  const versions = indexFirst(catalogue.versions);
  const evidenceByVersion = validEvidenceByVersion(versions, evidence);
  const candidatesByCocktail = new Map<string, VersionContext[]>();
  const bestScoreByCocktail = new Map<string, number>();

  for (const result of searched) {
    const candidates = result.versionIds.flatMap((versionId) => {
      const version = versions.get(versionId);
      return version
        ? [contextForVersion(version, selection, evidenceByVersion.get(versionId) ?? [])]
        : [];
    });
    const bestScore = candidates.reduce(
      (highest, candidate) => Math.max(highest, candidate.score),
      0,
    );
    candidatesByCocktail.set(result.cocktailId, candidates);
    bestScoreByCocktail.set(result.cocktailId, bestScore);
  }

  const scores = [...new Set(bestScoreByCocktail.values())].sort((left, right) => right - left);
  const searchedByCocktail = new Map(searched.map((result) => [result.cocktailId, result]));
  const ranked: ContextResult[] = [];

  for (const score of scores) {
    const tierCocktails = searched
      .filter((result) => bestScoreByCocktail.get(result.cocktailId) === score)
      .flatMap((result) => {
        const cocktail = cocktails.get(result.cocktailId);
        const candidates = candidatesByCocktail.get(result.cocktailId) ?? [];
        const versionIds = candidates
          .filter((candidate) => candidate.score === score)
          .map((candidate) => candidate.versionId);
        if (!cocktail || versionIds.length === 0) return [];
        return [{
          ...cocktail,
          versionIds,
          defaultVersionId: versionIds.includes(cocktail.defaultVersionId)
            ? cocktail.defaultVersionId
            : versionIds[0]!,
        }];
      });
    const tierCatalogue: Catalogue = {...catalogue, cocktails: tierCocktails};
    const tasteRanked = rankWithTaste(tierCatalogue, query, validatedTaste);

    for (const tasteResult of tasteRanked) {
      const searchedResult = searchedByCocktail.get(tasteResult.cocktailId);
      const selected = candidatesByCocktail
        .get(tasteResult.cocktailId)
        ?.find((candidate) => candidate.versionId === tasteResult.selectedVersionId);
      if (!searchedResult || !selected) continue;
      ranked.push({
        ...searchedResult,
        selectedVersionId: tasteResult.selectedVersionId,
        memoryReasons: tasteResult.memoryReasons,
        contextReasons: selected.reasons,
        contextScore: score,
      });
    }
  }

  return ranked;
}

export function diversifyContextResults(
  catalogue: Catalogue,
  results: readonly ContextResult[],
  limit = 6,
): ContextResult[] {
  const topLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 6;
  if (results.length < 2 || topLimit === 0) return [...results];
  const cocktails = indexFirst(catalogue.cocktails);
  const versions = indexFirst(catalogue.versions);
  const ingredients = indexFirst(catalogue.ingredients);
  const ordered = results
    .map((result, index) => ({result, index}))
    .sort((left, right) => right.result.contextScore - left.result.contextScore || left.index - right.index);
  const diversified: ContextResult[] = [];

  for (let start = 0; start < ordered.length;) {
    const contextScore = ordered[start]!.result.contextScore;
    let end = start + 1;
    while (end < ordered.length && ordered[end]!.result.contextScore === contextScore) end += 1;
    const tier = ordered.slice(start, end).map(({result}) => result);
    const availableTopSlots = Math.max(0, topLimit - diversified.length);
    const selectionCount = Math.min(tier.length, availableTopSlots);

    if (selectionCount === 0) {
      diversified.push(...tier);
      start = end;
      continue;
    }

    const remaining = tier.map((result, index) => ({result, index}));
    const selected: ContextResult[] = [];
    const seenBases = new Set<string>();
    const seenFlavours = new Set<string>();
    let hasClassic = false;

    while (selected.length < selectionCount) {
      let bestIndex = 0;
      let bestDiversity = Number.NEGATIVE_INFINITY;
      for (let index = 0; index < remaining.length; index += 1) {
        const candidate = remaining[index]!;
        const profile = resultProfile(candidate.result, cocktails, versions, ingredients);
        const diversity =
          (!hasClassic && profile.classic ? 3 : 0) +
          (profile.base && !seenBases.has(profile.base) ? 4 : 0) +
          (profile.flavour && !seenFlavours.has(profile.flavour) ? 2 : 0);
        if (diversity > bestDiversity) {
          bestDiversity = diversity;
          bestIndex = index;
        }
      }
      const [choice] = remaining.splice(bestIndex, 1);
      if (!choice) break;
      selected.push(choice.result);
      const profile = resultProfile(choice.result, cocktails, versions, ingredients);
      if (profile.base) seenBases.add(profile.base);
      if (profile.flavour) seenFlavours.add(profile.flavour);
      hasClassic ||= profile.classic;
    }

    diversified.push(...selected, ...remaining.sort((a, b) => a.index - b.index).map(({result}) => result));
    start = end;
  }

  return diversified;
}

interface VersionContext {
  versionId: string;
  score: number;
  reasons: ContextReason[];
}

function validEvidenceByVersion(
  versions: ReadonlyMap<string, RecipeVersion>,
  evidence: readonly ContextEvidence[],
): Map<string, ContextEvidence[]> {
  const indexed = new Map<string, ContextEvidence[]>();
  for (const item of evidence) {
    if (!item || typeof item !== 'object' || item.basis !== 'editorial') continue;
    const version = versions.get(item.versionId);
    if (!version || item.sourceId !== version.sourceId || !SHA256.test(item.recipeDigest)) continue;
    const current = indexed.get(item.versionId) ?? [];
    current.push(item);
    indexed.set(item.versionId, current);
  }
  return indexed;
}

function contextForVersion(
  version: RecipeVersion,
  selection: ContextSelection,
  evidence: readonly ContextEvidence[],
): VersionContext {
  const reasons: ContextReason[] = [];
  if (selection.occasion) {
    const match = evidence.flatMap((item) => Array.isArray(item.occasions) ? item.occasions : [])
      .find((item) => item?.value === selection.occasion && REASON_VALUES.has(item.reason));
    if (match) {
      reasons.push({
        dimension: 'occasion',
        value: selection.occasion,
        code: match.reason,
        sourceId: version.sourceId,
      });
    }
  }
  if (selection.season) {
    const match = evidence.flatMap((item) => Array.isArray(item.seasons) ? item.seasons : [])
      .find((item) => item?.value === selection.season && REASON_VALUES.has(item.reason));
    if (match) {
      reasons.push({
        dimension: 'season',
        value: selection.season,
        code: match.reason,
        sourceId: version.sourceId,
      });
    }
  }
  return {versionId: version.id, score: reasons.length, reasons};
}

function resultProfile(
  result: ContextResult,
  cocktails: ReadonlyMap<string, Catalogue['cocktails'][number]>,
  versions: ReadonlyMap<string, RecipeVersion>,
  ingredients: ReadonlyMap<string, Catalogue['ingredients'][number]>,
): {classic: boolean; base?: string; flavour?: string} {
  const cocktail = cocktails.get(result.cocktailId);
  const version = versions.get(result.selectedVersionId);
  const base = version?.ingredients
    .map(({ingredientId}) => ingredients.get(ingredientId)?.base)
    .find((value) => value !== undefined && value !== 'none');
  return {
    classic: cocktail?.category === 'classic',
    ...(base ? {base} : {}),
    ...(version?.flavours[0] ? {flavour: version.flavours[0]} : {}),
  };
}

function indexFirst<T extends {id: string}>(items: readonly T[]): Map<string, T> {
  const index = new Map<string, T>();
  for (const item of items) if (!index.has(item.id)) index.set(item.id, item);
  return index;
}
