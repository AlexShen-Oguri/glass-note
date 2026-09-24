import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {cp, lstat, mkdir, mkdtemp, readdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Package only the static export, never the repository or a caller-selected path.
export async function inspectExport(directory) {
  const files = [];
  async function visit(relative) {
    const absolute = path.join(directory, relative);
    const info = await lstat(absolute);
    if (info.isSymbolicLink()) throw Error(`Linked export path: ${relative || '.'}`);
    const exportPath = relative.split(path.sep).join('/');
    if (exportPath === '_expo/.routes.json' && !info.isFile()) throw Error('Expo route manifest must be a regular file');
    if (info.isDirectory()) {
      for (const name of (await readdir(absolute)).sort()) {
        const child = path.join(relative, name);
        const childPath = child.split(path.sep).join('/');
        const routeManifest = childPath === '_expo/.routes.json';
        const bundledAssets = childPath === 'assets/node_modules';
        if ((name.startsWith('.') && !routeManifest) || ['research', 'src'].includes(name) || (name === 'node_modules' && !bundledAssets)) throw Error(`Unexpected export entry: ${name}`);
        await visit(child);
      }
    } else if (info.isFile()) {
      if (exportPath.startsWith('assets/node_modules/') && !/\.(?:png|jpe?g|webp|gif|svg|ttf|woff2?)$/i.test(exportPath)) throw Error(`Non-asset dependency export: ${relative}`);
      if (/\.(?:map|log|sqlite|db|pem|key)$/i.test(relative)) throw Error(`Non-runtime export file: ${relative}`);
      const bytes = await readFile(absolute);
      files.push({path:relative.split(path.sep).join('/'), bytes:bytes.length, sha256:createHash('sha256').update(bytes).digest('hex')});
    } else throw Error(`Unsupported export entry: ${relative}`);
  }
  await visit('');
  if (!files.some(file => file.path === 'index.html')) throw Error('Build the website first: dist/index.html is missing');
  return files;
}

export async function packageWeb(root) {
  root = await realpath(root);
  const source = path.join(root, 'dist');
  await inspectExport(source);
  const version = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).version;
  if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version)) throw Error('Invalid package version');
  const releases = path.join(root, 'release');
  await mkdir(releases, {recursive:true});
  if ((await lstat(releases)).isSymbolicLink() || await realpath(releases) !== releases) throw Error('Release directory must not be linked');
  const bundle = await mkdtemp(path.join(releases, `Glass-Notes-${version}-web-`));
  await cp(source, path.join(bundle, 'site'), {recursive:true, dereference:false, errorOnExist:true, force:false});
  const files = await inspectExport(path.join(bundle, 'site'));
  const git = args => execFileSync('git', args, {cwd:root, encoding:'utf8', windowsHide:true}).trim();
  const manifest = {version, builtAt:new Date().toISOString(), sourceRevision:git(['rev-parse','HEAD']), dirty:git(['status','--porcelain','--untracked-files=normal']).length > 0, files};
  await writeFile(path.join(bundle, 'manifest.json'), JSON.stringify(manifest, null, 2)+'\n');
  await cp(path.join(root, 'docs/HOSTING.md'), path.join(bundle, 'README.md'));
  await cp(path.join(root, 'deploy/Caddyfile.example'), path.join(bundle, 'Caddyfile.example'));
  await cp(path.join(root, 'LICENSE'), path.join(bundle, 'LICENSE'));
  await cp(path.join(root, 'THIRD_PARTY_NOTICES.md'), path.join(bundle, 'THIRD_PARTY_NOTICES.md'));
  const archive = `${bundle}.tar.gz`;
  execFileSync('tar', ['-czf', archive, '-C', bundle, '.'], {cwd:root, windowsHide:true});
  const sha256 = createHash('sha256').update(await readFile(archive)).digest('hex');
  await writeFile(`${archive}.sha256`, `${sha256}  ${path.basename(archive)}\n`);
  return {bundle, archive, sha256, files:files.length, dirty:manifest.dirty};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await packageWeb(fileURLToPath(new URL('../', import.meta.url))), null, 2));
}
