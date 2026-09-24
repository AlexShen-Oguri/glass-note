import type {Cocktail} from '../contracts';

/** The animation is a preview; full search results remain in the results list. */
export function waterfallPreview(cocktails: readonly Cocktail[], visibleIds?: readonly string[]): Cocktail[] {
  const maximum = 24;
  const selected = new Map<string, Cocktail>();
  const byId = new Map(cocktails.map(cocktail => [cocktail.id, cocktail]));
  // Bring the first recommendations into view during the reveal.
  for (const id of (visibleIds ?? []).slice(0, 6)) {
    const cocktail = byId.get(id);
    if (cocktail) selected.set(id, cocktail);
  }
  const samples = Math.min(maximum, cocktails.length);
  for (let index = 0; index < samples && selected.size < maximum; index++) {
    const cocktail = cocktails[Math.floor(index * cocktails.length / samples)];
    if (cocktail) selected.set(cocktail.id, cocktail);
  }
  return [...selected.values()];
}
