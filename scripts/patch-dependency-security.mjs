import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

// Project depth guard for GHSA-vfj7-8cjw-p6xm. The upstream PR #75 only
// guards some walkers; these fixed guards also cover stringify and flatten.
const depthGuard = `
// A fixed guard protects all recursive helpers without consuming AST iterators.
exports.checkDepth = depth => {
  if (depth > 64) {
    throw new RangeError('input exceeds maximum nesting depth (64)');
  }
};
`;

// Byte-identical rsa.js post-image from digitalbazaar/forge PR #1157,
// commit 683ab3344899cc08a581e4d5675a33e87aff7b04 (includes PR #1152).
// Upstream copyright/licence notices remain in node-forge; see notices.
const forgeBefore = `          // validate DigestInfo structure and element count
          var capture = {};
          var errors = [];
          if(!asn1.validate(obj, digestInfoValidator, capture, errors) ||
            obj.value.length !== 2) {`;
const forgeAfter = `          // validate DigestInfo structure and element counts (outer DigestInfo
          // and nested DigestAlgorithm). asn1.validate ignores extra children,
          // so length must be checked explicitly at each nesting level to
          // prevent low-exponent PKCS#1 v1.5 signature forgery (CVE-2026-85393).
          // ASN.1 NULL parameters must also be empty, not unchecked bytes.
          var capture = {};
          var errors = [];
          if(!asn1.validate(obj, digestInfoValidator, capture, errors) ||
            obj.value.length !== 2 ||
            obj.value[0].value.length !==
              (('parameters' in capture) ? 2 : 1) ||
            ('parameters' in capture && capture.parameters !== '')) {`;

const guardedWalk = source => source
  .replace('const walk = (node, parent = {}) => {', 'const walk = (node, parent = {}, depth = 0) => {\n    utils.checkDepth(depth);')
  .replace('walk(child, node);', 'walk(child, node, depth + 1);');

export const securityPatches = [
  {
    name: 'braces', version: '3.0.3', advisory: 'GHSA-vfj7-8cjw-p6xm',
    files: [
      {file: 'lib/compile.js', before: 'dc98f22eee3d511785d92a00758d5f0d48efed5f5813bdecc2de430c529b5c9f', after: '2de4c7465459366989e4726fb70e54c6980c5b941c0615660ca0d520858adeac', transform: guardedWalk},
      {file: 'lib/expand.js', before: '41ccc196ebfa7b7781a634e721eb744e4e7bcb54cba427a7e3d6806a1b9e58f7', after: '0ef70c74aded1fa73e95976441907e79dc1647deb7f7389da792ff94ec173fda', transform: source => guardedWalk(source)
        .replace("const append = (queue = '', stash = '', enclose = false) => {", "const append = (queue = '', stash = '', enclose = false, depth = 0) => {\n  utils.checkDepth(depth);")
        .replace('append(value, stash, enclose)', 'append(value, stash, enclose, depth + 1)')
        .replace('append(item, ele, enclose)', 'append(item, ele, enclose, depth + 1)')},
      {file: 'lib/stringify.js', before: '379f22d77bfa1478341ccd49c5e4267464aabcbba03558bab332aac23fc6f23a', after: '96dac196755cf3d8843211afc513912d183304b1d282853434ecd33216f25ac1', transform: source => source
        .replace('const stringify = (node, parent = {}) => {', 'const stringify = (node, parent = {}, depth = 0) => {\n    utils.checkDepth(depth);')
        .replace('stringify(child);', 'stringify(child, undefined, depth + 1);')},
      {file: 'lib/utils.js', before: 'b5a7596aa67730412b3c029ef09e84e6b67b8e445cffd35d1d295549c89066c7', after: '3eac4693d3baf2486debacb2c90973fddfe14895cb3c54fde0af563cbec3222c', transform: source => source
        .replace('const flat = arr => {', 'const flat = (arr, depth = 0) => {\n    exports.checkDepth(depth);')
        .replace('flat(ele);', 'flat(ele, depth + 1);') + depthGuard},
    ],
  },
  {
    name: 'node-forge', version: '1.4.0', advisory: 'GHSA-86w9-cpqp-85rv',
    files: [{file: 'lib/rsa.js', before: 'fd4740238145ec26470eb3f06a627c72039538ce1307dbdce40521f94dfd0a50', after: '22cdfb3220439533211cf00ff7c7e6605607761d77a2c3c263411d4c70798c4f', transform: source => source.replace(forgeBefore, forgeAfter)}],
  },
];

const digest = source => createHash('sha256').update(source).digest('hex');
const changed = name => new Error(`${name} changed; review or remove the security backport before installing.`);

export function patchedDependencySource(source, version, patch, file) {
  const normalized = source.replace(/\r\n/g, '\n');
  if (version !== patch.version) throw changed(patch.name);
  const hash = digest(normalized);
  if (hash === file.after) return normalized;
  if (hash !== file.before) throw changed(patch.name);
  const result = file.transform(normalized);
  if (digest(result) !== file.after) throw changed(patch.name);
  return result;
}

async function installedTargets(root) {
  const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
  const targets = [];
  for (const patch of securityPatches) {
    const directories = Object.keys(lock.packages ?? {}).filter(directory => directory === `node_modules/${patch.name}` || directory.endsWith(`/node_modules/${patch.name}`));
    if (!directories.length) throw changed(patch.name);
    for (const directory of directories) {
      if (!directory.startsWith('node_modules/') || directory.includes('\\') || directory.split('/').some(part => part === '.' || part === '..')) throw changed(patch.name);
      const location = path.join(root, directory);
      const manifest = JSON.parse(await readFile(path.join(location, 'package.json'), 'utf8'));
      if (lock.packages[directory].version !== patch.version || manifest.name !== patch.name || manifest.version !== patch.version) throw changed(patch.name);
      targets.push({patch, directory, location});
    }
  }
  return targets;
}

export async function installSecurityPatches(root) {
  const changes = [];
  const targets = await installedTargets(root);
  // Validate every copy and file before writing, so an upstream change fails
  // installation rather than leaving an apparently successful partial patch.
  for (const {patch, location} of targets) {
    for (const file of patch.files) {
      const target = path.join(location, file.file);
      const source = await readFile(target, 'utf8');
      const result = patchedDependencySource(source, patch.version, patch, file);
      if (result !== source) changes.push({target, result});
    }
  }
  for (const {target, result} of changes) await writeFile(target, result);
  await verifySecurityPatches(root);
  console.log(`Verified security backports in ${targets.length} installed dependency copies; package versions and npm audit advisories are unchanged.`);
}

export async function verifySecurityPatches(root) {
  const targets = await installedTargets(root);
  for (const {patch, location} of targets) {
    for (const file of patch.files) {
      const source = (await readFile(path.join(location, file.file), 'utf8')).replace(/\r\n/g, '\n');
      if (digest(source) !== file.after) throw new Error(`${patch.name}/${file.file}: security backport missing or modified`);
    }
  }
  return targets.map(({patch, directory}) => ({name: patch.name, version: patch.version, advisory: patch.advisory, directory}));
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  if (process.argv.slice(2).length > 1 || (process.argv[2] && process.argv[2] !== '--check')) throw new Error('Use --check to verify installed security patches without writing.');
  if (process.argv[2] === '--check') console.log(JSON.stringify(await verifySecurityPatches(root), null, 2));
  else await installSecurityPatches(root);
}
