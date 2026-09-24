export interface LabIngredient {
  id: string; name: string; amount: string; unit: string;
  ingredientId?: string; bottleId?: string; bottleName?: string;
}
export interface LabVersion {
  id: string; name: string; createdAt: string; updatedAt: string;
  ingredients: LabIngredient[]; method: string; notes: string;
}
export interface LabObservation {
  id: string; time: string; temperature: string; aroma: string; palate: string; appearance: string; notes: string;
}
export interface LabBatch {
  id: string; versionId: string; name: string; createdAt: string; updatedAt: string;
  /** Preserve the exact version used; later recipe edits must not rewrite an experiment. */
  versionSnapshot: LabVersion;
  medium: string; ratio: string; temperature: string; startedAt: string; endedAt: string;
  agitation: string; filtration: string; yield: string; outcome: string; nextStep: string;
  observations: LabObservation[];
}
export interface LabSource {
  cocktailId: string; versionId: string; title: string; sourceTitle: string; url: string;
  ingredients: LabIngredient[]; method: string;
}
export interface LabProject {
  id: string; name: string; goal: string; createdAt: string; updatedAt: string;
  source?: LabSource; versions: LabVersion[]; batches: LabBatch[];
}
export interface LabBackup { format: 'glass-notes-lab'; schemaVersion: 1; exportedAt: string; projects: LabProject[] }
export interface LabSnapshot {
  projects: LabProject[]; hydrated: boolean; storageAvailable: boolean;
  error?: 'read' | 'write' | 'invalid-data'; saving?: boolean;
}
