import type {SearchQuery} from '../contracts';
import type {ContextSelection} from '../context/types';

export const GUIDED_FIELDS = ['flavours', 'tastes', 'strengths', 'approachability'] as const;
export type GuidedField = typeof GUIDED_FIELDS[number] | 'excluded';
export type GuidedMode = 'drink' | 'make';
export type GuidedAction =
  | {type: 'set-mode'; mode: GuidedMode | null}
  | {type: 'allow-pantry-fallback'}
  | {type: 'set-context'; selection: ContextSelection}
  | {type: 'toggle'; field: GuidedField; value: string}
  | {type: 'next'}
  | {type: 'skip'}
  | {type: 'back'}
  | {type: 'review'; step: number}
  | {type: 'begin'}
  | {type: 'finish'}
  | {type: 'edit'; step?: number}
  | {type: 'restart'};
export interface GuidedSession {
  /** In-memory only. Missing on legacy sessions means the original drink flow. */
  mode?: GuidedMode | null;
  pantryFallback?: boolean;
  step: number;
  phase: 'choosing' | 'revealing' | 'results';
  draft: SearchQuery;
  submitted: SearchQuery | null;
  contextDraft: ContextSelection;
  contextSubmitted: ContextSelection | null;
}
