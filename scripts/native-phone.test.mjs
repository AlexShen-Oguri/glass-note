import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createChunkMatcher,
  extractTryCloudflareUrl,
  inspectExpoManifest,
  isMetroReadyOutput,
  liveOwnedPids,
} from './native-phone-utils.mjs';

test('accepts only a strict HTTPS trycloudflare URL from client output', () => {
  const banner = 'INF Your quick Tunnel has been created! Visit it at\nINF | ';
  assert.equal(
    extractTryCloudflareUrl(`${banner}https://amber-river-7.trycloudflare.com |`),
    'https://amber-river-7.trycloudflare.com',
  );
  assert.equal(extractTryCloudflareUrl('INF https://amber-river-7.trycloudflare.com'), null);
  assert.equal(extractTryCloudflareUrl(`${banner}http://amber-river-7.trycloudflare.com |`), null);
  assert.equal(extractTryCloudflareUrl(`${banner}https://amber-river-7.trycloudflare.com.evil.example |`), null);
  assert.equal(extractTryCloudflareUrl(`${banner}https://user@amber-river-7.trycloudflare.com |`), null);
  assert.equal(extractTryCloudflareUrl(
    'ERR failed to request quick Tunnel: Post "https://api.trycloudflare.com/tunnel": context deadline exceeded',
  ), null);
  assert.equal(extractTryCloudflareUrl(
    `${banner}https://api.trycloudflare.com |`,
  ), null);
});

test('finds a tunnel URL split across output chunks', () => {
  const push = createChunkMatcher(extractTryCloudflareUrl);
  assert.equal(push('Your quick Tunnel has been created! Visit it at\nINF | https://amber-river-7.trycloud'), null);
  assert.equal(push('flare.com |\n'), 'https://amber-river-7.trycloudflare.com');
});

test('recognizes Metro readiness despite terminal formatting and split chunks', () => {
  const push = createChunkMatcher((value) => isMetroReadyOutput(value) || null);
  assert.equal(push('\u001b[32mMetro wait'), null);
  assert.equal(push('ing on exp://localhost:8081\u001b[0m'), true);
});

test('accepts SDK 57 protocol 0 or 1 manifests whose launch URL uses the current public origin', () => {
  const result = inspectExpoManifest({
    status: 200,
    contentType: 'application/expo+json',
    protocolVersion: '0',
    expectedPublicUrl: 'https://current-tunnel.trycloudflare.com',
    body: JSON.stringify({
      launchAsset: {url: 'https://current-tunnel.trycloudflare.com/index.bundle?platform=ios'},
      extra: {expoClient: {sdkVersion: '57.0.0'}},
    }),
  });
  assert.equal(result.launchUrl, 'https://current-tunnel.trycloudflare.com/index.bundle?platform=ios');
  assert.equal(result.protocolVersion, '0');
  assert.equal(inspectExpoManifest({
    status: 200,
    contentType: 'application/json',
    protocolVersion: '1',
    expectedPublicUrl: 'https://current-tunnel.trycloudflare.com',
    body: JSON.stringify({
      bundleUrl: 'https://current-tunnel.trycloudflare.com/index.bundle',
      sdkVersion: '57.0.0',
    }),
  }).protocolVersion, '1');

  assert.throws(() => inspectExpoManifest({
    status: 200,
    contentType: 'text/html',
    protocolVersion: '1',
    expectedPublicUrl: 'https://current-tunnel.trycloudflare.com',
    body: '<html></html>',
  }), /manifest JSON/u);
  assert.throws(() => inspectExpoManifest({
    status: 200,
    contentType: 'application/json',
    protocolVersion: '2',
    expectedPublicUrl: 'https://current-tunnel.trycloudflare.com',
    body: JSON.stringify({
      launchAsset: {url: 'https://current-tunnel.trycloudflare.com/index.bundle'},
      extra: {expoClient: {sdkVersion: '57.0.0'}},
    }),
  }), /protocol version/u);
  assert.throws(() => inspectExpoManifest({
    status: 200,
    contentType: 'application/expo+json',
    protocolVersion: '1',
    expectedPublicUrl: 'https://current-tunnel.trycloudflare.com',
    body: JSON.stringify({
      launchAsset: {url: 'https://outside.example/index.bundle'},
      extra: {expoClient: {sdkVersion: '57.0.0'}},
    }),
  }), /本次 Cloudflare HTTPS 来源/u);
  assert.throws(() => inspectExpoManifest({
    status: 200,
    contentType: 'application/expo+json',
    protocolVersion: '0',
    expectedPublicUrl: 'https://current-tunnel.trycloudflare.com',
    body: JSON.stringify({
      launchAsset: {url: 'https://current-tunnel.trycloudflare.com/index.bundle'},
      extra: {expoClient: {sdkVersion: '56.0.0'}},
    }),
  }), /Expo SDK 57/u);
});

test('cleanup selection includes only live PIDs from owned child handles', () => {
  assert.deepEqual(liveOwnedPids([
    {pid: 1201, exitCode: null},
    {pid: 1202, exitCode: 0},
    {pid: -1, exitCode: null},
    {pid: 1203, exitCode: null},
    {pid: 1205, exitCode: null, signalCode: 'SIGTERM'},
    {pid: '1204', exitCode: null},
  ]), [1201, 1203]);
});
