import React,{createContext,useCallback,useContext,useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {Platform,Pressable,StyleSheet,Text,View} from 'react-native';
import {getLocales} from 'expo-localization';
import type {Locale} from '../domain/contracts';
import {BACKUP_SECTIONS,type BackupSection} from '../domain/backup/types';
import {backupText} from '../i18n/backup';
import {localeFromDeviceLanguages} from './preferences';
import {personalStorage} from './storage';
import type {RawPersonalData,RecoveryState} from './personalStorage';
import {colors} from '../theme/tokens';

interface RecoveryContextValue {
  state:RecoveryState; register:(key:BackupSection,callback:()=>Promise<boolean>)=>()=>void;
  prepare:()=>Promise<RawPersonalData>;
  restore:(before:RawPersonalData,after:Partial<RawPersonalData>)=>Promise<void>;
}
const Context=createContext<RecoveryContextValue|null>(null);
export function RecoveryProvider({children}:{children:React.ReactNode}){
  const state=useSyncExternalStore(personalStorage.subscribe,personalStorage.getSnapshot,personalStorage.getSnapshot);
  const participants=useRef(new Map<BackupSection,()=>Promise<boolean>>());
  const [locale,setLocale]=useState<Locale>('en');const [rescueMessage,setRescueMessage]=useState('');
  useEffect(()=>{try{setLocale(localeFromDeviceLanguages(getLocales().map(l=>l.languageTag)));}catch{/* Recovery must also work when locale detection is unavailable. */}void personalStorage.initialize();},[]);
  const register=useCallback((key:BackupSection,callback:()=>Promise<boolean>)=>{participants.current.set(key,callback);return()=>{if(participants.current.get(key)===callback)participants.current.delete(key);};},[]);
  const prepare=useCallback(async()=>{
    if(personalStorage.getSnapshot().phase!=='ready'||BACKUP_SECTIONS.some(key=>!participants.current.has(key)))throw Error('personal-data-not-ready');
    const ok=await Promise.all(BACKUP_SECTIONS.map(key=>participants.current.get(key)!()));
    if(ok.some(value=>!value))throw Error('personal-data-not-ready');return personalStorage.readAll();
  },[]);
  const restore=useCallback(async(before:RawPersonalData,after:Partial<RawPersonalData>)=>{await prepare();await personalStorage.restore(before,after);},[prepare]);
  const rescue=async()=>{try{const raw=await personalStorage.readRecoveryBefore();const {fullBackupFromRaw}=await import('./backupAdapter');const {serializeFullBackup}=await import('../domain/backup');const {saveBackupFile}=await import('./backupFiles');const saved=await saveBackupFile(serializeFullBackup(fullBackupFromRaw(raw,locale)));setRescueMessage(saved?backupText(locale,Platform.OS==='web'?'exported':'shared'):'');}catch{setRescueMessage(backupText(locale,'rescueUnavailable'));}};
  return <Context.Provider value={{state,register,prepare,restore}}>{state.phase==='ready'?<React.Fragment key={state.epoch}>{children}</React.Fragment>:<View style={styles.screen}>
    <Text style={styles.title}>{backupText(locale,state.phase==='blocked'?'recoveryTitle':state.phase==='restoring'?'busy':'loading')}</Text>
    {state.phase==='blocked'&&<><Text style={styles.body}>{backupText(locale,state.notice==='external-change'?'external':'recoveryHint')}</Text><Pressable accessibilityRole="button" onPress={()=>{void personalStorage.initialize();}} style={styles.button}><Text style={styles.buttonText}>{backupText(locale,'retry')}</Text></Pressable>
      {state.notice!=='external-change'&&<Pressable accessibilityRole="button" onPress={()=>{void rescue();}} style={styles.secondary}><Text style={styles.body}>{backupText(locale,'rescue')}</Text></Pressable>}
      <Text accessibilityRole="alert" style={styles.body}>{rescueMessage}</Text>
      <Text style={styles.detail}>{backupText(locale,'diagnostic')}: {state.error}</Text></>}
  </View>}</Context.Provider>;
}
export function useRecovery(){const value=useContext(Context);if(!value)throw Error('RecoveryProvider required');return value;}
export function useStorageParticipant(key:BackupSection,flush:()=>Promise<boolean>){
  const {register}=useRecovery();const callback=useRef(flush);callback.current=flush;
  useEffect(()=>register(key,()=>callback.current()),[key,register]);
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:colors.background,alignItems:'center',justifyContent:'center',padding:28,gap:18},title:{color:colors.text,fontSize:25,textAlign:'center'},body:{color:colors.secondary,fontSize:15,lineHeight:24,textAlign:'center',maxWidth:560},button:{backgroundColor:colors.accent,borderRadius:24,paddingVertical:15,paddingHorizontal:28},buttonText:{color:colors.background,fontSize:15,fontWeight:'700'},secondary:{padding:12},detail:{color:colors.muted,fontSize:11,maxWidth:540,textAlign:'center'}});
