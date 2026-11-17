import React, {useState} from 'react';
import {Pressable, Text, View, type StyleProp, type ViewStyle} from 'react-native';
import type {MakingKey} from '../../i18n/making';
import {makingStyles as s} from './styles';

export type MakingCopy = (key:MakingKey, values?:Record<string,string|number>)=>string;

export function Action({label, onPress, primary, selected, danger, disabled, style}: {label:string;onPress:()=>void;primary?:boolean;selected?:boolean;danger?:boolean;disabled?:boolean;style?:StyleProp<ViewStyle>}) {
  return <Pressable accessibilityRole="button" accessibilityState={{disabled,selected}} disabled={disabled} onPress={onPress} style={({pressed})=>[s.button,primary&&s.buttonPrimary,selected&&s.buttonSelected,danger&&s.buttonDanger,style,disabled&&s.disabled,pressed&&s.pressed]}><Text style={[s.buttonText,{textAlign:'center'},primary&&s.buttonPrimaryText,danger&&s.buttonDangerText]}>{label}</Text></Pressable>;
}

export function Disclosure({title, children, initial = false}: {title:string;children:React.ReactNode;initial?:boolean}) {
  const [open,setOpen]=useState(initial);
  return <View style={s.disclosure}><Pressable accessibilityRole="button" accessibilityLabel={title} aria-expanded={open} onPress={()=>setOpen(value=>!value)} style={({pressed})=>[s.disclosureButton,pressed&&s.pressed]}><Text style={s.strong}>{title}</Text><Text style={s.buttonText}>{open?'−':'+'}</Text></Pressable>{open?children:null}</View>;
}

export function PersistenceNotice({kind, retrying, onRetry, copy}: {kind:'read'|'write';retrying:boolean;onRetry:()=>void;copy:MakingCopy}) {
  return <View accessibilityRole="alert" style={[s.panel,kind==='read'?s.errorPanel:s.warningPanel]}><Text style={s.strong}>{copy(kind==='read'?'storageReadError':'storageWriteError')}</Text><Action label={copy(retrying?'saving':'retry')} disabled={retrying} onPress={onRetry}/></View>;
}
