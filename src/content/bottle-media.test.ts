import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {bottles} from './bottles';
const manifest=JSON.parse(readFileSync('assets/bottles/manifest.json','utf8')) as Array<{bottleId:string;file:string;localPath:string;sourcePageUrl:string;imageUrl:string;sourceTitle:string;visualCheck:string;sha256:string;originalSHA256:string;width:number;height:number;bytes:number;method:string;framing:{imageWidth:number;imageHeight:number;x:number;y:number;width:number;height:number}}>;

test('every current bottle has its own reviewed image and a traceable source',()=>{
 assert.deepEqual(manifest.map(m=>m.bottleId).sort(),bottles.map(b=>b.id).sort());
 assert.equal(new Set(manifest.map(m=>m.sha256)).size,bottles.length,'a shared placeholder must not stand in for multiple products');
 for(const m of manifest){
  assert.match(m.sourcePageUrl,/^https:\/\//);assert.match(m.imageUrl,/^https:\/\//);
  assert.ok(m.sourceTitle.trim());assert.ok(m.visualCheck.length>30);assert.notEqual(m.visualCheck,'pending');
  assert.ok(['original-photo','producer-render','source-packshot'].includes(m.method));
 }
});

test('shipped bottle assets have bounded PNG dimensions and match their audit hashes',()=>{
 const index=readFileSync('src/content/bottle-media.ts','utf8');
 const bindings=[...index.matchAll(/"([^"]+)": \{bottleId:"([^"]+)",image:require\("\.\.\/\.\.\/([^"]+)"\)/g)].map(m=>({bottleId:m[1],declaredId:m[2],file:m[3]}));
 assert.deepEqual(bindings.map(b=>b.bottleId).sort(),bottles.map(b=>b.id).sort());
 for(const binding of bindings){assert.equal(binding.bottleId,binding.declaredId);assert.equal(binding.file,manifest.find(m=>m.bottleId===binding.bottleId)?.file);}
 for(const m of manifest){
  assert.equal(m.file,`assets/bottles/display/${m.bottleId}.png`);
  const data=readFileSync(m.file);
  assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(data.readUInt32BE(16),m.width);assert.equal(data.readUInt32BE(20),m.height);
  assert.ok(m.width>0&&m.width<=420);assert.ok(m.height>0&&m.height<=640);
  const f=m.framing;
  assert.equal(f.imageWidth,m.width);assert.equal(f.imageHeight,m.height);
  assert.ok(Object.values(f).every(Number.isFinite));
  assert.ok(f.x>=0&&f.y>=0&&f.width>0&&f.height>0&&f.x+f.width<=m.width&&f.y+f.height<=m.height);
  assert.ok(index.includes(`framing:${JSON.stringify(f)}`),`display framing missing for ${m.bottleId}`);
  assert.equal(data.length,m.bytes);assert.equal(createHash('sha256').update(data).digest('hex'),m.sha256);
  assert.equal(createHash('sha256').update(readFileSync(m.localPath)).digest('hex'),m.originalSHA256);
  assert.ok(index.includes(`require("../../${m.file}")`),`missing bundled image ${m.bottleId}`);
 }
});
