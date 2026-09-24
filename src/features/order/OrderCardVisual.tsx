import React from 'react';
import {OriginalName} from '../names/OriginalName';
import {Text,View} from 'react-native';
import {bottleDisplayName} from '../../domain/bottles/format';
import {orderCardOriginalTitle,type OrderCard,type OrderSimpleFormatCopy} from '../../domain/order';
import {orderStyles as s} from './orderStyles';

export function OrderCardVisual({card,copy}:{card:OrderCard;copy:OrderSimpleFormatCopy}){
  const requiredRows=card.rows.filter(row=>!row.optional);
  const requestedRows=card.rows.filter(row=>row.selectedBottle||row.explicitModification);
  const originalTitle=orderCardOriginalTitle(card);
  return <View style={s.visualCard}>
    <Text accessibilityRole="header" style={s.visualTitle}>{card.title}</Text>
    {originalTitle?<Text style={s.visualOriginalTitle}>{copy.originalName}: {originalTitle}</Text>:null}
    <View style={s.visualSection}>
      <Text style={s.visualSectionLabel}>{copy.ingredients}</Text>
      <View style={s.ingredientList}>
        {requiredRows.map(row=><View key={row.rowId} style={s.ingredientRow}><View style={s.ingredientBullet}/><Text style={s.ingredientText}>{row.ingredientName}{row.sourceBrandName?` (${copy.sourceBrand}: ${row.sourceBrandName})`:''}</Text></View>)}
      </View>
    </View>
    {requestedRows.length?<View style={s.visualSection}>
      <Text style={s.visualSectionLabel}>{copy.requests}</Text>
      <View style={s.requestList}>
        {requestedRows.map(row=><React.Fragment key={`${row.rowId}-request`}>
          {row.selectedBottle?<View><Text style={s.requestText}>{copy.brand}: {row.selectedBottle.displayName||bottleDisplayName(row.selectedBottle)}{row.optional?` (${copy.optional})`:''}</Text><OriginalName name={row.selectedBottle.displayName||bottleDisplayName(row.selectedBottle)} original={bottleDisplayName(row.selectedBottle)} /></View>:null}
          {row.explicitModification?<Text style={s.requestText}>{copy.modification}: {row.ingredientName}: {row.explicitModification}{row.optional?` (${copy.optional})`:''}</Text>:null}
        </React.Fragment>)}
      </View>
    </View>:null}
  </View>;
}
