import {readFileSync,writeFileSync} from 'node:fs';
import {GENERATION_KEY,JOURNAL_KEY,PERSONAL_KEYS,PersonalStorage} from './personalStorage';
import type {LocalKeyValueStorage} from './desktop-contract';
import {processStorageFixture} from './personalStorage.process.fixture';

const EXIT_AT_BOUNDARY=91;

function readDisk(path:string):Record<string,string>{return JSON.parse(readFileSync(path,'utf8')) as Record<string,string>;}
function writeDisk(path:string,value:Record<string,string>):void{writeFileSync(path,JSON.stringify(value),'utf8');}

function adapter(path:string,boundary?:string):LocalKeyValueStorage{
  const mutate=(key:string,value:string|null)=>{
    const disk=readDisk(path);if(value===null)delete disk[key];else disk[key]=value;writeDisk(path,disk);
    const journalPhase=key===JOURNAL_KEY&&value!==null?(JSON.parse(value) as {phase?:string}).phase:undefined;
    if((boundary==='prepared'&&journalPhase==='prepared')
      ||(boundary==='middle'&&key===PERSONAL_KEYS.bottles&&value===processStorageFixture().after.bottles)
      ||(boundary==='committed'&&journalPhase==='committed'))process.exit(EXIT_AT_BOUNDARY);
  };
  return{getItem:async key=>readDisk(path)[key]??null,setItem:async(key,value)=>mutate(key,value),removeItem:async key=>mutate(key,null)};
}

async function main(){
  const [action,path,boundary]=process.argv.slice(2);if(!action||!path)throw Error('missing process fixture arguments');
  const store=new PersonalStorage(adapter(path,action==='restore'?boundary:undefined));await store.initialize();
  if(action==='restore'){
    const {before,after}=processStorageFixture();await store.restore(before,after);throw Error(`boundary ${boundary} was not reached`);
  }
  if(action!=='recover')throw Error(`unknown action ${action}`);
  const disk=readDisk(path),data=Object.fromEntries(Object.entries(PERSONAL_KEYS).map(([name,key])=>[name,disk[key]??null]));
  process.stdout.write(JSON.stringify({state:store.getSnapshot(),data,journal:disk[JOURNAL_KEY]??null,generation:disk[GENERATION_KEY]??null}));
}

void main().catch(error=>{process.stderr.write(error instanceof Error?error.stack??error.message:String(error));process.exitCode=1;});
