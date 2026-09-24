import data from './batch-m.json';
import preparations from './batch-m-preparations.json';
import names from './batch-m-names.json';
import {mIngredients} from './batch-m-ingredients';
import type {CatalogueBatch} from './types';
import type {RecipePreparation} from '../../domain/preparations/types';
import type {Localized} from '../../domain/contracts';

// The research compiler is development-only; shipped data has no network dependency.
export const batchM:CatalogueBatch={...data,ingredients:mIngredients,brands:[]} as CatalogueBatch;
export const batchMPreparations=preparations as RecipePreparation[];
export const batchMNames:Record<string,Partial<Localized>>=names;
