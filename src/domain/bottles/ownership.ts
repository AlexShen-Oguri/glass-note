export interface BottleStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface OwnedBottles {
  ids: readonly string[];
  hydrated: boolean;
  error?: 'read' | 'write';
}

export const BOTTLE_STORAGE_KEY = 'glass-notes.owned-bottles.v1';

const MAX_RAW_LENGTH = 1_000_000;
const MAX_IDS = 5_000;
const MAX_ID_LENGTH = 200;

function parseStored(raw: string | null): string[] {
  if (raw === null) return [];
  if (raw.length > MAX_RAW_LENGTH) throw new Error('owned-bottles-too-large');
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid-owned-bottles');
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some(key => key !== 'schemaVersion' && key !== 'ids')
    || record.schemaVersion !== 1 || !Array.isArray(record.ids) || record.ids.length > MAX_IDS) {
    throw new Error('invalid-owned-bottles');
  }
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const id of record.ids) {
    if (typeof id !== 'string' || id.length === 0 || id.length > MAX_ID_LENGTH) throw new Error('invalid-owned-bottles');
    if (!seen.has(id)) { seen.add(id); ids.push(id); }
  }
  return ids;
}

function frozenSnapshot(ids: readonly string[], error?: OwnedBottles['error']): OwnedBottles {
  const snapshot: OwnedBottles = {ids: Object.freeze([...ids]), hydrated: true};
  if (error) snapshot.error = error;
  return Object.freeze(snapshot);
}

export class BottleOwnershipStore {
  private snapshot: OwnedBottles = Object.freeze({ids: Object.freeze([]), hydrated: false});
  private readonly listeners = new Set<() => void>();
  private preservedUnknownIds: string[] = [];
  private queue: Promise<void> = Promise.resolve();
  private loading: Promise<void> | null = null;

  constructor(private readonly allowed: Set<string>, private readonly storage: BottleStorage) {}

  getSnapshot = (): OwnedBottles => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private emit(snapshot: OwnedBottles): void {
    this.snapshot = snapshot;
    this.listeners.forEach(listener => listener());
  }

  load = (): Promise<void> => {
    if (this.snapshot.hydrated) return Promise.resolve();
    if (this.loading) return this.loading;
    this.loading = (async () => {
      try {
        const storedIds = parseStored(await this.storage.getItem(BOTTLE_STORAGE_KEY));
        this.preservedUnknownIds = storedIds.filter(id => !this.allowed.has(id));
        this.emit(frozenSnapshot(storedIds.filter(id => this.allowed.has(id))));
      } catch {
        this.emit(Object.freeze({ids: Object.freeze([]), hydrated: false, error: 'read'}));
      } finally {
        this.loading = null;
      }
    })();
    return this.loading;
  };

  private serialized(knownIds: readonly string[] = this.snapshot.ids): string {
    const ids = [...new Set([...knownIds, ...this.preservedUnknownIds])];
    if (ids.length > MAX_IDS) throw new Error('owned-bottles-too-large');
    for (const id of ids) if (id.length === 0 || id.length > MAX_ID_LENGTH) throw new Error('invalid-owned-bottle-id');
    const raw = JSON.stringify({schemaVersion: 1, ids});
    if (raw.length > MAX_RAW_LENGTH) throw new Error('owned-bottles-too-large');
    return raw;
  }

  private save(raw: string): Promise<boolean> {
    const attempt = this.queue.catch(() => undefined).then(() => this.storage.setItem(BOTTLE_STORAGE_KEY, raw));
    const result = attempt.then(
      () => { this.emit(frozenSnapshot(this.snapshot.ids)); return true; },
      () => { this.emit(frozenSnapshot(this.snapshot.ids, 'write')); return false; },
    );
    this.queue = result.then(() => undefined);
    return result;
  }

  toggle = (id: string): void => {
    if (!this.snapshot.hydrated || !this.allowed.has(id)) return;
    const ids = this.snapshot.ids.includes(id)
      ? this.snapshot.ids.filter(item => item !== id)
      : [...this.snapshot.ids, id];
    let raw: string;
    try { raw = this.serialized(ids); }
    catch { this.emit(frozenSnapshot(this.snapshot.ids, 'write')); return; }
    this.emit(frozenSnapshot(ids, this.snapshot.error));
    void this.save(raw);
  };

  retrySave = async (): Promise<boolean> => {
    if (!this.snapshot.hydrated) return false;
    try { return this.save(this.serialized()); }
    catch { this.emit(frozenSnapshot(this.snapshot.ids, 'write')); return false; }
  };

  whenSaved = (): Promise<void> => this.queue;
}
