import type {Preferences} from '../../platform/preferences';
import type {LabBackup} from '../lab/types';
import type {PrivateRecipeBook} from '../private-recipes/types';
import type {TasteState} from '../taste/types';
import type {MakingState} from '../making/types';
import type {FavoriteList} from '../favorites';

export const BACKUP_LIMIT = 5_000_000;
export const BACKUP_SECTIONS = ['preferences','favorites','pantry','bottles','lab','privateRecipes','making','taste'] as const;
export type BackupSection = typeof BACKUP_SECTIONS[number];
export type FavoritesBackupSection =
  | {schemaVersion:1; versionIds:string[]}
  | {schemaVersion:2; versionIds:string[]; lists:FavoriteList[]};
export interface BackupSections {
  preferences:{schemaVersion:1; value:Preferences};
  favorites:FavoritesBackupSection;
  pantry:{schemaVersion:1; ingredientIds:string[]; brandsByIngredient:Record<string,string[]>};
  bottles:{schemaVersion:1; ids:string[]};
  lab:LabBackup;
  privateRecipes:PrivateRecipeBook;
  /** Absent only in an older backup: never interpret absence as an empty replacement. */
  making?:MakingState;
  taste?:TasteState;
}
export type ReferenceKind = 'ingredient'|'brand'|'bottle'|'recipeVersion'|'source';
export interface BackupReference {
  kind:ReferenceKind; id:string; name:string;
  ingredientId?:string; cocktailId?:string; sourceId?:string; sourceTitle?:string; sourceUrl?:string;
}
export interface PersonalData {sections:BackupSections; references:BackupReference[]}
export interface FullBackup extends PersonalData {
  format:'glass-notes-backup'; schemaVersion:1|2|3; exportedAt:string;
}
export interface RestoreChoice {
  mode:'merge'|'replace'; sections:BackupSection[]; preferenceFields:(keyof Preferences)[];
}
export interface BackupPreviewRow {
  section:BackupSection; current:number; incoming:number; added:number; same:number;
  conflicts:number; removed:number; result:number; selected:boolean;
  notice?:'legacy-favorites-lists-preserved';
}
export interface BackupConflict {
  section:BackupSection|'references'; id:string; currentTitle:string; incomingTitle:string;
  action:'keep-both'|'keep-current'|'replace';
}
export interface PreferenceChange {field:keyof Preferences; current:string|boolean; incoming:string|boolean; applied:boolean}
export interface RestorePlan {
  next:PersonalData; preview:BackupPreviewRow[]; conflicts:BackupConflict[];
  preferenceChanges:PreferenceChange[]; unresolved:BackupReference[]; fingerprint:string;
}
export type KnownReferences = Record<ReferenceKind,ReadonlySet<string>>;
