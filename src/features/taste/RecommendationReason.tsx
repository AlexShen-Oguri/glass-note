import React,{useState} from 'react';
import {Link} from 'expo-router';
import {Platform,Pressable,StyleSheet,Text,View} from 'react-native';
import type {Locale} from '../../domain/contracts';
import {recommendationText as copy} from '../../i18n/recommendations';
import {colors} from '../../theme/tokens';

/** One optional explanation and one real evidence destination, outside the recipe link. */
export function RecommendationReason({locale,label,text,evidenceId,disabled=false}:{locale:Locale;label?:string;text:string;evidenceId?:string;disabled?:boolean}){
  const [expanded,setExpanded]=useState(false);
  const [evidencePressed,setEvidencePressed]=useState(false);
  // Expo's asChild slot merges style objects; a function would lose the hit area and alignment.
  const evidence=<Pressable accessibilityRole="link" accessibilityState={{disabled}} disabled={disabled} onPressIn={()=>setEvidencePressed(true)} onPressOut={()=>setEvidencePressed(false)} style={StyleSheet.flatten([s.evidence,disabled&&s.disabled,evidencePressed&&s.pressed])}><Text style={s.evidenceText}>{copy(locale,'evidence')}</Text></Pressable>;
  return <View style={s.container}>
    <View style={s.row}>
      {label?<Text style={s.label}>{label}</Text>:null}
      <Pressable accessibilityRole="button" accessibilityState={{expanded}} {...(Platform.OS==='web'?{'aria-expanded':expanded}:{})} onPress={()=>setExpanded(value=>!value)} style={({pressed})=>[s.toggle,pressed&&s.pressed]}><Text style={s.toggleText}>{copy(locale,'why')}</Text></Pressable>
    </View>
    {expanded?<View style={s.details}>
      <Text testID="recommendation-explanation" style={s.body}>{text}</Text>
      {evidenceId?(disabled?evidence:<Link href={{pathname:'/taste',params:{entry:evidenceId}}} asChild>{evidence}</Link>):null}
    </View>:null}
  </View>;
}

const s=StyleSheet.create({
  container:{paddingTop:4,gap:6},
  row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',columnGap:10},
  label:{fontSize:12,lineHeight:19,color:colors.accent,flexShrink:1},
  toggle:{minHeight:44,paddingVertical:10,paddingHorizontal:0,justifyContent:'center',flexShrink:1},
  toggleText:{fontSize:12,lineHeight:19,color:colors.secondary,textDecorationLine:'underline'},
  details:{gap:8,paddingBottom:12},
  body:{fontSize:13,lineHeight:21,color:colors.secondary},
  evidence:{minHeight:44,paddingHorizontal:12,paddingVertical:11,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},
  evidenceText:{fontSize:12,lineHeight:20,color:colors.accent,textAlign:'center'},
  pressed:{opacity:.7},disabled:{opacity:.42},
});
