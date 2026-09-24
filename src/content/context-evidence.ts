import records from './context-evidence.json';
import type {RecipeVersion} from '../domain/contracts';
import type {ContextEvidence} from '../domain/context/types';

/** Editorial selections; provenance and recipe fact hashes are checked in the content audit. */
export const contextEvidence = records as ContextEvidence[];

export function contextRecipeFacts(version: RecipeVersion): string {
  return JSON.stringify({
    sourceId: version.sourceId,
    ingredients: version.ingredients,
    originalSteps: version.originalSteps,
    flavours: version.flavours,
    tastes: version.tastes,
    strength: version.strength,
    glass: version.glass,
  });
}
