import React from 'react';
import {Text} from 'react-native';
import type {Cocktail, Locale} from '../../domain/contracts';
import type {MakingRecipe} from '../../domain/making/types';
import type {Bottle} from '../../domain/bottles/types';
import {bottleDisplayName} from '../../domain/bottles/format';
import {recipeDisplayCocktail} from '../../content/localization/display';
import {colors} from '../../theme/tokens';

export function OriginalName({name, original, numberOfLines}: {name: string; original?: string; numberOfLines?: number}) {
  const same = original?.normalize('NFKC').trim().toLowerCase() === name.normalize('NFKC').trim().toLowerCase();
  return !original || same ? null : <Text numberOfLines={numberOfLines} style={{color: colors.secondary, fontSize: 12, lineHeight: 18, marginTop: 4, flexShrink: 1}}>{original}</Text>;
}

export function CocktailOriginalName({cocktail, recipe, locale, numberOfLines}: {cocktail?: Cocktail; recipe?: MakingRecipe; locale: Locale; numberOfLines?: number}) {
  const item = cocktail ?? (recipe ? recipeDisplayCocktail(recipe) : undefined);
  return item ? <OriginalName name={item.name[locale]} original={item.originalName} numberOfLines={numberOfLines} /> : null;
}

export function BottleOriginalName({bottle, locale}: {bottle: Bottle; locale: Locale}) {
  return <OriginalName name={bottleDisplayName(bottle, locale)} original={bottleDisplayName(bottle)} />;
}
