import {useSyncExternalStore} from 'react';
import {createMotionPreferenceStore, pendingMotionPreference} from '../../platform/motion-preference';

let media: MediaQueryList | undefined;
const browserMedia = () => media ??= window.matchMedia('(prefers-reduced-motion: reduce)');
const preference = createMotionPreferenceStore({
  read: () => browserMedia().matches,
  subscribe: change => {
    const query = browserMedia();
    const update = (event: MediaQueryListEvent) => change(event.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  },
});
const serverSnapshot = () => pendingMotionPreference;

/** Browser motion preferences share one synchronous read and subscription. */
export function useSystemMotionPreference() {
  return useSyncExternalStore(preference.subscribe, preference.getSnapshot, serverSnapshot);
}
