import assert from 'node:assert/strict';
import test from 'node:test';
import type {LabIngredient,LabVersion} from '../lab/types';
import {alignLabIngredients} from './lab-comparison';

const ingredient=(id:string,name:string,ingredientId?:string):LabIngredient=>({id,name,amount:'1',unit:'oz',ingredientId});
const version=(id:string,ingredients:LabIngredient[]):Pick<LabVersion,'id'|'ingredients'>=>({id,ingredients});

test('aligns stable material ids, preserves first-version order and marks later-only rows missing',()=>{
  const gin=ingredient('a-gin','Gin','gin');
  const citrus=ingredient('a-citrus','Lemon juice','lemon');
  const renamedGin=ingredient('b-gin','Tanqueray London Dry','gin');
  const syrup=ingredient('b-syrup','Simple syrup','simple-syrup');
  const rows=alignLabIngredients([
    version('a',[gin,citrus]),
    version('b',[renamedGin,syrup]),
  ]);

  assert.deepEqual(rows.map(row=>row.label),['Gin','Lemon juice','Simple syrup']);
  assert.equal(rows[0]?.cells[0],gin);
  assert.equal(rows[0]?.cells[1],renamedGin);
  assert.equal(rows[1]?.cells[1],null);
  assert.equal(rows[2]?.cells[0],null);
  assert.equal(rows[2]?.cells[1],syrup);
});

test('keeps duplicate occurrences in source order instead of collapsing quantities',()=>{
  const first=ingredient('a-1','Lime in shaker','lime');
  const second=ingredient('a-2','Lime float','lime');
  const other=ingredient('b-1','Lime juice','lime');
  const rows=alignLabIngredients([version('a',[first,second]),version('b',[other])]);

  assert.equal(rows.length,2);
  assert.equal(rows[0]?.cells[1],other);
  assert.equal(rows[1]?.cells[0],second);
  assert.equal(rows[1]?.cells[1],null);
});

test('aligns normalized name-only materials but never assumes unnamed rows are equivalent',()=>{
  const namedA=ingredient('a-named','  House   cordial  ');
  const unnamedA=ingredient('a-empty','');
  const namedB=ingredient('b-named','house cordial');
  const unnamedB=ingredient('b-empty','');
  const rows=alignLabIngredients([version('a',[namedA,unnamedA]),version('b',[namedB,unnamedB])]);

  assert.equal(rows.length,3);
  assert.equal(rows[0]?.cells[1],namedB);
  assert.equal(rows[1]?.cells[1],null);
  assert.equal(rows[2]?.cells[0],null);
});
