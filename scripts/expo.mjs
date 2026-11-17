import {spawn} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import path from 'node:path';
import {prepareBrand} from './prepare-brand.mjs';
export function webExpoArgs(args) {
  const tunnel = args.some((arg, index) => arg === '--tunnel' || arg.startsWith('--tunnel=')
    || arg === '--host=tunnel' || ((arg === '--host' || /^-[^-]*m$/.test(arg)) && args[index + 1] === 'tunnel'));
  const phone = args.some(arg => ['--go', '--dev-client', '--ios', '--android', '-i', '-a'].includes(arg));
  const platforms = args.flatMap((arg, index) => arg === '--platform' ? [args[index + 1]]
    : arg.startsWith('--platform=') ? [arg.slice('--platform='.length)] : []);
  if (tunnel || phone || platforms.some(platform => platform !== 'web')) {
    throw new Error('This project targets Web and Tauri. Use npm run web or npm run preview:lan for phone browsers.');
  }
  if (args[0] !== 'start') return args;
  const hostSpecified = args.some(arg => ['--localhost', '--lan', '--host', '-m'].includes(arg) || arg.startsWith('--host='));
  return [...args, ...(!args.includes('--web') ? ['--web'] : []), ...(!hostSpecified ? ['--localhost'] : [])];
}

async function run() {
  const args = webExpoArgs(process.argv.slice(2));
  if (['start', 'export'].includes(args[0])) await prepareBrand();

// Keep project commands usable without creating a global analytics identifier.
const cli=fileURLToPath(new URL('../node_modules/expo/bin/cli',import.meta.url));
const child=spawn(process.execPath,[cli,...args],{
  stdio:'inherit',env:{...process.env,EXPO_NO_TELEMETRY:'1'},windowsHide:true,
});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  run().catch(error => {console.error(error.message); process.exitCode = 1;});
}
