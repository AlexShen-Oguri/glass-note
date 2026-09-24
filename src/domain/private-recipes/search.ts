import {scoreTextSearch} from '../search';
import type {PrivateRecipe, PrivateRecipeRevision} from './types';

export function activePrivateRecipeRevision(recipe: PrivateRecipe): PrivateRecipeRevision {
  const revision = recipe.revisions.find(item => item.id === recipe.activeRevisionId);
  if (!revision) throw new Error(`Private recipe ${recipe.id} has no active revision.`);
  return revision;
}

export function searchPrivateRecipes(recipes: PrivateRecipe[], query: string): PrivateRecipe[] {
  const scored = recipes.map(recipe => {
    const content = activePrivateRecipeRevision(recipe).content;
    const origin = recipe.origin.kind === 'catalogue-version'
      ? [recipe.origin.sourceTitle, recipe.origin.versionTitle]
      : recipe.origin.kind === 'lab-version'
        ? [recipe.origin.projectTitle, recipe.origin.versionTitle]
        : [];
    const fields = [content.title, content.description, content.method, content.glass, content.garnish, content.notes,
      ...content.steps, ...content.ingredients.flatMap(item => [item.name, item.brandName ?? '', item.bottleName ?? '', item.note ?? '']), ...origin];
    return {recipe, score: query.trim() ? scoreTextSearch(query, fields) : 1};
  });
  return scored.filter(item => item.score > 0).sort((left, right) => right.score - left.score
    || right.recipe.updatedAt.localeCompare(left.recipe.updatedAt) || left.recipe.id.localeCompare(right.recipe.id)).map(item => item.recipe);
}
