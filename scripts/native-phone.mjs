import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {access, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {
  createChunkMatcher,
  extractTryCloudflareUrl,
  inspectExpoManifest,
  isMetroReadyOutput,
  liveOwnedPids,
} from './native-phone-utils.mjs';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8081;
const CLOUDFLARED_PATH = path.join(PROJECT_ROOT, '.cache', 'cloudflared', 'cloudflared.exe');
const CLOUDFLARED_VERSION = '2026.9.0';
const CLOUDFLARED_SHA256 = '547057326266f0e1c7d50d102dbd22ff283d740c055bd61e94f10e2c606f89af';
const CLOUDFLARED_URL = `https://github.com/cloudflare/cloudflared/releases/download/${CLOUDFLARED_VERSION}/cloudflared-windows-amd64.exe`;
const ARTIFACT_DIR = path.join(PROJECT_ROOT, 'artifacts', 'browser');
const QR_PATH = path.join(ARTIFACT_DIR, 'expo-go-qr.png');
const CONNECTION_PATH = path.join(ARTIFACT_DIR, 'expo-go-connection.json');
const ownedChildren = [];
let stopping = false;
let ownsArtifacts = false;
let connection = {status: 'starting', updatedAt: new Date().toISOString()};

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function pathExists(target) {
  return access(target).then(() => true, () => false);
}

async function sha256(target) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(target)) hash.update(chunk);
  return hash.digest('hex');
}

async function recordConnection(next) {
  connection = {...connection, ...next, updatedAt: new Date().toISOString()};
  await mkdir(ARTIFACT_DIR, {recursive: true});
  await writeFile(CONNECTION_PATH, `${JSON.stringify(connection, null, 2)}\n`, 'utf8');
}

async function verifyProjectIdentity() {
  process.chdir(PROJECT_ROOT);
  const packageJson = JSON.parse(await readFile(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
  if (packageJson.name !== 'glass-notes') {
    throw new Error(`启动器所在目录不是 Glass Notes 项目：${PROJECT_ROOT}`);
  }
}

async function verifyRuntime() {
  const required = ['expo', 'react-native', 'qrcode'];
  const missing = [];
  for (const dependency of required) {
    if (!await pathExists(path.join(PROJECT_ROOT, 'node_modules', ...dependency.split('/')))) missing.push(dependency);
  }
  if (missing.length) {
    throw new Error(`缺少项目依赖：${missing.join(', ')}。请先在项目目录运行 npm install，再重新启动。`);
  }

  if (!await pathExists(CLOUDFLARED_PATH)) {
    throw new Error([
      `缺少 Cloudflare 官方客户端：${CLOUDFLARED_PATH}`,
      `请下载固定版本 ${CLOUDFLARED_VERSION}：${CLOUDFLARED_URL}`,
      `下载后核对 SHA-256：${CLOUDFLARED_SHA256}`,
    ].join('\n'));
  }
  const actualHash = await sha256(CLOUDFLARED_PATH);
  if (actualHash.toLowerCase() !== CLOUDFLARED_SHA256) {
    throw new Error(`Cloudflare 客户端校验失败。预期 ${CLOUDFLARED_SHA256}，实际 ${actualHash.toLowerCase()}。`);
  }
}

function probeAddress(host) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', (error) => {
      if (error.code === 'EADDRNOTAVAIL' || error.code === 'EAFNOSUPPORT') resolve();
      else reject(error);
    });
    server.listen({host, port: PORT, exclusive: true}, () => server.close(resolve));
  });
}

async function assertPortFree() {
  try {
    await probeAddress('127.0.0.1');
    await probeAddress('::1');
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      throw new Error(`本机 ${PORT} 端口已被其他服务占用。为避免关闭其他项目或应用，本启动器不会自动清理它；请先确认并关闭占用者。`);
    }
    throw error;
  }
}

function startOwned(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: PROJECT_ROOT,
    env: options.env ?? process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
    windowsHide: true,
  });
  ownedChildren.push(child);
  child.nativePhoneSpawnError = null;
  child.on('error', (error) => {
    child.nativePhoneSpawnError = error;
  });
  child.stdout?.on('data', (chunk) => process.stdout.write(chunk));
  child.stderr?.on('data', (chunk) => process.stderr.write(chunk));
  return child;
}

function rejectOnUnexpectedExit(child, description) {
  return new Promise((_, reject) => {
    if (child.nativePhoneSpawnError) {
      reject(new Error(`${description}启动失败：${child.nativePhoneSpawnError.message}`));
      return;
    }
    if (child.exitCode !== null || child.signalCode !== null) {
      reject(new Error(`${description}已退出（code ${child.exitCode ?? 'null'}, signal ${child.signalCode ?? 'none'}）。`));
      return;
    }
    child.once('error', (error) => reject(new Error(`${description}运行失败：${error.message}`)));
    child.once('exit', (code, signal) => reject(new Error(`${description}已退出（code ${code ?? 'null'}, signal ${signal ?? 'none'}）。`)));
  });
}

function waitForOutput(child, match, deadlineMs, description) {
  return new Promise((resolve, reject) => {
    const push = createChunkMatcher(match);
    const timeout = setTimeout(() => finish(new Error(`${description}在 ${Math.round(deadlineMs / 1000)} 秒内未就绪。`)), deadlineMs);
    const onData = (chunk) => {
      const result = push(chunk);
      if (result) finish(null, result);
    };
    const onExit = (code, signal) => finish(new Error(`${description}提前退出（code ${code ?? 'null'}, signal ${signal ?? 'none'}）。`));
    const onError = (error) => finish(new Error(`${description}启动失败：${error.message}`));
    const finish = (error, value) => {
      clearTimeout(timeout);
      child.stdout?.off('data', onData);
      child.stderr?.off('data', onData);
      child.off('exit', onExit);
      child.off('error', onError);
      if (error) reject(error);
      else resolve(value);
    };
    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.once('exit', onExit);
    child.once('error', onError);
  });
}

async function terminatePidTree(pid) {
  if (process.platform !== 'win32') {
    const child = ownedChildren.find((candidate) => candidate.pid === pid);
    child?.kill('SIGTERM');
    return;
  }
  await new Promise((resolve) => {
    const terminator = spawn('taskkill.exe', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    terminator.once('error', resolve);
    terminator.once('exit', resolve);
  });
}

async function stopOwnedChildren() {
  const pids = liveOwnedPids(ownedChildren).reverse();
  await Promise.allSettled(pids.map(terminatePidTree));
}

async function stopOwnedChild(child) {
  if (liveOwnedPids([child]).length) await terminatePidTree(child.pid);
}

async function startQuickTunnel(maximumAttempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    console.log(`正在建立本次 Cloudflare 临时入口（第 ${attempt}/${maximumAttempts} 次）…`);
    const cloudflared = startOwned(CLOUDFLARED_PATH, [
      'tunnel', '--url', `http://localhost:${PORT}`, '--protocol', 'http2', '--no-autoupdate',
    ]);
    try {
      const publicUrl = await waitForOutput(cloudflared, extractTryCloudflareUrl, 45_000, 'Cloudflare 临时入口');
      return {cloudflared, publicUrl};
    } catch (error) {
      lastError = error;
      await stopOwnedChild(cloudflared);
      if (attempt < maximumAttempts) {
        console.warn(`Cloudflare 本次连接未成功：${error.message}`);
        console.warn('将在清理本次客户端后重试。');
      }
    }
  }
  throw new Error(`Cloudflare 临时入口连续 ${maximumAttempts} 次未建立：${lastError?.message ?? '未知错误'}`);
}

async function fetchPublicIosManifest(publicUrl, deadlineMs = 90_000) {
  const deadline = Date.now() + deadlineMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(publicUrl, {
        headers: {
          accept: 'application/expo+json',
          'expo-platform': 'ios',
          'expo-protocol-version': '0',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(12_000),
      });
      const body = await response.text();
      return inspectExpoManifest({
        status: response.status,
        contentType: response.headers.get('content-type'),
        protocolVersion: response.headers.get('expo-protocol-version'),
        body,
        expectedPublicUrl: publicUrl,
      });
    } catch (error) {
      lastError = error;
      await delay(2_000);
    }
  }
  throw new Error(`公网 iOS manifest 在 ${Math.round(deadlineMs / 1000)} 秒内未通过检查：${lastError?.message ?? '未知错误'}`);
}

async function createQr(expoGoUrl) {
  const imported = await import('qrcode');
  const qrCode = imported.default ?? imported;
  await qrCode.toFile(QR_PATH, expoGoUrl, {
    errorCorrectionLevel: 'M',
    margin: 3,
    width: 768,
    color: {dark: '#15120f', light: '#fffdf8'},
  });
  return qrCode.toString(expoGoUrl, {type: 'terminal', small: true});
}

async function shutdown(exitCode, message) {
  if (stopping) return;
  stopping = true;
  if (message) console.error(`\n${message}`);
  await stopOwnedChildren();
  if (ownsArtifacts) {
    await rm(QR_PATH, {force: true}).catch(() => {});
    await recordConnection({status: [0, 130, 143].includes(exitCode) ? 'stopped' : 'failed', error: message ?? null}).catch(() => {});
  }
  process.exit(exitCode);
}

async function main() {
  console.log('Glass Notes 手机验收启动器');
  console.log('正在核对项目、依赖、Cloudflare 客户端与 8081 端口…');
  await verifyProjectIdentity();
  await assertPortFree();
  ownsArtifacts = true;
  await rm(QR_PATH, {force: true});
  await recordConnection({status: 'starting', publicUrl: null, expoGoUrl: null, qrPath: QR_PATH, error: null});
  await verifyRuntime();

  const {cloudflared, publicUrl} = await startQuickTunnel();
  const publicHost = new URL(publicUrl).host;
  const expoGoUrl = `exps://${publicHost}`;
  await recordConnection({status: 'tunnel-ready', publicUrl, expoGoUrl});
  console.log(`\n已取得本次真实临时地址：${publicUrl}`);

  const expoCli = path.join(PROJECT_ROOT, 'node_modules', 'expo', 'bin', 'cli');
  console.log('正在启动 Expo Metro（localhost:8081）…');
  const expo = startOwned(process.execPath, [expoCli, 'start', '--localhost', '--go', '--port', String(PORT)], {
    env: {...process.env, EXPO_NO_TELEMETRY: '1', EXPO_PACKAGER_PROXY_URL: publicUrl},
  });
  await Promise.race([
    waitForOutput(expo, (value) => isMetroReadyOutput(value) || null, 120_000, 'Expo Metro'),
    rejectOnUnexpectedExit(cloudflared, 'Cloudflare 临时入口'),
  ]);

  console.log('正在从公网入口检查 iOS Expo manifest…');
  const {launchUrl, sdkVersion, protocolVersion} = await Promise.race([
    fetchPublicIosManifest(publicUrl),
    rejectOnUnexpectedExit(cloudflared, 'Cloudflare 临时入口'),
    rejectOnUnexpectedExit(expo, 'Expo Metro'),
  ]);
  const terminalQr = await createQr(expoGoUrl);
  await recordConnection({status: 'ready', publicUrl, expoGoUrl, qrPath: QR_PATH, manifestLaunchUrl: launchUrl, sdkVersion, protocolVersion, readyAt: new Date().toISOString(), error: null});

  console.log(`\n公网 iOS manifest 已通过检查（Expo SDK ${sdkVersion}，protocol ${protocolVersion}）。`);
  console.log(`Expo Go 链接：${expoGoUrl}`);
  console.log(terminalQr);
  console.log(`二维码：${QR_PATH}`);
  console.log('电脑每次重启或重新运行后都会产生新地址；旧二维码已经失效，请扫描本次二维码。');
  console.log('请保持电脑唤醒及此窗口运行，并在 iPhone Expo Go 登录与电脑相同的 Expo 账号。');
  console.log('若系统相机显示链接，打开后应转入 Expo Go。完成后按 Ctrl+C 关闭本次入口。\n');

  await Promise.race([
    rejectOnUnexpectedExit(cloudflared, 'Cloudflare 临时入口'),
    rejectOnUnexpectedExit(expo, 'Expo Metro'),
  ]);
}

process.once('SIGINT', () => void shutdown(130, '\n正在关闭本次手机验收入口…'));
process.once('SIGTERM', () => void shutdown(143, '\n正在关闭本次手机验收入口…'));

main().catch((error) => void shutdown(1, `启动失败：${error.message}`));
