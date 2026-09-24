import React, {useEffect, useState} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {useLocalSearchParams} from 'expo-router';
import RecipeScreen from '../../features/recipe/RecipeScreen';
import {catalogue} from '../../content/catalogue';
import {parseRecipeRouteParams} from '../../domain/discovery/navigation-state';
import {colors} from '../../theme/tokens';

export function generateStaticParams() {
  return catalogue.cocktails.map(cocktail => ({id:cocktail.id}));
}
export default function RecipeRoute() {
  const params = useLocalSearchParams<{id?: string | string[]; version?: string | string[]; from?: string | string[]; listId?: string | string[]}>();
  const listId = (Array.isArray(params.listId) ? params.listId[0] : params.listId) || undefined;
  const {id, version, from} = parseRecipeRouteParams(params);
  const [queryReady, setQueryReady] = useState(false);
  useEffect(() => setQueryReady(true), []);
  // Static HTML cannot know query parameters. Keep the first hydration frame
  // neutral instead of briefly showing another source's recipe and actions.
  if (!queryReady) return <View style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator color={colors.accent} /></View>;
  return <RecipeScreen cocktailId={id} versionId={version} from={from} listId={listId} />;
}
