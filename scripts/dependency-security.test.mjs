import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {compatibleQueryString} from './patch-dependency-compat.mjs';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const queryRequire = createRequire(require.resolve('query-string'));
const query = require('query-string');

test('decoder compatibility patch is idempotent and rejects changed upstream source', () => {
  const source = readFileSync(require.resolve('query-string'), 'utf8');
  assert.match(source, /require\('decode-uri-component'\)\.default/);
  assert.equal(compatibleQueryString(source, '7.1.3'), source.replace(/\r\n/g, '\n'));
  const original = source.replace("require('decode-uri-component').default", "require('decode-uri-component')");
  assert.equal(compatibleQueryString(original, '7.1.3'), compatibleQueryString(source, '7.1.3'));
  assert.throws(() => compatibleQueryString(source, '7.1.4'), /review or remove/);
  assert.throws(() => compatibleQueryString(source + '\n// changed', '7.1.3'), /review or remove/);
});

test('the installed query parser uses the canonical fixed decoder and preserves query semantics', () => {
  const decoderPath = queryRequire.resolve('decode-uri-component');
  const manifest = JSON.parse(readFileSync(new URL('./package.json', pathToFileURL(decoderPath)), 'utf8'));
  assert.equal(manifest.name, 'decode-uri-component');
  assert.equal(manifest.version, '0.5.0');
  const input = 'q=%E9%85%92&name=Gin+Fizz&tag=citrus&tag=herbal&empty=&flag';
  const expected = {q: '酒', name: 'Gin Fizz', tag: ['citrus', 'herbal'], empty: '', flag: null};
  assert.deepEqual({...query.parse(input)}, expected);
  assert.deepEqual({...query.parse(query.stringify(expected))}, expected);
  assert.equal(query.stringify({version: 'air-mail-batch-i', from: 'discover'}, {sort: false}), 'version=air-mail-batch-i&from=discover');
  assert.deepEqual({...query.parse('q=a%2Bb')}, {q: 'a+b'});
});

test('Expo Router query parsing and path serialization work with the patched dependency', () => {
  const {getStateFromPath} = require('expo-router/build/react-navigation/core/getStateFromPath.js');
  const {getPathFromState} = require('expo-router/build/react-navigation/core/getPathFromState.js');
  const config = {screens: {Recipe: 'cocktails/:id'}};
  const state = getStateFromPath('/cocktails/air-mail?version=air-mail-batch-i&from=discover&q=%E9%85%92', config);
  assert.deepEqual({...state.routes[0].params}, {id: 'air-mail', version: 'air-mail-batch-i', from: 'discover', q: '酒'});
  const path = getPathFromState(state, config);
  assert(path.startsWith('/cocktails/air-mail?'));
  assert.deepEqual({...query.parse(path.split('?')[1])}, {version: 'air-mail-batch-i', from: 'discover', q: '酒'});
});

test('malformed encoded queries finish in a bounded child process', () => {
  const result = spawnSync(process.execPath, ['-e', `
    const assert = require('node:assert/strict');
    const query = require('query-string');
    for (const value of ['%FF'.repeat(2000), '%E0%A4%A'.repeat(2000)]) {
      const result = query.parse('q=' + value);
      assert.equal(typeof result.q, 'string');
      assert(result.q.length <= value.length);
    }
    assert.equal(query.parse('q=Gin+Fizz').q, 'Gin Fizz');
  `], {cwd: root, encoding: 'utf8', timeout: 5000, windowsHide: true});
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});

test('both UUID consumers resolve a fixed CommonJS API with checked output buffers', () => {
  for (const parent of ['xcode', '@expo/ngrok']) {
    const consumerRequire = createRequire(require.resolve(parent));
    assert.equal(consumerRequire('uuid/package.json').version, '11.1.1');
    const uuid = consumerRequire('uuid');
    assert(uuid.validate(uuid.v4()));
    for (const name of ['v3', 'v5']) {
      const buffer = new Uint8Array(16);
      assert.equal(uuid[name]('Glass Notes', uuid[name].DNS, buffer, 0), buffer);
      for (const offset of [-1, 1]) assert.throws(() => uuid[name]('Glass Notes', uuid[name].DNS, buffer, offset), RangeError);
      assert.throws(() => uuid[name]('Glass Notes', uuid[name].DNS, new Uint8Array(15)), RangeError);
    }
    assert.throws(() => uuid.v6({}, new Uint8Array(15)), RangeError);
    assert.throws(() => uuid.v6({}, new Uint8Array(16), -1), RangeError);
  }
});

test('Xcode IDs and the optional tunnel helper still load without opening a tunnel', () => {
  const project = require('xcode').project('unused-test-project.pbxproj');
  project.hash = {project: {objects: {PBXGroup: {}}}};
  assert.match(project.generateUuid(), /^[A-F0-9]{24}$/);
  const ngrok = require('@expo/ngrok');
  assert.equal(typeof ngrok.connect, 'function');
  assert.equal(ngrok.getUrl(), null);
});

test('fixed Sharp native libraries preserve image generation and reject unreadable input', async () => {
  const sharp = require('sharp');
  assert.equal(sharp.versions.sharp, '0.35.4');
  const source = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="#101714"/></svg>');
  for (const format of ['png', 'jpeg', 'webp']) {
    const image = await sharp(source).resize(16).toFormat(format).toBuffer();
    const metadata = await sharp(image).metadata();
    assert.equal(metadata.width, 16);
    assert.equal(metadata.height, 16);
    assert.equal(metadata.format, format);
  }
  await assert.rejects(sharp(Buffer.from('not an image')).metadata());
});
