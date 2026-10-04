import React from 'react';
import {router} from 'expo-router';
import type {Locale} from '../../domain/contracts';
import {recipeFingerprint} from '../../domain/making';
import type {MakingRecipe} from '../../domain/making/types';
import {tm} from '../../i18n/taste';
import {useTaste} from '../../platform/TasteProvider';
import {Action} from './ui';

export function RecipeExperience({recipe,locale,listId,sessionId,primary=false}:{recipe:MakingRecipe;locale:Locale;listId?:string;sessionId?:string;primary?:boolean}){
  const taste=useTaste();
  const open=()=>{
    const fingerprint=recipeFingerprint(recipe);
    const entry=[...taste.savedState.entries].reverse()
      .filter(item=>item.recipe.version.id===recipe.version.id&&recipeFingerprint(item.recipe)===fingerprint)
      .sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt))[0];
    router.push({pathname:'/taste',params:entry?{entry:entry.id}:{version:recipe.version.id,...(listId?{list:listId}:{}),...(sessionId?{session:sessionId}:{})}});
  };
  return <Action quiet={!primary} primary={primary} disabled={!taste.hydrated&&!taste.error} label={tm(locale,'recordTaste')} onPress={open}/>;
}
