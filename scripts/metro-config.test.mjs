import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const config = require('../metro.config.js');
const configuredBlockList = config?.resolver?.blockList;
const blockList = Array.isArray(configuredBlockList)
  ? configuredBlockList
  : [configuredBlockList].filter(Boolean);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const isBlocked = (candidate) => blockList.some((pattern) => {
  pattern.lastIndex = 0;
  return pattern.test(candidate);
});

test('Metro keeps Expo defaults and blocks only the project-local artifact roots', () => {
  assert.ok(Array.isArray(configuredBlockList), 'Metro blockList should be an array');
  assert.ok(blockList.length >= 3, 'the project rule should be appended to Expo defaults');

  assert.equal(
    isBlocked(path.join(projectRoot, '.expo', 'types')),
    true,
    'Expo default blockList should still block .expo/types',
  );
  assert.equal(
    isBlocked(path.join('android', 'app', 'build')),
    true,
    'Expo default blockList should still block android/app/build',
  );

  for (const relativePath of [
    ['.cache', 'download.zip'],
    ['artifacts', 'validation.log'],
    ['dist', 'index.html'],
    ['dist-ios', 'main.js'],
    ['research', 'notes.md'],
  ]) {
    assert.equal(isBlocked(path.join(...relativePath)), true, 'root-relative watcher path should be blocked');
    assert.equal(
      isBlocked(path.join(projectRoot, ...relativePath)),
      true,
      'project-local ' + relativePath[0] + ' should be blocked',
    );
  }
});

test('Metro local blockList has a root and directory boundary', () => {
  const blocked = [
    path.join(projectRoot, '.cache'),
    path.join(projectRoot, 'research'),
    path.join(projectRoot, 'dist', 'nested', 'asset.js'),
    projectRoot + '/dist-ios/asset.js',
  ];
  for (const candidate of blocked) {
    assert.equal(isBlocked(candidate), true, 'expected blocked path: ' + candidate);
  }

  const allowed = [
    path.join(projectRoot, '.cache-old', 'download.zip'),
    path.join(projectRoot, 'artifacts-old', 'validation.log'),
    path.join(projectRoot, 'dist-foo', 'index.html'),
    path.join(projectRoot, 'dist-ios-old', 'main.js'),
    path.join(projectRoot, 'researcher', 'notes.md'),
    path.join(projectRoot, 'src', 'research', 'notes.md'),
    path.join(projectRoot, 'src', 'app', 'index.tsx'),
    path.join(projectRoot, 'assets', 'styled', 'manifest.json'),
    path.join(projectRoot, 'node_modules', 'some-package', 'dist', 'index.js'),
    path.join(projectRoot, 'node_modules', 'expo', 'metro-config', 'build', 'index.js'),
    projectRoot + '-copy' + path.sep + 'research' + path.sep + 'notes.md',
  ];
  for (const candidate of allowed) {
    assert.equal(isBlocked(candidate), false, 'unexpectedly blocked path: ' + candidate);
  }
});
