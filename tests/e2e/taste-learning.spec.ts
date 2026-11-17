import {test, expect, type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {catalogue} from '../../src/content/catalogue';
import {recipeSnapshot} from '../../src/domain/making';
import {createFeedback, emptyTasteState, type TasteFeedback, type TasteFeedbackInput} from '../../src/domain/taste';

const versionId = 'scotch-and-soda-batch-f';
const tasteKey = 'glass-notes.taste.v1';
const now = '2026-10-17T12:00:00Z';

function feedback(version: string, id: string, input: Partial<TasteFeedbackInput> = {}) {
  return createFeedback(recipeSnapshot(catalogue, version)!, id, now, {
    experience: 'drank', sentiment: 'neutral', tooSweet: false, tooStrong: false, likedFlavours: [], notes: '', ...input,
  });
}

async function seedTaste(page: Page, entries: TasteFeedback[]) {
  await page.addInitScript(state => {
    if (sessionStorage.getItem('taste-learning-data')) return;
    sessionStorage.setItem('taste-learning-data', 'yes');
    localStorage.setItem('glass-notes.taste.v1', JSON.stringify(state));
  }, {...emptyTasteState(), entries});
}

test.beforeEach(async ({context}) => {
  await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4176' ? route.continue() : route.abort());
  await context.addInitScript(() => {
    if (sessionStorage.getItem('taste-learning-fixture')) return;
    sessionStorage.setItem('taste-learning-fixture', 'yes');
    localStorage.setItem('glass-notes.preferences', JSON.stringify({locale: 'en', motionPaused: true}));
  });
});

async function openProfile(page: Page) {
  await page.goto('/taste');
  await expect(page.getByRole('heading', {name: 'Your taste memory', exact: true})).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Your taste profile', exact: true})).toBeVisible();
}

const profile = (page: Page) => page.getByTestId('taste-profile');
const signal = (page: Page, label: string, count = 1) => profile(page).getByRole('button', {
  name: `${label} · ${count} distinct recipe snapshots · ${count < 3 ? 'Early signal' : 'Repeated signal'}`, exact: true,
});
const entriesOnDisk = (page: Page) => page.evaluate(() => {
  const raw = localStorage.getItem('glass-notes.taste.v1');
  return raw ? JSON.parse(raw).entries as TasteFeedback[] : [];
});

async function openEditor(page: Page) {
  await page.goto(`/taste?version=${versionId}`);
  await expect(page.getByRole('heading', {name: 'Scotch and Soda: tasting notes', exact: true})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Save to taste memory', exact: true})).toBeEnabled();
}

async function saveFeedback(page: Page) {
  await page.getByRole('button', {name: 'Save to taste memory', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Your taste profile', exact: true})).toBeVisible();
}

async function openBroadResults(page: Page) {
  await page.goto('/customize');
  await page.getByRole('button', {name: /Have a drink/}).click();
  for (const heading of ['Which aromas draw you in?', 'What feels good on your palate?', 'How much spirit in your glass?', 'How would you like that first sip?']) {
    await expect(page.getByRole('heading', {name: heading, exact: true})).toBeVisible();
    // The shared navigation guard ignores user actions less than 130ms apart.
    await page.getByRole('button', {name: 'No preference', exact: true}).click({delay: 150});
  }
  await expect(page.getByRole('heading', {name: 'Your choices, in a glass', exact: true})).toBeVisible();
}

test('a new profile has no taste signals', async ({page}) => {
  await openProfile(page);
  await expect(page.getByText('No taste signals yet', {exact: true})).toBeVisible();
  await expect(page.getByText('0 distinct recipe snapshots with taste feedback', {exact: true})).toBeVisible();
});

test('saved feedback recomputes the profile after editing, deleting, resetting and undoing', async ({page}) => {
  await openEditor(page);
  await page.getByRole('button', {name: 'Citrus', exact: true}).click();
  await page.getByRole('button', {name: 'Too sweet for me', exact: true}).click();
  await saveFeedback(page);
  await expect(signal(page, 'Citrus')).toBeVisible();
  await expect(signal(page, 'Less sweetness')).toBeVisible();
  await expect(profile(page).getByText('1 distinct recipe snapshots with taste feedback', {exact: true})).toBeVisible();
  await expect.poll(async () => (await entriesOnDisk(page)).length).toBe(1);
  await page.reload();
  await expect(signal(page, 'Citrus')).toBeVisible();

  await page.getByRole('button', {name: 'Edit', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Citrus', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', {name: 'Citrus', exact: true}).click();
  await page.getByRole('button', {name: 'Fruit', exact: true}).click();
  await page.getByRole('button', {name: 'Save changes', exact: true}).click();
  await expect(signal(page, 'Citrus')).toHaveCount(0);
  await expect(signal(page, 'Fruit')).toBeVisible();
  await expect.poll(async () => (await entriesOnDisk(page)).map(entry => entry.likedFlavours)).toEqual([['fruit']]);

  await page.getByRole('button', {name: 'Delete', exact: true}).click();
  await page.getByRole('button', {name: 'Delete feedback', exact: true}).click();
  await expect(profile(page).getByText('No taste signals yet', {exact: true})).toBeVisible();
  await expect.poll(async () => (await entriesOnDisk(page)).length).toBe(0);
  await page.getByRole('button', {name: 'Undo', exact: true}).click();
  await expect(signal(page, 'Fruit')).toBeVisible();
  await page.getByRole('button', {name: 'Reset all taste memory', exact: true}).click();
  await page.getByRole('button', {name: 'Reset memory', exact: true}).click();
  await expect(profile(page).getByText('No taste signals yet', {exact: true})).toBeVisible();
  await expect.poll(async () => (await entriesOnDisk(page)).length).toBe(0);
  await page.getByRole('button', {name: 'Undo', exact: true}).click();
  await expect(signal(page, 'Fruit')).toBeVisible();
  await page.reload();
  await expect(signal(page, 'Fruit')).toBeVisible();
  await expect.poll(async () => (await entriesOnDisk(page)).length).toBe(1);
});

test('an experience and private note alone do not become taste signals', async ({page}) => {
  await openEditor(page);
  await page.getByRole('button', {name: 'I made it', exact: true}).click();
  await page.getByRole('textbox', {name: 'Private note', exact: true}).fill('I like citrus and this was too sweet. Keep this as a private note.');
  await saveFeedback(page);
  await expect(profile(page).getByText('No taste signals yet', {exact: true})).toBeVisible();
  await expect(profile(page).getByText('0 distinct recipe snapshots with taste feedback', {exact: true})).toBeVisible();
  await expect(profile(page).getByRole('button')).toHaveCount(0);
  await expect.poll(async () => (await entriesOnDisk(page)).map(({experience, sentiment, notes}) => ({experience, sentiment, notes}))).toEqual([
    {experience: 'made', sentiment: 'neutral', notes: 'I like citrus and this was too sweet. Keep this as a private note.'},
  ]);
  await page.reload();
  await expect(profile(page).getByText('No taste signals yet', {exact: true})).toBeVisible();
});

test('a failed reset keeps the saved profile until retry confirms the change', async ({page}) => {
  await seedTaste(page, [feedback(versionId, 'saved-citrus', {likedFlavours: ['citrus']})]);
  await openProfile(page);
  await expect(signal(page, 'Citrus')).toBeVisible();
  const before = await page.evaluate(key => localStorage.getItem(key), tasteKey);
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
  await page.getByRole('button', {name: 'Reset all taste memory', exact: true}).click();
  await page.getByRole('button', {name: 'Reset memory', exact: true}).click();
  await expect(page.getByRole('alert')).toContainText('could not be saved on this device');
  await expect(signal(page, 'Citrus')).toBeVisible();
  await expect(profile(page).getByText('No taste signals yet', {exact: true})).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), tasteKey)).toBe(before);
  await signal(page, 'Citrus').click();
  await expect(profile(page).getByRole('link', {name: 'Scotch and Soda', exact: true})).toBeDisabled();
  await page.getByRole('button', {name: 'Retry', exact: true}).click();
  await expect(profile(page).getByText('No taste signals yet', {exact: true})).toBeVisible();
  await expect.poll(async () => (await entriesOnDisk(page)).length).toBe(0);
  await page.getByRole('button', {name: 'Undo', exact: true}).click();
  await expect(signal(page, 'Citrus')).toBeVisible();
  await expect.poll(async () => (await entriesOnDisk(page)).length).toBe(1);
});

test('distinct evidence is named and guided taste memory remains an explicit choice', async ({page}) => {
  const highball = feedback('whiskey-highball-batch-f', 'liked-highball', {sentiment: 'like', likedFlavours: ['citrus']});
  const duplicate = {...highball, id: 'older-highball', updatedAt: '2026-10-17T11:00:00Z', createdAt: '2026-10-17T11:00:00Z'};
  await seedTaste(page, [duplicate, highball,
    feedback('negroni-iba', 'citrus-negroni', {likedFlavours: ['citrus']}),
    feedback('margarita-iba', 'citrus-margarita', {likedFlavours: ['citrus']}),
  ]);
  await openProfile(page);
  const citrus = signal(page, 'Citrus', 3);
  await expect(citrus).toBeVisible();
  await expect(profile(page).getByText('3 distinct recipe snapshots with taste feedback', {exact: true})).toBeVisible();
  await citrus.focus();
  await page.keyboard.press('Enter');
  const evidence = profile(page).getByRole('link', {name: /Whiskey Highball/});
  await expect(evidence).toHaveCount(1);
  await expect(evidence).toHaveAttribute('href', '/taste?entry=liked-highball');
  await evidence.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/taste\?entry=liked-highball$/);
  await expect(page.getByRole('heading', {name: 'Whiskey Highball: tasting notes', exact: true})).toBeVisible();

  await openBroadResults(page);
  const toggle = page.getByRole('checkbox', {name: /Use taste memory/});
  await expect(toggle).not.toBeChecked();
  await expect(page.getByRole('heading', {level: 2}).first()).toHaveText('Adonis');
  await expect(page.getByText('Taste memory is off for this search.', {exact: true})).toBeVisible();
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toBeChecked();
  await expect(page.getByRole('heading', {level: 2}).first()).toHaveText('Whiskey Highball');
  const why = page.getByRole('button', {name: 'Why this pick', exact: true}).first();
  await expect(why).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByText('You liked this exact source version.', {exact: true})).toHaveCount(0);
  await expect(page.getByRole('link', {name: /View saved feedback/})).toHaveCount(0);
  await why.focus();
  await page.keyboard.press('Enter');
  await expect(why).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('You liked this exact source version.', {exact: true})).toBeVisible();
  await expect(page.getByRole('link', {name: /View saved feedback/})).toHaveCount(1);
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).not.toBeChecked();
  await expect(page.getByRole('heading', {level: 2}).first()).toHaveText('Adonis');
  await expect(page.getByText('Taste memory is off for this search.', {exact: true})).toBeVisible();
  await expect(page.getByText('You liked this exact source version.', {exact: true})).toHaveCount(0);
  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect(page.getByRole('heading', {level: 2}).first()).toHaveText('Whiskey Highball');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).not.toBeChecked();
  await expect(page.getByRole('heading', {level: 2}).first()).toHaveText('Adonis');
  await page.keyboard.press('Enter');
  await expect(toggle).toBeChecked();
  await expect(page.getByRole('heading', {level: 2}).first()).toHaveText('Whiskey Highball');
  if (await why.getAttribute('aria-expanded') === 'false') await why.click();
  const recommendationEvidence = page.getByRole('link', {name: /View saved feedback/}).first();
  await expect(recommendationEvidence).toHaveAttribute('href', '/taste?entry=liked-highball');
  await recommendationEvidence.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/taste\?entry=liked-highball$/);
});

test('modified profile evidence clicks open a separate tab and preserve the profile', async ({page, context}) => {
  await seedTaste(page, [feedback(versionId, 'separate-tab-citrus', {likedFlavours: ['citrus']})]);
  await openProfile(page);
  await signal(page, 'Citrus').click();
  const evidence = profile(page).getByRole('link', {name: 'Scotch and Soda', exact: true});
  const originalUrl = page.url();
  const opened = context.waitForEvent('page').catch(() => null);
  await evidence.click({modifiers: ['ControlOrMeta']});
  await expect(page).toHaveURL(originalUrl);
  const separate = await opened;
  expect(separate).not.toBeNull();
  try {
    await expect(separate!).toHaveURL(/\/taste\?entry=separate-tab-citrus$/);
    // The new tab has its own app startup and saved-feedback read.
    await expect(separate!.getByRole('heading', {name: 'Scotch and Soda: tasting notes', exact: true})).toBeVisible({timeout:test.info().timeout});
    await expect(page.getByRole('heading', {name: 'Your taste profile', exact: true})).toBeVisible();
  } finally {
    await separate?.close();
  }
});

test('a taste backup restores the derived profile and an older replacement preserves it', async ({page, browser}) => {
  await seedTaste(page, [feedback(versionId, 'backup-citrus', {likedFlavours: ['citrus'], notes: 'Synthetic private backup note'})]);
  await openProfile(page);
  await page.getByRole('button', {name: 'Open full backup', exact: true}).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Export all my data', exact: true}).click();
  const file = await (await download).path();
  expect(file).toBeTruthy();
  const backup = JSON.parse(await readFile(file!, 'utf8'));
  expect(backup.schemaVersion).toBe(3);
  expect(Object.keys(backup.sections.taste).sort()).toEqual(['entries', 'format', 'schemaVersion']);
  expect(backup.sections.taste.schemaVersion).toBe(1);
  expect(backup.sections.taste.entries[0]).toMatchObject({id: 'backup-citrus', notes: 'Synthetic private backup note'});
  const fresh = await browser.newContext({locale: 'en-US', viewport: page.viewportSize()!});
  await fresh.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4176' ? route.continue() : route.abort());
  await fresh.addInitScript(() => {
    if (sessionStorage.getItem('taste-backup-fixture')) return;
    sessionStorage.setItem('taste-backup-fixture', 'yes');
    localStorage.setItem('glass-notes.preferences', JSON.stringify({locale: 'en', motionPaused: true}));
  });
  try {
    const restored = await fresh.newPage();
    await restored.goto('http://127.0.0.1:4176/backup');
    const chooser = restored.waitForEvent('filechooser');
    await restored.getByRole('button', {name: 'Restore a full backup', exact: true}).click();
    await (await chooser).setFiles(file!);
    await restored.getByRole('button', {name: 'Merge selected data', exact: true}).click();
    await expect(restored.getByText('Your data has been restored.', {exact: true})).toBeVisible();
    await restored.goto('http://127.0.0.1:4176/taste');
    await expect(signal(restored, 'Citrus')).toBeVisible();
    await expect(restored.getByText('Synthetic private backup note', {exact: true})).toBeVisible();
    const before = await restored.evaluate(key => localStorage.getItem(key), tasteKey);

    backup.schemaVersion = 2;
    delete backup.sections.taste;
    delete backup.sections.shopping;
    backup.sections.favorites.versionIds = ['negroni-iba'];
    await restored.goto('http://127.0.0.1:4176/backup');
    const oldChooser = restored.waitForEvent('filechooser');
    await restored.getByRole('button', {name: 'Restore a full backup', exact: true}).click();
    await (await oldChooser).setFiles({name: 'older-taste-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup))});
    await expect(restored.getByRole('heading', {name: 'Choose what to restore', exact: true})).toBeVisible();
    await expect(restored.getByRole('checkbox', {name: 'Taste memory', exact: true})).toHaveCount(0);
    await restored.getByRole('button', {name: 'Replace selected categories', exact: true}).click();
    await restored.getByRole('button', {name: 'Review replacement', exact: true}).click();
    await restored.getByRole('button', {name: 'Replace these categories', exact: true}).click();
    await expect(restored.getByText('Your data has been restored.', {exact: true})).toBeVisible();
    expect(await restored.evaluate(key => localStorage.getItem(key), tasteKey)).toBe(before);
    await restored.goto('http://127.0.0.1:4176/taste');
    await expect(signal(restored, 'Citrus')).toBeVisible();
  } finally {
    await fresh.close();
  }
});
