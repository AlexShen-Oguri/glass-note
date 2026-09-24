import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const mode = process.argv[2] || 'build';
if (process.platform !== 'win32') throw Error('The current desktop trial targets Windows.');
const env = {...process.env, CARGO_TARGET_DIR:path.join(root,'.cache/desktop/target')};
// Windows environment names are case-insensitive; Node may retain `Path`.
const inheritedPath = Object.entries(process.env).find(([key]) => key.toLowerCase()==='path')?.[1] ?? '';
for(const key of Object.keys(env))if(key.toLowerCase()==='path')delete env[key];
env.PATH=path.dirname(process.execPath)+path.delimiter+inheritedPath;
const localCargo = path.join(root,'.cache/desktop/cargo');
if(existsSync(path.join(localCargo,'bin/cargo.exe'))){
  env.CARGO_HOME=localCargo;
  env.RUSTUP_HOME=path.join(root,'.cache/desktop/rustup');
  env.PATH=path.join(localCargo,'bin')+path.delimiter+env.PATH;
}
let executable=process.execPath;
let args=[path.join(root,'node_modules/@tauri-apps/cli/tauri.js'),'build',...process.argv.slice(3)];
if(mode==='test'){
  executable=existsSync(path.join(localCargo,'bin/cargo.exe'))?path.join(localCargo,'bin/cargo.exe'):'cargo';
  args=['test','--manifest-path',path.join(root,'src-tauri/Cargo.toml'),...process.argv.slice(3)];
}else if(mode==='check'){
  executable=existsSync(path.join(localCargo,'bin/cargo.exe'))?path.join(localCargo,'bin/cargo.exe'):'cargo';
  args=['check','--manifest-path',path.join(root,'src-tauri/Cargo.toml'),...process.argv.slice(3)];
}else if(mode!=='build')throw Error('Use desktop.mjs build, test or check.');
const child=spawn(executable,args,{cwd:root,env,stdio:'inherit',windowsHide:true});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
