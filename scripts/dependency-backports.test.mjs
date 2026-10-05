import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, mkdtemp, rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {generateKeyPairSync, sign} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {securityPatches, patchedDependencySource, installSecurityPatches, verifySecurityPatches} from './patch-dependency-security.mjs';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const braces = require('braces');
const forge = require('node-forge');
const depthError = error => error instanceof RangeError && /maximum nesting depth \(64\)/.test(error.message);
const nested = (n, left = '{', right = '}') => left.repeat(n) + 'a,b' + right.repeat(n);

test('every installed backport is intact, idempotent and rejects changed source or versions', async () => {
  const targets = await verifySecurityPatches(root);
  assert(targets.some(target => target.name === 'braces'));
  assert(targets.some(target => target.name === 'node-forge'));
  for (const target of targets) {
    const patch = securityPatches.find(patch => patch.name === target.name);
    for (const file of patch.files) {
      const source = await readFile(path.join(root, target.directory, file.file), 'utf8');
      assert.equal(patchedDependencySource(source, target.version, patch, file), source);
      assert.throws(() => patchedDependencySource(source + '\n// unexpected upstream change', target.version, patch, file), /review or remove/);
      assert.throws(() => patchedDependencySource(source, '99.0.0', patch, file), /review or remove/);
    }
  }
});

test('nested dependency copies are checked and a modified copy cannot pass installation', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'glass-notes-backports-test-'));
  try {
    const packages = {};
    for (const patch of securityPatches) {
      for (const prefix of ['node_modules/', 'node_modules/fixture/node_modules/']) {
        const directory = prefix + patch.name;
        packages[directory] = {version: patch.version};
        await mkdir(path.join(fixture, directory, 'lib'), {recursive: true});
        await writeFile(path.join(fixture, directory, 'package.json'), JSON.stringify({name: patch.name, version: patch.version}));
        for (const file of patch.files) await writeFile(path.join(fixture, directory, file.file), await readFile(path.join(root, 'node_modules', patch.name, file.file)));
      }
    }
    await writeFile(path.join(fixture, 'package-lock.json'), JSON.stringify({packages}));
    assert.equal((await verifySecurityPatches(fixture)).length, 4);
    await installSecurityPatches(fixture);
    const target = path.join(fixture, 'node_modules/fixture/node_modules/braces/lib/compile.js');
    await writeFile(target, (await readFile(target, 'utf8')) + '\n// modified');
    await assert.rejects(verifySecurityPatches(fixture), /missing or modified/);
    await assert.rejects(installSecurityPatches(fixture), /review or remove/);
  } finally {await rm(fixture, {recursive: true, force: true});}
});

test('deep strings, ASTs, parentheses and the parser stringify path stop at a controlled depth', () => {
  for (const pattern of [nested(4400), nested(4400, '(', ')')]) {
    for (const method of ['compile', 'expand', 'stringify']) {
      assert.throws(() => braces[method](pattern), depthError);
      assert.throws(() => braces[method](braces.parse(pattern)), depthError);
    }
    assert.throws(() => braces(pattern), depthError);
    assert.throws(() => braces([pattern], {expand: true}), depthError);
  }
  assert.throws(() => braces.parse('{1..' + nested(100) + ',z}'), depthError);
  for (const method of ['compile', 'expand', 'stringify']) {
    const internal = require(`braces/lib/${method}`);
    assert.throws(() => internal(braces.parse(nested(100))), depthError);
  }
});

test('AST guards preserve iterables, single-use generators and normal parent/prev back references', () => {
  const tree = depth => {
    let node = {type: 'text', value: 'x'};
    for (let i = 0; i < depth; i++) node = {type: 'root', nodes: new Set([node])};
    return node;
  };
  for (const method of ['compile', 'stringify']) {
    const generator = {type: 'root', nodes: (function* () {yield {type: 'text', value: 'x'};})()};
    assert.equal(braces[method](generator), 'x');
    assert.equal(braces[method](tree(64)), 'x');
    assert.throws(() => braces[method](tree(65)), depthError);
    assert.throws(() => braces[method](tree(100), {maxDepth: Infinity}), depthError);
  }
  assert.equal(braces.compile(braces.parse('{a,b}')), '(a|b)');
  const cycle = {type: 'root', nodes: []};
  cycle.nodes.push(cycle);
  assert.throws(() => braces.compile(cycle), depthError);
  assert.throws(() => braces.stringify(cycle), depthError);
  let array = ['x'];
  for (let i = 0; i < 100; i++) array = [array];
  assert.throws(() => require('braces/lib/utils').flatten(array), depthError);
});

test('ordinary brace alternatives, ranges and literal forms keep their existing results', () => {
  assert.deepEqual(braces.expand('a{1..3}b{c,d}'), ['a1bc', 'a1bd', 'a2bc', 'a2bd', 'a3bc', 'a3bd']);
  assert.deepEqual(braces.expand('{a,b{1..2}}'), ['a', 'b1', 'b2']);
  assert.equal(braces.compile('a{1..3}b{c,d}'), 'a([1-3])b(c|d)');
  assert.equal(braces.stringify(braces.parse('{a,b{1..2}}')), '{a,b{1..2}}');
  for (const literal of ['"{a,b}"', '\\{a,b\\}']) assert.equal(braces.compile(literal), '{a,b}');
  assert.equal(braces.compile('[{{a,b}}]'), '[{{a,b}}]');
  assert.deepEqual(braces.expand('${name}'), ['${name}']);
  assert.equal(braces.compile('{unclosed'), '{unclosed');
  assert.deepEqual(braces.expand('{,a,a}', {noempty: true, nodupes: true}), ['a']);
  assert.deepEqual(braces.expand('{1..5..2}'), ['1', '3', '5']);
  assert.throws(() => braces.expand('{1..1001}'), /range limit/);
  assert.equal(braces.expand('{1..1001}', {rangeLimit: false}).length, 1001);
  assert.equal(require('micromatch').braceExpand('src/{domain,features}/*.ts').length, 2);
  assert.equal(require('micromatch').some('src/domain/file.ts', ['**/*.ts']), true);
});

test('deep-pattern rejection and a normal control finish with a small V8 stack', () => {
  const result = spawnSync(process.execPath, ['--stack-size=256', '-e', `
    const assert = require('node:assert/strict');
    const braces = require('braces');
    const input = '{'.repeat(4400) + 'a,b' + '}'.repeat(4400);
    for (const method of ['compile', 'expand', 'stringify']) {
      assert.throws(() => braces[method](input), /maximum nesting depth \\(64\\)/);
    }
    assert.equal(braces.compile('a{1..3}'), 'a([1-3])');
  `], {cwd: root, encoding: 'utf8', timeout: 5000, windowsHide: true});
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});

// Synthetic, ephemeral test keys. These malformed signatures demonstrate the
// verifier's parser invariant; they are not a forgery of an application key.
const nativeKeys = generateKeyPairSync('rsa', {modulusLength: 1024, publicExponent: 65537});
const keys = {
  privateKey: forge.pki.privateKeyFromPem(nativeKeys.privateKey.export({type: 'pkcs8', format: 'pem'})),
  publicKey: forge.pki.publicKeyFromPem(nativeKeys.publicKey.export({type: 'spki', format: 'pem'})),
};
const message = 'Glass Notes signature regression fixture';
const md = forge.md.sha256.create().update(message);
const digest = md.digest().getBytes();
const asn1 = forge.asn1;
const node = (type, value, constructed = false) => asn1.create(asn1.Class.UNIVERSAL, type, constructed, value);

function signature(children = [node(asn1.Type.NULL, '')], transform = value => value, algorithm = 'sha256', value = digest) {
  const identifiers = [node(asn1.Type.OID, asn1.oidToDer(forge.oids[algorithm]).getBytes()), ...children];
  const info = node(asn1.Type.SEQUENCE, [node(asn1.Type.SEQUENCE, identifiers, true), node(asn1.Type.OCTETSTRING, value)], true);
  return forge.pki.rsa.encrypt(transform(asn1.toDer(info).getBytes()), keys.privateKey, 0x01);
}

test('RSA rejects extra AlgorithmIdentifier children and every malformed parameter form', () => {
  const variants = [
    [node(asn1.Type.NULL, ''), node(asn1.Type.OCTETSTRING, 'garbage')],
    [node(asn1.Type.NULL, ''), node(asn1.Type.NULL, '')],
    [node(asn1.Type.OCTETSTRING, 'garbage')],
    [node(asn1.Type.INTEGER, '\\x01')],
    ...[1, 8, 32].map(length => [node(asn1.Type.NULL, 'x'.repeat(length))]),
  ];
  for (const children of variants) {
    const invalid = signature(children);
    for (const scheme of [undefined, 'RSASSA-PKCS1-V1_5', 'rsassa-pkcs1-v1_5']) {
      assert.throws(() => keys.publicKey.verify(digest, invalid, scheme), /does not contain a valid.*DigestInfo/);
    }
  }
});

test('RSA preserves absent or empty SHA parameters, legacy BER and wrong-digest behavior', () => {
  for (const children of [[], [node(asn1.Type.NULL, '')]]) {
    const valid = signature(children);
    assert.equal(keys.publicKey.verify(digest, valid), true);
    assert.equal(keys.publicKey.verify('\0'.repeat(32), valid), false);
  }
  const ber = signature(undefined, encoded => '\x30\x80' + encoded.slice(2) + '\0\0');
  assert.equal(keys.publicKey.verify(digest, ber), true);
  const md5 = forge.md.md5.create().update(message).digest().getBytes();
  assert.equal(keys.publicKey.verify(md5, signature(undefined, undefined, 'md5', md5)), true);
  assert.throws(() => keys.publicKey.verify(md5, signature([], undefined, 'md5', md5)), /Missing algorithm identifier NULL/);
  const native = sign('RSA-SHA256', Buffer.from(message), nativeKeys.privateKey).toString('binary');
  assert.equal(keys.publicKey.verify(digest, native), true);
  assert.equal(keys.publicKey.verify('\0'.repeat(32), native), false);
});

test('PSS and explicit raw-signature schemes preserve their existing behavior', () => {
  const pss = forge.pss.create({md: forge.md.sha256.create(), mgf: forge.mgf.mgf1.create(forge.md.sha256.create()), saltLength: 20});
  const signed = keys.privateKey.sign(forge.md.sha256.create().update(message), pss);
  assert.equal(keys.publicKey.verify(digest, signed, pss), true);
  const raw = keys.privateKey.sign(digest, 'NONE');
  for (const scheme of ['NONE', 'NULL', null]) {
    assert.equal(keys.publicKey.verify(digest, raw, scheme), true);
    assert.equal(keys.publicKey.verify('\0'.repeat(32), raw, scheme), false);
  }
});

test('Expo certificate validation, CSR verification and signing still use the patched verifier', () => {
  const expo = require('@expo/code-signing-certificates');
  const now = Date.now();
  const certificate = expo.generateSelfSignedCodeSigningCertificate({keyPair: keys, validityNotBefore: new Date(now - 60000), validityNotAfter: new Date(now + 3600000), commonName: 'Glass Notes ephemeral test'});
  assert.doesNotThrow(() => expo.validateSelfSignedCertificate(certificate, keys));
  const signed = expo.signBufferRSASHA256AndVerify(keys.privateKey, certificate, Buffer.from(message));
  assert.equal(keys.publicKey.verify(digest, Buffer.from(signed, 'base64').toString('binary')), true);
  const csr = expo.generateCSR(keys, 'Glass Notes ephemeral test');
  assert.equal(csr.verify(), true);
});
