import http from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import path from 'node:path';

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2','.ico':'image/x-icon'};
const contained=(root,file)=>{const relative=path.relative(root,file);return relative!=='..'&&!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative);};

// The phone preview serves the exported site only, never workspace files or lab data.
export function createPreviewServer(directory){
 const root=path.resolve(directory);
 return http.createServer(async(req,res)=>{
  try{
   if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const target=path.resolve(root,'.'+pathname);
   if(!contained(root,target)||pathname.includes('\0')){res.writeHead(403);res.end();return;}
   const candidates=path.extname(target)?[target]:[path.join(target,'index.html'),target+'.html',target];
   for(const candidate of candidates){
    try{
     if(!(await stat(candidate)).isFile())continue;
     const [actualRoot,actualFile]=await Promise.all([realpath(root),realpath(candidate)]);
     if(!contained(actualRoot,actualFile)){res.writeHead(403);res.end();return;}
     const content=await readFile(actualFile);
     res.writeHead(200,{'Content-Type':types[path.extname(candidate)]||'application/octet-stream','Content-Length':content.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
     res.end(req.method==='HEAD'?undefined:content);return;
    }catch(error){if(error.code!=='ENOENT'&&error.code!=='ENOTDIR')throw error;}
   }
   res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');
  }catch{res.writeHead(400);res.end('Bad request');}
 });
}
