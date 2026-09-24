import {LOCALES} from '../domain/contracts';
import type {Locale,Localized} from '../domain/contracts';
import type {PreparationCard,RecipePreparation} from '../domain/preparations/types';
import {getResearchWorkView} from './localization/research';
import {roundElevenTopics} from './topics-eleven';
import type {ResearchWork} from './topics';

const checkedAt='2026-09-16';
const patronTopic=roundElevenTopics.find(topic=>topic.id==='patron-perfectionists-2018-selection');
if(!patronTopic) throw new Error('Missing Patrón Perfectionists 2018 research topic');

const researchWork=(id:string):ResearchWork=>{
  const work=patronTopic.research?.find(item=>item.id===id);
  if(!work) throw new Error(`Missing Patrón research work: ${id}`);
  return work;
};

type ResearchView=ReturnType<typeof getResearchWorkView>;
type ViewRecord=Record<Locale,ResearchView>;

const views=(work:ResearchWork):ViewRecord=>Object.fromEntries(
  LOCALES.map(locale=>[locale,getResearchWorkView(work,locale)]),
) as ViewRecord;
const localize=(record:ViewRecord,select:(view:ResearchView)=>string):Localized=>Object.fromEntries(
  LOCALES.map(locale=>[locale,select(record[locale])]),
) as Localized;
const localizeMany=(record:ViewRecord,count:number,select:(view:ResearchView,index:number)=>string):Localized[]=>
  Array.from({length:count},(_,index)=>localize(record,view=>select(view,index)));

const dauntlessWork=researchWork('patron-2018-dauntless-dessert');
const godfathersWork=researchWork('patron-2018-godfathers-affinity');
const dauntlessViews=views(dauntlessWork);
const godfathersViews=views(godfathersWork);

const source=(work:ResearchWork)=>({title:work.source!.title,url:work.source!.url});
const ingredientLine=(record:ViewRecord,preparationIndex:number,ingredientIndex:number):Localized=>localize(record,view=>{
  const item=view.preparations![preparationIndex]!.ingredients[ingredientIndex]!;
  return item.amount ? `${item.amount} ${item.name}` : item.name;
});
const preparationTitle=(record:ViewRecord,index:number):Localized=>localize(record,view=>view.preparations![index]!.name);
const preparationSteps=(record:ViewRecord,index:number):Localized[]=>{
  const count=record.en.preparations![index]!.method.length;
  return localizeMany(record,count,(view,stepIndex)=>view.preparations![index]!.method[stepIndex]!);
};
const missingDetail=(record:ViewRecord,index:number):Localized=>localize(record,view=>view.missingDetails![index]!);

const batchYieldAndStorage=missingDetail(dauntlessViews,2);
const dauntlessCards:PreparationCard[]=[
  {
    id:'dauntless-grapefruit-oleo-acid',ingredientId:'grapefruit-oleo-acid',title:preparationTitle(dauntlessViews,0),
    role:'prepared-ingredient',status:'disclosed',
    inputs:Array.from({length:4},(_,index)=>ingredientLine(dauntlessViews,0,index)),
    steps:preparationSteps(dauntlessViews,0),
    timing:localize(dauntlessViews,view=>view.preparations![0]!.method[1]!.match(/24[^,.。]*/)?.[0] ?? view.preparations![0]!.method[1]!),
    gaps:[batchYieldAndStorage],sources:[source(dauntlessWork)],
  },
  {
    id:'dauntless-black-tea-syrup',ingredientId:'black-tea-syrup',title:preparationTitle(dauntlessViews,1),
    role:'prepared-ingredient',status:'disclosed',
    inputs:Array.from({length:3},(_,index)=>ingredientLine(dauntlessViews,1,index)),
    steps:preparationSteps(dauntlessViews,1),
    timing:localize(dauntlessViews,view=>view.preparations![1]!.method[0]!.match(/5[^,.。]*/)?.[0] ?? view.preparations![1]!.method[0]!),
    gaps:[batchYieldAndStorage],sources:[source(dauntlessWork)],
  },
  {
    id:'dauntless-bergamot-spirits',ingredientId:'bergamot-spirits',
    title:localize(dauntlessViews,view=>view.materials[3]!.name),role:'prepared-ingredient',status:'undisclosed',
    inputs:[],steps:[],gaps:[missingDetail(dauntlessViews,0)],sources:[source(dauntlessWork)],
  },
];

const undisclosedGodfatherCard=(id:string,ingredientId:string,materialIndex:number,gapIndex:number):PreparationCard=>({
  id,ingredientId,title:localize(godfathersViews,view=>view.materials[materialIndex]!.name),
  role:'prepared-ingredient',status:'undisclosed',inputs:[],steps:[],
  gaps:[missingDetail(godfathersViews,gapIndex)],sources:[source(godfathersWork)],
});

const godfathersCards:PreparationCard[]=[
  undisclosedGodfatherCard('godfathers-coriander-seed-soda','coriander-seed-soda',2,0),
  undisclosedGodfatherCard('godfathers-pickled-dry-crab-apple-reduction','pickled-dry-crab-apple-reduction',3,1),
  undisclosedGodfatherCard('godfathers-lime-zest-spray','lime-zest-spray',5,2),
  undisclosedGodfatherCard('godfathers-apple-crisp','apple-crisp',6,2),
];

export const patronExtensionPreparations:RecipePreparation[]=[
  {
    versionId:'dauntless-dessert-batch-l',status:'partial',
    summary:localize(dauntlessViews,view=>view.summary!),
    gaps:[missingDetail(dauntlessViews,0),batchYieldAndStorage],cards:dauntlessCards,checkedAt,
  },
  {
    versionId:'godfathers-affinity-batch-l',status:'partial',
    summary:localize(godfathersViews,view=>view.summary!),
    gaps:localizeMany(godfathersViews,3,(view,index)=>view.missingDetails![index]!),cards:godfathersCards,checkedAt,
  },
];

export default patronExtensionPreparations;
