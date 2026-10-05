export interface ResultsLayout {
  width: number;
  columns: number;
  cardWidth: number;
  photoHeight: number;
  gap: number;
  rowGap: number;
  mobile: boolean;
  hero: boolean;
  rows: Array<Array<{index: number; top: number}>>;
}

/** Presentation only: compose the ranked sequence without sorting or dropping it. */
export function resultsLayout(availableWidth: number, resultCount: number): ResultsLayout {
  const width = Math.max(1, Math.min(1260, Number.isFinite(availableWidth) ? availableWidth : 320));
  const count = Number.isFinite(resultCount) ? Math.max(0, Math.floor(resultCount)) : 0;
  const mobile = width < 700;
  const hero = count === 1;
  const columns = count === 0 ? 0 : hero ? 1 : mobile ? 2 : count === 2 || count === 4 ? 2 : 3;
  const gap = Math.min(mobile ? 14 : 27, Math.max(0, width - 2));
  const cardWidth = columns ? (width - gap * (columns - 1)) / columns : 0;
  const stagger = hero ? 0 : mobile ? 35 : 43;
  const rows: ResultsLayout['rows'] = [];
  for (let start = 0; start < count; start += columns) {
    rows.push(Array.from({length: Math.min(columns, count - start)}, (_, column) => ({index: start + column, top: column * stagger})));
  }
  return {
    width, columns, cardWidth, gap, rows, mobile, hero,
    photoHeight: hero ? mobile ? 300 : 410 : mobile ? 175 : width < 1000 ? 200 : 250,
    rowGap: mobile ? 29 : 42,
  };
}
