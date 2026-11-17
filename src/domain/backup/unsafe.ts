import {BackupError,type BackupErrorCode} from './errors';
const LIMITS={nodes:250_000,depth:64} as const;
const DANGEROUS_KEYS=new Set(['__proto__','prototype','constructor']);
type RecordValue=Record<string,unknown>;
function fail(code:BackupErrorCode,path:string,detail:string):never{throw new BackupError(code,`${path}: ${detail}`);}

/** Shared trust boundary for personal snapshots and full backup envelopes. */
export function rejectUnsafe(value: unknown, root='backup'): void {
  let nodes = 0;
  // Visit siblings in place so a wide input cannot allocate a work item per value.
  function visit(item: unknown, path: string, depth: number): void {
    if (++nodes > LIMITS.nodes) fail('invalid-data',root,`exceeds ${LIMITS.nodes} nested values`);
    if (depth > LIMITS.depth) fail('invalid-data',path,`exceeds nesting depth ${LIMITS.depth}`);
    if (Array.isArray(item)) {
      item.forEach((child, index) => visit(child, `${path}[${index}]`, depth + 1));
    } else if (item && typeof item === 'object') {
      for (const key of Object.keys(item)) {
        if (DANGEROUS_KEYS.has(key)) fail('unsafe-key',path,`unsafe property ${key}`);
        visit((item as RecordValue)[key], `${path}.${key}`, depth + 1);
      }
    }
  }
  visit(value, root, 0);
}
