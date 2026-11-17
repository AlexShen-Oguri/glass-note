import {recipeDisplayName} from '../../content/localization/display';
import {CocktailOriginalName} from '../names/OriginalName';
import {router,useIsFocused,useLocalSearchParams} from 'expo-router';
import React,{useEffect,useRef,useState} from 'react';
import {Pressable,ScrollView,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {catalogue} from '../../content/catalogue';
import {bottles} from '../../content/bottles';
import {makingTechniques} from '../../content/making-techniques';
import type {Locale} from '../../domain/contracts';
import {bottleDisplayName} from '../../domain/bottles/format';
import {createSession,findResumableSession,recipeFingerprint,recipeSnapshot,scaleRecipe,sessionSupplyOptions,updateSession} from '../../domain/making';
import type {MakingAssumptions,MakingContext,MakingRecipe,MakingSession,MakingSupplyBinding} from '../../domain/making/types';
import {formatAmount} from '../../domain/search';
import {makingText} from '../../i18n/making';
import {materialText} from '../../i18n/materials';
import {preparationCopy} from '../../i18n/preparations';
import {refinementText} from '../../i18n/experience-refinement';
import type {UiKey} from '../../i18n/keys';
import {t} from '../../i18n/ui';
import {useApp} from '../../platform/AppProvider';
import {useMaking} from '../../platform/MakingProvider';
import {usePantry} from '../../platform/PantryProvider';
import {useBottles} from '../../platform/BottleProvider';
import {BrandToolbar} from '../discovery/components';
import {MotionTransition} from '../motion';
import {motionData} from '../motion/attributes';
import {useSceneTransition} from '../motion/SceneTransition';
import {RecipeAbv} from './RecipeAbv';
import {Heading} from '../navigation/Heading';
import {makingStyles as s} from './styles';
import {Action,Disclosure,PersistenceNotice} from './ui';

const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
const newId=()=>`make-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
type AssumptionsIntent={sessionId:string;assumptions:MakingAssumptions;includedOptionalRowIds:readonly string[]};

export function MakingScreen(){
  const {run}=useSceneTransition();
  const [,setPresentation]=useState(0);
  const app=useApp(),making=useMaking(),pantry=usePantry(),ownedBottles=useBottles(),params=useLocalSearchParams<{session?:string|string[];version?:string|string[]}>();
  const suppliesReady=pantry.hydrated&&ownedBottles.hydrated&&!pantry.error&&!ownedBottles.error;
  const supplyError=pantry.error??ownedBottles.error;
  const context:MakingContext={catalogue,pantry:pantry.pantry,ownedBottleIds:ownedBottles.ids,bottles,making:making.state};
  const sessionId=first(params.session),versionId=first(params.version);
  const session=making.state.sessions.find(item=>item.id===sessionId);
  const recipe=session?.recipe??(versionId?recipeSnapshot(catalogue,versionId):undefined);
  const [busy,setBusy]=useState(false),[error,setError]=useState(false);
  const [persistedSave,setPersistedSave]=useState<AssumptionsIntent&{revision:number}>();
  const assumptionsIntent=useRef<AssumptionsIntent|null>(null);
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
    const saved=making.state.sessions.filter(item=>item.recipe.version.id===versionId&&!item.completed)
      .sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt))[0];
    if(saved){open(saved.id);return;}
    if(!suppliesReady)return;
    const target=recipeSnapshot(catalogue,versionId);if(!target)return;
    starting.current=true;setBusy(true);setError(false);
    const id=newId();pending.current={id,recipe:target};
    let destination=id;
    void making.change(state=>{
      const resumable=findResumableSession(state,recipeFingerprint(target),target.version.servings,target.version.id);
      if(resumable){destination=resumable.id;return state;}
      return {...state,sessions:[...state.sessions,createSession(target,id,new Date().toISOString(),{...context,making:state})]};
    }).then(ok=>{if(!mounted.current||activeVersion.current!==versionId)return;if(ok){pending.current=null;open(destination);}else setError(true);},()=>{if(mounted.current)setError(true);}).finally(()=>{starting.current=false;if(mounted.current)setBusy(false);});
  },[sessionId,versionId,making.hydrated,making.error,suppliesReady,focused]);
  const persistAssumptions=async(intent:AssumptionsIntent):Promise<boolean>=>{
    try{
      // Recover any pending store write before reapplying this idempotent request.
      // A successful recovery alone does not prove these assumptions were saved.
      if(making.error&&!await making.retry())return false;
      return await making.change(state=>{
        if(!state.sessions.some(item=>item.id===intent.sessionId))throw Error('session missing');
        return {...state,sessions:state.sessions.map(item=>{
          if(item.id!==intent.sessionId)return item;
          const optionalIds=new Set(item.recipe.version.ingredients.flatMap((row,index)=>row.optional?[`${item.recipe.version.id}:${index}`]:[]));
          const checkedRows=[...item.checkedRows.filter(id=>!optionalIds.has(id)),...intent.includedOptionalRowIds.filter(id=>optionalIds.has(id))];
          // Calculator inputs do not select a different actual supply.
          return updateSession(item,{assumptions:intent.assumptions,checkedRows},new Date().toISOString());
        })};
      });
    }catch{return false;}
  };
  const retry=async()=>{setBusy(true);const intent=assumptionsIntent.current;try{
    const results=await Promise.all([
      intent?persistAssumptions(intent):making.error||error?making.retry():Promise.resolve(true),
      pantry.error?pantry.retry():Promise.resolve(true),
      ownedBottles.error?ownedBottles.hydrated?ownedBottles.retrySave():ownedBottles.load().then(()=>true):Promise.resolve(true),
    ]);
    const ok=results.every(Boolean);setError(!ok);
    if(intent&&results[0]){
      assumptionsIntent.current=null;
      setPersistedSave(previous=>({sessionId:intent.sessionId,assumptions:intent.assumptions,includedOptionalRowIds:intent.includedOptionalRowIds,revision:(previous?.revision??0)+1}));
    }
    if(ok&&pending.current){const item=making.state.sessions.find(item=>item.id===pending.current!.id)??findResumableSession(making.state,recipeFingerprint(pending.current.recipe),pending.current.recipe.version.servings,pending.current.recipe.version.id);if(item){pending.current=null;open(item.id);}else setError(true);}
  }finally{setBusy(false);}};
  const complete=async()=>{if(!session||busy||making.saving||making.error)return;setBusy(true);setError(false);try{const ok=await making.change(state=>({...state,sessions:state.sessions.map(item=>item.id===session.id?updateSession(item,{completed:true},new Date().toISOString()):item)}));setError(!ok);}catch{setError(true);}finally{setBusy(false);}};
  const again=async()=>{if(!session||busy||making.saving||making.error||!suppliesReady)return;setBusy(true);setError(false);const id=pending.current?.id??newId();pending.current={id,recipe:session.recipe};try{const ok=await making.change(state=>{
    if(state.sessions.some(item=>item.id===id))return state;
    const now=new Date().toISOString(),fresh=createSession(session.recipe,id,now);
    // Repeat the saved batch's rules; current ownership can only rebind those supplies.
    const repeated=session.materialSemantics?updateSession({...fresh,materialSemantics:session.materialSemantics,materialBindings:session.materialBindings},{},now,{...context,making:state}):fresh;
    return {...state,sessions:[...state.sessions,repeated]};
  });if(ok){pending.current=null;run(()=>open(id),{label:'调制',automatic:true});}else setError(true);}catch{setError(true);}finally{setBusy(false);}};
  const selectSupply=async(rowId:string,supply:MakingSupplyBinding)=>{if(!session||session.completed||busy||making.saving||making.error||!suppliesReady)return;setBusy(true);setError(false);try{
    const ok=await making.change(state=>({...state,sessions:state.sessions.map(item=>{
      if(item.id!==session.id)return item;
      const bottleIds={...item.assumptions.bottleIds};if(supply.bottleId)bottleIds[rowId]=supply.bottleId;else delete bottleIds[rowId];
      const abv={...item.assumptions.abv},selected=supply.bottleId?bottles.find(bottle=>bottle.id===supply.bottleId):undefined;
      // A new actual supply must not inherit a prior bottle's explicit strength.
      delete abv[rowId];if(selected&&selected.abv!==null&&Number.isFinite(selected.abv))abv[rowId]=selected.abv;
      return updateSession(item,{materialBindings:{...item.materialBindings,[rowId]:supply},assumptions:{...item.assumptions,bottleIds,abv}},new Date().toISOString(),{...context,making:state});
    })}));setError(!ok);
  }catch{setError(true);}finally{setBusy(false);}};
  const saveAssumptions=async(assumptions:MakingAssumptions,includedOptionalRowIds:readonly string[]):Promise<boolean>=>{
    if(!session||session.completed||busy||making.saving||making.error||!suppliesReady)return false;
    setBusy(true);setError(false);
    const intent:AssumptionsIntent={sessionId:session.id,assumptions,includedOptionalRowIds};
    assumptionsIntent.current=intent;
    try{const ok=await persistAssumptions(intent);if(ok)assumptionsIntent.current=null;setError(!ok);return ok;}
    finally{setBusy(false);}
  };
  useEffect(()=>{
    if(session?.completed&&!busy&&!making.saving&&!making.error&&!error&&!confirmed.current.has(session.id))run(()=>{confirmed.current.add(session.id);setPresentation(value=>value+1);},{label:'完成',automatic:true});
  },[session?.id,session?.completed,busy,making.saving,making.error,error,run]);
  const completed=Boolean(session&&confirmed.current.has(session.id));
  return <SafeAreaView style={s.screen}><View style={{paddingHorizontal:18}}><BrandToolbar {...app}/></View>
    <MotionTransition changeKey={`${sessionId??versionId}:${completed?'completed':'making'}`} kind="completion" disabled={!focused} style={{flex:1,minHeight:0}}>
      <ScrollView contentContainerStyle={[s.scroll,{flexGrow:1}]} automaticallyAdjustKeyboardInsets>
        <View style={[s.shell,s.narrowShell,{flexGrow:1}]}>
          {!completed?<Pressable accessibilityRole="link" onPress={()=>run(()=>router.canGoBack()?router.back():router.replace('/discover' as never),{label:'饮谱',direction:-1,history:router.canGoBack()})} style={s.back}><Text style={s.backText}>← {copy('back')}</Text></Pressable>:null}
          {making.error||supplyError||error?<PersistenceNotice kind={making.error??supplyError??'write'} retrying={busy} onRetry={()=>void retry()} copy={copy}/>:null}
          {(!making.hydrated||!suppliesReady)&&!making.error&&!supplyError?<Text style={s.empty}>{copy('loading')}</Text>:null}
          {completed?<View style={{flexGrow:1,minHeight:300,justifyContent:'center',alignItems:'center',gap:36,paddingVertical:48}}><Heading level={1} accessibilityLiveRegion="polite" style={[s.title,{fontSize:48,lineHeight:60}]}>{copy('completed')}</Heading><View style={[s.row,{justifyContent:'center'}]}><Action primary label={refinementText(app.locale,'again')} disabled={busy||making.saving||Boolean(making.error)||!suppliesReady} onPress={()=>void again()}/><Action label={refinementText(app.locale,'backToList')} onPress={()=>run(()=>router.replace('/discover' as never),{label:'酒单',direction:-1})}/></View></View>:recipe?<>
            <View style={s.hero}><Heading level={1} style={s.title}>{recipeDisplayName(recipe, app.locale)}</Heading><CocktailOriginalName recipe={recipe} locale={app.locale} /></View>
            <RecipeBody recipe={recipe} session={session} context={context} suppliesReady={suppliesReady} disabled={busy||making.saving||Boolean(making.error)||Boolean(session?.completed)} onSelectSupply={(rowId,supply)=>void selectSupply(rowId,supply)} persistedSave={persistedSave} onSaveAssumptions={saveAssumptions} servings={session?.servings??recipe.version.servings} locale={app.locale} unit={app.unit}/>
            <Action primary label={copy(busy||making.saving?'saving':'complete')} disabled={!session||session.completed||busy||making.saving||Boolean(making.error)} onPress={()=>void complete()}/>
          </>:making.hydrated?<Text style={s.empty}>{copy('sessionMissing')}</Text>:null}
        </View>
      </ScrollView>
    </MotionTransition>
  </SafeAreaView>;
}

function RecipeBody({recipe,session,context,suppliesReady,disabled,onSelectSupply,persistedSave,onSaveAssumptions,servings,locale,unit}:{recipe:MakingRecipe;session?:MakingSession;context:MakingContext;suppliesReady:boolean;disabled:boolean;onSelectSupply:(rowId:string,supply:MakingSupplyBinding)=>void;persistedSave?:AssumptionsIntent&{revision:number};onSaveAssumptions:(assumptions:MakingAssumptions,includedOptionalRowIds:readonly string[])=>Promise<boolean>;servings:number;locale:Locale;unit:'ml'|'oz'}){
  const steps=recipe.version.steps[locale]?.length?recipe.version.steps[locale]:recipe.version.steps.en;
  const current=catalogue.versions.find(item=>item.id===recipe.version.id);
  const sameSource=current&&recipeSnapshot(catalogue,current.id);
  const techniques=sameSource&&recipeFingerprint(sameSource)===recipeFingerprint(recipe)?new Set(current.mixingMethods?.map(item=>item.method)):new Set<string>();
  const preparationLabels=preparationCopy(locale);
  return <>
    <View {...motionData({motionPart:'menu'})} style={{gap:12,paddingBottom:16}}><Heading level={2} style={s.sectionHeading}>{makingText(locale,'ingredients')}</Heading>{scaleRecipe(recipe,servings).map((row,index)=>{
      const amount=formatAmount(row.amount,row.unit,unit),sourceRow=recipe.version.ingredients[index];
      const savedName=recipe.ingredientNames[row.ingredientId],material=session?.materialSemantics?.rows.find(item=>item.rowId===row.rowId);
      const mainName=material?(catalogue.materialConcepts?.find(item=>item.id===material.canonicalId)?.name??catalogue.ingredients.find(item=>item.id===material.canonicalId)?.name??savedName):savedName;
      const name=mainName?.[locale]||mainName?.en||row.ingredientId;
      const sourceName=material?.sourceName[locale]||material?.sourceName.en;
      const binding=session?.materialBindings?.[row.rowId],options=session?.materialSemantics&&suppliesReady?sessionSupplyOptions(session,context,row.rowId):[];
      const supplyName=(supply:MakingSupplyBinding)=>{const bottle=supply.bottleId?bottles.find(item=>item.id===supply.bottleId):undefined;const ingredient=catalogue.ingredients.find(item=>item.id===supply.ingredientId);return bottle?bottleDisplayName(bottle,locale):ingredient?.name[locale]||ingredient?.name.en||supply.bottleId||supply.ingredientId;};
      return <View key={row.rowId} style={s.checklist}><Text style={[s.strong,{width:92}]}>{amount.amount} {t(locale,`unit_${amount.unit}` as UiKey)}</Text><View style={s.grow}><Text style={s.body}>{name}{row.optional?` (${makingText(locale,'optional')})`:''}</Text>{sourceName&&sourceName!==name?<Text style={s.meta}>{materialText(locale,'source')}: {sourceName}</Text>:null}{binding&&material?<Text style={s.meta}>{materialText(locale,'selectedSupply',{ingredient:supplyName(binding)})}</Text>:null}{sourceRow?.brandId?<Text style={s.meta}>{recipe.brandNames[sourceRow.brandId]??sourceRow.brandId}</Text>:null}{sourceRow?.note?<Text style={s.meta}>{sourceRow.note[locale]||sourceRow.note.en}</Text>:null}{options.length>1?<Disclosure title={materialText(locale,'chooseSupply',{ingredient:name})}><View style={s.row}>{options.map(option=><Action key={`${option.ingredientId}:${option.bottleId??''}`} label={materialText(locale,'selectSupply',{ingredient:supplyName(option)})} selected={binding?.ingredientId===option.ingredientId&&binding?.bottleId===option.bottleId} disabled={disabled} onPress={()=>onSelectSupply(row.rowId,option)}/>)}</View></Disclosure>:null}</View></View>;
    })}</View>
    <View style={{gap:24,paddingVertical:16}}><Heading level={2} style={s.sectionHeading}>{makingText(locale,'steps')}</Heading>{steps.map((step,index)=><View {...motionData({motionPart:'menu'})} key={index} style={s.split}><Text style={s.stepNumber}>{index+1}</Text><Text style={[s.body,{flex:1,fontSize:17,lineHeight:28}]}>{step}</Text></View>)}</View>
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
    <RecipeAbv recipe={recipe} session={session} locale={locale} disabled={disabled||!suppliesReady||!session} persistedSave={persistedSave} onSaveAssumptions={onSaveAssumptions}/>
  </>;
}

export default MakingScreen;
