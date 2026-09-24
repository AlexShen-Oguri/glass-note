import React from 'react';
import {linkedBottleDisplay} from '../../../content/localization/display';
import {BottleOriginalName} from '../../names/OriginalName';
import {ScrollView,StyleSheet,Text,useWindowDimensions,View} from 'react-native';
import type {Locale,UnitPreference} from '../../../domain/contracts';
import type {LabIngredient,LabVersion} from '../../../domain/lab/types';
import {displayLabAmount} from '../../../domain/lab/measure';
import {alignLabIngredients} from '../../../domain/search/lab-comparison';
import {catalogue} from '../../../content/catalogue';
import {labComparisonText} from '../../../i18n/lab-comparison';
import {labText} from '../../../i18n/lab';
import {colors,radii} from '../../../theme/tokens';

export function VersionComparisonTable({versions,locale,unit}:{versions:LabVersion[];locale:Locale;unit:UnitPreference}){
  const {width,fontScale}=useWindowDimensions();
  const compact=width<760||fontScale>1.25;
  const c=(key:Parameters<typeof labComparisonText>[1])=>labComparisonText(locale,key);
  const l=(key:Parameters<typeof labText>[1])=>labText(locale,key);
  const rows=alignLabIngredients(versions);
  const tableMinWidth=compact?(versions.length===3?600:440):undefined;

  return <View style={styles.root}>
    {compact&&<Text style={styles.scrollHint}>↔ {c('scrollHint')}</Text>}
    <ScrollView
      accessibilityLabel={c('tableLabel')}
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={compact}
      style={styles.scroller}
      contentContainerStyle={[styles.table,tableMinWidth?{width:tableMinWidth,minWidth:'100%'}:{width:'100%'}]}
    >
      <View style={styles.columns}>{versions.map((version,index)=><View key={version.id} style={[styles.headerCell,index===versions.length-1&&styles.lastCell]}>
        <Text style={styles.versionIndex}>{index+1}</Text>
        <Text style={styles.versionName}>{version.name||`v${index+1}`}</Text>
      </View>)}</View>
      {rows.map((row,index)=><ComparisonRow key={row.key} label={`${index+1}. ${catalogue.ingredients.find(item=>item.id===row.cells.find(Boolean)?.ingredientId)?.name[locale]||row.label||c('unnamedIngredient')}`} last={false}>
        {row.cells.map((ingredient,column)=><View key={versions[column]!.id} style={[styles.valueCell,column===versions.length-1&&styles.lastCell]}>
          <IngredientValue ingredient={ingredient} locale={locale} unit={unit}/>
        </View>)}
      </ComparisonRow>)}
      <ComparisonRow label={l('method')}>
        {versions.map((version,index)=><View key={version.id} style={[styles.valueCell,index===versions.length-1&&styles.lastCell]}><Text style={styles.value}>{version.method||c('notRecorded')}</Text></View>)}
      </ComparisonRow>
      <ComparisonRow label={l('notes')} last>
        {versions.map((version,index)=><View key={version.id} style={[styles.valueCell,index===versions.length-1&&styles.lastCell]}><Text style={styles.value}>{version.notes||c('notRecorded')}</Text></View>)}
      </ComparisonRow>
    </ScrollView>
  </View>;
}

function ComparisonRow({label,children,last=false}:{label:string;children:React.ReactNode;last?:boolean}){
  return <View style={[styles.row,!last&&styles.rowBorder]}><Text style={styles.rowLabel}>{label}</Text><View style={styles.columns}>{children}</View></View>;
}

function IngredientValue({ingredient,locale,unit}:{ingredient:LabIngredient|null;locale:Locale;unit:UnitPreference}){
  const c=(key:Parameters<typeof labComparisonText>[1])=>labComparisonText(locale,key);
  if(!ingredient)return <Text style={styles.missing}>{c('notInVersion')}</Text>;
  const measure=displayLabAmount(ingredient.amount,ingredient.unit,unit);
  const {name,bottle}=linkedBottleDisplay(ingredient,locale);
  return <View style={styles.valueGroup}>
    <Text style={styles.ingredientName}>{name||c('unnamedIngredient')}</Text>
    {bottle ? <BottleOriginalName bottle={bottle} locale={locale} /> : null}
    <Text style={styles.amount}>{measure.amount||c('amountNotSet')}</Text>
    <Text style={styles.unit}>{measure.unit||c('unitNotSet')}</Text>
  </View>;
}


const styles=StyleSheet.create({
  root:{gap:10,maxWidth:'100%'},
  scroller:{width:'100%',maxWidth:'100%'},
  table:{flexGrow:1,flexDirection:'column',borderWidth:1,borderColor:colors.border,borderRadius:radii.small,overflow:'hidden',backgroundColor:'rgba(16,23,20,0.72)'},
  columns:{flexDirection:'row',alignItems:'stretch'},
  headerCell:{flex:1,minWidth:0,padding:12,gap:6,borderRightWidth:1,borderRightColor:colors.border,backgroundColor:colors.raised},
  lastCell:{borderRightWidth:0},
  versionIndex:{color:colors.accent,fontSize:10,lineHeight:14,fontWeight:'700'},
  versionName:{color:colors.text,fontSize:15,lineHeight:21,fontWeight:'700'},
  row:{paddingVertical:11,gap:8},
  rowBorder:{borderBottomWidth:1,borderBottomColor:colors.border},
  rowLabel:{paddingHorizontal:11,color:colors.muted,fontSize:10,lineHeight:15,fontWeight:'700',letterSpacing:0.4,textTransform:'uppercase'},
  valueCell:{flex:1,minWidth:0,paddingHorizontal:11,borderRightWidth:1,borderRightColor:colors.border},
  valueGroup:{gap:4},
  ingredientName:{color:colors.text,fontSize:12,lineHeight:18,fontWeight:'600'},
  amount:{color:colors.secondary,fontSize:13,lineHeight:19,fontWeight:'700'},
  unit:{color:colors.muted,fontSize:10,lineHeight:15},
  value:{color:colors.secondary,fontSize:12,lineHeight:19},
  missing:{color:colors.muted,fontSize:11,lineHeight:17,fontStyle:'italic'},
  scrollHint:{color:colors.accent,fontSize:11,lineHeight:17,fontWeight:'600'},
});
