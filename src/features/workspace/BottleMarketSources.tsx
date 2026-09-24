import React from 'react';
import {Linking,Text,View} from 'react-native';
import type {Bottle} from '../../domain/bottles/types';
import type {Locale} from '../../domain/contracts';
import {bottleMarketText} from '../../i18n/bottle-market';
import {Action,ws} from './ui';

export function BottleMarketSources({bottle,locale}:{bottle:Bottle;locale:Locale}){
  if(!bottle.marketEvidence?.length)return null;
  const text=bottleMarketText(locale);
  return <View style={{gap:8}}>
    <Text style={ws.label}>{text.title}</Text>
    {bottle.marketEvidence.map(source=><View key={source.url} style={{gap:4}}>
      <Text style={ws.muted}>{text[source.scope]} · {source.checkedAt}</Text>
      <Action quiet label={`${source.title} ↗`} onPress={()=>void Linking.openURL(source.url)}/>
    </View>)}
    <Text style={ws.muted}>{text.note}</Text>
  </View>;
}
