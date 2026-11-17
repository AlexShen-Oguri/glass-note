import assert from 'node:assert/strict';
import test from 'node:test';
import * as sessions from './discoverySession';

const KEY='glass-notes.discovery-session.v1';
function storage(){const values=new Map<string,string>();return{values,getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}};}

test('a discovery seed and explicit rotation survive a fresh reader without changing other keys',()=>{
  const adapter=storage();adapter.values.set('personal-data','keep');
  const first=sessions.createDiscoverySessionStore(()=>adapter,()=> 'fixed-seed');
  assert.deepEqual(first.read(),{seed:'fixed-seed',round:0,excludedExplorationCocktailIds:[]});
  const next=first.advance('negroni');
  assert.deepEqual(next,{seed:'fixed-seed',round:1,excludedExplorationCocktailIds:['negroni']});
  assert.deepEqual(sessions.createDiscoverySessionStore(()=>adapter,()=> 'other-seed').read(),next);
  assert.equal(adapter.values.get('personal-data'),'keep');
});

test('invalid session caches are bounded and cannot become taste feedback or arbitrary state',()=>{
  for(const raw of ['not json',JSON.stringify({seed:'x',round:-1,excludedExplorationCocktailIds:[]}),JSON.stringify({seed:'x',round:1,excludedExplorationCocktailIds:Array(500).fill('x')}),'x'.repeat(5000)]){
    const adapter=storage();adapter.values.set(KEY,raw);
    assert.deepEqual(sessions.createDiscoverySessionStore(()=>adapter,()=> 'fresh').read(),{seed:'fresh',round:0,excludedExplorationCocktailIds:[]});
  }
});

test('unavailable session storage keeps one in-memory session and returned arrays cannot mutate it',()=>{
  const adapter={getItem(){throw Error('read unavailable');},setItem(){throw Error('write unavailable');}};
  const store=sessions.createDiscoverySessionStore(()=>adapter,()=> 'memory-only');
  assert.equal(store.read().seed,'memory-only');
  const rotated=store.advance('old-exploration');rotated.excludedExplorationCocktailIds.push('external-change');
  assert.deepEqual(store.read(),{seed:'memory-only',round:1,excludedExplorationCocktailIds:['old-exploration']});
  assert.throws(()=>store.advance(''),/invalid/);
});
