import React from 'react';
import {linkedBottleDisplay} from '../../../content/localization/display';
import {BottleOriginalName} from '../../names/OriginalName';
import {Text, View} from 'react-native';
import type {LabVersion} from '../../../domain/lab/types';
import {displayLabAmount} from '../../../domain/lab/measure';
import {useApp} from '../../../platform/AppProvider';
import {ws} from '../ui';

type Copy = (key: 'ingredients' | 'method' | 'notes') => string;
export type ComparisonState = Partial<Record<'ingredients' | 'method' | 'notes', string>>;


export function RecipeRead({
  version: v,
  l,
  comparisonState,
}: {
  version: Pick<LabVersion, 'ingredients' | 'method' | 'notes'>;
  l: Copy;
  comparisonState?: ComparisonState;
}) {
  const {unit,locale} = useApp();
  const label = (key: keyof ComparisonState) => comparisonState?.[key]
    ? `${l(key)} · ${comparisonState[key]}`
    : l(key);
  return <View style={{gap: 12}}>
    <Text style={ws.label}>{label('ingredients')}</Text>
    {v.ingredients.map(i => {
      const measure = displayLabAmount(i.amount, i.unit, unit);
      const amount = measure.amount
        ? `${measure.amount}${measure.unit ? ` ${measure.unit}` : ''} · `
        : '';
      const display = linkedBottleDisplay(i, locale);
      return <View key={i.id}><Text style={ws.body}>{amount}{display.name}</Text>{display.bottle ? <BottleOriginalName bottle={display.bottle} locale={locale} /> : null}</View>;
    })}
    <Text style={ws.label}>{label('method')}</Text>
    <Text style={ws.body}>{v.method || '—'}</Text>
    {!!v.notes&&<>
      <Text style={ws.label}>{label('notes')}</Text>
      <Text style={ws.body}>{v.notes}</Text>
    </>}
  </View>;
}
