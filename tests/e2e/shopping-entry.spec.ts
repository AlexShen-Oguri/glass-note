import {test,expect,type Page} from '@playwright/test';

test.beforeEach(async({context})=>{
  await context.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4176'?route.continue():route.abort());
  await context.addInitScript(()=>{
    if(sessionStorage.getItem('shopping-entry-fixture'))return;
    sessionStorage.setItem('shopping-entry-fixture','yes');
    localStorage.setItem('glass-notes.preferences',JSON.stringify({locale:'en',motionPaused:true}));
  });
});

async function openHighball(page:Page){
  await page.goto('/cocktails/whiskey-highball?version=whiskey-highball-batch-f');
  return page.getByTestId('shopping-action-whiskey-highball-batch-f');
}

test('recipe details expose shopping without opening more actions and persist the exact version without duplicates',async({page})=>{
  const action=await openHighball(page);
  await expect(page.getByRole('button',{name:'More actions',exact:true})).toBeVisible();
  const add=action.getByRole('button',{name:'Add this version to shopping',exact:true});
  await expect(add).toBeVisible();await expect(add).toBeEnabled();
  await expect(page.getByTestId('recipe-primary-actions').getByRole('button',{name:'Add this version to shopping',exact:true})).toHaveCount(1);
  const sectionBounds=await page.getByTestId('recipe-primary-actions').boundingBox();
  const buttonBounds=await add.boundingBox();
  const labelBounds=await add.getByText('Add this version to shopping',{exact:true}).boundingBox();
  const mixingBounds=await page.getByTestId('recipe-primary-actions').getByRole('link',{name:/^Start making/}).boundingBox();
  expect(sectionBounds&&buttonBounds&&labelBounds&&mixingBounds).toBeTruthy();
  expect(Math.abs(buttonBounds!.x-sectionBounds!.x)).toBeLessThan(1);
  expect(Math.abs(buttonBounds!.width-sectionBounds!.width)).toBeLessThan(1);
  expect(Math.abs(buttonBounds!.height-mixingBounds!.height)).toBeLessThan(1);
  expect(Math.abs(labelBounds!.x+labelBounds!.width/2-buttonBounds!.x-buttonBounds!.width/2)).toBeLessThan(1);
  expect(await add.evaluate(button=>button.closest('a,[role="link"]')===null)).toBe(true);
  await add.focus();await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/pantry\?tab=shopping$/);
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('glass-notes.shopping.v1')!));
  await expect.poll(async()=>(await saved()).targets.map((target:{recipe:{version:{id:string}}})=>target.recipe.version.id)).toEqual(['whiskey-highball-batch-f']);
  await openHighball(page);
  await expect(action.getByRole('button',{name:'Version already selected',exact:true})).toBeDisabled();
  await page.reload();
  await expect(action.getByRole('button',{name:'Version already selected',exact:true})).toBeDisabled();
  expect((await saved()).targets).toHaveLength(1);
});

test('catalogue keeps its recipe links and has no shopping action or added card frame',async({page})=>{
  await page.goto('/discover');
  await page.getByRole('textbox',{name:'A cocktail, a spirit, a new favourite…',exact:true}).fill('Whiskey Highball');
  const recipeLink=page.getByRole('link',{name:'Whiskey Highball. View recipe',exact:true});
  await expect(recipeLink).toHaveAttribute('href',/version=whiskey-highball-batch-f/);
  await expect(page.getByRole('button',{name:/^Add to shopping list/})).toHaveCount(0);
  await expect(page.getByTestId('discovery-card-whiskey-highball')).toHaveCount(0);
  await recipeLink.click();
  await expect(page).toHaveURL(/\/cocktails\/whiskey-highball\?.*version=whiskey-highball-batch-f/);
});

test('cabinet recipe choices have loaded drink thumbnails and keep their exact source version',async({page})=>{
  await page.goto('/pantry?tab=shopping');
  await page.getByRole('textbox',{name:'Search recipes and sources',exact:true}).fill('Whiskey Highball');
  const choice=page.getByTestId('shopping-choice-whiskey-highball-batch-f');
  await expect(choice.getByRole('img')).toBeVisible();
  await expect.poll(()=>choice.locator('img').evaluate((image:HTMLImageElement)=>image.complete&&image.naturalWidth>0)).toBe(true);
  await choice.getByRole('button',{name:/^Add Whiskey Highball/}).click();
  await expect(page.getByRole('heading',{name:'To buy · 2',exact:true})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>{const raw=localStorage.getItem('glass-notes.shopping.v1');return raw?JSON.parse(raw).targets.map((target:{recipe:{version:{id:string}}})=>target.recipe.version.id):[];})).toEqual(['whiskey-highball-batch-f']);
  await page.reload();
  await page.getByRole('button',{name:'Selected recipes · 1',exact:true}).click();
  await expect(page.getByTestId('shopping-target-whiskey-highball-batch-f').getByRole('img')).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('glass-notes.shopping.v1')!).targets[0].recipe.version.id)).toBe('whiskey-highball-batch-f');
});

test('detail write failure shows retry instead of a saved badge and preserves the pending intent',async({page})=>{
  await page.addInitScript(()=>{
    const original=Storage.prototype.setItem;let fail=true;
    Storage.prototype.setItem=function(key,value){if(key==='glass-notes.shopping.v1'&&fail){fail=false;throw new DOMException('test quota','QuotaExceededError');}return original.call(this,key,value);};
  });
  const action=await openHighball(page);
  await action.getByRole('button',{name:'Add this version to shopping',exact:true}).click();
  await expect(action.getByRole('alert')).toContainText('Shopping change could not be confirmed. Retry to save it.');
  await expect(action.getByRole('button',{name:/^Version already selected/})).toHaveCount(0);
  expect(await page.evaluate(()=>localStorage.getItem('glass-notes.shopping.v1'))).toBeNull();
  await action.getByRole('button',{name:'Retry',exact:true}).click();
  await expect(action.getByRole('button',{name:/^Version already selected/})).toBeDisabled();
  await expect(page).toHaveURL(/\/cocktails\/whiskey-highball\?version=whiskey-highball-batch-f$/);
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('glass-notes.shopping.v1')!).targets.length)).toBe(1);
});
