const TRY_CLOUDFLARE_URL = /https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.trycloudflare\.com(?=\/|\s|$)/giu;
const QUICK_TUNNEL_BANNER = 'Your quick Tunnel has been created! Visit it at';
const RESERVED_CLOUDFLARE_HOSTS = new Set(['api', 'www', 'manage']);

export function stripAnsi(value) {
  return String(value).replace(/\u001b\[[0-?]*[ -/]*[@-~]/gu, '');
}

export function extractTryCloudflareUrl(value) {
  const output = stripAnsi(value);
  const bannerIndex = output.lastIndexOf(QUICK_TUNNEL_BANNER);
  if (bannerIndex < 0) return null;

  for (const match of output.slice(bannerIndex + QUICK_TUNNEL_BANNER.length).matchAll(TRY_CLOUDFLARE_URL)) {
    try {
      const parsed = new URL(match[0]);
      if (
        parsed.protocol === 'https:'
        && parsed.port === ''
        && parsed.username === ''
        && parsed.password === ''
        && /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.trycloudflare\.com$/u.test(parsed.hostname)
        && !RESERVED_CLOUDFLARE_HOSTS.has(parsed.hostname.split('.')[0])
      ) {
        return parsed.origin;
      }
    } catch {
      // Ignore malformed log fragments and keep looking for a complete URL.
    }
  }
  return null;
}

export function createChunkMatcher(match, maximumBufferLength = 16_384) {
  let buffer = '';
  return (chunk) => {
    buffer = `${buffer}${String(chunk)}`.slice(-maximumBufferLength);
    return match(buffer);
  };
}

export function isMetroReadyOutput(value) {
  const output = stripAnsi(value);
  return /Metro waiting on\s+/iu.test(output)
    || /Waiting on (?:exp|http)s?:\/\//iu.test(output)
    || /Logs for your project will appear below/iu.test(output);
}

export function inspectExpoManifest({status, contentType, protocolVersion, body, expectedPublicUrl}) {
  if (!Number.isInteger(status) || status < 200 || status >= 300) {
    throw new Error(`公网 iOS manifest 返回 HTTP ${status ?? '未知'}。`);
  }
  if (!String(contentType ?? '').toLowerCase().includes('json')) {
    throw new Error(`公网入口没有返回 Expo manifest JSON（Content-Type: ${contentType || '缺失'}）。`);
  }
  if (!['0', '1'].includes(String(protocolVersion ?? ''))) {
    throw new Error(`公网入口的 Expo protocol version 响应头无效（实际: ${protocolVersion || '缺失'}）。`);
  }

  let manifest;
  try {
    manifest = JSON.parse(body);
  } catch {
    throw new Error('公网入口返回的 Expo manifest 不是有效 JSON。');
  }

  const launchUrl = manifest?.launchAsset?.url ?? manifest?.bundleUrl;
  if (!launchUrl || typeof launchUrl !== 'string') {
    throw new Error('公网入口返回的 Expo manifest 没有 iOS 启动包地址。');
  }
  const sdkVersion = manifest?.extra?.expoClient?.sdkVersion ?? manifest?.sdkVersion;
  if (typeof sdkVersion !== 'string' || !sdkVersion.startsWith('57.')) {
    throw new Error(`公网入口返回的 manifest 不是 Glass Notes 当前使用的 Expo SDK 57（实际: ${sdkVersion || '缺失'}）。`);
  }

  let expectedOrigin;
  let launch;
  try {
    expectedOrigin = new URL(expectedPublicUrl).origin;
    launch = new URL(launchUrl);
  } catch {
    throw new Error('公网入口返回的 iOS 启动包地址无效。');
  }
  if (launch.protocol !== 'https:' || launch.origin !== expectedOrigin) {
    throw new Error('公网 iOS 启动包地址没有使用本次 Cloudflare HTTPS 来源。');
  }
  return {manifest, launchUrl: launch.href, sdkVersion, protocolVersion: String(protocolVersion)};
}

export function liveOwnedPids(children) {
  return children
    .filter((child) => Number.isInteger(child?.pid) && child.pid > 0 && child.exitCode === null && child.signalCode == null)
    .map((child) => child.pid);
}
