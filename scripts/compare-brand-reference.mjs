import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const minimumIoU=0.995;
const meta=JSON.parse(await fs.readFile('assets/brand/reference-geometry.json','utf8'));
const ref=await fs.readFile(meta.source);
const referenceSha256=createHash('sha256').update(ref).digest('hex');
if(referenceSha256!==meta.sourceSha256)throw new Error(`Brand reference SHA-256 does not match reference-geometry.json. Expected ${meta.sourceSha256}, received ${referenceSha256}.`);
const raw=await sharp(ref).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const root=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const records=[];
for(const [name,region] of Object.entries(meta.regions)){
  const source=await fs.readFile(`assets/brand/reference-${name}.svg`,'utf8');
  const d=source.match(/ d="([^"]+)"/)[1],box=region.referenceRegion;
  const rendered=await sharp(Buffer.from(root(box.width,box.height,`<path fill="white" fill-rule="evenodd" d="${d}"/>`))).ensureAlpha().raw().toBuffer();
  let intersect=0,union=0,diff=0,referencePixels=0;
  for(let y=0;y<box.height;y++)for(let x=0;x<box.width;x++){
    const i=((box.y+y)*raw.info.width+box.x+x)*4;
    const original=(raw.data[i]+raw.data[i+1])/2>=129;
    const traced=rendered[(y*box.width+x)*4+3]>=128;
    if(original)referencePixels++;
    if(original&&traced)intersect++;
    if(original||traced)union++;
    if(original!==traced)diff++;
  }
  records.push({name,referencePixels,intersectionOverUnion:intersect/union,differingEdgePixels:diff,totalRegionPixels:box.width*box.height});
}
const failed=records.filter(record=>record.intersectionOverUnion<minimumIoU);
if(failed.length)throw new Error(`Brand reference comparison failed minimum IoU ${minimumIoU}: ${failed.map(record=>`${record.name}=${record.intersectionOverUnion}`).join(', ')}`);
const pathData=(await fs.readFile('assets/brand/reference-lockup.svg','utf8')).match(/ d="([^"]+)"/)[1];
const body=`<rect width="1200" height="335" fill="#f0ebdf"/><g font-family="Segoe UI, Microsoft YaHei, sans-serif" fill="#101714"><text x="34" y="40" font-size="18">原始设计稿 / Original</text><text x="626" y="40" font-size="18">修正后 / Corrected</text></g><svg x="26" y="70" width="560" height="166" viewBox="500 772 540 160"><image width="1536" height="1024" href="data:image/png;base64,${ref.toString('base64')}"/></svg><svg x="618" y="70" width="560" height="166" viewBox="0 0 540 160"><rect width="540" height="160" fill="#101714"/><path fill="#f0ebdf" fill-rule="evenodd" d="${pathData}"/></svg><g font-family="Segoe UI, Microsoft YaHei, sans-serif" fill="#536158" font-size="13"><text x="34" y="280">同一比例 · 原稿字形、酒液曲线、字距和相对位置</text><text x="34" y="305">原图未修改；右侧由原图轮廓生成，不使用替代字体。</text></g>`;
await fs.writeFile('design/brand/reference-comparison.svg',root(1200,335,body));
await sharp(Buffer.from(root(1200,335,body))).png().toFile('design/brand/reference-comparison.png');
await fs.writeFile('assets/brand/reference-comparison.json',JSON.stringify({referenceSha256,minimumIoU,method:'Compare reference midtone silhouettes to SVG rasterization at original pixel dimensions; edge antialiasing may differ, so this is not a claim of pixel-identical photography.',regions:records},null,2)+'\n');
console.log(records);
