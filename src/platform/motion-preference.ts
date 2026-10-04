export interface MotionPreferenceSnapshot {
  readonly ready: boolean;
  readonly reduced: boolean;
}

export interface MotionPreferenceSource {
  read: () => boolean | Promise<boolean>;
  subscribe: (change: (reduced: boolean) => void) => () => void;
}

/** Unknown system preferences keep the server/native first frame still. */
export const pendingMotionPreference: MotionPreferenceSnapshot = {ready: false, reduced: true};

/** One resolved system preference is shared by every mounted motion adapter. */
export function createMotionPreferenceStore(source: MotionPreferenceSource) {
  let snapshot = pendingMotionPreference;
  let requested = false;
  let revision = 0;
  let disconnect: (() => void) | undefined;
  const listeners = new Set<() => void>();
  const publish = (reduced: boolean) => {
    if (snapshot.ready && snapshot.reduced === reduced) return;
    snapshot = {ready: true, reduced};
    for (const listener of listeners) listener();
  };
  const read = () => {
    requested = true;
    const current = ++revision;
    try {
      const result = source.read();
      if (typeof result === 'boolean') publish(result);
      else void result.then(
        reduced => {if (current === revision) publish(reduced);},
        () => {if (current === revision) publish(true);},
      );
    } catch {
      if (current === revision) publish(true);
    }
  };
  return {
    getSnapshot: () => {
      if (!requested) read();
      return snapshot;
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      if (!disconnect) {
        disconnect = source.subscribe(reduced => {revision += 1; publish(reduced);});
        // Recheck after a disconnected period without resetting a known value
        // to pending. New components can use the shared cache immediately.
        if (!requested || snapshot.ready) read();
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {disconnect?.(); disconnect = undefined;}
      };
    },
  };
}
