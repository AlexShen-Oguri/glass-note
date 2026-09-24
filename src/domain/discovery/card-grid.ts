/** Stable columns depend on the container, never the number of results. */
export function cardGrid(containerWidth: number, minimumCardWidth = 250, gap = 16) {
  const width = Number.isFinite(containerWidth) ? Math.max(0, containerWidth) : 0;
  const minimum = Number.isFinite(minimumCardWidth) ? Math.max(1, minimumCardWidth) : 250;
  const spacing = Number.isFinite(gap) ? Math.max(0, gap) : 16;
  const columns = Math.max(1, Math.floor((width + spacing) / (minimum + spacing)));
  // onLayout may round a fractional CSS width up; leave a pixel for that boundary.
  const cardWidth = columns === 1 ? width : Math.floor((width - 1 - spacing * (columns - 1)) / columns);
  return {columns, cardWidth: Math.max(0, cardWidth), gap: spacing};
}
