import type {Brand, Ingredient} from '../../domain/contracts';

// Canonical names come from the first reviewed entry; associations are combined.
export function mergeIngredients(...groups: Ingredient[][]): Ingredient[] {
  const result = new Map<string, Ingredient>();
  for (const item of groups.flat()) {
    const previous = result.get(item.id);
    if (!previous) { result.set(item.id, {...item}); continue; }
    if (previous.base !== item.base || previous.compositionKnown !== item.compositionKnown ||
      [...previous.exclusionTags].sort().join() !== [...item.exclusionTags].sort().join()) {
      throw new Error(`Conflicting ingredient facts: ${item.id}`);
    }
    if (previous.brandIds || item.brandIds) {
      previous.brandIds = [...new Set([...(previous.brandIds ?? []), ...(item.brandIds ?? [])])];
    }
  }
  return [...result.values()];
}

export function mergeBrands(...groups: Brand[][]): Brand[] {
  const result = new Map<string, Brand>();
  for (const item of groups.flat()) {
    const previous = result.get(item.id);
    if (previous && previous.name !== item.name) throw new Error(`Conflicting brand: ${item.id}`);
    result.set(item.id, {...item, ingredientIds: [...new Set([...(previous?.ingredientIds ?? []), ...item.ingredientIds])]});
  }
  return [...result.values()];
}
