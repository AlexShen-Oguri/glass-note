import {test,expect} from '@playwright/test';

test.beforeEach(async({context})=>{
  await context.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4176'?route.continue():route.abort());
  await context.addInitScript(()=>localStorage.setItem('glass-notes.preferences',JSON.stringify({locale:'en',motionPaused:true})));
});

test('international winner selection has a truthful year range and six recipes with original measures',async({page})=>{
  await page.goto('/topics?topic=angostura-global-cocktail-challenge-2008-2018-selection');
  await expect(page.getByText('2008–2018 · Global · selected winner recipes',{exact:true})).toBeVisible();
  for(const title of ['Narrow Minded','The Scarlet Ibis','The Orinoco Flip','Big Bird','Olympia','Deliciousness']){
    await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
  }
  await expect(page.getByText(/^20 ml · Crawley['’]s Spiced Honey Apple$/)).toBeVisible();
  await expect(page.getByText(/six dashes are split/i)).toHaveCount(0); // Editorial notes stay folded.
  await expect(page.getByRole('link',{name:'Open official source: Big Bird',exact:true})).toBeVisible();
  if(process.env.GLASSNOTES_CAPTURE_UI==='1')await page.screenshot({path:`artifacts/shopping/ui/competition-${test.info().project.name}.png`,fullPage:true});
});

test('Patrón preparation recipes are searchable and identity-only entries leave the directory',async({page})=>{
  await page.goto('/topics?topic=patron-perfectionists-2018-selection');
  await expect(page.getByRole('heading',{name:'Wind',exact:true})).toBeVisible();
  await expect(page.getByText(/^60 ml · Eternal Youth [Mm]ixture$/)).toBeVisible();
  await expect(page.getByText('3.5 oz · Patrón Reposado',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'KOSMOS',exact:true})).toHaveCount(0);
  await page.goto('/topics?topic=patron-perfectionists-2016');
  await expect(page.getByRole('heading',{name:'Song of the Sea',exact:true})).toHaveCount(0);
});
