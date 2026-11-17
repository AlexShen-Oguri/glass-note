import {test, expect} from '@playwright/test';

test.beforeEach(async ({context}) => {
  await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4176' ? route.continue() : route.abort());
});

test('old saline ownership has one editable cabinet entry and preserves unrelated saved IDs', async ({page}) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('material-fixture')) return;
    sessionStorage.setItem('material-fixture', 'yes');
    localStorage.setItem('glass-notes.preferences', JSON.stringify({locale:'en',motionPaused:true}));
    localStorage.setItem('glass-notes.pantry.v1', JSON.stringify({ingredientIds:['saline-five-one','saline-twenty-percent','unknown-legacy-material'],brandsByIngredient:{}}));
  });
  await page.goto('/pantry');
  await expect(page.getByRole('heading', {name:'Ingredients · 1', exact:true})).toBeVisible({timeout:2000});
  await expect(page.getByText('unknown-legacy-material',{exact:true})).toBeVisible();
  await page.screenshot({path:`artifacts/ingredient-model/ui/cabinet-${test.info().project.name}.png`,fullPage:true});
  await page.getByRole('button', {name:'Saline', exact:true}).click();
  await page.getByRole('button', {name:'Remove from cabinet', exact:true}).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('glass-notes.pantry.v1')!).ingredientIds)).toEqual(['unknown-legacy-material']);
  await page.getByRole('button', {name:'Add ingredients', exact:true}).click();
  await page.getByRole('textbox', {name:'Search all ingredients', exact:true}).fill('saline');
  await expect(page.getByRole('button', {name:'Add Saline', exact:true})).toHaveCount(1);
  await page.getByRole('button', {name:'Add Saline', exact:true}).click();
  await page.getByRole('button', {name:'Done', exact:true}).click();
  await expect(page.getByRole('heading', {name:'Ingredients · 1', exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', {name:'Ingredients · 1', exact:true})).toBeVisible();
});

test('ordinary whiskey unlocks both highballs while flavored spirits remain distinct', async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('glass-notes.preferences', JSON.stringify({locale:'en',motionPaused:true}));
    localStorage.setItem('glass-notes.pantry.v1', JSON.stringify({ingredientIds:['food-generic-whisky','soda-water'],brandsByIngredient:{}}));
  });
  await page.goto('/pantry');
  await page.getByRole('button', {name:'What can I make?', exact:true}).click();
  await expect(page.getByRole('heading', {name:'Whiskey Highball', exact:true})).toBeVisible({timeout:2000});
  await expect(page.getByRole('heading', {name:'Scotch and Soda', exact:true})).toBeVisible();
  await page.goto('/ingredients');
  await page.getByRole('textbox', {name:'Search ingredients or brands', exact:true}).fill('whiskey');
  await expect(page.getByRole('checkbox', {name:'In my cabinet: Whiskey', exact:true})).toHaveCount(1);
  await expect(page.getByRole('checkbox', {name:/Whiskey liqueur/i})).toHaveCount(1);
  await page.screenshot({path:`artifacts/ingredient-model/ui/library-${test.info().project.name}.png`,fullPage:true});
  await page.goto('/ingredients/saline-twenty-percent');
  await expect(page.getByRole('heading', {name:'Saline', exact:true,level:1})).toBeVisible();
});

test('one saline entry keeps each source concentration on its concrete recipe',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('glass-notes.preferences',JSON.stringify({locale:'en',motionPaused:true})));
  for(const [id,version,concentration] of [
    ['poets-dream','poets-dream-batch-m','Saline solution (5:1 water:salt)'],
    ['yellow-bird','yellow-bird-batch-m','Saline solution (20% salt by weight)'],
  ]){
    await page.goto(`/cocktails/${id}?version=${version}`);
    await expect(page.getByRole('link',{name:'Saline ↗',exact:true})).toBeVisible();
    await expect(page.getByText(`Original recipe: ${concentration}`,{exact:true})).toBeVisible();
  }
});

test('bottle-derived whiskey ownership opens actual supplies without inventing manual ownership',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('glass-notes.preferences',JSON.stringify({locale:'en',motionPaused:true}));
    localStorage.setItem('glass-notes.pantry.v1',JSON.stringify({ingredientIds:[],brandsByIngredient:{}}));
    localStorage.setItem('glass-notes.owned-bottles.v1',JSON.stringify({schemaVersion:1,ids:['buffalo-trace-bourbon']}));
  });
  await page.goto('/ingredients');
  await page.getByRole('textbox',{name:'Search ingredients or brands',exact:true}).fill('whiskey');
  await page.getByRole('link',{name:'In my cabinet: Whiskey',exact:true}).click();
  await expect(page).toHaveURL(/concept=food-generic-whisky/);
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('glass-notes.pantry.v1')!).ingredientIds)).toEqual([]);
});
