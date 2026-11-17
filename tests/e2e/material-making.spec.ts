import {test, expect, type Page} from '@playwright/test';
import {catalogue} from '../../src/content/catalogue';
import {createSession, recipeSnapshot, updateSession} from '../../src/domain/making';
import {emptyMakingState} from '../../src/domain/making/types';

const versionId='scotch-and-soda-batch-f';
const now='2026-10-12T12:00:00Z';

async function openMaking(page:Page,path:string){
  await page.goto(path);
  // Navigation can finish before the personal stores hydrate on a busy host.
  // First require real route content, so a loading node absent before mount
  // cannot satisfy readiness. Hydration uses the existing whole-test budget;
  // the workflow assertions below retain their normal, shorter timeout.
  const timeout=test.info().timeout;
  await expect(page.getByRole('button',{name:/^(Complete|Saving…)$/}).or(page.getByRole('heading',{name:'Completed',exact:true}))).toBeVisible({timeout});
  await expect(page.getByText('Loading…',{exact:true})).toBeHidden({timeout});
}

test.beforeEach(async ({context}) => {
  await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4176' ? route.continue() : route.abort());
});

test('making saves canonical rules and the chosen actual supply without deducting stock', async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('glass-notes.preferences', JSON.stringify({locale:'en',motionPaused:true}));
    localStorage.setItem('glass-notes.pantry.v1', JSON.stringify({ingredientIds:['bourbon-whiskey','scotch-whisky','soda-water'],brandsByIngredient:{}}));
    localStorage.setItem('glass-notes.owned-bottles.v1', JSON.stringify({schemaVersion:1,ids:['buffalo-trace-bourbon']}));
  });
  await openMaking(page,`/make?version=${versionId}`);
  await expect(page).toHaveURL(/\/make\?session=/);
  const disclosure=page.getByRole('button',{name:'Choose supply for Whiskey',exact:true});
  await expect(disclosure).toHaveAttribute('aria-expanded','false');
  await disclosure.focus();
  await page.keyboard.press('Enter');
  await expect(disclosure).toHaveAttribute('aria-expanded','true');
  const supply=page.getByRole('button',{name:'Use Buffalo Trace Bourbon',exact:true});
  await supply.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Using Buffalo Trace Bourbon',{exact:true})).toBeVisible();
  await page.screenshot({path:`artifacts/ingredient-model/ui/making-${test.info().project.name}.png`,fullPage:true});
  await expect.poll(() => page.evaluate(() => {
    const state=JSON.parse(localStorage.getItem('glass-notes.making.v1')!);
    return {schemaVersion:state.schemaVersion,binding:state.sessions[0].materialBindings['scotch-and-soda-batch-f:0']};
  })).toEqual({schemaVersion:2,binding:{ingredientId:'bourbon-whiskey',bottleId:'buffalo-trace-bourbon'}});
  await page.getByRole('button',{name:'Complete',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Completed',exact:true})).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const state=JSON.parse(localStorage.getItem('glass-notes.making.v1')!);
    return {stock:state.stock,consumed:state.sessions[0].consumptionApplied};
  })).toEqual({stock:[],consumed:false});
});

for(const failedKey of ['glass-notes.pantry.v1','glass-notes.owned-bottles.v1']){
  test(`making waits for ${failedKey} read recovery before freezing supplies`,async ({page}) => {
    await page.addInitScript(key => {
      localStorage.setItem('glass-notes.preferences',JSON.stringify({locale:'en',motionPaused:true}));
      localStorage.setItem('glass-notes.pantry.v1',JSON.stringify({ingredientIds:['bourbon-whiskey','soda-water'],brandsByIngredient:{}}));
      const getItem=Storage.prototype.getItem;
      let failing=true;
      Storage.prototype.getItem=function(name:string){
        if(name===key&&failing)throw new Error('Synthetic ownership read failure');
        return getItem.call(this,name);
      };
      Object.defineProperty(window,'__allowSupplyRead',{value:()=>{failing=false;}});
    },failedKey);
    await openMaking(page,`/make?version=${versionId}`);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(`/make?version=${versionId}`);
    await expect(page.getByRole('button',{name:'Complete',exact:true})).toBeDisabled();
    expect(await page.evaluate(() => localStorage.getItem('glass-notes.making.v1'))).toBeNull();
    await page.evaluate(() => (window as unknown as {__allowSupplyRead:()=>void}).__allowSupplyRead());
    await page.getByRole('button',{name:'Retry',exact:true}).click();
    await expect(page).toHaveURL(/\/make\?session=/);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('glass-notes.making.v1')!).sessions[0].materialBindings['scotch-and-soda-batch-f:0'])).toEqual({ingredientId:'bourbon-whiskey'});
  });
}

test('making waits for delayed hydration before checking a failed pantry read',async({page,context})=>{
  const holder=await context.newPage();
  await holder.goto('/brand/favicon.svg');
  await holder.evaluate(()=>new Promise<void>(resolve=>{
    void navigator.locks.request('glass-notes-personal-data',()=>new Promise<void>(release=>{
      Object.defineProperty(window,'__releaseMakingLock',{value:release});resolve();
    }));
  }));
  await page.addInitScript(()=>{
    localStorage.setItem('glass-notes.preferences',JSON.stringify({locale:'en',motionPaused:true}));
    localStorage.setItem('glass-notes.pantry.v1',JSON.stringify({ingredientIds:['bourbon-whiskey','soda-water'],brandsByIngredient:{}}));
    const getItem=Storage.prototype.getItem;let failing=true;
    Storage.prototype.getItem=function(key:string){
      if(key==='glass-notes.pantry.v1'&&failing)throw new Error('Synthetic ownership read failure');
      return getItem.call(this,key);
    };
    Object.defineProperty(window,'__allowSupplyRead',{value:()=>{failing=false;}});
  });
  const opening=openMaking(page,`/make?version=${versionId}`);
  await page.waitForURL(`/make?version=${versionId}`);
  await page.waitForLoadState('load');
  await expect(page.getByText('Opening your saved data…',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Complete',exact:true})).toHaveCount(0);
  expect(await page.evaluate(()=>localStorage.getItem('glass-notes.making.v1'))).toBeNull();
  // Hold a real storage lock beyond the original five-second assertion budget.
  // Start this delay after document load, so slow navigation cannot consume it.
  await holder.evaluate(()=>{setTimeout(()=>(window as unknown as {__releaseMakingLock:()=>void}).__releaseMakingLock(),6000);});
  await opening;
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(`/make?version=${versionId}`);
  await expect(page.getByRole('button',{name:'Complete',exact:true})).toBeDisabled();
  expect(await page.evaluate(()=>localStorage.getItem('glass-notes.making.v1'))).toBeNull();
  await page.evaluate(()=>(window as unknown as {__allowSupplyRead:()=>void}).__allowSupplyRead());
  await page.getByRole('button',{name:'Retry',exact:true}).click();
  await expect(page).toHaveURL(/\/make\?session=/);
  await expect.poll(()=>page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('glass-notes.making.v1')!);
    return {sessions:state.sessions.length,binding:state.sessions[0].materialBindings['scotch-and-soda-batch-f:0'],stock:state.stock,consumed:state.sessions[0].consumptionApplied};
  })).toEqual({sessions:1,binding:{ingredientId:'bourbon-whiskey'},stock:[],consumed:false});
  await holder.close();
});

test('opening a version resumes its unfinished legacy snapshot and repeats its saved raw names',async ({page}) => {
  const recipe=recipeSnapshot(catalogue,versionId)!;
  recipe.ingredientNames['scotch-whisky']!.en='Saved raw Scotch whisky';
  recipe.version.ingredients[0]!.amount=17;
  recipe.version.ingredients[0]!.unit='ml';
  const old=createSession(recipe,'legacy-snapshot',now);
  await page.addInitScript(state => {
    localStorage.setItem('glass-notes.preferences',JSON.stringify({locale:'en',motionPaused:true}));
    localStorage.setItem('glass-notes.making.v1',JSON.stringify(state));
  },{...emptyMakingState(),schemaVersion:1,sessions:[old]});
  await openMaking(page,`/make?version=${versionId}`);
  await expect(page).toHaveURL('/make?session=legacy-snapshot');
  await expect(page.getByText('Saved raw Scotch whisky',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Complete',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Completed',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Make another',exact:true}).click();
  await expect(page.getByText('Saved raw Scotch whisky',{exact:true})).toBeVisible();
  const repeated=await page.evaluate(() => JSON.parse(localStorage.getItem('glass-notes.making.v1')!).sessions.at(-1));
  expect(repeated.recipe.version.ingredients[0]).toMatchObject({amount:17,unit:'ml'});
  expect(repeated.materialSemantics).toBeUndefined();
  expect(repeated.recipe.ingredientNames['scotch-whisky'].en).toBe('Saved raw Scotch whisky');
});

test('a removed source version resumes its saved servings without migrating on navigation',async({page})=>{
  const recipe=recipeSnapshot(catalogue,versionId)!;
  recipe.version.id='retired-saved-version';recipe.version.servings=2;
  recipe.ingredientNames['scotch-whisky']!.en='Retained source whisky';
  const old=createSession(recipe,'retained-old-session',now);
  await page.addInitScript(state=>{
    localStorage.setItem('glass-notes.preferences',JSON.stringify({locale:'en',motionPaused:true}));
    localStorage.setItem('glass-notes.making.v1',JSON.stringify(state));
  },{...emptyMakingState(),schemaVersion:1,sessions:[old]});
  await openMaking(page,'/make?version=retired-saved-version');
  await expect(page).toHaveURL('/make?session=retained-old-session');
  await expect(page.getByText('Retained source whisky',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('glass-notes.making.v1')!).schemaVersion)).toBe(1);
});

test('repeating a completed batch retains frozen source labels and exact supply rules',async ({page}) => {
  const recipe=recipeSnapshot(catalogue,versionId)!;
  const sourceName={...recipe.ingredientNames['scotch-whisky']!,en:'Saved source Scotch whisky'};
  const frozenCatalogue={...catalogue,materialConcepts:[],materialRequirements:[{versionId,rowIndex:0,originalRow:structuredClone(recipe.version.ingredients[0]!),sourceName}]};
  const pantry={ingredientIds:['bourbon-whiskey','scotch-whisky','soda-water'],brandsByIngredient:{}};
  const initial=createSession(recipe,'frozen-batch',now,{catalogue:frozenCatalogue,pantry,ownedBottleIds:[],bottles:[],making:emptyMakingState()});
  const completed=updateSession(initial,{completed:true},now);
  await page.addInitScript(({state,pantry}) => {
    localStorage.setItem('glass-notes.preferences',JSON.stringify({locale:'en',motionPaused:true}));
    localStorage.setItem('glass-notes.pantry.v1',JSON.stringify(pantry));
    localStorage.setItem('glass-notes.making.v1',JSON.stringify(state));
  },{state:{...emptyMakingState(),sessions:[completed]},pantry});
  await openMaking(page,'/make?session=frozen-batch');
  await expect(page.getByRole('heading',{name:'Completed',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Make another',exact:true}).click();
  await expect(page.getByRole('button',{name:'Complete',exact:true})).toBeEnabled();
  const repeated=await page.evaluate(() => JSON.parse(localStorage.getItem('glass-notes.making.v1')!).sessions.at(-1));
  expect(repeated.materialSemantics.digest).toBe(completed.materialSemantics!.digest);
  expect(repeated.materialSemantics.rows[0].allowedIngredientIds).toEqual(['scotch-whisky']);
  expect(repeated.materialSemantics.rows[0].sourceName.en).toBe('Saved source Scotch whisky');
  expect(repeated.materialBindings['scotch-and-soda-batch-f:0']).toEqual({ingredientId:'scotch-whisky'});
  await expect(page.getByText('Original recipe: Saved source Scotch whisky',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:/Choose supply for/})).toHaveCount(0);
});
