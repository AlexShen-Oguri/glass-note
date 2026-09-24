import { createHash, randomUUID } from 'node:crypto';
import {
  lstat,
  open,
  readdir,
  readFile,
  rename,
  rm,
} from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const SNAPSHOT_PROFILE = 'app-validation-v1';
const SNAPSHOT_ALGORITHM = 'sha256';
const INCLUDED_DIRECTORIES = ['src', 'scripts', 'assets', 'public', 'research'];
const INCLUDED_ROOT_FILES = [
  'package.json',
  'package-lock.json',
  'app.json',
  'tsconfig.json',
  'metro.config.js',
  '.npmrc',
];
const OPTIONAL_CONFIG_PATTERN = /^(?:app|babel|metro)\.config\.(?:cjs|cts|js|json|mjs|mts|ts)$/i;
const EXCLUDED_DIRECTORY_NAMES = new Set([
  '.cache',
  '.expo',
  '.git',
  'node_modules',
]);
const REQUIRED_VALIDATION_STEPS = ['typecheck', 'test', 'web', 'ios'];
const REPORT_STATUSES = new Set([
  'running',
  'passed',
  'failed',
  'source-changed',
  'interrupted',
]);
const FAILURE_EVENT_TYPES = new Set(['failure', 'success', 'approach-change']);

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isIsoTimestamp(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function snapshotShapeError(snapshot) {
  if (!isPlainObject(snapshot)) return 'snapshot must be an object';
  if (snapshot.schemaVersion !== 1) return 'snapshot schemaVersion must be 1';
  if (snapshot.profile !== SNAPSHOT_PROFILE) {
    return `snapshot profile must be ${SNAPSHOT_PROFILE}`;
  }
  if (snapshot.algorithm !== SNAPSHOT_ALGORITHM) {
    return `snapshot algorithm must be ${SNAPSHOT_ALGORITHM}`;
  }
  if (typeof snapshot.digest !== 'string' || !/^[a-f0-9]{64}$/.test(snapshot.digest)) {
    return 'snapshot digest must be a lowercase SHA-256 digest';
  }
  if (!Number.isSafeInteger(snapshot.fileCount) || snapshot.fileCount < 0) {
    return 'snapshot fileCount must be a non-negative safe integer';
  }
  if (!isIsoTimestamp(snapshot.capturedAt)) return 'snapshot capturedAt must be an ISO timestamp';
  return null;
}

function snapshotIdentityEqual(left, right) {
  return (
    left.schemaVersion === right.schemaVersion &&
    left.profile === right.profile &&
    left.algorithm === right.algorithm &&
    left.digest === right.digest &&
    left.fileCount === right.fileCount
  );
}

async function checkedStat(target, relativePath) {
  let metadata;
  try {
    metadata = await lstat(target);
  } catch (error) {
    error.message = `Cannot inspect snapshot path ${relativePath}: ${error.message}`;
    throw error;
  }
  if (metadata.isSymbolicLink()) {
    throw new Error(`Snapshot path must not be a symbolic link: ${relativePath}`);
  }
  return metadata;
}

async function collectDirectory(root, relativeDirectory, records) {
  const absoluteDirectory = path.join(root, ...relativeDirectory.split('/'));
  let metadata;
  try {
    metadata = await lstat(absoluteDirectory);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      records.push({ type: 'missing-directory', path: relativeDirectory });
      return;
    }
    error.message = `Cannot inspect snapshot directory ${relativeDirectory}: ${error.message}`;
    throw error;
  }

  if (metadata.isSymbolicLink()) {
    throw new Error(`Snapshot directory must not be a symbolic link: ${relativeDirectory}`);
  }
  if (!metadata.isDirectory()) {
    throw new Error(`Snapshot directory is not a directory: ${relativeDirectory}`);
  }
  records.push({ type: 'directory', path: relativeDirectory });

  let entries;
  try {
    entries = await readdir(absoluteDirectory, { withFileTypes: true });
  } catch (error) {
    error.message = `Cannot read snapshot directory ${relativeDirectory}: ${error.message}`;
    throw error;
  }
  entries.sort((left, right) => compareText(left.name, right.name));

  for (const entry of entries) {
    const relativePath = `${relativeDirectory}/${entry.name}`;
    const absolutePath = path.join(absoluteDirectory, entry.name);
    const entryMetadata = await checkedStat(absolutePath, relativePath);

    if (entryMetadata.isDirectory()) {
      if (EXCLUDED_DIRECTORY_NAMES.has(entry.name.toLowerCase())) continue;
      await collectDirectory(root, relativePath, records);
      continue;
    }
    if (!entryMetadata.isFile()) {
      throw new Error(`Snapshot path is not a regular file: ${relativePath}`);
    }
    records.push({ type: 'file', path: relativePath, absolutePath });
  }
}

async function collectRootFile(root, relativePath, records, optional = false) {
  const absolutePath = path.join(root, relativePath);
  let metadata;
  try {
    metadata = await lstat(absolutePath);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      if (!optional) records.push({ type: 'missing-file', path: relativePath });
      return;
    }
    error.message = `Cannot inspect snapshot file ${relativePath}: ${error.message}`;
    throw error;
  }
  if (metadata.isSymbolicLink()) {
    throw new Error(`Snapshot file must not be a symbolic link: ${relativePath}`);
  }
  if (!metadata.isFile()) {
    throw new Error(`Snapshot path is not a regular file: ${relativePath}`);
  }
  records.push({ type: 'file', path: relativePath, absolutePath });
}

function updateHashRecord(hash, type, relativePath, content) {
  const header = Buffer.from(`${type}\0${relativePath}\0${content?.length ?? 0}\0`, 'utf8');
  hash.update(header);
  if (content) hash.update(content);
  hash.update('\0');
}

/**
 * Capture the source inputs that bind a validation run to an exact working tree.
 */
export async function sourceSnapshot(root) {
  if (!isNonEmptyString(root)) throw new TypeError('root must be a non-empty path');
  const absoluteRoot = path.resolve(root);
  const rootMetadata = await checkedStat(absoluteRoot, '.');
  if (!rootMetadata.isDirectory()) throw new Error('Snapshot root must be a directory');

  const records = [];
  for (const relativeDirectory of INCLUDED_DIRECTORIES) {
    await collectDirectory(absoluteRoot, relativeDirectory, records);
  }
  for (const relativeFile of INCLUDED_ROOT_FILES) {
    await collectRootFile(absoluteRoot, relativeFile, records);
  }

  let rootEntries;
  try {
    rootEntries = await readdir(absoluteRoot, { withFileTypes: true });
  } catch (error) {
    error.message = `Cannot read snapshot root: ${error.message}`;
    throw error;
  }
  const fixedNames = new Set(INCLUDED_ROOT_FILES.map((name) => name.toLowerCase()));
  const optionalConfigs = rootEntries
    .map((entry) => entry.name)
    .filter((name) => OPTIONAL_CONFIG_PATTERN.test(name) && !fixedNames.has(name.toLowerCase()))
    .sort(compareText);
  for (const relativeFile of optionalConfigs) {
    await collectRootFile(absoluteRoot, relativeFile, records, true);
  }

  records.sort((left, right) => {
    const pathOrder = compareText(left.path, right.path);
    return pathOrder || compareText(left.type, right.type);
  });

  const hash = createHash(SNAPSHOT_ALGORITHM);
  let fileCount = 0;
  for (const record of records) {
    if (record.type !== 'file') {
      updateHashRecord(hash, record.type, record.path);
      continue;
    }
    let content;
    try {
      content = await readFile(record.absolutePath);
    } catch (error) {
      error.message = `Cannot read snapshot file ${record.path}: ${error.message}`;
      throw error;
    }
    updateHashRecord(hash, record.type, record.path, content);
    fileCount += 1;
  }

  return {
    schemaVersion: 1,
    profile: SNAPSHOT_PROFILE,
    algorithm: SNAPSHOT_ALGORITHM,
    digest: hash.digest('hex'),
    fileCount,
    capturedAt: new Date().toISOString(),
  };
}

function reportCommonError(report) {
  if (report.schemaVersion !== 2) return 'report schemaVersion must be 2';
  if (!REPORT_STATUSES.has(report.status)) return 'report status is not recognized';
  if (!isIsoTimestamp(report.startedAt)) return 'report startedAt must be an ISO timestamp';
  if (!Number.isSafeInteger(report.pid) || report.pid <= 0) {
    return 'report pid must be a positive safe integer';
  }
  if (typeof report.passed !== 'boolean') return 'report passed must be boolean';
  if (!Array.isArray(report.steps)) return 'report steps must be an array';
  const names = new Set();
  for (const [index, step] of report.steps.entries()) {
    if (!isPlainObject(step)) return `report steps[${index}] must be an object`;
    if (!isNonEmptyString(step.name)) return `report steps[${index}].name must be non-empty`;
    if (names.has(step.name)) return `report step ${step.name} is duplicated`;
    names.add(step.name);
    if (step.exitCode !== null && !Number.isInteger(step.exitCode)) {
      return `report step ${step.name} exitCode must be an integer or null`;
    }
  }
  const sourceError = snapshotShapeError(report.source);
  if (sourceError) return `report source is invalid: ${sourceError}`;
  return null;
}

/**
 * Interpret a validation report conservatively against a current source snapshot.
 */
export function validationStatus(report, snapshot) {
  const currentSnapshotError = snapshotShapeError(snapshot);
  if (currentSnapshotError) return { status: 'invalid', reason: currentSnapshotError };
  if (report === null || report === undefined) {
    return { status: 'missing', reason: 'No validation report exists.' };
  }
  if (!isPlainObject(report)) {
    return { status: 'invalid', reason: 'Validation report must be an object.' };
  }
  if (report.source === null || report.source === undefined) {
    if (report.schemaVersion === 2) {
      return { status: 'invalid', reason: 'Schema v2 validation report has no source snapshot.' };
    }
    const looksLikeHistoricalReport =
      Array.isArray(report.steps) &&
      typeof report.passed === 'boolean' &&
      isIsoTimestamp(report.startedAt) &&
      (report.finishedAt === null || report.finishedAt === undefined || isIsoTimestamp(report.finishedAt));
    return looksLikeHistoricalReport
      ? { status: 'unbound', reason: 'Historical validation report has no source snapshot.' }
      : { status: 'invalid', reason: 'Validation report is malformed and has no source snapshot.' };
  }

  const commonError = reportCommonError(report);
  if (commonError) return { status: 'invalid', reason: commonError };

  if (report.status === 'running') {
    if (report.passed) {
      return { status: 'invalid', reason: 'A running validation report cannot be marked passed.' };
    }
    return { status: 'running', reason: 'Validation is still running.' };
  }

  if (report.status === 'failed' || report.status === 'interrupted') {
    if (report.passed) {
      return { status: 'invalid', reason: `A ${report.status} validation report cannot be marked passed.` };
    }
    return { status: 'failed', reason: `Validation ended with status ${report.status}.` };
  }

  if (!isIsoTimestamp(report.finishedAt)) {
    return { status: 'invalid', reason: 'Terminal validation report has no valid finishedAt.' };
  }
  const sourceAfterError = snapshotShapeError(report.sourceAfter);
  if (sourceAfterError) {
    return { status: 'invalid', reason: `report sourceAfter is invalid: ${sourceAfterError}` };
  }

  if (
    report.status === 'source-changed' ||
    !snapshotIdentityEqual(report.source, report.sourceAfter) ||
    !snapshotIdentityEqual(report.sourceAfter, snapshot)
  ) {
    return { status: 'stale', reason: 'Validation sources differ from the current source snapshot.' };
  }

  if (report.status !== 'passed' || report.passed !== true) {
    return { status: 'invalid', reason: 'Validation report does not consistently record a pass.' };
  }

  const stepsByName = new Map(report.steps.map((step) => [step.name, step]));
  for (const requiredStep of REQUIRED_VALIDATION_STEPS) {
    if (!stepsByName.has(requiredStep)) {
      return { status: 'invalid', reason: `Validation report is missing step ${requiredStep}.` };
    }
    if (stepsByName.get(requiredStep).exitCode !== 0) {
      return { status: 'failed', reason: `Validation step ${requiredStep} did not exit successfully.` };
    }
  }
  const unsuccessfulStep = report.steps.find((step) => step.exitCode !== 0);
  if (unsuccessfulStep) {
    return { status: 'failed', reason: `Validation step ${unsuccessfulStep.name} did not exit successfully.` };
  }

  return { status: 'current', reason: 'Validation passed for the current source snapshot.' };
}

function requireObject(errors, value, field) {
  if (!isPlainObject(value)) {
    errors.push(`${field} must be an object`);
    return false;
  }
  return true;
}

function requireString(errors, value, field) {
  if (!isNonEmptyString(value)) errors.push(`${field} must be a non-empty string`);
}

function requireStringArray(errors, value, field) {
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array`);
    return;
  }
  value.forEach((entry, index) => requireString(errors, entry, `${field}[${index}]`));
}

/** Validate the persisted workflow state without adding or approving any fields. */
export function validateState(state) {
  const errors = [];
  if (!requireObject(errors, state, 'state')) return errors;
  if (state.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (!isIsoTimestamp(state.updatedAt)) errors.push('updatedAt must be an ISO timestamp');

  if (requireObject(errors, state.product, 'product')) {
    requireString(errors, state.product.phase, 'product.phase');
    requireString(errors, state.product.status, 'product.status');
    requireString(errors, state.product.nextPhase, 'product.nextPhase');
  }
  if (requireObject(errors, state.task, 'task')) {
    requireString(errors, state.task.id, 'task.id');
    requireString(errors, state.task.title, 'task.title');
    requireString(errors, state.task.status, 'task.status');
    requireString(errors, state.task.nextAction, 'task.nextAction');
  }
  if (requireObject(errors, state.gates, 'gates')) {
    requireString(errors, state.gates.productAcceptance, 'gates.productAcceptance');
    requireString(errors, state.gates.mainMerge, 'gates.mainMerge');
    requireString(errors, state.gates.commit, 'gates.commit');
    requireString(errors, state.gates.deployment, 'gates.deployment');
  }

  if (!Array.isArray(state.assignments)) {
    errors.push('assignments must be an array');
  } else {
    const assignmentIds = new Set();
    state.assignments.forEach((assignment, index) => {
      const field = `assignments[${index}]`;
      if (!requireObject(errors, assignment, field)) return;
      for (const property of ['id', 'agent', 'model', 'effort', 'status', 'deliverable']) {
        requireString(errors, assignment[property], `${field}.${property}`);
      }
      if (isNonEmptyString(assignment.id)) {
        if (assignmentIds.has(assignment.id)) errors.push(`${field}.id must be unique`);
        assignmentIds.add(assignment.id);
      }
      requireStringArray(errors, assignment.writes, `${field}.writes`);
      if (Array.isArray(assignment.writes)) {
        assignment.writes.forEach((writePath, writeIndex) => {
          if (!isNonEmptyString(writePath)) return;
          try {
            normalizeOwnershipPath(writePath);
          } catch (error) {
            errors.push(`${field}.writes[${writeIndex}] ${error.message}`);
          }
        });
      }
    });
  }

  if (requireObject(errors, state.validation, 'validation')) {
    requireString(errors, state.validation.reportPath, 'validation.reportPath');
  }
  if (!Array.isArray(state.failureEvents)) {
    errors.push('failureEvents must be an array');
  } else {
    state.failureEvents.forEach((event, index) => {
      const field = `failureEvents[${index}]`;
      if (!requireObject(errors, event, field)) return;
      if (!FAILURE_EVENT_TYPES.has(event.type)) {
        errors.push(`${field}.type must be failure, success, or approach-change`);
      }
      for (const property of ['taskId', 'operation', 'cause', 'evidence']) {
        requireString(errors, event[property], `${field}.${property}`);
      }
      if (!isIsoTimestamp(event.at)) errors.push(`${field}.at must be an ISO timestamp`);
    });
  }
  requireStringArray(errors, state.unverified, 'unverified');
  requireStringArray(errors, state.references, 'references');
  return errors;
}

function normalizeOwnershipPath(writePath) {
  if (!isNonEmptyString(writePath)) throw new TypeError('must be a non-empty relative path');
  if (writePath.includes('\0')) throw new TypeError('must not contain a null byte');
  const slashed = writePath.replaceAll('\\', '/');
  if (
    path.posix.isAbsolute(slashed) ||
    path.win32.isAbsolute(writePath) ||
    /^[a-zA-Z]:/.test(slashed) ||
    slashed.startsWith('//')
  ) {
    throw new TypeError('must be relative');
  }
  if (/[*?]/.test(slashed)) throw new TypeError('must not contain glob syntax');
  const segments = slashed.split('/').filter((segment) => segment !== '' && segment !== '.');
  if (segments.includes('..')) throw new TypeError('must not traverse outside the workspace');
  if (segments.some((segment) => segment.includes(':'))) {
    throw new TypeError('must not contain a Windows drive or alternate stream');
  }
  if (segments.length === 0) throw new TypeError('must identify a file or directory below the workspace');
  return segments.join('/').toLowerCase();
}

function pathsOverlap(left, right) {
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`);
}

/** Find overlapping active write ownership using Windows path semantics. */
export function ownershipConflicts(assignments) {
  if (!Array.isArray(assignments)) throw new TypeError('assignments must be an array');
  const scopes = [];
  assignments.forEach((assignment, assignmentIndex) => {
    if (!isPlainObject(assignment)) {
      throw new TypeError(`assignments[${assignmentIndex}] must be an object`);
    }
    if (assignment.status !== 'active') return;
    if (!isNonEmptyString(assignment.id)) {
      throw new TypeError(`assignments[${assignmentIndex}].id must be non-empty`);
    }
    if (!Array.isArray(assignment.writes)) {
      throw new TypeError(`assignments[${assignmentIndex}].writes must be an array`);
    }
    for (const writePath of assignment.writes) {
      scopes.push({ taskId: assignment.id, path: normalizeOwnershipPath(writePath) });
    }
  });

  const conflicts = new Map();
  for (let leftIndex = 0; leftIndex < scopes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < scopes.length; rightIndex += 1) {
      const left = scopes[leftIndex];
      const right = scopes[rightIndex];
      if (left.taskId === right.taskId || !pathsOverlap(left.path, right.path)) continue;
      const taskIds = [left.taskId, right.taskId].sort(compareText);
      const conflictPath = left.path.length >= right.path.length ? left.path : right.path;
      const key = `${taskIds[0]}\0${taskIds[1]}\0${conflictPath}`;
      conflicts.set(key, { taskIds, path: conflictPath });
    }
  }
  return [...conflicts.values()].sort((left, right) => {
    const pathOrder = compareText(left.path, right.path);
    return pathOrder || compareText(left.taskIds.join('\0'), right.taskIds.join('\0'));
  });
}

function failureKey(event) {
  return JSON.stringify([event.taskId, event.operation, event.cause]);
}

/** Assess only the explicitly recorded tail of failure events. */
export function assessFailures(events) {
  if (!Array.isArray(events)) throw new TypeError('events must be an array');
  let consecutive = 0;
  let key = null;
  for (const [index, event] of events.entries()) {
    if (!isPlainObject(event) || !FAILURE_EVENT_TYPES.has(event.type)) {
      throw new TypeError(`events[${index}] must be an explicit failure, success, or approach-change event`);
    }
    if (event.type !== 'failure') {
      consecutive = 0;
      key = null;
      continue;
    }
    for (const property of ['taskId', 'operation', 'cause']) {
      if (!isNonEmptyString(event[property])) {
        throw new TypeError(`events[${index}].${property} must be non-empty`);
      }
    }
    const nextKey = failureKey(event);
    consecutive = nextKey === key ? consecutive + 1 : 1;
    key = nextKey;
  }
  return {
    consecutive,
    action: consecutive >= 3 ? 'stop-and-investigate' : 'continue',
    key,
  };
}

/** Write formatted JSON through a unique same-directory temporary file. */
export async function atomicWriteJson(file, value) {
  if (!isNonEmptyString(file)) throw new TypeError('file must be a non-empty path');
  const serialized = JSON.stringify(value, null, 2);
  if (serialized === undefined) throw new TypeError('value is not JSON serializable');
  const absoluteFile = path.resolve(file);
  const temporaryFile = path.join(
    path.dirname(absoluteFile),
    `.${path.basename(absoluteFile)}.${process.pid}.${randomUUID()}.tmp`,
  );
  let handle;
  try {
    handle = await open(temporaryFile, 'wx', 0o600);
    await handle.writeFile(`${serialized}\n`, 'utf8');
    await handle.sync();
    await handle.close();
    handle = undefined;
    let renamed = false;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        await rename(temporaryFile, absoluteFile);
        renamed = true;
        break;
      } catch (error) {
        const transientWindowsReplaceError = ['EACCES', 'EBUSY', 'EPERM'].includes(error?.code);
        if (!transientWindowsReplaceError || attempt === 7) throw error;
        await delay((attempt + 1) * 5);
      }
    }
    if (!renamed) throw new Error(`Atomic rename did not complete for ${absoluteFile}`);
  } catch (error) {
    if (handle) {
      try {
        await handle.close();
      } catch {
        // Preserve the original write error.
      }
    }
    try {
      await rm(temporaryFile, { force: true });
    } catch {
      // Preserve the original write error.
    }
    throw error;
  }
}
