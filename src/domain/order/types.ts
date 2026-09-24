import type {Flavour,Locale,MeasureUnit,Strength,UnitPreference} from '../contracts';

export type OrderTextMode='localized'|'original';
export type OrderModificationKind='brand-substitution'|'explicit';

export interface OrderCardInput {
  locale:Locale;
  textMode:OrderTextMode;
  unitPreference:UnitPreference;
  bottleIdsByRow:Record<string,string>;
  modificationsByRow:Record<string,string>;
}
export interface OrderBottleChoice {
  id:string;
  brandId:string;
  brandName:string;
  name:string;
  /** Transient card presentation; canonical identity remains in name/brandName. */
  displayName?:string;
}
export interface OrderIngredientRow {
  rowId:string;
  ingredientId:string;
  ingredientName:string;
  amount:string;
  unit:MeasureUnit;
  optional:boolean;
  sourceNote?:string;
  sourceBrandName?:string;
  selectedBottle?:OrderBottleChoice;
  explicitModification?:string;
  modificationKinds:OrderModificationKind[];
}
export interface OrderCard {
  cocktailId:string;
  versionId:string;
  sourceId:string;
  sourceTitle:string;
  sourceUrl:string;
  locale:Locale;
  textLocale:Locale;
  requestedOriginal:boolean;
  originalAvailable:boolean;
  actualOriginal:boolean;
  title:string;
  /** Source-language title retained for concise cards when the display locale differs. */
  originalTitle?:string;
  versionTitle:string;
  servings:number;
  rows:OrderIngredientRow[];
  steps:string[];
  glass:string;
  garnish:string;
  flavours:Flavour[];
  strength:Strength|null;
  profileBasis:'editorial'|'source';
  profileNote:string;
  sourceChecked:true;
  translationStatus:'draft'|'reviewed';
  /** A public recipe snapshot has no exact finished-drink ABV field. */
  abv:null;
}
export interface OrderCardFormatCopy {
  version:string;
  source:string;
  servings:string;
  ingredients:string;
  steps:string;
  glass:string;
  garnish:string;
  flavours:string;
  strength:string;
  profile:string;
  profileBasis:string;
  sourceProfile:string;
  editorialProfile:string;
  translationStatus:string;
  draft:string;
  reviewed:string;
  abv:string;
  unknown:string;
  sourceBrand:string;
  bottle:string;
  modification:string;
  brandSubstitution:string;
  optional:string;
  original:string;
  formatUnit:(unit:MeasureUnit)=>string;
  formatFlavour:(flavour:Flavour)=>string;
  formatStrength:(strength:Strength)=>string;
}

export class OrderCardError extends Error {
  readonly code:'invalid-input'|'invalid-recipe'|'unverified-source'|'unknown-row'|'unknown-bottle'|'incompatible-bottle';
  constructor(code:OrderCardError['code'],message:string){super(message);this.name='OrderCardError';this.code=code;}
}
