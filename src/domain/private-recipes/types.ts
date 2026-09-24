import type {Locale} from '../contracts';
import type {LabSource} from '../lab/types';

export const PRIVATE_RECIPES_STORAGE_KEY = 'glass-notes.private-recipes.v1';
export interface PrivateIngredient {
  id: string; name: string; amount: string; unit: string;
  ingredientId?: string; brandId?: string; brandName?: string;
  bottleId?: string; bottleName?: string; note?: string; optional?: boolean;
}
export interface PrivateRecipeContent {
  /** User-selected, locally re-encoded JPEG; never a source photograph claim. */
  photo?: string;
  title: string; description: string; servings: number; ingredients: PrivateIngredient[];
  steps: string[]; method: string; glass: string; garnish: string; notes: string;
}
export type PrivateRecipeOrigin = {kind:'original'} | {
  kind:'catalogue-version'; cocktailId:string; versionId:string; sourceId:string;
  sourceTitle:string; sourceUrl:string; sourceAuthor?:string; versionTitle:string;
  capturedAt:string; capturedLocale:Locale; snapshot:PrivateRecipeContent;
} | {
  kind:'lab-version'; projectId:string; versionId:string; batchId?:string;
  projectTitle:string; versionTitle:string; capturedAt:string;
  snapshot:PrivateRecipeContent; source?:LabSource;
};
export interface PrivateRecipeRevision {
  id:string; createdAt:string; derivedFromRevisionId?:string; content:PrivateRecipeContent;
}
export interface PrivateRecipe {
  id:string; private:true; createdAt:string; updatedAt:string;
  origin:PrivateRecipeOrigin; activeRevisionId:string; revisions:PrivateRecipeRevision[];
  importedFromId?:string;
}
export interface PrivateRecipeBook {
  format:'glass-notes-private-recipes'; schemaVersion:1|2; recipes:PrivateRecipe[];
}
