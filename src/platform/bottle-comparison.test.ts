import assert from 'node:assert/strict';
import test from 'node:test';
import {bottles} from '../content/bottles';
import {catalogue} from '../content/catalogue';
import {bottleDisplayName} from '../domain/bottles/format';
import {
  LAB_STORAGE_KEY,
  LabMutationError,
  LabStore,
  bottleComparisonProjectDraft,
  parseLabBackup,
  type BottleComparisonProjectDraft,
} from '../domain/lab';
import {getRecipePreparation} from '../domain/preparations';

const ginBottles=bottles.filter(bottle=>bottle.family==='gin').slice(0,3);
const rumBottle=bottles.find(bottle=>bottle.family==='rum')!;
const ginTonic=catalogue.versions.find(version=>version.cocktailId==='gin-and-tonic')!;
const ginRow=ginTonic.ingredients.findIndex(ingredient=>ingredient.ingredientId==='gin');

async function storeWith(write:(value:string)=>Promise<void>|void=()=>undefined){
  const writes:string[]=[];
  const lab=new LabStore({
    getItem:async key=>{assert.equal(key,LAB_STORAGE_KEY);return null;},
    setItem:async(key,value)=>{assert.equal(key,LAB_STORAGE_KEY);writes.push(value);await write(value);},
  });
  await lab.load();
  return {lab,writes};
}

test('three gin bottles create one persisted Gin & Tonic project with exactly three faithful versions',async()=>{
  assert.equal(ginBottles.length,3);
  const before=JSON.stringify({ginTonic,bottles:ginBottles});
  const draft=bottleComparisonProjectDraft(catalogue,ginBottles,'en',{
    kind:'recipe',version:ginTonic,targetIngredientIndex:ginRow,
    preparation:getRecipePreparation(ginTonic.id),
  });
  const {lab,writes}=await storeWith();
  const projectId=lab.createComparisonProject(draft);
  assert.equal(lab.getSnapshot().projects.length,1);
  const project=lab.getSnapshot().projects[0]!;
  assert.equal(project.id,projectId);
  assert.equal(project.versions.length,3);
  assert.deepEqual(project.versions.map(version=>version.name),ginBottles.map(bottle=>bottleDisplayName(bottle)));
  for(let index=0;index<project.versions.length;index+=1){
    const version=project.versions[index]!;
    const bottle=ginBottles[index]!;
    assert.equal(version.ingredients.length,ginTonic.ingredients.length);
    const changed=version.ingredients[ginRow]!;
    assert.equal(changed.bottleId,bottle.id);
    assert.equal(changed.bottleName,bottleDisplayName(bottle));
    assert.equal(changed.amount,String(ginTonic.ingredients[ginRow]!.amount));
    assert.equal(changed.unit,ginTonic.ingredients[ginRow]!.unit);
    const tonicIndex=ginTonic.ingredients.findIndex(ingredient=>ingredient.ingredientId==='tonic-water');
    assert.deepEqual(
      [version.ingredients[tonicIndex]!.ingredientId,version.ingredients[tonicIndex]!.amount,version.ingredients[tonicIndex]!.unit],
      ['tonic-water',String(ginTonic.ingredients[tonicIndex]!.amount),ginTonic.ingredients[tonicIndex]!.unit],
    );
    assert.equal(version.method,draft.source!.method);
    assert.match(version.notes,/Replaced Gin with/);
  }
  assert.equal(project.source!.ingredients.every(ingredient=>ingredient.bottleId===undefined),true);
  assert.deepEqual(project.source!.ingredients.map(ingredient=>[ingredient.ingredientId,ingredient.amount,ingredient.unit]),
    ginTonic.ingredients.map(ingredient=>[ingredient.ingredientId,ingredient.amount===null?'':String(ingredient.amount),ingredient.unit]));
  assert.equal(JSON.stringify({ginTonic,bottles:ginBottles}),before);
  await lab.whenSaved();
  const saved=parseLabBackup(writes.at(-1)!);
  assert.equal(saved.projects.length,1);
  assert.equal(saved.projects[0]!.versions.length,3);
});

test('scratch comparison creates one independent bottle-bound version per selected bottle',async()=>{
  const draft=bottleComparisonProjectDraft(catalogue,ginBottles.slice(0,2),'zh',{kind:'scratch'});
  const {lab}=await storeWith();
  lab.createComparisonProject(draft);
  const project=lab.getSnapshot().projects[0]!;
  assert.equal(project.source,undefined);
  assert.equal(project.versions.length,2);
  assert.deepEqual(project.versions.map(version=>version.ingredients[0]!.bottleId),ginBottles.slice(0,2).map(bottle=>bottle.id));
  assert.equal(project.versions.every(version=>version.ingredients[0]!.amount===''&&version.ingredients[0]!.unit==='ml'),true);
});

test('invalid counts, duplicate bottles and invalid replacement rows fail before any project exists',async()=>{
  const {lab,writes}=await storeWith();
  for(const selected of [[],ginBottles.slice(0,1),[...ginBottles,ginBottles[0]!]]){
    assert.throws(()=>bottleComparisonProjectDraft(catalogue,selected,'en',{kind:'scratch'}),/comparison-bottle/);
  }
  assert.throws(()=>bottleComparisonProjectDraft(catalogue,[ginBottles[0]!,ginBottles[0]!],'en',{kind:'scratch'}),/comparison-bottle-duplicate/);
  assert.throws(()=>bottleComparisonProjectDraft(catalogue,[ginBottles[0]!,rumBottle],'en',{kind:'scratch'}),/comparison-bottle-family/);
  assert.throws(()=>bottleComparisonProjectDraft(catalogue,ginBottles,'en',{
    kind:'recipe',version:ginTonic,targetIngredientIndex:-1,
  }),/comparison-invalid-replacement-row/);
  assert.throws(()=>bottleComparisonProjectDraft(catalogue,ginBottles,'en',{
    kind:'recipe',version:ginTonic,targetIngredientIndex:ginTonic.ingredients.length,
  }),/comparison-invalid-replacement-row/);
  assert.deepEqual(lab.getSnapshot().projects,[]);
  assert.deepEqual(writes,[]);
});

test('incompatible recipe replacement requires an explicit override and records the actual bottle ingredient',()=>{
  const tonicRow=ginTonic.ingredients.findIndex(ingredient=>ingredient.ingredientId==='tonic-water');
  assert.throws(()=>bottleComparisonProjectDraft(catalogue,ginBottles,'en',{
    kind:'recipe',version:ginTonic,targetIngredientIndex:tonicRow,
  }),/comparison-incompatible-replacement/);
  const draft=bottleComparisonProjectDraft(catalogue,ginBottles,'en',{
    kind:'recipe',version:ginTonic,targetIngredientIndex:tonicRow,allowIncompatible:true,
  });
  for(let index=0;index<draft.versions.length;index+=1){
    const replacement=draft.versions[index]!.ingredients[tonicRow]!;
    assert.equal(replacement.bottleId,ginBottles[index]!.id);
    assert.equal(replacement.ingredientId,ginBottles[index]!.ingredientIds[0]);
    assert.equal(replacement.amount,String(ginTonic.ingredients[tonicRow]!.amount));
  }
  assert.equal(draft.source!.ingredients[tonicRow]!.ingredientId,'tonic-water');
  assert.equal(draft.source!.ingredients[tonicRow]!.bottleId,undefined);
});

test('store rejects malformed comparison drafts atomically',async()=>{
  const {lab,writes}=await storeWith();
  const valid=bottleComparisonProjectDraft(catalogue,ginBottles,'en',{kind:'scratch'});
  const cases:BottleComparisonProjectDraft[]=[
    {...valid,versions:[]},
    {...valid,versions:[valid.versions[0]!]},
    {...valid,versions:[...valid.versions,valid.versions[0]!]},
    {...valid,versions:valid.versions.map((version,index)=>index===1?{...version,bottleId:valid.versions[0]!.bottleId}:version)},
    {...valid,versions:valid.versions.map((version,index)=>index===1?{...version,ingredients:version.ingredients.map(row=>({...row,bottleId:undefined}))}:version)},
  ];
  for(const draft of cases){
    assert.throws(()=>lab.createComparisonProject(draft),(error:unknown)=>error instanceof LabMutationError&&error.code==='invalid-change');
    assert.deepEqual(lab.getSnapshot().projects,[]);
  }
  assert.deepEqual(writes,[]);
});

test('failed comparison save remains retryable without creating a duplicate project',async()=>{
  let fail=true;let persisted='';
  const {lab}=await storeWith(value=>{if(fail)throw new Error('quota');persisted=value;});
  const draft=bottleComparisonProjectDraft(catalogue,ginBottles,'en',{
    kind:'recipe',version:ginTonic,targetIngredientIndex:ginRow,
  });
  const id=lab.createComparisonProject(draft);
  await lab.whenSaved();
  assert.equal(lab.getSnapshot().projects.length,1);
  assert.equal(lab.saveStatus(),false);
  fail=false;
  assert.equal(await lab.retrySave(),true);
  const saved=parseLabBackup(persisted);
  assert.equal(saved.projects.length,1);
  assert.equal(saved.projects[0]!.id,id);
  assert.equal(saved.projects[0]!.versions.length,3);
});
