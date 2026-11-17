import test from 'node:test';
import assert from 'node:assert/strict';
import {webExpoArgs} from './expo.mjs';

test('project CLI targets web with loopback development by default', () => {
  assert.deepEqual(webExpoArgs(['start']), ['start', '--web', '--localhost']);
  assert.deepEqual(webExpoArgs(['start', '--web', '--localhost']), ['start', '--web', '--localhost']);
  assert.deepEqual(webExpoArgs(['export', '--platform', 'web']), ['export', '--platform', 'web']);
});

test('retired native launch and remote tunnel flags cannot reopen the development endpoint', () => {
  for (const args of [
    ['start', '--go'], ['start', '--dev-client'], ['start', '--ios'], ['start', '--android'],
    ['export', '--platform', 'ios'], ['export', '--platform=android'], ['export', '--platform', 'all'],
    ['start', '--tunnel'], ['start', '--tunnel=true'], ['start', '--host=tunnel'], ['start', '--host', 'tunnel'], ['start', '-m', 'tunnel'],
  ]) assert.throws(() => webExpoArgs(args), /targets Web and Tauri/);
});
