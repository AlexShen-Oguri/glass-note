import React from 'react';
import {Text, View} from 'react-native';
import {bottles} from '../../content/bottles';
import {bottleDisplayName} from '../../domain/bottles/format';
import type {Locale} from '../../domain/contracts';
import {p02BottleText} from '../../i18n/p02-bottles';
import {makingStyles as s} from './styles';
import type {MakingCopy} from './ui';

function BottleNameLines({bottle,locale}:{bottle:typeof bottles[number];locale:Locale}) {
  const localized=bottleDisplayName(bottle,locale);
  const original=bottleDisplayName(bottle);
  return <View style={s.grow}><Text style={s.strong}>{localized}</Text>{localized!==original?<Text style={s.meta}>{p02BottleText(locale,'originalName')}: {original}</Text>:null}</View>;
}

/** Bottle identity remains available for the optional ABV calculator. */
export function BottleIdentity({bottleId,locale,copy}:{bottleId:string;locale:Locale;copy:MakingCopy}) {
  const bottle=bottles.find(item=>item.id===bottleId);
  if(!bottle)return null;
  return <View style={s.bottleCard}><BottleNameLines bottle={bottle} locale={locale}/><Text style={s.body}>{copy('bottleAbv')}: {bottle.abv===null?'—':`${bottle.abv}%`}</Text><Text style={s.meta}>{copy('bottleSource')}: {bottle.source.title}</Text></View>;
}
