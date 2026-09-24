import {CocktailOriginalName} from '../names/OriginalName';
import React,{useState} from 'react';
import {Text,View} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {researchTopics,type ResearchWork} from '../../content/topics';
import {round17ReviewFor} from '../../content/round17-research';
import {getResearchWorkView,type ResearchMaterialView} from '../../content/localization/research';
import {catalogue} from '../../content/catalogue';
import {normalizeSearchText,scoreTextSearch,formatAmount} from '../../domain/search';
import {preparationStatus} from '../../domain/preparations';
import {buildTopicDirectory} from '../../domain/research/directory';
import {useApp} from '../../platform/AppProvider';
import {useFavorites} from '../../platform/FavoritesProvider';
import {labText} from '../../i18n/lab';
import {workText,type WorkspaceKey} from '../../i18n/workspace';
import {lib} from '../../i18n/library';
import {topicText} from '../../i18n/topics';
import {topicDirectoryText} from '../../i18n/topic-directory';
import {Action,Field,Fold,Panel,Workspace,ws} from './ui';
import {PreparationPanel} from '../recipe/PreparationPanel';
import {Heading} from '../navigation/Heading';
import TopicSelector from './research/TopicSelector';
import TopicDirectory from './research/TopicDirectory';
import ResearchAudit from './research/ResearchAudit';

export default function TopicsScreen(){
  const {locale,unit}=useApp();const w=(key:WorkspaceKey)=>workText(locale,key);const favorites=useFavorites();
  const params=useLocalSearchParams<{topic?:string|string[]}>();
  const routeTopic=Array.isArray(params.topic)?params.topic[0]:params.topic;
  const topic=routeTopic?researchTopics.find(item=>item.id===routeTopic):undefined;
  const [search,setSearch]=useState('');const [complete,setComplete]=useState(false);const [compare,setCompare]=useState<string[]>([]);const [showOriginal,setShowOriginal]=useState(false);
  const tokens=normalizeSearchText(search).split(' ').filter(Boolean);
  const matches=(value:string)=>!tokens.length||scoreTextSearch(search,[value])>0;
  const materialLine=(item:ResearchMaterialView)=>`${item.amount?item.amount+' · ':''}${item.name}`;
  const sourceMaterialSearch=(work:ResearchWork)=>work.materials.flatMap(item=>'name' in item?[item.name.en,item.amount??'']:[item.en]);
  const researchSearch=(work:ResearchWork,view:ReturnType<typeof getResearchWorkView>,translatedView:ReturnType<typeof getResearchWorkView>)=>[
    view.title,view.author,view.bar,view.region,view.stage,view.summary,view.original,
    ...view.materials.flatMap(item=>[item.name,item.amount??'']),...(view.method??[]),...(view.missingDetails??[]),
    ...(view.preparations??[]).flatMap(prep=>[prep.name,...prep.ingredients.flatMap(item=>[item.name,item.amount??'']),...prep.method]),
    translatedView.title,translatedView.author,translatedView.bar,translatedView.region,translatedView.stage,translatedView.summary,
    ...translatedView.materials.flatMap(item=>[item.name,item.amount??'']),...(translatedView.method??[]),...(translatedView.missingDetails??[]),
    ...(translatedView.preparations??[]).flatMap(prep=>[prep.name,...prep.ingredients.flatMap(item=>[item.name,item.amount??'']),...prep.method]),
    work.title,work.author,work.bar,work.region,work.award,work.original,...sourceMaterialSearch(work),...(work.method??[]),
    ...(work.preparations??[]).flatMap(prep=>[prep.name.en,...prep.ingredients.flatMap(item=>[item.name.en,item.amount??'']),...prep.method]),
  ].filter(Boolean).join(' ');
  const resetDetail=()=>{setSearch('');setComplete(false);setCompare([]);setShowOriginal(false);};
  const selectTopic=(item:(typeof researchTopics)[number])=>{resetDetail();router.push({pathname:'/topics',params:{topic:item.id}} as never);};
  const showDirectory=()=>{resetDetail();router.replace('/topics' as never);};
  if(!topic)return <Workspace section="topics" showUnits>
    <View style={ws.hero}><Heading level={1} style={ws.title}>{labText(locale,'topics')}</Heading><Text style={ws.body}>{w('topicIntro')}</Text></View>
    <TopicDirectory topics={researchTopics} locale={locale} onSelect={selectTopic}/>
  </Workspace>;
  const versions=topic.versionIds.map(id=>catalogue.versions.find(v=>v.id===id)!).filter(v=>v&&(!complete||preparationStatus(v.id)==='disclosed')&&matches([catalogue.cocktails.find(c=>c.id===v.cocktailId)?.name[locale],catalogue.sources.find(s=>s.id===v.sourceId)?.author,...v.ingredients.map(i=>catalogue.ingredients.find(m=>m.id===i.ingredientId)?.name[locale]),...v.steps[locale]].join(' ')));
  const chosen=compare.map(id=>catalogue.versions.find(v=>v.id===id)!).filter(Boolean);
  const allSaved=topic.versionIds.length>0&&topic.versionIds.every(id=>favorites.versionIds.includes(id));
  const researchRows=(topic.research??[]).filter(work=>!work.catalogueVersionId||!topic.versionIds.includes(work.catalogueVersionId)).map(work=>({work,view:getResearchWorkView(work,locale,showOriginal),translatedView:getResearchWorkView(work,locale),audit:round17ReviewFor(topic.id,work.id)})).filter(({work,view,translatedView})=>matches(researchSearch(work,view,translatedView)));
  const directoryEntry=buildTopicDirectory([topic],catalogue,locale)[0]!;
  const detailTitle=topic.kind==='bar'?topic.venue?.name??topic.competition:topic.competition;
  const selectionNote=topic.research?topicText(locale,'recipeResearch'):topicDirectoryText(locale,topic.kind==='bar'?'barSelectionNote':'competitionSelectionNote');
  return <Workspace section="topics" showUnits>
    <View style={ws.hero}><Heading level={1} style={ws.title}>{labText(locale,'topics')}</Heading><Text style={ws.body}>{w('topicIntro')}</Text></View>
    <TopicSelector locale={locale} onBack={showDirectory}/>
    <Panel><Text style={ws.muted}>{[topic.year>0?topic.year:null,topic.venue?.city??topic.region].filter(Boolean).join(' · ')}</Text><Text style={ws.heading}>{detailTitle}</Text>{topic.kind==='bar'&&topic.competition!==detailTitle&&<Text style={ws.body}>{topic.competition}</Text>}{topic.organization&&<Text style={ws.muted}>{topicText(locale,'organizer')}: {topic.organization}</Text>}<Text style={ws.body}>{w('collected')}: {directoryEntry.workCount}{topic.officialCount!==null?` · ${w('officialCount')}: ${topic.officialCount}`:''}</Text>{topic.officialCount!==null&&directoryEntry.workCount<topic.officialCount&&<Text style={ws.muted}>{topicText(locale,'partialCoverage')}</Text>}<Text style={ws.muted}>{selectionNote}</Text>{topic.versionIds.length>0&&<Action label={w(allSaved?'savedList':'saveList')} selected={allSaved} disabled={!favorites.hydrated} onPress={()=>topic.versionIds.forEach(id=>favorites.setSaved(id,true))}/>}</Panel>
    {topic.research&&<View style={ws.row}><Action label={topicText(locale,'translationMode')} selected={!showOriginal} onPress={()=>setShowOriginal(false)}/><Action label={topicText(locale,'originalMode')} selected={showOriginal} onPress={()=>setShowOriginal(true)}/><Text style={ws.muted}>{topicText(locale,showOriginal?'originalNote':'translationNote')}</Text></View>}
    <Field label={w('topicSearch')} value={search} onChange={setSearch}/>
    {topic.versionIds.length>0&&<View style={ws.row}><Action label={w('all')} selected={!complete} onPress={()=>setComplete(false)}/><Action label={lib(locale,'documented')} selected={complete} onPress={()=>setComplete(!complete)}/><Text style={ws.muted}>{versions.length}</Text></View>}
    {chosen.length>0&&<Panel title={labText(locale,'compare')}><View style={ws.row}>{chosen.map(v=><Action key={v.id} selected label={(catalogue.cocktails.find(c=>c.id===v.cocktailId)?.name[locale]??v.id)+' ×'} onPress={()=>setCompare(compare.filter(id=>id!==v.id))}/>)}</View><View style={ws.twoCol}>{chosen.map(v=><View key={v.id} style={ws.column}><Text style={ws.heading}>{catalogue.cocktails.find(c=>c.id===v.cocktailId)?.name[locale]}</Text>{v.ingredients.map((i,n)=>{const amount=formatAmount(i.amount,i.unit,unit);return <Text key={n} style={ws.body}>{amount.amount} {amount.unit} · {catalogue.ingredients.find(m=>m.id===i.ingredientId)?.name[locale]}{i.note?` · ${i.note[locale]}`:''}</Text>;})}<Action label={w('openRecipe')} onPress={()=>router.push({pathname:'/cocktails/[id]' as never,params:{id:v.cocktailId,version:v.id,from:'professional'}})}/></View>)}</View></Panel>}
    <View style={ws.twoCol}>{versions.map(v=>{const c=catalogue.cocktails.find(c=>c.id===v.cocktailId)!;return <View key={v.id} style={ws.column}><Panel><Text style={ws.heading}>{c.name[locale]}</Text><CocktailOriginalName cocktail={c} locale={locale} /><Text style={ws.body}>{v.profileNote[locale]}</Text><PreparationPanel versionId={v.id} locale={locale}/><View style={ws.row}><Action label={w('openRecipe')} selected onPress={()=>router.push({pathname:'/cocktails/[id]' as never,params:{id:v.cocktailId,version:v.id,from:'professional'}})}/><Action label={w(compare.includes(v.id)?'compared':'addCompare')} disabled={!compare.includes(v.id)&&compare.length===3} onPress={()=>setCompare(compare.includes(v.id)?compare.filter(id=>id!==v.id):[...compare,v.id])}/></View></Panel></View>;})}</View>
    <View style={ws.twoCol}>{researchRows.map(({work:r,view,audit})=><View key={r.id} style={ws.column}><Panel><Text style={ws.heading}>{view.title}</Text>{view.region&&<Text style={ws.body}>{topicText(locale,'region')}: {view.region}</Text>}{view.stage&&<Text style={ws.body}>{topicText(locale,'stage')}: {view.stage}</Text>}<Text style={ws.muted}>{view.disclosure==='identity-only'?topicText(locale,'identityOnly'):topicText(locale,'recipeResearch')}</Text>{view.materials.length>0&&<Fold title={showOriginal?topicText(locale,'originalSourceFacts'):topicText(locale,'sourceFacts')} initial>{showOriginal&&<Text style={ws.muted}>{topicText(locale,'originalNote')}</Text>}<Text style={ws.label}>{topicText(locale,'finishedServe')}</Text>{view.materials.map((m,n)=><Text key={n} style={ws.body}>{materialLine(m)}</Text>)}{view.method&&<View style={{gap:8}}><Text style={ws.label}>{topicText(locale,'method')}</Text>{view.method.map((step,n)=><Text key={n} style={ws.body}>{n+1}. {step}</Text>)}</View>}{view.preparations?.map(prep=><View key={prep.id} style={{gap:8}}><Text style={ws.heading}>{topicText(locale,'preparations')}: {prep.name}</Text><Text style={ws.label}>{topicText(locale,'preparationIngredients')}</Text>{prep.ingredients.map((m,n)=><Text key={n} style={ws.body}>{materialLine(m)}</Text>)}<Text style={ws.label}>{topicText(locale,'method')}</Text>{prep.method.map((step,n)=><Text key={n} style={ws.body}>{n+1}. {step}</Text>)}</View>)}</Fold>}{view.missingDetails&&view.missingDetails.length>0&&<Fold title={topicText(locale,'sourceGaps')} initial>{view.missingDetails.map((detail,n)=><Text key={n} style={ws.body}>• {detail}</Text>)}</Fold>}{view.summary&&<Fold title={topicText(locale,'editorial')}><Text style={ws.body}>{view.summary}</Text></Fold>}{view.original&&<Fold title={topicText(locale,'originalMaterialList')}><Text style={ws.body}>{view.original}</Text></Fold>}{audit?<ResearchAudit locale={locale} review={audit.review}/>:null}</Panel></View>)}</View>
    {!versions.length&&!researchRows.length&&<Text style={ws.body}>{w('empty')}</Text>}
  </Workspace>;
}
