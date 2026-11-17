import {recipeDisplayName} from '../../content/localization/display';
import {CocktailOriginalName} from '../names/OriginalName';
import {Link, router, useLocalSearchParams} from 'expo-router';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {bottles} from '../../content/bottles';
import {catalogue} from '../../content/catalogue';
import {mergeOwnedPantry, type OwnedVersionMatch} from '../../domain/ingredients/presence';
import {createSession, findResumableSession, readinessFingerprint, recipeFingerprint, recipeSnapshot, scaleRecipe, updateSession} from '../../domain/making';
import {decisionShelf, decisionsForPresence} from '../../domain/making/presence-decisions';
import type {MakingRecipe, MakingState} from '../../domain/making/types';
import {formatAmount} from '../../domain/search';
import type {UiKey} from '../../i18n/keys';
import {makingText} from '../../i18n/making';
import {pantryText} from '../../i18n/pantry';
import {materialText} from '../../i18n/materials';
import {shoppingText} from '../../i18n/shopping';
import {materialDisplayName,sourceMaterialName} from '../ingredients/materialDisplay';
import {t} from '../../i18n/ui';
import {media} from '../../media';
import {useApp} from '../../platform/AppProvider';
import {useBottles} from '../../platform/BottleProvider';
import {useMaking} from '../../platform/MakingProvider';
import {usePantry} from '../../platform/PantryProvider';
import {colors, radii} from '../../theme/tokens';
import {BrandToolbar, PhotoFrame, serif, useViewport} from '../discovery/components';
import {Heading} from '../navigation/Heading';
import {PantryInventory} from './PantryInventory';
import {PantryRestockPlanner} from './PantryRestockPlanner';
import {ShoppingList} from './ShoppingList';
import {makingStyles as s} from './styles';
import {Action, Disclosure, PersistenceNotice, type MakingCopy} from './ui';

type Shelf='available'|'ready'|'check'|'missing';
type PantryTab='inventory'|'drinks'|'planning'|'shopping';

export function PantryDecisionScreen() {
  const app=useApp(),pantryStore=usePantry(),owned=useBottles(),making=useMaking();
  const {locale,unit}=app,{width}=useViewport();
  const copy:MakingCopy=(key,values)=>makingText(locale,key,values),pantryCopy=(key:Parameters<typeof pantryText>[1],values?:Record<string,string|number>)=>pantryText(locale,key,values);
  const params=useLocalSearchParams<{tab?:string}>();
  const [tab,setTab]=useState<PantryTab>(params.tab==='shopping'?'shopping':'inventory'),[servings,setServings]=useState(1),[shelf,setShelf]=useState<Shelf>('available'),[limit,setLimit]=useState(6);
  useEffect(()=>{setTab(params.tab==='shopping'?'shopping':params.tab==='planning'?'planning':params.tab==='drinks'?'drinks':'inventory');},[params.tab]);
  const scroll=useRef<ScrollView>(null),showTab=(value:PantryTab)=>{setTab(value);router.setParams({tab:value});scroll.current?.scrollTo({y:0,animated:false});};
  const ownedBottles=useMemo(()=>bottles.filter(item=>owned.ids.includes(item.id)),[owned.ids]);
  const mergedPantry=useMemo(()=>mergeOwnedPantry(pantryStore.pantry,ownedBottles),[pantryStore.pantry,ownedBottles]);
  const decisions=useMemo(()=>decisionsForPresence(catalogue,mergedPantry),[mergedPantry]);
  const [retrying,setRetrying]=useState(false),[busyVersion,setBusyVersion]=useState<string>(),[localError,setLocalError]=useState('');
  const pendingIds=useRef(new Map<string,string>()),columns=width>=1000?3:width>=680?2:1;
  const name=(id:string)=>materialDisplayName(id,locale);
  const sourceIssue=pantryStore.error==='read'||owned.error==='read'?'read':pantryStore.error==='write'||!pantryStore.storageAvailable||owned.error==='write'?'write':undefined;
  const sourceReadFailed=pantryStore.error==='read'||owned.error==='read',sourcesReady=pantryStore.hydrated&&owned.hydrated&&!sourceReadFailed,makingReady=making.hydrated&&making.error!=='read';
  const inventoryDisabled=Boolean(sourceIssue),emptyPantry=sourcesReady&&mergedPantry.ingredientIds.length===0;
  const filtered=decisions.filter(item=>shelf==='available'?decisionShelf(item)!=='missing':decisionShelf(item)===shelf),visible=filtered.slice(0,limit);
  const retry=async()=>{setRetrying(true);try{await making.retry();}finally{setRetrying(false);}};
  const retrySources=async()=>{setRetrying(true);try{if(pantryStore.error||!pantryStore.storageAvailable)await pantryStore.retry();if(owned.error==='read'||!owned.hydrated)await owned.load();else if(owned.error==='write')await owned.retrySave();}finally{setRetrying(false);}};
  const updateReview=async(recipe:MakingRecipe,field:'toolsConfirmed'|'preparationConfirmed',value:boolean)=>{const fingerprint=readinessFingerprint(recipe,catalogue);setBusyVersion(recipe.version.id);setLocalError('');try{const saved=await making.change(current=>{const existing=current.reviews.find(item=>item.versionId===recipe.version.id&&item.fingerprint===fingerprint);const review={versionId:recipe.version.id,fingerprint,toolsConfirmed:existing?.toolsConfirmed??false,preparationConfirmed:existing?.preparationConfirmed??false,[field]:value};return{...current,reviews:[...current.reviews.filter(item=>!(item.versionId===recipe.version.id&&item.fingerprint===fingerprint)),review]};});if(!saved)setLocalError(copy('storageWriteError'));}catch{setLocalError(copy('storageWriteError'));}finally{setBusyVersion(undefined);}};
  const start=async(recipe:MakingRecipe,targetServings:number)=>{const fingerprint=recipeFingerprint(recipe),existing=findResumableSession(making.state,fingerprint,targetServings,recipe.version.id);if(existing){router.push({pathname:'/make' as never,params:{session:existing.id}});return;}const key=`${fingerprint}:${targetServings}`,id=pendingIds.current.get(key)??`make-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;pendingIds.current.set(key,id);setBusyVersion(recipe.version.id);setLocalError('');try{const now=new Date().toISOString(),context={catalogue,pantry:pantryStore.pantry,ownedBottleIds:owned.ids,bottles,making:making.state},base=createSession(recipe,id,now,context),session=targetServings===base.servings?base:updateSession(base,{servings:targetServings},now,context);const saved=await making.change(current=>current.sessions.some(item=>item.id===id)?current:{...current,sessions:[...current.sessions,session]});if(saved){pendingIds.current.delete(key);router.push({pathname:'/make' as never,params:{session:id}});}else setLocalError(copy('storageWriteError'));}catch{setLocalError(copy('storageWriteError'));}finally{setBusyVersion(undefined);}};
  return <SafeAreaView style={s.screen}><ScrollView ref={scroll} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets><View style={s.shell}>
    <BrandToolbar {...app} showUnits={tab==='drinks'}/><View style={[s.hero,localStyles.hero]}><Heading level={1} style={s.title}>{copy('pantryTitle')}</Heading><Text style={s.subtitle}>{pantryCopy('intro')}</Text></View>
    {making.error?<PersistenceNotice kind={making.error} retrying={retrying} onRetry={()=>void retry()} copy={copy}/>:null}{localError?<Text accessibilityRole="alert" style={s.statusMissing}>{localError}</Text>:null}{sourceIssue?<View accessibilityRole="alert" style={[s.panel,sourceIssue==='read'?s.errorPanel:s.warningPanel,localStyles.panelPadding]}><Text style={s.strong}>{copy(sourceIssue==='write'?'storageWriteError':'storageReadError')}</Text><Action label={copy(retrying?'saving':'retry')} disabled={retrying} onPress={()=>void retrySources()}/></View>:null}
    <View style={localStyles.tabs}>{(['inventory','drinks','planning','shopping'] as PantryTab[]).map(value=><Pressable key={value} accessibilityRole="button" aria-pressed={tab===value} onPress={()=>showTab(value)} style={StyleSheet.flatten([localStyles.tab,tab===value&&localStyles.tabSelected])}><Text style={StyleSheet.flatten([localStyles.tabText,tab===value&&localStyles.tabTextSelected])}>{value==='shopping'?shoppingText(locale,'title'):pantryCopy(value==='inventory'?'inventoryTab':value==='drinks'?'drinksTab':'planningTab')}</Text></Pressable>)}</View>
    <View style={tab==='inventory'?localStyles.tabPanel:localStyles.hidden}>{!sourcesReady&&!sourceIssue?<Text style={s.empty}>{copy('loading')}</Text>:null}<View style={sourcesReady?undefined:localStyles.hidden}><PantryInventory disabled={inventoryDisabled} onFindDrinks={()=>showTab('drinks')}/></View></View>
    <View style={tab==='drinks'?localStyles.tabPanel:localStyles.hidden}>{!sourcesReady||!makingReady?<>{!sourceIssue&&!making.error?<Text style={s.empty}>{copy('loading')}</Text>:null}</>:emptyPantry?<View style={[s.panel,localStyles.emptyCallout]}><Heading level={2} style={localStyles.emptyTitle}>{pantryCopy('recipeEmptyTitle')}</Heading><Text style={s.body}>{pantryCopy('recipeEmptyHint')}</Text><Action primary label={pantryCopy('addIngredients')} onPress={()=>showTab('inventory')}/></View>:<>
      <View style={[s.panel,localStyles.servings]}><Text style={s.label}>{copy('servings')}</Text><View style={localStyles.servingControls}><Action label="−" disabled={servings<=1} onPress={()=>{setServings(value=>Math.max(1,value-1));setLimit(6);}}/><Text style={s.count}>{servings}</Text><Action label="＋" disabled={servings>=12} onPress={()=>{setServings(value=>Math.min(12,value+1));setLimit(6);}}/></View></View>
      <View style={localStyles.resultsHeader}><Heading level={2} style={s.sectionHeading}>{pantryCopy('recipeResults',{count:filtered.length})}</Heading></View><View style={s.chips}>{(['available','ready','check','missing'] as Shelf[]).map(value=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:shelf===value}} onPress={()=>{setShelf(value);setLimit(6);}} style={[s.chip,shelf===value&&s.chipSelected]}><Text style={s.chipText}>{pantryCopy(`${value}Shelf`)}</Text></Pressable>)}</View>
      {!filtered.length?<View style={[s.panel,localStyles.emptyCallout]}><Heading level={2} style={localStyles.emptyTitle}>{pantryCopy('noRecipes')}</Heading><Action label={pantryCopy('goInventory')} onPress={()=>showTab('inventory')}/></View>:<><View style={s.grid}>{visible.map(decision=>{const recipe=recipeSnapshot(catalogue,decision.versionId);return recipe?<DecisionCard key={`${decision.cocktailId}:${decision.versionId}:${servings}`} making={making.state} decision={decision} recipe={recipe} targetServings={servings} columns={columns} unit={unit} busy={busyVersion===decision.versionId||making.saving||Boolean(making.error)||Boolean(sourceIssue)} copy={copy} name={name} onReview={(field,value)=>void updateReview(recipe,field,value)} onStart={()=>void start(recipe,servings)}/>:null;})}</View>{filtered.length>limit?<Action label={`${copy('more')} ↓`} onPress={()=>setLimit(value=>value+(width<680?6:12))}/>:null}</>}
      <Action label={pantryCopy('planningTab')} onPress={()=>showTab('planning')}/>
    </>}</View>
    {tab==='planning'?<View style={localStyles.tabPanel}>{sourcesReady?<PantryRestockPlanner pantry={mergedPantry}/>:!sourceIssue?<Text style={s.empty}>{copy('loading')}</Text>:null}</View>:null}
    {tab==='shopping'?<View style={localStyles.tabPanel}>{sourcesReady?<ShoppingList pantry={mergedPantry} disabled={inventoryDisabled}/>:!sourceIssue?<Text style={s.empty}>{copy('loading')}</Text>:null}</View>:null}
  </View></ScrollView></SafeAreaView>;
}

function DecisionCard({making,decision,recipe,targetServings,columns,unit,busy,copy,name,onReview,onStart}:{making:MakingState;decision:OwnedVersionMatch;recipe:MakingRecipe;targetServings:number;columns:number;unit:'ml'|'oz';busy:boolean;copy:MakingCopy;name:(id:string)=>string;onReview:(field:'toolsConfirmed'|'preparationConfirmed',value:boolean)=>void;onStart:()=>void}) {
  const {locale}=useApp(),[actualReady,setActualReady]=useState(false),review=making.reviews.find(item=>item.versionId===recipe.version.id&&item.fingerprint===readinessFingerprint(recipe,catalogue));
  const active=findResumableSession(making,recipeFingerprint(recipe),targetServings,recipe.version.id),shelf=decisionShelf(decision),statusStyle=shelf==='ready'?s.statusReady:shelf==='check'?s.statusCheck:s.statusMissing;
  const needsPreparation=Boolean(recipe.preparation),canStart=(decision.missingIngredientIds.length===0||actualReady)&&Boolean(review?.toolsConfirmed)&&(!needsPreparation||Boolean(review?.preparationConfirmed));
  const rows=scaleRecipe(recipe,targetServings);
  return <View style={[s.card,{width:columns===3?'32%':columns===2?'49%':'100%'}]}><PhotoFrame asset={media[decision.cocktailId]} accent={catalogue.cocktails.find(item=>item.id===decision.cocktailId)?.accent??'#223028'} locale={locale} height={190} preserveAspect borderRadius={0}/><View style={s.cardCopy}>
    <Text style={[s.label,statusStyle]}>{pantryText(locale,`${shelf}Shelf`)}</Text><Heading level={3} style={s.cardTitle}>{recipeDisplayName(recipe, locale)}</Heading><CocktailOriginalName recipe={recipe} locale={locale} />
    <Link href={{pathname:'/cocktails/[id]',params:{id:decision.cocktailId,version:recipe.version.id,from:'pantry'}} as never} asChild><Pressable accessibilityRole="link" style={StyleSheet.flatten([s.button])}><Text style={s.buttonText}>{t(locale,'viewRecipe')} ↗</Text></Pressable></Link>
    <Disclosure title={copy('preparationReview')}><Text style={s.meta}>{copy('currentServings',{count:targetServings})}</Text><View>{rows.map((row,index)=>{const resolution=decision.materialResolutions?.find(item=>item.rowIndex===index),missing=resolution?resolution.match==='missing':decision.missingIngredientIds.includes(row.ingredientId),brand=decision.unconfirmedBrands.find(item=>item.ingredientId===row.ingredientId),source=sourceMaterialName(recipe.version,index,locale),main=name(row.ingredientId),actual=resolution?.supplyIngredientIds[0],actualName=actual?(catalogue.ingredients.find(item=>item.id===actual)?.name[locale]??actual):undefined;const amount=formatAmount(row.amount,row.unit,unit);return <View key={row.rowId} style={localStyles.ingredientRow}><Text style={s.strong}>{main}{row.optional?` · ${copy('optional')}`:''}</Text>{source!==main?<Text style={s.meta}>{actualName&&resolution?.match!=='missing'?materialText(locale,'using',{ingredient:actualName,source}):`${materialText(locale,'source')}: ${source}`}</Text>:null}{recipe.version.ingredients[index]?.note?<Text style={s.meta}>{recipe.version.ingredients[index]!.note![locale]||recipe.version.ingredients[index]!.note!.en}</Text>:null}<Text style={s.meta}>{amount.amount||'—'} {t(locale,`unit_${amount.unit}` as UiKey)}</Text>{missing?<Text style={s.statusMissing}>• {copy('missingForRecipe')}</Text>:brand?<Text style={s.statusCheck}>• {copy('reasonBrandUnconfirmed')} · {recipe.brandNames[brand.brandId]??brand.brandId}</Text>:<Text style={s.statusReady}>✓ {copy('ownedForRecipe')}</Text>}</View>;})}</View>
      <Text style={s.strong}>{copy('toolsNeeded')}</Text><Text style={s.body}>{copy('glass')}: {recipe.version.glass[locale]||recipe.version.glass.en}</Text>{recipe.preparation?.cards.map(card=>card.equipment?.[locale]||card.equipment?.en).filter((value):value is string=>Boolean(value)).map(value=><Text key={value} style={s.body}>• {value}</Text>)}{recipe.preparation?<Text style={s.body}>{recipe.preparation.summary[locale]||recipe.preparation.summary.en}</Text>:null}
      {recipe.preparation?.gaps.map((gap,index)=><Text key={index} style={s.issue}><Text style={s.issueDot}>• </Text>{gap[locale]||gap.en}</Text>)}
      <CheckRow checked={Boolean(review?.toolsConfirmed)} disabled={busy} title={copy('confirmTools')} hint={copy('toolsConfirmationHint')} onPress={()=>onReview('toolsConfirmed',!review?.toolsConfirmed)}/>{needsPreparation?<CheckRow checked={Boolean(review?.preparationConfirmed)} disabled={busy} title={copy('confirmPreparation')} hint={copy('preparationConfirmationHint')} onPress={()=>onReview('preparationConfirmed',!review?.preparationConfirmed)}/>:null}
      {decision.missingIngredientIds.length?<CheckRow checked={actualReady} disabled={busy} title={copy('missingReadyConfirm')} hint={copy('missingReadyHint')} onPress={()=>setActualReady(value=>!value)}/>:null}
      <Action primary label={active?copy('resumeMaking'):copy('startMaking')} disabled={busy||(!active&&!canStart)} onPress={active?()=>router.push({pathname:'/make' as never,params:{session:active.id}}):onStart}/>
    </Disclosure>
  </View></View>;
}

function CheckRow({checked,disabled,title,hint,onPress}:{checked:boolean;disabled:boolean;title:string;hint:string;onPress:()=>void}) {return <Pressable accessibilityRole="checkbox" accessibilityState={{checked,disabled}} disabled={disabled} onPress={onPress} style={s.checklist}><View style={[s.check,checked&&s.checkActive]}>{checked?<Text style={s.checkText}>✓</Text>:null}</View><View style={s.grow}><Text style={s.strong}>{title}</Text><Text style={s.meta}>{hint}</Text></View></Pressable>;}

const localStyles=StyleSheet.create({hero:{paddingBottom:8},tabs:{flexDirection:'row',flexWrap:'wrap',borderBottomWidth:1,borderBottomColor:colors.border,gap:24,rowGap:0},tab:{minHeight:48,flexShrink:0,justifyContent:'center',paddingHorizontal:2,paddingVertical:10,borderBottomWidth:2,borderBottomColor:'transparent'},tabSelected:{borderBottomColor:colors.accent},tabText:{color:colors.muted,fontSize:15,lineHeight:21,fontWeight:'700'},tabTextSelected:{color:colors.text},tabPanel:{gap:18},hidden:{display:'none'},panelPadding:{paddingHorizontal:24},servings:{minHeight:64,paddingVertical:9,paddingHorizontal:24,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderRadius:radii.medium},servingControls:{flexDirection:'row',alignItems:'center',gap:9},resultsHeader:{flexDirection:'row',alignItems:'baseline',justifyContent:'space-between',gap:12},emptyCallout:{width:'100%',maxWidth:760,alignItems:'flex-start',paddingHorizontal:24,paddingVertical:32,gap:17,backgroundColor:'transparent'},emptyTitle:{fontFamily:serif,fontSize:32,lineHeight:42,fontWeight:'400',color:colors.text},ingredientRow:{paddingVertical:7,gap:3},restockGrid:{gap:12},restockRow:{flexDirection:'row',alignItems:'stretch',gap:12},restockCell:{flex:1,minWidth:0,paddingHorizontal:16}});

export default PantryDecisionScreen;
