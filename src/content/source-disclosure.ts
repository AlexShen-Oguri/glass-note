import raw from './source-disclosure.json';

export const DISCLOSURE_DIMENSIONS = ['finished-recipe', 'preparations', 'quantities', 'technique', 'dilution', 'finished-abv'] as const;
export type DisclosureDimension = (typeof DISCLOSURE_DIMENSIONS)[number];
export const DISCLOSURE_STATUSES = ['published', 'partial', 'unknown'] as const;
export type DisclosureStatus = (typeof DISCLOSURE_STATUSES)[number];
export const DISCLOSURE_NOTES = [
  'finished-recipe-recorded',
  'coconut-components-partial',
  'apple-components-partial',
  'garnish-and-ratio-unclear',
  'scraps-and-dusting-unclear',
  'technique-recorded',
  'dilution-not-published',
  'abv-not-calculable',
] as const;
export type DisclosureNote = (typeof DISCLOSURE_NOTES)[number];
export const DISCLOSURE_EDITORIAL_NOTES = ['verify-custom-components'] as const;
export type DisclosureEditorialNote = (typeof DISCLOSURE_EDITORIAL_NOTES)[number];

export interface DisclosureSourceReview {
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

export interface DisclosureWorkReview {
  workId: string;
  sourceIds: string[];
  dimensions: Array<{dimension: DisclosureDimension; status: DisclosureStatus; note: DisclosureNote}>;
  editorialNote: DisclosureEditorialNote;
}

export interface SourceDisclosureEvidence {
  schemaVersion: 1;
  topicId: string;
  selectionScope: 'two-published-winner-recipes';
  officialFieldCount: null;
  checkedAt: string;
  sources: DisclosureSourceReview[];
  works: DisclosureWorkReview[];
}

export const sourceDisclosure = raw as SourceDisclosureEvidence;

const sourcesById = new Map(sourceDisclosure.sources.map((source) => [source.id, source]));
const reviewsByWorkId = new Map(sourceDisclosure.works.map((review) => [review.workId, review]));

export function sourceDisclosureFor(topicId: string, workId: string): {review: DisclosureWorkReview; sources: DisclosureSourceReview[]} | undefined {
  if (topicId !== sourceDisclosure.topicId) return undefined;
  const review = reviewsByWorkId.get(workId);
  if (!review) return undefined;
  return {review, sources: review.sourceIds.flatMap((id) => {
    const source = sourcesById.get(id);
    return source ? [source] : [];
  })};
}
