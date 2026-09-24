import assert from 'node:assert/strict';
import test from 'node:test';

import {LOCALES, type Locale} from '../domain/contracts';
import type {ResearchTopic} from './topics';
import {buildTopicDirectory, directoryCountries, directoryPage, filterTopicDirectory, topicCountries, topicKind, uniqueWorkCount} from '../domain/research/directory';
import {TOPIC_DIRECTORY_KEYS, topicCountryText, topicDirectoryText} from '../i18n/topic-directory';

const localized = (value: string) => Object.fromEntries(['en','zh','fr','de','es','ko','ja','it'].map((locale) => [locale, value])) as Record<Locale, string>;
const catalogue = {
  versions: [
    {id: 'v-one-a', cocktailId: 'one'},
    {id: 'v-one-b', cocktailId: 'one'},
    {id: 'v-two', cocktailId: 'two'},
  ],
  cocktails: [
    {id: 'one', name: localized('First Work'), aliases: ['Premier Work']},
    {id: 'two', name: localized('Second Work'), aliases: []},
  ],
};

const source = {title: 'Official', url: 'https://example.com', checkedAt: '2026-09-15'};
const topics: ResearchTopic[] = [
  {id:'legacy',competition:'World Class US',year:2024,region:'United States',scope:'winner-recipes',officialCount:null,versionIds:['v-one-a','v-one-b'],source,
    research:[{id:'recorded-work',title:'Such Great Heights',author:'A',materials:[]}]},
  {id:'global',competition:'Global Final',year:2023,region:'Global · finalists',scope:'regional-winners',officialCount:2,versionIds:['v-two'],source},
  {id:'bar',kind:'bar',countries:['GB'],venue:{name:'Night Jar',city:'London',country:'United Kingdom'},competition:'Night Jar archive',year:0,region:'London',scope:'bar-recipes',officialCount:null,versionIds:['v-one-a'],source,
    research:[{id:'night-work',title:'Midnight Study',author:'B',materials:[]}]},
];

test('legacy topics default to competitions and infer only supported non-global countries', () => {
  assert.equal(topicKind(topics[0]!), 'competition');
  assert.deepEqual(topicCountries(topics[0]!), ['US']);
  assert.deepEqual(topicCountries({...topics[0]!, region:'Japan'}), ['JP']);
  assert.deepEqual(topicCountries({...topics[0]!, region:'United Kingdom'}), ['GB']);
  assert.deepEqual(topicCountries({...topics[2]!, countries:undefined, region:'Unknown'}), ['GB']);
  assert.deepEqual(topicCountries({...topics[2]!, countries:undefined, venue:{name:'Bar',city:'Bangkok',country:'Thailand'}}), ['TH']);
  assert.deepEqual(topicCountries(topics[1]!), []);
  assert.deepEqual(topicCountries({...topics[1]!, countries:['ES'], research:[
    {id:'australian-finalist',title:'A',author:'A',region:'Australia',materials:[]},
    {id:'uae-finalist',title:'B',author:'B',region:'Dubai, UAE',materials:[]},
  ]}), ['AE','AU','ES']);
  assert.deepEqual(directoryCountries(buildTopicDirectory(topics, catalogue, 'en')), ['GB','US']);
});

test('directory counts unique works instead of source versions', () => {
  const entries = buildTopicDirectory(topics, catalogue, 'en');
  assert.equal(entries[0]?.workCount, 2);
  assert.equal(entries[2]?.workCount, 2);
  assert.equal(uniqueWorkCount(entries), 4);
});

test('search covers competition, year, bar city, and work names', () => {
  const entries = buildTopicDirectory(topics, catalogue, 'en');
  assert.deepEqual(filterTopicDirectory(entries, {text:'World Class'}).map((entry) => entry.topic.id), ['legacy']);
  assert.deepEqual(filterTopicDirectory(entries, {text:'2024'}).map((entry) => entry.topic.id), ['legacy']);
  assert.deepEqual(filterTopicDirectory(entries, {text:'London'}).map((entry) => entry.topic.id), ['bar']);
  assert.deepEqual(filterTopicDirectory(entries, {text:'Night Jar'}).map((entry) => entry.topic.id), ['bar']);
  assert.deepEqual(filterTopicDirectory(entries, {text:'Midnight Study'}).map((entry) => entry.topic.id), ['bar']);
  assert.deepEqual(filterTopicDirectory(entries, {text:'First Work'}).map((entry) => entry.topic.id), ['legacy','bar']);
  assert.equal(entries.find((entry) => entry.topic.id === 'bar')?.searchFields.includes('0'), false);
});

test('kind and country filters compose and empty filters recover all entries', () => {
  const entries = buildTopicDirectory(topics, catalogue, 'en');
  assert.deepEqual(filterTopicDirectory(entries, {kind:'bar',country:'GB'}).map((entry) => entry.topic.id), ['bar']);
  assert.deepEqual(filterTopicDirectory(entries, {kind:'competition',country:'GB'}), []);
  assert.equal(filterTopicDirectory(entries, {}).length, 3);
});

test('directory pagination is bounded and reports remaining topics', () => {
  const entries = buildTopicDirectory(topics, catalogue, 'en');
  assert.deepEqual(directoryPage(entries, 2), {items:entries.slice(0,2),hasMore:true});
  assert.deepEqual(directoryPage(entries, 20), {items:entries,hasMore:false});
  assert.deepEqual(directoryPage(entries, -2), {items:[],hasMore:true});
  const first = directoryPage(entries, 2);
  const complete = directoryPage(entries, 4);
  assert.deepEqual(complete.items.slice(0, first.items.length), first.items);
  assert.equal(new Set(complete.items.map((entry) => entry.topic.id)).size, complete.items.length);
});

test('directory controls and known country names have copy in all eight locales', () => {
  for (const locale of LOCALES) {
    for (const key of TOPIC_DIRECTORY_KEYS) assert.ok(topicDirectoryText(locale, key, {topics:2,works:3,count:1}).trim(), `${locale}.${key}`);
    for (const code of ['JP','US','GB','FR','DE','ES','IT','BE','NL','TH','MX','SG','AR','AU','KR','ZA','AE','HK']) assert.ok(topicCountryText(locale, code).trim(), `${locale}.${code}`);
  }
});
