import React from 'react';
import {KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {useApp} from '../../platform/AppProvider';
import {t} from '../../i18n/ui';
import {colors, radii} from '../../theme/tokens';
import {BrandToolbar, serif} from '../discovery/components';
import {ProfessionalLinks} from '../navigation/ProfessionalLinks';
import {Heading} from '../navigation/Heading';

export function Workspace({section,children,showUnits=section==='lab'}: {section: 'lab'|'topics'|'bottles'; children: React.ReactNode;showUnits?:boolean}) {
  const app=useApp();
  const goBack=()=>router.canGoBack()?router.back():router.replace('/professional' as never);
  return <SafeAreaView style={{flex:1,backgroundColor:colors.background}} edges={['top']}>
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={ws.page}>
      <View style={ws.container}>
        <BrandToolbar {...app} showUnits={showUnits}/>
        <View style={ws.nav}>
          <Action label={'← '+t(app.locale,'back')} onPress={goBack} quiet/>
          <ProfessionalLinks locale={app.locale} variant="nav" selected={section} showHeading={false}/>
        </View>
        {children}
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function Action({label,onPress,selected=false,quiet=false,disabled=false,danger=false}: {label:string;onPress:()=>void;selected?:boolean;quiet?:boolean;disabled?:boolean;danger?:boolean}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled,selected}} disabled={disabled} onPress={onPress} style={({pressed})=>[ws.action,quiet&&ws.quiet,selected&&ws.selected,disabled&&{opacity:0.4},pressed&&{opacity:0.7}]}><Text style={[ws.actionText,selected&&{color:colors.text},danger&&{color:colors.danger}]}>{label}</Text></Pressable>;
}
export function Field({label,value,onChange,multiline=false,placeholder,maxLength=20000}: {label:string;value:string;onChange:(text:string)=>void;multiline?:boolean;placeholder?:string;maxLength?:number}) {
  const [focused,setFocused]=React.useState(false);
  return <View style={ws.field}><Text style={ws.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} multiline={multiline} placeholder={placeholder} placeholderTextColor={colors.muted} maxLength={maxLength} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={[ws.input,multiline&&ws.multiline,focused&&{borderColor:colors.accent,borderWidth:2}]} /></View>;
}
export function Panel({title,children}: {title?:string;children:React.ReactNode}) {
  return <View style={ws.panel}>{title&&<Heading level={2} style={ws.heading}>{title}</Heading>}{children}</View>;
}
export function Fold({title,children,initial=false}: {title:string;children:React.ReactNode;initial?:boolean}) {
  const [open,setOpen]=React.useState(initial);
  return <View style={ws.fold}><Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{expanded:open}} {...(Platform.OS==='web'?{'aria-expanded':open}:{})} onPress={()=>setOpen(!open)} style={ws.foldButton}><Text style={[ws.label,{flex:1,color:colors.text}]}>{title}</Text><Text style={ws.muted}>{open?'−':'＋'}</Text></Pressable>{open&&<View style={{gap:14,paddingBottom:14}}>{children}</View>}</View>;
}
export const ws=StyleSheet.create({
  page:{paddingHorizontal:20,paddingTop:14,paddingBottom:100},container:{width:'100%',maxWidth:1040,alignSelf:'center',gap:20},
  nav:{flexDirection:'row',gap:4,borderBottomWidth:1,borderColor:colors.border,paddingBottom:8,alignItems:'center'},row:{flexDirection:'row',flexWrap:'wrap',gap:10,alignItems:'center'},
  hero:{gap:10,paddingVertical:12},kicker:{fontSize:10,fontWeight:'700',letterSpacing:2,color:colors.accent,textTransform:'uppercase'},title:{fontFamily:serif,fontSize:34,lineHeight:43,color:colors.text},
  heading:{fontFamily:serif,fontSize:23,lineHeight:30,color:colors.text},body:{fontSize:14,lineHeight:23,color:colors.secondary},muted:{fontSize:12,lineHeight:19,color:colors.muted},
  panel:{backgroundColor:'rgba(25,35,30,0.96)',padding:18,borderRadius:radii.medium,borderWidth:1,borderColor:colors.border,gap:16},
  action:{minHeight:44,paddingVertical:12,paddingHorizontal:16,borderRadius:radii.small,borderWidth:1,borderColor:colors.border,backgroundColor:colors.raised,justifyContent:'center',alignItems:'center',flexShrink:1},
  quiet:{backgroundColor:'transparent',borderColor:'transparent',paddingHorizontal:10},selected:{borderColor:colors.accent,backgroundColor:colors.accentDark},actionText:{fontSize:13,lineHeight:19,fontWeight:'600',color:colors.accent,textAlign:'center'},
  field:{gap:7,flexShrink:1},label:{color:colors.secondary,fontSize:12,lineHeight:19,fontWeight:'600'},input:{minHeight:46,borderWidth:1,borderColor:colors.border,borderRadius:radii.small,paddingHorizontal:12,paddingVertical:12,color:colors.text,backgroundColor:colors.background,fontSize:16,lineHeight:22},
  multiline:{minHeight:100,textAlignVertical:'top'},fold:{borderTopWidth:1,borderColor:colors.border},foldButton:{minHeight:50,flexDirection:'row',alignItems:'center',gap:10},
  twoCol:{flexDirection:'row',flexWrap:'wrap',gap:14},column:{flexGrow:1,flexBasis:260,minWidth:0,gap:14},error:{color:colors.danger,fontSize:13,lineHeight:21},
});
