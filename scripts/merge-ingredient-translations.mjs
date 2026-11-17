import {readFile,writeFile} from 'node:fs/promises';
const generated='artifacts/ingredients/';
const input=JSON.parse(await readFile(generated+'translation-input.json','utf8'));
const overlay=JSON.parse(await readFile('research/ingredients/translation-overlays.json','utf8'));
if(overlay.schemaVersion!=='ingredient-translation-overlays-v1')throw new Error('Unknown ingredient translation-overlay schema');
const records=JSON.parse(await readFile('src/content/ingredients/records.json','utf8'));
if(overlay.sourceRevision!==records.revision)throw new Error('Translation taxonomy revision mismatch');
const valid=new Set(input.map(i=>i.id));
const merged={};
for(const layer of overlay.layers) {
  if(!['editorial','source-derived-draft'].includes(layer.basis))throw new Error('Unknown translation basis: '+layer.id);
  for(const [id,names] of Object.entries(layer.names)) {
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
await writeFile(generated+'translation-report.json',JSON.stringify(report,null,2)+'\n');
console.log(report);
