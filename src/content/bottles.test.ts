import assert from 'node:assert/strict';
import test from 'node:test';
import {LOCALES} from '../domain/contracts';
import {bottleBrands, bottles, roundEightNewBrandIds} from './bottles';
import {catalogue} from './catalogue';

const brandById = new Map(bottleBrands.map((brand) => [brand.id, brand]));
const allowedIngredientIds = new Set(catalogue.ingredients.map(i=>i.id));

test('round-eight clears the approved bottle and brand coverage', () => {
  assert.ok(bottles.length >= 70, 'expected at least 70 products, got ' + bottles.length);
  assert.ok(roundEightNewBrandIds.length >= 53, 'expected at least 53 new brands, got ' + roundEightNewBrandIds.length);
  assert.equal(new Set(roundEightNewBrandIds).size, roundEightNewBrandIds.length);
  assert.ok(roundEightNewBrandIds.every((brandId) => bottles.some((bottle) => bottle.brandId === brandId)));
});

test('every product has one canonical brand, exact material references, and an audit source', () => {
  assert.equal(new Set(bottles.map((bottle) => bottle.id)).size, bottles.length);
  for (const bottle of bottles) {
    const brand = brandById.get(bottle.brandId);
    assert.ok(brand, 'missing brand record for ' + bottle.id);
    assert.equal(bottle.brandName, brand.name);
    assert.ok(bottle.ingredientIds.length > 0);
    for (const ingredientId of bottle.ingredientIds) {
      assert.ok(allowedIngredientIds.has(ingredientId), 'unmapped ingredient ' + ingredientId + ' on ' + bottle.id);
      assert.ok(brand.ingredientIds.includes(ingredientId), bottle.id + ' is not represented by ' + bottle.brandId);
    }
    assert.match(bottle.source.url, /^https:\/\//);
    assert.ok(bottle.source.title.length > 0);
    assert.match(bottle.source.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(new Date(bottle.source.checkedAt).toISOString().slice(0,10),bottle.source.checkedAt);
    assert.ok(['producer','retailer','identity'].includes(bottle.profileBasis));
    if(bottle.profileBasis==='identity')assert.ok(bottle.sourceKind,'expanded type-only records must state their source kind');
    assert.equal(bottle.market.length > 0, true);
    assert.ok(bottle.abv === null || (bottle.abv > 0 && bottle.abv <= 100));
    if(bottle.profileBasis==='producer')assert.ok(bottle.flavours.length > 0);
    assert.ok(bottle.flavours.every((flavour) => flavour === flavour.toLowerCase()));
    for (const locale of LOCALES) {
      assert.equal(typeof bottle.profile[locale], 'string');
      assert.ok(bottle.profile[locale].trim().length > 0, bottle.id + ' has empty ' + locale + ' profile');
    }
  }
});

test('expanded products keep distinct material styles and cover the approved range',()=>{
  assert.ok(bottles.length>600);
  for(const family of ['gin','rum','tequila','whiskey','vodka','brandy','mezcal','cachaca','grappa','liqueur','wine','bitters','pisco','absinthe','aquavit','genever','baijiu','shochu','soju','arrack','sake'])assert.ok(bottles.some(b=>b.family===family),`missing ${family}`);
  const product=(id:string)=>{const b=bottles.find(b=>b.id===id);assert.ok(b,id);return b;};
  assert.equal(product('plymouth-sloe-gin').family,'liqueur');
  assert.deepEqual(product('plymouth-sloe-gin').ingredientIds,['sloe-gin']);
  assert.equal(product('haymans-sloe-gin').family,'liqueur');
  assert.deepEqual(product('haymans-sloe-gin').ingredientIds,['sloe-gin']);
  for(const [id,material] of [['glenfiddich-12','single-malt-scotch-whisky'],['jack-daniels-old-no7','tennessee-whiskey'],['yamazaki-12','japanese-whisky'],['lairds-straight-applejack','applejack'],['bacardi-superior-carta-blanca','neutral-white-rum'],['crown-royal-deluxe','food-generic-whisky']])assert.deepEqual(product(id!).ingredientIds,[material]);
  assert.deepEqual(product('fee-brothers-celery-bitters').ingredientIds,['celery-bitters']);
  assert.equal(product('fee-brothers-celery-bitters').abv,null,'conflicting 0-proof retailer claim must not become an alcohol-free claim');
  const macallan=bottles.find(b=>/macallan-12-year-old-double-cask/.test(b.id));assert.ok(macallan);
  assert.deepEqual(macallan.ingredientIds,['single-malt-scotch-whisky']);
  for(const id of ['shochu','soju','baijiu','celery-bitters','sloe-gin','single-malt-scotch-whisky']){
    const material=catalogue.ingredients.find(i=>i.id===id);assert.ok(material,id);
    assert.equal(material.compositionKnown,false,'bottle identity is not a complete composition/allergen audit');
  }
});

test('brand registry has no duplicate IDs or names', () => {
  assert.equal(new Set(bottleBrands.map((brand) => brand.id)).size, bottleBrands.length);
  assert.equal(new Set(bottleBrands.map((brand) => brand.name)).size, bottleBrands.length);
});
