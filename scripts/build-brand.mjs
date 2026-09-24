import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const at = (...parts) => path.join(root, ...parts);
const minimumIoU = 0.995;
const geometry = JSON.parse(await fs.readFile(at('assets/brand/reference-geometry.json'), 'utf8'));
const comparison = JSON.parse(await fs.readFile(at('assets/brand/reference-comparison.json'), 'utf8'));
const referenceBytes = await fs.readFile(at(geometry.source));
const referenceSha256 = createHash('sha256').update(referenceBytes).digest('hex');
if (referenceSha256 !== geometry.sourceSha256 || referenceSha256 !== comparison.referenceSha256) {
  throw new Error(`Brand reference SHA-256 mismatch. Source=${referenceSha256}, geometry=${geometry.sourceSha256}, comparison=${comparison.referenceSha256}.`);
}
const comparisonByName = new Map(Array.isArray(comparison.regions) ? comparison.regions.map(record => [record.name, record]) : []);
const failedComparisons = Object.keys(geometry.regions ?? {}).filter(name => {
  const value = comparisonByName.get(name)?.intersectionOverUnion;
  return !Number.isFinite(value) || value < minimumIoU;
});
if (failedComparisons.length || comparisonByName.size !== Object.keys(geometry.regions ?? {}).length) {
  throw new Error(`Brand comparison is missing or below minimum IoU ${minimumIoU}: ${failedComparisons.join(', ') || 'region set mismatch'}.`);
}
const appMark = await fs.readFile(at('assets/brand/reference-appMark.svg'), 'utf8');
const referenceLockup = await fs.readFile(at('assets/brand/reference-lockup.svg'), 'utf8');
const inner = svg => svg.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<(title|desc)>[\s\S]*?<\/\1>/g, '').split('\n').map(line => line.trimEnd()).join('\n').trim();
const markBox = appMark.match(/viewBox="([^"]+)"/)[1];
const lockupBox = referenceLockup.match(/viewBox="([^"]+)"/)[1];
const svg = (width, height, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>\n`;
const ink = '#101714';
const ivory = '#F0EBDF';
const outputs = [];
const mark = svg(256,256,`<svg x="8" y="8" width="240" height="240" viewBox="${markBox}" fill="${ink}">${inner(appMark)}</svg>`);
async function write(relative, data) {
  await fs.mkdir(path.dirname(at(relative)), {recursive:true});
  await fs.writeFile(at(relative), data);
  outputs.push(relative);
}
async function render(relative, source, size) {
  await write(relative, await sharp(Buffer.from(source)).resize(size).png().toBuffer());
}

await write('assets/brand/mark.svg',mark);
for (const [name, color] of [['ivory', ivory], ['ink', ink]]) {
  const symbol = svg(256, 256, `<svg x="8" y="8" width="240" height="240" viewBox="${markBox}" fill="${color}">${inner(appMark)}</svg>`);
  const lockup = svg(1024, 275, `<svg width="1024" height="275" viewBox="${lockupBox}" fill="${color}">${inner(referenceLockup)}</svg>`);
  await write(`assets/brand/mark-${name}.svg`, symbol);
  await write(`assets/brand/lockup-${name}.svg`, lockup);
  await render(`assets/brand/mark-${name}.png`, symbol, 1024);
  await render(`assets/brand/lockup-${name}.png`, lockup, 1024);
}
// The approved tile is at (101,735), with a 244px square framing. Preserve source position and scale.
const iconBody = radius => `<rect width="512" height="512" rx="${radius}" fill="${ink}"/><g fill="${ivory}" transform="scale(${512/244}) translate(34 35)">${inner(appMark)}</g>`;
const desktop = svg(512, 512, iconBody(102));
const app = svg(512, 512, iconBody(0));
await write('assets/desktop/icon.svg', desktop);
await render('assets/brand/app-icon.png', app, 1024);
await write('public/brand/favicon.svg', desktop);
await render('public/brand/apple-touch-icon.png', app, 180);
await render('public/brand/icon-192.png', app, 192);
await render('public/brand/icon-512.png', app, 512);

// Tauri's pinned renderer creates the multi-resolution ICO and native PNG family.
function icnsImageRecords(bytes) {
  if (bytes.length < 8 || bytes.toString('ascii', 0, 4) !== 'icns' || bytes.readUInt32BE(4) !== bytes.length) return [];
  const records = [];
  for (let offset = 8; offset < bytes.length;) {
    if (offset + 8 > bytes.length) return [];
    const length = bytes.readUInt32BE(offset + 4);
    if (length < 8 || offset + length > bytes.length) return [];
    const type = bytes.toString('ascii', offset, offset + 4);
    const payload = bytes.subarray(offset + 8, offset + length);
    records.push(`${type}:${createHash('sha256').update(payload).digest('hex')}`);
    offset += length;
  }
  return records.sort();
}
async function syncNativeFiles(sourceDirectory, relative = '') {
  for (const entry of await fs.readdir(path.join(sourceDirectory, relative), {withFileTypes:true})) {
    if (entry.isSymbolicLink()) throw new Error('Generated native icons cannot contain links.');
    const file = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      await syncNativeFiles(sourceDirectory, file);
      continue;
    }
    const generated = await fs.readFile(path.join(sourceDirectory, file));
    const target = at('src-tauri/icons', file);
    let existing;
    try { existing = await fs.readFile(target); } catch {}
    const sameIcnsImages = entry.name === 'icon.icns' && existing && (() => {
      const previousRecords = icnsImageRecords(existing);
      const generatedRecords = icnsImageRecords(generated);
      return previousRecords.length && JSON.stringify(previousRecords) === JSON.stringify(generatedRecords);
    })();
    if (!existing?.equals(generated) && !sameIcnsImages) {
      await fs.mkdir(path.dirname(target), {recursive:true});
      await fs.writeFile(target, generated);
    }
  }
}
const nativeTempPrefix = 'glass-notes-brand-icons-';
function checkedNativeTemp(directory) {
  const resolved = path.resolve(directory);
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith(nativeTempPrefix)) {
    throw new Error(`Refusing to use unexpected native icon temporary directory: ${resolved}`);
  }
  return resolved;
}
const nativeOutput = checkedNativeTemp(await fs.mkdtemp(path.join(os.tmpdir(), nativeTempPrefix)));
try {
  const native = spawnSync(process.execPath, [at('node_modules/@tauri-apps/cli/tauri.js'), 'icon', at('assets/desktop/icon.svg'), '--output', nativeOutput, '--ios-color', ink], {cwd:root, stdio:'inherit', windowsHide:true});
  if (native.status !== 0) throw new Error(`Tauri icon generation failed: ${native.status ?? native.error?.message}`);
  await syncNativeFiles(nativeOutput);
} finally {
  await fs.rm(checkedNativeTemp(nativeOutput), {recursive:true, force:true});
}
await write('public/brand/favicon.ico', await fs.readFile(at('src-tauri/icons/icon.ico')));
await write('public/brand/favicon-32.png', await fs.readFile(at('src-tauri/icons/32x32.png')));

const preview = svg(1200, 640, `<rect width="1200" height="640" fill="${ivory}"/><rect x="20" y="20" width="1160" height="360" rx="24" fill="${ink}"/><svg x="105" y="60" width="990" height="266" viewBox="0 0 1024 275">${inner(await fs.readFile(at('assets/brand/lockup-ivory.svg'), 'utf8'))}</svg><svg x="64" y="415" width="180" height="180" viewBox="0 0 512 512">${iconBody(102)}</svg><g transform="translate(300 420) scale(.7)">${inner(mark)}</g><g transform="translate(540 448) scale(.45)">${inner(mark)}</g><g transform="translate(720 464) scale(.3)">${inner(mark)}</g><g transform="translate(860 490) scale(.125)">${inner(mark)}</g><g transform="translate(956 494) scale(.094)">${inner(mark)}</g><g transform="translate(1040 498) scale(.0625)">${inner(mark)}</g>`);
await write('design/brand/selected-production.svg', preview);
await render('design/brand/selected-production.png', preview, 1200);
async function nativeFiles(directory) {
  const files = [];
  for (const entry of await fs.readdir(at(directory), {withFileTypes:true})) {
    const file = `${directory}/${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error('Brand output cannot contain links.');
    if (entry.isDirectory()) files.push(...await nativeFiles(file));
    else files.push(file);
  }
  return files.sort();
}
const records = await Promise.all(['assets/brand/reference-appMark.svg', 'assets/brand/reference-lockup.svg', 'assets/brand/reference-geometry.json', 'assets/brand/reference-comparison.json', 'design/brand/selected-reference.png', 'scripts/trace-selected-brand.mjs', 'scripts/compare-brand-reference.mjs', 'scripts/build-brand.mjs', ...outputs, ...await nativeFiles('src-tauri/icons')].map(async file => {
  const bytes = await fs.readFile(at(file));
  const text = /\.(svg|xml|mjs|json)$/.test(file);
  return {file, sha256:createHash('sha256').update(text ? bytes.toString('utf8').replace(/\r\n/g, '\n') : bytes).digest('hex')};
}));
await fs.writeFile(at('assets/brand/manifest.json'), JSON.stringify({design:'Liquid G — selected original A concept', colors:{ink, ivory}, hashEncoding:'SHA-256, CRLF normalized to LF for SVG/XML/MJS/JSON; binary files unchanged', generation:'npm run brand:build; committed contours traced from selected-reference.png; no runtime font dependency', files:records}, null, 2)+'\n');
console.log(`Brand generated from two vector masters: ${outputs.length} assets plus native icon family.`);
