import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp, mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assessDependencyAudit, auditDependencies, reviewedConsumers, verifyApplicationImports, verifyBackportScope} from './audit-dependencies.mjs';
import {securityPatches} from './patch-dependency-security.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const ts = createRequire(import.meta.url)('typescript');
const targets = securityPatches.map(patch => ({name: patch.name, version: patch.version, advisory: patch.advisory, directory: `node_modules/${patch.name}`}));

function entry(name, via, severity = 'high', nodes = [`node_modules/${name}`]) {
  return {name, severity, via, nodes};
}

function report(vulnerabilities = {}) {
  const counts = {info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0};
  for (const vulnerability of Object.values(vulnerabilities)) {counts[vulnerability.severity]++; counts.total++;}
  return {auditReportVersion: 2, vulnerabilities, metadata: {vulnerabilities: counts}};
}

function patchedReport() {
  const vulnerabilities = Object.fromEntries(securityPatches.map(patch => [patch.name, entry(patch.name, [{name: patch.name, dependency: patch.name, url: `https://github.com/advisories/${patch.advisory}`, severity: 'high', range: `<=${patch.version}`}])]));
  // Model npm's real Metro cycle, plus multiple paths to both backports.
  vulnerabilities.metro = entry('metro', ['metro-config', 'micromatch']);
  vulnerabilities['metro-config'] = entry('metro-config', ['metro']);
  vulnerabilities.micromatch = entry('micromatch', ['braces']);
  vulnerabilities.expo = entry('expo', ['metro', 'node-forge']);
  return report(vulnerabilities);
}

async function temporary(action) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'glass-notes-dependency-gate-'));
  try {await action(directory);} finally {await rm(directory, {recursive: true, force: true});}
}

test('only verified direct backports and their anchored transitive cycles pass', () => {
  const raw = patchedReport();
  const snapshot = JSON.stringify(raw);
  const result = assessDependencyAudit(raw, targets);
  assert.equal(result.passed, true);
  assert.deepEqual(result.rawCounts, {info: 0, low: 0, moderate: 0, high: 6, critical: 0, total: 6});
  assert.equal(result.mitigated.find(item => item.name === 'expo').advisories.length, 2);
  assert.equal(JSON.stringify(raw), snapshot, 'raw audit findings must remain intact');
  assert.equal(assessDependencyAudit(report(), targets).passed, true);
});

test('new direct advisories at every severity block even alongside a verified anchor', () => {
  for (const severity of ['info', 'low', 'moderate', 'high', 'critical']) {
    const raw = patchedReport();
    raw.vulnerabilities.expo.via.push({name: 'expo', dependency: 'expo', severity, url: 'https://github.com/advisories/GHSA-new-finding', range: '*'});
    assert.equal(assessDependencyAudit(raw, targets).passed, false, severity);
  }
});

test('different identity, range, version, severity or installed copy cannot inherit recognition', () => {
  for (const change of [via => {via.url += '?changed';}, via => {via.name = 'other';}, via => {via.dependency = 'other';}, via => {via.range = '*';}, via => {via.severity = 'critical';}]) {
    const raw = patchedReport(); change(raw.vulnerabilities.braces.via[0]);
    assert.equal(assessDependencyAudit(raw, targets).passed, false);
  }
  const raw = patchedReport(); raw.vulnerabilities.braces.nodes = ['node_modules/other/node_modules/braces'];
  assert.equal(assessDependencyAudit(raw, targets).passed, false);
  assert.throws(() => assessDependencyAudit(patchedReport(), targets.filter(target => target.name !== 'braces')), /no verified backport/);
  assert.throws(() => assessDependencyAudit(patchedReport(), targets.map(target => ({...target, version: 'unknown'}))), /no verified backport/);
  const nested = {...targets[0], directory: 'node_modules/nested/node_modules/braces'};
  assert.equal(assessDependencyAudit(patchedReport(), [...targets, nested]).passed, false);
  const complete = patchedReport(); complete.vulnerabilities.braces.nodes.push(nested.directory);
  assert.equal(assessDependencyAudit(complete, [...targets, nested]).passed, true);
  complete.vulnerabilities.braces.nodes[1] = complete.vulnerabilities.braces.nodes[0];
  assert.throws(() => assessDependencyAudit(complete, [...targets, nested]), /Incomplete/);
});

test('unresolved references and cycles without a verified advisory block the complete graph', () => {
  const dangling = patchedReport(); dangling.vulnerabilities.expo.via.push('missing');
  assert.equal(assessDependencyAudit(dangling, targets).passed, false);
  const raw = patchedReport();
  raw.vulnerabilities.a = entry('a', ['b']); raw.vulnerabilities.b = entry('b', ['a']);
  raw.vulnerabilities.expo.via.push('a');
  raw.metadata.vulnerabilities.high += 2; raw.metadata.vulnerabilities.total += 2;
  assert.equal(assessDependencyAudit(raw, targets).passed, false);
});

test('failed, truncated, unsupported and inconsistent npm reports cannot pass', () => {
  for (const raw of [null, [], {}, {error: 'network'}, {...patchedReport(), error: {code: 'ENOAUDIT'}}, {...patchedReport(), auditReportVersion: 3}]) assert.throws(() => assessDependencyAudit(raw, targets), /Unsupported/);
  const mismatch = patchedReport(); mismatch.metadata.vulnerabilities.high--;
  assert.throws(() => assessDependencyAudit(mismatch, targets), /counts/);
  for (const mutate of [value => {value.name = 'other';}, value => {value.via = [];}, value => {value.via = null;}, value => {value.nodes = [];}, value => {value.nodes = [null];}, value => {value.severity = 'unknown';}]) {
    const raw = patchedReport(); mutate(raw.vulnerabilities.braces);
    assert.throws(() => assessDependencyAudit(raw, targets), /Incomplete/);
  }
});

test('application scope rejects literal, dynamic and deep imports of unreviewed consumers', () => {
  for (const source of [
    'import forge from "node-forge";', 'export * from "braces/lib/compile";',
    'import forge = require("node-forge");', 'require("micromatch");',
    'import(`resolve-workspace-root`);', 'module.require("node-forge");',
    'require.resolve("braces");', 'import("./vendor/forge.all.min.js");',
    'require(variable);', 'import(`./vendor/${name}`);', 'module.require();',
  ]) assert.throws(() => verifyApplicationImports(source, 'sample.ts', ts), /scope review/);
  assert.throws(() => verifyApplicationImports('import {', 'sample.ts', ts), /cannot parse/);
  verifyApplicationImports('import React from "react"; export * from "./safe"; const image = require("./asset.png"); const message = "node-forge"; // require(variable)\n', 'sample.ts', ts);
  verifyApplicationImports('export const component = <div title="node-forge" />;', 'sample.tsx', ts);
});

test('real installed consumers and application imports match the reviewed scope', async () => {
  const result = await verifyBackportScope(root);
  assert.ok(result.applicationFilesChecked > 100);
  assert.deepEqual(result.consumerFilesVerified, Object.keys(reviewedConsumers));
  assert.equal(result.newDirectConsumers, 0);
});

test('a changed dependency consumer blocks scope verification before parsing application code', async () => temporary(async directory => {
  for (const file of Object.keys(reviewedConsumers)) {
    await mkdir(path.dirname(path.join(directory, file)), {recursive: true});
    await writeFile(path.join(directory, file), await readFile(path.join(root, file)));
  }
  const file = Object.keys(reviewedConsumers)[1];
  await writeFile(path.join(directory, file), 'changed source');
  await assert.rejects(verifyBackportScope(directory), /consumer changed/);
}));

test('npm failures, malformed output and contradictory exit codes fail closed without network', async () => temporary(async directory => {
  const cli = path.join(directory, 'npm-fixture.js');
  for (const source of [
    'process.exit(2);', 'console.log("not JSON");',
    `console.log(${JSON.stringify(JSON.stringify(report()))}); process.exitCode=1;`,
    `console.log(${JSON.stringify(JSON.stringify(patchedReport()))});`,
  ]) {
    await writeFile(cli, source);
    await assert.rejects(auditDependencies(root, cli), /tool\/network failure|complete JSON|exit status/);
  }
  await assert.rejects(auditDependencies(root, undefined), /npm run/);
}));
