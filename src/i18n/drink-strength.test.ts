import assert from 'node:assert/strict';
import test from 'node:test';
import {LOCALES} from '../domain/contracts';

test('drink strength explains estimates, missing inputs and serving style in all eight locales',async()=>{
  const copy=await import('./drink-strength').catch(()=>assert.fail('Drink strength copy is missing'));
  for(const locale of LOCALES){
    for(const key of copy.drinkStrengthKeys){
      const value=copy.drinkStrengthText(locale,key,{name:'Gin',market:'UK',date:'2026-10-23'});
      assert.ok(value.trim(),`${locale}.${key} is blank`);
      assert.doesNotMatch(value,/\{[^}]+\}/,`${locale}.${key} has unresolved interpolation`);
    }
  }
  assert.equal(copy.drinkStrengthText('en','title'),'Alcohol & serving style');
  assert.equal(copy.drinkStrengthText('en','details'),'Calculation & assumptions');
  assert.equal(copy.drinkStrengthText('en','short'),'Short drink');
  assert.equal(copy.drinkStrengthText('en','long'),'Long drink');
  assert.match(copy.drinkStrengthText('en','editorialAssumption'),/assumption/i);
  assert.match(copy.drinkStrengthText('en','incomplete'),/unknown|missing/i);
  assert.match(copy.drinkStrengthText('en','formatEditorial'),/editorial/i);
  assert.doesNotMatch(copy.drinkStrengthText('en','incomplete'),/0%/);
});

test('drink strength labels optional inclusion and saved batch values without claiming manual input',async()=>{
  const copy=await import('./drink-strength');
  assert.ok(copy.drinkStrengthKeys.some(key=>key==='includeOptional'),'Optional liquid inclusion label is missing');
  assert.match(copy.drinkStrengthText('en','userInput'),/saved batch value/i);
  assert.doesNotMatch(copy.drinkStrengthText('en','userInput'),/^Explicit user input$/);
});
