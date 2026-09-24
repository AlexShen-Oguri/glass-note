import React from 'react';
import {BottleOriginalName} from '../../names/OriginalName';
import {StyleSheet,Text,View} from 'react-native';
import {ginComparisonPilotBottle} from '../../../content/gin-comparison-pilot';
import type {Bottle} from '../../../domain/bottles/types';
import {bottleDisplayName} from '../../../domain/bottles/format';
import type {Locale} from '../../../domain/contracts';
import {round17ComparisonText} from '../../../i18n/round17-comparison';
import {colors} from '../../../theme/tokens';
import {Action,Fold,ws} from '../ui';

export function GinComparisonPilotPanel({selected,locale,loaded,disabled,onLoad}:{
  selected:Bottle[];
  locale:Locale;
  loaded:boolean;
  disabled:boolean;
  onLoad:()=>void;
}){
  const p=(key:Parameters<typeof round17ComparisonText>[1],values:Record<string,string|number>={})=>round17ComparisonText(locale,key,values);
  const records=selected.map(bottle=>({bottle,record:ginComparisonPilotBottle(bottle.id)}));
  if(records.some(item=>!item.record))return null;
  return <View style={styles.wrap}>
    <Text style={styles.title}>{p('pilotTitle')}</Text>
    <Text style={ws.body}>{p('pilotBody')}</Text>
    <Action label={p('loadPilot')} selected={loaded} disabled={disabled} onPress={onLoad}/>
    {loaded&&<Text style={styles.next}>{p('chooseRowNext')}</Text>}
    <Fold title={p('producerEvidence')}><View>{records.map(({bottle,record})=>{
        if(!record)return null;
        return <View key={bottle.id} style={styles.evidenceRow}>
          <Text style={styles.bottle}>{bottleDisplayName(bottle,locale)}</Text>
          <BottleOriginalName bottle={bottle} locale={locale} />
          <Text style={ws.body}>{record.flavourSummary[locale]}</Text>
          {typeof bottle.abv==='number'&&<Text style={ws.muted}>{p('catalogueAbv',{abv:bottle.abv,market:bottle.market})}</Text>}
        </View>;
      })}</View>
      <Text style={styles.boundary}>{p('actualAbvUnknown')}</Text>
      <Text style={styles.boundary}>{p('editorialBoundary')}</Text>
    </Fold>
  </View>;
}

const styles=StyleSheet.create({
  wrap:{gap:12},
  title:{fontSize:19,lineHeight:26,fontWeight:'700',color:colors.text},
  next:{fontSize:13,lineHeight:21,fontWeight:'600',color:colors.accent},
  evidenceRow:{gap:6,paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.border},
  bottle:{fontSize:14,lineHeight:21,fontWeight:'700',color:colors.text},
  sourceLink:{minHeight:44,justifyContent:'center',alignSelf:'flex-start'},
  sourceText:{fontSize:12,lineHeight:18,fontWeight:'600',color:colors.accent,textDecorationLine:'underline'},
  boundary:{fontSize:12,lineHeight:19,color:colors.secondary},
});
