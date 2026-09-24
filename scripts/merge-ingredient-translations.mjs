import {readFile,writeFile} from 'node:fs/promises';
const base='research/ingredients/product/';
const input=JSON.parse(await readFile(base+'translation-input.json','utf8'));
const valid=new Set(input.map(i=>i.id));
const merged={};
for(const file of ['translations-zh-fr.json','translations-ko-ja.json','translations-de-es-it.json','translations-source-zh.json','bar-technique-translations.json','translations-root.json']) {
  const overlay=JSON.parse(await readFile(base+file,'utf8'));
  for(const [id,names] of Object.entries(overlay)) {
    if(!valid.has(id)) continue; // Reviewed identity merges can retire an earlier draft id.
    for(const [locale,name] of Object.entries(names)) {
      if(!['en','zh','fr','de','es','ko','ja','it'].includes(locale)||typeof name!=='string'||!name.trim()) throw new Error('Invalid draft: '+id+'/'+locale);
      (merged[id]??={})[locale]=name.trim();
    }
  }
}
const missing=input.flatMap(i=>i.missing.filter(l=>!merged[i.id]?.[l]).map(l=>i.id+'/'+l));
if(missing.length)throw new Error('Missing translations: '+missing.join(', '));
await writeFile('src/content/ingredients/translations.json',JSON.stringify(merged)+'\n');
const report={sourceRecords:input.length,translatedRecords:Object.keys(merged).length,remainingFallbacks:missing.length,draftNames:Object.values(merged).reduce((n,names)=>n+Object.keys(names).length,0),status:'editorial-draft'};
await writeFile(base+'translation-report.json',JSON.stringify(report,null,2)+'\n');
console.log(report);
