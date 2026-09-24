const MAX_CARDS = 6;
const MAX_TILE_SIZE = 150;
const GRID_GAP = 12;
const EDGE_MARGIN = 16;
const TOP_RESERVE = 140;
const BOTTOM_RESERVE = 24;
const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 360;
const MIN_VIEWPORT = 64;

export interface RevealSlot {
  x: number;
  y: number;
  fromX: number;
  fromY: number;
}

export interface RevealLayout {
  width: number;
  height: number;
  cardWidth: number;
  cardHeight: number;
  slots: RevealSlot[];
}

function safeDimension(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(MIN_VIEWPORT, value);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function safeCount(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(MAX_CARDS, Math.floor(value));
}

function entryPoint(index: number, width: number, height: number, cardWidth: number, cardHeight: number): {fromX: number; fromY: number} {
  // Keep one small edge of every entering card visible while the waterfall
  // gathers it toward its final slot. These are absolute container coordinates.
  const leftEdge = 16 - cardWidth;
  const rightEdge = width - EDGE_MARGIN;
  const topEdge = 16 - cardHeight;
  const bottomEdge = height - EDGE_MARGIN;
  const centerX = clamp((width - cardWidth) / 2, leftEdge, rightEdge);
  const centerY = clamp((height - cardHeight) / 2, topEdge, bottomEdge);
  const starts = [
    {fromX: leftEdge, fromY: clamp(28, topEdge, bottomEdge)},
    {fromX: rightEdge, fromY: clamp(76, topEdge, bottomEdge)},
    {fromX: clamp(centerX - 42, leftEdge, rightEdge), fromY: topEdge},
    {fromX: clamp(centerX + 42, leftEdge, rightEdge), fromY: bottomEdge},
    {fromX: leftEdge, fromY: clamp(centerY + 44, topEdge, bottomEdge)},
    {fromX: rightEdge, fromY: clamp(centerY - 44, topEdge, bottomEdge)},
  ];
  return starts[index % starts.length]!;
}

/**
 * Calculate the static geometry for the guided reveal. Animation code owns
 * the transform from each absolute entry point to its absolute final slot.
 */
export function revealLayout(width: number, height: number, count: number): RevealLayout {
  const safeWidth = safeDimension(width, DEFAULT_WIDTH);
  const safeHeight = safeDimension(height, DEFAULT_HEIGHT);
  const cardCount = safeCount(count);
  if (cardCount === 0) return {width: safeWidth, height: safeHeight, cardWidth: 0, cardHeight: 0, slots: []};

  const columns = cardCount === 1 ? 1 : safeWidth >= 700 ? Math.min(3, cardCount) : Math.min(2, cardCount);
  const rows = Math.ceil(cardCount / columns);
  const minimumBlockHeight = rows + GRID_GAP * (rows - 1);

  // Keep the title/skip overlay clear whenever the viewport permits it. On a
  // genuinely short viewport, shrink that reserve only as far as needed to
  // keep every card inside the visible, margin-safe area.
  const contentTop = Math.min(TOP_RESERVE, Math.max(EDGE_MARGIN, safeHeight - BOTTOM_RESERVE - minimumBlockHeight));
  const contentBottom = Math.min(safeHeight - EDGE_MARGIN, safeHeight - BOTTOM_RESERVE);
  const contentHeight = Math.max(minimumBlockHeight, contentBottom - contentTop);
  const heightCapacity = (contentHeight - GRID_GAP * (rows - 1)) / rows;
  const horizontalSpace = Math.max(1, safeWidth - EDGE_MARGIN * 2 - GRID_GAP * (columns - 1));
  const widthCapacity = horizontalSpace / columns;
  const cardWidth = Math.max(1, Math.min(MAX_TILE_SIZE, Math.floor(widthCapacity), Math.floor(heightCapacity * 4 / 3)));
  const cardHeight = cardWidth * 3 / 4;
  const blockHeight = cardHeight * rows + GRID_GAP * (rows - 1);
  const firstRowY = contentTop + (contentHeight - blockHeight) / 2;
  const slots: RevealSlot[] = [];
  for (let index = 0; index < cardCount; index += 1) {
    const row = Math.floor(index / columns);
    const rowStart = row * columns;
    const cardsInRow = Math.min(columns, cardCount - rowStart);
    const rowWidth = cardsInRow * cardWidth + GRID_GAP * (cardsInRow - 1);
    const firstRowX = (safeWidth - rowWidth) / 2;
    const column = index - rowStart;
    const x = firstRowX + column * (cardWidth + GRID_GAP);
    const y = firstRowY + row * (cardHeight + GRID_GAP);
    const entry = entryPoint(index, safeWidth, safeHeight, cardWidth, cardHeight);
    slots.push({x, y, ...entry});
  }

  return {width: safeWidth, height: safeHeight, cardWidth, cardHeight, slots};
}
