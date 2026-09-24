import assert from 'node:assert/strict';
import test from 'node:test';
import {PrivateRecipeStore} from '../../platform/privateRecipeStore';
import {parsePrivateRecipeBook,serializePrivateRecipeBook} from './persistence';
import {validateRecipePhoto,MAX_PHOTO_CHARACTERS} from './photo';
import type {PrivateRecipeContent} from './types';
import {fullBackupFromRaw} from '../../platform/backupAdapter';
import {planRestore,parseFullBackup,serializeFullBackup} from '../backup';

const photo='data:image/jpeg;base64,/9j/AAAA/9k='; // Synthetic parser payload, not an image-decoder fixture.
const content:PrivateRecipeContent={title:'Local photo',description:'',servings:1,ingredients:[{id:'gin',name:'Gin',amount:'30',unit:'ml'}],steps:['Stir.'],method:'',glass:'',garnish:'',notes:'',photo};
test('private photos reject remote URLs, SVG, invalid base64 and oversized payloads',()=>{
  assert.equal(validateRecipePhoto(photo),photo);
  for(const value of ['https://example.com/a.jpg','data:image/svg+xml;base64,abcd',photo+'!',photo+'A'.repeat(MAX_PHOTO_CHARACTERS)])assert.throws(()=>validateRecipePhoto(value));
});
test('photo revisions survive refresh and backup merge with old books; old reads never write',async()=>{
  let raw:string|null=serializePrivateRecipeBook({format:'glass-notes-private-recipes',schemaVersion:1,recipes:[]}),writes=0,id=0;
  const storage={getItem:async()=>raw,setItem:async(_key:string,value:string)=>{raw=value;writes++;}};
  const store=new PrivateRecipeStore(storage,{id:kind=>`${kind}-${++id}`,now:()=>new Date().toISOString()});
  await store.load();assert.equal(writes,0);
  const recipeId=store.createOriginal(content);assert.equal(await store.whenSaved(),true);
  assert.equal(parsePrivateRecipeBook(raw).schemaVersion,2);
  const {photo:removed,...withoutPhoto}=content;store.saveRevision(recipeId,withoutPhoto);await store.whenSaved();
  const reloaded=new PrivateRecipeStore(storage);await reloaded.load();
  assert.equal(reloaded.getSnapshot().recipes[0]!.revisions[0]!.content.photo,photo);
  assert.equal(reloaded.getSnapshot().recipes[0]!.revisions[1]!.content.photo,undefined);
  const blank={preferences:null,favorites:null,pantry:null,bottles:null,lab:null,privateRecipes:null,references:null,making:null,taste:null};
  const current=fullBackupFromRaw({...blank,privateRecipes:raw},'en','2026-09-17T10:00:00Z');
  const incoming=fullBackupFromRaw(blank,'en','2026-09-17T10:00:00Z');
  const next=planRestore({sections:current.sections,references:current.references},incoming,{mode:'merge',sections:['privateRecipes'],preferenceFields:[]}).next;
  assert.equal(next.sections.privateRecipes.schemaVersion,2);
  const roundtrip=parseFullBackup(serializeFullBackup({...current,...next}));
  assert.equal(roundtrip.sections.privateRecipes.recipes[0]!.revisions[0]!.content.photo,photo);
  assert.throws(()=>parsePrivateRecipeBook(JSON.stringify({...parsePrivateRecipeBook(raw),schemaVersion:1})),/version 2/);
});

test('photo save requires readback, keeps failed intent, and retries without another revision',async()=>{
  let raw:string|null=null,dropWrite=true;
  const store=new PrivateRecipeStore({getItem:async()=>raw,setItem:async(_key,value)=>{if(!dropWrite)raw=value;}});
  await store.load();store.createOriginal(content);
  assert.equal(await store.whenSaved(),false);assert.equal(store.getSnapshot().error,'write');
  dropWrite=false;assert.equal(await store.retry(),true);
  const saved=parsePrivateRecipeBook(raw);
  assert.equal(saved.recipes.length,1);assert.equal(saved.recipes[0]!.revisions.length,1);
  assert.equal(saved.recipes[0]!.revisions[0]!.content.photo,photo);
});
