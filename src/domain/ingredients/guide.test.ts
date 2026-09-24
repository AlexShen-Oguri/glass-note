import assert from 'node:assert/strict';
import test from 'node:test';
import {LOCALES, type Ingredient, type Localized} from '../contracts';
import {ingredientFamily} from './guide';

const material = (name:string):Ingredient => ({id:name.replace(/ /g,'-'),name:Object.fromEntries(LOCALES.map(l=>[l,name])) as Localized,compositionKnown:false,exclusionTags:[]});
test('food illustration families do not confuse embedded liquid or dairy words',()=>{
  for (const [name,family] of [['eggplant','vegetable'],['butternut squash','vegetable'],['butterfly pea','flower'],['watermelon','melon'],['watercress','leaf'],['water chestnut','vegetable'],['wine vinegar','vinegar'],['sherry vinegar','vinegar'],['sugar apple','tropical'],['egg white','egg'],['orange blossom water','water']] as const) {
    assert.equal(ingredientFamily(material(name)),family,name);
  }
});
test('common food names are not mistaken for drinks or aromatic substrings',()=>{
  for(const [name,family] of [['kale','leaf'],['chocolate','cocoa'],['dark chocolate','cocoa'],['milk chocolate','cocoa'],['chocolate sauce','sauce'],['cocoa paste','cocoa'],['sheep’s milk cheese','cheese'],['nectarine','stone-fruit'],['rosemary','herb'],['cauliflower','vegetable'],['sunflower seed','seed'],['honeydew melon','melon'],['banana pepper','pepper'],['corn salad','leaf']] as const){
    assert.equal(ingredientFamily(material(name)),family,name);
  }
});
