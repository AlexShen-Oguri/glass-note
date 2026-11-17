import React,{useEffect,useMemo,useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import type {Locale,SearchQuery} from '../../domain/contracts';
import {catalogue} from '../../content/catalogue';
import {DISCOVERY_MODEL_REVISION,recommendDiscovery,type DiscoveryRecommendation,type DiscoveryRecommendations} from '../../domain/taste';
import {discoveryQueryFingerprint} from '../../domain/discovery/pagination';
import {discoverySessionStore,type DiscoverySession} from '../../platform/discoverySession';
import {useTaste} from '../../platform/TasteProvider';
import {recommendationText as copy} from '../../i18n/recommendations';
import {colors} from '../../theme/tokens';
import {Heading} from '../navigation/Heading';

function recommendations(query:SearchQuery,locale:Locale,state:ReturnType<typeof useTaste>['savedState'],session:DiscoverySession):DiscoveryRecommendations{
  return recommendDiscovery(catalogue,{...query,locale},state,{seed:`${DISCOVERY_MODEL_REVISION}:${session.seed}:${session.round}`,excludeExplorationCocktailIds:session.excludedExplorationCocktailIds});
}

export function PersonalDiscovery({query,locale,columns,gap,renderCard}:{query:SearchQuery;locale:Locale;columns:number;gap:number;renderCard:(item:DiscoveryRecommendation,index:number)=>React.ReactNode}){
  const taste=useTaste();
  const [session,setSession]=useState(()=>discoverySessionStore.read());
  const [exhausted,setExhausted]=useState(false);
  const fingerprint=discoveryQueryFingerprint(query,locale);
  const result=useMemo(()=>{if(!taste.hydrated)return null;try{return recommendations(query,locale,taste.savedState,session);}catch{return null;}},[fingerprint,taste.hydrated,taste.savedState,session]);
  useEffect(()=>setExhausted(false),[fingerprint,taste.savedState]);
  const cold=!result||result.diagnostics.trainingObservationCount===0;
  const exploration=result?.items.find(item=>item.kind==='explore');
  const available=Boolean(result&&result.status!=='unavailable');
  const nextExploration=()=>{
    if(!exploration||exhausted)return;
    const current=discoverySessionStore.read();
    const preview={...current,round:current.round+1,excludedExplorationCocktailIds:[exploration.cocktailId]};
    try{
      const next=recommendations(query,locale,taste.savedState,preview);
      if(!next.items.some(item=>item.kind==='explore'&&item.cocktailId!==exploration.cocktailId)){setExhausted(true);return;}
      setSession(discoverySessionStore.advance(exploration.cocktailId));
    }catch{setExhausted(true);}
  };
  const rows=result?.items.reduce<DiscoveryRecommendation[][]>((all,item,index)=>{if(index%columns===0)all.push([]);all.at(-1)!.push(item);return all;},[])??[];
  return <View testID="discovery-recommendations" style={s.section}>
    <View style={s.header}>
      <View style={s.titleBlock}><Heading level={2} style={s.title}>{copy(locale,cold?'coldTitle':'forYou')}</Heading>
        {available?<Text style={s.hint}>{copy(locale,cold?'coldHint':exploration&&result!.items.length===6?'personalizedHint':'limitedHint')}</Text>:null}
      </View>
      {exploration?<Pressable accessibilityRole="button" accessibilityState={{disabled:exhausted}} disabled={exhausted} onPress={nextExploration} style={({pressed})=>[s.action,exhausted&&s.disabled,pressed&&s.pressed]}><Text style={s.actionText}>{copy(locale,'exploreAnother')}</Text></Pressable>:null}
    </View>
    {!taste.hydrated&&!taste.error?<Text style={s.hint}>{copy(locale,'loading')}</Text>:null}
    {taste.error?<View style={s.notice}><Text accessibilityRole="alert" style={s.hint}>{copy(locale,taste.error==='read'?'readError':'writeError')}</Text><Pressable accessibilityRole="button" disabled={taste.saving} onPress={()=>void taste.retry()} style={({pressed})=>[s.action,pressed&&s.pressed]}><Text style={s.actionText}>{copy(locale,taste.saving?'retrying':'retry')}</Text></Pressable></View>:null}
    {taste.hydrated&&!available?<Text style={s.hint}>{copy(locale,'unavailable')}</Text>:null}
    {exhausted?<Text accessibilityLiveRegion="polite" style={s.hint}>{copy(locale,'noMoreExploration')}</Text>:null}
    {result&&result.diagnostics.omittedTrainingRecipeCount>0?<Text style={s.hint}>{copy(locale,'trainingBudget',{count:result.diagnostics.trainingRecipeCount})}</Text>:null}
    {rows.map((row,rowIndex)=><View key={row[0]!.cocktailId} style={[s.row,{gap}]}>{row.map((item,column)=><View key={item.cocktailId} testID={`recommendation-${item.kind}`} style={s.cell}>{renderCard(item,rowIndex*columns+column)}</View>)}{Array.from({length:columns-row.length},(_,i)=><View key={`space-${i}`} style={s.cell}/>)}</View>)}
  </View>;
}

const s=StyleSheet.create({
  section:{paddingTop:26,paddingBottom:32,gap:20,borderTopWidth:1,borderBottomWidth:1,borderColor:colors.border,marginTop:28,marginBottom:18},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16},
  titleBlock:{flexGrow:1,flexShrink:1,minWidth:0,gap:8},
  title:{fontSize:27,lineHeight:35,fontWeight:'400',color:colors.text},
  hint:{fontSize:13,lineHeight:21,color:colors.secondary,flexShrink:1},
  row:{flexDirection:'row',alignItems:'flex-start'},cell:{flex:1,minWidth:0},
  notice:{gap:10,alignItems:'flex-start'},
  action:{minHeight:44,paddingHorizontal:15,paddingVertical:11,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},
  actionText:{fontSize:12,lineHeight:20,color:colors.accent,textAlign:'center'},
  pressed:{opacity:.7},disabled:{opacity:.42},
});
