import raw from './round17-research.json';

export const ROUND17_DIMENSIONS = ['finished-recipe', 'preparations', 'quantities', 'technique', 'dilution', 'finished-abv'] as const;
export type Round17Dimension = (typeof ROUND17_DIMENSIONS)[number];
export const ROUND17_STATUSES = ['published', 'partial', 'unknown'] as const;
export type Round17Status = (typeof ROUND17_STATUSES)[number];
export const ROUND17_NOTES = [
  'finished-recipe-recorded',
  'coconut-components-partial',
  'apple-components-partial',
  'garnish-and-ratio-unclear',
  'scraps-and-dusting-unclear',
  'technique-recorded',
  'dilution-not-published',
  'abv-not-calculable',
] as const;
export type Round17Note = (typeof ROUND17_NOTES)[number];
export const ROUND17_EDITORIAL_NOTES = ['verify-custom-components'] as const;
export type Round17EditorialNote = (typeof ROUND17_EDITORIAL_NOTES)[number];

export interface Round17SourceReview {
  id: string;
  kind: 'identity' | 'recipe';
  title: string;
  url: string;
  availability: 'available' | 'unavailable';
  checkedAt: string;
  httpStatus?: number;
  lastPriorCheck?: string;
  fact: string;
}

export interface Round17WorkReview {
  workId: string;
  sourceIds: string[];
  dimensions: Array<{dimension: Round17Dimension; status: Round17Status; note: Round17Note}>;
  editorialNote: Round17EditorialNote;
}

export interface Round17ResearchEvidence {
  schemaVersion: 1;
  topicId: string;
  selectionScope: 'two-published-winner-recipes';
  officialFieldCount: null;
  checkedAt: string;
  sources: Round17SourceReview[];
  works: Round17WorkReview[];
}

export const round17Research = raw as Round17ResearchEvidence;

const sourcesById = new Map(round17Research.sources.map((source) => [source.id, source]));
const reviewsByWorkId = new Map(round17Research.works.map((review) => [review.workId, review]));

export function round17ReviewFor(topicId: string, workId: string): {review: Round17WorkReview; sources: Round17SourceReview[]} | undefined {
  if (topicId !== round17Research.topicId) return undefined;
  const review = reviewsByWorkId.get(workId);
  if (!review) return undefined;
  return {review, sources: review.sourceIds.flatMap((id) => {
    const source = sourcesById.get(id);
    return source ? [source] : [];
  })};
}
