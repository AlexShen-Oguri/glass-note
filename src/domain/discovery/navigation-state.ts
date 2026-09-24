export type PrimaryNavigationSection = 'explore' | 'cabinet' | 'professional' | 'my';
export type RecipeNavigationSource = 'customize' | 'discover' | 'find' | 'ingredients' | 'favorites' | 'professional' | 'welcome' | 'pantry';
type RouteParameter = string | string[] | undefined;

const recipeSources: readonly RecipeNavigationSource[] = ['customize', 'discover', 'find', 'ingredients', 'favorites', 'professional', 'welcome','pantry'];

function firstParameter(value: RouteParameter) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseRecipeRouteParams(params: {id?: RouteParameter; version?: RouteParameter; from?: RouteParameter}) {
  const id = firstParameter(params.id) ?? '';
  const version = firstParameter(params.version) || undefined;
  const requestedSource = firstParameter(params.from) === 'find' ? 'discover' : firstParameter(params.from);
  const from = recipeSources.includes(requestedSource as RecipeNavigationSource)
    ? requestedSource as RecipeNavigationSource
    : 'discover';
  return {id, version, from};
}

export function recipeReturnPath(from: RecipeNavigationSource): '/' | '/discover' | '/customize' | '/ingredients' | '/favorites' | '/professional' | '/pantry' {
  if (from === 'find') return '/discover';
  if (from === 'pantry') return '/pantry';
  if (from === 'welcome') return '/';
  if (from === 'discover') return '/discover';
  if (from === 'ingredients') return '/ingredients';
  if (from === 'favorites') return '/favorites';
  if (from === 'professional') return '/professional';
  return '/customize';
}

function normalizedPath(pathname: string) {
  const path = pathname.split(/[?#]/, 1)[0]?.replace(/\/+$/, '') || '/';
  return path.startsWith('/') ? path : `/${path}`;
}

function isRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function primarySectionForPath(pathname: string, source?: string): PrimaryNavigationSection | null {
  const path = normalizedPath(pathname);
  if (isRoute(path, '/cocktails')) {
    if (source === 'favorites') return 'my';
    if (source === 'ingredients'||source==='pantry') return 'cabinet';
    if (source === 'professional') return 'professional';
    return 'explore';
  }
  if (isRoute(path, '/discover') || isRoute(path, '/find') || isRoute(path, '/order')) return 'explore';
  if (isRoute(path, '/pantry') || isRoute(path, '/ingredients') || isRoute(path,'/make')) return 'cabinet';
  if (isRoute(path, '/professional') || isRoute(path, '/lab') || isRoute(path, '/topics') || isRoute(path, '/bottles')) return 'professional';
  if (isRoute(path, '/my') || isRoute(path, '/favorites') || isRoute(path, '/my-recipes') || isRoute(path, '/backup') || isRoute(path, '/taste') || isRoute(path, '/help')) return 'my';
  return null;
}

export function shouldShowPrimaryNavigation(pathname: string) {
  const path = normalizedPath(pathname);
  return path !== '/' && !isRoute(path, '/customize');
}

export function collectionCountState(hydrated: boolean, readAvailable: boolean): 'value' | 'loading' | 'unavailable' {
  if (hydrated) return 'value';
  return readAvailable ? 'loading' : 'unavailable';
}
