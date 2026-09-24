import data from './expansion-300.json';
import type {Brand, Ingredient} from '../../domain/contracts';
import type {Bottle} from '../../domain/bottles/types';
export const addedBottles = data.bottles as Bottle[];
export const addedBottleBrands = data.brands as Brand[];
export const addedBottleIngredients = data.ingredients as Ingredient[];
