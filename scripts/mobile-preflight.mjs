import {access, readFile} from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const args = new Set(process.argv.slice(2));
const unknown = [...args].filter((arg) => arg !== '--json');
if (unknown.length) {
  console.error(`Unknown option: ${unknown.join(', ')}. Supported option: --json`);
  process.exit(2);
}

const projectRoot = process.cwd();
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(projectRoot, relativePath), 'utf8'));
const exists = async (relativePath) => access(path.join(projectRoot, relativePath)).then(() => true, () => false);

async function packageVersion(name) {
  const segments = name.split('/');
  try {
    return (await readJson(path.join('node_modules', ...segments, 'package.json'))).version;
  } catch {
    return null;
  }
}

function isPrivateIpv4(address) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168);
}

function lanCandidates() {
  const candidates = [];
  for (const [interfaceName, addresses] of Object.entries(os.networkInterfaces())) {
    for (const entry of addresses ?? []) {
      if (entry.family !== 'IPv4' || entry.internal || !isPrivateIpv4(entry.address)) continue;
      candidates.push({interface: interfaceName, address: entry.address});
    }
  }
  return candidates.filter((candidate, index) =>
    candidates.findIndex((other) => other.address === candidate.address) === index,
  );
}

function probeHttp(host, port, kind) {
  return new Promise((resolve) => {
    const metro = kind === 'metro';
    const request = http.request({
      host,
      port,
      path: '/',
      method: metro ? 'GET' : 'HEAD',
      // Metro can take longer than a static page to produce an iOS manifest.
      timeout: 5000,
      headers: metro ? {accept: 'application/expo+json', 'expo-platform': 'ios'} : undefined,
    }, (response) => {
      response.resume();
      const statusCode = response.statusCode ?? null;
      resolve({kind, host, port, url: `${metro ? 'exp' : 'http'}://${host}:${port}`, reachable: true, healthy: statusCode !== null && statusCode >= 200 && statusCode < 400, statusCode});
    });
    request.on('timeout', () => request.destroy());
    request.on('error', () => resolve({kind, host, port, url: `${metro ? 'exp' : 'http'}://${host}:${port}`, reachable: false, healthy: false, statusCode: null}));
    request.end();
  });
}

function semverTuple(value) {
  const match = String(value ?? '').match(/^(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : null;
}

function satisfiesRecommended(installed, recommended) {
  const actual = semverTuple(installed);
  const target = semverTuple(String(recommended).replace(/^[~^]/, ''));
  if (!actual || !target) return false;
  const [major, minor, patch] = actual;
  const [targetMajor, targetMinor, targetPatch] = target;
  const atLeastTarget = major > targetMajor
    || (major === targetMajor && minor > targetMinor)
    || (major === targetMajor && minor === targetMinor && patch >= targetPatch);
  if (String(recommended).startsWith('~')) return major === targetMajor && minor === targetMinor && patch >= targetPatch;
  if (String(recommended).startsWith('^')) {
    if (targetMajor > 0) return major === targetMajor && atLeastTarget;
    if (targetMinor > 0) return major === 0 && minor === targetMinor && patch >= targetPatch;
  }
  return major === targetMajor && minor === targetMinor && patch === targetPatch;
}

const packageJson = await readJson('package.json');
const [expoVersion, reactNativeVersion, expoCliVersion, bundledNativeModules, appJson, distReady, easConfigured] = await Promise.all([
  packageVersion('expo'),
  packageVersion('react-native'),
  readJson('node_modules/expo/node_modules/@expo/cli/package.json').then((value) => value.version, () => null),
  readJson('node_modules/expo/bundledNativeModules.json').catch(() => ({})),
  readJson('app.json').catch(() => ({})),
  exists('dist/index.html'),
  exists('eas.json'),
]);

const nativeDependencies = Object.keys(packageJson.dependencies ?? {}).filter((name) =>
  name === '@react-native-async-storage/async-storage'
  || name.startsWith('expo-')
  || name === 'react-native-reanimated'
  || name === 'react-native-safe-area-context'
  || name === 'react-native-screens'
  || name === 'react-native-worklets',
);
const missingFromSdkBundle = nativeDependencies.filter((name) => !(name in bundledNativeModules));
const nativeDependencyDetails = await Promise.all(nativeDependencies.map(async (name) => {
  const installed = await packageVersion(name);
  const recommended = bundledNativeModules[name] ?? null;
  return {name, installed, recommended, matchesRecommended: recommended ? satisfiesRecommended(installed, recommended) : false};
}));
const versionMismatches = nativeDependencyDetails.filter((item) => item.recommended && !item.matchesRecommended);
const network = lanCandidates();
const httpTargets = [
  {host: 'localhost', port: 8081, kind: 'metro'},
  {host: '127.0.0.1', port: 4173, kind: 'preview'},
  {host: '127.0.0.1', port: 4174, kind: 'preview'},
  {host: '127.0.0.1', port: 8081, kind: 'metro'},
  {host: '127.0.0.1', port: 19006, kind: 'preview'},
  ...network.flatMap((candidate) => [
    {host: candidate.address, port: 4174, kind: 'preview'},
    {host: candidate.address, port: 8081, kind: 'metro'},
  ]),
];
const httpProbes = await Promise.all(httpTargets.map(({host, port, kind}) => probeHttp(host, port, kind)));
const runningHttp = httpProbes.filter((probe) => probe.reachable);
const healthyHttp = httpProbes.filter((probe) => probe.healthy);
const safariLanHttp = httpProbes.filter((probe) => probe.kind === 'preview' && probe.host !== '127.0.0.1' && probe.port === 4174 && probe.healthy);
const metroLan = httpProbes.filter((probe) => probe.kind === 'metro' && isPrivateIpv4(probe.host) && probe.port === 8081 && probe.healthy);
const metroLocal = httpProbes.filter((probe) => probe.kind === 'metro' && ['localhost', '127.0.0.1'].includes(probe.host) && probe.healthy);
const sdkVersion = appJson?.expo?.sdkVersion ?? (expoVersion ? `${expoVersion.split('.')[0]}.0.0` : null);
const expectedPair = expoVersion?.startsWith('57.') && reactNativeVersion?.startsWith('0.86.');

const checks = [
  {
    id: 'sdk-runtime',
    state: expectedPair ? 'pass' : 'warn',
    summary: expectedPair
      ? `Installed Expo ${expoVersion} / React Native ${reactNativeVersion} matches the SDK 57 / RN 0.86 project line.`
      : `Installed Expo ${expoVersion ?? 'missing'} / React Native ${reactNativeVersion ?? 'missing'} needs review.`,
  },
  {
    id: 'native-dependencies',
    state: missingFromSdkBundle.length || versionMismatches.length ? 'warn' : 'pass',
    summary: missingFromSdkBundle.length
      ? `Native dependencies absent from Expo's installed SDK bundle catalogue: ${missingFromSdkBundle.join(', ')}`
      : versionMismatches.length
        ? `Installed versions outside Expo's bundled recommendations: ${versionMismatches.map((item) => `${item.name} ${item.installed} (recommended ${item.recommended})`).join(', ')}`
        : `${nativeDependencies.length} installed native dependency versions satisfy Expo's bundled recommendations. Phone behavior is still unverified.`,
  },
  {
    id: 'lan-address',
    state: network.length ? 'pass' : 'warn',
    summary: network.length
      ? `Private LAN IPv4 candidate${network.length === 1 ? '' : 's'}: ${network.map((item) => item.address).join(', ')}`
      : 'No private, non-loopback IPv4 address was found. Connect the PC to the phone-accessible Wi-Fi and run again.',
  },
  {
    id: 'web-http',
    state: healthyHttp.length ? 'pass' : runningHttp.length ? 'warn' : 'pending',
    summary: healthyHttp.length
      ? `Healthy local endpoint${healthyHttp.length === 1 ? '' : 's'}: ${healthyHttp.map((item) => `${item.url} (${item.statusCode})`).join(', ')}.`
      : runningHttp.length
        ? `Endpoints responded without a ready status: ${runningHttp.map((item) => `${item.url} (${item.statusCode})`).join(', ')}.`
        : 'No local response on the checked preview or Metro endpoints. This preflight does not start a server.',
  },
  {
    id: 'safari-lan-http',
    state: safariLanHttp.length ? 'pass' : 'pending',
    summary: safariLanHttp.length
      ? `Phone-facing Safari candidate responded at ${safariLanHttp.map((item) => `${item.url} (${item.statusCode})`).join(', ')}. The iPhone must still open it.`
      : 'No LAN-address HTTP response on port 4174. Run the authorized LAN preview, then rerun this check before Safari.',
  },
  {
    id: 'expo-metro-local',
    state: metroLocal.length ? 'pass' : 'pending',
    summary: metroLocal.length
      ? 'Local Metro responds (localhost includes IPv6 loopback). This does not prove the phone can connect; validate the current LAN or authorized HTTPS tunnel separately.'
      : 'No local Metro response. Start the Expo server before scanning a fresh QR code; signing in alone does not start it.',
  },
  {
    id: 'expo-metro-lan',
    state: metroLan.length ? 'pass' : 'pending',
    summary: metroLan.length
      ? `Phone-facing Metro candidate responded at ${metroLan.map((item) => `${item.url} (${item.statusCode})`).join(', ')}. Expo Go login, QR opening, and app behavior remain pending.`
      : 'No healthy Metro response on the LAN address at port 8081. A localhost-only HTTPS tunnel may still work; this check only describes direct LAN access.',
  },
  {
    id: 'expo-go-phone',
    state: 'pending',
    summary: 'Confirm the current iOS Expo Go app, same-account login, QR opening, and all native flows on the iPhone itself.',
  },
  {
    id: 'iphone-acceptance',
    state: 'pending',
    summary: 'Keyboard, foreground return, Reduce Motion, file import/share, persistence, layout, and performance require the physical iPhone.',
  },
  {
    id: 'signed-ios-build',
    state: easConfigured && appJson?.expo?.ios?.bundleIdentifier ? 'pending' : 'blocked',
    summary: easConfigured && appJson?.expo?.ios?.bundleIdentifier
      ? 'Local project configuration exists, but Apple membership, credentials, build, install, and device verification are not checked here.'
      : 'No signed-iOS setup is present (eas.json and/or ios.bundleIdentifier missing). Expo Go testing does not produce a Glass Notes IPA.',
  },
];

const report = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  project: {
    name: packageJson.name ?? null,
    appName: appJson?.expo?.name ?? null,
    sdkVersion,
    distIndexPresent: distReady,
  },
  runtime: {
    node: process.version,
    os: {platform: process.platform, release: os.release(), arch: process.arch},
    expo: expoVersion,
    expoCli: expoCliVersion,
    reactNative: reactNativeVersion,
  },
  nativeDependencies: {
    checked: nativeDependencyDetails,
    missingFromInstalledExpoBundle: missingFromSdkBundle,
    versionMismatches,
  },
  network: {
    lanCandidates: network,
    http: httpProbes,
  },
  checks,
  note: 'PASS only describes local evidence. PENDING and BLOCKED items must not be reported as phone verification.',
};

if (args.has('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Glass Notes mobile preflight — ${report.checkedAt}`);
  console.log(`Runtime: Node ${report.runtime.node}; Expo ${expoVersion ?? 'missing'}; CLI ${expoCliVersion ?? 'missing'}; React Native ${reactNativeVersion ?? 'missing'}; ${process.platform}/${process.arch}`);
  console.log(`Static export: ${distReady ? 'dist/index.html present' : 'dist/index.html missing'}`);
  console.log('');
  for (const check of checks) console.log(`[${check.state.toUpperCase()}] ${check.id}: ${check.summary}`);
  console.log('');
  console.log(report.note);
  console.log('Use --json for machine-readable evidence.');
}
