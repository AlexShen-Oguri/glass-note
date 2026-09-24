import React from 'react';
import {Platform,Pressable,Text,View} from 'react-native';
import {memoryStyles as s} from './styles';

export function Action({label,accessibilityLabel,onPress,primary=false,quiet=false,danger=false,disabled=false,expanded}:{label:string;accessibilityLabel?:string;onPress:()=>void;primary?:boolean;quiet?:boolean;danger?:boolean;disabled?:boolean;expanded?:boolean}){
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel??label} accessibilityState={{disabled,...(expanded===undefined?{}:{expanded})}} disabled={disabled} onPress={onPress} style={({pressed})=>[s.action,primary&&s.actionPrimary,quiet&&s.actionQuiet,danger&&s.actionDanger,disabled&&s.disabled,pressed&&s.pressed]}><Text style={[s.actionText,primary&&s.actionPrimaryText,danger&&s.actionDangerText]}>{label}</Text></Pressable>;
}
export function Choice({label,selected,onPress,disabled=false}:{label:string;selected:boolean;onPress:()=>void;disabled?:boolean}){
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected,disabled}} {...(Platform.OS==='web'?{'aria-pressed':selected}:{})} disabled={disabled} onPress={onPress} style={({pressed})=>[s.chip,selected&&s.chipSelected,disabled&&s.disabled,pressed&&s.pressed]}><Text style={[s.chipText,selected&&s.chipTextSelected]}>{label}</Text></Pressable>;
}
export function Panel({children,raised=false,warning=false}:{children:React.ReactNode;raised?:boolean;warning?:boolean}){return <View style={[s.panel,raised&&s.raised,warning&&s.warning]}>{children}</View>;}
