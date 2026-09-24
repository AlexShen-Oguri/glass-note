import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('web, Expo and desktop publish the same application version',()=>{
  const version=JSON.parse(read('package.json')).version;
  assert.equal(JSON.parse(read('package-lock.json')).version,version);
  assert.equal(JSON.parse(read('package-lock.json')).packages[''].version,version);
  assert.equal(JSON.parse(read('app.json')).expo.version,version);
  assert.equal(JSON.parse(read('src-tauri/tauri.conf.json')).version,version);
  assert.equal(read('src-tauri/Cargo.toml').match(/^version = "([^"]+)"/m)[1],version);
  assert.equal(read('src-tauri/Cargo.lock').match(/name = "glass-notes-desktop"\r?\nversion = "([^"]+)"/)[1],version);
});
