export type DiscoveryColumnCount = 2 | 3 | 4;

export function getDiscoveryColumnCount(viewportWidth: number): DiscoveryColumnCount {
  if (viewportWidth >= 1120) return 4;
  if (viewportWidth >= 740) return 3;
  return 2;
}

/**
 * Keep source order intact while forming explicit rows. Rendering these rows
 * prevents independently packed columns from ending at different scroll depths.
 */
export function createDiscoveryRows<T>(items: readonly T[], columnCount: DiscoveryColumnCount): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += columnCount) {
    rows.push(items.slice(index, index + columnCount));
  }
  return rows;
}
