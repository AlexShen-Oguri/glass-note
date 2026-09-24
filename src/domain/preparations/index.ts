import {recipePreparations} from '../../content/preparations';
import type {RecipePreparation} from './types';

const preparationByVersion = new Map(recipePreparations.map(record => [record.versionId, record]));

export function getRecipePreparation(versionId: string): RecipePreparation | undefined {
  return preparationByVersion.get(versionId);
}

export function preparationStatus(versionId: string): RecipePreparation['status'] | 'unreviewed' {
  return getRecipePreparation(versionId)?.status ?? 'unreviewed';
}

export function needsPreparationReview(versionId: string): boolean {
  const status = preparationStatus(versionId);
  return status === 'partial' || status === 'inspiration';
}

export type {PreparationCard, RecipePreparation} from './types';
