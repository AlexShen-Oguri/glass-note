import React,{useEffect,useMemo,useState} from 'react';
import {linkedBottleDisplay} from '../../../content/localization/display';
import {BottleOriginalName} from '../../names/OriginalName';
import {ScrollView,StyleSheet,Text,useWindowDimensions,View} from 'react-native';
import type {Locale,UnitPreference} from '../../../domain/contracts';
import {compareLabBatches,toggleBatchComparisonSelection,type BatchComparisonField} from '../../../domain/lab/batchComparison';
import type {LabBatch,LabIngredient,LabObservation} from '../../../domain/lab/types';
import {displayLabAmount} from '../../../domain/lab/measure';
import {labResultsText} from '../../../i18n/lab-results';
import {labText,type LabKey} from '../../../i18n/lab';
import {colors,radii} from '../../../theme/tokens';
import {Action,Field,Fold,Panel,ws} from '../ui';

type CreateResult={versionId:string;saved:boolean};

export function BatchComparison({batches,locale,unit,onCreateVersion,onRetrySave,onOpenVersion,onRecordExperiment}:{
  batches:LabBatch[];
  locale:Locale;
  unit:UnitPreference;
  onCreateVersion:(batch:LabBatch,name:string)=>Promise<CreateResult>;
  onRetrySave:()=>Promise<boolean>;
  onOpenVersion:(versionId:string)=>void;
  onRecordExperiment:()=>void;
}){
  const r=(key:Parameters<typeof labResultsText>[1],values:Record<string,string|number>={})=>labResultsText(locale,key,values);
  const l=(key:LabKey)=>labText(locale,key);
  const [selected,setSelected]=useState<string[]>([]);
  const [startBatchId,setStartBatchId]=useState('');
  const [versionName,setVersionName]=useState('');
  const [pendingVersionId,setPendingVersionId]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const availableIds=useMemo(()=>batches.map(batch=>batch.id),[batches]);

  useEffect(()=>{
    setSelected(current=>current.filter(id=>availableIds.includes(id)).slice(0,3));
    if(startBatchId&&!availableIds.includes(startBatchId)&&!pendingVersionId&&!busy){setStartBatchId('');setVersionName('');}
  },[availableIds,startBatchId,pendingVersionId,busy]);

  if(!pendingVersionId&&!busy&&!batches.length)return <Panel><Text style={ws.body}>{r('empty')}</Text><Action label={r('recordExperiment')} onPress={onRecordExperiment}/></Panel>;
  if(!pendingVersionId&&!busy&&batches.length===1)return <Panel><Text style={ws.body}>{r('needAnother')}</Text><Action label={r('recordExperiment')} onPress={onRecordExperiment}/></Panel>;

  const selectedBatches=selected.map(id=>batches.find(batch=>batch.id===id)).filter((batch):batch is LabBatch=>Boolean(batch));
  const comparison=selectedBatches.length>=2?compareLabBatches(selectedBatches):undefined;
  const startBatch=batches.find(batch=>batch.id===startBatchId);
  const retryPending=Boolean(pendingVersionId);
  const toggle=(id:string)=>{
    if(retryPending||busy)return;
    const next=toggleBatchComparisonSelection(selected,id,availableIds);
    setSelected(next);
    if(startBatchId&&!next.includes(startBatchId)){setStartBatchId('');setVersionName('');}
    setError('');
  };
  const chooseStart=(batch:LabBatch)=>{
    if(retryPending||busy)return;
    setStartBatchId(batch.id);
    setVersionName(r('suggestedName',{batch:batch.name||batch.versionSnapshot.name}));
    setError('');
  };
  const create=async()=>{
    if(!startBatch||!versionName.trim()||busy||pendingVersionId)return;
    setBusy(true);setError('');
    try{
      const result=await onCreateVersion(startBatch,versionName);
      if(result.saved)onOpenVersion(result.versionId);
      else{setPendingVersionId(result.versionId);setError(r('saveFailed'));}
    }catch{setError(r('createFailed'));}
    finally{setBusy(false);}
  };
  const retry=async()=>{
    if(!pendingVersionId||busy)return;
    setBusy(true);setError('');
    try{
      if(await onRetrySave()){const id=pendingVersionId;setPendingVersionId('');onOpenVersion(id);}
      else setError(r('saveFailed'));
    }catch{setError(r('saveFailed'));}
    finally{setBusy(false);}
  };

  return <View style={styles.root}>
    <Panel title={r('choose')}>
      <Text style={ws.body}>{r('intro')}</Text>
      <Text style={ws.muted}>{r('chooseHint')}</Text>
      <View style={ws.row}>{batches.map(batch=>{
        const isSelected=selected.includes(batch.id);
        return <Action key={batch.id} label={batch.name||batch.versionSnapshot.name} selected={isSelected} disabled={busy||retryPending||(!isSelected&&selected.length>=3)} onPress={()=>toggle(batch.id)}/>;
      })}</View>
      <Text accessibilityLiveRegion="polite" style={ws.muted}>{r('selectedCount',{count:selected.length})}</Text>
    </Panel>
    {comparison&&<>
      <Panel title={r('comparison')}>
        <Text style={styles.boundary}>{r('noConclusion')}</Text>
        <BatchComparisonTable comparison={comparison} locale={locale} unit={unit} startBatchId={startBatchId} chooseDisabled={busy||retryPending} onChooseStart={chooseStart}/>
      </Panel>
      <Panel title={r('observations')}>
        {comparison.batches.map(batch=><Fold key={batch.id} title={`${batch.name||batch.versionSnapshot.name} · ${r('observationCount',{count:batch.observations.length})}`}>
          {batch.observations.length?batch.observations.map((observation,index)=><ObservationRead key={observation.id} observation={observation} index={index} locale={locale}/>):<Text style={ws.muted}>{r('noObservations')}</Text>}
        </Fold>)}
      </Panel>
    </>}
    {(startBatch||pendingVersionId)&&<Panel title={r('startTitle')}>
      <Text style={ws.heading}>{startBatch?.name||startBatch?.versionSnapshot.name||versionName}</Text>
      <Text style={ws.body}>{r('startHint')}</Text>
      {pendingVersionId?<Text style={ws.body}>{r('versionName')}: {versionName}</Text>:<Field label={r('versionName')} value={versionName} maxLength={200} onChange={setVersionName}/>}
      {!!error&&<Text accessibilityRole="alert" style={ws.error}>{error}</Text>}
      {pendingVersionId
        ?<Action label={busy?r('creating'):r('retrySave')} disabled={busy} onPress={()=>void retry()}/>
        :<Action label={busy?r('creating'):r('createVersion')} disabled={busy||!versionName.trim()} onPress={()=>void create()}/>
      }
    </Panel>}
  </View>;
}

function BatchComparisonTable({comparison,locale,unit,startBatchId,chooseDisabled,onChooseStart}:{
  comparison:ReturnType<typeof compareLabBatches>;
  locale:Locale;
  unit:UnitPreference;
  startBatchId:string;
  chooseDisabled:boolean;
  onChooseStart:(batch:LabBatch)=>void;
}){
  const {width,fontScale}=useWindowDimensions();
  const compact=width<760||fontScale>1.25;
  const columnWidth=compact?148:220;
  const r=(key:Parameters<typeof labResultsText>[1],values:Record<string,string|number>={})=>labResultsText(locale,key,values);
  const l=(key:LabKey)=>labText(locale,key);
  return <View style={styles.tableRoot}>
    {compact&&<Text style={styles.scrollHint}>↔ {r('scrollHint')}</Text>}
    <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={compact} style={styles.scroller} contentContainerStyle={styles.table} accessibilityLabel={r('comparison')}>
      <View style={styles.tableInner}>
        <View style={styles.columns}>{comparison.batches.map(batch=><View key={batch.id} style={[styles.headerCell,{width:columnWidth}]}>
          <Text style={styles.batchName}>{batch.name||batch.versionSnapshot.name}</Text>
          <Text style={ws.muted}>{r('recipeSnapshot')}: {batch.versionSnapshot.name}</Text>
          <Action label={r('useAsStart')} selected={startBatchId===batch.id} disabled={chooseDisabled} onPress={()=>onChooseStart(batch)}/>
        </View>)}</View>
        {comparison.ingredientRows.map(row=><ComparisonRow key={`ingredient-${row.index}`} label={r('ingredient',{number:row.index+1})}>
          {row.cells.map((ingredient,index)=><View key={comparison.batches[index]!.id} style={[styles.valueCell,{width:columnWidth}]}><IngredientRead ingredient={ingredient} unit={unit} locale={locale} empty={r('notRecorded')}/></View>)}
        </ComparisonRow>)}
        {comparison.fields.map(row=><ComparisonRow key={row.field} label={fieldLabel(row.field,l)}>
          {row.cells.map((value,index)=><View key={comparison.batches[index]!.id} style={[styles.valueCell,{width:columnWidth}]}><Text style={styles.value}>{value||r('notRecorded')}</Text></View>)}
        </ComparisonRow>)}
      </View>
    </ScrollView>
  </View>;
}

function ComparisonRow({label,children}:{label:string;children:React.ReactNode}){
  return <View style={styles.dataRow}><Text style={styles.rowLabel}>{label}</Text><View style={styles.columns}>{children}</View></View>;
}

function IngredientRead({ingredient,unit,locale,empty}:{ingredient:LabIngredient|null;unit:UnitPreference;locale:Locale;empty:string}){
  if(!ingredient)return <Text style={styles.missing}>{empty}</Text>;
  const amount=displayLabAmount(ingredient.amount,ingredient.unit,unit);
  const {name,bottle}=linkedBottleDisplay(ingredient,locale);
  return <View style={styles.valueGroup}><Text style={styles.ingredientName}>{name||empty}</Text>{bottle ? <BottleOriginalName bottle={bottle} locale={locale} /> : null}<Text style={styles.amount}>{[amount.amount,amount.unit].filter(Boolean).join(' ')||empty}</Text></View>;
}

function ObservationRead({observation,index,locale}:{observation:LabObservation;index:number;locale:Locale}){
  const l=(key:LabKey)=>labText(locale,key);
  const values:Array<[LabKey,string]>=[['time',observation.time],['temperature',observation.temperature],['aroma',observation.aroma],['palate',observation.palate],['appearance',observation.appearance],['notes',observation.notes]];
  return <View style={styles.observation}><Text style={ws.label}>{index+1}</Text>{values.map(([key,value])=>value?<Text key={key} style={ws.body}>{l(key)}: {value}</Text>:null)}</View>;
}

function fieldLabel(field:BatchComparisonField,l:(key:LabKey)=>string):string {
  if(field==='recipe-method')return l('method');
  if(field==='recipe-notes')return l('notes');
  return l(field);
}

const styles=StyleSheet.create({
  root:{gap:16},
  boundary:{fontSize:13,lineHeight:21,color:colors.secondary},
  tableRoot:{gap:9,maxWidth:'100%'},
  scrollHint:{fontSize:11,lineHeight:17,fontWeight:'600',color:colors.accent},
  scroller:{width:'100%',maxWidth:'100%'},
  table:{paddingBottom:4},
  tableInner:{gap:0,borderWidth:1,borderColor:colors.border,borderRadius:radii.small,overflow:'hidden',backgroundColor:'rgba(16,23,20,0.72)'},
  columns:{flexDirection:'row',alignItems:'stretch'},
  headerCell:{gap:7,padding:11,borderRightWidth:1,borderRightColor:colors.border,backgroundColor:colors.raised},
  batchName:{fontSize:14,lineHeight:21,fontWeight:'700',color:colors.text},
  dataRow:{gap:7,paddingVertical:10,borderTopWidth:1,borderTopColor:colors.border},
  rowLabel:{paddingHorizontal:10,fontSize:10,lineHeight:15,fontWeight:'700',letterSpacing:0.4,textTransform:'uppercase',color:colors.muted},
  valueCell:{minHeight:54,paddingHorizontal:10,borderRightWidth:1,borderRightColor:colors.border},
  value:{fontSize:12,lineHeight:19,color:colors.secondary},
  valueGroup:{gap:4},
  ingredientName:{fontSize:12,lineHeight:18,fontWeight:'600',color:colors.text},
  amount:{fontSize:12,lineHeight:18,fontWeight:'700',color:colors.secondary},
  missing:{fontSize:11,lineHeight:17,fontStyle:'italic',color:colors.muted},
  observation:{gap:4,paddingVertical:8,borderTopWidth:1,borderTopColor:colors.border},
});
