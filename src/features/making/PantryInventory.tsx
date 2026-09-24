import {BottleOriginalName} from '../names/OriginalName';
import React, {useMemo, useState} from 'react';
import {Link} from 'expo-router';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {catalogue} from '../../content/catalogue';
import {bottles} from '../../content/bottles';
import {ingredientEntries, filterIngredientEntries} from '../../domain/ingredients';
import {bottleDisplayName} from '../../domain/bottles/format';
import {makingText} from '../../i18n/making';
import {p02PantryText} from '../../i18n/p02-pantry';
import {useApp} from '../../platform/AppProvider';
import {usePantry} from '../../platform/PantryProvider';
import {useBottles} from '../../platform/BottleProvider';
import {colors, radii} from '../../theme/tokens';
import {IngredientPicture} from '../ingredients/IngredientPicture';
import {BottlePhoto} from '../workspace/BottlePhoto';
import {Heading} from '../navigation/Heading';
import {Action, type MakingCopy} from './ui';

const entries = ingredientEntries(catalogue);
const familiar = [...entries].sort((a,b) => b.cocktailIds.length - a.cocktailIds.length);

/** Ownership is the first task; measurements belong to each ingredient's details. */
export function PantryInventory({disabled, onFindDrinks}: {disabled:boolean;onFindDrinks:()=>void}) {
  const {locale} = useApp();
  const pantry = usePantry(), owned = useBottles();
  const p = (key:Parameters<typeof p02PantryText>[1],values?:Record<string,string|number>) => p02PantryText(locale,key,values);
  const copy:MakingCopy = (key,values) => makingText(locale,key,values);
  const [adding,setAdding] = useState(false), [query,setQuery] = useState(''), [addQuery,setAddQuery] = useState('');
  const [openId,setOpenId] = useState<string>();
  const [limit,setLimit] = useState(12), [addLimit,setAddLimit] = useState(12), [bottleLimit,setBottleLimit] = useState(12);
  const [bottlesOpen,setBottlesOpen] = useState(false);
  const ownedBottles = useMemo(() => bottles.filter(bottle=>owned.ids.includes(bottle.id)),[owned.ids]);
  const bottleIngredients = useMemo(() => new Set(ownedBottles.flatMap(bottle=>bottle.ingredientIds)),[ownedBottles]);
  const materialIds = useMemo(() => new Set([...pantry.pantry.ingredientIds,...bottleIngredients]),[pantry.pantry.ingredientIds,bottleIngredients]);
  const mine = useMemo(() => entries.filter(entry=>materialIds.has(entry.ingredient.id)),[materialIds]);
  const results = useMemo(() => filterIngredientEntries(mine,catalogue,query,locale),[mine,query,locale]);
  const additions = useMemo(() => addQuery.trim() ? filterIngredientEntries(entries,catalogue,addQuery,locale) : familiar,[addQuery,locale]);
  // Read failures must not look like an empty cabinet. The screen owns the retry notice.
  if(pantry.error==='read'||owned.error==='read')return null;
  if(!pantry.hydrated||!owned.hydrated)return <Text style={styles.emptyText}>{copy('loading')}</Text>;

  return <View style={styles.root}>
    <View style={adding?styles.hidden:undefined}>
      {mine.length || ownedBottles.length ? <>
        <View style={styles.topline}>
          <Heading level={2} style={styles.sectionTitle}>{p('ownedIngredients',{count:mine.length})}</Heading>
          <Action primary label={p('addIngredients')} disabled={disabled} onPress={()=>setAdding(true)}/>
        </View>
        {mine.length>6 || query ? <SearchField label={p('searchOwned')} value={query} disabled={disabled} onChange={value=>{setQuery(value);setLimit(12);}}/> : null}
        <View style={styles.list}>{results.slice(0,limit).map(({ingredient})=>{
          const id=ingredient.id, direct=pantry.pantry.ingredientIds.includes(id), derived=bottleIngredients.has(id);
          const expanded=openId===id, name=ingredient.name[locale]||ingredient.name.en;
          return <View key={id} style={styles.item}>
            <Pressable accessibilityRole="button" accessibilityLabel={name} accessibilityState={{expanded,disabled}}
              disabled={disabled} onPress={()=>setOpenId(expanded?undefined:id)} style={({pressed})=>[styles.itemLead,pressed&&styles.pressed]}>
              <IngredientPicture ingredient={ingredient} size={44}/>
              <View style={styles.grow}><Text style={styles.name}>{name}</Text>{derived&&!direct?<Text style={styles.meta}>{p('fromBottle')}</Text>:null}</View>
              <Text style={styles.cue}>{expanded?'−':'+'}</Text>
            </Pressable>
            {expanded?<View style={styles.details}>
              <View style={styles.actions}>
                <Link href={{pathname:'/ingredients/[id]',params:{id}}} asChild><Pressable accessibilityRole="link" style={styles.textLink}><Text style={styles.linkText}>{p('materialDetails')}</Text></Pressable></Link>
              </View>
              {derived?<Text style={styles.meta}>{p('retainedFromBottle')}</Text>:null}
              {direct?<View style={styles.removeRow}>
                <Action label={p(derived?'removeMaterialOnly':'removeMaterial')} danger disabled={disabled}
                  onPress={()=>{pantry.toggleIngredient(id);setOpenId(undefined);}}/>
              </View>:<Link href={{pathname:'/bottles',params:{ingredient:id}}} asChild><Pressable accessibilityRole="link" style={styles.textLink}><Text style={styles.linkText}>{p('manageBottles')}</Text></Pressable></Link>}
            </View>:null}
          </View>;
        })}</View>
        {!results.length?<Text style={styles.emptyText}>{p('noOwnedMatch')}</Text>:null}
        {results.length>limit?<Action label={copy('more')} onPress={()=>setLimit(value=>value+12)}/>:null}
        <Action primary label={p('goRecipes')} onPress={onFindDrinks}/>
      </>:<View style={styles.empty}>
        <Heading level={2} style={styles.emptyTitle}>{p('emptyTitle')}</Heading>
        <Text style={styles.emptyText}>{p('emptyHint')}</Text>
        <Action primary label={p('addIngredients')} disabled={disabled} onPress={()=>setAdding(true)}/>
      </View>}

      <View style={styles.bottleSection}>
        <View style={styles.topline}>
          {ownedBottles.length?<Pressable accessibilityRole="button" accessibilityState={{expanded:bottlesOpen}} onPress={()=>setBottlesOpen(value=>!value)} style={styles.textLink}>
            <Text style={styles.linkText}>{p('ownedBottles',{count:ownedBottles.length})}{bottlesOpen?' −':' +'}</Text>
          </Pressable>:<Text style={styles.meta}>{p('ownedBottles',{count:0})}</Text>}
          <Link href="/bottles" asChild><Pressable accessibilityRole="link" style={styles.textLink}><Text style={styles.meta}>{p('manageBottles')}</Text></Pressable></Link>
        </View>
        {bottlesOpen?<View>{ownedBottles.slice(0,bottleLimit).map(bottle=><Link key={bottle.id} href={{pathname:'/bottles',params:{ingredient:bottle.ingredientIds[0]}}} asChild>
          <Pressable accessibilityRole="link" style={styles.bottleRow}><BottlePhoto bottle={bottle} locale={locale} size="chooser"/><View style={styles.grow}><Text style={styles.name}>{bottleDisplayName(bottle,locale)}</Text><BottleOriginalName bottle={bottle} locale={locale} /><Text style={styles.meta}>{p('manageBottles')}</Text></View></Pressable>
        </Link>)}{ownedBottles.length>bottleLimit?<Action label={copy('more')} onPress={()=>setBottleLimit(value=>value+12)}/>:null}</View>:null}
      </View>
    </View>

    {adding?<View style={styles.addPane}>
      <View style={styles.topline}><Heading level={2} style={styles.sectionTitle}>{p('addTitle')}</Heading><Action label={p('closeAdd')} onPress={()=>setAdding(false)}/></View>
      <Text style={styles.emptyText}>{p('addHint')}</Text>
      <SearchField label={p('addSearch')} value={addQuery} onChange={value=>{setAddQuery(value);setAddLimit(12);}}/>
      <View style={styles.list}>{additions.slice(0,addLimit).map(({ingredient})=>{
        const present=materialIds.has(ingredient.id), name=ingredient.name[locale]||ingredient.name.en;
        return <View key={ingredient.id} style={styles.addRow}><IngredientPicture ingredient={ingredient} size={40}/><Text style={[styles.name,styles.grow]}>{name}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`${p(present?'added':'add')} ${name}`} accessibilityState={{disabled:disabled||present}} disabled={disabled||present}
            onPress={()=>{if(!materialIds.has(ingredient.id))pantry.toggleIngredient(ingredient.id);}} style={({pressed})=>[styles.addButton,present&&styles.added,pressed&&styles.pressed]}>
            <Text style={present?styles.meta:styles.linkText}>{p(present?'added':'add')}</Text>
          </Pressable>
        </View>;
      })}</View>
      {!additions.length?<Text style={styles.emptyText}>{copy('noResults')}</Text>:null}
      {additions.length>addLimit?<Action label={copy('more')} onPress={()=>setAddLimit(value=>value+12)}/>:null}
    </View>:null}
  </View>;
}

function SearchField({label,value,onChange,disabled=false}:{label:string;value:string;onChange:(value:string)=>void;disabled?:boolean}) {
  const [focused,setFocused]=useState(false);
  return <TextInput accessibilityLabel={label} accessibilityState={{disabled}} editable={!disabled} placeholder={label} value={value} onChangeText={onChange} placeholderTextColor={colors.muted}
    onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={[styles.input,focused&&styles.inputFocused]}/>;
}

const styles=StyleSheet.create({
  root:{gap:20},hidden:{display:'none'},topline:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12},
  sectionTitle:{fontSize:19,lineHeight:28,color:colors.text,fontWeight:'600'},emptyTitle:{fontSize:23,lineHeight:32,color:colors.text,fontWeight:'600'},
  empty:{gap:15,paddingVertical:30},emptyText:{fontSize:14,lineHeight:23,color:colors.secondary},
  input:{fontSize:16,lineHeight:24,minHeight:48,paddingHorizontal:13,paddingVertical:11,borderWidth:1,borderColor:colors.border,borderRadius:radii.small,color:colors.text,backgroundColor:colors.background,marginTop:14},
  inputFocused:{borderColor:colors.accent,backgroundColor:colors.panel},list:{marginVertical:14},
  item:{borderBottomWidth:1,borderBottomColor:colors.border},itemLead:{flexDirection:'row',alignItems:'center',gap:12,minHeight:78,paddingVertical:12},
  name:{color:colors.text,fontSize:16,lineHeight:23},meta:{color:colors.muted,fontSize:12,lineHeight:19},grow:{flex:1,minWidth:0},
  cue:{color:colors.accent,fontSize:20},
  details:{gap:13,paddingBottom:18},actions:{flexDirection:'row',alignItems:'center',gap:12,flexWrap:'wrap'},
  removeRow:{gap:10,paddingTop:7},textLink:{minHeight:44,justifyContent:'center'},linkText:{color:colors.accent,fontSize:14,lineHeight:21,fontWeight:'600'},
  pressed:{opacity:0.65},bottleSection:{marginTop:22,paddingTop:10,borderTopWidth:1,borderTopColor:colors.border},
  bottleRow:{flexDirection:'row',alignItems:'center',gap:14,paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.border},
  addPane:{gap:8},addRow:{flexDirection:'row',alignItems:'center',gap:12,minHeight:70,borderBottomWidth:1,borderBottomColor:colors.border,paddingVertical:10},
  addButton:{minHeight:44,minWidth:64,paddingHorizontal:12,justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:colors.border,borderRadius:radii.small},added:{borderColor:'transparent'},
});
