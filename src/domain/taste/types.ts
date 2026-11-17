import type {Flavour, SearchResult} from '../contracts';
import type {MakingRecipe} from '../making/types';

export interface TasteFeedback {
  id:string;
  recipe:MakingRecipe;
  createdAt:string;
  updatedAt:string;
  experience:'drank'|'made'|'both';
  sentiment:'neutral'|'like'|'dislike';
  tooSweet:boolean;
  tooStrong:boolean;
  likedFlavours:Flavour[];
  notes:string;
}
export interface TasteState {format:'glass-notes-taste';schemaVersion:1;entries:TasteFeedback[]}
export const emptyTasteState=():TasteState=>({format:'glass-notes-taste',schemaVersion:1,entries:[]});
export type TasteFeedbackInput=Pick<TasteFeedback,'experience'|'sentiment'|'tooSweet'|'tooStrong'|'likedFlavours'|'notes'>;
export interface TasteSignal {supportCount:number;weight:number;feedbackIds:string[]}
export interface TasteFlavourSignal extends TasteSignal {flavour:Flavour}
/** A local derived view; signal weights describe ranking influence, not prediction accuracy. */
export interface TasteProfile {
  ratedRecipeCount:number;
  featureRecipeCount:number;
  flavours:TasteFlavourSignal[];
  sweetness:TasteSignal|null;
  strength:TasteSignal|null;
}
export type MemoryReasonKind='liked-version'|'disliked-version'|'liked-flavour'|'less-sweet'|'less-strong'|'sweet-caution'|'strong-caution';
export interface MemoryReason {kind:MemoryReasonKind;feedbackIds:string[];flavours?:Flavour[];supportCount?:number}
export interface TasteResult extends SearchResult {memoryReasons:MemoryReason[]}
