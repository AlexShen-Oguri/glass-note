import React,{useMemo,useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {Link} from 'expo-router';
import type {Locale} from '../../domain/contracts';
import {deriveTasteProfile,type TasteState} from '../../domain/taste';
import {recipeDisplayName} from '../../content/localization/display';
import {tm,type TasteKey} from '../../i18n/taste';
import {Heading} from '../navigation/Heading';
import {Panel} from './ui';
import {memoryStyles as s} from './styles';

/** A view of durable feedback; pending/failed writes must never appear learned. */
export function TasteProfileSummary({state,locale,disabled,onEvidence}:{state:TasteState;locale:Locale;disabled:boolean;onEvidence:(id:string)=>void}){
  const profile=useMemo(()=>deriveTasteProfile(state),[state]);
  const copy=(key:TasteKey,values?:Record<string,string|number>)=>tm(locale,key,values);
  const signals=[
    ...profile.flavours.map(signal=>({...signal,key:signal.flavour,label:copy(`flavour.${signal.flavour}` as TasteKey)})),
    ...(profile.sweetness?[{...profile.sweetness,key:'sweetness',label:copy('profileSweet')}]:[]),
    ...(profile.strength?[{...profile.strength,key:'strength',label:copy('profileStrong')}]:[]),
  ];
  return <View testID="taste-profile" style={s.profile}><Panel>
    <Heading level={2} style={s.heading}>{copy('profileTitle')}</Heading>
    <View style={s.grow}>
      <Text style={s.body}>{copy('profileCount',{count:profile.ratedRecipeCount})}</Text>
      {profile.featureRecipeCount>0?<Text style={s.muted}>{copy('profileFeatureCount',{count:profile.featureRecipeCount})}</Text>:null}
      <Text style={s.muted}>{copy('profileSavedOnly')}</Text>
    </View>
    {!profile.ratedRecipeCount?<Text style={s.body}>{copy('profileEmpty')}</Text>:null}
    <Text style={s.body}>{copy('profileIntro')}</Text>
    {profile.ratedRecipeCount>0&&!signals.length?<Text style={s.body}>{copy('profileExactOnly')}</Text>:null}
    {signals.map(signal=><SignalRow key={signal.key} signal={signal} state={state} locale={locale} disabled={disabled} onEvidence={onEvidence}/>)}
    <Text style={s.muted}>{copy(signals.some(signal=>signal.supportCount>=3)?'profileRepeated':'profileLimited')}</Text>
  </Panel></View>;
}

function SignalRow({signal,state,locale,disabled,onEvidence}:{signal:{key:string;label:string;supportCount:number;feedbackIds:string[]};state:TasteState;locale:Locale;disabled:boolean;onEvidence:(id:string)=>void}){
  const [expanded,setExpanded]=useState(false);
  const [pressedId,setPressedId]=useState<string|null>(null);
  const support=tm(locale,'profileSupport',{count:signal.supportCount});
  const stage=tm(locale,signal.supportCount<3?'profileEarly':'profileRecurring');
  return <View style={s.profileSignal}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${signal.label} · ${support} · ${stage}`} accessibilityState={{expanded}} onPress={()=>setExpanded(value=>!value)} style={({pressed})=>[s.profileSignalButton,pressed&&s.pressed]}>
      <View style={s.grow}><Text style={s.profileSignalTitle}>{signal.label}</Text><Text style={s.muted}>{support} · {stage}</Text></View>
      <Text style={s.link}>{tm(locale,'profileEvidence')}</Text>
    </Pressable>
    {expanded?<View style={s.profileEvidence}>{signal.feedbackIds.map(id=>{
      const entry=state.entries.find(item=>item.id===id);
      if(!entry)return null;
      const control=<Pressable accessibilityRole="link" accessibilityState={{disabled}} disabled={disabled} onPressIn={()=>setPressedId(id)} onPressOut={()=>setPressedId(null)} style={StyleSheet.flatten([s.profileEvidenceLink,disabled&&s.disabled,pressedId===id&&s.pressed])}><Text style={s.profileEvidenceText}>{recipeDisplayName(entry.recipe,locale)}</Text></Pressable>;
      return disabled?<View key={id}>{control}</View>:<Link key={id} href={{pathname:'/taste',params:{entry:id}}} asChild onPress={event=>{
        if('button' in event&&(event.metaKey||event.altKey||event.ctrlKey||event.shiftKey||(event.button!=null&&event.button!==0)))return;
        event.preventDefault();onEvidence(id);
      }}>{control}</Link>;
    })}</View>:null}
  </View>;
}
