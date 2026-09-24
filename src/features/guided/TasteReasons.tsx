import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {router} from 'expo-router';
import type {Locale} from '../../domain/contracts';
import type {TasteResult,MemoryReasonKind} from '../../domain/taste/types';
import {tm,type TasteKey} from '../../i18n/taste';
import {t} from '../../i18n/ui';
import {colors} from '../../theme/tokens';

const labels:Record<MemoryReasonKind,TasteKey>={'liked-version':'likedVersion','disliked-version':'dislikedVersion','liked-flavour':'likedFlavour','less-sweet':'lessSweet','less-strong':'lessStrong','sweet-caution':'sweetCaution','strong-caution':'strongCaution'};
export function TasteReasons({result,locale}:{result:TasteResult;locale:Locale}){
  if (!result.memoryReasons.length) return null;
  return <View style={{paddingHorizontal:12,paddingBottom:12,gap:8}}>
    {result.memoryReasons.length>0&&<Text style={{color:colors.accent,fontSize:12,fontWeight:'700'}}>{tm(locale,'memoryReasonTitle')}</Text>}
    {result.memoryReasons.map((reason,index)=><View key={`${reason.kind}-${index}`} style={{gap:4}}>
      <Text style={{color:colors.secondary,fontSize:12,lineHeight:19}}>{tm(locale,labels[reason.kind]!,{flavours:reason.flavours?.map(f=>t(locale,`flavour.${f}`)).join(' · ')??''})}</Text>
      {reason.feedbackIds.map(id=><Pressable key={id} accessibilityRole="link" onPress={()=>router.push({pathname:'/taste' as never,params:{entry:id}})} style={{minHeight:36,justifyContent:'center'}}><Text style={{color:colors.accent,fontSize:12}}>{tm(locale,'feedbackLink')} ↗</Text></Pressable>)}
    </View>)}
  </View>;
}
