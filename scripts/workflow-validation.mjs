import {spawn} from 'node:child_process';
import {appendFile, mkdir, open, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {atomicWriteJson, sourceSnapshot} from './workflow-core.mjs';

// The lock guards the report and shared export/log paths. Stale locks require inspection.
export async function runValidation({root, steps, quiet = false, snapshot = sourceSnapshot, signal}) {
  const artifactDir = path.join(root, 'artifacts');
  const lockPath = path.join(artifactDir, 'workflow', 'validation.lock');
  const reportPath = path.join(artifactDir, 'validation-latest.json');
  await mkdir(path.dirname(lockPath), {recursive: true});
  const token = randomUUID();
  let lock;
  try { lock = await open(lockPath, 'wx'); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Validation lock exists: ${lockPath}. Inspect its PID and child processes before removing it; the existing report was preserved.`);
    throw error;
  }
  const report = {
    schemaVersion: 2, runId: token, pid: process.pid,
    startedAt: new Date().toISOString(), status: 'running', passed: false, steps: [],
    runtime: {node: process.version, platform: process.platform, arch: process.arch},
  };
  try {
    await lock.writeFile(JSON.stringify({runId: token, pid: process.pid, startedAt: report.startedAt}));
    await lock.close();
    lock = undefined;
    await atomicWriteJson(reportPath, report);
    report.source = await snapshot(root);
    await atomicWriteJson(reportPath, report);
    for (const [name, args] of steps) {
      if (signal?.aborted) {report.status = 'interrupted'; break;}
      const start = Date.now();
      const step = {name, status: 'running', startedAt: new Date().toISOString(), exitCode: null, log: `artifacts/validate-${name}.log`};
      // Names are controlled by the runner, never allowed to escape artifacts.
      if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error('Invalid validation step name');
      report.steps.push(step);
      await writeFile(path.join(root, step.log), '');
      await atomicWriteJson(reportPath, report);
      let output = '';
      let pendingLog = Promise.resolve();
      let logError;
      const capture = (chunk, stream) => {
        output += chunk;
        if (!quiet) stream.write(chunk);
        // Persist live output as well as the step checkpoint for interrupted sessions.
        pendingLog = pendingLog.then(() => appendFile(path.join(root, step.log), chunk)).catch(error => {logError = error;});
      };
      const result = await new Promise(resolve => {
        const child = spawn(process.execPath, args, {
          cwd: root, windowsHide: true,
          env: {...process.env, EXPO_NO_TELEMETRY: '1'}, stdio: ['ignore', 'pipe', 'pipe'],
        });
        const abort = () => child.kill();
        signal?.addEventListener('abort', abort, {once: true});
        if (signal?.aborted) abort();
        child.stdout.on('data', chunk => capture(chunk, process.stdout));
        child.stderr.on('data', chunk => capture(chunk, process.stderr));
        let spawnError;
        child.on('error', error => {spawnError = error; output += error.message;});
        child.on('close', code => {
          signal?.removeEventListener('abort', abort);
          resolve(spawnError ? 1 : (code ?? 1));
        });
      }).catch(error => {output += error.message; return 1;});
      await pendingLog;
      if (logError) throw logError;
      await writeFile(path.join(root, step.log), output);
      Object.assign(step, {exitCode: result, status: result === 0 ? 'passed' : 'failed', durationMs: Date.now() - start, finishedAt: new Date().toISOString()});
      if (signal?.aborted) report.status = 'interrupted';
      else if (result !== 0) report.status = 'failed';
      await atomicWriteJson(reportPath, report);
      if (report.status !== 'running') break;
    }
    report.sourceAfter = await snapshot(root);
    if (signal?.aborted) report.status = 'interrupted';
    if (report.status === 'running') {
      report.status = report.source.digest === report.sourceAfter.digest && report.source.profile === report.sourceAfter.profile ? 'passed' : 'source-changed';
    }
    report.passed = report.status === 'passed';
  } catch (error) {
    report.status = signal?.aborted ? 'interrupted' : 'failed';
    report.error = error.message;
    report.passed = false;
  } finally {
    report.finishedAt = new Date().toISOString();
    try { await atomicWriteJson(reportPath, report); }
    finally {
      if (lock) await lock.close();
      // Never remove another process's replacement lock.
      const currentLock = await readFile(lockPath, 'utf8').then(JSON.parse).catch(() => null);
      // Expo may have descendants on Windows: interrupted runs require inspection
      // before another export can own these shared paths.
      if (currentLock?.runId === token && report.status !== 'interrupted') await unlink(lockPath);
    }
  }
  return report;
}
