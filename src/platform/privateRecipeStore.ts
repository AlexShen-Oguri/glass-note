import {
  PRIVATE_RECIPES_STORAGE_KEY,
  PrivateRecipeValidationError,
  activePrivateRecipeRevision,
  parsePrivateRecipeBook,
  serializePrivateRecipeBook,
  validatePrivateRecipeBook,
} from '../domain/private-recipes';
import type {PrivateRecipe, PrivateRecipeContent, PrivateRecipeOrigin} from '../domain/private-recipes/types';
import type {LocalKeyValueStorage} from './desktop-contract';

export interface PrivateRecipeSnapshot {
  recipes: PrivateRecipe[];
  hydrated: boolean;
  storageAvailable: boolean;
  saving: boolean;
  error?: 'read' | 'write' | 'invalid-data';
}

export class PrivateRecipeMutationError extends Error {
  constructor(readonly code: 'not-ready' | 'not-found' | 'no-change', message: string) {
    super(message);
    this.name = 'PrivateRecipeMutationError';
  }
}

export class PrivateRecipePersistenceError extends Error {
  constructor() {
    super('Private recipe changes are available in this session but were not saved.');
    this.name = 'PrivateRecipePersistenceError';
  }
}

interface StoreOptions {
  now?: () => string;
  id?: (kind: 'recipe' | 'revision') => string;
}

const defaultId = (kind: 'recipe' | 'revision') => `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export class PrivateRecipeStore {
  private snapshot: PrivateRecipeSnapshot = {recipes: [], hydrated: false, storageAvailable: true, saving: false};
  private readonly listeners = new Set<() => void>();
  private loading: Promise<void> | null = null;
  private loaded = false;
  private saveCycle: Promise<void> | null = null;
  private pendingRaw: string | null = null;
  private readonly now: () => string;
  private readonly id: (kind: 'recipe' | 'revision') => string;

  constructor(private readonly storage: LocalKeyValueStorage, options: StoreOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.id = options.id ?? defaultId;
  }

  getSnapshot = (): PrivateRecipeSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private publish(snapshot: PrivateRecipeSnapshot): void {
    this.snapshot = snapshot;
    this.listeners.forEach(listener => listener());
  }

  load = (): Promise<void> => {
    if (this.loaded) return Promise.resolve();
    if (this.loading) return this.loading;
    this.loading = (async () => {
      try {
        const book = parsePrivateRecipeBook(await this.storage.getItem(PRIVATE_RECIPES_STORAGE_KEY));
        this.loaded = true;
        this.publish({recipes: book.recipes, hydrated: true, storageAvailable: true, saving: false});
      } catch (error) {
        this.publish({recipes: this.snapshot.recipes, hydrated: false,
          storageAvailable: error instanceof PrivateRecipeValidationError, saving: false,
          error: error instanceof PrivateRecipeValidationError ? 'invalid-data' : 'read'});
      }
    })().finally(() => { this.loading = null; });
    return this.loading;
  };

  private ready(): void {
    if (!this.loaded || !this.snapshot.hydrated) throw new PrivateRecipeMutationError('not-ready', 'Private recipes must load before editing.');
  }

  private replace(recipes: PrivateRecipe[]): void {
    this.ready();
    const book = validatePrivateRecipeBook({format: 'glass-notes-private-recipes', schemaVersion: 2, recipes});
    const raw = serializePrivateRecipeBook(book);
    this.publish({recipes: book.recipes, hydrated: true, storageAvailable: this.snapshot.storageAvailable, saving: true,
      ...(this.snapshot.error === 'write' ? {error: 'write' as const} : {})});
    this.queueSave(raw);
  }

  private queueSave(raw: string): void {
    this.pendingRaw = raw;
    if (this.saveCycle) return;
    this.saveCycle = this.runSaveCycle();
  }

  private async runSaveCycle(): Promise<void> {
    let succeeded = true;
    while (this.pendingRaw !== null) {
      const raw = this.pendingRaw;
      this.pendingRaw = null;
      try { await this.storage.setItem(PRIVATE_RECIPES_STORAGE_KEY, raw); if(await this.storage.getItem(PRIVATE_RECIPES_STORAGE_KEY)!==raw)throw Error('private-recipe-readback-failed'); succeeded = true; }
      catch { succeeded = false; }
    }
    this.saveCycle = null;
    this.publish({recipes: this.snapshot.recipes, hydrated: true, storageAvailable: succeeded, saving: false,
      ...(succeeded ? {} : {error: 'write' as const})});
  }

  create = ({origin, content}: {origin: PrivateRecipeOrigin; content: PrivateRecipeContent}): string => {
    this.ready();
    const createdAt = this.now();
    const recipeId = this.id('recipe');
    const revisionId = this.id('revision');
    const recipe: PrivateRecipe = {
      id: recipeId,
      private: true,
      createdAt,
      updatedAt: createdAt,
      origin,
      activeRevisionId: revisionId,
      revisions: [{id: revisionId, createdAt, content}],
    };
    this.replace([...this.snapshot.recipes, recipe]);
    return recipeId;
  };

  createOriginal = (content: PrivateRecipeContent): string => this.create({origin: {kind: 'original'}, content});

  saveRevision = (recipeId: string, content: PrivateRecipeContent, derivedFromRevisionId?: string): string => {
    this.ready();
    const index = this.snapshot.recipes.findIndex(item => item.id === recipeId);
    const recipe = this.snapshot.recipes[index];
    if (!recipe) throw new PrivateRecipeMutationError('not-found', `Private recipe ${recipeId} was not found.`);
    const active = activePrivateRecipeRevision(recipe);
    if (JSON.stringify(active.content) === JSON.stringify(content)) throw new PrivateRecipeMutationError('no-change', 'The recipe has no changes.');
    const derivedFrom = derivedFromRevisionId === undefined
      ? active
      : recipe.revisions.find(revision => revision.id === derivedFromRevisionId);
    if (!derivedFrom) throw new PrivateRecipeMutationError('not-found', `Private recipe revision ${derivedFromRevisionId} was not found.`);
    const createdAt = this.now();
    const revisionId = this.id('revision');
    const next: PrivateRecipe = {...recipe, updatedAt: createdAt, activeRevisionId: revisionId,
      revisions: [...recipe.revisions, {id: revisionId, createdAt, derivedFromRevisionId: derivedFrom.id, content}]};
    const recipes = [...this.snapshot.recipes];
    recipes[index] = next;
    this.replace(recipes);
    return revisionId;
  };

  delete = (recipeId: string): void => {
    this.ready();
    if (!this.snapshot.recipes.some(item => item.id === recipeId)) throw new PrivateRecipeMutationError('not-found', `Private recipe ${recipeId} was not found.`);
    this.replace(this.snapshot.recipes.filter(item => item.id !== recipeId));
  };

  retry = async (): Promise<boolean> => {
    if (!this.loaded) {
      await this.load();
      return this.snapshot.hydrated && this.snapshot.storageAvailable;
    }
    this.queueSave(serializePrivateRecipeBook({format: 'glass-notes-private-recipes', schemaVersion: 2, recipes: this.snapshot.recipes}));
    await this.whenSaved();
    return this.snapshot.storageAvailable && !this.snapshot.error;
  };

  whenSaved = async (): Promise<boolean> => {
    while (this.saveCycle) await this.saveCycle;
    return this.snapshot.hydrated && this.snapshot.storageAvailable && !this.snapshot.saving && !this.snapshot.error;
  };
}
