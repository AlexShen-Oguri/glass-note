import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {securityPatches, verifySecurityPatches} from './patch-dependency-security.mjs';

// Changes to these consumers require a new source-backed reachability review.
// The copied Braces implementation is unused by the workspace resolver's
// exported Picomatch-backed path; Forge consumers use its patched CommonJS API.
export const reviewedConsumers = {
  'node_modules/@expo/code-signing-certificates/build/main.js': '3670cfbd69934b475257649886517d0314890ca4139708d2c812efaab04bc6d1',
  'node_modules/expo/node_modules/@expo/cli/build/src/utils/codesigning.js': '935fadac6f1dc56bc088acb04416d1fc83bd70505f368b87dd210d0aa4617de2',
  'node_modules/micromatch/index.js': '6a56366fcf3ae8e678e574900a0acb2ea6f118ea030d09bcc1b1053ccab916bb',
  'node_modules/resolve-workspace-root/build/index.js': 'ee3be37ce5bce6f0de05ee538653d13f8cbf6a7ec8c8f4ed24466025e5e34f2e',
};

const severityNames = ['info', 'low', 'moderate', 'high', 'critical'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const has = (value, key) => Object.hasOwn(value, key);

export function assessDependencyAudit(report, verifiedTargets) {
  if (!object(report) || report.error || report.auditReportVersion !== 2 || !object(report.vulnerabilities) || !object(report.metadata?.vulnerabilities)) throw new Error('Unsupported or failed npm audit report');
  const entries = Object.entries(report.vulnerabilities);
  const counts = Object.fromEntries(severityNames.map(name => [name, 0]));
  for (const [name, vulnerability] of entries) {
    if (!object(vulnerability) || vulnerability.name !== name || !has(counts, vulnerability.severity) || !Array.isArray(vulnerability.via) || !vulnerability.via.length || !Array.isArray(vulnerability.nodes) || !vulnerability.nodes.length || vulnerability.nodes.some(node => typeof node !== 'string') || new Set(vulnerability.nodes).size !== vulnerability.nodes.length) throw new Error(`Incomplete npm audit entry: ${name}`);
    counts[vulnerability.severity]++;
  }
  if (severityNames.some(name => report.metadata.vulnerabilities[name] !== counts[name]) || report.metadata.vulnerabilities.total !== entries.length) throw new Error('npm audit counts do not match its entries');

  const verified = new Map();
  for (const patch of securityPatches) {
    const targets = verifiedTargets.filter(target => target.name === patch.name && target.version === patch.version && target.advisory === patch.advisory);
    if (!targets.length) throw new Error(`${patch.name}: no verified backport`);
    verified.set(patch.name, {patch, nodes: new Set(targets.map(target => target.directory))});
  }
  const direct = new Map();
  const reasons = new Set();
  for (const [name, vulnerability] of entries) {
    const ids = new Set();
    for (const via of vulnerability.via) {
      if (typeof via === 'string') {
        if (!has(report.vulnerabilities, via)) reasons.add(`${name}: unresolved dependency reference ${via}`);
        continue;
      }
      const match = verified.get(name);
      if (!object(via) || !match || via.name !== name || via.dependency !== name || via.url !== `https://github.com/advisories/${match.patch.advisory}` || via.severity !== 'high' || vulnerability.severity !== 'high' || via.range !== `<=${match.patch.version}` || vulnerability.nodes.length !== match.nodes.size || vulnerability.nodes.some(node => !match.nodes.has(node))) {
        reasons.add(`${name}: advisory or installed scope is not covered by an exact verified backport`);
      } else ids.add(match.patch.advisory);
    }
    direct.set(name, ids);
  }
  // npm's metavulnerability graph can contain Metro/React Native cycles.
  // Follow the complete reachable graph; every cycle must lead to a verified
  // direct advisory, and every other direct advisory blocks the result.
  const mitigated = [];
  for (const [name] of entries) {
    const visited = new Set();
    const queue = [name];
    const ids = new Set();
    while (queue.length) {
      const current = queue.pop();
      if (visited.has(current) || !has(report.vulnerabilities, current)) continue;
      visited.add(current);
      for (const id of direct.get(current)) ids.add(id);
      for (const via of report.vulnerabilities[current].via) if (typeof via === 'string') queue.push(via);
    }
    if (!ids.size) reasons.add(`${name}: no verified advisory anchors its dependency graph`);
    mitigated.push({name, advisories: [...ids].sort()});
  }
  return {passed: reasons.size === 0, rawCounts: {...counts, total: entries.length}, mitigated, blockers: [...reasons]};
}

export function verifyApplicationImports(text, file, ts) {
  const protectedPackages = ['braces', 'micromatch', 'node-forge', 'resolve-workspace-root'];
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  if (source.parseDiagnostics.length) throw new Error(`${file}: cannot parse application imports for scope review`);
  function specifier(expression) {
    if (!expression || (!ts.isStringLiteral(expression) && !ts.isNoSubstitutionTemplateLiteral(expression))) throw new Error(`${file}: dynamic module lookup needs a scope review`);
    if (protectedPackages.some(name => expression.text === name || expression.text.startsWith(name + '/')) || /(?:^|\/)forge(?:\.all)?\.min(?:\.js)?$/.test(expression.text)) throw new Error(`${file}: new direct consumer needs a backport scope review`);
  }
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier) specifier(node.moduleSpecifier);
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) specifier(node.moduleReference.expression);
    else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === 'require' || ts.isPropertyAccessExpression(node.expression) && ['require', 'resolve'].includes(node.expression.name.text) && ['module', 'require'].includes(node.expression.expression.getText(source)))) specifier(node.arguments[0]);
    ts.forEachChild(node, visit);
  }
  visit(source);
}

export async function verifyBackportScope(root) {
  for (const [file, expected] of Object.entries(reviewedConsumers)) {
    const source = (await readFile(path.join(root, file), 'utf8')).replace(/\r\n/g, '\n');
    if (createHash('sha256').update(source).digest('hex') !== expected) throw new Error(`${file}: dependency consumer changed; reassess backport scope`);
  }
  const require = createRequire(path.join(root, 'package.json'));
  const ts = require('typescript');
  let files = 0;
  async function visitDirectory(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Application source symlink needs a scope review');
      if (entry.isDirectory()) {await visitDirectory(file); continue;}
      if (!entry.isFile() || !/\.(?:[cm]?[jt]s|[jt]sx)$/.test(file)) continue;
      files++;
      verifyApplicationImports(await readFile(file, 'utf8'), file, ts);
    }
  }
  await visitDirectory(path.join(root, 'src'));
  const configuration = JSON.parse(await readFile(path.join(root, 'app.json'), 'utf8'));
  if (configuration.expo?.updates?.codeSigningCertificate) throw new Error('A new runtime code-signing configuration needs a backport scope review');
  return {applicationFilesChecked: files, consumerFilesVerified: Object.keys(reviewedConsumers), newDirectConsumers: 0};
}

export async function auditDependencies(root, npmCli) {
  if (!npmCli?.endsWith('.js')) throw new Error('Run the dependency gate through npm run audit:dependencies');
  const raw = spawnSync(process.execPath, [npmCli, 'audit', '--audit-level=high', '--json', '--registry=https://registry.npmjs.org'], {cwd: root, encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024, windowsHide: true});
  if (raw.error || raw.signal || ![0, 1].includes(raw.status)) throw new Error('npm audit tool/network failure; the dependency gate cannot pass');
  let report;
  try {report = JSON.parse(raw.stdout);} catch {throw new Error('npm audit did not produce a complete JSON report');}
  const hasHigh = Boolean(report.metadata?.vulnerabilities?.high || report.metadata?.vulnerabilities?.critical);
  if ((raw.status === 1) !== hasHigh) throw new Error('npm audit exit status does not match its high-severity report');
  const backports = await verifySecurityPatches(root);
  const scope = await verifyBackportScope(root);
  const assessment = assessDependencyAudit(report, backports);
  if (assessment.passed) {
    const result = spawnSync(process.execPath, ['--test', 'scripts/dependency-security.test.mjs', 'scripts/dependency-backports.test.mjs'], {cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024, windowsHide: true});
    if (result.error || result.signal || result.status !== 0) throw new Error(`Backport regression/compatibility tests failed; the dependency gate cannot pass.\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  }
  return {assessment, backports, scope, rawAudit: report};
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const result = await auditDependencies(fileURLToPath(new URL('../', import.meta.url)), process.env.npm_execpath);
    console.log(JSON.stringify(result, null, 2));
    if (!result.assessment.passed) process.exitCode = 1;
  } catch (error) {console.error(error.message); process.exitCode = 1;}
}
