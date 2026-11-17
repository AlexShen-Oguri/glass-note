import type {Localized} from '../contracts';
import type {MakingRecipe} from '../making/types';
export interface ShoppingCandidate {ingredientId:string;name:Localized;memberIds:string[];known:boolean}
export interface ShoppingRow {rowId:string;sourceName:Localized;candidates:ShoppingCandidate[];selectedIngredientId:string;dismissed:boolean}
export interface ShoppingTarget {id:string;fingerprint:string;recipe:MakingRecipe;rows:ShoppingRow[]}
export interface ShoppingReference {targetId:string;rowId:string}
export interface ShoppingItem extends ShoppingCandidate {id:string;bought:boolean;refs:ShoppingReference[]}
export interface ShoppingState {format:'glass-notes-shopping';schemaVersion:1;targets:ShoppingTarget[];items:ShoppingItem[]}
export const emptyShoppingState=():ShoppingState=>({format:'glass-notes-shopping',schemaVersion:1,targets:[],items:[]});
