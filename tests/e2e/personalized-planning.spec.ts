import {test, expect, type Page, type Locator} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {catalogue} from '../../src/content/catalogue';
import {recipeSnapshot} from '../../src/domain/making';
import {createFeedback, emptyTasteState, type TasteFeedback} from '../../src/domain/taste';

const origin = 'http://127.0.0.1:4176';
const tasteKey = 'glass-notes.taste.v1';
const pantryKey = 'glass-notes.pantry.v1';
const pantryIds = ['gin', 'food-generic-whisky'];
const coverageFirst = 'restock-plan-dry-vermouth';
const tasteFirst = 'restock-plan-soda-water';
const pageErrors = new WeakMap<Page, string[]>();

function learnedEntries(): TasteFeedback[] {
  return [
    ['whiskey-highball-batch-f', 'like'], ['scotch-and-soda-batch-f', 'like'],
    ['dry-martini-iba', 'dislike'], ['gibson-diffords-gibson', 'dislike'],
  ].map(([id, sentiment]) => createFeedback(recipeSnapshot(catalogue, id!)!, `planner-${id}`, '2026-10-20T12:00:00Z', {
    experience: 'drank', sentiment: sentiment as 'like' | 'dislike', tooSweet: false, tooStrong: false, likedFlavours: [], notes: '',
  }));
}

async function seed(page: Page, entries = learnedEntries(), ingredientIds = pantryIds, bottleIds: string[] = []) {
  await page.addInitScript(({entries, ingredientIds, bottleIds}) => {
    if (sessionStorage.getItem('personalized-planner-data')) return;
    sessionStorage.setItem('personalized-planner-data', 'yes');
    localStorage.setItem('glass-notes.taste.v1', JSON.stringify({format: 'glass-notes-taste', schemaVersion: 1, entries}));
    localStorage.setItem('glass-notes.pantry.v1', JSON.stringify({ingredientIds, brandsByIngredient: {}}));
    localStorage.setItem('glass-notes.owned-bottles.v1', JSON.stringify({schemaVersion: 1, ids: bottleIds}));
  }, {entries, ingredientIds, bottleIds});
}

test.beforeEach(async ({context, page}) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.addInitScript(() => {
    if (sessionStorage.getItem('personalized-planner-preferences')) return;
    sessionStorage.setItem('personalized-planner-preferences', 'yes');
    localStorage.setItem('glass-notes.preferences', JSON.stringify({locale: 'en', motionPaused: true}));
  });
});

test.afterEach(async ({page}) => {
  expect(pageErrors.get(page) ?? [], 'No uncaught JavaScript errors in the planner flow').toEqual([]);
});

const planner = (page: Page) => page.getByTestId('personalized-planner');
const plans = (page: Page) => planner(page).getByTestId(/^restock-plan-/);
const goal = (page: Page, taste = true) => planner(page).getByRole('button', {name: taste ? 'Better my taste' : 'Unlock more', exact: true});
const search = (page: Page) => planner(page).getByRole('textbox', {name: 'Filter plans by ingredient', exact: true});
const planIds = (page: Page) => plans(page).evaluateAll(rows => rows.map(row => row.getAttribute('data-testid')!));

async function openPlanner(page: Page, taste = false) {
  await page.goto('/pantry?tab=planning');
  await expect(page.getByRole('heading', {name: 'My cabinet', exact: true})).toBeVisible();
  await expect(goal(page, false)).toBeVisible();
  if (taste) await goal(page).click();
  await expect(plans(page).first()).toHaveAttribute('data-testid', taste ? tasteFirst : coverageFirst);
}

async function returnToPlanner(page: Page, taste = true) {
  await page.getByRole('link', {name: 'Cabinet', exact: true}).click();
  await page.getByRole('button', {name: 'Plan additions', exact: true}).click();
  await expect(goal(page, false)).toBeVisible();
  if (taste) await goal(page).click();
}

async function openTasteInApp(page: Page) {
  await page.getByRole('link', {name: 'My notes', exact: true}).click();
  // The shared navigation guard ignores a second navigation within 130 ms.
  await page.locator('a[href="/taste"]').first().click({delay: 150});
  await expect(page.getByRole('heading', {name: 'Your taste memory', exact: true})).toBeVisible();
}

async function expandedSources(page: Page, row: Locator) {
  const disclosure = row.getByRole('button', {name: /^View new drinks/});
  if (await disclosure.getAttribute('aria-expanded') !== 'true') await disclosure.click();
  const hrefs = await row.locator('a[href*="/cocktails/"]').evaluateAll(links => links.map(link => link.getAttribute('href')!));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    const url = new URL(href, origin);
    const version = catalogue.versions.find(version => version.id === url.searchParams.get('version'));
    expect(version, href).toBeDefined();
    expect(url.pathname).toBe(`/cocktails/${version!.cocktailId}`);
    expect(url.searchParams.get('from')).toBe('pantry');
    expect(catalogue.sources.some(source => source.id === version!.sourceId)).toBe(true);
  }
  return hrefs;
}

async function expectEqualCenteredButtons(buttons: Locator[]) {
  const boxes = await Promise.all(buttons.map(button => button.boundingBox()));
  expect(boxes.every(Boolean)).toBe(true);
  expect(boxes[0]!.height).toBeGreaterThanOrEqual(44);
  expect(Math.abs(boxes[0]!.height - boxes[1]!.height)).toBeLessThan(1);
  expect(Math.abs(boxes[0]!.width - boxes[1]!.width)).toBeLessThan(1);
  for (const button of buttons) {
    const offsets = await button.evaluate(node => {
      const bounds = node.getBoundingClientRect();
      const range = document.createRange();
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      const textNode = walker.nextNode()!;
      // A whole-node range includes collapsed whitespace at wrapped line ends.
      // Measure visible characters per line, retaining the strict 1px threshold.
      const lines = new Map<number, {left: number; right: number; top: number; bottom: number}>();
      for (let index = 0; index < textNode.textContent!.length; index += 1) {
        if (/\s/u.test(textNode.textContent![index]!)) continue;
        range.setStart(textNode, index); range.setEnd(textNode, index + 1);
        const rect = range.getBoundingClientRect();
        const key = Math.round(rect.y * 10);
        const line = lines.get(key);
        lines.set(key, {left: Math.min(line?.left ?? Infinity, rect.left), right: Math.max(line?.right ?? -Infinity, rect.right),
          top: Math.min(line?.top ?? Infinity, rect.top), bottom: Math.max(line?.bottom ?? -Infinity, rect.bottom)});
      }
      const visible = [...lines.values()];
      return {label: textNode.textContent,
        x: Math.max(...visible.map(line => Math.abs(bounds.x + bounds.width / 2 - (line.left + line.right) / 2))),
        y: Math.abs(bounds.y + bounds.height / 2 - (Math.min(...visible.map(line => line.top)) + Math.max(...visible.map(line => line.bottom))) / 2)};
    });
    expect(offsets.x, `${offsets.label}: each visible line is horizontally centered`).toBeLessThan(1);
    expect(offsets.y, `${offsets.label}: the text block is vertically centered`).toBeLessThan(1);
  }
}

test('planner exposes the two explicit goals with coverage selected by default and reverses real purchase order', async ({page}) => {
  await seed(page);
  await openPlanner(page);
  await expect(goal(page, false)).toHaveAttribute('aria-pressed', 'true');
  await expect(goal(page)).toHaveAttribute('aria-pressed', 'false');
  const original = await planIds(page);
  expect(original.slice(0, 2)).toEqual([coverageFirst, tasteFirst]);
  const before = await page.evaluate(key => localStorage.getItem(key), pantryKey);
  await expectEqualCenteredButtons([goal(page, false), goal(page)]);
  await goal(page).focus(); await page.keyboard.press('Enter');
  await expect(plans(page).first()).toHaveAttribute('data-testid', tasteFirst);
  await expect(goal(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(planner(page)).not.toContainText(/\d+(?:\.\d+)?%|mean utility|uncertainty|posterior/i);
  await goal(page, false).focus(); await page.keyboard.press('Space');
  expect(await planIds(page)).toEqual(original);
  expect(await page.evaluate(key => localStorage.getItem(key), pantryKey)).toBe(before);
  expect(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth)).toBeLessThanOrEqual(1);
});

test('both goals retain six-row pagination and purchase-name-only search', async ({page}) => {
  await seed(page); await openPlanner(page);
  await expect(plans(page)).toHaveCount(6);
  await planner(page).getByRole('button', {name: /^More/}).click();
  await expect(plans(page)).toHaveCount(8);
  const candidates = (await planIds(page)).sort();
  await goal(page).click();
  await expect(plans(page)).toHaveCount(6);
  await planner(page).getByRole('button', {name: /^More/}).click();
  expect((await planIds(page)).sort()).toEqual(candidates);
  await search(page).fill('soda');
  await expect(plans(page)).toHaveCount(1);
  await expect(plans(page).first()).toHaveAttribute('data-testid', tasteFirst);
  await search(page).fill('Whiskey Highball');
  await expect(plans(page)).toHaveCount(0);
  await search(page).fill('');
  await expect(plans(page)).toHaveCount(6);
});

test('local recipe filters use exact sources and do not inherit discovery conditions', async ({page}) => {
  await seed(page);
  await page.goto('/discover');
  await page.getByRole('button', {name: 'Filters', exact: true}).click();
  await page.getByRole('button', {name: /^Ingredients\. 0 /}).click();
  await page.getByRole('textbox', {name: 'Search ingredients', exact: true}).fill('Gin');
  await page.getByRole('button', {name: 'Leave out Gin', exact: true}).click();
  await page.getByRole('button', {name: /^Find my glass/}).click();
  await returnToPlanner(page, false);
  await expect(plans(page).first()).toHaveAttribute('data-testid', coverageFirst);
  await planner(page).getByRole('button', {name: 'Recipe filters', exact: true}).click();
  await page.getByRole('button', {name: /^Ingredients\. 0 /}).click();
  await page.getByRole('textbox', {name: 'Search ingredients', exact: true}).fill('Gin');
  await page.getByRole('button', {name: 'Use Gin', exact: true}).click();
  await page.getByRole('button', {name: /^Find my glass/}).click();
  await expect(plans(page)).toHaveCount(5);
  await expect(planner(page).getByTestId(tasteFirst)).toHaveCount(0);
  for (const row of await plans(page).all()) for (const href of await expandedSources(page, row)) {
    const versionId = new URL(href, origin).searchParams.get('version');
    expect(catalogue.versions.find(version => version.id === versionId)!.ingredients.some(row => row.ingredientId === 'gin')).toBe(true);
  }
  const filtered = (await planIds(page)).sort();
  await goal(page).click();
  expect((await planIds(page)).sort()).toEqual(filtered);
  await expect(plans(page).first()).toHaveAttribute('data-testid', 'restock-plan-tonic-water');
  await planner(page).getByRole('button', {name: /Occasion & season/}).click();
  await page.getByRole('radio', {name: 'Aperitif', exact: true}).click();
  await page.getByRole('button', {name: 'Use these choices', exact: true}).click();
  await expect(planner(page).getByRole('button', {name: /Occasion & season/})).toContainText('Aperitif');
  await expect(plans(page).first()).toHaveAttribute('data-testid', coverageFirst);
  expect((await planIds(page)).sort()).toEqual(filtered);
});

test('two-material details retain exact brand and preparation sources and the existing shopping path', async ({page}) => {
  await seed(page); await openPlanner(page, true);
  await planner(page).getByRole('button', {name: 'Add two ingredients', exact: true}).click();
  await search(page).fill('Campari sweet red vermouth');
  const negroni = planner(page).getByTestId('restock-plan-campari:sweet-red-vermouth');
  await expect(negroni).toBeVisible();
  const hrefs = await expandedSources(page, negroni);
  expect(hrefs).toContain('/cocktails/negroni?version=negroni-iba&from=pantry');
  await expect(negroni).toContainText('Check brand');
  await expect(negroni).toContainText('Campari');
  await negroni.locator('a[href="/cocktails/negroni?version=negroni-iba&from=pantry"]').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/cocktails\/negroni\?version=negroni-iba&from=pantry$/);
  await page.getByRole('button', {name: 'Back', exact: true}).click();
  await expect(page).toHaveURL(/\/pantry\?tab=planning$/);
  await planner(page).getByRole('button', {name: 'Add two ingredients', exact: true}).click();
  await search(page).fill('connaught');
  const prepared = planner(page).getByTestId('restock-plan-connaught-bitters-selection:connaught-vermouth-blend');
  expect(await expandedSources(page, prepared)).toContain('/cocktails/connaught-martini?version=connaught-martini-bar-k&from=pantry');
  await expect(prepared).toContainText('Check advance preparation');
  await search(page).fill('Campari sweet red vermouth');
  await expandedSources(page, negroni);
  await negroni.locator('a[href*="version=negroni-iba"]').click();
  await page.getByRole('button', {name: 'Add this version to shopping', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Shopping list', exact: true})).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('glass-notes.shopping.v1')!).targets.map((target: {recipe: {version: {id: string}}}) => target.recipe.version.id))).toContain('negroni-iba');
  await expect(page.getByRole('button', {name: 'Bought: Campari bitter liqueur — add to cabinet', exact: true})).toBeVisible();
});

test('a cold taste memory keeps the literal coverage order without claiming learned preference', async ({page}) => {
  await seed(page, []); await openPlanner(page);
  const original = await planIds(page);
  await goal(page).click();
  expect(await planIds(page)).toEqual(original);
  await expect(planner(page)).toContainText('Save a drink rating to personalize your plans. Showing plans that unlock more drinks.');
  await expect(planner(page)).not.toContainText(/based on your saved taste|personalized for you/i);
  await expect(plans(page).first()).toHaveAttribute('data-testid', coverageFirst);
});

test('a taste read failure honestly falls back to coverage and retry restores saved preference order', async ({page}) => {
  await seed(page);
  await page.addInitScript(key => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function(name) {
      if (name === key && !sessionStorage.getItem('planner-allow-read')) throw new DOMException('Synthetic planner taste read failure', 'SecurityError');
      return original.call(this, name);
    };
  }, tasteKey);
  await openPlanner(page);
  await goal(page).click();
  await expect(planner(page).getByRole('alert')).toContainText(/unavailable|could not be read/i);
  await expect(plans(page).first()).toHaveAttribute('data-testid', coverageFirst);
  await expect(plans(page)).toHaveCount(6);
  await page.evaluate(() => sessionStorage.setItem('planner-allow-read', 'yes'));
  await planner(page).getByRole('button', {name: 'Retry', exact: true}).click();
  await expect(planner(page).getByRole('alert')).toHaveCount(0);
  await expect(plans(page).first()).toHaveAttribute('data-testid', tasteFirst);
});

test('a failed same-app taste reset retains saved planning order until retry confirms the change', async ({page}) => {
  await seed(page); await openPlanner(page, true);
  const saved = await page.evaluate(key => localStorage.getItem(key), tasteKey);
  await openTasteInApp(page);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem; let fail = true;
    Storage.prototype.setItem = function(name, value) {
      if (name === key && fail) {fail = false; throw new DOMException('Synthetic planner quota failure', 'QuotaExceededError');}
      return original.call(this, name, value);
    };
  }, tasteKey);
  await page.getByRole('button', {name: 'Reset all taste memory', exact: true}).click();
  await page.getByRole('button', {name: 'Reset memory', exact: true}).click();
  await expect(page.getByRole('alert')).toContainText('could not be saved on this device');
  await returnToPlanner(page);
  await expect(planner(page).getByRole('alert')).toContainText('last saved feedback');
  await expect(plans(page).first()).toHaveAttribute('data-testid', tasteFirst);
  expect(await page.evaluate(key => localStorage.getItem(key), tasteKey)).toBe(saved);
  await planner(page).getByRole('button', {name: 'Retry', exact: true}).click();
  await expect(plans(page).first()).toHaveAttribute('data-testid', coverageFirst);
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).entries.length, tasteKey)).toBe(0);
});

test('material ownership and owned bottles immediately invalidate purchase candidates in the same app', async ({page}) => {
  await seed(page); await openPlanner(page, true);
  await page.getByRole('button', {name: 'My ingredients', exact: true}).click();
  await page.getByRole('button', {name: 'Add ingredients', exact: true}).click();
  await page.getByRole('textbox', {name: 'Search all ingredients', exact: true}).fill('Soda water');
  await page.getByRole('button', {name: 'Add Soda water', exact: true}).click();
  await page.getByRole('button', {name: 'Done', exact: true}).click();
  await page.getByRole('button', {name: 'Plan additions', exact: true}).click();
  await goal(page).click();
  await expect(planner(page).getByTestId(tasteFirst)).toHaveCount(0);
  await goal(page, false).click();
  await expect(plans(page).first()).toHaveAttribute('data-testid', coverageFirst);
  await page.getByRole('button', {name: 'My ingredients', exact: true}).click();
  await page.getByRole('button', {name: 'Soda water', exact: true}).click();
  await page.getByRole('button', {name: 'Remove from cabinet', exact: true}).click();
  await page.getByRole('button', {name: 'Plan additions', exact: true}).click();
  await goal(page).click();
  await expect(plans(page).first()).toHaveAttribute('data-testid', tasteFirst);

  await page.getByRole('button', {name: 'My ingredients', exact: true}).click();
  await page.getByRole('link', {name: 'Manage bottles', exact: true}).click();
  await page.getByRole('textbox', {name: 'Search names, brands or flavour notes', exact: true}).fill('Martini extra dry');
  await page.getByRole('button', {name: /^Open details.*Extra Dry|^Open details.*Martini/i}).first().click();
  await page.getByRole('button', {name: '＋ I own this bottle', exact: true}).click();
  await returnToPlanner(page);
  await expect(planner(page).getByTestId(coverageFirst)).toHaveCount(0);
  await expect(plans(page).first()).toHaveAttribute('data-testid', tasteFirst);
});

test('restoring a full backup replaces taste evidence and invalidates the current planning model', async ({page}) => {
  await seed(page); await openPlanner(page, true);
  await openTasteInApp(page);
  await page.getByRole('button', {name: 'Open full backup', exact: true}).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Export all my data', exact: true}).click();
  const file = await (await download).path();
  expect(file).toBeTruthy();
  const backup = JSON.parse(await readFile(file!, 'utf8'));
  expect(backup.schemaVersion).toBe(3);
  expect(backup.sections.taste.entries).toHaveLength(4);
  backup.sections.taste = emptyTasteState();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', {name: 'Restore a full backup', exact: true}).click();
  await (await chooser).setFiles({name: 'synthetic-planner-reset.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup))});
  await page.getByRole('button', {name: 'Replace selected categories', exact: true}).click();
  await page.getByRole('button', {name: 'Review replacement', exact: true}).click();
  await page.getByRole('button', {name: 'Replace these categories', exact: true}).click();
  await expect(page.getByText('Your data has been restored.', {exact: true})).toBeVisible();
  await returnToPlanner(page);
  await expect(plans(page).first()).toHaveAttribute('data-testid', coverageFirst);
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).entries.length, tasteKey)).toBe(0);
});


test('all eight translations keep both action groups equal, centered and inside the viewport', async ({page}) => {
  await seed(page); await openPlanner(page);
  const labels = [
    ['en', 'Unlock more', 'Better my taste', 'Add one ingredient', 'Add two ingredients'],
    ['zh', '解锁更多', '更合口味', '补一种材料', '补两种材料'],
    ['fr', 'Débloquer plus de cocktails', 'Selon mes goûts', 'Ajouter un ingrédient', 'Ajouter deux ingrédients'],
    ['de', 'Mehr Drinks ermöglichen', 'Passender zu meinem Geschmack', 'Eine Zutat ergänzen', 'Zwei Zutaten ergänzen'],
    ['es', 'Preparar más bebidas', 'Más a mi gusto', 'Añadir un ingrediente', 'Añadir dos ingredientes'],
    ['ko', '더 많은 음료 만들기', '내 취향에 더 맞게', '재료 하나 추가', '재료 두 개 추가'],
    ['ja', '作れる一杯を増やす', '好みに合う一杯へ', '材料を1つ追加', '材料を2つ追加'],
    ['it', 'Sblocca più drink', 'Più vicini ai miei gusti', 'Aggiungi un ingrediente', 'Aggiungi due ingredienti'],
  ];
  for (const [locale, coverage, taste, one, two] of labels) {
    await page.evaluate(locale => localStorage.setItem('glass-notes.preferences', JSON.stringify({locale, motionPaused: true})), locale);
    await page.reload();
    const buttons = [coverage, taste, one, two].map(name => planner(page).getByRole('button', {name: name!, exact: true}));
    await expect(buttons[0]!).toBeVisible();
    await expectEqualCenteredButtons(buttons.slice(0, 2));
    await expectEqualCenteredButtons(buttons.slice(2));
    for (const button of buttons) {
      const box = await button.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
    }
    expect(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth), locale).toBeLessThanOrEqual(1);
    if (process.env.GLASSNOTES_CAPTURE_UI === '1') await page.screenshot({path: `artifacts/personalized-planning/ui/${test.info().project.name}-${locale}.png`});
  }
});
