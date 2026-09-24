import React from 'react';
import {Image} from 'react-native';
import type {Ingredient} from '../../domain/contracts';
import {ingredientFamily} from '../../domain/ingredients/guide';
import {ingredientArt} from '../../media/ingredients';

/** Decorative family hint; the adjacent name supplies the exact material. */
export function IngredientPicture({ingredient, size = 64}: {ingredient: Ingredient; size?: number}) {
  return <Image source={ingredientArt[ingredientFamily(ingredient)]} accessible={false} resizeMode="contain" style={{width:size,height:size,borderRadius:size*.22}} />;
}
