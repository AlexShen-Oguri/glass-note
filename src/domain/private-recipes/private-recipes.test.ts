import assert from 'node:assert/strict';
import test from 'node:test';

import {catalogue} from '../../content/catalogue';
import type {LabProject} from '../lab/types';
import {
  activePrivateRecipeRevision,
  catalogueRecipeContent,
  catalogueRecipeOrigin,
  labRecipeContent,
  labRecipeOrigin,
  parsePrivateRecipeBook,
  PrivateRecipeValidationError,
  searchPrivateRecipes,
  serializePrivateRecipeBook,
  validatePrivateRecipeBook,
} from '.';
import type {PrivateRecipe, PrivateRecipeBook, PrivateRecipeContent} from './types';

const time = '2026-09-10T12:00:00-04:00';
const content = (title = 'House Highball'): PrivateRecipeContent => ({
  title,
  description: '',
  servings: 1,
  ingredients: [{id: 'ingredient-1', name: 'Tea cordial', amount: '1 1/2', unit: 'parts'}],
  steps: ['Build over ice.'],
  method: '',
  glass: 'Highball',
  garnish: '',
  notes: '',
});
const recipe = (id = 'recipe-1', title = 'House Highball'): PrivateRecipe => ({
  id,
  private: true,
  createdAt: time,
  updatedAt: time,
  origin: {kind: 'original'},
  activeRevisionId: `${id}-revision-1`,
  revisions: [{id: `${id}-revision-1`, createdAt: time, content: content(title)}],
});
const book = (...recipes: PrivateRecipe[]): PrivateRecipeBook => ({format: 'glass-notes-private-recipes', schemaVersion: 1, recipes});

test('private recipe persistence preserves raw amounts and returns an empty initial book', () => {
  assert.deepEqual(parsePrivateRecipeBook(null), book());
  const raw = serializePrivateRecipeBook(book(recipe()));
  const parsed = parsePrivateRecipeBook(raw);
  assert.equal(activePrivateRecipeRevision(parsed.recipes[0]!).content.ingredients[0]!.amount, '1 1/2');
  assert.equal(activePrivateRecipeRevision(parsed.recipes[0]!).content.ingredients[0]!.unit, 'parts');
});

test('private recipe validation rejects unknown fields, timezone-free dates, duplicate ids and broken active revisions', () => {
  const unknown = {...book(recipe()), extra: true};
  assert.throws(() => validatePrivateRecipeBook(unknown), PrivateRecipeValidationError);
  const noTimezone = book({...recipe(), createdAt: '2026-09-10T12:00:00'});
  assert.throws(() => validatePrivateRecipeBook(noTimezone), /timezone/);
  assert.throws(() => validatePrivateRecipeBook(book(recipe('same'), recipe('same'))), /duplicate id/);
  assert.throws(() => validatePrivateRecipeBook(book({...recipe(), activeRevisionId: 'missing'})), /does not reference/);
});

test('private recipe validation rejects revision parent cycles without recursive traversal', () => {
  const cyclic = recipe();
  cyclic.revisions = [
    {...cyclic.revisions[0]!, derivedFromRevisionId: 'cycle-b'},
    {id: 'cycle-b', createdAt: time, derivedFromRevisionId: cyclic.revisions[0]!.id, content: content('Second')},
  ];
  assert.throws(() => validatePrivateRecipeBook(book(cyclic)), /contains a cycle/);
});

test('private recipe parsing rejects payloads over five UTF-8 megabytes before accepting data', () => {
  assert.throws(() => parsePrivateRecipeBook(`{"padding":"${'饮'.repeat(1_700_000)}"}`), /5000000 UTF-8 bytes/);
});

test('catalogue adaptations preserve exact source identity and raw source units', () => {
  const version = catalogue.versions[0]!;
  const source = catalogue.sources.find(item => item.id === version.sourceId)!;
  const origin = catalogueRecipeOrigin(catalogue, version.id, 'zh', time);
  assert.equal(origin.kind, 'catalogue-version');
  if (origin.kind !== 'catalogue-version') return;
  assert.equal(origin.versionId, version.id);
  assert.equal(origin.sourceId, source.id);
  assert.equal(origin.snapshot.ingredients[0]?.unit, version.ingredients[0]?.unit);
  assert.deepEqual(catalogueRecipeContent(catalogue, version, 'zh'), origin.snapshot);
});

test('lab conversions retain the selected version and an immutable source copy', () => {
  const project: LabProject = {
    id: 'lab-1', name: 'Lab drink', goal: 'Serve at home', createdAt: time, updatedAt: time,
    source: {cocktailId: 'drink', versionId: 'source-v', title: 'Drink', sourceTitle: 'Book', url: 'https://example.com', ingredients: [], method: 'Stir'},
    versions: [{id: 'lab-v1', name: 'v1', createdAt: time, updatedAt: time, ingredients: [{id: 'row', name: 'Gin', amount: '45', unit: 'ml'}], method: 'Stir', notes: 'Cold'}],
    batches: [],
  };
  const content = labRecipeContent(project, project.versions[0]!);
  const origin = labRecipeOrigin(project, 'lab-v1', time);
  assert.equal(content.ingredients[0]?.amount, '45');
  assert.equal(origin.kind, 'lab-version');
  if (origin.kind === 'lab-version') assert.notEqual(origin.source, project.source);
});

test('lab conversions discard empty draft rows and keep bottle-backed ingredients valid', () => {
  const project: LabProject = {
    id: 'lab-draft', name: '', goal: '', createdAt: time, updatedAt: time,
    versions: [{id: 'lab-draft-v1', name: '', createdAt: time, updatedAt: time, ingredients: [
      {id: 'empty', name: '', amount: '', unit: ''},
      {id: 'bottle', name: '', amount: '1', unit: 'oz', bottleId: 'bottle-1', bottleName: 'House gin'},
    ], method: '', notes: ''}],
    batches: [],
  };
  const origin = labRecipeOrigin(project, 'lab-draft-v1', time);
  assert.equal(origin.kind, 'lab-version');
  if (origin.kind !== 'lab-version') return;
  assert.equal(origin.snapshot.title, 'lab-draft-v1');
  assert.deepEqual(origin.snapshot.ingredients.map(item => item.name), ['House gin']);
  assert.doesNotThrow(() => validatePrivateRecipeBook(book({...recipe(), origin})));
});

test('private search uses current content and source labels with stable recency ordering', () => {
  const tea = recipe('tea', 'Tea Highball');
  const ginBase = recipe('gin', 'Dry Martini');
  const gin = {...ginBase, updatedAt: '2026-09-11T12:00:00Z', revisions: ginBase.revisions.map(item => ({...item,
    content: {...item.content, ingredients: [{id: 'gin-row', name: 'Gin', amount: '60', unit: 'ml'}], glass: 'Coupe'}}))};
  assert.deepEqual(searchPrivateRecipes([tea, gin], 'Highball').map(item => item.id), ['tea']);
  assert.deepEqual(searchPrivateRecipes([tea, gin], '').map(item => item.id), ['gin', 'tea']);
});
