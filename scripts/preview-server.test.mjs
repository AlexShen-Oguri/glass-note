import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createPreviewServer} from './preview-server.mjs';

test('phone preview serves deep links and HEAD while rejecting writes and workspace traversal',async()=>{
 const sandbox=await mkdtemp(path.join(os.tmpdir(),'glass-notes-preview-'));
 const directory=path.join(sandbox,'site');await mkdir(directory);
 await writeFile(path.join(directory,'index.html'),'<h1>Glass Notes</h1>');
 await writeFile(path.join(directory,'topics.html'),'<h1>Research</h1>');
 await writeFile(path.join(sandbox,'private.txt'),'not part of the exported site');
 const server=createPreviewServer(directory);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const home=await fetch(base);assert.equal(home.status,200);assert.match(await home.text(),/Glass Notes/);
  const deep=await fetch(base+'/topics?topic=sample');assert.equal(deep.status,200);assert.match(await deep.text(),/Research/);
  const head=await fetch(base+'/topics',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(head.headers.get('cache-control'),'no-store');
  assert.equal((await fetch(base+'/topics',{method:'POST',body:'x'})).status,405);
  assert.equal((await fetch(base+'/%2e%2e%2fprivate.txt')).status,403);
  assert.equal((await fetch(base+'/missing')).status,404);
  assert.equal((await fetch(base+'/%E0%A4%A')).status,400);
 }finally{
  await new Promise(resolve=>server.close(resolve));
  // mkdtemp returned an absolute, task-owned directory under the OS temp root.
  const relative=path.relative(os.tmpdir(),sandbox);
  assert.ok(relative.startsWith('glass-notes-preview-')&&!relative.includes(path.sep));
  await rm(sandbox,{recursive:true,force:true});
 }
});
