import React,{useState,useMemo} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {bottles} from '../../content/bottles';
import {catalogue} from '../../content/catalogue';
import {ginComparisonPilot} from '../../content/gin-comparison-pilot';
import type {Bottle,BottleFamily} from '../../domain/bottles/types';
import {bottleDisplayName,bottleSearchNames} from '../../domain/bottles/format';
import {normalizeSearchText,scoreTextSearch} from '../../domain/search';
import type {Locale} from '../../domain/contracts';
import {useApp} from '../../platform/AppProvider';
import {useLab} from '../../platform/LabProvider';
import {useBottles} from '../../platform/BottleProvider';
import {labText} from '../../i18n/lab';
import {p02BottleText} from '../../i18n/p02-bottles';
import {round17ComparisonText} from '../../i18n/round17-comparison';
import {workText,type WorkspaceKey} from '../../i18n/workspace';
import {t} from '../../i18n/ui';
import {bottleFamilyName as familyName,bottleProfileLabel} from '../../i18n/bottle-categories';
import {colors,radii} from '../../theme/tokens';
import {Heading} from '../navigation/Heading';
import {Action,Field,Panel,Workspace,ws} from './ui';
import {BottlePhoto,BottlePhotoSource} from './BottlePhoto';
import {BottleComparisonLab} from './comparison/BottleComparisonLab';
import {BottleComparisonTable} from './comparison/BottleComparisonTable';

export default function BottleScreen() {
  const {locale,unit}=useApp();const w=(key:WorkspaceKey)=>workText(locale,key);const lab=useLab();const owned=useBottles();
  const params=useLocalSearchParams<{ingredient?:string}>();
  const p=(key:Parameters<typeof p02BottleText>[1],values?:Record<string,string|number>)=>p02BottleText(locale,key,values);
  const [search,setSearch]=useState('');const [family,setFamily]=useState<BottleFamily|'all'>('all');const [mine,setMine]=useState(false);const [limit,setLimit]=useState(24);const [compare,setCompare]=useState<string[]>([]);const [view,setView]=useState<'browse'|'select'|'compare'>('browse');const [openBottle,setOpenBottle]=useState('');const [error,setError]=useState('');
  const ingredient=catalogue.ingredients.find(i=>i.id===params.ingredient);
  const families=[...new Set(bottles.map(b=>b.family))];
  const tokens=normalizeSearchText(search).split(' ').filter(Boolean);
  const visible=useMemo(()=>bottles.filter(b=>(!ingredient||b.ingredientIds.includes(ingredient.id))&&(family==='all'||b.family===family)&&(!mine||owned.ids.includes(b.id)))
    .map(b=>({b,score:tokens.length?Math.max(scoreTextSearch(search,bottleSearchNames(b))*2,scoreTextSearch(search,[...b.flavours,...Object.values(b.profile)])):1}))
    .filter(r=>r.score>0).sort((a,b)=>b.score-a.score).map(r=>r.b),[search,family,mine,owned.ids,ingredient]);
  const selected=compare.map(id=>bottles.find(b=>b.id===id)!).filter(Boolean);
  const comparisonLocked=lab.saving||lab.error==='write';
  const toggleCompare=(id:string)=>setCompare(ids=>{
    if(ids.includes(id))return ids.filter(value=>value!==id);
    const bottle=bottles.find(item=>item.id===id);
    const first=bottles.find(item=>item.id===ids[0]);
    return bottle&&ids.length<3&&(!first||first.family===bottle.family)?[...ids,id]:ids;
  });
  const clearComparison=()=>{if(comparisonLocked)return;setCompare([]);setView('select');};
  const cancelComparison=()=>{if(comparisonLocked)return;setCompare([]);setView('browse');};
  const leaveFocusedComparison=(next:'browse'|'select')=>{if(comparisonLocked)return;setView(next);};
  const removeFromFocusedComparison=(id:string)=>{if(comparisonLocked)return;toggleCompare(id);if(selected.length<=2)setView('select');};
  const openGinPilot=()=>{if(comparisonLocked)return;setCompare(ginComparisonPilot.bottles.map(record=>record.bottleId));setView('compare');};
  const trial=(b:Bottle)=>{try{const id=lab.createProject({name:bottleDisplayName(b),goal:w('trialGoal')});const p=lab.getSnapshot().projects.find(p=>p.id===id)!;lab.updateVersion(id,p.versions[0]!.id,{ingredients:[{id:`bottle-${b.id}`,name:catalogue.ingredients.find(i=>i.id===b.ingredientIds[0])?.name[locale]??b.name,amount:'',unit:'ml',ingredientId:b.ingredientIds[0],bottleId:b.id,bottleName:bottleDisplayName(b)}],notes:''});router.push({pathname:'/lab' as never,params:{project:id}});}catch{setError(labText(locale,'failed'));}};
  return <Workspace section="bottles" showUnits={view==='compare'}>
    <View style={styles.intro}><Heading level={1} style={ws.title}>{view==='compare'?w('compare'):labText(locale,'bottles')}</Heading><Text style={ws.muted}>{catalogue.brands.length} {t(locale,'brand')} · {bottles.length} {w('products')}</Text></View>
    {view!=='compare'&&<>
    <Field label={w('search')} placeholder={p('searchPlaceholder')} value={search} onChange={value=>{setSearch(value);setLimit(24);}}/>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={{gap:8,paddingBottom:8}}><Action label={w('all')} selected={family==='all'&&!mine} onPress={()=>{setFamily('all');setMine(false);setLimit(24);}}/>{families.map(f=><Action key={f} label={familyName(f,locale)} selected={family===f} onPress={()=>{setFamily(family===f?'all':f);setLimit(24);}}/>)}</ScrollView>
    <View style={ws.row}><Action label={w('owned')+` · ${owned.ids.length}`} selected={mine} onPress={()=>{setMine(!mine);setLimit(24);}}/>{ingredient&&<Action label={ingredient.name[locale]+' ×'} selected onPress={()=>router.replace('/bottles' as never)}/>}<Action label={w('compare')+(selected.length?` · ${selected.length}`:'')} selected={view==='select'} onPress={()=>setView('select')}/><Text style={ws.muted}>{visible.length}</Text></View>
    {!!owned.error&&<Panel><Text accessibilityRole="alert" style={ws.error}>{labText(locale,'storageError')}</Text><Action label={labText(locale,owned.hydrated?'retrySave':'retry')} onPress={()=>void(owned.hydrated?owned.retrySave():owned.load())}/></Panel>}
    {!!error&&<Text accessibilityRole="alert" style={ws.error}>{error}</Text>}
    {view==='select'&&<SelectionTray selected={selected} locale={locale} comparisonLocked={comparisonLocked} onClear={clearComparison} onCancel={cancelComparison} onOpen={()=>setView('compare')} onPilot={openGinPilot}/>}
    {!visible.length&&<Text style={ws.body}>{w('empty')}</Text>}
    <View style={ws.twoCol}>{visible.slice(0,limit).map(b=><BottleCard key={b.id} bottle={b} locale={locale} compareMode={view==='select'} compared={compare.includes(b.id)} compareDisabled={comparisonLocked||!compare.includes(b.id)&&(compare.length===3||selected.length>0&&selected[0]!.family!==b.family)} detailsOpen={openBottle===b.id} owned={owned.ids.includes(b.id)} ownershipHydrated={owned.hydrated} labHydrated={lab.hydrated} onToggleDetails={()=>setOpenBottle(openBottle===b.id?'':b.id)} onToggleCompare={()=>toggleCompare(b.id)} onToggleOwned={()=>owned.toggle(b.id)} onTrial={()=>trial(b)}/>)}</View>
    {visible.length>limit&&<Action label={w('more')} onPress={()=>setLimit(limit+24)}/>}<Text style={ws.muted}>{w('local')}</Text>
    </>}
    {selected.length>=2&&<View style={view==='compare'?undefined:styles.hiddenComparison}>
      <FocusedComparison selected={selected} locale={locale} unit={unit} comparisonLocked={comparisonLocked} onBack={()=>leaveFocusedComparison('select')} onClose={()=>leaveFocusedComparison('browse')} onClear={clearComparison} onRemove={removeFromFocusedComparison}/>
    </View>}
  </Workspace>;
}

function SelectionTray({selected,locale,comparisonLocked,onClear,onCancel,onOpen,onPilot}:{selected:Bottle[];locale:Locale;comparisonLocked:boolean;onClear:()=>void;onCancel:()=>void;onOpen:()=>void;onPilot:()=>void}){
  const p=(key:Parameters<typeof p02BottleText>[1],values?:Record<string,string|number>)=>p02BottleText(locale,key,values);
  const r=(key:Parameters<typeof round17ComparisonText>[1])=>round17ComparisonText(locale,key);
  return <Panel title={p('selectedBottles')}><Text style={ws.body}>{selected.length?p('selectedCount',{count:selected.length}):p('compareIntro')}</Text>
    {!!selected.length&&<View style={styles.selectedNames}>{selected.map(bottle=>{
      const name=bottleDisplayName(bottle,locale),original=bottleDisplayName(bottle);
      return <View key={bottle.id}><Text style={ws.muted}>• {name}</Text>{name!==original&&<Text style={styles.originalName}>{p('originalName')}: {original}</Text>}</View>;
    })}</View>}
    {selected.length===1&&<Text style={ws.muted}>{p('continueSelecting')}</Text>}
    <View style={ws.row}>{!selected.length&&<Action label={r('startPilot')} disabled={comparisonLocked} onPress={onPilot}/>} {selected.length>=2&&<Action label={p('openComparison')} onPress={onOpen}/>} {!!selected.length&&<Action quiet label={p('clearSelection')} disabled={comparisonLocked} onPress={onClear}/>}<Action quiet label={p('cancelComparison')} disabled={comparisonLocked} onPress={onCancel}/></View>
  </Panel>;
}

function FocusedComparison({selected,locale,unit,comparisonLocked,onBack,onClose,onClear,onRemove}:{selected:Bottle[];locale:Locale;unit:Parameters<typeof BottleComparisonLab>[0]['unit'];comparisonLocked:boolean;onBack:()=>void;onClose:()=>void;onClear:()=>void;onRemove:(id:string)=>void}){
  const p=(key:Parameters<typeof p02BottleText>[1])=>p02BottleText(locale,key);
  return <View style={styles.focused}><View style={ws.row}><Action label={p('backToSelection')} disabled={comparisonLocked} onPress={onBack}/><Action quiet label={p('closeComparison')} disabled={comparisonLocked} onPress={onClose}/><Action quiet label={p('clearSelection')} disabled={comparisonLocked} onPress={onClear}/></View>
    <BottleComparisonTable selected={selected} locale={locale} disabled={comparisonLocked} onRemove={onRemove}/>
    <BottleComparisonLab key={selected.map(b=>b.id).join('|')} selected={selected} locale={locale} unit={unit}/>
  </View>;
}

function BottleCard({bottle,locale,compareMode,compared,compareDisabled,detailsOpen,owned,ownershipHydrated,labHydrated,onToggleDetails,onToggleCompare,onToggleOwned,onTrial}:{bottle:Bottle;locale:Locale;compareMode:boolean;compared:boolean;compareDisabled:boolean;detailsOpen:boolean;owned:boolean;ownershipHydrated:boolean;labHydrated:boolean;onToggleDetails:()=>void;onToggleCompare:()=>void;onToggleOwned:()=>void;onTrial:()=>void}){
  const w=(key:WorkspaceKey)=>workText(locale,key);const p=(key:Parameters<typeof p02BottleText>[1],values?:Record<string,string|number>)=>p02BottleText(locale,key,values);const name=bottleDisplayName(bottle,locale),original=bottleDisplayName(bottle);
  const detailsLabel=p(detailsOpen?'closeDetails':'openDetails',{name});
  return <View style={ws.column}><Panel>
    <Pressable accessibilityRole="button" accessibilityLabel={detailsLabel} accessibilityState={{expanded:detailsOpen}} onPress={onToggleDetails} style={({pressed})=>[styles.cardLead,pressed&&styles.pressed]}>
      <BottlePhoto bottle={bottle} locale={locale}/><View style={styles.cardTitle}><Text style={ws.kicker}>{bottle.brandName}</Text><Text style={ws.heading}>{name}</Text>{name!==original&&<Text style={styles.originalName}>{p('originalName')}: {original}</Text>}<Text style={ws.muted}>{familyName(bottle.family,locale)} · {bottle.abv===null?w('unknown'):`${bottle.abv}%`}</Text>{owned&&<Text style={styles.owned}>{w('owned')}</Text>}<Text style={styles.detailsCue}>{w('details')} {detailsOpen?'−':'＋'}</Text></View>
    </Pressable>
    <Text numberOfLines={3} style={ws.body}>{bottle.profile[locale]}</Text>
    {compareMode&&<Action label={compared?p('removeFromComparison'):p('addToComparison')} selected={compared} disabled={compareDisabled} onPress={onToggleCompare}/>}
    {detailsOpen&&<View style={styles.details}><Action label={owned?'✓ '+w('removeOwned'):'＋ '+w('add')} selected={owned} disabled={!ownershipHydrated} onPress={onToggleOwned}/><BottleFacts b={bottle} locale={locale}/><BottlePhotoSource bottleId={bottle.id} locale={locale}/><Action label={w('trial')} disabled={!labHydrated} onPress={onTrial}/>{bottle.ingredientIds.map(id=><Action key={id} label={(catalogue.ingredients.find(i=>i.id===id)?.name[locale]??id)+' ↗'} onPress={()=>router.push({pathname:'/ingredients/[id]' as never,params:{id}})}/>)}</View>}
  </Panel></View>;
}

function BottleFacts({b,locale}:{b:Bottle;locale:Locale}){const w=(key:WorkspaceKey)=>workText(locale,key);return <View style={{gap:10}}><Text style={ws.label}>{bottleProfileLabel(b.profileBasis,locale)}</Text><Text style={ws.body}>{b.profile[locale]}</Text><Text style={ws.muted}>{w('abv')}: {b.abv===null?w('unknown'):`${b.abv}%`}</Text><Text style={ws.muted}>{w('market')}: {/unspecified|not specified/i.test(b.market)?w('marketUnspecified'):b.market}</Text><Text style={ws.muted}>{w('abvScope')}</Text></View>;}

const styles=StyleSheet.create({
  intro:{gap:4,paddingTop:4},
  selectedNames:{gap:3},
  focused:{gap:18},
  hiddenComparison:{display:'none'},
  cardLead:{minHeight:164,flexDirection:'row',alignItems:'flex-start',gap:12,borderRadius:radii.small},
  cardTitle:{flex:1,minWidth:0,gap:6},
  originalName:{color:colors.muted,fontSize:11,lineHeight:16},
  nameRecord:{gap:7},
  detailsCue:{color:colors.accent,fontSize:12,lineHeight:18,fontWeight:'600',paddingTop:4},
  owned:{color:colors.accent,fontSize:11,lineHeight:16,fontWeight:'700'},
  details:{gap:14,borderTopWidth:1,borderTopColor:colors.border,paddingTop:14},
  pressed:{opacity:0.72},
});


