import {plainVersionLabel} from '../../recipe/versionLabel';
import React,{useMemo,useRef,useState} from 'react';
import {Text,View} from 'react-native';
import {router} from 'expo-router';
import {catalogue} from '../../../content/catalogue';
import {GIN_COMPARISON_PILOT_VERSION_ID,ginComparisonPilotBottle} from '../../../content/gin-comparison-pilot';
import type {Bottle} from '../../../domain/bottles/types';
import {bottleDisplayName} from '../../../domain/bottles/format';
import type {Locale,RecipeVersion,UnitPreference} from '../../../domain/contracts';
import {bottleComparisonProjectDraft,bottleComparisonRecipePreview,bottleSupportsIngredient,type BottleComparisonMode} from '../../../domain/lab/bottleComparison';
import {getRecipePreparation} from '../../../domain/preparations';
import {formatAmount,scoreTextSearch} from '../../../domain/search';
import {bottleComparisonText} from '../../../i18n/bottle-comparison';
import {p02BottleText} from '../../../i18n/p02-bottles';
import {useLab} from '../../../platform/LabProvider';
import {Action,Field,Panel,ws} from '../ui';
import {BottleComparisonRecipePreview} from './BottleComparisonRecipePreview';
import {GinComparisonPilotPanel} from './GinComparisonPilotPanel';

const RESULT_LIMIT=8;

function versionLabel(version:RecipeVersion,locale:Locale):string {
  const cocktail=catalogue.cocktails.find(item=>item.id===version.cocktailId);
  return [cocktail?.name[locale],plainVersionLabel(version.id,locale)].filter(Boolean).join(' · ');
}

function versionSearchFields(version:RecipeVersion,locale:Locale):string[] {
  const cocktail=catalogue.cocktails.find(item=>item.id===version.cocktailId);
  const source=catalogue.sources.find(item=>item.id===version.sourceId);
  return [cocktail?.name[locale],...(cocktail?.aliases??[]),version.label[locale],source?.title,source?.author]
    .filter((value):value is string=>!!value);
}

export function BottleComparisonLab({selected,locale,unit}:{selected:Bottle[];locale:Locale;unit:UnitPreference}){
  const lab=useLab();
  const c=(key:Parameters<typeof bottleComparisonText>[1])=>bottleComparisonText(locale,key);
  const [kind,setKind]=useState<'scratch'|'recipe'>('scratch');
  const [search,setSearch]=useState('');
  const [versionId,setVersionId]=useState('');
  const [targetIndex,setTargetIndex]=useState<number|undefined>();
  const [confirmedMismatch,setConfirmedMismatch]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [pendingProjectId,setPendingProjectId]=useState('');
  const [error,setError]=useState('');
  const busy=useRef(false);
  const version=catalogue.versions.find(item=>item.id===versionId);
  const results=useMemo(()=>{
    const query=search.trim();
    if(!query)return [];
    return catalogue.versions.map(item=>({item,score:scoreTextSearch(query,versionSearchFields(item,locale))}))
      .filter(result=>result.score>0)
      .sort((left,right)=>right.score-left.score||left.item.id.localeCompare(right.item.id))
      .slice(0,RESULT_LIMIT).map(result=>result.item);
  },[search,locale]);
  const target=version&&targetIndex!==undefined?version.ingredients[targetIndex]:undefined;
  const targetName=target?catalogue.ingredients.find(item=>item.id===target.ingredientId)?.name[locale]??target.ingredientId:'';
  const displayedTarget=target?formatAmount(target.amount,target.unit,unit):undefined;
  const compatible=!!target&&selected.every(bottle=>bottleSupportsIngredient(bottle,target.ingredientId));
  const mode:BottleComparisonMode|undefined=kind==='scratch'
    ?{kind:'scratch'}
    :version&&targetIndex!==undefined
      ?{kind:'recipe',version,targetIngredientIndex:targetIndex,preparation:getRecipePreparation(version.id),allowIncompatible:confirmedMismatch}
      :undefined;
  const previewMode:BottleComparisonMode|undefined=mode?.kind==='recipe'?{...mode,allowIncompatible:true}:mode;
  const previewDraft=useMemo(()=>{
    if(!previewMode)return undefined;
    try{return bottleComparisonProjectDraft(catalogue,selected,locale,previewMode);}catch{return undefined;}
  },[selected,locale,previewMode?.kind,versionId,targetIndex]);
  const draft=useMemo(()=>{
    if(!mode)return undefined;
    try{return bottleComparisonProjectDraft(catalogue,selected,locale,mode);}catch{return undefined;}
  },[selected,locale,mode?.kind,versionId,targetIndex,confirmedMismatch]);
  const recipePreview=useMemo(()=>{
    if(!previewDraft||kind!=='recipe'||targetIndex===undefined)return undefined;
    try{return bottleComparisonRecipePreview(previewDraft,targetIndex);}catch{return undefined;}
  },[previewDraft,kind,targetIndex]);
  const pilotEligible=selected.every(bottle=>!!ginComparisonPilotBottle(bottle.id));
  const pilotLoaded=kind==='recipe'&&versionId===GIN_COMPARISON_PILOT_VERSION_ID;
  const loadPilot=()=>{
    setKind('recipe');setSearch('');setVersionId(GIN_COMPARISON_PILOT_VERSION_ID);
    setTargetIndex(undefined);setConfirmedMismatch(false);setError('');
  };
  const create=async()=>{
    if(busy.current||pendingProjectId||!draft)return;
    busy.current=true;
    setSubmitting(true);setError('');
    try{
      const id=lab.createComparisonProject(draft);
      await lab.whenSaved();
      if(!lab.saveStatus()){setPendingProjectId(id);setError(c('saveFailed'));return;}
      router.push({pathname:'/lab' as never,params:{project:id}});
    }catch{setError(c('failed'));}
    finally{busy.current=false;setSubmitting(false);}
  };
  const retry=async()=>{
    if(busy.current||!pendingProjectId)return;
    busy.current=true;
    setSubmitting(true);setError('');
    try{
      if(await lab.retrySave())router.push({pathname:'/lab' as never,params:{project:pendingProjectId}});
      else setError(c('saveFailed'));
    }catch{setError(c('saveFailed'));}
    finally{busy.current=false;setSubmitting(false);}
  };

  if(selected.length<2)return <View style={{gap:6}}><Text style={ws.muted}>{c('needSelection')}</Text>{selected.length===1&&<Text style={ws.muted}>{c('sameFamily')}</Text>}</View>;
  return <Panel title={c('createProject')}>
    <Text style={ws.body}>{c('createHint')}</Text>
    {pilotEligible&&<GinComparisonPilotPanel selected={selected} locale={locale} loaded={pilotLoaded} disabled={!!pendingProjectId} onLoad={loadPilot}/>}
    <View style={ws.row}>
      <Action label={c('scratch')} selected={kind==='scratch'} disabled={!!pendingProjectId} onPress={()=>{setKind('scratch');setConfirmedMismatch(false);setError('');}}/>
      <Action label={c('recipe')} selected={kind==='recipe'} disabled={!!pendingProjectId} onPress={()=>{setKind('recipe');setConfirmedMismatch(false);setError('');}}/>
    </View>
    {kind==='recipe'&&<>
      <Field label={c('recipeSearch')} value={search} onChange={value=>{setSearch(value);setVersionId('');setTargetIndex(undefined);setConfirmedMismatch(false);}}/>
      {!!search.trim()&&!results.length&&<Text style={ws.muted}>{c('noRecipe')}</Text>}
      {!!results.length&&<View style={{gap:8}}>{results.map(item=><Action key={item.id} label={versionLabel(item,locale)} selected={versionId===item.id} disabled={!!pendingProjectId} onPress={()=>{setVersionId(item.id);setTargetIndex(undefined);setConfirmedMismatch(false);setError('');}}/>)}</View>}
      {version&&<View style={{gap:10}}>
        <Text style={ws.body}>{versionLabel(version,locale)}</Text>
        <Text style={ws.label}>{c('chooseRow')}</Text>
        {version.ingredients.map((ingredient,index)=>{
          const name=catalogue.ingredients.find(item=>item.id===ingredient.ingredientId)?.name[locale]??ingredient.ingredientId;
          const fits=selected.every(bottle=>bottleSupportsIngredient(bottle,ingredient.ingredientId));
          const displayed=formatAmount(ingredient.amount,ingredient.unit,unit);
          return <Action key={`${ingredient.ingredientId}-${index}`} label={`${displayed.amount} ${displayed.unit} · ${name} · ${fits?c('compatible'):c('needsOverride')}`} selected={targetIndex===index} disabled={!!pendingProjectId} onPress={()=>{setTargetIndex(index);setConfirmedMismatch(false);setError('');}}/>;
        })}
        {target&&!compatible&&<><Text accessibilityRole="alert" style={ws.error}>{c('incompatible')}</Text><Action label={c('confirmIncompatible')} selected={confirmedMismatch} disabled={!!pendingProjectId} onPress={()=>setConfirmedMismatch(value=>!value)}/></>}
      </View>}
    </>}
    {previewDraft&&<View style={{gap:12}}>
      <Text style={ws.heading}>{c('preview')}</Text>
      {recipePreview?<BottleComparisonRecipePreview preview={recipePreview} selected={selected} locale={locale} unit={unit}/>:<View style={ws.twoCol}>{previewDraft.versions.map(item=>{
        const bottle=selected.find(value=>value.id===item.bottleId);
        const displayName=bottle?bottleDisplayName(bottle,locale):item.name;
        const replacement=item.ingredients.find(row=>row.bottleId===item.bottleId);
        const replacementName=replacement?.ingredientId
          ?catalogue.ingredients.find(ingredient=>ingredient.id===replacement.ingredientId)?.name[locale]??replacement.name
          :replacement?.name??'';
        const comparedName=compatible?targetName:`${targetName} → ${replacementName}`;
        return <View key={item.bottleId} style={[ws.column,{flexBasis:220}]}><Text style={ws.label}>{displayName}</Text>{displayName!==item.name&&<Text style={ws.muted}>{p02BottleText(locale,'originalName')}: {item.name}</Text>}<Text style={ws.body}>{kind==='recipe'&&displayedTarget?`${displayedTarget.amount} ${displayedTarget.unit} · ${comparedName}`:c('scratchAmount')}</Text>{kind==='recipe'&&<Text style={ws.muted}>{c('unchangedAmount')}</Text>}</View>;
      })}</View>}
      {kind==='recipe'&&!recipePreview&&<Text style={ws.muted}>{c('sourcePreserved')}</Text>}
    </View>}
    {!!error&&<Text accessibilityRole="alert" style={ws.error}>{error}</Text>}
    {pendingProjectId
      ?<Action label={submitting?c('creating'):c('retrySave')} disabled={submitting} onPress={()=>void retry()}/>
      :<Action label={submitting?c('creating'):c('createProject')} disabled={!lab.hydrated||lab.saving||submitting||!draft} onPress={()=>void create()}/>
    }
  </Panel>;
}
