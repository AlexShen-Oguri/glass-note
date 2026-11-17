import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../../domain/contracts';
import {researchTopics} from '../topics';
import {getResearchWorkView, researchWorkLocalization} from './research';

const additionalResearchRows = researchTopics
  .filter(topic => topic.id.startsWith('patron-perfectionists-') || topic.id.startsWith('world-class-us-2024-') || topic.id.startsWith('angostura-'))
  .flatMap(topic => topic.research ?? []);

const row = (id: string) => additionalResearchRows.find(work => work.id === id)!;
const values = (value: string) => value.replace(/[～~]/g, '–');
const numbers = (value: string) => value.match(/\d+(?:\.\d+)?/g) ?? [];
const units = (value: string) => value.match(/(?<![A-Za-z])(?:1:4|ml|oz|lb|tbsp|tsp|L|g)(?![A-Za-z])/g) ?? [];

test('maidenhair fern remains the exact source anchor with dried form and unspecified species in all eight reading languages',()=>{
  const selection=JSON.parse(readFileSync(new URL('../../../research/competitions/recipe-selection.json',import.meta.url),'utf8')) as {works:Array<{id:string;url:string;sourceIngredients?:Array<{name:string;amount:string;species?:null}>}>};
  const source=selection.works.find(work=>work.id==='patron-2018-balancing-act')!,fact=source.sourceIngredients![0]!;
  assert.equal(fact.species,null);
  const sourceTerm=fact.name.replace(/^Dried /,'');
  const dried={en:/\bDried\b/i,zh:/干燥/,fr:/séchée/i,de:/getrocknet/i,es:/seco/i,ko:/말린/,ja:/乾燥/,it:/essiccato/i};
  const unspecified={en:/species unspecified/i,zh:/植物种未注明/,fr:/espèce non précisée/i,de:/Art nicht angegeben/i,es:/especie no indicada/i,ko:/종 미지정/,ja:/種は未記載/,it:/specie non precisata/i};
  const work=row(source.id),original=getResearchWorkView(work,'en',true);
  assert.equal(original.source?.url,source.url);
  for(const locale of LOCALES){
    const view=getResearchWorkView(work,locale),fern=view.preparations!.find(preparation=>preparation.id==='sirop-capillaire')!.ingredients[2]!;
    assert(fern.name.includes(sourceTerm),`source common name lost in ${locale}`);
    assert.match(fern.name,dried[locale],`dried form lost in ${locale}`);
    assert.match(fern.name,unspecified[locale],`species uncertainty lost in ${locale}`);
    assert.equal(fern.amount,fact.amount);
    assert.equal(view.source?.url,source.url);
  }
});

test('Cyanocitta and Maestranza reading ingredients preserve source whole, dried, fine, granulated and white forms',()=>{
  const forms={
    en:{dried:/dried/i,whole:/whole/i,fine:/fine/i,granulated:/granulated/i,white:/white/i},
    zh:{dried:/干燥/,whole:/完整/,fine:/细/,granulated:/颗粒/,white:/白/},
    fr:{dried:/séchés/i,whole:/entiers/i,fine:/fin/i,granulated:/granulé/i,white:/blanc/i},
    de:{dried:/getrocknete/i,whole:/ganze/i,fine:/feiner/i,granulated:/Kristallzucker/i,white:/weißer|weiße/i},
    es:{dried:/secos/i,whole:/enteros/i,fine:/fino/i,granulated:/granulado/i,white:/blanco|blanca/i},
    ko:{dried:/말린/,whole:/통|전체/,fine:/고운/,granulated:/과립/,white:/흰|백/},
    ja:{dried:/乾燥/,whole:/丸ごと|ホール/,fine:/細かい/,granulated:/グラニュー糖/,white:/白/},
    it:{dried:/essiccati/i,whole:/interi/i,fine:/fine/i,granulated:/granulato/i,white:/bianco/i},
  };
  for(const locale of LOCALES){
    const cyanocitta=getResearchWorkView(row('patron-2018-cyanocitta'),locale).preparations!.find(preparation=>preparation.id==='szechuan-lime-oleo')!;
    const maestranza=getResearchWorkView(row('patron-2018-maestranza'),locale).preparations!.find(preparation=>preparation.id==='guava-cordial')!;
    const pepper=cyanocitta.ingredients[1]!,whitePepper=cyanocitta.ingredients[2]!,fineSugar=cyanocitta.ingredients[4]!,sugar=maestranza.ingredients[1]!;
    for(const form of ['dried','whole'] as const)assert.match(pepper.name,forms[locale][form],`Szechuan ${form} lost in ${locale}`);
    for(const form of ['whole','white'] as const)assert.match(whitePepper.name,forms[locale][form],`white pepper ${form} lost in ${locale}`);
    for(const form of ['fine','granulated','white'] as const)assert.match(fineSugar.name,forms[locale][form],`oleo sugar ${form} lost in ${locale}`);
    for(const form of ['granulated','white'] as const)assert.match(sugar.name,forms[locale][form],`cordial sugar ${form} lost in ${locale}`);
    assert.equal(pepper.amount?.match(/\d+ tbsp/)?.[0],'4 tbsp');assert.equal(whitePepper.amount?.match(/\d+ tbsp/)?.[0],'1 tbsp');
    assert.equal(fineSugar.amount,'300 g');assert.deepEqual(numbers(sugar.amount!),['3']);
  }
});

test('the language overlay covers every retained and newly published competition recipe', () => {
  assert.equal(additionalResearchRows.length, 16);
  assert.deepEqual(new Set(Object.keys(researchWorkLocalization)), new Set(additionalResearchRows.map(work => work.id)));
  for (const work of additionalResearchRows) {
    for (const locale of LOCALES) {
      const view = getResearchWorkView(work, locale);
      assert.ok(view.region, `${work.id} region missing in ${locale}`);
      assert.ok(view.stage, `${work.id} stage missing in ${locale}`);
      assert.ok(view.summary, `${work.id} summary missing in ${locale}`);
      if(work.missingDetails?.length) assert.ok(view.missingDetails?.length, `${work.id} source gap missing in ${locale}`);
      else if(work.id!=='patron-2018-dauntless-dessert') assert.ok(!view.missingDetails?.length,`${work.id} acquired a source gap in ${locale}`);
    }
  }
});

test('Dauntless retains its existing unspecified spirit, garnish and storage source notes',()=>{
  for(const locale of LOCALES) assert.equal(getResearchWorkView(row('patron-2018-dauntless-dessert'),locale).missingDetails?.length,3);
});

test('Maestranza carries the source pressure warning in the displayed bottling step', () => {
  const work = row('patron-2018-maestranza');
  const warning = {en:/pressure.*rupture/i,zh:/压力.*爆裂/,fr:/pression.*éclater/i,de:/Druck.*platzen/i,es:/presión.*reventar/i,ko:/압력.*파열/,ja:/圧力.*破裂/,it:/pressione.*scoppiare/i};
  const bottling = (view: ReturnType<typeof getResearchWorkView>) =>
    view.preparations!.find(preparation => preparation.id === 'fermented-papaya-juice')!.method[1]!;
  for (const locale of LOCALES) assert.match(bottling(getResearchWorkView(work, locale)), warning[locale]);
  assert.match(bottling(getResearchWorkView(work, 'en', true)), warning.en);
});

test('all 16 published recipes translate their facts and retain every number and unit dimension', () => {
  const published = additionalResearchRows.filter(work => work.disclosure === 'published-recipe');
  assert.equal(published.length, 16);
  for (const work of published) {
    assert.ok(work.method?.length);
    for (const locale of LOCALES) {
      const view = getResearchWorkView(work, locale);
      assert.equal(view.materials.length, work.materials.length);
      assert.equal(view.method?.length, work.method?.length);
      if (locale !== 'en') assert.notEqual(view.summary, getResearchWorkView(work, 'en').summary, `${work.id} summary copied English in ${locale}`);
      if(locale!=='en') for(const [index,step] of (view.method??[]).entries()) assert.notEqual(step,getResearchWorkView(work,'en').method?.[index],`${work.id} method copied English in ${locale}`);
      for (const [index, source] of work.materials.entries()) {
        const sourceAmount = 'name' in source ? source.amount : undefined;
        const translatedAmount = view.materials[index]?.amount;
        if (sourceAmount !== undefined) {
          assert.ok(translatedAmount, `${work.id} amount ${index} missing in ${locale}`);
          assert.deepEqual(numbers(translatedAmount!), numbers(sourceAmount), `${work.id} amount numbers changed in ${locale}`);
          assert.deepEqual(units(translatedAmount!), units(sourceAmount), `${work.id} amount dimensions changed in ${locale}`);
        }
      }
      for (let prepIndex = 0; prepIndex < (work.preparations ?? []).length; prepIndex += 1) {
        const sourcePrep = work.preparations![prepIndex]!;
        const prep = view.preparations?.[prepIndex];
        assert.ok(prep);
        assert.equal(prep?.ingredients.length, sourcePrep.ingredients.length);
        assert.equal(prep?.method.length, sourcePrep.method.length);
        for (const [ingredientIndex, sourceIngredient] of sourcePrep.ingredients.entries()) {
          const sourceAmount = sourceIngredient.amount;
          const translatedAmount: string | undefined = prep?.ingredients[ingredientIndex]?.amount;
          if (sourceAmount !== undefined) {
            assert.ok(translatedAmount, `${work.id}/${sourcePrep.id} amount missing in ${locale}`);
            assert.deepEqual(numbers(translatedAmount!), numbers(sourceAmount), `${work.id}/${sourcePrep.id} numbers changed in ${locale}`);
            assert.deepEqual(units(translatedAmount!), units(sourceAmount), `${work.id}/${sourcePrep.id} dimensions changed in ${locale}`);
          }
        }
      }
    }
  }
});

test('published timings and the deliberately underspecified 1:4 ratio survive localization', () => {
  const dauntless = row('patron-2018-dauntless-dessert');
  const heights = row('world-class-us-2024-such-great-heights');
  const apples = row('world-class-us-2024-apples-for-whales');
  for (const locale of LOCALES) {
    const dauntlessView = getResearchWorkView(dauntless, locale);
    const dauntlessFacts = values([...(dauntlessView.method ?? []), ...(dauntlessView.preparations ?? []).flatMap(prep => prep.method)].join(' '));
    assert.match(dauntlessFacts, /15–20/);
    assert.match(dauntlessFacts, /24–48/);
    assert.match(dauntlessFacts, /5–8/);

    const heightsView = getResearchWorkView(heights, locale);
    const ratio = heightsView.preparations?.[0]?.ingredients[0]?.amount ?? '';
    assert.match(ratio, /1:4/);
    assert.match(values(heightsView.preparations?.[0]?.method.join(' ') ?? ''), /1:4/);

    const applesView = getResearchWorkView(apples, locale);
    assert.match(values([...(applesView.method ?? []), ...(applesView.preparations ?? []).flatMap(prep => prep.method)].join(' ')), /48/);
  }
});

test('original mode exposes canonical source facts for new and retained recipes', () => {
  const dauntless = row('patron-2018-dauntless-dessert');
  const originalDauntless = getResearchWorkView(dauntless, 'zh', true);
  assert.deepEqual(originalDauntless.method, dauntless.method);
  assert.deepEqual(originalDauntless.preparations?.[0]?.method, dauntless.preparations?.[0]?.method);
  assert.equal(originalDauntless.materials[0]?.name, 'Patrón Reposado');

  for (const work of additionalResearchRows) {
    for (const locale of LOCALES) {
      const original = getResearchWorkView(work, locale, true);
      assert.deepEqual(original.method,work.method);
      assert.equal(original.source?.url,work.source?.url);
      assert.deepEqual(original.materials.map(material=>material.name),work.materials.map(material=>'name' in material?material.name.en:material.en));
    }
  }
});

test('new recipe translations preserve every preparation timing and source-specific measure',()=>{
  const timed:[string,RegExp[]][]=[
    ['patron-2018-wind',[/1/]],['patron-2018-harmony',[/10/,/24/]],
    ['patron-2018-best-promise',[/60/]],['patron-2018-cyanocitta',[/6/,/20/,/2/]],
    ['patron-2018-balancing-act',[/45/,/1.25/]],['patron-2018-maestranza',[/8[–~-]10/,/48/,/3/,/2/]],
    ['angostura-2014-olympia',[/1/,/5/]],
  ];
  for(const [id,patterns] of timed) for(const locale of LOCALES){
    const view=getResearchWorkView(row(id),locale);
    const facts=values([...(view.method??[]),...(view.preparations??[]).flatMap(preparation=>preparation.method)].join(' '));
    for(const pattern of patterns) assert.match(facts,pattern,`${id} timing/measure changed in ${locale}`);
  }
});

test('view generation never mutates canonical research rows', () => {
  const snapshot = JSON.stringify(additionalResearchRows);
  for (const work of additionalResearchRows) {
    for (const locale of LOCALES) {
      getResearchWorkView(work, locale);
      getResearchWorkView(work, locale, true);
    }
  }
  assert.equal(JSON.stringify(additionalResearchRows), snapshot);
});
