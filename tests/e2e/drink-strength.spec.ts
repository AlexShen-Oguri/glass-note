import {test,expect,type Locator,type Page} from '@playwright/test';
import {catalogue} from '../../src/content/catalogue';
import type {Locale} from '../../src/domain/contracts';
import {drinkStrengthText} from '../../src/i18n/drink-strength';
import {t as translateUi} from '../../src/i18n/ui';

const makingKey='glass-notes.making.v1';
const errors=new WeakMap<Page,string[]>();

test.beforeEach(async({context,page,baseURL})=>{
  const caught:string[]=[];errors.set(page,caught);page.on('pageerror',error=>caught.push(error.message));
  await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(baseURL!).origin?route.continue():route.abort());
  await context.addInitScript(()=>{
    if(sessionStorage.getItem('drink-strength-preferences'))return;
    sessionStorage.setItem('drink-strength-preferences','yes');
    localStorage.setItem('glass-notes.preferences',JSON.stringify({locale:'en',motionPaused:true}));
  });
});
test.afterEach(async({page})=>expect(errors.get(page)??[]).toEqual([]));
const panel=(page:Page)=>page.getByTestId('drink-strength');
const value=(page:Page)=>panel(page).getByTestId('drink-strength-value');
const openDetails=async(page:Page)=>panel(page).getByRole('button',{name:'Calculation & assumptions',exact:true}).click();

async function openNegroni(page:Page){
  await page.goto('/cocktails/negroni?version=negroni-iba');
  await expect(page.getByRole('heading',{name:'Negroni',exact:true})).toBeVisible();
}

test('a reviewed exact source shows separate serving classification and collapsed alcohol assumptions',async({page})=>{
  await openNegroni(page);
  await expect(panel(page).getByRole('heading',{name:'Alcohol & serving style',exact:true})).toBeVisible();
  await expect(value(page)).toContainText('%');
  await expect(panel(page).getByText('Short drink',{exact:true})).toBeVisible();
  await expect(panel(page).getByText('Before ice dilution',{exact:true})).toBeVisible();
  await expect(panel(page).getByRole('button',{name:'Calculation & assumptions',exact:true})).toHaveAttribute('aria-expanded','false');
  await expect(panel(page).getByRole('textbox',{name:'Melting water for this batch (ml)',exact:true})).toHaveCount(0);
});

const ingredientName=(id:string)=>catalogue.ingredients.find(item=>item.id===id)!.name.en;
const volumeInput=(page:Page,id:string)=>panel(page).getByRole('textbox',{name:`Liquid volume · ${ingredientName(id)} (ml)`,exact:true});
const strengthInput=(page:Page,id:string)=>panel(page).getByRole('textbox',{name:`Strength · ${ingredientName(id)} (%)`,exact:true});
const melting=(page:Page)=>panel(page).getByRole('textbox',{name:'Melting water for this batch (ml)',exact:true});
async function handCalculation(page:Page){
  for(const [id,ml,abv]of [['gin','60','40'],['campari','30','0'],['sweet-red-vermouth','0','0']]){
    await volumeInput(page,id!).fill(ml!);await strengthInput(page,id!).fill(abv!);
  }
  await melting(page).fill('30');
  await expect(value(page)).toHaveText('≈ 20.0%');
}

test('explicit batch volumes and melting water match hand calculation and blank is unknown',async({page})=>{
  await openNegroni(page);await openDetails(page);
  const before=await page.evaluate(key=>localStorage.getItem(key),makingKey);
  await handCalculation(page);
  await expect(panel(page).getByText('With entered melting water',{exact:true})).toBeVisible();
  await volumeInput(page,'gin').fill('');
  await expect(value(page)).toHaveCount(0);
  await expect(panel(page).getByText(/Estimate unavailable/)).toBeVisible();
  await volumeInput(page,'gin').fill('60');await expect(value(page)).toHaveText('≈ 20.0%');
  expect(await page.evaluate(key=>localStorage.getItem(key),makingKey)).toBe(before);
  await panel(page).getByRole('button',{name:'Reset reference',exact:true}).click();
  await expect(panel(page).getByText('Before ice dilution',{exact:true})).toBeVisible();
  await expect(melting(page)).toHaveValue('');
  await expect(value(page)).not.toHaveText('≈ 20.0%');
});

test('a selected actual bottle overrides examples and an unknown bottle does not borrow its reference',async({page})=>{
  await openNegroni(page);await openDetails(page);
  const gin=panel(page).getByTestId('drink-strength-row-negroni-iba:0');
  await gin.getByRole('textbox',{name:`Search bottles · ${ingredientName('gin')}`,exact:true}).fill('Tanqueray London Dry');
  await gin.getByRole('button',{name:'Use Tanqueray London dry gin',exact:true}).click();
  await expect(strengthInput(page,'gin')).toHaveValue('47.3');
  const markets=await gin.getByText('Market: US',{exact:true}).all();
  expect(markets.length).toBeGreaterThan(0);for(const market of markets)await expect(market).toBeVisible();
  await gin.getByRole('textbox',{name:`Search bottles · ${ingredientName('gin')}`,exact:true}).fill('Four Pillars');
  await gin.getByRole('button',{name:/^Use .*Rare Dry Gin/}).click();
  await expect(value(page)).toHaveCount(0);
  await expect(panel(page).getByText(/Estimate unavailable/)).toBeVisible();
});

test('switching exact source version resets local assumptions and guarded serving classification',async({page})=>{
  await page.goto('/cocktails/dry-martini?version=dry-martini-iba');
  await expect(page.getByRole('heading',{name:'Dry Martini',exact:true})).toBeVisible();
  await openDetails(page);await melting(page).fill('123');
  await page.getByRole('button',{name:'Death & Co Ideal Gin Martini',exact:true}).click();
  await expect(page).toHaveURL(/version=dry-martini-ideal-gin/);
  await expect(panel(page).getByText('Serving style not classified for this source version.',{exact:true})).toBeVisible();
  await expect(panel(page).getByRole('button',{name:'Calculation & assumptions',exact:true})).toHaveAttribute('aria-expanded','false');
  await openDetails(page);await expect(melting(page)).toHaveValue('');
});

async function openMaking(page:Page, versionId = 'negroni-iba'){
  await page.goto(`/make?version=${versionId}`);
  const timeout = test.info().timeout;
  // The recipe renders before personal stores hydrate and can start the session.
  await expect(page.getByRole('button',{name:/^(Complete|Saving…)$/})).toBeVisible({timeout});
  await expect(page.getByText('Loading…',{exact:true})).toBeHidden({timeout});
  await expect(page).toHaveURL(/session=/);
  await expect(panel(page)).toBeVisible();await openDetails(page);
}

async function reloadMaking(page: Page){
  await page.reload();
  // The saved session must hydrate before its calculation panel can render.
  const calculation = panel(page);
  await expect(calculation).toBeVisible({timeout:test.info().timeout});
  return calculation;
}

test('batch assumptions save through the existing schema and survive a real reload',async({page})=>{
  await openMaking(page);await handCalculation(page);
  await panel(page).getByRole('button',{name:'Apply assumptions',exact:true}).click();
  await expect.poll(()=>page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key)!);return{schema:s.schemaVersion,water:s.sessions[0].assumptions.dilutionMl,gin:s.sessions[0].assumptions.volumeMl['negroni-iba:0']};},makingKey)).toEqual({schema:2,water:30,gin:60});
  await reloadMaking(page);await expect(value(page)).toHaveText('≈ 20.0%');
  await openDetails(page);await expect(melting(page)).toHaveValue('30');
});

test('a failed assumption save retains its draft and Retry persists the original intent',async({page})=>{
  await page.addInitScript(()=>{
    const set=Storage.prototype.setItem;let fail=false;
    Object.defineProperty(window,'__failStrengthSave',{value:(value:boolean)=>{fail=value;}});
    Storage.prototype.setItem=function(key:string,value:string){if(key==='glass-notes.making.v1'&&fail)throw Error('Synthetic strength write failure');return set.call(this,key,value);};
  });
  await openMaking(page);
  const before=await page.evaluate(key=>localStorage.getItem(key),makingKey);
  await handCalculation(page);await page.evaluate(()=>Reflect.get(window,'__failStrengthSave')(true));
  await panel(page).getByRole('button',{name:'Apply assumptions',exact:true}).click();
  await expect(panel(page).getByRole('alert')).toContainText('Assumptions were not saved');
  expect(await page.evaluate(key=>localStorage.getItem(key),makingKey)).toBe(before);
  await expect(value(page)).toHaveText('≈ 20.0%');
  await page.evaluate(()=>Reflect.get(window,'__failStrengthSave')(false));
  await page.getByRole('button',{name:'Retry',exact:true}).click();
  await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).sessions[0].assumptions.dilutionMl,makingKey)).toBe(30);
  await expect(panel(page).getByRole('alert').filter({hasText:'Assumptions were not saved'})).toHaveCount(0);
  await reloadMaking(page);await expect(value(page)).toHaveText('≈ 20.0%');
});

test('optional liquid is explicitly included before it contributes to the estimate',async({page})=>{
  await page.goto('/cocktails/whiskey-sour?version=whiskey-sour-iba');
  await expect(page.getByRole('heading',{name:'Whiskey Sour',exact:true})).toBeVisible();
  await openDetails(page);const before=await value(page).textContent();
  const egg=ingredientName('egg-white');
  await panel(page).getByRole('checkbox',{name:`Include ${egg}`,exact:true}).check();
  await expect(value(page)).toHaveCount(0);
  await volumeInput(page,'egg-white').fill('10');await strengthInput(page,'egg-white').fill('0');
  await expect(value(page)).toBeVisible();expect(await value(page).textContent()).not.toBe(before);
  await panel(page).getByRole('checkbox',{name:`Include ${egg}`,exact:true}).uncheck();
  await expect(value(page)).toHaveText(before!);
});

test('optional inclusion and its batch volume persist together through reload',async({page})=>{
  await page.addInitScript(()=>{
    const set=Storage.prototype.setItem;let fail=false;
    Object.defineProperty(window,'__failOptionalSave',{value:(value:boolean)=>{fail=value;}});
    Storage.prototype.setItem=function(key:string,value:string){if(key==='glass-notes.making.v1'&&fail)throw Error('Synthetic optional write failure');return set.call(this,key,value);};
  });
  await openMaking(page,'whiskey-sour-iba');
  const original=await page.evaluate(key=>localStorage.getItem(key),makingKey);
  const include=panel(page).getByRole('checkbox',{name:`Include ${ingredientName('egg-white')}`,exact:true});
  await include.check();await volumeInput(page,'egg-white').fill('10');await strengthInput(page,'egg-white').fill('0');
  await page.evaluate(()=>Reflect.get(window,'__failOptionalSave')(true));
  await panel(page).getByRole('button',{name:'Apply assumptions',exact:true}).click();
  await expect(panel(page).getByRole('alert')).toContainText('Assumptions were not saved');
  expect(await page.evaluate(key=>localStorage.getItem(key),makingKey)).toBe(original);
  await page.evaluate(()=>Reflect.get(window,'__failOptionalSave')(false));await page.getByRole('button',{name:'Retry',exact:true}).click();
  await expect.poll(()=>page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key)!).sessions[0];return{included:s.checkedRows.includes('whiskey-sour-iba:3'),volume:s.assumptions.volumeMl['whiskey-sour-iba:3']};},makingKey)).toEqual({included:true,volume:10});
  await expect(panel(page).getByRole('alert')).toHaveCount(0);
  const estimate=await value(page).textContent();
  await reloadMaking(page);await expect(value(page)).toHaveText(estimate!);await openDetails(page);
  await expect(include).toBeChecked();await expect(volumeInput(page,'egg-white')).toHaveValue('10');
  await include.uncheck();await panel(page).getByRole('button',{name:'Apply assumptions',exact:true}).click();
  await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).sessions[0].checkedRows.includes('whiskey-sour-iba:3'),makingKey)).toBe(false);
});

test('switching actual supply clears the previous manual strength without borrowing a reference',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('glass-notes.pantry.v1',JSON.stringify({ingredientIds:['gin','campari','sweet-red-vermouth'],brandsByIngredient:{}}));
    localStorage.setItem('glass-notes.owned-bottles.v1',JSON.stringify({schemaVersion:1,ids:['tanqueray-london-dry','four-pillars-rare-dry']}));
  });
  await openMaking(page);
  const supply=page.getByRole('button',{name:'Choose supply for Gin',exact:true});await supply.click();
  await page.getByRole('button',{name:'Use Tanqueray London dry gin',exact:true}).click();
  await expect(strengthInput(page,'gin')).toHaveValue('47.3');
  await strengthInput(page,'gin').fill('70');
  await panel(page).getByRole('button',{name:'Apply assumptions',exact:true}).click();
  await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).sessions[0].assumptions.abv['negroni-iba:0'],makingKey)).toBe(70);
  await page.getByRole('button',{name:'Use Four Pillars Rare Dry Gin',exact:true}).click();
  await expect(value(page)).toHaveCount(0);await expect(strengthInput(page,'gin')).toHaveValue('');
  await expect.poll(()=>page.evaluate(key=>{
    const s=JSON.parse(localStorage.getItem(key)!).sessions[0];return{bottle:s.materialBindings['negroni-iba:0'].bottleId,override:Object.hasOwn(s.assumptions.abv,'negroni-iba:0')};
  },makingKey)).toEqual({bottle:'four-pillars-rare-dry',override:false});
});

test('recipe unit display changes leave the underlying alcohol calculation and batch inputs unchanged',async({page})=>{
  await openNegroni(page);await openDetails(page);await handCalculation(page);
  await page.getByRole('button',{name:'Units',exact:true}).click();
  await expect(value(page)).toHaveText('≈ 20.0%');await expect(volumeInput(page,'gin')).toHaveValue('60');
  await expect(melting(page)).toHaveValue('30');
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('glass-notes.preferences')!).unit)).toBe('oz');
});

test('a pre-persistence rejection cannot turn into a saved claim for the previous batch state',async({page})=>{
  await page.addInitScript(()=>{
    const stringify=JSON.stringify;let reject=false;
    Object.defineProperty(window,'__rejectStrengthIntent',{value:(value:boolean)=>{reject=value;}});
    JSON.stringify=function(value:unknown,...args:unknown[]){
      const state=value as {schemaVersion?:number;sessions?:Array<{assumptions?:{dilutionMl?:number}}>};
      if(reject&&state?.schemaVersion===2&&state.sessions?.some(session=>session.assumptions?.dilutionMl===30))throw Error('Synthetic rejection before MakingStore snapshot update');
      return Reflect.apply(stringify,JSON,[value,...args]);
    } as typeof JSON.stringify;
  });
  await openMaking(page);const original=await page.evaluate(key=>localStorage.getItem(key),makingKey);
  await handCalculation(page);await page.evaluate(()=>Reflect.get(window,'__rejectStrengthIntent')(true));
  await panel(page).getByRole('button',{name:'Apply assumptions',exact:true}).click();
  await expect(panel(page).getByRole('alert')).toContainText('Assumptions were not saved');
  expect(await page.evaluate(key=>localStorage.getItem(key),makingKey)).toBe(original);
  await page.getByRole('button',{name:'Retry',exact:true}).click();
  await expect(panel(page).getByRole('alert')).toContainText('Assumptions were not saved');
  await expect(page.getByRole('button',{name:'Retry',exact:true})).toBeVisible();
  expect(await page.evaluate(key=>localStorage.getItem(key),makingKey)).toBe(original);
  await page.evaluate(()=>Reflect.get(window,'__rejectStrengthIntent')(false));
  await page.getByRole('button',{name:'Retry',exact:true}).click();
  await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).sessions[0].assumptions.dilutionMl,makingKey)).toBe(30);
  await expect(panel(page).getByRole('alert')).toHaveCount(0);
});

test('saving melting water after ownership changes preserves the frozen actual bottle',async({page})=>{
  await page.addInitScript(()=>{
    if(sessionStorage.getItem('frozen-strength-supply'))return;sessionStorage.setItem('frozen-strength-supply','yes');
    localStorage.setItem('glass-notes.pantry.v1',JSON.stringify({ingredientIds:['gin','campari','sweet-red-vermouth'],brandsByIngredient:{}}));
    localStorage.setItem('glass-notes.owned-bottles.v1',JSON.stringify({schemaVersion:1,ids:['tanqueray-london-dry']}));
  });
  await openMaking(page);
  await page.getByRole('button',{name:'Choose supply for Gin',exact:true}).click();
  await page.getByRole('button',{name:'Use Tanqueray London dry gin',exact:true}).click();
  await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).sessions[0].materialBindings['negroni-iba:0']?.bottleId,makingKey)).toBe('tanqueray-london-dry');
  // Another local inventory edit has removed ownership; it must not rewrite this batch.
  await page.evaluate(()=>localStorage.setItem('glass-notes.owned-bottles.v1',JSON.stringify({schemaVersion:1,ids:[]})));
  await reloadMaking(page);await openDetails(page);
  await expect(strengthInput(page,'gin')).toHaveValue('47.3');await melting(page).fill('30');
  await panel(page).getByRole('button',{name:'Apply assumptions',exact:true}).click();
  await expect.poll(()=>page.evaluate(key=>{
    const s=JSON.parse(localStorage.getItem(key)!).sessions[0];return{bottle:s.materialBindings['negroni-iba:0']?.bottleId,water:s.assumptions.dilutionMl};
  },makingKey)).toEqual({bottle:'tanqueray-london-dry',water:30});
  await expect(strengthInput(page,'gin')).toHaveValue('47.3');
});

test('an intervening supply write failure cannot replace the retained assumptions intent',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('glass-notes.pantry.v1',JSON.stringify({ingredientIds:['gin','campari','sweet-red-vermouth'],brandsByIngredient:{}}));
    localStorage.setItem('glass-notes.owned-bottles.v1',JSON.stringify({schemaVersion:1,ids:['tanqueray-london-dry']}));
    const stringify=JSON.stringify,set=Storage.prototype.setItem;let reject=false,failWrite=false,writeFailures=0;
    Object.defineProperty(window,'__strengthFailures',{value:(before:boolean,write:boolean)=>{reject=before;failWrite=write;}});
    Object.defineProperty(window,'__strengthWriteFailures',{value:()=>writeFailures});
    JSON.stringify=function(value:unknown,...args:unknown[]){
      const state=value as {schemaVersion?:number;sessions?:Array<{assumptions?:{dilutionMl?:number}}>};
      if(reject&&state?.schemaVersion===2&&state.sessions?.some(session=>session.assumptions?.dilutionMl===30))throw Error('Synthetic precommit rejection');
      return Reflect.apply(stringify,JSON,[value,...args]);
    } as typeof JSON.stringify;
    Storage.prototype.setItem=function(key:string,value:string){if(failWrite&&key==='glass-notes.making.v1'){writeFailures++;throw Error('Synthetic intervening write failure');}return set.call(this,key,value);};
  });
  await openMaking(page);await page.getByRole('button',{name:'Choose supply for Gin',exact:true}).click();
  const supply=page.getByRole('button',{name:'Use Tanqueray London dry gin',exact:true});await supply.click();
  await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).sessions[0].materialBindings['negroni-iba:0']?.bottleId,makingKey)).toBe('tanqueray-london-dry');
  await melting(page).fill('30');await page.evaluate(()=>Reflect.get(window,'__strengthFailures')(true,false));
  await panel(page).getByRole('button',{name:'Apply assumptions',exact:true}).click();
  await expect(panel(page).getByRole('alert')).toContainText('Assumptions were not saved');
  await page.evaluate(()=>Reflect.get(window,'__strengthFailures')(true,true));await supply.click();
  await expect.poll(()=>page.evaluate(()=>Reflect.get(window,'__strengthWriteFailures')())).toBe(1);
  await expect(page.getByRole('button',{name:'Retry',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Apply assumptions',exact:true})).toBeDisabled();
  await page.evaluate(()=>Reflect.get(window,'__strengthFailures')(false,false));await page.getByRole('button',{name:'Retry',exact:true}).click();
  await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).sessions[0].assumptions.dilutionMl,makingKey)).toBe(30);
  await expect(panel(page).getByRole('alert')).toHaveCount(0);await expect(melting(page)).toHaveValue('30');
});

async function expectCentered(button:Locator){
  const offsets=await button.evaluate(node=>{
    const bounds=node.getBoundingClientRect(),range=document.createRange(),walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
    const lines=new Map<number,{left:number;right:number;top:number;bottom:number}>();
    for(let text=walker.nextNode();text;text=walker.nextNode())for(let index=0;index<text.textContent!.length;index++){
      if(/\s/u.test(text.textContent![index]!))continue;
      range.setStart(text,index);range.setEnd(text,index+1);const rect=range.getBoundingClientRect(),key=Math.round(rect.y*10),line=lines.get(key);
      lines.set(key,{left:Math.min(line?.left??Infinity,rect.left),right:Math.max(line?.right??-Infinity,rect.right),top:Math.min(line?.top??Infinity,rect.top),bottom:Math.max(line?.bottom??-Infinity,rect.bottom)});
    }
    const visible=[...lines.values()];
    return{x:Math.max(...visible.map(line=>Math.abs(bounds.x+bounds.width/2-(line.left+line.right)/2))),y:Math.abs(bounds.y+bounds.height/2-(Math.min(...visible.map(line=>line.top))+Math.max(...visible.map(line=>line.bottom)))/2)};
  });
  expect(offsets.x).toBeLessThan(1);expect(offsets.y).toBeLessThan(1);
}

const layoutLocaleGroups: Locale[][] = [['en','zh','fr','de'], ['es','ko','ja','it']];
for(const locales of layoutLocaleGroups){
  test(`expanded calculation controls stay aligned and inside the viewport in ${locales.join(', ')}`,async({page})=>{
    await openMaking(page);
    let activeLocale: Locale = 'en';
    for(const locale of locales){
      if (locale !== activeLocale) {
        // Select the language through the toolbar and wait for the saved preference.
        await page.getByTestId('night-toolbar').getByRole('button',{name:translateUi(activeLocale,'language'),exact:true}).click();
        await page.getByRole('button',{name:new RegExp(`^${locale.toUpperCase()}\\s`)}).click();
        await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('glass-notes.preferences') ?? '{}').locale)).toBe(locale);
        activeLocale = locale;
      }
      await expect(page.locator('html')).toHaveAttribute('lang',locale === 'zh' ? 'zh-Hans' : locale);
      const p=panel(page);
      await expect(p.getByRole('heading',{name:drinkStrengthText(locale,'title'),exact:true})).toBeVisible();
      const details = p.getByRole('button',{name:drinkStrengthText(locale,'details'),exact:true});
      if (await details.getAttribute('aria-expanded') === 'false') await details.click();
      await expect(details).toHaveAttribute('aria-expanded','true');
      const buttons=['apply','reset'].map(key=>p.getByRole('button',{name:drinkStrengthText(locale,key as 'apply'|'reset'),exact:true}));
      await buttons[0]!.scrollIntoViewIfNeeded();const boxes=await Promise.all(buttons.map(button=>button.boundingBox()));
      expect(boxes.every(Boolean),locale).toBe(true);expect(Math.abs(boxes[0]!.width-boxes[1]!.width),locale).toBeLessThan(1);
      expect(Math.abs(boxes[0]!.height-boxes[1]!.height),locale).toBeLessThan(1);
      for(const [index,button]of buttons.entries()){
        expect(boxes[index]!.height,locale).toBeGreaterThanOrEqual(44);await expectCentered(button);
      }
      for(const control of await p.getByRole('textbox').all()){
        const box=await control.boundingBox();expect(box,locale).toBeTruthy();expect(box!.height,locale).toBeGreaterThanOrEqual(44);
        expect(box!.x,locale).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width,locale).toBeLessThanOrEqual(page.viewportSize()!.width+1);
      }
      expect(await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth),locale).toBeLessThanOrEqual(1);
      if(process.env.GLASSNOTES_CAPTURE_UI==='1')await page.screenshot({path:`artifacts/drink-strength/ui/${test.info().project.name}-${locale}.png`});
    }
  });
}
