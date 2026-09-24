import type {
  Approachability,
  Exclusion,
  Flavour,
  SearchQuery,
  Strength,
  Taste,
} from '../contracts';
import {normalizeContextSelection} from '../context';
import {
  GUIDED_FIELDS,
  type GuidedAction,
  type GuidedField,
  type GuidedSession,
} from './types';

const FLAVOURS = new Set<string>(['citrus', 'fruit', 'floral', 'herbal', 'spice', 'coffee']);
const TASTES = new Set<string>(['sour', 'sweet', 'bitter', 'dry', 'creamy', 'refreshing']);
const STRENGTHS = new Set<string>(['none', 'low', 'medium', 'strong']);
const APPROACHABILITY = new Set<string>(['gentle', 'balanced', 'bold']);
const EXCLUSIONS = new Set<string>([
  'egg',
  'dairy',
  'gin',
  'rum',
  'tequila',
  'whiskey',
  'vodka',
  'brandy',
  'mezcal',
  'cachaca',
  'grappa',
  'none',
]);
const LAST_STEP = GUIDED_FIELDS.length - 1;

export function createGuidedSession(): GuidedSession {
  return {
    mode: null,
    pantryFallback: false,
    step: 0,
    phase: 'choosing',
    draft: {},
    submitted: null,
    contextDraft: {},
    contextSubmitted: null,
  };
}

export function guidedReducer(state: GuidedSession, action: GuidedAction): GuidedSession {
  if (action.type === 'restart') return createGuidedSession();
  if (action.type === 'set-mode') return {
    ...state, mode: action.mode, pantryFallback: false,
    phase: state.phase === 'revealing' ? 'results' : state.phase,
  };
  if (action.type === 'allow-pantry-fallback') return state.mode === 'make'
    ? {...state, pantryFallback: true} : state;

  if (action.type === 'finish') {
    return state.phase === 'revealing' ? {...state, phase: 'results'} : state;
  }

  if (action.type === 'edit') {
    if (state.phase === 'choosing') return state;
    const step = isStep(action.step)
      ? action.step
      : isStep(state.step)
        ? state.step
        : LAST_STEP;
    return {
      ...state,
      phase: 'choosing',
      step,
      draft: copyGuidedQuery(state.draft),
      contextDraft: normalizeContextSelection(state.contextDraft),
    };
  }

  if (state.phase !== 'choosing') return state;

  switch (action.type) {
    case 'review':
      if (!isStep(action.step) || action.step >= state.step) return state;
      return {...state, step: action.step, draft: copyGuidedQuery(state.draft)};
    case 'toggle':
      return toggleValue(state, action.field, action.value);
    case 'set-context':
      return {...state, contextDraft: normalizeContextSelection(action.selection)};
    case 'next':
      if (!isStep(state.step) || state.step === LAST_STEP) return state;
      return {...state, step: state.step + 1, draft: copyGuidedQuery(state.draft)};
    case 'back':
      if (!isStep(state.step) || state.step === 0) return state;
      return {...state, step: state.step - 1, draft: copyGuidedQuery(state.draft)};
    case 'skip':
      return skipCurrentField(state);
    case 'begin':
      return begin(state);
    default:
      return state;
  }
}

function toggleValue(
  state: GuidedSession,
  field: GuidedField,
  value: string,
): GuidedSession {
  const draft = copyGuidedQuery(state.draft);

  switch (field) {
    case 'flavours':
      if (!FLAVOURS.has(value)) return state;
      draft.flavours = toggleMany(draft.flavours, value as Flavour);
      break;
    case 'tastes':
      if (!TASTES.has(value)) return state;
      draft.tastes = toggleMany(draft.tastes, value as Taste);
      break;
    case 'strengths':
      if (!STRENGTHS.has(value)) return state;
      draft.strengths = toggleOne(draft.strengths, value as Strength);
      break;
    case 'approachability':
      if (!APPROACHABILITY.has(value)) return state;
      draft.approachability = toggleOne(
        draft.approachability,
        value as Approachability,
      );
      break;
    case 'excluded':
      if (!EXCLUSIONS.has(value)) return state;
      draft.excluded = toggleMany(draft.excluded, value as Exclusion);
      break;
  }

  return {...state, draft};
}

function skipCurrentField(state: GuidedSession): GuidedSession {
  if (!isStep(state.step)) return state;
  const currentField = GUIDED_FIELDS[state.step];
  if (!currentField) return state;

  const draft = copyGuidedQuery(state.draft);
  delete draft[currentField];

  if (state.step === LAST_STEP) {
    return {
      ...state,
      phase: 'revealing',
      draft,
      submitted: copyGuidedQuery(draft),
      contextSubmitted: normalizeContextSelection(state.contextDraft),
    };
  }

  return {...state, step: state.step + 1, draft};
}

function begin(state: GuidedSession): GuidedSession {
  if (state.step !== LAST_STEP) return state;
  const draft = copyGuidedQuery(state.draft);
  return {
    ...state,
    phase: 'revealing',
    draft,
    submitted: copyGuidedQuery(draft),
    contextSubmitted: normalizeContextSelection(state.contextDraft),
  };
}

function toggleMany<T extends string>(values: T[] | undefined, value: T): T[] | undefined {
  const current = values ?? [];
  const next = current.includes(value)
    ? current.filter((candidate) => candidate !== value)
    : [...current, value];
  return next.length > 0 ? next : undefined;
}

function toggleOne<T extends string>(values: T[] | undefined, value: T): T[] | undefined {
  return values?.[0] === value ? undefined : [value];
}

function copyGuidedQuery(query: SearchQuery): SearchQuery {
  const copy: SearchQuery = {};
  const flavours = validMany(query.flavours, FLAVOURS);
  const tastes = validMany(query.tastes, TASTES);
  const strengths = validOne(query.strengths, STRENGTHS);
  const approachability = validOne(query.approachability, APPROACHABILITY);
  const excluded = validMany(query.excluded, EXCLUSIONS);

  if (flavours) copy.flavours = flavours;
  if (tastes) copy.tastes = tastes;
  if (strengths) copy.strengths = strengths;
  if (approachability) copy.approachability = approachability;
  if (excluded) copy.excluded = excluded;
  return copy;
}

function validMany<T extends string>(
  values: T[] | undefined,
  allowed: ReadonlySet<string>,
): T[] | undefined {
  if (!values) return undefined;
  const valid = values.filter(
    (value, index) => allowed.has(value) && values.indexOf(value) === index,
  );
  return valid.length > 0 ? valid : undefined;
}

function validOne<T extends string>(
  values: T[] | undefined,
  allowed: ReadonlySet<string>,
): T[] | undefined {
  const value = values?.find((candidate) => allowed.has(candidate));
  return value === undefined ? undefined : [value];
}

function isStep(value: number | undefined): value is number {
  return Number.isInteger(value) && value !== undefined && value >= 0 && value <= LAST_STEP;
}
