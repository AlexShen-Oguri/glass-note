import type {Brand, Catalogue, Ingredient, MaterialConcept, RecipeMaterialRequirement, RecipeVersion} from '../contracts';
import {recipeMaterialRequirement,materialRequirementMatchesRow} from '../../content/ingredients/concepts';
import {ingredientEntries} from './index';
import type {IngredientEntry, MaterialResolution, Pantry, RecipeMaterialResolution} from './types';
export type {RecipeMaterialResolution} from './types';

function validConcept(catalogue:Catalogue,concept:MaterialConcept):boolean{
  return concept.memberIds.includes(concept.id)&&catalogue.ingredients.some(item=>item.id===concept.id)
    &&(concept.kind!=='unreviewed'||concept.memberIds.length===1);
}
function conceptFor(catalogue: Catalogue, id: string): MaterialConcept | undefined {
  if (!catalogue.ingredients.some(item => item.id === id)) return undefined;
  return catalogue.materialConcepts?.find(concept =>
    concept.memberIds.includes(id)&&validConcept(catalogue,concept),
  );
}

export function canonicalIngredientId(catalogue: Catalogue, id: string): string {
  return conceptFor(catalogue, id)?.id ?? id;
}

export function canonicalMemberIds(catalogue: Catalogue, id: string): string[] {
  const concept = conceptFor(catalogue, id);
  if (!concept) return [id];
  const known = new Set(catalogue.ingredients.map(item => item.id));
  return [...new Set(concept.memberIds.filter(member => known.has(member)))];
}

export function resolveMaterial(
  catalogue: Catalogue,
  requiredIngredientId: string,
  ownedIngredientIds: readonly string[],
): MaterialResolution {
  return compileMaterialResolver(catalogue).resolveMaterial(requiredIngredientId, ownedIngredientIds);
}

export function canonicalOwned(catalogue: Catalogue, pantry: Pantry, id: string): boolean {
  const members = new Set(canonicalMemberIds(catalogue, id));
  return pantry.ingredientIds.some(member => members.has(member));
}

/** Alternatives are accepted only for this unchanged source row, never globally. */
export function resolveRecipeMaterial(catalogue:Catalogue,version:RecipeVersion,rowIndex:number,ownedIngredientIds:readonly string[]):RecipeMaterialResolution{
  return compileMaterialResolver(catalogue).resolveRecipeMaterial(version, rowIndex, ownedIngredientIds);
}

export interface MaterialResolver {
  ingredients: ReadonlyMap<string, Ingredient>;
  brands: ReadonlyMap<string, Brand>;
  resolveMaterial(requiredIngredientId: string, ownedIngredientIds: readonly string[]): MaterialResolution;
  resolveRecipeMaterial(version: RecipeVersion, rowIndex: number, ownedIngredientIds: readonly string[]): RecipeMaterialResolution;
}

/** Reuse only within one synchronous catalogue operation; public calls compile fresh. */
export function compileMaterialResolver(catalogue: Catalogue): MaterialResolver {
  const ingredients = new Map(catalogue.ingredients.map(item => [item.id, item]));
  const brands = new Map(catalogue.brands.map(item => [item.id, item]));
  const memberships = new Map<string, {id: string; kind: MaterialConcept['kind']; members: Set<string>}>();
  for (const concept of catalogue.materialConcepts ?? []) {
    if (!ingredients.has(concept.id) || !concept.memberIds.includes(concept.id)
      || (concept.kind === 'unreviewed' && concept.memberIds.length !== 1)) continue;
    const compiled = {id: concept.id, kind: concept.kind, members: new Set(concept.memberIds.filter(id => ingredients.has(id)))};
    for (const id of compiled.members) if (!memberships.has(id)) memberships.set(id, compiled);
  }
  const versions = new Map<string, RecipeVersion>();
  for (const version of catalogue.versions) if (!versions.has(version.id)) versions.set(version.id, version);
  const requirements = new Map<string, RecipeMaterialRequirement>();
  for (const requirement of catalogue.materialRequirements ?? []) {
    const row = versions.get(requirement.versionId)?.ingredients[requirement.rowIndex];
    const key = `${requirement.versionId}\u0000${requirement.rowIndex}`;
    if (row && !requirements.has(key) && materialRequirementMatchesRow(requirement, row)) requirements.set(key, requirement);
  }
  const material = (requiredIngredientId: string, ownedIngredientIds: readonly string[]): MaterialResolution => {
    const concept = memberships.get(requiredIngredientId);
    const supplyIngredientIds = ingredients.has(requiredIngredientId)
      ? [...new Set(ownedIngredientIds.filter(id => ingredients.has(id)
        && (concept ? concept.members.has(id) : id === requiredIngredientId)))] : [];
    return {requiredIngredientId, canonicalId: concept?.id ?? requiredIngredientId, supplyIngredientIds,
      match: !supplyIngredientIds.length ? 'missing' : supplyIngredientIds.includes(requiredIngredientId) ? 'exact'
        : concept?.kind === 'pure-spirit' ? 'style' : 'equivalent'};
  };
  return {ingredients, brands, resolveMaterial: material,
    resolveRecipeMaterial(version, rowIndex, ownedIngredientIds) {
      const row = version.ingredients[rowIndex]!;
      const indexed = requirements.get(`${version.id}\u0000${rowIndex}`);
      const requirement = indexed && materialRequirementMatchesRow(indexed, row) ? indexed : undefined;
      const resolutions = (requirement?.acceptedIngredientIds?.length ? requirement.acceptedIngredientIds : [row.ingredientId])
        .map(id => material(id, ownedIngredientIds));
      const matched = resolutions.filter(item => item.match !== 'missing');
      const first = matched[0] ?? resolutions[0]!;
      return {requiredIngredientId: row.ingredientId, canonicalId: first.canonicalId,
        candidateIngredientIds: [...new Set(resolutions.map(item => item.canonicalId))],
        supplyIngredientIds: [...new Set(matched.flatMap(item => item.supplyIngredientIds))],
        match: !matched.length ? 'missing' : first.requiredIngredientId === row.ingredientId ? first.match : 'equivalent'};
    },
  };
}

/** Enumerate the smallest one/two-item supplies that cover every unmet source row. */
export function materialPurchaseOptions(
  unmetRows: readonly Pick<RecipeMaterialResolution, 'candidateIngredientIds'>[],
  maximum: 1 | 2 = 2,
): Array<[string] | [string, string]> {
  if (!unmetRows.length) return [];
  const choices = new Map<string, [string] | [string, string]>();
  const complete = (ids: string[]) => unmetRows.every(row => row.candidateIngredientIds.some(id => ids.includes(id)));
  for (const first of unmetRows[0]!.candidateIngredientIds) {
    if (complete([first])) {
      choices.set(first, [first]);
      continue;
    }
    if (maximum === 1) continue;
    const uncovered = unmetRows.find(row => !row.candidateIngredientIds.includes(first))!;
    for (const second of uncovered.candidateIngredientIds) {
      if (!complete([first, second]) || complete([second])) continue;
      choices.set([first, second].sort().join('\u0000'), [first, second]);
    }
  }
  return [...choices.values()].sort((a, b) => a.length - b.length);
}

export function setCanonicalOwned(catalogue: Catalogue, pantry: Pantry, id: string, owned: boolean): Pantry {
  if (owned) {
    return canonicalOwned(catalogue, pantry, id)
      ? pantry
      : {...pantry, ingredientIds: [...pantry.ingredientIds, canonicalIngredientId(catalogue, id)]};
  }
  const members = new Set(canonicalMemberIds(catalogue, id));
  return {
    ingredientIds: pantry.ingredientIds.filter(member => !members.has(member)),
    brandsByIngredient: Object.fromEntries(Object.entries(pantry.brandsByIngredient).filter(([member]) => !members.has(member))),
  };
}

export function canonicalIngredientEntries(catalogue: Catalogue): IngredientEntry[] {
  const originalEntries = ingredientEntries(catalogue);
  if (!catalogue.materialConcepts?.length && !catalogue.materialRequirements?.length) return originalEntries;
  const originals = new Map(originalEntries.map(entry => [entry.ingredient.id, entry]));
  const concepts = new Map<string, MaterialConcept>();
  for (const concept of catalogue.materialConcepts ?? []) {
    if (!validConcept(catalogue,concept)) continue;
    for (const member of concept.memberIds) if (originals.has(member)) concepts.set(member, concept);
  }
  const groups = new Map<string, IngredientEntry[]>();
  for (const entry of originalEntries) {
    const id = concepts.get(entry.ingredient.id)?.id ?? entry.ingredient.id;
    const group = groups.get(id) ?? [];
    group.push(entry);
    groups.set(id, group);
  }
  const usage = new Map<string, Set<string>>();
  for (const version of catalogue.versions) for (const [rowIndex, row] of version.ingredients.entries()) {
    const requirement = recipeMaterialRequirement(catalogue, version.id, rowIndex);
    for (const member of [row.ingredientId, ...(requirement?.acceptedIngredientIds ?? [])]) {
      if (!originals.has(member)) continue;
      const id = concepts.get(member)?.id ?? member;
      const versions = usage.get(id) ?? new Set<string>();
      versions.add(version.id);
      usage.set(id, versions);
    }
  }
  return [...groups].map(([id, entries]) => {
    const representative = originals.get(id) ?? entries[0]!;
    const concept = concepts.get(entries[0]!.ingredient.id);
    const memberIds = entries.map(entry => entry.ingredient.id);
    const versions = catalogue.versions.filter(version => usage.get(id)?.has(version.id));
    return {
      ...representative,
      ingredient: concept ? {...representative.ingredient, id, name: concept.name} : representative.ingredient,
      versions,
      cocktailIds: [...new Set(versions.map(version => version.cocktailId))],
      sourceIds: [...new Set(versions.map(version => version.sourceId))],
      brandIds: [...new Set(entries.flatMap(entry => entry.brandIds))],
      memberIds,
      searchNames: [...new Set(entries.flatMap(entry => [entry.ingredient.id, ...Object.values(entry.ingredient.name), ...(entry.ingredient.guide?.aliases ?? [])]))],
    };
  });
}
