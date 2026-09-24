import data from './expanded.json';
import type {Brand,Ingredient} from '../../domain/contracts';
import type {Bottle} from '../../domain/bottles/types';
export const expandedBottles=data.bottles as Bottle[];
export const expandedBottleBrands=data.brands as Brand[];
export const expandedBottleIngredients=data.ingredients as Ingredient[];
