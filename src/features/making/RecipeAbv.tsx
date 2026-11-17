import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Linking,Platform,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import type {Locale} from '../../domain/contracts';
import {catalogue} from '../../content/catalogue';
import {bottles} from '../../content/bottles';
import {drinkStrengthContent} from '../../content/drink-strength';
import {bottleDisplayName,bottleSearchNames} from '../../domain/bottles/format';
import {recipeFingerprint} from '../../domain/making';
import {analyzeDrinkStrength,type DrinkStrengthRow,type StrengthRange,type StrengthSource} from '../../domain/making/drink-strength';
import type {MakingAssumptions,MakingRecipe,MakingSession} from '../../domain/making/types';
import {drinkStrengthText as copy,type DrinkStrengthKey} from '../../i18n/drink-strength';
import {colors,radii} from '../../theme/tokens';
import {makingStyles as s} from './styles';
import {Action,Disclosure} from './ui';
import {Heading} from '../navigation/Heading';
import {BottlePhoto} from '../workspace/BottlePhoto';

interface Props {
  recipe:MakingRecipe;session?:MakingSession;locale:Locale;showSources?:boolean;disabled?:boolean;
  persistedSave?:{sessionId:string;revision:number;assumptions:MakingAssumptions;includedOptionalRowIds:readonly string[]};
  onSaveAssumptions?:(assumptions:MakingAssumptions,includedOptionalRowIds:readonly string[])=>Promise<boolean>;
}
const emptyAssumptions=():MakingAssumptions=>({volumeMl:{},abv:{},bottleIds:{},dilutionMl:null});
const numeric=(value:string)=>value.trim()===''?Number.NaN:Number(value);
const parseRecord=(values:Record<string,string>)=>Object.fromEntries(Object.entries(values).map(([id,value])=>[id,numeric(value)]));
const shown=(value:number|null|undefined)=>typeof value==='number'&&Number.isFinite(value)?String(Number(value.toFixed(4))):'';
const rangeText=(value:StrengthRange)=>value.low===value.high?value.low.toFixed(1):`${value.low.toFixed(1)}–${value.high.toFixed(1)}`;

/** Exact recipe identity prevents simulations from leaking between source versions. */
export function RecipeAbv(props:Props){
  return <StrengthEditor key={`${recipeFingerprint(props.recipe)}:${props.session?.id??'reference'}`} {...props}/>;
}

function SourceLinks({sources,locale}:{sources:StrengthSource[];locale:Locale}){
  return <>{sources.map((source,index)=><View key={`${source.url}:${index}`} style={{gap:2}}>
    <Pressable accessibilityRole="link" style={s.sourceLink} onPress={()=>void Linking.openURL(source.url)}><Text style={s.linkText}>{source.title} ↗</Text></Pressable>
    {source.market?<Text style={s.meta}>{copy(locale,'market',{market:source.market})}</Text>:null}
    <Text style={s.meta}>{copy(locale,'checked',{date:source.checkedAt})}</Text>
  </View>)}</>;
}

function StrengthEditor({recipe,session,locale,disabled=false,persistedSave,onSaveAssumptions}:Props){
  const [volume,setVolume]=useState<Record<string,string>>({}),[abv,setAbv]=useState<Record<string,string>>({});
  const [bottleIds,setBottleIds]=useState<Record<string,string>>({}),[queries,setQueries]=useState<Record<string,string>>({});
  const [dilution,setDilution]=useState<string|undefined>(),[reference,setReference]=useState(false);
  const [saving,setSaving]=useState(false),[saveStatus,setSaveStatus]=useState<'saved'|'failed'|'invalid'|null>(null);
  const optionalRowIds=useMemo(()=>recipe.version.ingredients.flatMap((row,index)=>row.optional?[`${recipe.version.id}:${index}`]:[]),[recipe]);
  const [includedOptionalRowIds,setIncludedOptionalRowIds]=useState(()=>optionalRowIds.filter(id=>session?.checkedRows.includes(id)));
  const locked=disabled||saving||Boolean(session?.completed);
  const lastSave=useRef<{assumptions:MakingAssumptions;includedOptionalRowIds:readonly string[]}|null>(null);
  const seenPersistence=useRef(persistedSave?.revision);
  useEffect(()=>{
    if(persistedSave?.revision===seenPersistence.current)return;
    seenPersistence.current=persistedSave?.revision;
    // Only a verified persistence receipt for this batch resolves its failed intent.
    // Unlocking controls alone must never clear input validation or a save error.
    if(persistedSave?.sessionId===session?.id&&persistedSave?.assumptions===lastSave.current?.assumptions&&persistedSave?.includedOptionalRowIds===lastSave.current?.includedOptionalRowIds)setSaveStatus(status=>status==='failed'?'saved':status);
  },[persistedSave?.revision,persistedSave?.sessionId,session?.id]);
  const bindings=useRef(session?.materialBindings);
  useEffect(()=>{
    const previous=bindings.current;bindings.current=session?.materialBindings;
    if(previous===session?.materialBindings)return;
    const changed=Object.keys({...previous,...session?.materialBindings}).filter(id=>previous?.[id]?.bottleId!==session?.materialBindings?.[id]?.bottleId||previous?.[id]?.ingredientId!==session?.materialBindings?.[id]?.ingredientId);
    if(changed.length){setAbv(values=>Object.fromEntries(Object.entries(values).filter(([id])=>!changed.includes(id))));setSaveStatus(null);}
  },[session?.materialBindings]);
  const effectiveSession=useMemo(()=>session?(reference?{...session,assumptions:emptyAssumptions()}:session):undefined,[session,reference]);
  const result=useMemo(()=>analyzeDrinkStrength(recipe,catalogue,bottles,drinkStrengthContent,{
    ...(effectiveSession?{session:effectiveSession}:{}),volumeMl:parseRecord(volume),abv:parseRecord(abv),bottleIds,includedOptionalRowIds,
    ...(dilution!==undefined?{dilutionMl:numeric(dilution)}:{}),
  }),[recipe,effectiveSession,volume,abv,bottleIds,dilution,includedOptionalRowIds]);
  const estimate=result.diluted??result.beforeIce;
  const nameFor=(row:DrinkStrengthRow)=>recipe.ingredientNames[row.ingredientId]?.[locale]||recipe.ingredientNames[row.ingredientId]?.en||row.ingredientId;
  const setField=(kind:'volume'|'abv',id:string,value:string)=>{(kind==='volume'?setVolume:setAbv)(values=>({...values,[id]:value}));setSaveStatus(null);};
  const reset=()=>{setVolume({});setAbv({});setBottleIds({});setQueries({});setDilution(undefined);setIncludedOptionalRowIds([]);setReference(true);setSaveStatus(null);};
  const save=async()=>{
    if(!onSaveAssumptions||locked)return;
    const parsedVolume=parseRecord(volume),parsedAbv=parseRecord(abv);
    if(Object.values(parsedVolume).some(value=>!Number.isFinite(value)||value<0||value>1_000_000)
      ||Object.values(parsedAbv).some(value=>!Number.isFinite(value)||value<0||value>100)
      ||(dilution!==undefined&&dilution.trim()!==''&&(!Number.isFinite(numeric(dilution))||numeric(dilution)<0||numeric(dilution)>1_000_000))){setSaveStatus('invalid');return;}
    const baseline=reference?emptyAssumptions():session?.assumptions??emptyAssumptions();
    const assumptions:MakingAssumptions={volumeMl:{...baseline.volumeMl,...parsedVolume},abv:{...baseline.abv,...parsedAbv},
      bottleIds:{...baseline.bottleIds,...bottleIds},dilutionMl:dilution===undefined?baseline.dilutionMl:dilution.trim()===''?null:numeric(dilution)};
    lastSave.current={assumptions,includedOptionalRowIds};
    setSaving(true);setSaveStatus(null);
    try{const ok=await onSaveAssumptions(assumptions,includedOptionalRowIds);setSaveStatus(ok?'saved':'failed');}catch{setSaveStatus('failed');}finally{setSaving(false);}
  };
  const basis=(value:DrinkStrengthRow['volumeBasis']|DrinkStrengthRow['abvBasis']):DrinkStrengthKey=>({
    recipe:'recipeVolume','profile-assumption':'profileVolume','producer-example':'producerExample','editorial-assumption':'editorialAssumption',bottle:'actualBottle',user:'userInput',unknown:'unknown',
  } as const)[value];
  return <View testID="drink-strength" style={{gap:8,paddingVertical:18}}>
    <Heading level={2} style={s.sectionHeading}>{copy(locale,'title')}</Heading>
    {estimate?<><Text testID="drink-strength-value" style={s.count}>≈ {rangeText(estimate)}%</Text><Text style={s.body}>{copy(locale,result.diluted?'afterIce':'beforeIce')}</Text></>:<Text style={s.body}>{copy(locale,'incomplete')}</Text>}
    <Text style={s.strong}>{copy(locale,result.format?.format??'unclassified')}</Text>
    <Disclosure title={copy(locale,'details')}>
      <Text style={s.body}>{copy(locale,'modelHint')}</Text>
      <Text style={s.body}>{copy(locale,'batchHint')}</Text>
      {session?.completed?<Text style={s.body}>{copy(locale,'readOnly')}</Text>:null}
      {result.rows.map(row=>{
        const name=nameFor(row),selectedBottle=bottles.find(bottle=>bottle.id===row.bottleId);
        const eligible=new Set(row.eligibleBottleIds),query=(queries[row.rowId]??'').trim().toLocaleLowerCase();
        const matches=!session&&query?bottles.filter(bottle=>eligible.has(bottle.id)&&bottleSearchNames(bottle).some(value=>value.toLocaleLowerCase().includes(query))).slice(0,8):[];
        const sources=selectedBottle&&!row.sources.some(source=>source.url===selectedBottle.source.url)
          ?[...row.sources,{...selectedBottle.source,market:selectedBottle.market}]:row.sources;
        const toggleOptional=()=>{if(locked)return;setIncludedOptionalRowIds(ids=>ids.includes(row.rowId)?ids.filter(id=>id!==row.rowId):[...ids,row.rowId]);setSaveStatus(null);};
        return <View key={row.rowId} testID={`drink-strength-row-${row.rowId}`} style={styles.ingredient}>
          <Text style={s.strong}>{name}</Text>
          {optionalRowIds.includes(row.rowId)?<Pressable accessibilityRole="checkbox" accessibilityLabel={copy(locale,'includeOptional',{name})} accessibilityState={{checked:row.included,disabled:locked}} disabled={locked}
            {...(Platform.OS==='web'?{'aria-checked':row.included,onKeyDown:(event:React.KeyboardEvent<HTMLElement>)=>{
              if(event.key===' '){event.preventDefault();if(!event.repeat)toggleOptional();}
            }}:{})}
            onPress={toggleOptional} style={({pressed})=>[s.checklist,locked&&s.disabled,pressed&&s.pressed]}>
            <View style={[s.check,row.included&&s.checkActive]}>{row.included?<Text aria-hidden style={s.checkText}>✓</Text>:null}</View><Text style={[s.body,s.grow]}>{copy(locale,'includeOptional',{name})}</Text>
          </Pressable>:null}
          {!row.included?<Text style={s.meta}>{copy(locale,'optionalExcluded')}</Text>:null}
          {result.missingRowIds.includes(row.rowId)?<Text style={s.statusCheck}>{copy(locale,'missing')}</Text>:null}
          <View style={styles.fields}>
            <View style={styles.field}><Text style={s.body}>{copy(locale,'liquidVolume',{name})}</Text>
              <TextInput accessibilityLabel={copy(locale,'liquidVolume',{name})} editable={!locked} keyboardType="decimal-pad" inputMode="decimal" value={volume[row.rowId]??shown(row.volumeMl)} onChangeText={value=>setField('volume',row.rowId,value)} style={[styles.input,locked&&s.disabled]}/>
              <Text style={s.meta}>{copy(locale,basis(row.volumeBasis))}</Text>
            </View>
            <View style={styles.field}><Text style={s.body}>{copy(locale,'strength',{name})}</Text>
              <TextInput accessibilityLabel={copy(locale,'strength',{name})} editable={!locked} keyboardType="decimal-pad" inputMode="decimal" placeholder={row.abv&&row.abv.low!==row.abv.high?rangeText(row.abv):copy(locale,'unknown')} placeholderTextColor={colors.secondary} value={abv[row.rowId]??(row.abv?.low===row.abv?.high?shown(row.abv?.low):'')} onChangeText={value=>setField('abv',row.rowId,value)} style={[styles.input,locked&&s.disabled]}/>
              <Text style={s.meta}>{copy(locale,basis(row.abvBasis))}{row.abv?` · ${rangeText(row.abv)}%`:''}</Text>
            </View>
          </View>
          {selectedBottle?<View style={[s.row,{flexWrap:'nowrap'}]}><BottlePhoto bottle={selectedBottle} locale={locale} size="chooser"/><View style={s.grow}><Text style={s.body}>{bottleDisplayName(selectedBottle,locale)}</Text><Text style={s.meta}>{copy(locale,'market',{market:selectedBottle.market})}</Text></View></View>:null}
          <SourceLinks sources={sources} locale={locale}/>
          {!session&&eligible.size>0?<View style={{gap:8}}>
            <Text style={s.body}>{copy(locale,'searchBottles',{name})}</Text>
            <TextInput accessibilityLabel={copy(locale,'searchBottles',{name})} editable={!locked} value={queries[row.rowId]??''} onChangeText={value=>setQueries(values=>({...values,[row.rowId]:value}))} style={styles.input}/>
            <Text style={s.meta}>{copy(locale,'bottleLimit')}</Text>
            {matches.length?matches.map(bottle=><Pressable key={bottle.id} accessibilityRole="button" accessibilityLabel={copy(locale,'useBottle',{name:bottleDisplayName(bottle,locale)})} accessibilityState={{selected:row.bottleId===bottle.id,disabled:locked}} disabled={locked} style={({pressed})=>[styles.bottleChoice,row.bottleId===bottle.id&&s.buttonSelected,pressed&&s.pressed,locked&&s.disabled]} onPress={()=>{
              setBottleIds(values=>({...values,[row.rowId]:bottle.id}));
              setAbv(values=>{const next={...values};delete next[row.rowId];return next;});setSaveStatus(null);
            }}><BottlePhoto bottle={bottle} locale={locale} size="chooser"/><Text style={[s.buttonText,s.grow]}>{copy(locale,'useBottle',{name:bottleDisplayName(bottle,locale)})}</Text></Pressable>):query?<Text style={s.meta}>{copy(locale,'noBottles')}</Text>:null}
          </View>:null}
        </View>;
      })}
      <View style={{gap:8}}><Text style={s.body}>{copy(locale,'meltingWater')}</Text>
        <TextInput accessibilityLabel={copy(locale,'meltingWater')} editable={!locked} keyboardType="decimal-pad" inputMode="decimal" value={dilution??shown(result.dilutionMl)} placeholder={copy(locale,'unknown')} placeholderTextColor={colors.secondary} onChangeText={value=>{setDilution(value);setSaveStatus(null);}} style={[styles.input,locked&&s.disabled]}/>
      </View>
      {result.format?<View style={{gap:4,paddingVertical:12}}><Text style={s.strong}>{copy(locale,result.format.format)}</Text><Text style={s.body}>{copy(locale,result.format.formatBasis==='editorial'?'formatEditorial':'formatSource')}</Text><Text style={s.body}>{copy(locale,result.format.formatReason)}</Text><SourceLinks sources={result.format.sources} locale={locale}/></View>:null}
      {saveStatus?<Text accessibilityRole={saveStatus==='saved'?undefined:'alert'} accessibilityLiveRegion="polite" style={saveStatus==='saved'?s.body:s.statusCheck}>{copy(locale,saveStatus==='failed'?'saveError':saveStatus==='invalid'?'invalid':'saved')}</Text>:null}
      <View style={styles.actions}>
        {onSaveAssumptions?<Action primary label={copy(locale,saving?'saving':'apply')} disabled={locked} style={styles.equalAction} onPress={()=>void save()}/>:null}
        <Action label={copy(locale,'reset')} disabled={locked} style={onSaveAssumptions?styles.equalAction:styles.fullAction} onPress={reset}/>
      </View>
    </Disclosure>
  </View>;
}

const styles=StyleSheet.create({
  ingredient:{gap:10,paddingVertical:18,borderBottomWidth:1,borderBottomColor:colors.border},
  fields:{flexDirection:'row',flexWrap:'wrap',gap:12},
  field:{flexGrow:1,flexBasis:220,minWidth:0,gap:6},
  input:{minHeight:44,borderWidth:1,borderColor:colors.border,borderRadius:radii.small,paddingHorizontal:12,paddingVertical:10,color:colors.text,backgroundColor:colors.panel,fontSize:14},
  actions:{flexDirection:'row',alignItems:'stretch',gap:10,paddingTop:12},
  equalAction:{flex:1,alignSelf:'stretch',minHeight:52},
  fullAction:{width:'100%',alignSelf:'stretch'},
  bottleChoice:{minHeight:92,flexDirection:'row',alignItems:'center',gap:12,padding:8,borderRadius:radii.small,borderWidth:1,borderColor:colors.border,backgroundColor:colors.raised},
});
