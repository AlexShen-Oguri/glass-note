export function initialVersionSelection(versionIds: readonly string[]): string[] {
  return versionIds.slice(0, Math.min(3, versionIds.length));
}

export function reconcileVersionSelection(selected: readonly string[], versionIds: readonly string[]): string[] {
  const available = new Set(versionIds);
  const desired = Math.min(Math.max(selected.length, Math.min(2, versionIds.length)), Math.min(3, versionIds.length));
  const next = selected.filter(id => available.has(id)).slice(0, desired);
  for (const id of versionIds) {
    if (next.length >= desired) break;
    if (!next.includes(id)) next.push(id);
  }
  return next;
}
