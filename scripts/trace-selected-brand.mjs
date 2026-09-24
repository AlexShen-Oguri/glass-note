// Recover code-native contours from the approved reference, not from a replacement font.
// Reads original pixels without changing the reference file. All geometry retains source coordinates.
import fs from 'node:fs/promises';
import sharp from 'sharp';
import {createHash} from 'node:crypto';

const source='design/brand/selected-reference.png';
const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const luminance=(x,y)=>(data[(y*info.width+x)*4]+data[(y*info.width+x)*4+1])/2;

function trace(box) {
  const nodes=new Map(),adj=new Map(),threshold=129;
  const {x:ox,y:oy,width,height}=box;
  const val=(x,y)=>x<0||y<0||x>=width||y>=height?0:luminance(ox+x,oy+y);
  const edge=(ax,ay,bx,by)=>{
    const key=ay===by?`h${Math.min(ax,bx)},${ay}`:`v${ax},${Math.min(ay,by)}`;
    if(!nodes.has(key)){
      const a=val(ax,ay),b=val(bx,by),t=(threshold-a)/(b-a);
      nodes.set(key,[ax+(bx-ax)*t+.5,ay+(by-ay)*t+.5]);adj.set(key,[]);
    }
    return key;
  };
  const connect=(a,b)=>{adj.get(a).push(b);adj.get(b).push(a);};
  for(let y=-1;y<height;y++)for(let x=-1;x<width;x++){
    const points=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]],inside=points.map(([a,b])=>val(a,b)>=threshold);
    const hits=[];
    for(let i=0;i<4;i++)if(inside[i]!==inside[(i+1)%4])hits.push([i,edge(...points[i],...points[(i+1)%4])]);
    if(hits.length===2)connect(hits[0][1],hits[1][1]);
    if(hits.length===4){const e=Object.fromEntries(hits);if(inside[0]){connect(e[3],e[0]);connect(e[1],e[2]);}else{connect(e[0],e[1]);connect(e[2],e[3]);}}
  }
  const seen=new Set(),loops=[];
  for(const start of nodes.keys()){
    if(seen.has(start))continue;
    const loop=[];let current=start,previous=null;
    do{seen.add(current);loop.push(nodes.get(current));const neighbours=adj.get(current);if(neighbours.length!==2)throw Error('Open contour');const next=neighbours.find(n=>n!==previous);previous=current;current=next;}while(current!==start);
    const area=Math.abs(loop.reduce((n,p,i)=>{const q=loop[(i+1)%loop.length];return n+p[0]*q[1]-q[0]*p[1];},0)/2);
    if(area>=.15)loops.push(loop);
  }
  const n=v=>Number(v.toFixed(3));
  const d=loops.map(loop=>'M'+loop.map(p=>p.map(n).join(' ')).join('L')+'Z').join('');
  const all=loops.flat();
  return {d,loops:loops.length,points:all.length,bounds:{left:Math.min(...all.map(p=>p[0])),top:Math.min(...all.map(p=>p[1])),right:Math.max(...all.map(p=>p[0])),bottom:Math.max(...all.map(p=>p[1]))}};
}
const regions={lockup:{x:500,y:772,width:540,height:160},appMark:{x:135,y:770,width:172,height:168}};
const out={};
for(const [name,box] of Object.entries(regions)){
  const result=trace(box),b=result.bounds;
  const viewBox=[b.left,b.top,b.right-b.left,b.bottom-b.top].map(v=>Number(v.toFixed(3))).join(' ');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="#101714"><title>Glass Notes — approved ${name}</title><path fill-rule="evenodd" d="${result.d}"/></svg>\n`;
  await fs.writeFile(`assets/brand/reference-${name}.svg`,svg);
  out[name]={referenceRegion:box,viewBox,bounds:result.bounds,loops:result.loops,contourPoints:result.points};
}
await fs.writeFile('assets/brand/reference-geometry.json',JSON.stringify({source,sourceSha256:createHash('sha256').update(await fs.readFile(source)).digest('hex'),method:'Marching squares at midtone 129 in original R/G pixel samples; linear subpixel interpolation; original wordmark and relative positions; no font substitution or hand-redrawn geometry',regions:out},null,2)+'\n');
console.log(out);
