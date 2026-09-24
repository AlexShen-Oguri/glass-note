import {recipeDisplayCocktail,recipeDisplayName} from '../../content/localization/display';
import {router,useLocalSearchParams} from 'expo-router';
import React,{useEffect,useMemo,useState} from 'react';
import {Pressable,ScrollView,Text,TextInput,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {bottles} from '../../content/bottles';
import {catalogue} from '../../content/catalogue';
import {bottleDisplayName,bottleSearchNames} from '../../domain/bottles/format';
import type {Bottle} from '../../domain/bottles/types';
import type {Locale,MeasureUnit} from '../../domain/contracts';
import {recipeSnapshot} from '../../domain/making';
import type {MakingRecipe} from '../../domain/making/types';
import {buildOrderCard,formatOrderCard,formatSimpleOrderCard,type OrderCardFormatCopy,type OrderSimpleFormatCopy,type OrderTextMode} from '../../domain/order';
import {normalizeSearchText,scoreTextSearch} from '../../domain/search';
import type {UiKey} from '../../i18n/keys';
import {tm,type TasteKey} from '../../i18n/taste';
import {orderCopy,type Round175OrderKey} from '../../i18n/round17-5-order';
import {p02BottleText} from '../../i18n/p02-bottles';
import {t} from '../../i18n/ui';
import {useApp} from '../../platform/AppProvider';
import {copyOrderText,shareOrderText} from '../../platform/orderShare';
import {colors} from '../../theme/tokens';
import {BrandToolbar} from '../discovery/components';
import {useMotionEnabled} from '../motion';
import {memoryStyles as s} from '../taste/styles';
import {Action,Choice,Panel} from '../taste/ui';
import {OrderCardModal} from './OrderCardModal';
import {OrderCardVisual} from './OrderCardVisual';
import {orderStyles as os} from './orderStyles';

type Status='copied'|'copyUnavailable'|'shared'|'shareCancelled'|'shareUnavailable'|'';
const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;

export default function OrderScreen(){
  const app=useApp(),params=useLocalSearchParams<{version?:string|string[]}>(),versionId=first(params.version),recipe=useMemo(()=>versionId?recipeSnapshot(catalogue,versionId):null,[versionId]);
  const copy=(key:TasteKey,values?:Record<string,string|number>)=>tm(app.locale,key,values),goBack=()=>router.canGoBack()?router.back():recipe?router.replace({pathname:'/cocktails/[id]' as never,params:{id:recipe.version.cocktailId,version:recipe.version.id}}):router.replace('/discover' as never);
  return <SafeAreaView style={s.screen} edges={['top']}><ScrollView automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={s.page}><View style={s.shell}><BrandToolbar {...app}/><View style={s.nav}><Action quiet label={`← ${copy('back')}`} onPress={goBack}/></View>{recipe?.version.sourceChecked?<OrderComposer key={recipe.version.id} recipe={recipe} locale={app.locale} unit={app.unit}/>:<Panel><Text accessibilityRole="header" style={s.heading}>{copy('orderMissing')}</Text><Text style={s.body}>{copy('exactPublicVersion')}</Text><Action label={copy('back')} onPress={goBack}/></Panel>}</View></ScrollView></SafeAreaView>;
}

function OrderComposer({recipe,locale,unit}:{recipe:MakingRecipe;locale:Locale;unit:'ml'|'oz'}){
  const copy=(key:TasteKey,values?:Record<string,string|number>)=>tm(locale,key,values),motionEnabled=useMotionEnabled();
  const [mode,setMode]=useState<OrderTextMode>('localized'),[bottleIds,setBottleIds]=useState<Record<string,string>>({}),[modifications,setModifications]=useState<Record<string,string>>({}),[openRow,setOpenRow]=useState<string|null>(null),[customizing,setCustomizing]=useState(false),[detailsOpen,setDetailsOpen]=useState(false),[showingCard,setShowingCard]=useState(false),[status,setStatus]=useState<Status>(''),[busy,setBusy]=useState<'copy'|'share'|''>('');
  const input=useMemo(()=>({locale,textMode:mode,unitPreference:unit,bottleIdsByRow:bottleIds,modificationsByRow:modifications}),[bottleIds,locale,mode,modifications,unit]);
  const built=useMemo(()=>{try{const card=buildOrderCard(recipe,bottles,input),item=recipeDisplayCocktail(recipe);card.title=card.requestedOriginal?(item?.originalName??card.title):recipeDisplayName(recipe,card.textLocale);card.originalTitle=item?.originalName??card.originalTitle;const cardCopy=simpleCopy(card.textLocale);return{card,copy:cardCopy,text:formatSimpleOrderCard(card,cardCopy),details:formatOrderCard(card,formatCopy(card.textLocale))};}catch{return null;}},[input,recipe]);
  useEffect(()=>setStatus(''),[built?.text]);
  const openRecipe=()=>{if(!built)return;setShowingCard(false);void router.push({pathname:'/cocktails/[id]' as never,params:{id:built.card.cocktailId,version:built.card.versionId}});};
  const act=async(kind:'copy'|'share')=>{if(!built||busy)return;setBusy(kind);setStatus('');try{if(kind==='copy'){const result=await copyOrderText(built.text);setStatus(result==='copied'?'copied':'copyUnavailable');}else{const result=await shareOrderText(built.text);setStatus(result==='shared'?'shared':result==='cancelled'?'shareCancelled':'shareUnavailable');}}finally{setBusy('');}};
  if(!built)return <Panel warning><Text accessibilityRole="alert" style={s.error}>{copy('orderMissing')}</Text></Panel>;
  const {card}=built,failed=status==='copyUnavailable'||status==='shareUnavailable',cancelled=status==='shareCancelled';
  return <>
    <View style={s.hero}><Text accessibilityRole="header" style={s.title}>{copy('orderTitle')}</Text></View>
    <Panel><Text style={s.heading}>{copy('languageLabel')}</Text><View style={s.chips}><Choice label={copy('currentLanguage')} selected={mode==='localized'} onPress={()=>setMode('localized')}/><Choice label={copy('originalLanguage')} selected={mode==='original'} onPress={()=>setMode('original')}/></View>{mode==='original'?<Text style={s.muted}>{card.actualOriginal?copy('originalParaphrase'):copy('originalUnavailable')}</Text>:recipe.version.translationStatus==='draft'?<Text style={s.muted}>{copy('translationDraft')}</Text>:null}</Panel>
    <View style={[s.panel,s.raised]}><Text style={s.heading}>{copy('previewTitle')}</Text><Text style={s.muted}>{orderCopy(locale,'simpleCardHint')}</Text><View style={os.previewWrap}><OrderCardVisual card={card} copy={built.copy}/>{failed?<Text selectable style={[s.previewText,{width:'100%',maxWidth:640,marginTop:12}]}>{built.text}</Text>:null}</View><View style={os.previewActions}><Action primary disabled={Boolean(busy)} label={orderCopy(locale,'showCard')} onPress={()=>setShowingCard(true)}/><Action disabled={Boolean(busy)} label={orderCopy(locale,'copyText')} onPress={()=>void act('copy')}/><Action quiet disabled={Boolean(busy)} label={orderCopy(locale,'shareText')} onPress={()=>void act('share')}/></View><Pressable accessibilityRole="link" accessibilityLabel={orderCopy(locale,'viewRecipe')} onPress={openRecipe} style={({pressed})=>[os.viewRecipe,pressed&&{opacity:.68}]}><Text style={os.viewRecipeText}>{orderCopy(locale,'viewRecipe')}</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{expanded:detailsOpen}} accessibilityLabel={orderCopy(locale,detailsOpen?'hideDetails':'details')} onPress={()=>setDetailsOpen(current=>!current)} style={({pressed})=>[os.viewRecipe,pressed&&{opacity:.68}]}><Text style={os.viewRecipeText}>{orderCopy(locale,detailsOpen?'hideDetails':'details')}</Text></Pressable>{detailsOpen?<View style={os.detailsWrap}><Text selectable style={os.detailsText}>{built.details}</Text></View>:null}{status?<Text accessibilityLiveRegion="polite" style={failed?s.error:cancelled?s.muted:s.success}>{statusText(locale,status)}</Text>:null}{failed?<Text style={s.muted}>{orderCopy(locale,'selectTextHint')}</Text>:null}</View>
    <Action expanded={customizing} label={customizing?orderCopy(locale,'hideRequest'):orderCopy(locale,'addRequest')} onPress={()=>setCustomizing(current=>!current)}/>{customizing?<><Panel><Text style={s.heading}>{copy('ingredients')}</Text><Text style={s.body}>{orderCopy(locale,'requestHint')}</Text>{card.rows.map(row=>{const sourceBottle=row.selectedBottle?bottles.find(bottle=>bottle.id===row.selectedBottle!.id):undefined;const originalName=sourceBottle?bottleDisplayName(sourceBottle):'';const localizedName=sourceBottle?bottleDisplayName(sourceBottle,locale):originalName;const displayName=mode==='original'?originalName:localizedName;return <View key={row.rowId} style={s.ingredient}><View style={s.ingredientHeader}><View style={s.grow}><Text style={s.body}>{row.ingredientName}{row.optional?` · ${copy('optional')}`:''}</Text>{row.sourceBrandName?<Text style={s.muted}>{copy('sourceBrand')}: {row.sourceBrandName}</Text>:null}</View><Text style={s.ingredientAmount}>{row.amount} {formatUnit(locale,row.unit)}</Text></View>{row.selectedBottle?<View style={s.split}><View style={s.grow}><Text style={s.label}>{copy('bottleLabel')}</Text><Text style={s.body}>{displayName||`${row.selectedBottle.brandName} ${row.selectedBottle.name}`}</Text>{mode==='localized'&&localizedName!==originalName&&<Text style={s.muted}>{p02BottleText(locale,'originalName')}: {originalName}</Text>}</View><Action quiet label={copy('clearBottle')} accessibilityLabel={`${copy('clearBottle')} · ${row.ingredientName}`} onPress={()=>setBottleIds(current=>omit(current,row.rowId))}/></View>:null}<Action label={copy('chooseBottle')} accessibilityLabel={`${copy('chooseBottle')} · ${row.ingredientName}`} onPress={()=>setOpenRow(current=>current===row.rowId?null:row.rowId)}/>{openRow===row.rowId?<BottleSearch locale={locale} nameLocale={mode==='localized'?locale:undefined} ingredientId={row.ingredientId} onSelect={id=>{setBottleIds(current=>({...current,[row.rowId]:id}));setOpenRow(null);}}/>:null}<View style={s.field}><Text style={s.label}>{copy('modificationsLabel')}</Text><TextInput accessibilityLabel={`${copy('modificationsLabel')} · ${row.ingredientName}`} value={modifications[row.rowId]??''} onChangeText={value=>setModifications(current=>({...current,[row.rowId]:value}))} maxLength={500} placeholder={copy('modificationsHint')} placeholderTextColor={colors.muted} style={s.searchInput}/></View></View>;})}</Panel><Text style={s.muted}>{copy('modificationsPrivateHint')}</Text><Text style={s.muted}>{copy('noPrivateNotes')}</Text></>:null}
    <OrderCardModal visible={showingCard} card={card} locale={locale} copy={built.copy} motionEnabled={motionEnabled} onClose={()=>setShowingCard(false)} onViewRecipe={openRecipe}/>
  </>;
}

function BottleSearch({locale,nameLocale,ingredientId,onSelect}:{locale:Locale;nameLocale:Locale|undefined;ingredientId:string;onSelect:(id:string)=>void}){
  const [query,setQuery]=useState(''),copy=(key:TasteKey)=>tm(locale,key),compatible=useMemo(()=>bottles.filter(bottle=>bottle.ingredientIds.includes(ingredientId)),[ingredientId]);
  const matches=useMemo(()=>normalizeSearchText(query)?compatible.map(bottle=>({bottle,score:scoreTextSearch(query,bottleSearchNames(bottle))})).filter(item=>item.score>0).sort((a,b)=>b.score-a.score).slice(0,8).map(item=>item.bottle):[],[compatible,query]);
  return <View style={s.panel}><TextInput autoFocus accessibilityLabel={copy('bottleLabel')} value={query} onChangeText={setQuery} placeholder={copy('bottleSearchHint')} placeholderTextColor={colors.muted} style={s.searchInput}/>{compatible.length===0?<Text style={s.muted}>{copy('bottleNoCompatible')}</Text>:!normalizeSearchText(query)?<Text style={s.muted}>{copy('bottleSearchEmpty')}</Text>:matches.length===0?<Text style={s.muted}>{copy('bottleNoMatches')}</Text>:matches.map(bottle=><BottleResult key={bottle.id} bottle={bottle} locale={locale} nameLocale={nameLocale} onPress={()=>onSelect(bottle.id)}/>)}</View>;
}

function BottleResult({bottle,locale,nameLocale,onPress}:{bottle:Bottle;locale:Locale;nameLocale:Locale|undefined;onPress:()=>void}){const name=bottleDisplayName(bottle,nameLocale),original=bottleDisplayName(bottle);return <Pressable accessibilityRole="button" accessibilityLabel={name} onPress={onPress} style={({pressed})=>[s.bottleResult,pressed&&s.pressed]}><Text style={s.body}>{name}</Text>{nameLocale&&name!==original&&<Text style={s.muted}>{p02BottleText(locale,'originalName')}: {original}</Text>}<Text style={s.muted}>{bottle.brandName}{bottle.abv===null?'':` · ${bottle.abv}% ABV`}</Text></Pressable>;}

function simpleCopy(locale:Locale):OrderSimpleFormatCopy{return{originalName:orderCopy(locale,'originalName'),ingredients:orderCopy(locale,'ingredients'),requests:orderCopy(locale,'requests'),optional:orderCopy(locale,'optional'),brand:orderCopy(locale,'brand'),modification:orderCopy(locale,'modification'),sourceBrand:orderCopy(locale,'sourceBrand'),source:orderCopy(locale,'source'),sourceVersion:orderCopy(locale,'sourceVersion')};}
function formatCopy(locale:Locale):OrderCardFormatCopy{return{version:t(locale,'version'),source:tm(locale,'source'),servings:t(locale,'servings'),ingredients:tm(locale,'ingredients'),steps:t(locale,'method'),glass:t(locale,'glass'),garnish:t(locale,'garnish'),flavours:t(locale,'flavours'),strength:t(locale,'strength'),profile:t(locale,'profile'),profileBasis:tm(locale,'profileBasisLabel'),sourceProfile:tm(locale,'sourceProfile'),editorialProfile:tm(locale,'editorialProfile'),translationStatus:tm(locale,'translationStatusLabel'),draft:tm(locale,'draft'),reviewed:tm(locale,'reviewed'),abv:'ABV',unknown:t(locale,'unknown'),sourceBrand:tm(locale,'sourceBrand'),bottle:tm(locale,'bottleLabel'),modification:tm(locale,'modificationsLabel'),brandSubstitution:tm(locale,'brandSubstitution'),optional:tm(locale,'optional'),original:tm(locale,'originalParaphrase'),formatUnit:measure=>formatUnit(locale,measure),formatFlavour:flavour=>t(locale,`flavour.${flavour}` as UiKey),formatStrength:strength=>t(locale,`strength.${strength}` as UiKey)};}
function statusText(locale:Locale,status:Exclude<Status,''>):string{return orderCopy(locale,status as Round175OrderKey);}
function formatUnit(locale:Locale,unit:MeasureUnit){return t(locale,`unit_${unit}` as UiKey);}
function omit(values:Record<string,string>,key:string){const next={...values};delete next[key];return next;}
