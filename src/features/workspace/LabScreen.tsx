import React, {useState,useEffect} from 'react';
import {Platform, Text, View} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import type {Locale,UnitPreference} from '../../domain/contracts';
import type {LabBackup, LabBatch, LabIngredient, LabObservation, LabProject, LabVersion} from '../../domain/lab/types';
import {exportLabBackup, exportLabMarkdown, parseLabBackup} from '../../domain/lab';
import {createVersionFromBatch} from '../../domain/lab/batchComparison';
import {useLab} from '../../platform/LabProvider';
import {useApp} from '../../platform/AppProvider';
import {readLabFile, saveLabFile} from '../../platform/labFiles';
import {labText, type LabKey} from '../../i18n/lab';
import {colors} from '../../theme/tokens';
import {Action, Field, Fold, Panel, Workspace, ws} from './ui';
import {BottleChooser} from './BottleChooser';
import {normalizeSearchText,scoreTextSearch} from '../../domain/search';
import {AmountEditor} from './lab/AmountEditor';
import {RecipeRead} from './lab/RecipeRead';
import {VersionComparison} from './lab/VersionComparison';
import {backupText} from '../../i18n/backup';
import {labResultsText} from '../../i18n/lab-results';
import {Heading} from '../navigation/Heading';
import {BatchComparison} from './lab/BatchComparison';

const uid = () => `field-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
const blankIngredient = ():LabIngredient => ({id:uid(),name:'',amount:'',unit:'ml'});
type Lab = ReturnType<typeof useLab>;
type Copy = (key:LabKey)=>string;
type DeleteTarget = Pick<LabProject,'id'|'name'> & {versionCount:number;batchCount:number};

export default function LabScreen() {
  const {locale,unit}=useApp(); const l:Copy=key=>labText(locale,key); const lab=useLab();
  const params=useLocalSearchParams<{project?:string}>();
  const project=lab.projects.find(p=>p.id===params.project);
  const [search,setSearch]=useState(''); const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [deleteTarget,setDeleteTarget]=useState<DeleteTarget|null>(null);
  const [deleteBusy,setDeleteBusy]=useState(false);
  useEffect(()=>{
    if(Platform.OS!=='web')return;
    const beforeLeave=(event:BeforeUnloadEvent)=>{const state=lab.getSnapshot();if(state.hydrated&&(state.saving||state.error==='write')){event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',beforeLeave);return()=>window.removeEventListener('beforeunload',beforeLeave);
  },[lab.getSnapshot]);
  const create=()=>{try {const id=lab.createProject({name:l('untitled')});router.push({pathname:'/lab' as never,params:{project:id}});} catch {setError(l('failed'));}};
  const askDelete=(candidate:LabProject)=>{
    setError('');setNotice('');
    setDeleteTarget({id:candidate.id,name:candidate.name||l('untitled'),versionCount:candidate.versions.length,batchCount:candidate.batches.length});
  };
  const confirmDelete=async()=>{
    if(!deleteTarget||deleteBusy)return;
    const target=deleteTarget;
    setDeleteBusy(true);setError('');setNotice('');
    try {
      const current=lab.getSnapshot().projects.find(item=>item.id===target.id);
      if(!current){setDeleteTarget(null);if(params.project===target.id)router.replace('/lab' as never);return;}
      lab.deleteProject(target.id);
      await lab.whenSaved();
      setDeleteTarget(null);
      if(lab.saveStatus())setNotice(`${l('deleted')} ${target.name}`);
      else setError(l('deleteSaveFailed'));
      if(params.project===target.id)router.replace('/lab' as never);
    } catch {setError(l('failed'));}
    finally {setDeleteBusy(false);}
  };
  const retrySave=async()=>{
    try {if(await lab.retrySave()){setError('');setNotice(l('done'));}}
    catch {setError(l('failed'));}
  };
  const pendingCurrent=deleteTarget?.id===params.project;
  return <Workspace section="lab">
    <View style={ws.hero}><Text style={ws.kicker}>GLASS NOTES / LAB</Text><Heading level={1} style={ws.title}>{l('lab')}</Heading><Text style={ws.body}>{l('intro')}</Text><Text accessibilityLiveRegion="polite" style={ws.muted}>{l(!lab.hydrated?'loading':lab.saving?'saving':lab.error?'sessionOnly':'local')}</Text></View>
    {(!lab.storageAvailable||lab.error)&&<Panel><Text accessibilityRole="alert" style={ws.error}>{l(lab.hydrated?'sessionOnly':'storageError')}</Text>{lab.hydrated?<View style={ws.row}><Action disabled={lab.saving} label={l('retrySave')} onPress={()=>void retrySave()}/><Action label={l('export')} onPress={()=>void saveLabFile(exportLabBackup(lab.projects),'json').catch(()=>setError(l('failed')))}/></View>:<Action label={l('retry')} onPress={()=>void lab.load()}/>}</Panel>}
    {error!==''&&<Text accessibilityRole="alert" style={ws.error}>{error}</Text>}
    {notice!==''&&<Text accessibilityLiveRegion="polite" style={ws.body}>{notice}</Text>}
    {deleteTarget&&<Panel title={l('confirmDelete')}><Text style={ws.heading}>{deleteTarget.name}</Text><Text style={ws.body}>{deleteTarget.versionCount} {l('versions')} · {deleteTarget.batchCount} {l('batches')}</Text><Text style={ws.error}>{l('deleteImpact')}</Text><View style={ws.row}><Action danger disabled={deleteBusy} label={deleteBusy?l('deleteSaving'):l('confirmDeleteAction')} onPress={()=>void confirmDelete()}/><Action label={l('cancel')} disabled={deleteBusy} onPress={()=>setDeleteTarget(null)} quiet/></View></Panel>}
    {!lab.hydrated?<Text style={ws.body}>{l('loading')}</Text>:params.project?
      pendingCurrent?null:project?<Project key={project.id} project={project} lab={lab} l={l} locale={locale} unit={unit} onDelete={()=>askDelete(project)}/>:<Panel><Text style={ws.body}>{l('notFound')}</Text><Action label={l('backProjects')} onPress={()=>router.replace('/lab' as never)}/></Panel>:
      <>
        <View style={ws.row}><Action label={'＋ '+l('newProject')} selected onPress={create}/><Text style={ws.muted}>{lab.projects.length} · {l('backProjects')}</Text></View>
        {lab.projects.length>0&&<Field label={l('search')} value={search} onChange={setSearch}/>}
        {!lab.projects.length&&<Panel><Text style={ws.body}>{l('empty')}</Text></Panel>}
        <View style={ws.twoCol}>{lab.projects.map(p=>({p,score:normalizeSearchText(search)?scoreTextSearch(search,[p.name,p.goal]):1})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score).map(({p})=><View key={p.id} style={ws.column}><Panel><Text style={ws.heading}>{p.name||l('untitled')}</Text>{!!p.goal&&<Text numberOfLines={3} style={ws.body}>{p.goal}</Text>}<Text style={ws.muted}>{p.versions.length} {l('versions')} · {p.batches.length} {l('batches')}</Text><Text style={ws.muted}>{new Date(p.updatedAt).toLocaleDateString(locale)}</Text><View style={ws.row}><Action label={l('openProject')} onPress={()=>router.push({pathname:'/lab' as never,params:{project:p.id}})}/><Action quiet danger label={l('deleteProject')} onPress={()=>askDelete(p)}/></View></Panel></View>)}</View>
      </>}
    <Backup lab={lab} l={l}/>
  </Workspace>;
}

function Project({project:p,lab,l,locale,unit,onDelete}:{project:LabProject;lab:Lab;l:Copy;locale:Locale;unit:UnitPreference;onDelete:()=>void}) {
  const [tab,setTab]=useState<'versions'|'batches'|'compare'|'results'>('versions');
  const [versionId,setVersionId]=useState(p.versions[0]?.id);
  const [batchId,setBatchId]=useState(p.batches[0]?.id);
  const [error,setError]=useState('');
  const version=p.versions.find(v=>v.id===versionId)??p.versions[0]!;
  const batch=p.batches.find(b=>b.id===batchId)??p.batches[0];
  const run=(fn:()=>void)=>{try{fn();setError('');}catch{setError(l('failed'));}};
  return <>
    <View style={ws.row}><Action quiet label={'← '+l('backProjects')} onPress={()=>router.replace('/lab' as never)}/><Action quiet danger label={l('deleteProject')} onPress={onDelete}/></View>
    <Panel><Field label={l('name')} value={p.name} maxLength={200} onChange={name=>run(()=>lab.updateProject(p.id,{name}))}/><Field label={l('goal')} value={p.goal} multiline onChange={goal=>run(()=>lab.updateProject(p.id,{goal}))}/></Panel>
    <View style={ws.row}>{(['versions','batches','compare','results'] as const).map(key=><Action key={key} label={key==='results'?labResultsText(locale,'tab'):l(key)} selected={tab===key} onPress={()=>setTab(key)}/>)}</View>
    {error!==''&&<Text accessibilityRole="alert" style={ws.error}>{error}</Text>}
    {tab==='versions'&&<>
      <View style={ws.row}>{p.versions.map((v,i)=><Action key={v.id} label={v.name||`v${i+1}`} selected={v.id===version.id} onPress={()=>setVersionId(v.id)}/>)}<Action label={'＋ '+l('duplicate')} onPress={()=>run(()=>setVersionId(lab.addVersion(p.id,version.id)))}/></View>
      <Panel><VersionEditor key={version.id} version={version} l={l} locale={locale} update={patch=>run(()=>lab.updateVersion(p.id,version.id,patch))}/><View style={ws.row}><Action label={l('newBatch')} selected onPress={()=>run(()=>{const id=lab.addBatch(p.id,version.id);setBatchId(id);setTab('batches');})}/><Action label={backupText(locale,'labSave')} onPress={()=>void lab.whenSaved().then(()=>{if(lab.saveStatus())router.push({pathname:'/my-recipes',params:{fromLab:p.id,labVersion:version.id}} as never);else setError(l('failed'));})}/></View></Panel>
      <Fold title={l('deleteVersion')}><Text style={ws.muted}>{l('deleteVersionHint')}</Text><ConfirmRemove key={version.id} l={l} disabled={p.versions.length<2||p.batches.some(b=>b.versionId===version.id)} label={l('deleteVersion')} onConfirm={()=>run(()=>lab.deleteVersion(p.id,version.id))}/></Fold>
    </>}
    {tab==='batches'&&<>
      {!p.batches.length?<Panel><Text style={ws.body}>{l('noBatches')}</Text><Action label={l('versions')} onPress={()=>setTab('versions')}/></Panel>:<>
        <View style={ws.row}>{p.batches.map((b,i)=><Action key={b.id} label={b.name||`#${i+1}`} selected={b.id===batch?.id} onPress={()=>setBatchId(b.id)}/>)}</View>
        {batch&&<Panel><BatchEditor key={batch.id} batch={batch} l={l} update={patch=>run(()=>lab.updateBatch(p.id,batch.id,patch))}/><Fold title={l('deleteBatch')}><ConfirmRemove key={batch.id} l={l} label={l('deleteBatch')} onConfirm={()=>run(()=>lab.deleteBatch(p.id,batch.id))}/></Fold></Panel>}
      </>}
    </>}
    {tab==='compare'&&<VersionComparison versions={p.versions} l={l} locale={locale}/>}
    <View style={tab==='results'?undefined:{display:'none'}}><BatchComparison batches={p.batches} locale={locale} unit={unit}
      onCreateVersion={async(batch,name)=>{
        const note=labResultsText(locale,'sourceBatchNote',{batch:batch.name||batch.versionSnapshot.name,id:batch.id});
        const versionId=createVersionFromBatch(lab,p.id,batch,name,note);
        await lab.whenSaved();
        return {versionId,saved:lab.saveStatus()};
      }}
      onRetrySave={()=>lab.retrySave()}
      onOpenVersion={id=>{setVersionId(id);setTab('versions');}}
      onRecordExperiment={()=>setTab('versions')}
    /></View>
    {p.source&&<Fold title={l('source')}><Text style={ws.heading}>{p.source.title}</Text><RecipeRead version={{ingredients:p.source.ingredients,method:p.source.method,notes:''}} l={l}/></Fold>}
  </>;
}

function VersionEditor({version:v,update,l,locale}:{version:LabVersion;update:(patch:Partial<LabVersion>)=>void;l:Copy;locale:Locale}) {
  const editIngredient=(id:string,patch:Partial<LabIngredient>)=>update({ingredients:v.ingredients.map(i=>i.id===id?{...i,...patch}:i)});
  return <>
    <Field label={l('versionName')} value={v.name} maxLength={200} onChange={name=>update({name})}/>
    <Text style={ws.heading}>{l('ingredients')}</Text>
    {v.ingredients.map((i,n)=><View key={i.id} style={{gap:10,paddingBottom:16,borderBottomWidth:1,borderColor:colors.border}}>
      <Field label={`${n+1}. ${l('ingredient')}`} value={i.name} maxLength={500} onChange={name=>editIngredient(i.id,{name,ingredientId:undefined})}/>
      <AmountEditor amount={i.amount} unit={i.unit} locale={locale} amountLabel={l('amount')} unitLabel={l('unit')} onCommit={(amount,unit)=>editIngredient(i.id,{amount,unit})}/>
      <Fold title={i.bottleName?l('bottle')+': '+i.bottleName:l('bottle')}>
        <Field label={l('bottle')} value={i.bottleName??''} maxLength={500} onChange={bottleName=>editIngredient(i.id,{bottleName,bottleId:undefined})}/>
        <BottleChooser locale={locale} onSelect={(bottleId,bottleName)=>editIngredient(i.id,{bottleId,bottleName})}/>
      </Fold>
      <View style={{alignItems:'flex-end'}}><ConfirmRemove l={l} label={l('remove')+` · ${n+1}`} onConfirm={()=>update({ingredients:v.ingredients.filter(item=>item.id!==i.id)})}/></View>
    </View>)}
    <Action label={'＋ '+l('addIngredient')} onPress={()=>update({ingredients:[...v.ingredients,blankIngredient()]})}/>
    <Field label={l('method')} value={v.method} multiline onChange={method=>update({method})}/>
    <Field label={l('notes')} value={v.notes} multiline onChange={notes=>update({notes})}/>
  </>;
}

function BatchEditor({batch:b,update,l}:{batch:LabBatch;update:(patch:Partial<LabBatch>)=>void;l:Copy}) {
  const observation=(id:string,patch:Partial<LabObservation>)=>update({observations:b.observations.map(o=>o.id===id?{...o,...patch}:o)});
  return <>
    <Field label={l('batchName')} value={b.name} maxLength={200} onChange={name=>update({name})}/>
    <Fold title={l('snapshot')}><Text style={ws.muted}>{l('snapshotHint')}</Text><Text style={ws.heading}>{b.versionSnapshot.name}</Text><RecipeRead version={b.versionSnapshot} l={l}/></Fold>
    <Fold title={l('conditions')}>
      <View style={ws.twoCol}>{(['medium','ratio','temperature','startedAt','endedAt','agitation','filtration','yield'] as const).map(key=><View key={key} style={ws.column}><Field label={l(key)} value={b[key]} maxLength={1000} onChange={value=>update({[key]:value})}/></View>)}</View>
    </Fold>
    <Text style={ws.heading}>{l('observations')}</Text>
    {b.observations.map((o,n)=><View key={o.id} style={{gap:12,borderLeftWidth:2,borderColor:colors.border,paddingLeft:14}}>
      <Field label={`${n+1}. ${l('time')}`} value={o.time} maxLength={200} onChange={time=>observation(o.id,{time})}/>
      <Field label={l('notes')} value={o.notes} multiline onChange={notes=>observation(o.id,{notes})}/>
      <Fold title={[l('temperature'),l('aroma'),l('palate'),l('appearance')].join(' / ')}>
        {(['temperature','aroma','palate','appearance'] as const).map(key=><Field key={key} label={l(key)} value={o[key]} onChange={value=>observation(o.id,{[key]:value})}/>)}
        <ConfirmRemove l={l} label={l('remove')+` · ${n+1}`} onConfirm={()=>update({observations:b.observations.filter(item=>item.id!==o.id)})}/>
      </Fold>
    </View>)}
    <Action label={'＋ '+l('addObservation')} onPress={()=>update({observations:[...b.observations,{id:uid(),time:'',temperature:'',aroma:'',palate:'',appearance:'',notes:''}]})}/>
    <Field label={l('outcome')} value={b.outcome} multiline onChange={outcome=>update({outcome})}/>
    <Field label={l('nextStep')} value={b.nextStep} multiline onChange={nextStep=>update({nextStep})}/>
  </>;
}
function ConfirmRemove({l,label,onConfirm,disabled=false}:{l:Copy;label:string;onConfirm:()=>void;disabled?:boolean}){
  const [confirm,setConfirm]=useState(false);return confirm?<View style={ws.row}><Action danger label={l('confirmRemove')} onPress={onConfirm}/><Action quiet label={l('cancel')} onPress={()=>setConfirm(false)}/></View>:<Action quiet danger disabled={disabled} label={label} onPress={()=>setConfirm(true)}/>;
}
function Backup({lab,l}:{lab:Lab;l:Copy}) {
  const [pending,setPending]=useState<LabBackup|null>(null);const [raw,setRaw]=useState('');const [status,setStatus]=useState('');const [busy,setBusy]=useState(false);
  const preview=(text:string)=>{try{setPending(parseLabBackup(text));setStatus('');}catch{setPending(null);setStatus(l('invalid'));}};
  const save=async(type:'json'|'md')=>{setBusy(true);setStatus('');try{const saved=await saveLabFile(type==='json'?exportLabBackup(lab.projects):exportLabMarkdown(lab.projects),type);if(saved)setStatus(l('exportOpened'));}catch{setStatus(l('failed'));}finally{setBusy(false);}};
  const restore=async()=>{setBusy(true);setStatus('');try{const value=await readLabFile();if(value!==null)preview(value);}catch{setStatus(l('invalid'));}finally{setBusy(false);}};
  return <Fold title={l('backup')}><Text style={ws.body}>{l('localHint')}</Text><View style={ws.row}><Action label={l('export')} disabled={busy||!lab.hydrated} onPress={()=>void save('json')}/><Action label={l('markdown')} disabled={busy||!lab.hydrated} onPress={()=>void save('md')}/><Action label={l('import')} disabled={busy||!lab.hydrated} onPress={()=>void restore()}/></View><Fold title={l('paste')}><Field label={l('paste')} value={raw} onChange={setRaw} multiline maxLength={5_000_000}/><Action label={l('preview')} disabled={busy||!lab.hydrated||!raw.trim()} onPress={()=>preview(raw)}/></Fold>
    {pending&&<Panel title={l('preview')}><Text style={ws.body}>{pending.projects.length} · {l('backProjects')}</Text>{pending.projects.slice(0,8).map((p,i)=><Text key={i} style={ws.body}>{p.name} · {p.versions.length} {l('versions')}</Text>)}<Text style={ws.muted}>{l('mergeHint')}</Text><View style={ws.row}><Action selected label={l('merge')} disabled={!lab.hydrated||busy} onPress={()=>{setBusy(true);void(async()=>{try{lab.importBackup(pending);setPending(null);setRaw('');await lab.whenSaved();setStatus(l(lab.saveStatus()?'done':'sessionOnly'));}catch{setStatus(l('failed'));}finally{setBusy(false);}})();}}/><Action label={l('cancel')} quiet onPress={()=>setPending(null)}/></View></Panel>}
    {!!status&&<Text accessibilityRole="alert" style={ws.body}>{status}</Text>}
  </Fold>;
}
