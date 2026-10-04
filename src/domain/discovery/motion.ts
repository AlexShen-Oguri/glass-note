export function motionEnabled(preferencesHydrated: boolean, storageAvailable: boolean, paused: boolean, reduced: boolean) {
  return preferencesHydrated && storageAvailable && !paused && !reduced;
}
export const transitionDuration = {page: 420, step: 320, card: 360, completion: 280, selection: 220} as const;
