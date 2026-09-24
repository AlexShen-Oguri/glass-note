import React from 'react';
import {useLocalSearchParams} from 'expo-router';
import {catalogue} from '../../content/catalogue';
import LibraryScreen from '../../features/ingredients/LibraryScreen';
export function generateStaticParams() {return catalogue.ingredients.map(i=>({id:i.id}));}
export default function IngredientRoute() {
  const {id}=useLocalSearchParams<{id:string}>();
  return <LibraryScreen ingredientId={id}/>;
}
