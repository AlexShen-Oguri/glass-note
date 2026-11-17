import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test.beforeEach(async({context})=>{
  await context.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4176'?route.continue():route.abort());
  await context.addInitScript(()=>{
    if(sessionStorage.getItem('shopping-fixture'))return;
    sessionStorage.setItem('shopping-fixture','yes');
    localStorage.setItem('glass-notes.preferences',JSON.stringify({locale:'en',motionPaused:true}));
  });
});

async function addVersion(page:Page,id:string,version:string){
  await page.goto(`/cocktails/${id}?version=${version}`);
  const more=page.getByRole('button',{name:'More actions',exact:true});
  await expect(more).toBeVisible();
  const actionBox=await more.boundingBox(),sectionBox=await page.locator('[data-motion-part="recipe-sections"]').boundingBox();
  expect(actionBox!.y+actionBox!.height).toBeLessThanOrEqual(sectionBox!.y);
  await page.getByRole('button',{name:'Add this version to shopping',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Shopping list',exact:true})).toBeVisible();
}

async function expectWhiskeyPurchase(page: Page){
  const timeout = test.info().timeout;
  // Confirm the two durable writes before checking the remounted shopping view.
  await expect.poll(()=>page.evaluate(()=>{
    const shopping=JSON.parse(localStorage.getItem('glass-notes.shopping.v1') ?? '{}');
    const pantry=JSON.parse(localStorage.getItem('glass-notes.pantry.v1') ?? '{}');
    const bought=(shopping.items ?? []).filter((item:{bought:boolean})=>item.bought).length;
    const ownsWhiskey=Boolean(pantry.ingredientIds?.includes('food-generic-whisky'));
    return {bought,ownsWhiskey};
  }),{timeout}).toEqual({bought:1,ownsWhiskey:true});
  await expect(page.getByRole('heading',{name:'Bought · 1',exact:true})).toBeVisible({timeout});
}

test('exact versions merge purchases, persist and atomically add a bought material to the cabinet',async({page})=>{
  await page.goto('/pantry');
  await page.getByRole('button',{name:'Shopping list',exact:true}).click({timeout:2000});
  await expect(page.getByText('Choose recipes to build your shopping list.',{exact:true})).toBeVisible();
  await addVersion(page,'whiskey-highball','whiskey-highball-batch-f');
  await addVersion(page,'scotch-and-soda','scotch-and-soda-batch-f');
  await expect(page.getByRole('heading',{name:'To buy · 2',exact:true})).toBeVisible();
  const shopping=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('glass-notes.shopping.v1')!));
  await expect.poll(async()=>(await shopping()).targets.length).toBe(2);
  await page.reload();
  await expect(page.getByRole('heading',{name:'To buy · 2',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Bought: Whiskey — add to cabinet',exact:true}).click();
  await expectWhiskeyPurchase(page);
  await page.reload();
  await expectWhiskeyPurchase(page);
  await expect(page.getByRole('button',{name:'Bought: Whiskey — add to cabinet',exact:true})).toHaveCount(0);
  if(process.env.GLASSNOTES_CAPTURE_UI==='1')await page.screenshot({path:`artifacts/shopping/ui/shopping-${test.info().project.name}.png`,fullPage:true});
});

test('three or more missing ingredients and an OR alternative remain saved after reload',async({page})=>{
  await addVersion(page,'virgin-mary','virgin-mary-batch-m');
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('glass-notes.shopping.v1')!).items.length)).toBeGreaterThan(2);
  await page.getByRole('button',{name:'Selected recipes · 1',exact:true}).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Choose Green olive brine',exact:true}).focus();
  await page.keyboard.press('Space');
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('glass-notes.shopping.v1')!).items.map((item:{ingredientId:string})=>item.ingredientId))).toContain('green-olive-brine');
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('glass-notes.shopping.v1')!).items.map((item:{ingredientId:string})=>item.ingredientId))).toContain('green-olive-brine');
  await page.getByRole('button',{name:'Remove Green olive brine from shopping',exact:true}).click();
  await page.reload();
  await expect(page.getByRole('button',{name:'Remove Green olive brine from shopping',exact:true})).toHaveCount(0);
});

test('a failed shopping save retries the exact intent without duplicate targets',async({page})=>{
  await page.addInitScript(()=>{
    const original=Storage.prototype.setItem;let fail=true;
    Storage.prototype.setItem=function(key,value){if(key==='glass-notes.shopping.v1'&&fail){fail=false;throw new DOMException('test quota','QuotaExceededError');}return original.call(this,key,value);};
  });
  await page.goto('/cocktails/whiskey-highball?version=whiskey-highball-batch-f');
  await page.getByRole('button',{name:'Add this version to shopping',exact:true}).click();
  await expect(page.getByText('Shopping change could not be confirmed. Retry to save it.',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('glass-notes.shopping.v1'))).toBeNull();
  await page.getByRole('button',{name:'Retry',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>{const raw=localStorage.getItem('glass-notes.shopping.v1');return raw?JSON.parse(raw).targets.length:0;})).toBe(1);
  await page.getByRole('button',{name:'Shopping list',exact:true}).click();
  await expect(page.getByRole('heading',{name:'To buy · 2',exact:true})).toBeVisible();
});

test('an interrupted purchase rolls back both categories and can be retried from the same tab',async({page})=>{
  await page.addInitScript(()=>{
    const original=Storage.prototype.setItem;let fail=true;
    Storage.prototype.setItem=function(key,value){
      if(key==='glass-notes.shopping.v1'&&fail&&JSON.parse(value).items.some((item:{bought:boolean})=>item.bought)){fail=false;throw new DOMException('test purchase quota','QuotaExceededError');}
      return original.call(this,key,value);
    };
  });
  await addVersion(page,'whiskey-highball','whiskey-highball-batch-f');
  await page.getByRole('button',{name:'Bought: Whiskey — add to cabinet',exact:true}).click();
  await expect(page.getByText('Purchase could not be confirmed. Check the list and retry.',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('glass-notes.shopping.v1')!).items.some((item:{bought:boolean})=>item.bought))).toBe(false);
  expect(await page.evaluate(()=>localStorage.getItem('glass-notes.pantry.v1'))).toBeNull();
  await page.getByRole('button',{name:'Bought: Whiskey — add to cabinet',exact:true}).click();
  await expectWhiskeyPurchase(page);
  await expect(page.getByText('Your backup was restored.',{exact:true})).toHaveCount(0);
});

test('a real shopping backup restores into a fresh profile and an older replacement preserves it',async({page,browser})=>{
  await addVersion(page,'whiskey-highball','whiskey-highball-batch-f');
  await page.goto('/backup');
  const download=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export all my data',exact:true}).click();
  const file=await(await download).path();expect(file).toBeTruthy();
  const backup=JSON.parse(await readFile(file!,'utf8'));
  expect(backup.sections.shopping.targets).toHaveLength(1);
  expect(backup.sections.shopping.items).toHaveLength(2);
  const fresh=await browser.newContext({locale:'en-US',viewport:page.viewportSize()!});
  await fresh.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4176'?route.continue():route.abort());
  try{
    const restored=await fresh.newPage();
    await restored.goto('http://127.0.0.1:4176/backup');
    const chooser=restored.waitForEvent('filechooser');
    await restored.getByRole('button',{name:'Restore a full backup',exact:true}).click();
    await(await chooser).setFiles(file!);
    await restored.getByRole('button',{name:'Merge selected data',exact:true}).click();
    await expect(restored.getByText('Your data has been restored.',{exact:true})).toBeVisible();
    await restored.goto('http://127.0.0.1:4176/pantry?tab=shopping');
    await expect(restored.getByRole('heading',{name:'To buy · 2',exact:true})).toBeVisible();
    const before=await restored.evaluate(()=>localStorage.getItem('glass-notes.shopping.v1'));
    delete backup.sections.shopping;
    backup.sections.favorites.versionIds=['whiskey-highball-batch-f'];
    await restored.goto('http://127.0.0.1:4176/backup');
    const oldChooser=restored.waitForEvent('filechooser');
    await restored.getByRole('button',{name:'Restore a full backup',exact:true}).click();
    await(await oldChooser).setFiles({name:'older-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await expect(restored.getByText('This older backup has no shopping list. Your current list and bought items will be kept.',{exact:true})).toBeVisible();
    await expect(restored.getByRole('checkbox',{name:'Shopping list',exact:true})).toHaveCount(0);
    await restored.getByRole('button',{name:'Replace selected categories',exact:true}).click();
    await restored.getByRole('button',{name:'Review replacement',exact:true}).click();
    await restored.getByRole('button',{name:'Replace these categories',exact:true}).click();
    await expect(restored.getByText('Your data has been restored.',{exact:true})).toBeVisible();
    expect(await restored.evaluate(()=>localStorage.getItem('glass-notes.shopping.v1'))).toBe(before);
  }finally{await fresh.close();}
});

test('a retired saved purchase remains visible without offering an invalid cabinet addition',async({page})=>{
  await addVersion(page,'whiskey-highball','whiskey-highball-batch-f');
  const raw=await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('glass-notes.shopping.v1')!);
    for(const target of state.targets)for(const row of target.rows){
      for(const candidate of row.candidates)if(candidate.ingredientId==='food-generic-whisky'){candidate.ingredientId='retired-whiskey';candidate.memberIds=['retired-whiskey'];}
      if(row.selectedIngredientId==='food-generic-whisky')row.selectedIngredientId='retired-whiskey';
    }
    for(const item of state.items)if(item.ingredientId==='food-generic-whisky'){item.ingredientId='retired-whiskey';item.memberIds=['retired-whiskey'];}
    const raw=JSON.stringify(state);localStorage.setItem('glass-notes.shopping.v1',raw);return raw;
  });
  await page.reload();
  await expect(page.getByText('Saved ingredient unavailable in this library. Its record is retained.',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Bought: Whiskey — add to cabinet',exact:true})).toBeDisabled();
  expect(await page.evaluate(()=>localStorage.getItem('glass-notes.shopping.v1'))).toBe(raw);
});
