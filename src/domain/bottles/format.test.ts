import assert from 'node:assert/strict';
import test from 'node:test';
import {bottleDisplayName,bottleSearchNames} from './format';
import type {Bottle} from './types';

const bottle=(overrides:Partial<Bottle>={}):Bottle=>({
  id:'sample',brandId:'sample-brand',brandName:'Sample House',name:'Dry Gin',aliases:['Sample Dry'],
  family:'gin',ingredientIds:['gin'],abv:40,market:'Global',flavours:[],
  profile:{en:'',zh:'',fr:'',de:'',es:'',ko:'',ja:'',it:''},
  source:{title:'Product page',url:'https://example.com/product',checkedAt:'2026-09-14'},
  profileBasis:'producer',
  ...overrides,
});

test('bottleDisplayName keeps the canonical display name when locale is omitted',()=>{
  const value=bottle({nameTranslations:{zh:{name:'样品屋干金酒',basis:'producer',sources:[]}}});
  assert.equal(bottleDisplayName(value),'Sample House Dry Gin');
});

test('bottleDisplayName uses a reviewed locale name and falls back to canonical',()=>{
  const value=bottle({nameTranslations:{zh:{name:'样品屋干金酒',basis:'producer',sources:[]}}});
  assert.equal(bottleDisplayName(value,'zh'),'样品屋干金酒');
  assert.equal(bottleDisplayName(value,'ja'),'Sample House Dry Gin');
});

test('bottleSearchNames includes aliases and every translated name',()=>{
  const value=bottle({nameTranslations:{
    zh:{name:'样品屋干金酒',basis:'producer',sources:[]},
    ja:{name:'サンプル・ドライジン',basis:'editorial',sources:[]},
  }});
  assert.deepEqual(bottleSearchNames(value),[
    'Sample House Dry Gin','Sample House','Dry Gin','Sample Dry','样品屋干金酒','サンプル・ドライジン',
  ]);
});

test('bottleSearchNames does not repeat an equivalent brand or alias',()=>{
  const value=bottle({brandName:'Campari',name:'Campari',aliases:['campari',' CAMPARI ']});
  assert.deepEqual(bottleSearchNames(value),['Campari']);
});
