import {cp,mkdir,readFile,readdir,rm,lstat} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkBrand} from './check-brand.mjs';

await checkBrand();

const root=fileURLToPath(new URL('../',import.meta.url));
if(!process.argv.includes('--use-existing')){
  await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[path.join(root,'scripts/expo.mjs'),'export','--platform','web'],{cwd:root,stdio:'inherit',windowsHide:true});
    child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(`Web export failed (${code})`)));
  });
}
const source=path.join(root,'dist');
const target=path.resolve(root,'.cache/desktop/frontend');
const intended=path.resolve(root,'.cache/desktop');
// Only this known build directory may be replaced; reject links before copying.
if(!target.startsWith(intended+path.sep)||path.basename(target)!=='frontend')throw Error('Unexpected desktop staging path');
for(const location of [root,source,path.resolve(root,'.cache'),intended,target]){
  try {if((await lstat(location)).isSymbolicLink())throw Error(`Linked build path: ${location}`);}
  catch(error){if(error.code!=='ENOENT')throw error;}
}
await readFile(path.join(source,'index.html'));
async function check(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
  if(entry.isSymbolicLink())throw Error('Linked files cannot enter the desktop bundle');
  if(entry.isDirectory())await check(path.join(dir,entry.name));
}}
await check(source);
await mkdir(intended,{recursive:true});
await rm(target,{recursive:true,force:true});
await cp(source,target,{recursive:true,errorOnExist:true,force:false});
console.log('Desktop frontend prepared from the Expo static export.');
