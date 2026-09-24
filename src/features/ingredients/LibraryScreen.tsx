import {CocktailOriginalName} from '../names/OriginalName';
import React, {useMemo, useState} from 'react';
import {FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {router} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {catalogue} from '../../content/catalogue';
import {INGREDIENT_GROUPS, filterIngredientEntries, ingredientEntries, pantryMatches, type IngredientGroup, type PantryMatch} from '../../domain/ingredients';
import {lib} from '../../i18n/library';
import {guideText, ingredientUseNote} from '../../i18n/ingredientGuide';
import {t} from '../../i18n/ui';
import {useApp} from '../../platform/AppProvider';
import {usePantry} from '../../platform/PantryProvider';
import {media} from '../../media';
import {colors} from '../../theme/tokens';
import {BrandToolbar, PhotoFrame, serif, useViewport} from '../discovery/components';
import {IngredientPicture} from './IngredientPicture';
import {LibraryLinks} from '../navigation/LibraryLinks';
import {bottles} from '../../content/bottles';
import {labText} from '../../i18n/lab';
import {persistenceText} from '../../i18n/local-persistence';
import {Fold} from '../workspace/ui';

const entries = ingredientEntries(catalogue);
const availableGroups = INGREDIENT_GROUPS.filter(group=>entries.some(entry=>entry.group===group));
type Shelf = 'ready' | 'one' | 'two' | 'check' | 'preparationCheck';
const shelfFor = (match: PantryMatch): Shelf => match.missingIngredientIds.length === 2 ? 'two' : match.missingIngredientIds.length === 1 ? 'one' : match.preparationNeedsReview ? 'preparationCheck' : match.unconfirmedBrands.length ? 'check' : 'ready';

export default function LibraryScreen({mode = 'library', ingredientId}: {mode?: 'library' | 'pantry'; ingredientId?: string}) {
  const app = useApp();
  const {locale} = app;
  const {pantry, hydrated, storageAvailable, error, toggleIngredient, toggleBrand, retry} = usePantry();
  const {width} = useViewport();
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<IngredientGroup>();
  const [shelf, setShelf] = useState<Shelf | 'all'>('all');
  const [limit, setLimit] = useState(24);
  const [onlyOwned, setOnlyOwned] = useState(false);
  const [onlyLinked, setOnlyLinked] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const entry = entries.find(e => e.ingredient.id === ingredientId);
  const filtered = useMemo(() => {
    const result = filterIngredientEntries(entries, catalogue, search, locale, group).filter(e => (!onlyOwned || pantry.ingredientIds.includes(e.ingredient.id)) && (!onlyLinked || e.cocktailIds.length > 0));
    // Start with familiar bar materials; the full independent directory remains searchable.
    return search.trim() ? result : result.sort((a,b) => b.cocktailIds.length-a.cocktailIds.length);
  }, [search,locale,group,onlyOwned,onlyLinked,pantry.ingredientIds]);
  const matches = useMemo(() => pantryMatches(catalogue, pantry), [pantry]);
  const visibleMatches = matches.filter(m => shelf === 'all' || shelfFor(m) === shelf);
  const name = (id: string) => catalogue.ingredients.find(i => i.id === id)?.name[locale] ?? id;
  const owned = (id: string) => pantry.ingredientIds.includes(id);
  const ingredientPath = (id: string) => router.push({pathname: '/ingredients/[id]', params: {id}} as never);
  const detail = Boolean(ingredientId);
  const columns = width >= 980 ? 3 : width >= 650 ? 2 : 1;
  const openRecipe = (cocktailId: string, versionId: string) => router.push({pathname:'/cocktails/[id]',params:{id:cocktailId,version:versionId,from:'ingredients'}} as never);
  const retryStorage = async () => {
    if (retrying) return;
    setRetrying(true);
    try { await retry(); } finally { setRetrying(false); }
  };

  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <BrandToolbar {...app} />
        <View style={styles.navigation}>
          <Pressable accessibilityRole="link" onPress={() => router.push('/discover' as never)} style={styles.nav}><Text style={styles.subtle}>← {lib(locale,'browse')}</Text></Pressable>
          <Pressable accessibilityRole="link" onPress={() => router.push((mode === 'pantry' ? '/ingredients' : '/pantry') as never)} style={styles.destination}><Text style={styles.destinationText}>{lib(locale,mode === 'pantry' ? 'library' : 'pantry')} · {mode === 'pantry' ? entries.length : hydrated ? pantry.ingredientIds.length : '—'} ↗</Text></Pressable>
        </View>
        {!storageAvailable && <View accessibilityRole="alert" style={styles.warningPanel}>
          <Text style={styles.warningTitle}>{persistenceText(locale, error === 'read' ? 'readTitle' : 'writeTitle')}</Text>
          <Text style={styles.warning}>{persistenceText(locale, error === 'read' ? 'pantryRead' : 'pantryWrite')}</Text>
          <Pressable accessibilityRole="button" disabled={retrying} onPress={() => void retryStorage()} style={styles.retry}><Text style={styles.retryText}>{persistenceText(locale, retrying ? 'retrying' : 'retry')}</Text></Pressable>
        </View>}
        {detail && entry ? <>
          <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/ingredients' as never)} style={styles.nav}><Text style={styles.subtle}>← {lib(locale,'back')}</Text></Pressable>
          <View style={styles.detailHero}><IngredientPicture ingredient={entry.ingredient} size={width < 500 ? 100 : 132}/><View style={styles.flex}><Text style={styles.eyebrow}>{lib(locale,entry.group)}</Text>
            <Text accessibilityRole="header" style={styles.title}>{entry.ingredient.name[locale]}</Text>
            {locale !== 'en' && <Text style={styles.subtitle}>{entry.ingredient.name.en}</Text>}
          </View></View>
          {entry.ingredient.guide?.nameOrigin?.[locale] === 'fallback' && <Text style={styles.note}>{guideText(locale,'fallback')}</Text>}
          {entry.ingredient.guide?.nameOrigin?.[locale] === 'draft' && <Text style={styles.note}>{guideText(locale,'draft')}</Text>}
          <Pressable accessibilityRole="checkbox" accessibilityState={{checked:owned(entry.ingredient.id)}} onPress={() => toggleIngredient(entry.ingredient.id)} style={[styles.primary,owned(entry.ingredient.id)&&styles.ownedButton]}><Text style={styles.primaryText}>{owned(entry.ingredient.id) ? '✓ ' : '+ '}{lib(locale,owned(entry.ingredient.id)?'owned':'add')}</Text></Pressable>
          <View style={styles.guidePanel}><Text style={styles.sectionTitle}>{guideText(locale,'guide')}</Text><Text style={styles.body}>{ingredientUseNote(entry.ingredient,locale)}</Text><Text style={styles.note}>{guideText(locale,'matching')}</Text></View>
          <View style={styles.section}><Text style={styles.sectionTitle}>{guideText(locale,'identity')}</Text>
            <Text style={styles.note}>{guideText(locale,'original')}</Text><Text style={styles.body}>{entry.ingredient.guide?.source?.canonicalName ?? entry.ingredient.name.en}</Text>
            {Boolean(entry.ingredient.guide?.parents.length) && <><Text style={styles.note}>{guideText(locale,'parent')}</Text><Text style={styles.body}>{entry.ingredient.guide!.parents.join(' · ')}</Text></>}
            {Boolean(entry.ingredient.guide?.aliases.length) && <><Text style={styles.note}>{guideText(locale,'aliases')}</Text><Text style={styles.body}>{entry.ingredient.guide!.aliases.slice(0,18).join(' · ')}</Text></>}
          </View>
          {entry.brandIds.length > 0 && <View style={styles.section}>
            {bottles.some(b=>b.ingredientIds.includes(entry.ingredient.id))&&<Pressable accessibilityRole="link" onPress={()=>router.push({pathname:'/bottles' as never,params:{ingredient:entry.ingredient.id}})} style={styles.destination}><Text style={styles.destinationText}>{labText(locale,'bottles')} · {bottles.filter(b=>b.ingredientIds.includes(entry.ingredient.id)).length} ↗</Text></Pressable>}
            <Fold title={`${lib(locale,'brands')} · ${entry.brandIds.length}`}><Text style={styles.note}>{lib(locale,'brandHint')}</Text>
            <View style={styles.chips}>{entry.brandIds.map(id => {
              const brand = catalogue.brands.find(b => b.id === id);
              const selected = pantry.brandsByIngredient[entry.ingredient.id]?.includes(id) ?? false;
              return brand ? <Pressable key={id} accessibilityRole="checkbox" accessibilityState={{checked:selected}} onPress={() => toggleBrand(entry.ingredient.id,id)} style={[styles.chip,selected&&styles.chipActive]}><Text style={styles.chipText}>{selected ? '✓ ' : '+ '}{brand.name}</Text></Pressable> : null;
            })}</View></Fold>
          </View>}
          <View style={styles.section}><Text accessibilityRole="header" style={styles.sectionTitle}>{lib(locale,'usedIn')} · {entry.cocktailIds.length}</Text>
            {!entry.cocktailIds.length && <Text style={styles.body}>{guideText(locale,'noRecipes')}</Text>}
            {entry.cocktailIds.map(id => {
              const cocktail = catalogue.cocktails.find(c => c.id === id)!;
              const version = entry.versions.find(v => v.id === cocktail.defaultVersionId) ?? entry.versions.find(v => v.cocktailId === id)!;
              return <Pressable key={id} accessibilityRole="button" onPress={() => openRecipe(id,version.id)} style={styles.recipeRow}><View style={styles.flex}><Text style={styles.rowName}>{cocktail.name[locale]}</Text><CocktailOriginalName cocktail={cocktail} locale={locale} /></View><Text style={styles.link}>↗</Text></Pressable>;
            })}
          </View>
        </> : detail ? <Text style={styles.note}>{lib(locale,'noResults')}</Text> : <>
          <Text style={styles.eyebrow}>GLASS NOTES / {mode === 'pantry' ? '02' : '01'}</Text>
          <Text accessibilityRole="header" style={styles.title}>{lib(locale,mode)}</Text>
          <Text style={styles.subtitle}>{mode === 'library' ? guideText(locale,'intro') : lib(locale,'intro')}</Text>
          {mode === 'library' ? <>
            <TextInput value={search} onChangeText={v => {setSearch(v);setLimit(24);}} placeholder={lib(locale,'search')} accessibilityLabel={lib(locale,'search')} placeholderTextColor={colors.muted} style={styles.search} clearButtonMode="while-editing" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              <Pressable accessibilityRole="button" accessibilityState={{selected:!group}} onPress={() => {setGroup(undefined);setLimit(24);}} style={[styles.chip,!group&&styles.chipActive]}><Text style={styles.chipText}>{lib(locale,'all')}</Text></Pressable>
              {availableGroups.map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{selected:group===value}} onPress={() => {setGroup(value);setLimit(24);}} style={[styles.chip,group===value&&styles.chipActive]}><Text style={styles.chipText}>{lib(locale,value)}</Text></Pressable>)}
            </ScrollView>
            <View style={styles.listMeta}><Text style={styles.resultCount}>{filtered.length} <Text style={styles.note}>/ {entries.length}</Text></Text><View style={styles.chips}><Pressable accessibilityRole="checkbox" accessibilityState={{checked:onlyLinked}} onPress={() => {setOnlyLinked(!onlyLinked);setLimit(24);}} style={[styles.chip,onlyLinked&&styles.chipActive]}><Text style={styles.chipText}>{onlyLinked ? '✓ ' : ''}{guideText(locale,'barOnly')}</Text></Pressable><Pressable accessibilityRole="checkbox" accessibilityState={{checked:onlyOwned}} onPress={() => {setOnlyOwned(!onlyOwned);setLimit(24);}} style={[styles.chip,onlyOwned&&styles.chipActive]}><Text style={styles.chipText}>{onlyOwned ? '✓ ' : ''}{lib(locale,'owned')}</Text></Pressable></View></View>
            <View style={styles.grid}>{filtered.slice(0,limit).map(e => <View key={e.ingredient.id} style={[styles.ingredient,{width:columns===3?'32%':columns===2?'49%':'100%'}]}>
              <Pressable accessibilityRole="button" onPress={() => ingredientPath(e.ingredient.id)} style={styles.ingredientInfo}><IngredientPicture ingredient={e.ingredient}/><View style={styles.flex}><Text style={styles.eyebrow}>{lib(locale,e.group)}</Text><Text style={styles.rowName}>{e.ingredient.name[locale]}</Text><Text style={styles.note}>{e.cocktailIds.length ? `${guideText(locale,'barOnly')} · ${e.cocktailIds.length}` : guideText(locale,'learn')} ↗</Text></View></Pressable>
              <Pressable accessibilityRole="checkbox" accessibilityLabel={`${lib(locale,owned(e.ingredient.id)?'owned':'add')}: ${e.ingredient.name[locale]}`} accessibilityState={{checked:owned(e.ingredient.id)}} onPress={() => toggleIngredient(e.ingredient.id)} style={[styles.addButton,owned(e.ingredient.id)&&styles.added]}><Text style={styles.addText}>{owned(e.ingredient.id)?'✓':'+'}</Text></Pressable>
            </View>)}</View>
            {!filtered.length&&<Text style={styles.empty}>{lib(locale,'noResults')}</Text>}
            {filtered.length>limit&&<Pressable accessibilityRole="button" onPress={() => setLimit(limit+24)} style={styles.more}><Text style={styles.link}>{lib(locale,'more')} ↓</Text></Pressable>}
          </> : !hydrated ? storageAvailable ? <Text style={styles.note}>{persistenceText(locale,'pantryLoading')}</Text> : null : <>
            <Text style={styles.note}>{pantry.ingredientIds.length} · {lib(locale,'owned')}</Text>
            <Pressable accessibilityRole="link" onPress={() => router.push('/ingredients' as never)} style={styles.primary}><Text style={styles.primaryText}>{lib(locale,'manage')} ↗</Text></Pressable>
            {pantry.ingredientIds.length ? <>
              <FlatList horizontal data={pantry.ingredientIds} keyExtractor={id=>id} initialNumToRender={12} maxToRenderPerBatch={12} windowSize={3} style={styles.ownedStrip} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} renderItem={({item:id})=><Pressable accessibilityRole="button" onPress={() => ingredientPath(id)} style={styles.ownedTile}><IngredientPicture ingredient={entries.find(e=>e.ingredient.id===id)!.ingredient} size={44}/><Text style={styles.chipText}>{name(id)} ↗</Text></Pressable>}/>
              <Text style={styles.note}>{lib(locale,'matchingNote')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{(['all','ready','one','two','check','preparationCheck'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{selected:shelf===value}} onPress={() => {setShelf(value);setLimit(24);}} style={[styles.chip,shelf===value&&styles.chipActive]}><Text style={styles.chipText}>{lib(locale,value)} · {matches.filter(m=>value==='all'||shelfFor(m)===value).length}</Text></Pressable>)}</ScrollView>
              <View style={styles.grid}>{visibleMatches.slice(0,limit).map(m => {
                const cocktail=catalogue.cocktails.find(c=>c.id===m.cocktailId)!;
                return <Pressable key={m.cocktailId} accessibilityRole="button" onPress={() => openRecipe(m.cocktailId,m.versionId)} style={[styles.cocktailCard,{width:columns===3?'32%':columns===2?'49%':'100%'}]}>
                  <PhotoFrame asset={media[m.cocktailId]} accent={cocktail.accent} locale={locale} height={220} preserveAspect borderRadius={15}/>
                  <View style={styles.cardCopy}><Text style={styles.eyebrow}>{lib(locale,shelfFor(m))}</Text><Text style={styles.rowName}>{cocktail.name[locale]}</Text><CocktailOriginalName cocktail={cocktail} locale={locale} />
                    {m.missingIngredientIds.length>0&&<Text style={styles.missing}>{lib(locale,'missing')}: {m.missingIngredientIds.map(name).join(' · ')}</Text>}
                    {m.unconfirmedBrands.length>0&&<Text style={styles.missing}>{lib(locale,'check')}: {m.unconfirmedBrands.map(b=>catalogue.brands.find(x=>x.id===b.brandId)?.name??b.brandId).join(' · ')}</Text>}
                    {m.preparationNeedsReview&&<Text style={styles.missing}>{lib(locale,'preparationHint')}</Text>}
                    {m.preparationStatus==='unreviewed'&&<Text style={styles.note}>{lib(locale,'unaudited')}</Text>}
                    {m.optionalMissingIngredientIds.length>0&&<Text style={styles.note}>{lib(locale,'optional')}: {m.optionalMissingIngredientIds.map(name).join(' · ')}</Text>}
                    <Text style={styles.link}>{t(locale,'viewRecipe')} ↗</Text>
                  </View>
                </Pressable>;
              })}</View>
              {!visibleMatches.length&&<Text style={styles.empty}>{lib(locale,'noResults')}</Text>}
              {visibleMatches.length>limit&&<Pressable accessibilityRole="button" onPress={()=>setLimit(limit+24)} style={styles.more}><Text style={styles.link}>{lib(locale,'more')} ↓</Text></Pressable>}
            </> : <View style={styles.emptyPanel}><Text style={styles.emptyMark}>＋</Text><Text style={styles.subtitle}>{lib(locale,'empty')}</Text></View>}
          </>}
        </>}
        {hydrated&&<Text style={styles.storage}>{lib(locale,storageAvailable?'saved':'unsaved')}</Text>}
        <LibraryLinks locale={locale} pantryCount={pantry.ingredientIds.length}/>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles=StyleSheet.create({
  ownedStrip:{height:106,flexGrow:0},
  screen:{flex:1,backgroundColor:'transparent'},scroll:{paddingHorizontal:22,paddingBottom:48},container:{width:'100%',maxWidth:1140,alignSelf:'center'},
  navigation:{flexDirection:'row',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginVertical:20},nav:{minHeight:44,justifyContent:'center'},subtle:{color:colors.secondary,fontSize:13},link:{color:colors.accent,fontSize:13,lineHeight:20},
  destination:{minHeight:46,justifyContent:'center',paddingHorizontal:18,borderRadius:25,backgroundColor:colors.raised,borderWidth:1,borderColor:colors.accentDark},destinationText:{fontSize:14,fontWeight:'600',color:colors.accent},
  detailHero:{flexDirection:'row',alignItems:'center',gap:22,marginVertical:16},guidePanel:{backgroundColor:colors.panel,borderWidth:1,borderColor:colors.border,borderRadius:20,padding:23,marginTop:18,gap:12},body:{fontSize:15,lineHeight:26,color:colors.secondary,marginBottom:12},resultCount:{fontSize:23,fontFamily:serif,color:colors.text},ownedTile:{flexDirection:'row',gap:10,alignItems:'center',padding:10,paddingRight:16,borderWidth:1,borderColor:colors.border,borderRadius:18},
  eyebrow:{fontSize:10,letterSpacing:1.5,color:colors.muted,marginBottom:9},title:{fontFamily:serif,fontSize:38,lineHeight:49,color:colors.text,marginBottom:8},subtitle:{fontSize:16,lineHeight:26,color:colors.secondary,marginBottom:20},note:{fontSize:12,lineHeight:20,color:colors.muted},
  primary:{alignSelf:'flex-start',backgroundColor:colors.accent,paddingVertical:14,paddingHorizontal:22,borderRadius:30,marginVertical:12},ownedButton:{backgroundColor:'#d1dccc'},primaryText:{fontSize:14,color:colors.background,fontWeight:'600'},
  search:{minHeight:54,borderWidth:1,borderColor:colors.border,borderRadius:16,paddingHorizontal:18,fontSize:15,color:colors.text,backgroundColor:colors.panel,marginTop:4},
  filters:{gap:8,paddingVertical:18},chips:{flexDirection:'row',flexWrap:'wrap',gap:9,marginTop:15},chip:{minHeight:44,paddingHorizontal:15,paddingVertical:12,borderWidth:1,borderColor:colors.border,borderRadius:24,justifyContent:'center'},chipActive:{backgroundColor:colors.raised,borderColor:colors.accent},chipText:{fontSize:13,color:colors.text},
  listMeta:{flexDirection:'row',flexWrap:'wrap',gap:10,justifyContent:'space-between',alignItems:'center',marginBottom:18},grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:12},
  ingredient:{minHeight:136,flexDirection:'row',borderWidth:1,borderColor:colors.border,borderRadius:18,backgroundColor:colors.panel,alignItems:'center'},ingredientInfo:{flex:1,padding:15,flexDirection:'row',gap:14,alignItems:'center'},rowName:{color:colors.text,fontSize:18,lineHeight:26,fontFamily:serif,marginBottom:4},
  addButton:{width:44,height:44,borderRadius:22,borderWidth:1,borderColor:colors.border,justifyContent:'center',alignItems:'center',marginRight:15},added:{backgroundColor:colors.accentDark,borderColor:colors.accent},addText:{fontSize:22,color:colors.accent},
  more:{alignSelf:'center',padding:20,marginTop:16},section:{marginTop:30},sectionTitle:{fontFamily:serif,fontSize:23,lineHeight:32,color:colors.text,marginBottom:12},recipeRow:{paddingVertical:18,borderBottomWidth:1,borderBottomColor:colors.border,flexDirection:'row',alignItems:'center',gap:15},flex:{flex:1},source:{paddingVertical:12},
  cocktailCard:{borderWidth:1,borderColor:colors.border,borderRadius:16,overflow:'hidden',backgroundColor:colors.panel},cardCopy:{padding:17,gap:6},missing:{fontSize:13,lineHeight:21,color:colors.amber},empty:{color:colors.secondary,fontSize:14,lineHeight:24,paddingVertical:35},emptyPanel:{paddingVertical:35,maxWidth:500},emptyMark:{fontSize:44,color:colors.accent,marginBottom:20},storage:{fontSize:11,color:colors.muted,lineHeight:18,marginTop:32},
  warningPanel:{borderWidth:1,borderColor:colors.amber,borderRadius:16,backgroundColor:colors.panel,padding:18,marginBottom:20},warningTitle:{color:colors.text,fontSize:16,fontWeight:'700'},warning:{color:colors.amber,fontSize:13,lineHeight:20,marginTop:7},retry:{alignSelf:'flex-start',minHeight:44,justifyContent:'center',paddingHorizontal:18,borderRadius:24,backgroundColor:colors.raised,borderWidth:1,borderColor:colors.accentDark,marginTop:14},retryText:{color:colors.accent,fontSize:13,fontWeight:'700'},
});
