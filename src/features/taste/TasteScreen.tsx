import {recipeDisplayName} from '../../content/localization/display';
import {CocktailOriginalName} from '../names/OriginalName';
import {router,useLocalSearchParams} from 'expo-router';
import React,{useLayoutEffect,useMemo,useRef,useState} from 'react';
import {ScrollView,Text,TextInput,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {catalogue} from '../../content/catalogue';
import type {Flavour,Locale} from '../../domain/contracts';
import {tasteEditorTarget} from '../../domain/taste/editor';
import {useFavorites} from '../../platform/FavoritesProvider';
import {MotionTransition} from '../motion';
import {createFeedback,editFeedback} from '../../domain/taste';
import type {TasteFeedback,TasteFeedbackInput,TasteState} from '../../domain/taste/types';
import {tm,type TasteKey} from '../../i18n/taste';
import {useApp} from '../../platform/AppProvider';
import {useTaste} from '../../platform/TasteProvider';
import {BrandToolbar} from '../discovery/components';
import {Action,Choice,Panel} from './ui';
import {memoryStyles as s} from './styles';

type Undo={kind:'delete'|'clear';entries:TasteFeedback[]};
type Pending={kind:'save'}|({kind:'delete'|'clear'}&Undo)|{kind:'undo';undo:Undo};
const flavours:Flavour[]=['citrus','fruit','floral','herbal','spice','coffee'];
const blank=():TasteFeedbackInput=>({experience:'drank',sentiment:'neutral',tooSweet:false,tooStrong:false,likedFlavours:[],notes:''});
const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
const localeTag:Record<Locale,string>={en:'en-US',zh:'zh-CN',fr:'fr-FR',de:'de-DE',es:'es-ES',ko:'ko-KR',ja:'ja-JP',it:'it-IT'};

export default function TasteScreen(){
  const app=useApp(),taste=useTaste(),params=useLocalSearchParams<{version?:string|string[];entry?:string|string[];list?:string|string[]}>(),versionId=first(params.version),entryId=first(params.entry),listId=first(params.list);
  const copy=(key:TasteKey,values?:Record<string,string|number>)=>tm(app.locale,key,values);
  const favorites=useFavorites();
  const target=useMemo(()=>tasteEditorTarget({version:versionId,entry:entryId,list:listId},taste.state.entries,favorites.lists,catalogue),[versionId,entryId,listId,taste.state.entries,favorites.lists]);
  const recipe=target.kind==='create'?target.recipe:target.kind==='edit'?target.entry.recipe:null;
  const ready=taste.hydrated&&(!listId||favorites.hydrated);
  const listError=Boolean(listId&&favorites.error);
  const editorKey=entryId?`entry:${entryId}`:versionId?`version:${listId??''}:${versionId}`:'list';
  const [undo,setUndo]=useState<Undo|null>(null),[confirm,setConfirm]=useState<string|null>(null),[message,setMessage]=useState(''),[localError,setLocalError]=useState('');
  const pending=useRef<Pending|null>(null),writing=useRef(false),returnToList=useRef(false),scroll=useRef<ScrollView>(null);
  useLayoutEffect(()=>{scroll.current?.scrollTo({y:0,animated:false});},[editorKey]);
  const blocked=!ready||listError||taste.saving||taste.error==='read'||taste.error==='write';
  const finalize=(outcome:Pending)=>{pending.current=null;setLocalError('');if(outcome.kind==='save'){returnToList.current=false;setMessage(copy('saved'));router.setParams({entry:undefined,version:undefined,list:undefined});}else if(outcome.kind==='undo'){setUndo(null);setMessage(copy('updated'));}else{setUndo({kind:outcome.kind,entries:outcome.entries});setMessage(copy(outcome.kind==='delete'?'deleted':'cleared'));setConfirm(null);}};
  const retry=async()=>{if(listError)await favorites.retry();const ok=await taste.retry();if(ok&&pending.current)finalize(pending.current);};
  const mutate=async(next:(state:TasteState)=>TasteState,outcome:Pending)=>{if(blocked||writing.current)return;writing.current=true;setMessage('');setLocalError('');pending.current=outcome;try{const ok=await taste.change(next);if(ok)finalize(outcome);}catch{pending.current=null;setLocalError(copy('saveError'));}finally{writing.current=false;}};
  const remove=(entry:TasteFeedback)=>void mutate(state=>({...state,entries:state.entries.filter(item=>item.id!==entry.id)}),{kind:'delete',entries:[entry]});
  const clear=()=>{const removed=[...taste.state.entries];void mutate(state=>({...state,entries:[]}),{kind:'clear',entries:removed});};
  const restore=()=>{if(!undo)return;const restoring=undo;void mutate(state=>({...state,entries:[...state.entries,...restoring.entries.filter(entry=>!state.entries.some(current=>current.id===entry.id))].sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt)||a.id.localeCompare(b.id))}),{kind:'undo',undo:restoring});};
  const goBack=()=>{if(returnToList.current){returnToList.current=false;router.setParams({entry:undefined});return;}router.canGoBack()?router.back():recipe?router.replace({pathname:'/cocktails/[id]' as never,params:{id:recipe.version.cocktailId,version:recipe.version.id}}):router.replace('/my' as never);};
  return <SafeAreaView style={s.screen} edges={['top']}><MotionTransition changeKey={editorKey} style={{flex:1,minHeight:0}}><ScrollView ref={scroll} automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={s.page}><View style={s.shell}><BrandToolbar {...app}/><View style={s.nav}><Action quiet label={`← ${copy('back')}`} onPress={goBack}/></View>
    {!ready&&!taste.error&&!listError?<Text style={s.muted}>{copy('loading')}</Text>:null}
    {taste.error?<Panel warning><Text accessibilityRole="alert" style={s.error}>{copy(taste.error==='read'?'storageReadError':'storageWriteError')}</Text><Action disabled={taste.saving} label={copy(taste.saving?'retrying':'retry')} onPress={()=>void retry()}/></Panel>:null}
    {listError?<Panel warning><Text accessibilityRole="alert" style={s.error}>{copy('savedRecipeReadError')}</Text><Action label={copy('retry')} onPress={()=>void retry()}/></Panel>:null}
    {localError?<Text accessibilityRole="alert" style={s.error}>{localError}</Text>:null}
    {taste.saving?<Text accessibilityLiveRegion="polite" style={s.muted}>{copy('saving')}</Text>:null}
    {message?<Panel raised><Text accessibilityLiveRegion="polite" style={s.success}>{message}</Text>{undo?<Action label={copy('undo')} onPress={restore} disabled={blocked}/>:null}</Panel>:null}
      {ready&&!listError?(target.kind==='create'?<FeedbackEditor key={editorKey} recipe={target.recipe} initial={blank()} locale={app.locale} disabled={blocked} saveKey="saveMemory" onCancel={goBack} onSave={input=>{
        const id=`taste-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
        void mutate(state=>state.entries.some(entry=>entry.id===id)?state:{...state,entries:[...state.entries,createFeedback(target.recipe,id,new Date().toISOString(),input)]},{kind:'save'});
      }}/>:target.kind==='edit'?<EntryEditor key={editorKey} entry={target.entry} locale={app.locale} disabled={blocked} onCancel={goBack} onSave={(entry,input)=>void mutate(state=>({...state,entries:state.entries.map(item=>item.id===entry.id?editFeedback(item,new Date().toISOString(),input):item)}),{kind:'save'})}/>:target.kind==='missing'?<Missing copy={copy}/>:<MemoryList entries={taste.state.entries} locale={app.locale} disabled={blocked} confirm={confirm} setConfirm={setConfirm} onEdit={id=>{returnToList.current=true;router.setParams({entry:id});}} onDelete={remove} onClear={clear}/>):null}
  </View></ScrollView></MotionTransition></SafeAreaView>;
}

function Missing({copy}:{copy:(key:TasteKey,values?:Record<string,string|number>)=>string}){return <Panel><Text accessibilityRole="header" style={s.heading}>{copy('tasteMissing')}</Text><Action label={copy('back')} onPress={()=>router.replace('/discover' as never)}/></Panel>;}

function EntryEditor({entry,locale,disabled,onCancel,onSave}:{entry?:TasteFeedback;locale:Locale;disabled:boolean;onCancel:()=>void;onSave:(entry:TasteFeedback,input:TasteFeedbackInput)=>void}){
  if(!entry)return <Panel><Text style={s.body}>{tm(locale,'tasteMissing')}</Text><Action label={tm(locale,'back')} onPress={onCancel}/></Panel>;
  const archived=!catalogue.versions.some(version=>version.id===entry.recipe.version.id);
  return <>{archived?<Panel warning><Text style={s.body}>{tm(locale,'originalUnavailable')}</Text></Panel>:null}<FeedbackEditor recipe={entry.recipe} initial={entry} locale={locale} disabled={disabled} saveKey="updateMemory" onCancel={onCancel} onSave={input=>onSave(entry,input)}/></>;
}

function FeedbackEditor({recipe,initial,locale,disabled,saveKey,onCancel,onSave}:{recipe:TasteFeedback['recipe'];initial:TasteFeedbackInput;locale:Locale;disabled:boolean;saveKey:TasteKey;onCancel:()=>void;onSave:(input:TasteFeedbackInput)=>void}){
  const [draft,setDraft]=useState<TasteFeedbackInput>(()=>({experience:initial.experience,sentiment:initial.sentiment,tooSweet:initial.tooSweet,tooStrong:initial.tooStrong,likedFlavours:[...initial.likedFlavours],notes:initial.notes})),copy=(key:TasteKey,values?:Record<string,string|number>)=>tm(locale,key,values);
  const set=<K extends keyof TasteFeedbackInput>(key:K,value:TasteFeedbackInput[K])=>setDraft(current=>({...current,[key]:value}));
  const toggleFlavour=(flavour:Flavour)=>set('likedFlavours',draft.likedFlavours.includes(flavour)?draft.likedFlavours.filter(item=>item!==flavour):[...draft.likedFlavours,flavour]);
  return <><View style={s.hero}><Text accessibilityRole="header" style={s.title}>{copy('flavourExperience',{name:recipeDisplayName(recipe,locale)})}</Text><CocktailOriginalName recipe={recipe} locale={locale} /></View><Panel raised><Text style={s.body}>{copy('recordIntro')}</Text><Text style={s.label}>{copy('experienceLabel')}</Text><View style={s.chips}>{(['made','drank','both'] as const).map(value=><Choice key={value} label={copy(`experience${capitalized(value)}` as TasteKey)} selected={draft.experience===value} disabled={disabled} onPress={()=>set('experience',value)}/>)}</View><Text style={s.label}>{copy('sentimentLabel')}</Text><View style={s.chips}>{(['neutral','like','dislike'] as const).map(value=><Choice key={value} label={copy(`sentiment${capitalized(value)}` as TasteKey)} selected={draft.sentiment===value} disabled={disabled} onPress={()=>set('sentiment',value)}/>)}</View><Text style={s.label}>{copy('adjustmentsLabel')}</Text><View style={s.chips}><Choice label={copy('tooSweet')} selected={draft.tooSweet} disabled={disabled} onPress={()=>set('tooSweet',!draft.tooSweet)}/><Choice label={copy('tooStrong')} selected={draft.tooStrong} disabled={disabled} onPress={()=>set('tooStrong',!draft.tooStrong)}/></View><Text style={s.label}>{copy('likedFlavoursLabel')}</Text><View style={s.chips}>{flavours.map(flavour=><Choice key={flavour} label={copy(`flavour.${flavour}` as TasteKey)} selected={draft.likedFlavours.includes(flavour)} disabled={disabled} onPress={()=>toggleFlavour(flavour)}/>)}</View><View style={s.field}><Text style={s.label}>{copy('notesLabel')}</Text><TextInput accessibilityLabel={copy('notesLabel')} editable={!disabled} multiline maxLength={4000} value={draft.notes} onChangeText={value=>set('notes',value)} placeholder={copy('notesHint')} placeholderTextColor="#8b9b90" style={s.input}/><Text style={s.muted}>{copy('privateNote')}</Text></View><View style={s.row}><Action primary disabled={disabled} label={copy(saveKey)} onPress={()=>onSave(draft)}/><Action quiet label={copy('cancel')} onPress={onCancel}/></View></Panel></>;
}

function MemoryList({entries,locale,disabled,confirm,setConfirm,onEdit,onDelete,onClear}:{entries:TasteFeedback[];locale:Locale;disabled:boolean;confirm:string|null;setConfirm:(value:string|null)=>void;onEdit:(id:string)=>void;onDelete:(entry:TasteFeedback)=>void;onClear:()=>void}){
  const copy=(key:TasteKey,values?:Record<string,string|number>)=>tm(locale,key,values),sorted=[...entries].sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt)||b.id.localeCompare(a.id));
  return <><View style={s.hero}><Text style={s.eyebrow}>{copy('tasteEyebrow')}</Text><Text accessibilityRole="header" style={s.title}>{copy('tasteTitle')}</Text><Text style={s.body}>{copy('tasteIntro')}</Text></View><View style={s.row}><Action label={copy('exportAll')} onPress={()=>router.push('/backup' as never)}/>{entries.length?<Action danger label={copy('clearAll')} disabled={disabled} onPress={()=>setConfirm('clear')}/>:null}</View><Text style={s.muted}>{copy('exportHint')}</Text>{confirm==='clear'?<Panel warning><Text style={s.heading}>{copy('clearConfirmTitle')}</Text><Text style={s.body}>{copy('clearConfirmBody',{count:entries.length})}</Text><View style={s.row}><Action danger disabled={disabled} label={copy('confirmClear')} onPress={onClear}/><Action quiet label={copy('cancel')} onPress={()=>setConfirm(null)}/></View></Panel>:null}{!entries.length?<Panel><Text style={s.body}>{copy('tasteEmpty')}</Text></Panel>:<View style={s.cards}>{sorted.map(entry=><MemoryCard key={entry.id} entry={entry} locale={locale} disabled={disabled} confirming={confirm===entry.id} onConfirming={value=>setConfirm(value?entry.id:null)} onEdit={()=>onEdit(entry.id)} onDelete={()=>onDelete(entry)}/>)}</View>}</>;
}

function MemoryCard({entry,locale,disabled,confirming,onConfirming,onEdit,onDelete}:{entry:TasteFeedback;locale:Locale;disabled:boolean;confirming:boolean;onConfirming:(value:boolean)=>void;onEdit:()=>void;onDelete:()=>void}){
  const copy=(key:TasteKey,values?:Record<string,string|number>)=>tm(locale,key,values),when=(iso:string)=>new Date(iso).toLocaleString(localeTag[locale]);
  const details=[copy(`experience${capitalized(entry.experience)}` as TasteKey),copy(`sentiment${capitalized(entry.sentiment)}` as TasteKey),entry.tooSweet?copy('tooSweet'):'',entry.tooStrong?copy('tooStrong'):'',...entry.likedFlavours.map(item=>copy(`flavour.${item}` as TasteKey))].filter(Boolean).join(' · ');
  const archived=!catalogue.versions.some(version=>version.id===entry.recipe.version.id);
  return <Panel><Text style={s.cardTitle}>{recipeDisplayName(entry.recipe,locale)}</Text><CocktailOriginalName recipe={entry.recipe} locale={locale} />{archived?<Text style={s.muted}>{copy('originalUnavailable')}</Text>:null}<Text style={s.body}>{details}</Text>{entry.notes?<Text style={s.body}>{entry.notes}</Text>:null}<Text style={s.muted}>{copy('createdAt',{date:when(entry.createdAt)})}{entry.updatedAt!==entry.createdAt?` · ${copy('updatedAt',{date:when(entry.updatedAt)})}`:''}</Text>{confirming?<><Text style={s.heading}>{copy('deleteConfirmTitle')}</Text><Text style={s.body}>{copy('deleteConfirmBody',{name:recipeDisplayName(entry.recipe,locale)})}</Text><View style={s.row}><Action danger disabled={disabled} label={copy('confirmDelete')} onPress={onDelete}/><Action quiet label={copy('cancel')} onPress={()=>onConfirming(false)}/></View></>:<View style={s.row}><Action label={copy('edit')} disabled={disabled} onPress={onEdit}/><Action danger label={copy('delete')} disabled={disabled} onPress={()=>onConfirming(true)}/></View>}</Panel>;
}

function capitalized(value:string){return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;}
