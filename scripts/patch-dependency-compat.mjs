import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';
import path from 'node:path';

const original = "const decodeComponent = require('decode-uri-component');";
const replacement = "const decodeComponent = require('decode-uri-component').default;";
const expectedHash = 'caa3f2c8b45dfe1e91db22ae10743af68de8d96f26515132bb52485ec0f037fa';

// The upstream decoder is fixed in 0.5.0, but query-string 7 expects CommonJS.
// Fail closed on an upstream change instead of silently applying a stale patch.
export function compatibleQueryString(source, version) {
  const normalized = source.replace(/\r\n/g, '\n');
  const before = normalized.replace(replacement, original);
  if (version !== '7.1.3' || createHash('sha256').update(before).digest('hex') !== expectedHash) {
    throw new Error('query-string changed; review or remove the decoder compatibility patch before installing.');
  }
  return normalized.replace(original, replacement);
}

async function install() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const directory = path.join(root, 'node_modules/query-string');
  const {version} = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'));
  const target = path.join(directory, 'index.js');
  const source = await readFile(target, 'utf8');
  const result = compatibleQueryString(source, version);
  if (result !== source) await writeFile(target, result);
  console.log('Verified query-string 7.1.3 compatibility with the upstream fixed decoder.');
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) await install();
