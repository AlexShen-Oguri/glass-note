import type {Localized} from '../domain/contracts';
import {catalogue} from './catalogue';
import {competitionTopics} from './competition-topics';
import {competitionExtensionTopics} from './topics-extension-competitions';
import {barExtensionTopics} from './topics-extension-bars';
export interface ResearchMaterial {name:Localized;amount?:string}
export interface ResearchPreparation {id:string;name:Localized;ingredients:ResearchMaterial[];method:string[]}
export interface ResearchWork {
  /** When promoted, this research record and catalogue version are one work. */
  catalogueVersionId?:string;
  id:string;title:string;author:string;year?:number;bar?:string;region?:string;award?:string;
  materials:Localized[]|ResearchMaterial[];original?:string;method?:string[];
  disclosure?:'identity-only'|'ingredients-only'|'published-recipe';summary?:Localized;
  preparations?:ResearchPreparation[];missingDetails?:Localized[];
  source?:{title:string;url:string;checkedAt:string};
}
export interface ResearchTopic {
  kind?:'competition'|'bar';
  countries?:string[];
  venue?:{name:string;city:string;country:string};
  id:string;competition:string;organization?:string;year:number;yearEnd?:number;region:string;scope:'published-finalist-works'|'national-finalists'|'regional-winners'|'winner-recipes'|'bar-recipes';
  officialCount:number|null;versionIds:string[];source:{title:string;url:string;publishedAt?:string;checkedAt:string};
  research?:ResearchWork[];
}
export const researchTopics:ResearchTopic[]=[
  ...competitionExtensionTopics,
  ...barExtensionTopics,
  ...[2025,2024,2023].map(year=>{
    const url=`https://www.suntory.co.jp/wnb/event/award/result_${year}.html`;
    return {id:`suntory-${year}`,competition:year===2025?'Suntory The Bartender Award':'Suntory The Cocktail Award',year,region:'Japan' as const,scope:'published-finalist-works' as const,officialCount:year===2023?12:8,
      versionIds:catalogue.versions.filter(v=>catalogue.sources.find(s=>s.id===v.sourceId)?.url===url).map(v=>v.id),
      source:{title:`Suntory ${year} · official finalist works`,url,checkedAt:'2026-09-08'}};
  }),
  ...competitionTopics.map(topic=>topic.id==='patron-perfectionists-2018-selection'?{
    ...topic,versionIds:[...topic.versionIds,'dauntless-dessert-batch-l','godfathers-affinity-batch-l'],
    research:topic.research?.map(work=>{
      const catalogueVersionId=work.id==='patron-2018-dauntless-dessert'?'dauntless-dessert-batch-l':work.id==='patron-2018-godfathers-affinity'?'godfathers-affinity-batch-l':undefined;
      return catalogueVersionId?{...work,catalogueVersionId}:work;
    }),
  }:topic),
];
