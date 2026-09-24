import {execFileSync} from 'node:child_process';
import {readFile,stat} from 'node:fs/promises';
const paths=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const findings=[];let bytes=0,textFiles=0;
const signatures=[/\bgh[pousr]_[A-Za-z0-9]{30,}/g,/\bgithub_pat_[A-Za-z0-9_]{50,}/g,/\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/g,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,/\bAKIA[0-9A-Z]{16}\b/g];
for(const path of paths){
 if(/(^|\/)(?:\.env(?:\.|$)|node_modules\/|\.netlify\/|dist(?:-ios)?\/)/.test(path)&&!path.endsWith('.env.example'))findings.push({path,reason:'private-or-generated-path'});
 if(/(?:backup|export).*\.json$/i.test(path)&&path.startsWith('artifacts/'))findings.push({path,reason:'personal-backup'});
 const info=await stat(path);bytes+=info.size;
 if(info.size>=100*1024*1024)findings.push({path,reason:'github-file-limit'});
 if(/\.(?:tsx?|[mc]?js|mts|json|md|ya?ml|toml|txt)$/.test(path)){
  const value=await readFile(path,'utf8');textFiles++;
  for(const signature of signatures){signature.lastIndex=0;if(signature.test(value))findings.push({path,reason:'credential-pattern'});}
 }
}
console.log(JSON.stringify({trackedFiles:paths.length,textFiles,totalBytes:bytes,findings},null,2));
if(findings.length)process.exitCode=1;
