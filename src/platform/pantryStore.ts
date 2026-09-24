import {emptyPantry, type Pantry} from '../domain/ingredients';
import type {LocalKeyValueStorage} from './desktop-contract';

export interface PantrySnapshot {
  pantry: Pantry;
  hydrated: boolean;
  storageAvailable: boolean;
  error?: 'read' | 'write';
}

type PantryChange = (value: Pantry) => Pantry;

/** Accepts the original ingredient-only envelope and the current brand map. */
export function validateStoredPantry(raw: string | null): void {
  if (raw === null) return;
  let value: unknown;
  try { value = JSON.parse(raw); }
  catch { throw new Error('invalid-pantry-storage'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid-pantry-storage');
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.ingredientIds) || record.ingredientIds.some(id => typeof id !== 'string')) {
    throw new Error('invalid-pantry-storage');
  }
  if (record.brandsByIngredient === undefined) return;
  if (!record.brandsByIngredient || typeof record.brandsByIngredient !== 'object' || Array.isArray(record.brandsByIngredient)) {
    throw new Error('invalid-pantry-storage');
  }
  for (const brands of Object.values(record.brandsByIngredient as Record<string, unknown>)) {
    if (!Array.isArray(brands) || brands.some(id => typeof id !== 'string')) throw new Error('invalid-pantry-storage');
  }
}

/** Keeps edits as intent until the unread stored pantry has been recovered. */
export class PantryStore {
  private snapshot: PantrySnapshot = {
    pantry: emptyPantry(),
    hydrated: false,
    storageAvailable: true,
  };
  private listeners = new Set<() => void>();
  private pending: PantryChange[] = [];
  private loading?: Promise<void>;
  private hasLoaded = false;
  private writes: Promise<void> = Promise.resolve();

  constructor(
    private readonly storage: LocalKeyValueStorage,
    private readonly storageKey: string,
    private readonly parse: (raw: string | null) => Pantry,
  ) {}

  getSnapshot = (): PantrySnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private update(snapshot: PantrySnapshot): void {
    this.snapshot = snapshot;
    this.listeners.forEach(listener => listener());
  }

  load = (): Promise<void> => {
    if (this.loading) return this.loading;
    if (this.hasLoaded) return Promise.resolve();
    this.loading = (async () => {
      let pantry: Pantry;
      try {
        const raw = await this.storage.getItem(this.storageKey);
        validateStoredPantry(raw);
        pantry = this.parse(raw);
      } catch {
        this.update({...this.snapshot, hydrated: false, storageAvailable: false, error: 'read'});
        return;
      }

      const changed = this.pending.length > 0;
      for (const update of this.pending) pantry = update(pantry);
      this.pending = [];
      this.hasLoaded = true;
      this.update({pantry, hydrated: true, storageAvailable: true});
      if (changed) this.persist(pantry);
    })().finally(() => { this.loading = undefined; });
    return this.loading;
  };

  change = (update: PantryChange): void => {
    if (!this.hasLoaded) this.pending.push(update);
    const pantry = update(this.snapshot.pantry);
    this.update({...this.snapshot, pantry});
    if (this.hasLoaded) this.persist(pantry);
  };

  private persist(pantry: Pantry): void {
    const raw = JSON.stringify(pantry);
    this.writes = this.writes.catch(() => undefined)
      .then(() => this.storage.setItem(this.storageKey, raw))
      .then(() => this.update({pantry: this.snapshot.pantry, hydrated: true, storageAvailable: true}))
      .catch(() => this.update({...this.snapshot, hydrated: true, storageAvailable: false, error: 'write'}));
  }

  retry = async (): Promise<boolean> => {
    if (!this.hasLoaded) {
      await this.load();
      return this.hasLoaded;
    }
    this.persist(this.snapshot.pantry);
    await this.writes;
    return this.snapshot.storageAvailable;
  };

  whenSaved = (): Promise<void> => this.writes;
}
