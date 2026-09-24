import {LOCALES} from '../contracts';
import {validateRecipePhoto} from './photo';
import type {
  PrivateIngredient,
  PrivateRecipe,
  PrivateRecipeBook,
  PrivateRecipeContent,
  PrivateRecipeOrigin,
  PrivateRecipeRevision,
} from './types';

const MAX_BYTES = 5_000_000;
const MAX_RECIPES = 1_000;
const MAX_REVISIONS = 500;
const MAX_INGREDIENTS = 300;
const MAX_STEPS = 200;
const LIMIT = {id: 200, title: 500, text: 100_000, short: 2_000, url: 4_000};

export class PrivateRecipeValidationError extends Error {
  constructor(readonly path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = 'PrivateRecipeValidationError';
  }
}

function fail(path: string, message: string): never {
  throw new PrivateRecipeValidationError(path, message);
}

function photo(value:unknown,path:string):string {
  try{return validateRecipePhoto(value);}catch{fail(path,'expected a bounded local JPEG');}
}

function utf8Length(value: string): number {
  let length = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x80) length += 1;
    else if (code < 0x800) length += 2;
    else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) { length += 4; index += 1; }
      else length += 3;
    } else length += 3;
  }
  return length;
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'expected object');
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, required: string[], optional: string[], path: string): void {
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail(`${path}.${key}`, 'unknown field');
  for (const key of required) if (!Object.prototype.hasOwnProperty.call(value, key)) fail(`${path}.${key}`, 'missing field');
}

function text(value: unknown, path: string, max: number, allowEmpty = true): string {
  if (typeof value !== 'string') fail(path, 'expected string');
  if (value.length > max) fail(path, `exceeds ${max} characters`);
  if (!allowEmpty && !value.trim()) fail(path, 'must not be empty');
  return value;
}

function optionalText(value: unknown, path: string, max: number): string | undefined {
  return value === undefined ? undefined : text(value, path, max, false);
}

function boolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') fail(path, 'expected boolean');
  return value;
}

function timestamp(value: unknown, path: string): string {
  const result = text(value, path, 80, false);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(result) || !Number.isFinite(Date.parse(result))) {
    fail(path, 'expected an ISO date-time with timezone');
  }
  return result;
}

function identifier(value: unknown, path: string): string {
  return text(value, path, LIMIT.id, false);
}

function externalUrl(value: unknown, path: string): string {
  const result = text(value, path, LIMIT.url, false);
  if (!/^https?:\/\/[^\s]+$/i.test(result)) fail(path, 'expected an HTTP(S) URL');
  return result;
}

function unique(id: string, ids: Set<string>, path: string): void {
  if (ids.has(id)) fail(path, `duplicate id ${id}`);
  ids.add(id);
}

function ingredientValue(value: unknown, path: string, ids: Set<string>): PrivateIngredient {
  const item = record(value, path);
  exactKeys(item, ['id', 'name', 'amount', 'unit'], ['ingredientId', 'brandId', 'brandName', 'bottleId', 'bottleName', 'note', 'optional'], path);
  const id = identifier(item.id, `${path}.id`);
  unique(id, ids, `${path}.id`);
  return {
    id,
    name: text(item.name, `${path}.name`, LIMIT.short, false),
    amount: text(item.amount, `${path}.amount`, LIMIT.short),
    unit: text(item.unit, `${path}.unit`, LIMIT.short),
    ...(item.ingredientId === undefined ? {} : {ingredientId: identifier(item.ingredientId, `${path}.ingredientId`)}),
    ...(item.brandId === undefined ? {} : {brandId: identifier(item.brandId, `${path}.brandId`)}),
    ...(item.brandName === undefined ? {} : {brandName: text(item.brandName, `${path}.brandName`, LIMIT.short, false)}),
    ...(item.bottleId === undefined ? {} : {bottleId: identifier(item.bottleId, `${path}.bottleId`)}),
    ...(item.bottleName === undefined ? {} : {bottleName: text(item.bottleName, `${path}.bottleName`, LIMIT.short, false)}),
    ...(item.note === undefined ? {} : {note: text(item.note, `${path}.note`, LIMIT.text)}),
    ...(item.optional === undefined ? {} : {optional: boolean(item.optional, `${path}.optional`)}),
  };
}

function contentValue(value: unknown, path: string): PrivateRecipeContent {
  const item = record(value, path);
  exactKeys(item, ['title', 'description', 'servings', 'ingredients', 'steps', 'method', 'glass', 'garnish', 'notes'], ['photo'], path);
  if (typeof item.servings !== 'number' || !Number.isInteger(item.servings) || item.servings < 1 || item.servings > 1_000) {
    fail(`${path}.servings`, 'expected an integer from 1 to 1000');
  }
  if (!Array.isArray(item.ingredients) || item.ingredients.length > MAX_INGREDIENTS) fail(`${path}.ingredients`, `expected at most ${MAX_INGREDIENTS} ingredients`);
  if (!Array.isArray(item.steps) || item.steps.length > MAX_STEPS) fail(`${path}.steps`, `expected at most ${MAX_STEPS} steps`);
  const ingredientIds = new Set<string>();
  return {
    ...(item.photo===undefined?{}:{photo:photo(item.photo,`${path}.photo`)}),
    title: text(item.title, `${path}.title`, LIMIT.title, false),
    description: text(item.description, `${path}.description`, LIMIT.text),
    servings: item.servings,
    ingredients: item.ingredients.map((entry, index) => ingredientValue(entry, `${path}.ingredients[${index}]`, ingredientIds)),
    steps: item.steps.map((entry, index) => text(entry, `${path}.steps[${index}]`, LIMIT.text, false)),
    method: text(item.method, `${path}.method`, LIMIT.text),
    glass: text(item.glass, `${path}.glass`, LIMIT.short),
    garnish: text(item.garnish, `${path}.garnish`, LIMIT.short),
    notes: text(item.notes, `${path}.notes`, LIMIT.text),
  };
}

function labIngredientValue(value: unknown, path: string) {
  const item = record(value, path);
  exactKeys(item, ['id', 'name', 'amount', 'unit'], ['ingredientId', 'bottleId', 'bottleName'], path);
  return {
    id: identifier(item.id, `${path}.id`),
    name: text(item.name, `${path}.name`, LIMIT.short),
    amount: text(item.amount, `${path}.amount`, LIMIT.short),
    unit: text(item.unit, `${path}.unit`, LIMIT.short),
    ...(item.ingredientId === undefined ? {} : {ingredientId: identifier(item.ingredientId, `${path}.ingredientId`)}),
    ...(item.bottleId === undefined ? {} : {bottleId: identifier(item.bottleId, `${path}.bottleId`)}),
    ...(item.bottleName === undefined ? {} : {bottleName: text(item.bottleName, `${path}.bottleName`, LIMIT.short)}),
  };
}

function labSourceValue(value: unknown, path: string) {
  const item = record(value, path);
  exactKeys(item, ['cocktailId', 'versionId', 'title', 'sourceTitle', 'url', 'ingredients', 'method'], [], path);
  if (!Array.isArray(item.ingredients) || item.ingredients.length > MAX_INGREDIENTS) fail(`${path}.ingredients`, 'invalid ingredients');
  return {
    cocktailId: identifier(item.cocktailId, `${path}.cocktailId`),
    versionId: identifier(item.versionId, `${path}.versionId`),
    title: text(item.title, `${path}.title`, LIMIT.title, false),
    sourceTitle: text(item.sourceTitle, `${path}.sourceTitle`, LIMIT.short, false),
    url: externalUrl(item.url, `${path}.url`),
    ingredients: item.ingredients.map((entry, index) => labIngredientValue(entry, `${path}.ingredients[${index}]`)),
    method: text(item.method, `${path}.method`, LIMIT.text),
  };
}

function originValue(value: unknown, path: string): PrivateRecipeOrigin {
  const item = record(value, path);
  const kind = text(item.kind, `${path}.kind`, 40, false);
  if (kind === 'original') {
    exactKeys(item, ['kind'], [], path);
    return {kind};
  }
  if (kind === 'catalogue-version') {
    exactKeys(item, ['kind', 'cocktailId', 'versionId', 'sourceId', 'sourceTitle', 'sourceUrl', 'versionTitle', 'capturedAt', 'capturedLocale', 'snapshot'], ['sourceAuthor'], path);
    const locale = text(item.capturedLocale, `${path}.capturedLocale`, 10, false);
    if (!LOCALES.includes(locale as (typeof LOCALES)[number])) fail(`${path}.capturedLocale`, 'unsupported locale');
    return {
      kind,
      cocktailId: identifier(item.cocktailId, `${path}.cocktailId`),
      versionId: identifier(item.versionId, `${path}.versionId`),
      sourceId: identifier(item.sourceId, `${path}.sourceId`),
      sourceTitle: text(item.sourceTitle, `${path}.sourceTitle`, LIMIT.short, false),
      sourceUrl: externalUrl(item.sourceUrl, `${path}.sourceUrl`),
      ...(item.sourceAuthor === undefined ? {} : {sourceAuthor: text(item.sourceAuthor, `${path}.sourceAuthor`, LIMIT.short, false)}),
      versionTitle: text(item.versionTitle, `${path}.versionTitle`, LIMIT.short, false),
      capturedAt: timestamp(item.capturedAt, `${path}.capturedAt`),
      capturedLocale: locale as (typeof LOCALES)[number],
      snapshot: contentValue(item.snapshot, `${path}.snapshot`),
    };
  }
  if (kind === 'lab-version') {
    exactKeys(item, ['kind', 'projectId', 'versionId', 'projectTitle', 'versionTitle', 'capturedAt', 'snapshot'], ['batchId', 'source'], path);
    return {
      kind,
      projectId: identifier(item.projectId, `${path}.projectId`),
      versionId: identifier(item.versionId, `${path}.versionId`),
      ...(item.batchId === undefined ? {} : {batchId: identifier(item.batchId, `${path}.batchId`)}),
      projectTitle: text(item.projectTitle, `${path}.projectTitle`, LIMIT.title, false),
      versionTitle: text(item.versionTitle, `${path}.versionTitle`, LIMIT.title, false),
      capturedAt: timestamp(item.capturedAt, `${path}.capturedAt`),
      snapshot: contentValue(item.snapshot, `${path}.snapshot`),
      ...(item.source === undefined ? {} : {source: labSourceValue(item.source, `${path}.source`)}),
    };
  }
  return fail(`${path}.kind`, 'unsupported origin');
}

function revisionValue(value: unknown, path: string, ids: Set<string>): PrivateRecipeRevision {
  const item = record(value, path);
  exactKeys(item, ['id', 'createdAt', 'content'], ['derivedFromRevisionId'], path);
  const id = identifier(item.id, `${path}.id`);
  unique(id, ids, `${path}.id`);
  return {
    id,
    createdAt: timestamp(item.createdAt, `${path}.createdAt`),
    ...(item.derivedFromRevisionId === undefined ? {} : {derivedFromRevisionId: identifier(item.derivedFromRevisionId, `${path}.derivedFromRevisionId`)}),
    content: contentValue(item.content, `${path}.content`),
  };
}

function recipeValue(value: unknown, path: string, recipeIds: Set<string>, revisionIds: Set<string>): PrivateRecipe {
  const item = record(value, path);
  exactKeys(item, ['id', 'private', 'createdAt', 'updatedAt', 'origin', 'activeRevisionId', 'revisions'], ['importedFromId'], path);
  const id = identifier(item.id, `${path}.id`);
  unique(id, recipeIds, `${path}.id`);
  if (item.private !== true) fail(`${path}.private`, 'must be true');
  if (!Array.isArray(item.revisions) || item.revisions.length < 1 || item.revisions.length > MAX_REVISIONS) fail(`${path}.revisions`, `expected 1-${MAX_REVISIONS} revisions`);
  const revisions = item.revisions.map((entry, index) => revisionValue(entry, `${path}.revisions[${index}]`, revisionIds));
  const localRevisionIds = new Set(revisions.map(revision => revision.id));
  const revisionsById = new Map(revisions.map((revision, index) => [revision.id, {revision, index}]));
  for (let index = 0; index < revisions.length; index += 1) {
    const parent = revisions[index]?.derivedFromRevisionId;
    if (parent && (!localRevisionIds.has(parent) || parent === revisions[index]?.id)) fail(`${path}.revisions[${index}].derivedFromRevisionId`, 'unknown or self-referencing revision');
  }
  const complete = new Set<string>();
  for (const revision of revisions) {
    if (complete.has(revision.id)) continue;
    const pathIds: string[] = [];
    const visiting = new Set<string>();
    let current: PrivateRecipeRevision | undefined = revision;
    while (current && !complete.has(current.id)) {
      if (visiting.has(current.id)) {
        const cycle = revisionsById.get(current.id)!;
        fail(`${path}.revisions[${cycle.index}].derivedFromRevisionId`, 'revision history contains a cycle');
      }
      visiting.add(current.id);
      pathIds.push(current.id);
      current = current.derivedFromRevisionId === undefined ? undefined : revisionsById.get(current.derivedFromRevisionId)?.revision;
    }
    pathIds.forEach(id => complete.add(id));
  }
  const activeRevisionId = identifier(item.activeRevisionId, `${path}.activeRevisionId`);
  if (!localRevisionIds.has(activeRevisionId)) fail(`${path}.activeRevisionId`, 'does not reference this recipe');
  return {
    id,
    private: true,
    createdAt: timestamp(item.createdAt, `${path}.createdAt`),
    updatedAt: timestamp(item.updatedAt, `${path}.updatedAt`),
    origin: originValue(item.origin, `${path}.origin`),
    activeRevisionId,
    revisions,
    ...(item.importedFromId === undefined ? {} : {importedFromId: optionalText(item.importedFromId, `${path}.importedFromId`, LIMIT.id)}),
  };
}

export function validatePrivateRecipeBook(value: unknown): PrivateRecipeBook {
  const item = record(value, 'book');
  exactKeys(item, ['format', 'schemaVersion', 'recipes'], [], 'book');
  if (item.format !== 'glass-notes-private-recipes') fail('book.format', 'unsupported format');
  if (item.schemaVersion !== 1 && item.schemaVersion !== 2) fail('book.schemaVersion', 'unsupported schema version');
  if (!Array.isArray(item.recipes) || item.recipes.length > MAX_RECIPES) fail('book.recipes', `expected at most ${MAX_RECIPES} recipes`);
  const recipeIds = new Set<string>();
  const revisionIds = new Set<string>();
  const recipes=item.recipes.map((entry,index)=>recipeValue(entry,`book.recipes[${index}]`,recipeIds,revisionIds));
  if(item.schemaVersion===1&&recipes.some(recipe=>recipe.revisions.some(revision=>revision.content.photo!==undefined)||(recipe.origin.kind!=='original'&&recipe.origin.snapshot.photo!==undefined)))fail('book.schemaVersion','photos require version 2');
  return {format:'glass-notes-private-recipes',schemaVersion:item.schemaVersion,recipes};
}

export function parsePrivateRecipeBook(raw: string | null): PrivateRecipeBook {
  if (raw === null) return {format: 'glass-notes-private-recipes', schemaVersion: 1, recipes: []};
  if (utf8Length(raw) > MAX_BYTES) fail('book', `exceeds ${MAX_BYTES} UTF-8 bytes`);
  let value: unknown;
  try { value = JSON.parse(raw); }
  catch { return fail('book', 'invalid JSON'); }
  return validatePrivateRecipeBook(value);
}

export function serializePrivateRecipeBook(book: PrivateRecipeBook): string {
  const raw = `${JSON.stringify(validatePrivateRecipeBook(book), null, 2)}\n`;
  if (utf8Length(raw) > MAX_BYTES) fail('book', `exceeds ${MAX_BYTES} UTF-8 bytes`);
  return raw;
}
