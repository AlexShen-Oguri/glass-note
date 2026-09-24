import type {Ingredient, IngredientFamily, IngredientGuide, Locale, Localized} from '../../domain/contracts';
import {LOCALES} from '../../domain/contracts';
import data from './records.json';
import translated from './translations.json';

export interface MaterialRecord {
  id: string;
  existingId?: string;
  sourceId: string;
  sourceLine: number;
  sourcePath?: string;
  names: Localized;
  aliases: string[];
  parents: string[];
  family: IngredientFamily;
}
export const materialRecords = data.records as MaterialRecord[];
const drafts = translated as Record<string,Partial<Localized>>;
export const ingredientTaxonomy = {
  title:'Open Food Facts · ingredient taxonomy',
  url:`https://github.com/openfoodfacts/openfoodfacts-server/blob/${data.revision}/taxonomies/food/ingredients.txt`,
  license:'ODbL 1.0 · Database Contents License',
  licenseUrl:'https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/',
};

function guide(record:MaterialRecord): IngredientGuide {
  const nameOrigin = Object.fromEntries(LOCALES.map(locale=>[locale,drafts[record.id]?.[locale] ? 'draft' : record.names[locale] ? 'source' : 'fallback'])) as Record<Locale,'source'|'draft'|'fallback'>;
  return {family:record.family,parents:record.parents,aliases:record.aliases,nameOrigin,
    source:{...ingredientTaxonomy,url:`https://github.com/openfoodfacts/openfoodfacts-server/blob/${data.revision}/${record.sourcePath ?? 'taxonomies/food/ingredients.txt'}#L${record.sourceLine}`,recordId:record.sourceId,canonicalName:record.names.en}};
}

/** Exact identity associations only; taxonomy ancestry never satisfies recipe requirements. */
export function withIndependentIngredients(recipeIngredients:Ingredient[]): Ingredient[] {
  // A previously standalone food-* ID can become recipe-backed without changing
  // saved pantry identities or losing its original taxonomy provenance.
  const matches = new Map(materialRecords.map(r=>[r.existingId ?? r.id,r]));
  const result = recipeIngredients.map(item=>{
    const record=matches.get(item.id);
    if (!record) return item;
    return {...item,guide:{...guide(record),nameOrigin:undefined}};
  });
  const usedIds=new Set(result.map(i=>i.id));
  for (const record of materialRecords) {
    if (record.existingId || usedIds.has(record.id)) continue;
    const name=Object.fromEntries(LOCALES.map(locale=>[locale,drafts[record.id]?.[locale] || record.names[locale] || record.names.en])) as Localized;
    // Identification in a taxonomy is not verified product composition or allergen evidence.
    result.push({id:record.id,name,exclusionTags:[],compositionKnown:false,guide:guide(record)});
    usedIds.add(record.id);
  }
  return result;
}
