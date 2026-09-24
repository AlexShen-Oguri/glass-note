export function motionEnabled(preferencesHydrated: boolean, storageAvailable: boolean, paused: boolean, reduced: boolean) {
  return preferencesHydrated && storageAvailable && !paused && !reduced;
}
export const transitionDuration = {page: 700, step: 520, card: 360, completion: 1100} as const;
