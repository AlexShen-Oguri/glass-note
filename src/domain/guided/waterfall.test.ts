import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../../content/catalogue';
import {waterfallPreview} from './waterfall';

test('large catalogue previews are bounded and recommendations are brought into view', () => {
  const ids = ['zombie', 've-n-to', 'angel-face'];
  const preview = waterfallPreview(catalogue.cocktails, ids);
  assert.ok(preview.length <= 24);
  assert.deepEqual(preview.slice(0, 3).map(c => c.id), ids);
  assert.equal(new Set(preview.map(c => c.id)).size, preview.length);
  assert.ok(catalogue.cocktails.length > 24);
  assert.deepEqual(waterfallPreview([]), []);
  assert.equal(waterfallPreview(catalogue.cocktails.slice(0, 2)).length, 2);
});
