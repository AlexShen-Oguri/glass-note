import type {TasteResult} from '../taste/types';

export const OCCASIONS = ['aperitif', 'meal', 'after-dinner', 'gathering', 'slow-sip', 'celebration'] as const;
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Occasion = typeof OCCASIONS[number];
export type Season = typeof SEASONS[number];
export interface ContextSelection {occasion?: Occasion; season?: Season}
export const CONTEXT_REASONS = ['bitter-dry', 'sparkling', 'citrus-refreshing', 'floral-fruit', 'herbal-fresh', 'spice-depth', 'warm-serve', 'rich-finish', 'spirit-forward', 'simple-build', 'long-refreshing'] as const;
export type ContextReasonCode = typeof CONTEXT_REASONS[number];
export interface ContextEvidence {
  versionId: string;
  sourceId: string;
  reviewedAt: string;
  basis: 'editorial';
  /** SHA-256 of this version's recipe/profile facts, checked by the content audit. */
  recipeDigest: string;
  occasions: Array<{value: Occasion; reason: ContextReasonCode}>;
  seasons: Array<{value: Season; reason: ContextReasonCode}>;
}
export interface ContextReason {dimension: 'occasion' | 'season'; value: Occasion | Season; code: ContextReasonCode; sourceId: string}
export interface ContextResult extends TasteResult {contextReasons: ContextReason[]; contextScore: number}
