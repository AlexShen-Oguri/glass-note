import React,{useMemo} from 'react';
import {Linking,Pressable,Text,View} from 'react-native';
import type {Locale,RecipeVersion} from '../../domain/contracts';
import {catalogue} from '../../content/catalogue';
import {bottles} from '../../content/bottles';
import {estimateRecipeAbv} from '../../domain/making/recipe-abv';
import {refinementText as copy} from '../../i18n/experience-refinement';
import {makingStyles as s} from './styles';
import {Disclosure} from './ui';
import {Heading} from '../navigation/Heading';

export function RecipeAbv({version,locale,showSources=false}:{version:RecipeVersion;locale:Locale;showSources?:boolean}){
  const result=useMemo(()=>estimateRecipeAbv(version,catalogue,bottles),[version]);
  return <View style={{gap:8,paddingVertical:18}}><Heading level={2} style={s.sectionHeading}>{copy(locale,'abv')}</Heading>
    {result?<><Text style={s.count}>≈ {result.low===result.high?result.low:`${result.low}–${result.high}`}%</Text><Text style={s.body}>{copy(locale,'beforeIce')}</Text><Disclosure title={copy(locale,'sources')}><Text style={s.body}>{copy(locale,'estimateNote')}</Text>{showSources&&result.sources.map(source=><Pressable key={source.url} accessibilityRole="link" style={s.sourceLink} onPress={()=>void Linking.openURL(source.url)}><Text style={s.linkText}>{source.title} ↗</Text></Pressable>)}</Disclosure></>:<Text style={s.body}>{copy(locale,'unknownAbv')}</Text>}
  </View>;
}
