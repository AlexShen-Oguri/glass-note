import type {
  LabBackup,
  LabBatch,
  LabIngredient,
  LabObservation,
  LabProject,
  LabSnapshot,
  LabSource,
  LabVersion,
} from './types';
import type {BottleComparisonProjectDraft} from './bottleComparison';

export * from './types';
export * from './bottleComparison';

export const LAB_STORAGE_KEY = 'glass-notes.lab.v1';

const LIMITS = {
  rawBytes: 5_000_000,
  projects: 500,
  versions: 100,
  batches: 500,
  ingredients: 100,
  observations: 1_000,
  id: 200,
  name: 500,
  shortText: 2_000,
  notes: 50_000,
  url: 4_096,
} as const;

const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export type LabBackupErrorCode =
  | 'invalid-json'
  | 'invalid-format'
  | 'unsupported-version'
  | 'invalid-data'
  | 'unsafe-key';

export class LabBackupError extends Error {
  constructor(public readonly code: LabBackupErrorCode, message: string) {
    super(message);
    this.name = 'LabBackupError';
  }
}

export type LabMutationErrorCode =
  | 'not-ready'
  | 'not-found'
  | 'last-version'
  | 'version-in-use'
  | 'invalid-change';

export class LabMutationError extends Error {
  constructor(public readonly code: LabMutationErrorCode, message: string) {
    super(message);
    this.name = 'LabMutationError';
  }
}

export interface LabStorage {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
}

export function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x7f) bytes += 1;
    else if (code <= 0x7ff) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length
      && value.charCodeAt(index + 1) >= 0xdc00 && value.charCodeAt(index + 1) <= 0xdfff) {
      bytes += 4;
      index += 1;
    } else bytes += 3;
  }
  return bytes;
}

type RecordValue = Record<string, unknown>;

function fail(code: LabBackupErrorCode, path: string, detail: string): never {
  throw new LabBackupError(code, `${path}: ${detail}`);
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rejectDangerousKeys(value: unknown): void {
  const pending: Array<{value: unknown; path: string}> = [{value, path: 'backup'}];
  let visited = 0;
  while (pending.length) {
    if (++visited > 1_000_000) fail('invalid-data', 'backup', 'contains too many nested values');
    const current = pending.pop()!;
    if (Array.isArray(current.value)) {
      current.value.forEach((item, index) => pending.push({value: item, path: `${current.path}[${index}]`}));
      continue;
    }
    if (!isRecord(current.value)) continue;
    for (const key of Object.keys(current.value)) {
      if (DANGEROUS_KEYS.has(key)) fail('unsafe-key', current.path, `unsafe property ${JSON.stringify(key)}`);
      pending.push({value: current.value[key], path: `${current.path}.${key}`});
    }
  }
}

function record(value: unknown, path: string): RecordValue {
  if (!isRecord(value)) fail('invalid-data', path, 'expected an object');
  return value;
}

function exactKeys(value: RecordValue, required: readonly string[], optional: readonly string[], path: string): void {
  const allowed = new Set([...required, ...optional]);
  for (const key of required) if (!Object.prototype.hasOwnProperty.call(value, key)) fail('invalid-data', path, `missing ${key}`);
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail('invalid-data', path, `unsupported property ${key}`);
}

function textValue(value: unknown, path: string, max: number, allowEmpty = true): string {
  if (typeof value !== 'string') fail('invalid-data', path, 'expected text');
  if (value.length > max) fail('invalid-data', path, `exceeds ${max} characters`);
  if (!allowEmpty && value.trim().length === 0) fail('invalid-data', path, 'must not be empty');
  return value;
}

function boundedNumericText(value: unknown, path: string, max: number): string {
  const result = textValue(value, path, max);
  const tokens = result.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/gi) ?? [];
  for (const token of tokens) {
    const numeric = Number(token);
    if (!Number.isFinite(numeric) || Math.abs(numeric) > 1_000_000_000) {
      fail('invalid-data', path, 'contains a number outside the supported range');
    }
  }
  return result;
}

function dateValue(value: unknown, path: string): string {
  const result = textValue(value, path, 100, false);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(result)
    || !Number.isFinite(Date.parse(result))) fail('invalid-data', path, 'expected an ISO 8601 date-time');
  return result;
}

function urlValue(value: unknown, path: string): string {
  const result = textValue(value, path, LIMITS.url, false);
  if (!/^https?:\/\//i.test(result)) fail('invalid-data', path, 'expected an http or https URL');
  return result;
}

function arrayValue(value: unknown, path: string, max: number): unknown[] {
  if (!Array.isArray(value)) fail('invalid-data', path, 'expected an array');
  if (value.length > max) fail('invalid-data', path, `exceeds ${max} entries`);
  return value;
}

function optionalText(value: unknown, path: string, max: number): string | undefined {
  return value === undefined ? undefined : textValue(value, path, max, false);
}

function ingredientValue(value: unknown, path: string): LabIngredient {
  const item = record(value, path);
  exactKeys(item, ['id', 'name', 'amount', 'unit'], ['ingredientId', 'bottleId', 'bottleName'], path);
  const result: LabIngredient = {
    id: textValue(item.id, `${path}.id`, LIMITS.id, false),
    name: textValue(item.name, `${path}.name`, LIMITS.name),
    amount: boundedNumericText(item.amount, `${path}.amount`, LIMITS.shortText),
    unit: textValue(item.unit, `${path}.unit`, LIMITS.name),
  };
  const ingredientId = optionalText(item.ingredientId, `${path}.ingredientId`, LIMITS.id);
  const bottleId = optionalText(item.bottleId, `${path}.bottleId`, LIMITS.id);
  const bottleName = optionalText(item.bottleName, `${path}.bottleName`, LIMITS.name);
  if (ingredientId !== undefined) result.ingredientId = ingredientId;
  if (bottleId !== undefined) result.bottleId = bottleId;
  if (bottleName !== undefined) result.bottleName = bottleName;
  return result;
}

function ingredientsValue(value: unknown, path: string): LabIngredient[] {
  const seen = new Set<string>();
  return arrayValue(value, path, LIMITS.ingredients).map((item, index) => {
    const ingredient = ingredientValue(item, `${path}[${index}]`);
    if (seen.has(ingredient.id)) fail('invalid-data', `${path}[${index}].id`, 'duplicate ingredient id');
    seen.add(ingredient.id);
    return ingredient;
  });
}

function versionValue(value: unknown, path: string): LabVersion {
  const item = record(value, path);
  exactKeys(item, ['id', 'name', 'createdAt', 'updatedAt', 'ingredients', 'method', 'notes'], [], path);
  return {
    id: textValue(item.id, `${path}.id`, LIMITS.id, false),
    name: textValue(item.name, `${path}.name`, LIMITS.name),
    createdAt: dateValue(item.createdAt, `${path}.createdAt`),
    updatedAt: dateValue(item.updatedAt, `${path}.updatedAt`),
    ingredients: ingredientsValue(item.ingredients, `${path}.ingredients`),
    method: textValue(item.method, `${path}.method`, LIMITS.notes),
    notes: textValue(item.notes, `${path}.notes`, LIMITS.notes),
  };
}

function observationValue(value: unknown, path: string): LabObservation {
  const item = record(value, path);
  exactKeys(item, ['id', 'time', 'temperature', 'aroma', 'palate', 'appearance', 'notes'], [], path);
  return {
    id: textValue(item.id, `${path}.id`, LIMITS.id, false),
    time: boundedNumericText(item.time, `${path}.time`, LIMITS.shortText),
    temperature: boundedNumericText(item.temperature, `${path}.temperature`, LIMITS.shortText),
    aroma: textValue(item.aroma, `${path}.aroma`, LIMITS.notes),
    palate: textValue(item.palate, `${path}.palate`, LIMITS.notes),
    appearance: textValue(item.appearance, `${path}.appearance`, LIMITS.notes),
    notes: textValue(item.notes, `${path}.notes`, LIMITS.notes),
  };
}

function batchValue(value: unknown, path: string): LabBatch {
  const item = record(value, path);
  exactKeys(item, [
    'id', 'versionId', 'name', 'createdAt', 'updatedAt', 'versionSnapshot', 'medium', 'ratio',
    'temperature', 'startedAt', 'endedAt', 'agitation', 'filtration', 'yield', 'outcome',
    'nextStep', 'observations',
  ], [], path);
  const observations = arrayValue(item.observations, `${path}.observations`, LIMITS.observations)
    .map((entry, index) => observationValue(entry, `${path}.observations[${index}]`));
  const observationIds = new Set<string>();
  for (const observation of observations) {
    if (observationIds.has(observation.id)) fail('invalid-data', `${path}.observations`, 'duplicate observation id');
    observationIds.add(observation.id);
  }
  return {
    id: textValue(item.id, `${path}.id`, LIMITS.id, false),
    versionId: textValue(item.versionId, `${path}.versionId`, LIMITS.id, false),
    name: textValue(item.name, `${path}.name`, LIMITS.name),
    createdAt: dateValue(item.createdAt, `${path}.createdAt`),
    updatedAt: dateValue(item.updatedAt, `${path}.updatedAt`),
    versionSnapshot: versionValue(item.versionSnapshot, `${path}.versionSnapshot`),
    medium: textValue(item.medium, `${path}.medium`, LIMITS.shortText),
    ratio: boundedNumericText(item.ratio, `${path}.ratio`, LIMITS.shortText),
    temperature: boundedNumericText(item.temperature, `${path}.temperature`, LIMITS.shortText),
    startedAt: boundedNumericText(item.startedAt, `${path}.startedAt`, LIMITS.shortText),
    endedAt: boundedNumericText(item.endedAt, `${path}.endedAt`, LIMITS.shortText),
    agitation: textValue(item.agitation, `${path}.agitation`, LIMITS.notes),
    filtration: textValue(item.filtration, `${path}.filtration`, LIMITS.notes),
    yield: boundedNumericText(item.yield, `${path}.yield`, LIMITS.shortText),
    outcome: textValue(item.outcome, `${path}.outcome`, LIMITS.notes),
    nextStep: textValue(item.nextStep, `${path}.nextStep`, LIMITS.notes),
    observations,
  };
}

function sourceValue(value: unknown, path: string): LabSource {
  const item = record(value, path);
  exactKeys(item, ['cocktailId', 'versionId', 'title', 'sourceTitle', 'url', 'ingredients', 'method'], [], path);
  return {
    cocktailId: textValue(item.cocktailId, `${path}.cocktailId`, LIMITS.id, false),
    versionId: textValue(item.versionId, `${path}.versionId`, LIMITS.id, false),
    title: textValue(item.title, `${path}.title`, LIMITS.name, false),
    sourceTitle: textValue(item.sourceTitle, `${path}.sourceTitle`, LIMITS.shortText, false),
    url: urlValue(item.url, `${path}.url`),
    ingredients: ingredientsValue(item.ingredients, `${path}.ingredients`),
    method: textValue(item.method, `${path}.method`, LIMITS.notes),
  };
}

function projectValue(value: unknown, path: string): LabProject {
  const item = record(value, path);
  exactKeys(item, ['id', 'name', 'goal', 'createdAt', 'updatedAt', 'versions', 'batches'], ['source'], path);
  const versions = arrayValue(item.versions, `${path}.versions`, LIMITS.versions)
    .map((entry, index) => versionValue(entry, `${path}.versions[${index}]`));
  if (versions.length === 0) fail('invalid-data', `${path}.versions`, 'at least one version is required');
  const versionIds = new Set<string>();
  for (const version of versions) {
    if (versionIds.has(version.id)) fail('invalid-data', `${path}.versions`, 'duplicate version id');
    versionIds.add(version.id);
  }
  const batches = arrayValue(item.batches, `${path}.batches`, LIMITS.batches)
    .map((entry, index) => batchValue(entry, `${path}.batches[${index}]`));
  const batchIds = new Set<string>();
  for (const batch of batches) {
    if (batchIds.has(batch.id)) fail('invalid-data', `${path}.batches`, 'duplicate batch id');
    if (!versionIds.has(batch.versionId)) fail('invalid-data', `${path}.batches`, `unknown version ${batch.versionId}`);
    if (batch.versionSnapshot.id !== batch.versionId) fail('invalid-data', `${path}.batches`, 'snapshot id does not match versionId');
    batchIds.add(batch.id);
  }
  const project: LabProject = {
    id: textValue(item.id, `${path}.id`, LIMITS.id, false),
    name: textValue(item.name, `${path}.name`, LIMITS.name),
    goal: textValue(item.goal, `${path}.goal`, LIMITS.notes),
    createdAt: dateValue(item.createdAt, `${path}.createdAt`),
    updatedAt: dateValue(item.updatedAt, `${path}.updatedAt`),
    versions,
    batches,
  };
  if (item.source !== undefined) project.source = sourceValue(item.source, `${path}.source`);
  return project;
}

function backupValue(value: unknown): LabBackup {
  rejectDangerousKeys(value);
  const item = record(value, 'backup');
  exactKeys(item, ['format', 'schemaVersion', 'exportedAt', 'projects'], [], 'backup');
  if (item.format !== 'glass-notes-lab') fail('invalid-format', 'backup.format', 'expected glass-notes-lab');
  if (item.schemaVersion !== 1) fail('unsupported-version', 'backup.schemaVersion', 'only schema version 1 is supported');
  const projects = arrayValue(item.projects, 'backup.projects', LIMITS.projects)
    .map((entry, index) => projectValue(entry, `backup.projects[${index}]`));
  const ids = new Set<string>();
  for (const project of projects) {
    if (ids.has(project.id)) fail('invalid-data', 'backup.projects', 'duplicate project id');
    ids.add(project.id);
  }
  return {format: 'glass-notes-lab', schemaVersion: 1, exportedAt: dateValue(item.exportedAt, 'backup.exportedAt'), projects};
}

export function parseLabBackup(raw: string): LabBackup {
  if (typeof raw !== 'string') throw new LabBackupError('invalid-json', 'backup: expected JSON text');
  if (utf8ByteLength(raw) > LIMITS.rawBytes) throw new LabBackupError('invalid-data', `backup: exceeds ${LIMITS.rawBytes} UTF-8 bytes`);
  let value: unknown;
  try { value = JSON.parse(raw); }
  catch { throw new LabBackupError('invalid-json', 'backup: invalid JSON'); }
  return backupValue(value);
}

export function exportLabBackup(projects: LabProject[]): string {
  const candidate: LabBackup = {
    format: 'glass-notes-lab',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    projects,
  };
  const raw = JSON.stringify(backupValue(candidate), null, 2);
  if (utf8ByteLength(raw) > LIMITS.rawBytes) throw new LabBackupError('invalid-data', `backup: exceeds ${LIMITS.rawBytes} UTF-8 bytes`);
  return raw;
}

function md(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/([#|!*_`[\]<>])/g, '\\$1');
}

function inlineMd(value: string): string { return md(value).replace(/\r?\n/g, ' '); }

function lines(value: string): string[] {
  return value.length ? value.split(/\r?\n/).map(line => md(line)) : ['—'];
}

export function exportLabMarkdown(projects: LabProject[]): string {
  const checked = backupValue({format: 'glass-notes-lab', schemaVersion: 1, exportedAt: new Date().toISOString(), projects});
  const output = ['# Glass Notes Lab', '', `Exported: ${checked.exportedAt}`, ''];
  for (const project of checked.projects) {
    output.push(`## ${inlineMd(project.name)}`, '', `Goal: ${inlineMd(project.goal) || '—'}`, '');
    if (project.source) output.push(`Source: ${inlineMd(project.source.title)} — ${inlineMd(project.source.sourceTitle)} (${project.source.url})`, '');
    for (const version of project.versions) {
      output.push(`### ${inlineMd(version.name)}`, '', 'Ingredients:', '');
      for (const ingredient of version.ingredients) output.push(`- ${inlineMd(ingredient.amount)} ${inlineMd(ingredient.unit)} ${inlineMd(ingredient.name)}`.trim());
      if (!version.ingredients.length) output.push('- —');
      output.push('', 'Method:', '', ...lines(version.method), '', 'Notes:', '', ...lines(version.notes), '');
    }
    for (const batch of project.batches) {
      output.push(`### Batch: ${inlineMd(batch.name)}`, '', `Recipe snapshot: ${inlineMd(batch.versionSnapshot.name)}`, '',
        `Medium: ${inlineMd(batch.medium) || '—'}`, `Ratio: ${inlineMd(batch.ratio) || '—'}`, `Temperature: ${inlineMd(batch.temperature) || '—'}`,
        `Started: ${inlineMd(batch.startedAt) || '—'}`, `Ended: ${inlineMd(batch.endedAt) || '—'}`, `Agitation: ${inlineMd(batch.agitation) || '—'}`,
        `Filtration: ${inlineMd(batch.filtration) || '—'}`, `Yield: ${inlineMd(batch.yield) || '—'}`, '', 'Outcome:', '', ...lines(batch.outcome),
        '', 'Next step:', '', ...lines(batch.nextStep), '');
      if (batch.observations.length) {
        output.push('Observations:', '');
        for (const observation of batch.observations) output.push(
          `- ${inlineMd(observation.time) || 'Time —'}; ${inlineMd(observation.temperature) || 'temperature —'}`,
          `  - Aroma: ${md(observation.aroma) || '—'}`,
          `  - Palate: ${md(observation.palate) || '—'}`,
          `  - Appearance: ${md(observation.appearance) || '—'}`,
          `  - Notes: ${md(observation.notes) || '—'}`,
        );
        output.push('');
      }
    }
  }
  return `${output.join('\n').trimEnd()}\n`;
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
  }
  return value;
}

function now(): string { return new Date().toISOString(); }

let idCounter = 0;
function generatedId(prefix: string): string {
  idCounter = (idCounter + 1) % 1_000_000;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function cloneIngredient(item: LabIngredient): LabIngredient { return {...item}; }
function cloneVersion(item: LabVersion): LabVersion { return {...item, ingredients: item.ingredients.map(cloneIngredient)}; }
function cloneObservation(item: LabObservation): LabObservation { return {...item}; }
function cloneBatch(item: LabBatch): LabBatch {
  return {...item, versionSnapshot: cloneVersion(item.versionSnapshot), observations: item.observations.map(cloneObservation)};
}
function cloneSource(item: LabSource): LabSource { return {...item, ingredients: item.ingredients.map(cloneIngredient)}; }
function cloneProject(item: LabProject): LabProject {
  return {...item, source: item.source ? cloneSource(item.source) : undefined,
    versions: item.versions.map(cloneVersion), batches: item.batches.map(cloneBatch)};
}

function validateProject(project: LabProject): LabProject {
  return projectValue(project, 'project');
}

export class LabStore {
  private snapshot: LabSnapshot = freeze({projects: [], hydrated: false, storageAvailable: true, saving: false});
  private readonly listeners = new Set<() => void>();
  private saveCycle: Promise<void> | null = null;
  private pendingRaw: string | null = null;
  private loading: Promise<void> | null = null;

  constructor(private readonly storage: LabStorage) {}

  getSnapshot = (): LabSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private publish(next: LabSnapshot): void {
    this.snapshot = freeze(next);
    this.listeners.forEach(listener => listener());
  }

  load = async (): Promise<void> => {
    if (this.snapshot.hydrated) return;
    if (this.loading) return this.loading;
    this.loading = (async () => {
      try {
        const raw = await this.storage.getItem(LAB_STORAGE_KEY);
        const projects = raw === null ? [] : parseLabBackup(raw).projects;
        this.publish({projects, hydrated: true, storageAvailable: true, saving: false});
      } catch (error) {
        const invalid = error instanceof LabBackupError;
        this.publish({projects: this.snapshot.projects, hydrated: false, storageAvailable: invalid,
          error: invalid ? 'invalid-data' : 'read', saving: false});
      } finally {
        this.loading = null;
      }
    })();
    return this.loading;
  };

  private ready(): void {
    if (!this.snapshot.hydrated) throw new LabMutationError('not-ready', 'Lab data must load successfully before it can be changed.');
  }

  private replace(projects: LabProject[]): void {
    this.ready();
    const raw = exportLabBackup(projects);
    this.publish({projects, hydrated: true, storageAvailable: this.snapshot.storageAvailable, saving: true,
      ...(this.snapshot.error === 'write' ? {error: this.snapshot.error} : {})});
    this.queueSave(raw);
  }

  private queueSave(raw: string): void {
    this.pendingRaw = raw;
    if (this.saveCycle) return;
    if (!this.snapshot.saving) this.publish({...this.snapshot, saving: true});
    this.saveCycle = this.runSaveCycle();
  }

  private async runSaveCycle(): Promise<void> {
    let succeeded = true;
    while (this.pendingRaw !== null) {
      const raw = this.pendingRaw;
      this.pendingRaw = null;
      try { await this.storage.setItem(LAB_STORAGE_KEY, raw); succeeded = true; }
      catch { succeeded = false; }
    }
    this.saveCycle = null;
    this.publish({projects: this.snapshot.projects, hydrated: true, storageAvailable: succeeded, saving: false,
      ...(succeeded ? {} : {error: 'write' as const})});
  }

  private locateProject(id: string): {project: LabProject; index: number} {
    const index = this.snapshot.projects.findIndex(item => item.id === id);
    const project = this.snapshot.projects[index];
    if (index < 0 || !project) throw new LabMutationError('not-found', `Project ${id} was not found.`);
    return {project, index};
  }

  private updateProjectAt(index: number, project: LabProject): void {
    const projects = [...this.snapshot.projects];
    projects[index] = freeze(validateProject(project));
    this.replace(projects);
  }

  createProject = ({name, goal = '', source}: {name: string; goal?: string; source?: LabSource}): string => {
    this.ready();
    const timestamp = now();
    const id = generatedId('project');
    const version: LabVersion = {
      id: generatedId('version'), name: 'v1', createdAt: timestamp, updatedAt: timestamp,
      ingredients: source ? source.ingredients.map(cloneIngredient) : [], method: source?.method ?? '', notes: '',
    };
    const project = validateProject({id, name, goal, createdAt: timestamp, updatedAt: timestamp,
      ...(source ? {source: cloneSource(source)} : {}), versions: [version], batches: []});
    this.replace([...this.snapshot.projects, freeze(project)]);
    return id;
  };

  createComparisonProject = (draft: BottleComparisonProjectDraft): string => {
    this.ready();
    if(!draft.name.trim()||draft.versions.length<2||draft.versions.length>3){
      throw new LabMutationError('invalid-change','A bottle comparison requires a name and two or three versions.');
    }
    const bottleIds=new Set<string>();
    for(const version of draft.versions){
      if(!version.bottleId.trim()||bottleIds.has(version.bottleId)||!version.name.trim()
        ||!version.ingredients.some(ingredient=>ingredient.bottleId===version.bottleId)){
        throw new LabMutationError('invalid-change','Each comparison version must use one unique selected bottle.');
      }
      bottleIds.add(version.bottleId);
    }
    const timestamp=now();
    const id=generatedId('project');
    const versions:LabVersion[]=draft.versions.map(version=>({
      id:generatedId('version'),name:version.name,createdAt:timestamp,updatedAt:timestamp,
      ingredients:version.ingredients.map(ingredient=>({...ingredient,id:generatedId('ingredient')})),
      method:version.method,notes:version.notes,
    }));
    const project=validateProject({id,name:draft.name,goal:draft.goal,createdAt:timestamp,updatedAt:timestamp,
      ...(draft.source?{source:cloneSource(draft.source)}:{}),versions,batches:[]});
    this.replace([...this.snapshot.projects,freeze(project)]);
    return id;
  };

  updateProject = (id: string, change: {name?: string; goal?: string}): void => {
    this.ready();
    const {project, index} = this.locateProject(id);
    this.updateProjectAt(index, {...project, ...change, updatedAt: now()});
  };

  deleteProject = (id: string): void => {
    this.ready();
    this.locateProject(id);
    this.replace(this.snapshot.projects.filter(project => project.id !== id));
  };

  addVersion = (projectId: string, fromVersionId?: string): string => {
    this.ready();
    const {project, index} = this.locateProject(projectId);
    const source = fromVersionId === undefined ? undefined : project.versions.find(version => version.id === fromVersionId);
    if (fromVersionId !== undefined && !source) throw new LabMutationError('not-found', `Version ${fromVersionId} was not found.`);
    const timestamp = now();
    const version: LabVersion = {
      id: generatedId('version'), name: `v${project.versions.length + 1}`, createdAt: timestamp, updatedAt: timestamp,
      ingredients: source?.ingredients.map(item => ({...item, id: generatedId('ingredient')})) ?? [],
      method: source?.method ?? '', notes: source?.notes ?? '',
    };
    this.updateProjectAt(index, {...project, versions: [...project.versions, version], updatedAt: timestamp});
    return version.id;
  };

  updateVersion = (projectId: string, versionId: string,
    change: Partial<Pick<LabVersion, 'name' | 'ingredients' | 'method' | 'notes'>>): void => {
    this.ready();
    const {project, index} = this.locateProject(projectId);
    const versionIndex = project.versions.findIndex(version => version.id === versionId);
    const version = project.versions[versionIndex];
    if (versionIndex < 0 || !version) throw new LabMutationError('not-found', `Version ${versionId} was not found.`);
    const timestamp = now();
    const next = {...version, ...change,
      ...(change.ingredients ? {ingredients: change.ingredients.map(cloneIngredient)} : {}), updatedAt: timestamp};
    const versions = [...project.versions];
    versions[versionIndex] = next;
    this.updateProjectAt(index, {...project, versions, updatedAt: timestamp});
  };

  deleteVersion = (projectId: string, versionId: string): void => {
    this.ready();
    const {project, index} = this.locateProject(projectId);
    if (!project.versions.some(version => version.id === versionId)) throw new LabMutationError('not-found', `Version ${versionId} was not found.`);
    if (project.versions.length === 1) throw new LabMutationError('last-version', 'A project must keep at least one version.');
    if (project.batches.some(batch => batch.versionId === versionId)) {
      throw new LabMutationError('version-in-use', 'Delete the batches linked to this version before deleting it.');
    }
    const timestamp = now();
    this.updateProjectAt(index, {...project, versions: project.versions.filter(version => version.id !== versionId), updatedAt: timestamp});
  };

  addBatch = (projectId: string, versionId: string): string => {
    this.ready();
    const {project, index} = this.locateProject(projectId);
    const version = project.versions.find(item => item.id === versionId);
    if (!version) throw new LabMutationError('not-found', `Version ${versionId} was not found.`);
    const timestamp = now();
    const batch: LabBatch = {
      id: generatedId('batch'), versionId, name: `Batch ${project.batches.length + 1}`, createdAt: timestamp, updatedAt: timestamp,
      versionSnapshot: cloneVersion(version), medium: '', ratio: '', temperature: '', startedAt: '', endedAt: '',
      agitation: '', filtration: '', yield: '', outcome: '', nextStep: '', observations: [],
    };
    this.updateProjectAt(index, {...project, batches: [...project.batches, batch], updatedAt: timestamp});
    return batch.id;
  };

  updateBatch = (projectId: string, batchId: string,
    change: Partial<Omit<LabBatch, 'id' | 'createdAt' | 'versionId' | 'versionSnapshot'>>): void => {
    this.ready();
    const {project, index} = this.locateProject(projectId);
    const batchIndex = project.batches.findIndex(batch => batch.id === batchId);
    const batch = project.batches[batchIndex];
    if (batchIndex < 0 || !batch) throw new LabMutationError('not-found', `Batch ${batchId} was not found.`);
    const timestamp = now();
    const next: LabBatch = {...batch, ...change,
      ...(change.observations ? {observations: change.observations.map(cloneObservation)} : {}), updatedAt: timestamp};
    const batches = [...project.batches];
    batches[batchIndex] = next;
    this.updateProjectAt(index, {...project, batches, updatedAt: timestamp});
  };

  deleteBatch = (projectId: string, batchId: string): void => {
    this.ready();
    const {project, index} = this.locateProject(projectId);
    if (!project.batches.some(batch => batch.id === batchId)) throw new LabMutationError('not-found', `Batch ${batchId} was not found.`);
    const timestamp = now();
    this.updateProjectAt(index, {...project, batches: project.batches.filter(batch => batch.id !== batchId), updatedAt: timestamp});
  };

  importBackup = (backup: LabBackup): void => {
    this.ready();
    // Revalidate the entire object before changing any state. Unknown fields are rejected so a newer schema is never truncated.
    const incoming = backupValue(backup);
    const used = new Set<string>();
    const collect = (project: LabProject) => {
      used.add(project.id);
      project.versions.forEach(version => { used.add(version.id); version.ingredients.forEach(item => used.add(item.id)); });
      project.batches.forEach(batch => { used.add(batch.id); batch.observations.forEach(item => used.add(item.id)); });
    };
    this.snapshot.projects.forEach(collect);
    const claim = (requested: string, prefix: string): string => {
      let id = requested;
      while (used.has(id)) id = generatedId(prefix);
      used.add(id);
      return id;
    };
    const imported = incoming.projects.map(original => {
      const versionIds = new Map<string, string>();
      const ingredientIds = new Map<string, Map<string, string>>();
      const versions = original.versions.map(version => {
        const id = claim(version.id, 'version');
        versionIds.set(version.id, id);
        const rows = new Map<string, string>();
        const ingredients = version.ingredients.map(ingredient => {
          const ingredientId = claim(ingredient.id, 'ingredient');
          rows.set(ingredient.id, ingredientId);
          return {...ingredient, id: ingredientId};
        });
        ingredientIds.set(version.id, rows);
        return {...version, id, ingredients};
      });
      const batches = original.batches.map(batch => {
        const mappedVersionId = versionIds.get(batch.versionId);
        if (!mappedVersionId) throw new LabMutationError('invalid-change', `Backup batch ${batch.id} has no matching version.`);
        const rowIds = ingredientIds.get(batch.versionId);
        return {...batch, id: claim(batch.id, 'batch'), versionId: mappedVersionId,
          versionSnapshot: {...cloneVersion(batch.versionSnapshot), id: mappedVersionId,
            ingredients: batch.versionSnapshot.ingredients.map(item => ({...item, id: rowIds?.get(item.id) ?? claim(item.id, 'ingredient')}))},
          observations: batch.observations.map(item => ({...item, id: claim(item.id, 'observation')}))};
      });
      return validateProject({...cloneProject(original), id: claim(original.id, 'project'), versions, batches});
    });
    this.replace([...this.snapshot.projects, ...imported.map(project => freeze(project))]);
  };

  retrySave = async (): Promise<boolean> => {
    this.ready();
    this.publish({...this.snapshot, saving: true});
    this.queueSave(exportLabBackup(this.snapshot.projects));
    await this.whenSaved();
    return this.saveStatus();
  };

  saveStatus = (): boolean => this.snapshot.saving !== true && this.snapshot.hydrated
    && this.snapshot.storageAvailable && this.snapshot.error !== 'write';

  whenSaved = async (): Promise<void> => {
    while (this.saveCycle) await this.saveCycle;
  };
}
