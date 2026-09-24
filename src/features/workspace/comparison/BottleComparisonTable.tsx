import React from 'react';
import {Pressable,ScrollView,StyleSheet,Text,useWindowDimensions,View} from 'react-native';
import type {Bottle} from '../../../domain/bottles/types';
import {bottleDisplayName} from '../../../domain/bottles/format';
import type {Locale} from '../../../domain/contracts';
import {bottleFamilyName,bottleProfileLabel} from '../../../i18n/bottle-categories';
import {bottleComparisonText} from '../../../i18n/bottle-comparison';
import {p02BottleText} from '../../../i18n/p02-bottles';
import {bottleMarketSummary} from '../../../i18n/bottle-market';
import {workText} from '../../../i18n/workspace';
import {colors,radii} from '../../../theme/tokens';
import {BottlePhoto} from '../BottlePhoto';

type Props={
  selected:Bottle[];
  locale:Locale;
  disabled?:boolean;
  onRemove:(id:string)=>void;
};

export function BottleComparisonTable({selected,locale,disabled=false,onRemove}:Props){
  const {width,fontScale}=useWindowDimensions();
  const wide=width>=720;
  const needsHorizontalScroll=selected.length>=2&&(width<360||fontScale>1.25);
  const c=(key:Parameters<typeof bottleComparisonText>[1])=>bottleComparisonText(locale,key);
  const w=(key:Parameters<typeof workText>[1])=>workText(locale,key);
  const tableMinWidth=needsHorizontalScroll?(selected.length===3?420:320):undefined;

  return <View style={styles.root}>
    {needsHorizontalScroll&&selected.length>=2&&<Text style={styles.scrollHint}>↔ {c('scrollHint')}</Text>}
    <ScrollView
      accessibilityLabel={c('tableLabel')}
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={needsHorizontalScroll}
      style={styles.scroller}
      contentContainerStyle={[styles.table,tableMinWidth?{width:tableMinWidth,minWidth:'100%'}:{width:'100%'}]}
    >
      <View style={styles.columns}>
        {selected.map((bottle,index)=><View key={bottle.id} style={[styles.headerCell,index===selected.length-1&&styles.lastCell,wide&&styles.headerCellWide,selected.length===1&&styles.singleHeader]}>
          <View style={styles.headerTop}>
            <Text style={styles.columnNumber}>{index+1}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${c('remove')} ${bottleDisplayName(bottle,locale)}`}
              accessibilityState={{disabled}}
              disabled={disabled}
              hitSlop={8}
              onPress={()=>onRemove(bottle.id)}
              style={({pressed})=>[styles.remove,disabled&&styles.disabled,pressed&&styles.pressed]}
            ><Text style={styles.removeText}>×</Text></Pressable>
          </View>
          <View style={styles.photo}><BottlePhoto bottle={bottle} locale={locale} size={wide?'compare':'chooser'}/></View>
          <Text style={styles.brand}>{bottle.brandName}</Text>
          <Text style={[styles.name,wide&&styles.nameWide]}>{bottleDisplayName(bottle,locale)}</Text>
          {bottleDisplayName(bottle,locale)!==bottleDisplayName(bottle)&&<Text style={styles.originalName}>{p02BottleText(locale,'originalName')}: {bottleDisplayName(bottle)}</Text>}
        </View>)}
      </View>
      {selected.length>=2&&<>
        <ComparisonRow label={w('abv')} selected={selected}>{bottle=><Text style={styles.valueStrong}>{bottle.abv===null?w('unknown'):`${bottle.abv}%`}</Text>}</ComparisonRow>
        <ComparisonRow label={c('family')} selected={selected}>{bottle=><Text style={styles.valueStrong}>{bottleFamilyName(bottle.family,locale)}</Text>}</ComparisonRow>
        <ComparisonRow label={c('profile')} selected={selected}>{bottle=><View style={styles.valueGroup}><Text style={styles.provenance}>{bottleProfileLabel(bottle.profileBasis,locale)}</Text><Text style={styles.value}>{bottle.profile[locale]}</Text></View>}</ComparisonRow>
        <ComparisonRow label={w('market')} selected={selected}>{bottle=><Text style={styles.value}>{/unspecified|not specified/i.test(bottle.market)?w('marketUnspecified'):bottleMarketSummary(bottle,locale)}</Text>}</ComparisonRow>
      </>}
    </ScrollView>
    {selected.length>=2&&<Text style={styles.scope}>{w('abvScope')}</Text>}
  </View>;
}

function ComparisonRow({label,selected,children,last=false}:{label:string;selected:Bottle[];children:(bottle:Bottle)=>React.ReactNode;last?:boolean}){
  return <View style={[styles.row,!last&&styles.rowBorder]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={styles.columns}>{selected.map((bottle,index)=><View key={bottle.id} style={[styles.valueCell,index===selected.length-1&&styles.lastCell]}>{children(bottle)}</View>)}</View>
  </View>;
}

const styles=StyleSheet.create({
  root:{gap:10},
  scroller:{width:'100%',maxWidth:'100%'},
  table:{flexGrow:1,flexDirection:'column',borderWidth:1,borderColor:colors.border,borderRadius:radii.small,overflow:'hidden',backgroundColor:'rgba(16,23,20,0.72)'},
  columns:{flexDirection:'row',alignItems:'stretch'},
  headerCell:{flex:1,minWidth:0,padding:8,gap:7,borderRightWidth:1,borderRightColor:colors.border},
  headerCellWide:{padding:12,gap:9},
  singleHeader:{maxWidth:320},
  headerTop:{minHeight:28,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  columnNumber:{color:colors.accent,fontSize:10,lineHeight:14,fontWeight:'700'},
  remove:{width:28,height:28,borderRadius:14,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center',backgroundColor:colors.raised},
  removeText:{color:colors.accent,fontSize:18,lineHeight:20},
  disabled:{opacity:0.4},pressed:{opacity:0.7},
  photo:{alignItems:'center',width:'100%'},
  brand:{color:colors.accent,fontSize:9,lineHeight:13,fontWeight:'700',letterSpacing:0.7,textTransform:'uppercase'},
  name:{color:colors.text,fontSize:13,lineHeight:18,fontWeight:'700'},
  nameWide:{fontSize:17,lineHeight:23},
  originalName:{color:colors.muted,fontSize:9,lineHeight:13},
  row:{paddingVertical:10,gap:7},
  rowBorder:{borderBottomWidth:1,borderBottomColor:colors.border},
  rowLabel:{paddingHorizontal:9,color:colors.muted,fontSize:10,lineHeight:15,fontWeight:'700',letterSpacing:0.5,textTransform:'uppercase'},
  valueCell:{flex:1,minWidth:0,paddingHorizontal:8,borderRightWidth:1,borderRightColor:colors.border},
  lastCell:{borderRightWidth:0},
  valueGroup:{gap:5},
  provenance:{color:colors.muted,fontSize:9,lineHeight:13,fontWeight:'600'},
  value:{color:colors.secondary,fontSize:11,lineHeight:17},
  valueStrong:{color:colors.text,fontSize:12,lineHeight:18,fontWeight:'700'},
  sourceLink:{alignSelf:'stretch',minHeight:40,justifyContent:'center'},
  sourceLinkText:{color:colors.accent,fontSize:11,lineHeight:16,fontWeight:'600'},
  checked:{color:colors.muted,fontSize:9,lineHeight:13},
  scope:{color:colors.muted,fontSize:11,lineHeight:17},
  scrollHint:{color:colors.accent,fontSize:11,lineHeight:17,fontWeight:'600'},
});
