import React from 'react';
import {ScrollView,StyleSheet,Text,useWindowDimensions,View} from 'react-native';
import type {Bottle} from '../../../domain/bottles/types';
import {bottleDisplayName} from '../../../domain/bottles/format';
import type {Locale,MeasureUnit,UnitPreference} from '../../../domain/contracts';
import type {BottleComparisonRecipePreview as RecipePreview} from '../../../domain/lab/bottleComparison';
import type {LabIngredient} from '../../../domain/lab/types';
import {formatAmount} from '../../../domain/search';
import {p02BottleText} from '../../../i18n/p02-bottles';
import {round17ComparisonText} from '../../../i18n/round17-comparison';
import {colors,radii} from '../../../theme/tokens';
import {ws} from '../ui';

function amountLabel(ingredient:LabIngredient,unit:UnitPreference):string {
  const value=ingredient.amount.trim()===''?null:Number(ingredient.amount);
  if(value===null||!Number.isFinite(value))return [ingredient.amount,ingredient.unit].filter(Boolean).join(' ');
  const knownUnits:readonly MeasureUnit[]=['ml','oz','g','tsp','tbsp','pinch','bunch','barspoon','dash','drop','spray','piece','top','part'];
  if(!knownUnits.includes(ingredient.unit as MeasureUnit))return `${ingredient.amount} ${ingredient.unit}`;
  const displayed=formatAmount(value,ingredient.unit as MeasureUnit,unit);
  return `${displayed.amount} ${displayed.unit}`;
}

export function BottleComparisonRecipePreview({preview,selected,locale,unit}:{
  preview:RecipePreview;
  selected:Bottle[];
  locale:Locale;
  unit:UnitPreference;
}){
  const p=(key:Parameters<typeof round17ComparisonText>[1])=>round17ComparisonText(locale,key);
  const {width}=useWindowDimensions();
  const columnWidth=width>=700?220:148;
  const columns=[
    {key:'source',title:p('sourceColumn'),subtitle:'',ingredients:preview.source.ingredients,source:true},
    ...preview.versions.map(version=>{
      const bottle=selected.find(item=>item.id===version.bottleId);
      return {key:version.bottleId,title:bottle?bottleDisplayName(bottle,locale):version.name,subtitle:bottle&&bottleDisplayName(bottle,locale)!==version.name?`${p02BottleText(locale,'originalName')}: ${version.name}`:'',ingredients:version.ingredients,source:false};
    }),
  ];
  return <View style={styles.wrap}>
    <Text style={ws.muted}>{p('scrollHint')}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.tableScroll} accessibilityLabel={p('ingredients')}>
      <View style={styles.table}>
        <View style={styles.tableRow}>{columns.map(column=><View key={column.key} style={[styles.headerCell,{width:columnWidth},column.source&&styles.sourceColumn]}>
          <Text style={styles.columnTitle}>{column.title}</Text>
          {!!column.subtitle&&<Text style={ws.muted}>{column.subtitle}</Text>}
        </View>)}</View>
        {preview.source.ingredients.map((_,row)=><View key={`row-${row}`} style={styles.tableRow}>{columns.map(column=>{
          const ingredient=column.ingredients[row]!;
          const changed=!column.source&&row===preview.targetIngredientIndex;
          const selectedSource=column.source&&row===preview.targetIngredientIndex;
          const bottle=changed?selected.find(item=>item.id===column.key):undefined;
          const name=bottle?bottleDisplayName(bottle,locale):ingredient.name;
          return <View key={column.key} style={[styles.cell,{width:columnWidth},column.source&&styles.sourceColumn,(changed||selectedSource)&&styles.changedRow]}>
            <Text style={styles.amount}>{amountLabel(ingredient,unit)}</Text>
            <Text style={styles.ingredient}>{name}</Text>
            <Text style={[ws.muted,changed&&styles.changedText]}>{changed?p('changedRow'):p('unchangedRow')}</Text>
          </View>;
        })}</View>)}
      </View>
    </ScrollView>
    <View style={styles.method}>
      <Text style={styles.columnTitle}>{p('methodTitle')}</Text>
      <Text style={ws.muted}>{p('methodBody')}</Text>
      <Text style={styles.methodText}>{preview.source.method}</Text>
    </View>
  </View>;
}

const styles=StyleSheet.create({
  wrap:{gap:10},
  tableScroll:{paddingBottom:8},
  table:{gap:8},
  tableRow:{flexDirection:'row',alignItems:'stretch',gap:8},
  headerCell:{minHeight:72,gap:4,padding:10,borderRadius:radii.small,borderWidth:1,borderColor:colors.border,backgroundColor:colors.raised},
  cell:{minHeight:82,gap:3,padding:10,borderRadius:radii.small,borderWidth:1,borderColor:colors.border,backgroundColor:colors.raised,justifyContent:'center'},
  sourceColumn:{backgroundColor:colors.background},
  columnTitle:{fontSize:13,lineHeight:20,fontWeight:'700',color:colors.text},
  changedRow:{borderColor:colors.amber,backgroundColor:'rgba(212,173,115,0.08)'},
  changedText:{color:colors.amber,fontWeight:'600'},
  amount:{fontSize:12,lineHeight:18,fontWeight:'700',color:colors.accent},
  ingredient:{fontSize:13,lineHeight:20,color:colors.text},
  method:{gap:7,padding:12,borderRadius:radii.small,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background},
  methodText:{fontSize:13,lineHeight:21,color:colors.secondary},
  sourceLink:{minHeight:44,justifyContent:'center',alignSelf:'flex-start'},
  sourceText:{fontSize:12,lineHeight:18,fontWeight:'600',color:colors.accent,textDecorationLine:'underline'},
});
