import {pinyin} from 'pinyin-pro';

/**
 * Public score bands. Callers should compare scores rather than depending on
 * incidental edit-distance details inside a band.
 */
export const TEXT_SEARCH_SCORE = {
  exact: 100,
  prefix: 90,
  substring: 80,
  pinyin: 70,
  homophone: 60,
  typo: 50,
} as const;

interface AnalysedText {
  normalized: string;
  compact: string;
  tokens: string[];
  hanCount: number;
  phoneticCompact?: string;
  phoneticTokens?: string[];
}

const MAX_CACHE_ENTRIES = 4096;
const analysisCache = new Map<string, AnalysedText>();
const HAN = /\p{Script=Han}/u;

/** Keeps the established accent-insensitive normalization used by all search surfaces. */
export function normalizeSearchText(value: string): string {
  try {
    return value
      .normalize('NFKD')
      .replace(/\p{Mark}/gu, '')
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  } catch {
    return '';
  }
}

/**
 * Scores a query against a collection of names and aliases.
 *
 * Zero is the only no-match value. Positive score bands are ordered as:
 * exact > prefix > substring > pinyin > approximate homophone > typo.
 * Multiple query words use AND semantics and may match different fields.
 */
export function scoreTextSearch(query: string, fields: readonly string[]): number {
  const analysedQuery = analyse(query);
  if (!analysedQuery.normalized) return 0;

  const analysedFields = fields
    .filter((field): field is string => typeof field === 'string' && field.length > 0)
    .map(analyse)
    .filter((field) => field.normalized.length > 0);
  if (analysedFields.length === 0) return 0;

  const wholeScore = bestNeedleScore(analysedQuery, analysedFields);
  if (wholeScore > 0 || analysedQuery.tokens.length <= 1) return wholeScore;

  // A word can come from a different field (for example, a brand plus an
  // ingredient), but every word must match. The weakest word sets the band.
  let weakestScore: number = TEXT_SEARCH_SCORE.exact;
  for (const token of analysedQuery.tokens) {
    const tokenScore = bestNeedleScore(analyse(token), analysedFields);
    if (tokenScore === 0) return 0;
    weakestScore = Math.min(weakestScore, tokenScore);
  }
  return weakestScore;
}

function bestNeedleScore(query: AnalysedText, fields: readonly AnalysedText[]): number {
  let best = 0;
  for (const field of fields) {
    best = Math.max(best, directScore(query, field));
    if (best === TEXT_SEARCH_SCORE.exact) return best;
  }
  return best;
}

function directScore(query: AnalysedText, field: AnalysedText): number {
  if (field.normalized === query.normalized) return TEXT_SEARCH_SCORE.exact;
  if (startsAtWordBoundary(field.normalized, query.normalized)) return TEXT_SEARCH_SCORE.prefix;
  if (field.normalized.includes(query.normalized)) return TEXT_SEARCH_SCORE.substring;

  const phoneticScore = scorePhonetic(query, field);
  if (phoneticScore > 0) return phoneticScore;

  return scoreTypo(query, field);
}

function scorePhonetic(query: AnalysedText, field: AnalysedText): number {
  const fieldPhonetic = field.phoneticCompact;
  if (!fieldPhonetic) return 0;

  // Latin input is already the form users type for pinyin. Han input is
  // converted as well, enabling tolerant comparisons between transliterations.
  const queryPhonetic = query.phoneticCompact ?? query.compact;
  if (!queryPhonetic || (query.hanCount < 2 && queryPhonetic.length < 4)) return 0;
  if (fieldPhonetic === queryPhonetic) return TEXT_SEARCH_SCORE.pinyin;
  if (fieldPhonetic.startsWith(queryPhonetic) || fieldPhonetic.includes(queryPhonetic)) {
    return TEXT_SEARCH_SCORE.pinyin;
  }

  if (!canFuzzyMatch(queryPhonetic)) return 0;
  if (query.hanCount === 0 && queryPhonetic.length < 8) return 0;
  const allowance = phoneticEditAllowance(queryPhonetic.length);
  const equalHanSyllableCount =
    query.hanCount === 0 || query.hanCount === field.hanCount;
  if (
    equalHanSyllableCount &&
    (query.hanCount === 0 || sameSyllableInitials(query.phoneticTokens, field.phoneticTokens)) &&
    damerauLevenshteinWithin(queryPhonetic, fieldPhonetic, allowance)
  ) {
    return TEXT_SEARCH_SCORE.homophone;
  }

  // Compare contiguous syllable spans so a query such as 马提尼 can find the
  // 马天尼 portion of 干马天尼 without ignoring word order.
  const phoneticTokens = field.phoneticTokens ?? [];
  for (let start = 0; start < phoneticTokens.length; start += 1) {
    let candidate = '';
    for (let end = start; end < phoneticTokens.length; end += 1) {
      candidate += phoneticTokens[end];
      if (query.hanCount > 0 && end - start + 1 !== query.hanCount) {
        if (end - start + 1 > query.hanCount) break;
        continue;
      }
      if (candidate.length > queryPhonetic.length + allowance) break;
      const candidateTokens = phoneticTokens.slice(start, end + 1);
      if (
        (query.hanCount === 0 || sameSyllableInitials(query.phoneticTokens, candidateTokens)) &&
        Math.abs(candidate.length - queryPhonetic.length) <= allowance &&
        damerauLevenshteinWithin(queryPhonetic, candidate, allowance)
      ) {
        return TEXT_SEARCH_SCORE.homophone;
      }
    }
  }
  return 0;
}

function scoreTypo(query: AnalysedText, field: AnalysedText): number {
  if (!canFuzzyMatch(query.compact)) return 0;
  const allowance = editAllowance(query.compact.length);
  const candidates = new Set([field.compact, ...field.tokens]);
  for (const candidate of candidates) {
    if (Math.abs(candidate.length - query.compact.length) > allowance) continue;
    if (damerauLevenshteinWithin(query.compact, candidate, allowance)) {
      return TEXT_SEARCH_SCORE.typo;
    }
  }
  return 0;
}

function analyse(raw: string): AnalysedText {
  const cacheKey = typeof raw === 'string' ? raw : '';
  const cached = analysisCache.get(cacheKey);
  if (cached) return cached;

  const normalized = normalizeSearchText(cacheKey);
  const tokens = normalized ? normalized.split(' ') : [];
  const result: AnalysedText = {
    normalized,
    compact: tokens.join(''),
    tokens,
    hanCount: [...normalized].filter((character) => HAN.test(character)).length,
  };

  if (HAN.test(normalized)) {
    try {
      result.phoneticTokens = pinyin(normalized, {
        toneType: 'none',
        type: 'array',
        nonZh: 'consecutive',
      })
        .map(normalizeSearchText)
        .filter(Boolean);
      result.phoneticCompact = result.phoneticTokens.join('').replace(/\s/g, '');
    } catch {
      // Plain normalized matching remains available if conversion rejects data.
    }
  }

  if (analysisCache.size >= MAX_CACHE_ENTRIES) analysisCache.clear();
  analysisCache.set(cacheKey, result);
  return result;
}

function startsAtWordBoundary(field: string, query: string): boolean {
  if (field.startsWith(query)) return true;
  let index = field.indexOf(query);
  while (index > 0) {
    if (field[index - 1] === ' ') return true;
    index = field.indexOf(query, index + 1);
  }
  return false;
}

function canFuzzyMatch(value: string): boolean {
  // Four-character or shorter input is too ambiguous in a large catalogue.
  return value.length >= 5 && value.length <= 128;
}

function editAllowance(length: number): number {
  return length >= 8 ? 2 : 1;
}

function phoneticEditAllowance(length: number): number {
  return length >= 6 ? 2 : 1;
}

function sameSyllableInitials(
  left: readonly string[] | undefined,
  right: readonly string[] | undefined,
): boolean {
  if (!left || !right || left.length !== right.length) return false;
  return left.every((syllable, index) => pinyinInitial(syllable) === pinyinInitial(right[index] ?? ''));
}

function pinyinInitial(syllable: string): string {
  return syllable.match(/^(zh|ch|sh|[bpmfdtnlgkhjqxzcsrwy])/)?.[0] ?? '';
}

/** Optimal-string-alignment distance with an early maximum-distance cutoff. */
function damerauLevenshteinWithin(left: string, right: string, maximum: number): boolean {
  if (left === right) return true;
  if (Math.abs(left.length - right.length) > maximum) return false;

  let previousPrevious: number[] | undefined;
  let previous = Array.from({length: right.length + 1}, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = new Array<number>(right.length + 1);
    current[0] = leftIndex;
    let rowMinimum = current[0];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      let distance = Math.min(
        (previous[rightIndex] ?? maximum + 1) + 1,
        (current[rightIndex - 1] ?? maximum + 1) + 1,
        (previous[rightIndex - 1] ?? maximum + 1) + substitutionCost,
      );

      if (
        previousPrevious &&
        leftIndex > 1 &&
        rightIndex > 1 &&
        left[leftIndex - 1] === right[rightIndex - 2] &&
        left[leftIndex - 2] === right[rightIndex - 1]
      ) {
        distance = Math.min(distance, (previousPrevious[rightIndex - 2] ?? maximum + 1) + 1);
      }

      current[rightIndex] = distance;
      rowMinimum = Math.min(rowMinimum, distance);
    }

    // All future rows must pay at least the length difference from this point.
    if (rowMinimum > maximum && leftIndex > right.length + maximum) return false;
    previousPrevious = previous;
    previous = current;
  }

  return (previous[right.length] ?? maximum + 1) <= maximum;
}
