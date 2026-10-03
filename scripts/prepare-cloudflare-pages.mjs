import {cp, lstat, mkdir, mkdtemp, readFile, realpath, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectExport} from './package-web.mjs';

const dependencyPrefix = 'assets/node_modules/';
const publicPrefix = 'assets/vendor-dependencies/';
const assetRewrite = '/assets/node_modules/* /assets/vendor-dependencies/:splat 200';

// Pages ignores every directory named node_modules, including Expo's public assets.
// Keep the original export and bundle URLs intact; adapt only the upload directory.
export async function prepareCloudflarePages(root, sourceDirectory = 'dist') {
  root = await realpath(root);
  const source = path.resolve(root, sourceDirectory);
  const relative = path.relative(root, source);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw Error('Export must be inside the project');
  const sourceFiles = await inspectExport(source);
  const dependencyFiles = sourceFiles.filter(file => file.path.startsWith(dependencyPrefix));
  if (dependencyFiles.length && sourceFiles.some(file => file.path.startsWith(publicPrefix))) throw Error('Reserved Pages asset directory already exists');
  const existingRedirects = sourceFiles.some(file => file.path === '_redirects') ? await readFile(path.join(source, '_redirects'), 'utf8') : '';
  if (dependencyFiles.length && existingRedirects.includes('/assets/node_modules/')) throw Error('Dependency asset redirects already exist');
  const releases = path.join(root, 'release');
  await mkdir(releases, {recursive:true});
  if ((await lstat(releases)).isSymbolicLink() || await realpath(releases) !== releases) throw Error('Release directory must not be linked');
  const bundle = await mkdtemp(path.join(releases, 'Glass-Notes-cloudflare-'));
  const site = path.join(bundle, 'site');
  await cp(source, site, {recursive:true, dereference:false, errorOnExist:true, force:false});
  if (dependencyFiles.length) {
    await rename(path.join(site, 'assets', 'node_modules'), path.join(site, 'assets', 'vendor-dependencies'));
    await writeFile(path.join(site, '_redirects'), `${assetRewrite}\n${existingRedirects}`);
  }
  const files = await inspectExport(site);
  if (files.some(file => file.path.split('/').includes('node_modules'))) throw Error('Pages would omit a nested dependency asset directory');
  for (const file of sourceFiles) {
    if (file.path === '_redirects' && dependencyFiles.length) continue;
    const target = file.path.startsWith(dependencyPrefix) ? file.path.replace(dependencyPrefix, publicPrefix) : file.path;
    if (!files.some(item => item.path === target && item.sha256 === file.sha256)) throw Error(`Changed export content: ${file.path}`);
  }
  const manifest = {sourceDirectory:relative.split(path.sep).join('/'), dependencyAssetCount:dependencyFiles.length, files};
  await writeFile(path.join(bundle, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return {site, files:files.length, dependencyAssetCount:dependencyFiles.length};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 3) throw Error('Usage: node scripts/prepare-cloudflare-pages.mjs [export-directory]');
  console.log(JSON.stringify(await prepareCloudflarePages(process.cwd(), process.argv[2] || 'dist'), null, 2));
}
