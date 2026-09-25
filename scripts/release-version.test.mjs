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

test('Windows installer verifies registration before reporting success without changing app identity',()=>{
  const config=JSON.parse(read('src-tauri/tauri.conf.json'));
  assert.equal(config.identifier,'com.glassnotes.desktop');
  assert.equal(config.bundle.windows.nsis.installMode,'currentUser');
  assert.equal(config.bundle.windows.nsis.installerHooks,'./windows/installer-hooks.nsh');
  const hook=read('src-tauri/windows/installer-hooks.nsh');
  assert.match(hook,/!macro NSIS_HOOK_POSTINSTALL/);
  for(const field of ['DisplayVersion','InstallLocation','UninstallString','MainBinaryName']) {
    assert(hook.includes(`ReadRegStr $0 SHCTX "\${UNINSTKEY}" "${field}"`));
  }
  assert.match(hook,/StrCmp \$0 "\$\{VERSION\}" 0 glass_notes_registration_failed/);
  assert.match(hook,/SetErrorLevel 2\s+Abort/);
  assert.doesNotMatch(hook,/WriteReg|DeleteReg|Exec|RMDir/);
});
