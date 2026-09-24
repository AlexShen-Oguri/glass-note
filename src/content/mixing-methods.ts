import type {MixingMethodEvidence, RecipeVersion} from '../domain/contracts';
import reviewedMethods from './mixing-methods.json';

export const mixingMethodRecords = reviewedMethods as Record<string, MixingMethodEvidence[]>;

/** Enriches the live catalogue only; existing private snapshots remain unchanged. */
export function applyMixingMethods(versions: RecipeVersion[]): RecipeVersion[] {
  return versions.map(version => {
    const records = mixingMethodRecords[version.id];
    if (!records?.length) return version;
    return {...version, mixingMethods: records.map(record => ({...record, stepIndexes: [...record.stepIndexes]}))};
  });
}
