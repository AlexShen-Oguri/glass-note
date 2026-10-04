import {recipeDisplayName} from '../../content/localization/display';
import {CocktailOriginalName} from '../names/OriginalName';
import {router,useIsFocused,useLocalSearchParams} from 'expo-router';
import React,{useEffect,useRef,useState} from 'react';
import {Pressable,ScrollView,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {catalogue} from '../../content/catalogue';
import {makingTechniques} from '../../content/making-techniques';
import type {Locale} from '../../domain/contracts';
import {createSession,findResumableSession,recipeFingerprint,recipeSnapshot,scaleRecipe,updateSession} from '../../domain/making';
import type {MakingRecipe} from '../../domain/making/types';
import {formatAmount} from '../../domain/search';
import {makingText} from '../../i18n/making';
import {preparationCopy} from '../../i18n/preparations';
import {refinementText} from '../../i18n/experience-refinement';
import type {UiKey} from '../../i18n/keys';
import {t} from '../../i18n/ui';
import {useApp} from '../../platform/AppProvider';
import {useMaking} from '../../platform/MakingProvider';
import {BrandToolbar} from '../discovery/components';
import {MotionTransition} from '../motion';
import {RecipeAbv} from './RecipeAbv';
import {Heading} from '../navigation/Heading';
import {makingStyles as s} from './styles';
import {Action,Disclosure,PersistenceNotice} from './ui';

const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
const newId=()=>`make-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;

export function MakingScreen(){
  const app=useApp(),making=useMaking(),params=useLocalSearchParams<{session?:string|string[];version?:string|string[]}>();
  const sessionId=first(params.session),versionId=first(params.version);
  const session=making.state.sessions.find(item=>item.id===sessionId);
  const recipe=session?.recipe??(versionId?recipeSnapshot(catalogue,versionId):undefined);
  const [busy,setBusy]=useState(false),[error,setError]=useState(false);
  const focused=useIsFocused(),focusedRef=useRef(focused),confirmed=useRef(new Set<string>());
  focusedRef.current=focused;
  const pending=useRef<{id:string;recipe:MakingRecipe}|null>(null),starting=useRef(false),mounted=useRef(true),activeVersion=useRef(versionId);
  activeVersion.current=versionId;
  useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;};},[]);
  const copy=(key:Parameters<typeof makingText>[1],values?:Record<string,string|number>)=>makingText(app.locale,key,values);
  const open=(id:string)=>{if(mounted.current&&focusedRef.current)router.replace({pathname:'/make' as never,params:{session:id}});};
  // Opening "Start making" already expresses intent; no second setup/confirmation screen.
  useEffect(()=>{
    if(!focused||sessionId||!versionId||!making.hydrated||making.error||starting.current)return;
    const target=recipeSnapshot(catalogue,versionId);if(!target)return;
    starting.current=true;setBusy(true);setError(false);
    const id=newId();pending.current={id,recipe:target};
    let destination=id;
    void making.change(state=>{
      const resumable=findResumableSession(state,recipeFingerprint(target),target.version.servings);
      if(resumable){destination=resumable.id;return state;}
      return {...state,sessions:[...state.sessions,createSession(target,id,new Date().toISOString())]};
    }).then(ok=>{if(!mounted.current||activeVersion.current!==versionId)return;if(ok){pending.current=null;open(destination);}else setError(true);},()=>{if(mounted.current)setError(true);}).finally(()=>{starting.current=false;if(mounted.current)setBusy(false);});
  },[sessionId,versionId,making.hydrated,focused]);
  const retry=async()=>{setBusy(true);try{const ok=await making.retry();setError(!ok);if(ok&&pending.current){const item=making.state.sessions.find(item=>item.id===pending.current!.id)??findResumableSession(making.state,recipeFingerprint(pending.current.recipe),pending.current.recipe.version.servings);if(item){pending.current=null;open(item.id);}else setError(true);}}finally{setBusy(false);}};
  const complete=async()=>{if(!session||busy||making.saving||making.error)return;setBusy(true);setError(false);try{const ok=await making.change(state=>({...state,sessions:state.sessions.map(item=>item.id===session.id?updateSession(item,{completed:true},new Date().toISOString()):item)}));setError(!ok);}catch{setError(true);}finally{setBusy(false);}};
  const again=async()=>{if(!session||busy||making.saving||making.error)return;setBusy(true);setError(false);const id=pending.current?.id??newId();pending.current={id,recipe:session.recipe};try{const ok=await making.change(state=>state.sessions.some(item=>item.id===id)?state:{...state,sessions:[...state.sessions,createSession(session.recipe,id,new Date().toISOString())]});if(ok){pending.current=null;open(id);}else setError(true);}catch{setError(true);}finally{setBusy(false);}};
  if(session?.completed&&!busy&&!making.saving&&!making.error&&!error)confirmed.current.add(session.id);
  const completed=Boolean(session&&confirmed.current.has(session.id));
  return <SafeAreaView style={s.screen}><View style={{paddingHorizontal:18}}><BrandToolbar {...app}/></View>
    <MotionTransition changeKey={`${sessionId??versionId}:${completed?'completed':'making'}`} kind="completion" style={{flex:1,minHeight:0}}>
      <ScrollView contentContainerStyle={[s.scroll,{flexGrow:1}]} automaticallyAdjustKeyboardInsets>
        <View style={[s.shell,s.narrowShell,{flexGrow:1}]}>
          {!completed?<Pressable accessibilityRole="link" onPress={()=>router.canGoBack()?router.back():router.replace('/discover' as never)} style={s.back}><Text style={s.backText}>← {copy('back')}</Text></Pressable>:null}
          {making.error||error?<PersistenceNotice kind={making.error??'write'} retrying={busy} onRetry={()=>void retry()} copy={copy}/>:null}
          {!making.hydrated&&!making.error?<Text style={s.empty}>{copy('loading')}</Text>:null}
          {completed?<View style={{flexGrow:1,minHeight:300,justifyContent:'center',alignItems:'center',gap:36,paddingVertical:48}}><Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[s.title,{fontSize:48,lineHeight:60}]}>{copy('completed')}</Text><View style={[s.row,{justifyContent:'center'}]}><Action primary label={refinementText(app.locale,'again')} disabled={busy||making.saving} onPress={()=>void again()}/><Action label={refinementText(app.locale,'backToList')} onPress={()=>router.replace('/discover' as never)}/></View></View>:recipe?<>
            <View style={s.hero}><Text accessibilityRole="header" style={s.title}>{recipeDisplayName(recipe, app.locale)}</Text><CocktailOriginalName recipe={recipe} locale={app.locale} /></View>
            <RecipeBody recipe={recipe} servings={session?.servings??recipe.version.servings} locale={app.locale} unit={app.unit}/>
            <Action primary label={copy(busy||making.saving?'saving':'complete')} disabled={!session||session.completed||busy||making.saving||Boolean(making.error)} onPress={()=>void complete()}/>
          </>:making.hydrated?<Text style={s.empty}>{copy('sessionMissing')}</Text>:null}
        </View>
      </ScrollView>
    </MotionTransition>
  </SafeAreaView>;
}

function RecipeBody({recipe,servings,locale,unit}:{recipe:MakingRecipe;servings:number;locale:Locale;unit:'ml'|'oz'}){
  const steps=recipe.version.steps[locale]?.length?recipe.version.steps[locale]:recipe.version.steps.en;
  const current=catalogue.versions.find(item=>item.id===recipe.version.id);
  const sameSource=current&&recipeSnapshot(catalogue,current.id);
  const techniques=sameSource&&recipeFingerprint(sameSource)===recipeFingerprint(recipe)?new Set(current.mixingMethods?.map(item=>item.method)):new Set<string>();
  const preparationLabels=preparationCopy(locale);
  return <>
    <View style={{gap:12,paddingBottom:16}}><Heading level={2} style={s.sectionHeading}>{makingText(locale,'ingredients')}</Heading>{scaleRecipe(recipe,servings).map((row,index)=>{
      const amount=formatAmount(row.amount,row.unit,unit),sourceRow=recipe.version.ingredients[index];
      return <View key={row.rowId} style={s.checklist}><Text style={[s.strong,{width:92}]}>{amount.amount} {t(locale,`unit_${amount.unit}` as UiKey)}</Text><View style={s.grow}><Text style={s.body}>{recipe.ingredientNames[row.ingredientId]?.[locale]||recipe.ingredientNames[row.ingredientId]?.en||row.ingredientId}{row.optional?` (${makingText(locale,'optional')})`:''}</Text>{sourceRow?.brandId?<Text style={s.meta}>{recipe.brandNames[sourceRow.brandId]??sourceRow.brandId}</Text>:null}{sourceRow?.note?<Text style={s.meta}>{sourceRow.note[locale]||sourceRow.note.en}</Text>:null}</View></View>;
    })}</View>
    <View style={{gap:24,paddingVertical:16}}><Heading level={2} style={s.sectionHeading}>{makingText(locale,'steps')}</Heading>{steps.map((step,index)=><View key={index} style={s.split}><Text style={s.stepNumber}>{index+1}</Text><Text style={[s.body,{flex:1,fontSize:17,lineHeight:28}]}>{step}</Text></View>)}</View>
    <View style={{gap:12,paddingVertical:16}}><Heading level={2} style={s.sectionHeading}>{refinementText(locale,'tips')}</Heading>
      {recipe.preparation?<>
        <Text style={s.body}>{recipe.preparation.summary[locale]||recipe.preparation.summary.en}</Text>
        {recipe.preparation.gaps.map((gap,index)=><Text key={index} style={s.statusCheck}>{gap[locale]||gap.en}</Text>)}
        {recipe.preparation.cards.map(card=><Disclosure key={card.id} title={card.title[locale]||card.title.en}>
          {card.inputs.map((line,index)=><Text key={`input-${index}`} style={s.body}>{line[locale]||line.en}</Text>)}
          {card.steps.map((line,index)=><Text key={`step-${index}`} style={s.body}>{index+1}. {line[locale]||line.en}</Text>)}
          {(['timing','temperature','yield'] as const).map(key=>card[key]?<Text key={key} style={s.body}>{preparationLabels[key]}: {card[key][locale]||card[key].en}</Text>:null)}
          {card.gaps.map((gap,index)=><Text key={`gap-${index}`} style={s.statusCheck}>{gap[locale]||gap.en}</Text>)}

        </Disclosure>)}
      </>:null}
      {makingTechniques.filter(item=>techniques.has(item.id)).map(item=><Disclosure key={item.id} title={item.title[locale]||item.title.en}><Text style={s.body}>{item.body[locale]||item.body.en}</Text></Disclosure>)}
    </View>
    <RecipeAbv version={recipe.version} locale={locale}/>
  </>;
}

export default MakingScreen;
