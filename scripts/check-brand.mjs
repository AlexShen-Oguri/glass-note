import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
export async function checkBrand() {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'assets/brand/manifest.json'), 'utf8'));
  const stale = [];
  for (const record of manifest.files) {
    try {
      const bytes = await fs.readFile(path.join(root, record.file));
      const text = /\.(svg|xml|mjs|json)$/.test(record.file);
      const hash = createHash('sha256').update(text ? bytes.toString('utf8').replace(/\r\n/g, '\n') : bytes).digest('hex');
      if (hash !== record.sha256) stale.push(record.file);
    } catch { stale.push(record.file); }
  }
  if (stale.length) throw new Error(`Brand assets are missing or stale. Run npm run brand:build.\n${stale.join('\n')}`);
  return manifest.files.length;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(`Brand checked: ${await checkBrand()} source and output files.`);
