import type {Catalogue, Locale, MeasureUnit, RecipeVersion, Source, Localized} from '../contracts';
import type {Pantry} from '../ingredients/types';
import type {Bottle} from '../bottles/types';
import type {RecipePreparation} from '../preparations/types';

export type StockUnit = 'ml'|'oz'|'g'|'piece';
/** One explicitly measured supply per ingredient. Absent entry means unknown, never a full bottle. */
export interface StockEntry {ingredientId:string; amount:number; unit:StockUnit; bottleId?:string}
export interface ReadinessReview {versionId:string; fingerprint:string; toolsConfirmed:boolean; preparationConfirmed:boolean}
export interface MakingRecipe {version:RecipeVersion; title:Localized; source:Source; ingredientNames:Record<string,Localized>; brandNames:Record<string,string>; preparation?:RecipePreparation}
export interface MakingAssumptions {
  /** All calculator inputs apply to the displayed batch, not to a single source serving. */
  volumeMl:Record<string,number>; abv:Record<string,number>; dilutionMl:number|null;
  bottleIds:Record<string,string>;
}
export interface MakingSession {
  id:string; consumptionId:string; recipe:MakingRecipe; fingerprint:string; servings:number;
  checkedRows:string[]; stepIndex:number; completed:boolean; consumptionApplied:boolean;
  startedAt:string; updatedAt:string; assumptions:MakingAssumptions;
}
export interface MakingState {
  format:'glass-notes-making'; schemaVersion:1;
  stock:StockEntry[]; reviews:ReadinessReview[]; sessions:MakingSession[];
}
export interface MakingContext {catalogue:Catalogue; pantry:Pantry; ownedBottleIds:readonly string[]; bottles:readonly Bottle[]; making:MakingState}
export type FeasibilityIssue = 'missing'|'insufficient'|'quantity-unknown'|'unit-incompatible'|'brand-unconfirmed'|'bottle-unconfirmed'|'preparation-gap'|'preparation-unconfirmed'|'tools-unconfirmed'|'unknown-ingredient'|'amount-unknown';
export interface RowAvailability {rowId:string; ingredientId:string; optional:boolean; required:number|null; unit:MeasureUnit; issues:FeasibilityIssue[]}
export interface VersionAvailability {
  cocktailId:string; versionId:string; status:'ready'|'missing'|'check';
  rows:RowAvailability[]; issues:FeasibilityIssue[]; missingIngredientIds:string[];
}
export interface RestockSuggestion {ingredientId:string; readyCocktailIds:string[]; reviewCocktailIds:string[]; versionIds:string[]}
export interface ScaledRow {rowId:string; ingredientId:string; amount:number|null; unit:MeasureUnit; optional:boolean; linear:boolean}
export interface AbvResult {status:'estimated'|'incomplete'; abv:number|null; alcoholMl:number; totalMl:number; missingRowIds:string[]; dilutionUnknown:boolean}
export interface ConsumptionPlan {sessionId:string; fingerprint:string; before:StockEntry[]; after:StockEntry[]; deductions:Array<{ingredientId:string;amount:number;unit:StockUnit}>; skippedRowIds:string[]}
export const emptyMakingState = ():MakingState => ({format:'glass-notes-making',schemaVersion:1,stock:[],reviews:[],sessions:[]});
export type MakingLocale = Locale;
