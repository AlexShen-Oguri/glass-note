import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {checkBrand} from './check-brand.mjs';

if (process.argv[2] === 'export') await checkBrand();

// Keep project commands usable without creating a global analytics identifier.
const cli=fileURLToPath(new URL('../node_modules/expo/bin/cli',import.meta.url));
const child=spawn(process.execPath,[cli,...process.argv.slice(2)],{
  stdio:'inherit',env:{...process.env,EXPO_NO_TELEMETRY:'1'},windowsHide:true,
});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
