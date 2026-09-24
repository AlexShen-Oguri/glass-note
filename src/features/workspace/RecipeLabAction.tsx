import React,{useState} from 'react';
import {Text,View} from 'react-native';
import {router} from 'expo-router';
import {catalogue} from '../../content/catalogue';
import type {Locale,RecipeVersion} from '../../domain/contracts';
import {getRecipePreparation} from '../../domain/preparations';
import {useLab} from '../../platform/LabProvider';
import {labText} from '../../i18n/lab';
import {recipeLabSource} from '../../domain/lab/recipeSource';
import {Action,ws} from './ui';
export function RecipeLabAction({version:v,locale}:{version:RecipeVersion;locale:Locale}){
  const lab=useLab();const [error,setError]=useState(false);
  const copy=()=>{try{
    const source=recipeLabSource(catalogue,v,locale,getRecipePreparation(v.id));
    const id=lab.createProject({name:source.title,source});
    router.push({pathname:'/lab' as never,params:{project:id}});
  }catch{setError(true);}};
  return <View style={{gap:8,marginVertical:20}}><Action label={labText(locale,'copyRecipe')} disabled={!lab.hydrated} onPress={copy}/>{error&&<Text style={ws.error}>{labText(locale,'failed')}</Text>}</View>;
}
