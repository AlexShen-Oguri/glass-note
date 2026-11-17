import {test, expect, type Page} from '@playwright/test';
import {catalogue} from '../../src/content/catalogue';
import {recipeSnapshot} from '../../src/domain/making';
import {createFeedback, emptyTasteState, type TasteFeedback, type TasteFeedbackInput} from '../../src/domain/taste';

const tasteKey = 'glass-notes.taste.v1';
const now = '2026-10-17T12:00:00Z';
const origin = 'http://127.0.0.1:4176';

function feedback(version: string, id: string, input: Partial<TasteFeedbackInput> = {}) {
  return createFeedback(recipeSnapshot(catalogue, version)!, id, now, {
    experience: 'drank', sentiment: 'neutral', tooSweet: false, tooStrong: false, likedFlavours: [], notes: '', ...input,
  });
}

const learnedEntries = () => [
  feedback('whiskey-highball-batch-f', 'discovery-highball', {sentiment: 'like'}),
  feedback('scotch-and-soda-batch-f', 'discovery-scotch', {sentiment: 'like', likedFlavours: ['citrus']}),
  feedback('negroni-iba', 'discovery-negroni', {sentiment: 'like', likedFlavours: ['citrus', 'herbal']}),
  feedback('margarita-iba', 'discovery-margarita', {sentiment: 'like', likedFlavours: ['citrus']}),
  feedback('daiquiri-iba', 'discovery-daiquiri', {sentiment: 'dislike', tooSweet: true}),
];

async function seedTaste(page: Page, entries: TasteFeedback[]) {
  await page.addInitScript(state => {
    if (sessionStorage.getItem('discovery-taste-data')) return;
    sessionStorage.setItem('discovery-taste-data', 'yes');
    localStorage.setItem('glass-notes.taste.v1', JSON.stringify(state));
  }, {...emptyTasteState(), entries});
}

test.beforeEach(async ({context}) => {
  await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.addInitScript(() => {
    if (sessionStorage.getItem('discovery-taste-fixture')) return;
    sessionStorage.setItem('discovery-taste-fixture', 'yes');
    localStorage.setItem('glass-notes.preferences', JSON.stringify({locale: 'en', motionPaused: true}));
  });
});

const shelf = (page: Page) => page.getByTestId('discovery-recommendations');
const catalogueCards = (page: Page) => page.getByTestId('discovery-catalogue').getByRole('link', {name: /\. View recipe$/});
const shelfCards = (page: Page) => shelf(page).getByRole('link', {name: /\. View recipe$/});
const shelfHrefs = (page: Page) => shelfCards(page).evaluateAll(links => links.map(link => link.getAttribute('href')!));

async function openLearnedDiscovery(page: Page) {
  await seedTaste(page, learnedEntries());
  await page.goto('/discover');
  await expect(shelf(page).getByRole('heading', {name: 'For you', exact: true})).toBeVisible();
  await expect(shelfCards(page)).toHaveCount(6);
}

function assertSourceLinks(hrefs: string[]) {
  const cocktailIds: string[] = [];
  const versions = hrefs.map(href => {
    const url = new URL(href, origin);
    const cocktailId = url.pathname.split('/').pop()!;
    const versionId = url.searchParams.get('version');
    const version = catalogue.versions.find(item => item.id === versionId);
    expect(version, `The card must identify a real source version: ${href}`).toBeDefined();
    expect(version!.cocktailId).toBe(cocktailId);
    expect(catalogue.cocktails.find(item => item.id === cocktailId)?.versionIds).toContain(versionId);
    expect(catalogue.sources.some(source => source.id === version!.sourceId)).toBe(true);
    cocktailIds.push(cocktailId);
    return version!;
  });
  expect(new Set(cocktailIds).size).toBe(hrefs.length);
  return versions;
}

async function filterSharedRumIngredients(page: Page) {
  await page.getByRole('button', {name: 'Filters', exact: true}).click();
  await page.getByRole('button', {name: /^Ingredients\. 0 /}).click();
  for (const name of ['White Cuban rum', 'Fresh lime juice', 'Superfine sugar']) {
    await page.getByRole('textbox', {name: 'Search ingredients', exact: true}).fill(name);
    await page.getByRole('button', {name: `Use ${name}`, exact: true}).click();
  }
  await expect(page.getByRole('radio', {name: 'All selected ingredients', exact: true})).toBeChecked();
  await page.getByRole('button', {name: /^Find my glass/}).click();
}

const daiquiriCard = (page: Page) => shelf(page).getByTestId(/^recommendation-(familiar|explore)$/).filter({
  has: page.locator('a[href*="/cocktails/daiquiri?"][href*="version=daiquiri-iba"]'),
});

test('saved taste feedback provides five familiar picks and one exploration with real source versions', async ({page}) => {
  await openLearnedDiscovery(page);
  await expect(shelf(page).getByTestId('recommendation-familiar')).toHaveCount(5);
  await expect(shelf(page).getByTestId('recommendation-explore')).toHaveCount(1);
  assertSourceLinks(await shelfHrefs(page));
  await expect(shelf(page).getByRole('button', {name: 'Why this pick', exact: true})).toHaveCount(6);
  for (const why of await shelf(page).getByRole('button', {name: 'Why this pick', exact: true}).all()) {
    await expect(why).toHaveAttribute('aria-expanded', 'false');
  }
  await expect(shelf(page).getByTestId('recommendation-explanation')).toHaveCount(0);
  await expect(shelf(page).getByRole('link', {name: 'View saved feedback', exact: true})).toHaveCount(0);
  await expect(catalogueCards(page)).toHaveCount(24);
});

test('keyboard evidence, reload and recipe return preserve the recommendation batch and catalogue pagination', async ({page}) => {
  await openLearnedDiscovery(page);
  const original = await shelfHrefs(page);
  const first = shelf(page).getByTestId('recommendation-familiar').first();
  const why = first.getByRole('button', {name: 'Why this pick', exact: true});
  await why.focus();
  await page.keyboard.press('Enter');
  await expect(why).toHaveAttribute('aria-expanded', 'true');
  const explanation = first.getByTestId('recommendation-explanation');
  await expect(explanation).toHaveCount(1);
  const reason = (await explanation.innerText()).trim();
  expect(reason.length).toBeGreaterThan(10);
  expect(reason.length).toBeLessThan(240);
  const evidence = first.getByRole('link', {name: 'View saved feedback', exact: true});
  await expect(evidence).toHaveCount(1);
  const cardBox = await first.boundingBox();
  const evidenceBox = await evidence.boundingBox();
  const labelBox = await evidence.getByText('View saved feedback', {exact: true}).boundingBox();
  expect(cardBox && evidenceBox && labelBox).toBeTruthy();
  expect(evidenceBox!.height).toBeGreaterThanOrEqual(44);
  expect(Math.abs(evidenceBox!.x - cardBox!.x)).toBeLessThan(1);
  expect(Math.abs(evidenceBox!.width - cardBox!.width)).toBeLessThan(1);
  expect(Math.abs(labelBox!.x + labelBox!.width / 2 - evidenceBox!.x - evidenceBox!.width / 2)).toBeLessThan(1);
  expect(Math.abs(labelBox!.y + labelBox!.height / 2 - evidenceBox!.y - evidenceBox!.height / 2)).toBeLessThan(1);
  const evidenceHref = await evidence.getAttribute('href');
  const evidenceId = new URL(evidenceHref!, origin).searchParams.get('entry');
  expect(learnedEntries().map(entry => entry.id)).toContain(evidenceId);
  await evidence.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/taste\\?entry=${evidenceId}$`));
  await expect(page.getByRole('heading', {name: /: tasting notes$/})).toBeVisible();
  await page.goBack();
  await expect(shelfCards(page)).toHaveCount(6);
  expect(await shelfHrefs(page)).toEqual(original);

  await page.reload();
  await expect(shelfCards(page)).toHaveCount(6);
  expect(await shelfHrefs(page)).toEqual(original);
  await expect(catalogueCards(page)).toHaveCount(24);
  await page.getByRole('button', {name: 'Load more', exact: true}).click();
  await expect(catalogueCards(page)).toHaveCount(48);
  expect(await shelfHrefs(page)).toEqual(original);
  const catalogueBefore = await catalogueCards(page).evaluateAll(links => links.map(link => link.getAttribute('href')));
  const detailHref = await shelfCards(page).first().getAttribute('href');
  const detailId = new URL(detailHref!, origin).pathname.split('/').pop();
  const detailName = catalogue.cocktails.find(cocktail => cocktail.id === detailId)!.name.en;
  await shelfCards(page).first().focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new URL(detailHref!, origin).href);
  await expect(page.getByRole('heading', {name: detailName, exact: true, level: 1})).toBeVisible();
  await page.goBack();
  await expect(catalogueCards(page)).toHaveCount(48);
  expect(await shelfHrefs(page)).toEqual(original);
  expect(await catalogueCards(page).evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(catalogueBefore);
});

test('Explore another changes only the exploration and preserves that choice on reload', async ({page}) => {
  await openLearnedDiscovery(page);
  const familiar = await shelf(page).getByTestId('recommendation-familiar').getByRole('link', {name: /\. View recipe$/}).evaluateAll(links => links.map(link => link.getAttribute('href')));
  const previous = await shelf(page).getByTestId('recommendation-explore').getByRole('link', {name: /\. View recipe$/}).getAttribute('href');
  const refresh = shelf(page).getByRole('button', {name: 'Explore another', exact: true});
  await refresh.focus();
  await page.keyboard.press('Enter');
  const exploration = shelf(page).getByTestId('recommendation-explore').getByRole('link', {name: /\. View recipe$/});
  await expect(exploration).not.toHaveAttribute('href', previous!);
  expect(await shelf(page).getByTestId('recommendation-familiar').getByRole('link', {name: /\. View recipe$/}).evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(familiar);
  const refreshed = await shelfHrefs(page);
  assertSourceLinks(refreshed);
  await page.reload();
  await expect(shelfCards(page)).toHaveCount(6);
  expect(await shelfHrefs(page)).toEqual(refreshed);
  await expect(catalogueCards(page)).toHaveCount(24);
});

test('a new profile offers diverse discovery without claiming learned preferences', async ({page}) => {
  await page.goto('/discover');
  await expect(shelf(page).getByRole('heading', {name: 'A place to start', exact: true})).toBeVisible();
  await expect(shelfCards(page)).toHaveCount(6);
  const versions = assertSourceLinks(await shelfHrefs(page));
  expect(new Set(versions.flatMap(version => version.flavours)).size).toBeGreaterThan(1);
  await expect(shelf(page).getByRole('heading', {name: 'For you', exact: true})).toHaveCount(0);
  await expect(shelf(page).getByTestId('recommendation-familiar')).toHaveCount(0);
  await expect(shelf(page).getByTestId('recommendation-explore')).toHaveCount(0);
  await expect(shelf(page).getByRole('link', {name: 'View saved feedback', exact: true})).toHaveCount(0);
  await expect(catalogueCards(page)).toHaveCount(24);
});

test('a failed taste save keeps the saved recommendation model during an in-app return', async ({page}) => {
  await openLearnedDiscovery(page);
  const before = await shelfHrefs(page);
  const stored = await page.evaluate(key => localStorage.getItem(key), tasteKey);
  const first = shelf(page).getByTestId('recommendation-familiar').first();
  await first.getByRole('button', {name: 'Why this pick', exact: true}).click();
  const evidence = first.getByRole('link', {name: 'View saved feedback', exact: true});
  const evidenceHref = await evidence.getAttribute('href');
  const entryId = new URL(evidenceHref!, origin).searchParams.get('entry');
  const savedEntry = learnedEntries().find(entry => entry.id === entryId);
  expect(savedEntry).toBeDefined();
  const savedExplanation = await first.getByTestId('recommendation-explanation').innerText();
  await evidence.click();
  await expect(page.getByRole('heading', {name: /: tasting notes$/})).toBeVisible();
  const changeSentiment = page.getByRole('button', {name: savedEntry!.sentiment === 'like' ? 'I disliked this version' : 'I liked this version', exact: true});
  await expect(changeSentiment).toHaveAttribute('aria-pressed', 'false');
  await changeSentiment.click();
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    let fail = true;
    Storage.prototype.setItem = function(name, value) {
      if (name === key && fail) {
        fail = false;
        throw new DOMException('Synthetic taste quota failure', 'QuotaExceededError');
      }
      return original.call(this, name, value);
    };
  }, tasteKey);
  await page.getByRole('button', {name: 'Save changes', exact: true}).click();
  await expect(page.getByRole('alert')).toContainText('could not be saved on this device');
  expect(await page.evaluate(key => localStorage.getItem(key), tasteKey)).toBe(stored);
  await page.getByRole('button', {name: '← Back', exact: true}).click();
  await expect(shelfCards(page)).toHaveCount(6);
  expect(await shelfHrefs(page)).toEqual(before);
  const returnedWhy = first.getByRole('button', {name: 'Why this pick', exact: true});
  if (await returnedWhy.getAttribute('aria-expanded') === 'false') await returnedWhy.click();
  await expect(first.getByTestId('recommendation-explanation')).toHaveText(savedExplanation);
  await expect(first.getByRole('link', {name: 'View saved feedback', exact: true})).toBeDisabled();
  await expect(shelf(page).getByRole('alert')).toContainText('last saved feedback');
  await expect(shelf(page).getByRole('button', {name: 'Retry', exact: true})).toBeEnabled();
  await expect(catalogueCards(page)).toHaveCount(24);
  await shelf(page).getByRole('button', {name: 'Retry', exact: true}).click();
  await expect(shelf(page).getByRole('alert')).toHaveCount(0);
  await expect.poll(() => page.evaluate(({key, id}) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    return state.entries.find((entry: TasteFeedback) => entry.id === id)?.sentiment;
  }, {key: tasteKey, id: entryId})).toBe(savedEntry!.sentiment === 'like' ? 'dislike' : 'like');
});

test('a taste read failure leaves the original catalogue available and retry restores the personal shelf', async ({page}) => {
  await seedTaste(page, learnedEntries());
  await page.addInitScript(key => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function(name) {
      if (name === key && !sessionStorage.getItem('discovery-allow-taste-read')) throw new DOMException('Synthetic taste read failure', 'SecurityError');
      return original.call(this, name);
    };
  }, tasteKey);
  await page.goto('/discover');
  await expect(shelf(page).getByRole('alert')).toContainText('Taste memory is unavailable');
  await expect(shelf(page).getByRole('heading', {name: 'For you', exact: true})).toHaveCount(0);
  await expect(catalogueCards(page)).toHaveCount(24);
  await page.getByRole('button', {name: 'Load more', exact: true}).click();
  await expect(catalogueCards(page)).toHaveCount(48);
  await page.evaluate(() => sessionStorage.setItem('discovery-allow-taste-read', 'yes'));
  await shelf(page).getByRole('button', {name: 'Retry', exact: true}).click();
  await expect(shelf(page).getByRole('heading', {name: 'For you', exact: true})).toBeVisible();
  await expect(shelfCards(page)).toHaveCount(6);
  await expect(shelf(page).getByRole('alert')).toHaveCount(0);
  await expect(catalogueCards(page)).toHaveCount(48);
});

test('an explicit ingredient exclusion constrains every recommended version and text search stays direct', async ({page}) => {
  await openLearnedDiscovery(page);
  await page.getByRole('button', {name: 'Filters', exact: true}).click();
  await page.getByRole('button', {name: /^Ingredients\. 0 /}).click();
  await page.getByRole('textbox', {name: 'Search ingredients', exact: true}).fill('Gin');
  await page.getByRole('button', {name: 'Leave out Gin', exact: true}).click();
  await page.getByRole('button', {name: /^Find my glass/}).click();
  await expect(shelfCards(page)).toHaveCount(6);
  const versions = assertSourceLinks(await shelfHrefs(page));
  for (const version of versions) expect(version.ingredients.map(ingredient => ingredient.ingredientId)).not.toContain('gin');
  await expect(catalogueCards(page)).toHaveCount(6);
  const search = page.getByRole('textbox', {name: 'A cocktail, a spirit, a new favourite…', exact: true});
  await search.fill('Whiskey Highball');
  await expect(shelf(page)).toHaveCount(0);
  await expect(catalogueCards(page)).toHaveCount(1);
  await expect(catalogueCards(page).first()).toHaveAttribute('href', /version=whiskey-highball-batch-f/);
});

test('an exact dislike stays honest when a liked recipe supplies overlapping combinations', async ({page}) => {
  await seedTaste(page, [
    feedback('daiquiri-iba', 'discovery-daiquiri', {sentiment: 'dislike'}),
    feedback('mojito-iba', 'discovery-mojito', {sentiment: 'like'}),
  ]);
  await page.goto('/discover');
  await expect(shelf(page).getByRole('heading', {name: 'For you', exact: true})).toBeVisible();
  await filterSharedRumIngredients(page);
  const daiquiri = daiquiriCard(page);
  await expect(daiquiri).toHaveCount(1);
  await daiquiri.getByRole('button', {name: 'Why this pick', exact: true}).click();
  await expect(daiquiri.getByTestId('recommendation-explanation')).toHaveText('You disliked this exact source version.');
  await expect(daiquiri.getByRole('link', {name: 'View saved feedback', exact: true})).toHaveAttribute('href', '/taste?entry=discovery-daiquiri');
});

test('a neutral recipe links a learned combination explanation to supporting positive feedback', async ({page}) => {
  await seedTaste(page, [
    feedback('daiquiri-iba', 'discovery-neutral-daiquiri'),
    feedback('mojito-iba', 'discovery-positive-mojito', {sentiment: 'like'}),
  ]);
  await page.goto('/discover');
  await expect(shelf(page).getByRole('heading', {name: 'For you', exact: true})).toBeVisible();
  await filterSharedRumIngredients(page);
  const daiquiri = daiquiriCard(page);
  await expect(daiquiri).toHaveCount(1);
  await daiquiri.getByRole('button', {name: 'Why this pick', exact: true}).click();
  await expect(daiquiri.getByTestId('recommendation-explanation')).toHaveText('Similar to recipe combinations you rated positively.');
  await expect(daiquiri.getByRole('link', {name: 'View saved feedback', exact: true})).toHaveCount(1);
  await expect(daiquiri.getByRole('link', {name: 'View saved feedback', exact: true})).toHaveAttribute('href', '/taste?entry=discovery-positive-mojito');
});
