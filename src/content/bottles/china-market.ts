import data from './china-market.json';
import type {Bottle} from '../../domain/bottles/types';
import type {Brand, Ingredient} from '../../domain/contracts';

export const chinaMarketBottles = data.bottles as Bottle[];
export const chinaMarketBrands = data.brands as Brand[];
export const chinaMarketIngredients = data.ingredients as Ingredient[];
