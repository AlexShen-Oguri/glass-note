import data from './mixed-drinks.json';
import preparations from './mixed-drinks-preparations.json';
import names from './mixed-drinks-names.json';
import {mixedDrinkIngredients} from './mixed-drinks-ingredients';
import type {CatalogueBatch} from './types';
import type {RecipePreparation} from '../../domain/preparations/types';
import type {Localized} from '../../domain/contracts';

// The research compiler is development-only; shipped data has no network dependency.
export const mixedDrinksCatalogue:CatalogueBatch={...data,ingredients:mixedDrinkIngredients,brands:[]} as CatalogueBatch;
export const mixedDrinkPreparations=preparations as RecipePreparation[];
export const mixedDrinkNames:Record<string,Partial<Localized>>=names;
