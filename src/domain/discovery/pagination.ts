import type {Locale, SearchQuery} from '../contracts';

export const DISCOVERY_UNFILTERED_INITIAL_LIMIT = 24;
export const DISCOVERY_FILTERED_INITIAL_LIMIT = 6;
export const DISCOVERY_LOAD_MORE_BATCH = 24;

export interface DiscoveryPaginationState {
  fingerprint: string;
  limit: number;
  scrollY: number;
}

export function hasDiscoveryFilters(query: SearchQuery) {
  return Boolean(
    query.preparationDisclosed ||
    query.recipeCategory ||
    query.collection ||
    query.text?.trim() ||
    query.bases?.length ||
    query.ingredientIds?.length ||
    query.excludedIngredientIds?.length ||
    query.methods?.length ||
    query.brandIds?.length ||
    query.flavours?.length ||
    query.tastes?.length ||
    query.strengths?.length ||
    query.approachability?.length ||
    query.excluded?.length
  );
}

function normalizedValues(values?: readonly string[]) {
  return values?.length ? [...new Set(values)].sort() : undefined;
}

/** The locale is part of the view because localized text search can change result order. */
export function discoveryQueryFingerprint(query: SearchQuery, locale: Locale) {
  return JSON.stringify({
    locale,
    text: query.text?.trim() || undefined,
    preparationDisclosed: query.preparationDisclosed || undefined,
    collection: query.collection,
    recipeCategory: query.recipeCategory,
    bases: normalizedValues(query.bases),
    ingredientIds: normalizedValues(query.ingredientIds),
    ingredientMode: query.ingredientIds?.length && query.ingredientMode === 'any'
      ? 'any'
      : undefined,
    excludedIngredientIds: normalizedValues(query.excludedIngredientIds),
    methods: normalizedValues(query.methods),
    brandIds: normalizedValues(query.brandIds),
    flavours: normalizedValues(query.flavours),
    tastes: normalizedValues(query.tastes),
    strengths: normalizedValues(query.strengths),
    approachability: normalizedValues(query.approachability),
    excluded: normalizedValues(query.excluded),
  });
}

export function initialDiscoveryLimit(query: SearchQuery) {
  return hasDiscoveryFilters(query)
    ? DISCOVERY_FILTERED_INITIAL_LIMIT
    : DISCOVERY_UNFILTERED_INITIAL_LIMIT;
}

export function paginationForQuery(
  previous: DiscoveryPaginationState | undefined,
  query: SearchQuery,
  locale: Locale,
): DiscoveryPaginationState {
  const fingerprint = discoveryQueryFingerprint(query, locale);
  if (previous?.fingerprint === fingerprint) return previous;
  return {fingerprint, limit: initialDiscoveryLimit(query), scrollY: 0};
}

export function nextDiscoveryLimit(current: number, total: number) {
  return Math.min(total, current + DISCOVERY_LOAD_MORE_BATCH);
}

export function loadMoreDiscoveryPage(state: DiscoveryPaginationState, total: number): DiscoveryPaginationState {
  return {...state, limit: nextDiscoveryLimit(state.limit, total)};
}
