import {test, expect, type Browser, type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';

async function logGpu(browser: Browser, mode: string) {
  const session = await browser.newBrowserCDPSession();
  try {
    const {gpu} = await session.send('SystemInfo.getInfo');
    console.info('[browser-gpu]', JSON.stringify({
      mode,
      devices: gpu.devices,
      renderer: gpu.auxAttributes?.glRenderer,
      implementation: gpu.auxAttributes?.glImplementationParts,
      features: gpu.featureStatus,
    }));
  } finally {
    await session.detach();
  }
}

test.beforeAll(async ({browser}) => {
  await logGpu(browser, 'test-browser');
});

// Every test uses a fresh browser context, real UI and origin-local storage.
// Never contact catalogue source sites or use a person's browser profile.
test.beforeEach(async ({context}) => {
  await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4176'
    ? route.continue() : route.abort());
});

async function fillRecipe(page: Page, title: string) {
  await page.goto('/my-recipes?create=original');
  await page.getByRole('textbox', {name: 'Recipe name', exact: true}).fill(title);
  await page.getByRole('textbox', {name: 'Ingredient', exact: true}).fill('Lime juice');
  await page.getByRole('textbox', {name: 'Amount', exact: true}).fill('30');
  await page.getByRole('textbox', {name: 'Method, one step per line', exact: true}).fill('Stir with ice.\nServe cold.');
  await page.getByRole('textbox', {name: 'Notes', exact: true}).fill('Browser acceptance record');
}

test('utility pages defer the glass GPU stage and later navigation preserves it', async ({page}) => {
  await page.goto('/my-recipes');
  await expect(page.getByRole('heading', {name: 'My recipes', exact: true})).toBeVisible();
  await expect(page.locator('.glass-stage-canvas')).toHaveCount(0);
  await page.getByRole('link', {name: 'Home', exact: true}).click();
  await expect(page).toHaveURL(/\/$/);
  await page.waitForFunction(() => document.querySelector<HTMLCanvasElement>('.glass-stage-canvas')?.style.opacity === '1');
  const stage = await page.locator('.glass-stage-canvas').elementHandle();
  expect(stage).not.toBeNull();
  await page.getByRole('link', {name: 'My notes', exact: true}).click();
  await expect(page).toHaveURL(/\/my$/);
  // Finish the incoming presentation before requesting the return handoff.
  await expect(page.getByRole('heading', {name: 'My notes', exact: true}).locator('[data-motion-part="title-line"]')).toHaveCSS('opacity', '1');
  await expect(page.locator('.glass-stage-canvas')).toHaveCount(1);
  expect(await stage!.evaluate(canvas => canvas.isConnected)).toBe(true);
  await page.getByRole('link', {name: 'Home', exact: true}).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await stage!.evaluate(canvas => canvas.isConnected)).toBe(true);
});

test('recipe persists across reload and survives a real backup download and restore', async ({page, browser}) => {
  const startedAt = Date.now();
  const checkpoint = (stage: string) => console.info(`[backup-flow:${test.info().project.name}] +${Date.now() - startedAt}ms ${stage}`);
  checkpoint('create recipe');
  await fillRecipe(page, 'Acceptance Lime');
  // A synthetic PNG exercises the retained browser photo adapter, without a
  // device photo library or personal files. The exported JPEG must restore too.
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 48;
    const context = canvas.getContext('2d')!; context.fillStyle = '#497650'; context.fillRect(0, 0, 64, 48);
    return canvas.toDataURL('image/png').split(',')[1]!;
  });
  const photoChooser = page.waitForEvent('filechooser');
  await page.getByRole('button', {name: 'Choose photo', exact: true}).click();
  await (await photoChooser).setFiles({name: 'acceptance-photo.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64')});
  await expect(page.getByRole('button', {name: 'Remove photo', exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Save recipe', exact: true}).click();
  await expect(page).toHaveURL(/[?&]id=/);
  await page.reload();
  await expect(page.getByRole('heading', {name: 'Acceptance Lime', exact: true})).toBeVisible();
  await expect(page.getByText('Browser acceptance record', {exact: true})).toBeVisible();
  checkpoint('recipe saved and reloaded');
  await page.goto('/backup');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Export all my data', exact: true}).click();
  const file = await (await downloaded).path();
  expect(file).not.toBeNull();
  const backup = JSON.parse(await readFile(file!, 'utf8'));
  expect(backup.schemaVersion).toBe(3);
  expect(JSON.stringify(backup.sections.privateRecipes)).toContain('Acceptance Lime');
  const exportedPhoto = JSON.stringify(backup.sections.privateRecipes).match(/data:image\/jpeg;base64,[A-Za-z0-9+/=]+/)?.[0];
  expect(exportedPhoto).toBeDefined();
  checkpoint('backup downloaded and parsed');
  const empty = await browser.newContext({locale: 'en-US', viewport: page.viewportSize() ?? undefined});
  await empty.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4176' ? route.continue() : route.abort());
  try {
    const restored = await empty.newPage();
    await restored.goto('http://127.0.0.1:4176/my-recipes');
    await expect(restored.getByRole('link', {name: 'Acceptance Lime', exact: true})).toHaveCount(0);
    checkpoint('fresh profile is empty');
    await restored.goto('http://127.0.0.1:4176/backup');
    const chooser = restored.waitForEvent('filechooser');
    await restored.getByRole('button', {name: 'Restore a full backup', exact: true}).click();
    await (await chooser).setFiles(file!);
    await expect(restored.getByText('Review before restoring', {exact: true})).toBeVisible();
    checkpoint('restore preview ready');
    await restored.getByRole('button', {name: 'Merge selected data', exact: true}).click();
    await expect(restored.getByText('Your data has been restored.', {exact: true})).toBeVisible();
    checkpoint('restore committed');
    await restored.goto('http://127.0.0.1:4176/my-recipes');
    await restored.getByRole('link', {name: 'Acceptance Lime', exact: true}).click();
    await expect(restored.getByRole('heading', {name: 'Acceptance Lime', exact: true})).toBeVisible();
    await expect(restored.getByText('Browser acceptance record', {exact: true})).toBeVisible();
    await expect(restored.getByText('30 · ml · Lime juice', {exact: true})).toBeVisible();
    await expect.poll(() => restored.evaluate(photo => Array.from(document.images)
      .some(image => image.src === photo && image.complete && image.naturalWidth > 0), exportedPhoto!)).toBe(true);
    checkpoint('restored data verified after navigation');
  } catch (error) {
    console.error('Backup restore failed before context cleanup:', error);
    throw error;
  } finally {
    checkpoint('close fresh context');
    await empty.close();
    checkpoint('fresh context closed');
  }
});

test('a stale tab cannot overwrite another tab’s saved recipe', async ({page, context}) => {
  const other = await context.newPage();
  await fillRecipe(page, 'First tab saved');
  await fillRecipe(other, 'Stale tab unsaved');
  await page.getByRole('button', {name: 'Save recipe', exact: true}).click();
  await expect(page).toHaveURL(/[?&]id=/);
  // The storage event may already have blocked the stale page before its click.
  const save = other.getByRole('button', {name: 'Save recipe', exact: true});
  if (await save.isVisible()) await save.click();
  await expect(other.getByText('Data changed in another window. Reload your personal data before editing.', {exact: true})).toBeVisible();
  await other.reload();
  await other.goto('/my-recipes');
  await expect(other.getByRole('link', {name: 'First tab saved', exact: true})).toBeVisible();
  await expect(other.getByRole('link', {name: 'Stale tab unsaved', exact: true})).toHaveCount(0);
});

test('search selects the matching recipe version; filter keyboard focus works with reduced motion', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/discover');
  const search = page.getByRole('textbox').first();
  await search.fill('Negroni');
  const result = page.getByRole('link', {name: /^Negroni\. /});
  await expect(result).toHaveCount(1);
  const filters = page.getByRole('button', {name: 'Filters', exact: true});
  await filters.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', {name: 'Choose filters', exact: true})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(filters).toBeFocused();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
  await result.click();
  await expect(page).toHaveURL(/\/cocktails\/[^?]+\?version=/);
  await expect(page.getByRole('heading', {name: 'Negroni', exact: true})).toBeVisible();
});

test('returning from recipe actions keeps the live photo attached to its scroll position', async ({page}) => {
  for (const action of [/^Start making/, /^Order card/, /^Gin ↗$/]) {
    await page.goto('/cocktails/negroni');
    const photo = page.locator('[data-motion-photo-target]:visible');
    await expect(photo.locator('img')).toBeVisible();
    await expect(photo).toHaveCSS('opacity', '1');
    await expect(page.getByRole('heading', {name: 'Negroni', exact: true}).locator('[data-motion-part="title-line"]')).toHaveCSS('opacity', '1');
    await page.getByRole('link', {name: action}).click();
    await expect(page).not.toHaveURL(/\/cocktails\//);
    await page.goBack();
    await expect(page).toHaveURL(/\/cocktails\/negroni$/);
    await expect(page.getByRole('heading', {name: 'Negroni', exact: true})).toBeVisible();
    // A five-second fallback must not mask a wrongly captured incoming photo.
    await expect(photo).toHaveCSS('opacity', '1', {timeout: 1000});
    await expect(page.locator('canvas[data-motion-photo-relay],[data-motion-photo-gate]')).toHaveCount(0, {timeout: 1000});
    await photo.evaluate(node => {
      for (let parent = node.parentElement; parent; parent = parent.parentElement) {
        if (parent.scrollHeight > parent.clientHeight && /auto|scroll/.test(getComputedStyle(parent).overflowY)) {
          parent.scrollTop += 120;
          return;
        }
      }
    });
    await expect(page.locator('canvas[data-motion-photo-relay],[data-motion-photo-gate]')).toHaveCount(0);
    await expect(photo).toHaveCSS('opacity', '1');
  }
});

test('cabinet plans a two-material purchase with exact source links without changing inventory', async ({page}) => {
  await page.goto('/pantry');
  await page.getByRole('button', {name: 'Add ingredients', exact: true}).click();
  await page.getByRole('textbox', {name: 'Search all ingredients', exact: true}).fill('Gin');
  await page.getByRole('button', {name: 'Add Gin', exact: true}).click();
  await page.getByRole('button', {name: 'Done', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Ingredients · 1', exact: true})).toBeVisible();
  const planning = page.getByRole('button', {name: 'Plan additions', exact: true});
  await expect(planning).toBeVisible({timeout: 1000});
  await planning.click();
  await page.getByRole('button', {name: 'Add two ingredients', exact: true}).click();
  await page.getByRole('textbox', {name: 'Filter plans by ingredient', exact: true}).fill('Campari sweet red vermouth');
  const plan = page.getByTestId('restock-plan-campari:sweet-red-vermouth');
  await expect(plan).toBeVisible();
  const disclosure = plan.getByRole('button', {name: /^View new drinks/});
  await expect(disclosure).toHaveAttribute('aria-expanded', 'false', {timeout: 1000});
  await disclosure.focus();
  await page.keyboard.press('Enter');
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  await expect(plan.getByRole('heading', {name: 'Negroni', exact: true, level: 4})).toBeVisible();
  await expect(plan).toContainText('Check brand');
  const versionLink = plan.getByRole('link', {name: /^Negroni ·/});
  await disclosure.focus();
  await page.keyboard.press('Tab');
  await expect(versionLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/cocktails\/negroni\?version=negroni-iba&from=pantry$/);
  await expect(page.getByRole('heading', {name: 'Negroni', exact: true}).locator('[data-motion-part="title-line"]')).toHaveCSS('opacity', '1');
  await page.getByRole('button', {name: 'Back', exact: true}).click();
  await expect(page).toHaveURL(/\/pantry\?tab=planning$/);
  await expect(planning).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('canvas[data-motion-photo-relay],[data-motion-photo-gate]')).toHaveCount(0, {timeout: 1000});
  await expect(plan).toBeVisible();
  await page.getByRole('button', {name: 'My ingredients', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Ingredients · 1', exact: true})).toBeVisible();
});

test('cabinet planning waits for a failed ownership read and recovers after retry', async ({page}) => {
  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem;
    let failing = true;
    Storage.prototype.getItem = function(key: string) {
      if (key === 'glass-notes.pantry.v1' && failing) throw new Error('Synthetic pantry read failure');
      return getItem.call(this, key);
    };
    Object.defineProperty(window, '__allowPantryRead', {value: () => {failing = false;}});
  });
  await page.goto('/pantry');
  await expect(page.getByText('Saved cabinet data could not be read. It is private to this device; retry before closing the app.', {exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Plan additions', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'What could I add next?', exact: true})).toHaveCount(0);
  await expect(page.getByRole('textbox', {name: 'Filter plans by ingredient', exact: true})).toHaveCount(0);
  await page.evaluate(() => (window as unknown as {__allowPantryRead: () => void}).__allowPantryRead());
  await page.getByRole('button', {name: 'Retry', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'What could I add next?', exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Add two ingredients', exact: true}).click();
  await expect(page.getByTestId(/^restock-plan-/).first()).toBeVisible();
});

test('research country selector centers both labels and remains keyboard operable', async ({page}) => {
  await page.goto('/topics');
  const country = page.getByRole('button', {name: /^Country or region:/});
  await expect(country).toBeVisible();
  await country.scrollIntoViewIfNeeded();
  const offsets = await country.evaluate(node => {
    const button = node.getBoundingClientRect();
    return Array.from(node.children).map(child => {
      const text = child.getBoundingClientRect();
      return Math.abs(text.top + text.height / 2 - button.top - button.height / 2);
    });
  });
  expect(offsets).toHaveLength(2);
  for (const offset of offsets) expect(offset).toBeLessThanOrEqual(2);
  await country.focus();
  await page.keyboard.press('Enter');
  await expect(country).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', {name: 'United States', exact: true}).click();
  await expect(country).toContainText('United States');
  await expect(country).toHaveAttribute('aria-expanded', 'false');
});
