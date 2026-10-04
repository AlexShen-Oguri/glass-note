import assert from 'node:assert/strict';
import test from 'node:test';
import {createMotionPreferenceStore, pendingMotionPreference} from './motion-preference';

test('a web preference is ready synchronously for a newly mounted reveal', () => {
  let current = false;
  let update: ((reduced: boolean) => void) | undefined;
  let subscriptions = 0;
  let disconnections = 0;
  const store = createMotionPreferenceStore({
    read: () => current,
    subscribe: change => {subscriptions += 1; update = change; return () => {disconnections += 1;};},
  });
  const first = store.getSnapshot();
  assert.deepEqual(first, {ready: true, reduced: false});
  const unsubscribeFirst = store.subscribe(() => {});
  const unsubscribeSecond = store.subscribe(() => {});
  assert.equal(subscriptions, 1);
  assert.strictEqual(store.getSnapshot(), first);
  current = true;
  update?.(current);
  assert.deepEqual(store.getSnapshot(), {ready: true, reduced: true});
  unsubscribeFirst();
  assert.equal(disconnections, 0);
  unsubscribeSecond();
  assert.equal(disconnections, 1);
});

test('an unresolved native preference is pending rather than an explicit motion veto', async () => {
  let resolve: ((reduced: boolean) => void) | undefined;
  const read = new Promise<boolean>(finish => {resolve = finish;});
  let reads = 0;
  const store = createMotionPreferenceStore({
    read: () => {reads += 1; return read;},
    subscribe: () => () => {},
  });
  assert.strictEqual(store.getSnapshot(), pendingMotionPreference);
  const changes: Array<{ready: boolean; reduced: boolean}> = [];
  const unsubscribe = store.subscribe(() => {changes.push(store.getSnapshot());});
  assert.equal(reads, 1);
  resolve?.(false);
  await read;
  assert.deepEqual(changes, [{ready: true, reduced: false}]);
  unsubscribe();
  // A later screen reads the resolved value immediately, without a false
  // reduced-motion frame that would permanently complete its reveal.
  assert.deepEqual(store.getSnapshot(), {ready: true, reduced: false});
});

test('a system change wins over an older unresolved native read', async () => {
  let resolve: ((reduced: boolean) => void) | undefined;
  let update: ((reduced: boolean) => void) | undefined;
  const read = new Promise<boolean>(finish => {resolve = finish;});
  const store = createMotionPreferenceStore({read: () => read, subscribe: change => {update = change; return () => {};}});
  store.getSnapshot();
  const unsubscribe = store.subscribe(() => {});
  update?.(true);
  resolve?.(false);
  await read;
  assert.deepEqual(store.getSnapshot(), {ready: true, reduced: true});
  unsubscribe();
});

test('a disconnected system setting is refreshed without resetting the shared snapshot to pending', () => {
  let current = false;
  const store = createMotionPreferenceStore({read: () => current, subscribe: () => () => {}});
  const unsubscribe = store.subscribe(() => {});
  unsubscribe();
  current = true;
  assert.deepEqual(store.getSnapshot(), {ready: true, reduced: false});
  const reconnected = store.subscribe(() => {});
  assert.deepEqual(store.getSnapshot(), {ready: true, reduced: true});
  reconnected();
});

test('a failed system read resolves conservatively instead of waiting forever', async () => {
  const store = createMotionPreferenceStore({read: () => Promise.reject(Error('unavailable')), subscribe: () => () => {}});
  assert.equal(store.getSnapshot().ready, false);
  await Promise.resolve();
  assert.deepEqual(store.getSnapshot(), {ready: true, reduced: true});
});
