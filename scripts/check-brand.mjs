import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
export const generatedBrandFiles = [
  'public/brand/apple-touch-icon.png', 'public/brand/favicon-32.png', 'public/brand/favicon.ico',
  'public/brand/favicon.svg', 'public/brand/icon-192.png', 'public/brand/icon-512.png',
  'src-tauri/icons/128x128.png', 'src-tauri/icons/128x128@2x.png', 'src-tauri/icons/32x32.png',
  'src-tauri/icons/icon.icns', 'src-tauri/icons/icon.ico', 'src-tauri/icons/icon.png',
].sort();

// ICNS encoders may reorder equivalent image chunks on different platforms.
// Hash their type and image payload, preserving every image while ignoring chunk order.
export function brandFileHash(file, bytes) {
  if (file.endsWith('.icns')) {
    if (bytes.length < 8 || bytes.toString('ascii', 0, 4) !== 'icns' || bytes.readUInt32BE(4) !== bytes.length) throw Error('Invalid ICNS header');
    const records = [];
    for (let offset = 8; offset < bytes.length;) {
      if (offset + 8 > bytes.length) throw Error('Truncated ICNS image');
      const length = bytes.readUInt32BE(offset + 4);
      if (length < 8 || offset + length > bytes.length) throw Error('Invalid ICNS image length');
      const type = bytes.toString('ascii', offset, offset + 4);
      records.push(`${type}:${createHash('sha256').update(bytes.subarray(offset + 8, offset + length)).digest('hex')}`);
      offset += length;
    }
    if (!records.length) throw Error('Empty ICNS image family');
    return createHash('sha256').update(records.sort().join('\n')).digest('hex');
  }
  const text = /\.(svg|xml|mjs|json)$/.test(file);
  return createHash('sha256').update(text ? bytes.toString('utf8').replace(/\r\n/g, '\n') : bytes).digest('hex');
}

export async function checkBrand({directory = root, includeGenerated = true} = {}) {
  const manifest = JSON.parse(await fs.readFile(path.join(directory, 'assets/brand/manifest.json'), 'utf8'));
  if (manifest.schema !== 2 || !Array.isArray(manifest.files) || !Array.isArray(manifest.generatedFiles) || JSON.stringify(manifest.generatedFiles.map(record => record.file).sort()) !== JSON.stringify(generatedBrandFiles)) {
    throw Error('Brand manifest must enumerate exactly the supported Web and desktop outputs. Run npm run brand:build.');
  }
  const records = [...manifest.files, ...(includeGenerated ? manifest.generatedFiles : [])];
  const stale = [];
  for (const record of records) {
    if (!record.file || path.posix.normalize(record.file) !== record.file || path.isAbsolute(record.file) || record.file.startsWith('../') || record.file.includes('\\')) throw Error('Invalid brand manifest path');
    try {
      const absolute = path.join(directory, record.file);
      if (!(await fs.lstat(absolute)).isFile()) throw Error('Brand input must be a regular file');
      const bytes = await fs.readFile(absolute);
      const hash = brandFileHash(record.file, bytes);
      if (hash !== record.sha256) stale.push(record.file);
    } catch { stale.push(record.file); }
  }
  if (stale.length) throw new Error(`Brand assets are missing or stale. Run npm run brand:build.\n${stale.join('\n')}`);
  return records.length;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // Finish loading this module before the preparer imports its shared checks.
  import('./prepare-brand.mjs').then(async ({prepareBrand}) => {
    await prepareBrand();
    console.log(`Brand checked: ${await checkBrand()} source and output files.`);
  }).catch(error => {console.error(error.message); process.exitCode = 1;});
}
