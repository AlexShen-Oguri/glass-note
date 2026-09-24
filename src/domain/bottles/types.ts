import type {Base, Locale, Localized} from '../contracts';
export interface BottleNameTranslation {
  name: string;
  /** Producer wording and editorial translations are deliberately separate. */
  basis: 'producer' | 'editorial';
  sources: {title:string;url:string;checkedAt:string;scope:'product'|'brand'}[];
}
export type BottleFamily = Exclude<Base, 'none'> | 'liqueur' | 'wine' | 'bitters' | 'pisco' | 'absinthe' | 'aquavit' | 'genever' | 'baijiu' | 'shochu' | 'soju' | 'arrack' | 'sake';
export interface Bottle {
  id: string; brandId: string; brandName: string; name: string; aliases: string[];
  /** Producer-evidenced or editorial display names; source identity stays in name/brandName. */
  nameTranslations?: Partial<Record<Locale,BottleNameTranslation>>;
  family: BottleFamily; ingredientIds: string[];
  abv: number | null; market: string;
  /** Regional product listings and brand presence are different evidence scopes. */
  marketEvidence?: {title: string; url: string; checkedAt: string; scope: 'product' | 'brand'}[];
  /** Source-backed descriptors, never anonymous endorsements or measured ratings. */
  flavours: string[]; profile: Localized;
  source: {title: string; url: string; checkedAt: string};
  /** Identity describes verified product/style facts without inventing tasting notes. */
  profileBasis: 'producer' | 'retailer' | 'identity';
  sourceKind?: 'producer' | 'retailer' | 'distributor';
}
