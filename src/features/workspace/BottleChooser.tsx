import React,{useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import type {Locale} from '../../domain/contracts';
import {bottles} from '../../content/bottles';
import {bottleDisplayName,bottleSearchNames} from '../../domain/bottles/format';
import {normalizeSearchText,scoreTextSearch} from '../../domain/search';
import {labText} from '../../i18n/lab';
import {p02BottleText} from '../../i18n/p02-bottles';
import {colors,radii} from '../../theme/tokens';
import {BottlePhoto} from './BottlePhoto';
import {Field,ws} from './ui';

export function BottleChooser({locale,onSelect}:{locale:Locale;onSelect:(id:string,name:string)=>void}) {
  const [search,setSearch]=useState('');
  const tokens=normalizeSearchText(search).split(' ').filter(Boolean);
  const matches=tokens.length?bottles.map(b=>({b,score:scoreTextSearch(search,bottleSearchNames(b))})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score).map(r=>r.b):[];
  return <View style={{gap:8}}><Field label={labText(locale,'chooseBottle')} value={search} onChange={setSearch}/>{tokens.length>0&&<Text style={ws.muted}>{matches.length}</Text>}{matches.slice(0,8).map(b=><Pressable
    key={b.id}
    accessibilityRole="button"
    accessibilityLabel={bottleDisplayName(b,locale)}
    onPress={()=>{onSelect(b.id,bottleDisplayName(b));setSearch('');}}
    style={({pressed})=>({minHeight:92,flexDirection:'row',alignItems:'center',gap:12,padding:8,borderRadius:radii.small,borderWidth:1,borderColor:colors.border,backgroundColor:colors.raised,opacity:pressed?0.7:1})}
  ><BottlePhoto bottle={b} locale={locale} size="chooser"/><View style={{flex:1,minWidth:0,gap:3}}><Text style={ws.kicker}>{b.brandName}</Text><Text style={[ws.label,{color:colors.text}]}>{bottleDisplayName(b,locale)}</Text>{bottleDisplayName(b,locale)!==bottleDisplayName(b)&&<Text style={ws.muted}>{p02BottleText(locale,'originalName')}: {bottleDisplayName(b)}</Text>}</View></Pressable>)}</View>;
}
