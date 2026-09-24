import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';
import test from 'node:test';
import {catalogue} from './catalogue';

test('every catalogue drink ships a reviewed image and a smaller local thumbnail with reference provenance', () => {
  const assets = JSON.parse(readFileSync(new URL('../../assets/styled/manifest.json', import.meta.url), 'utf8')) as {
    id: string; file: string; thumbnailFile: string; origin: string;
    referenceUrl: string; sourceUrl: string;
    referenceReviewed: boolean; outputReviewed: boolean;
  }[];
  const expected = catalogue.cocktails.map(({id}) => id).sort();
  assert.deepEqual(assets.map(({id}) => id).sort(), expected);
  const mainIndex = readFileSync(new URL('../media/index.ts', import.meta.url), 'utf8');
  assert.ok(mainIndex.includes("import {expansionMedia} from './expansion-100'"));
  assert.ok(mainIndex.includes('...expansionMedia'));
  const index = mainIndex + readFileSync(new URL('../media/expansion-100.ts', import.meta.url), 'utf8');
  for (const asset of assets) {
    assert.equal(asset.referenceReviewed, true, `${asset.id}: unreviewed reference`);
    assert.equal(asset.outputReviewed, true, `${asset.id}: unreviewed output`);
    assert.ok(['ai-generated', 'ai-styled'].includes(asset.origin), `${asset.id}: missing creation method`);
    for (const field of ['prompt', 'originalFile', 'generatedOriginalFile', 'generatedSourceFile']) {
      assert.equal(field in asset, false, `${asset.id}: private generation metadata ${field}`);
    }
    for (const value of Object.values(asset)) {
      if (typeof value === 'string') assert.doesNotMatch(value, /^(?:[a-z]:[\\/]|\/(?:Users|home)\/)/i, `${asset.id}: local machine path`);
    }
    assert.match(asset.referenceUrl, /^https:\/\//);
    assert.match(asset.sourceUrl, /^https:\/\//);
    for (const path of [asset.file, asset.thumbnailFile]) {
      const file = new URL(`../../${path}`, import.meta.url);
      assert.deepEqual([...readFileSync(file).subarray(0, 3)], [0xff, 0xd8, 0xff], `${path}: invalid JPEG`);
      assert.ok(index.includes(`require('../../${path}')`), `${path}: not bundled`);
    }
    const bytes = (path: string) => statSync(new URL(`../../${path}`, import.meta.url)).size;
    assert.ok(bytes(asset.thumbnailFile) < bytes(asset.file), `${asset.id}: thumbnail is not smaller`);
  }
});
