import React,{useMemo,useState} from 'react';
import {Link} from 'expo-router';
import {Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {catalogue} from '../../content/catalogue';
import {recipeDisplayName} from '../../content/localization/display';
import type {Locale,MediaAsset} from '../../domain/contracts';
import type {Pantry} from '../../domain/ingredients/types';
import {recipeSnapshot,rowId} from '../../domain/making';
import {formatAmount} from '../../domain/search';
import {addShoppingTarget,removeShoppingItem,removeShoppingTarget,selectShoppingAlternative,type ShoppingItem,type ShoppingTarget} from '../../domain/shopping';
import {shoppingText} from '../../i18n/shopping';
import {backupText} from '../../i18n/backup';
import {t} from '../../i18n/ui';
import type {UiKey} from '../../i18n/keys';
import {media} from '../../media';
import {useApp} from '../../platform/AppProvider';
import {useShopping} from '../../platform/ShoppingProvider';
import {useRecovery} from '../../platform/RecoveryProvider';
import {colors} from '../../theme/tokens';
import {isAiMedia,PhotoFrame} from '../discovery/components';
import {Heading} from '../navigation/Heading';
import {makingStyles as s} from './styles';
import {Action,Disclosure} from './ui';

const localized=(name:Record<Locale,string>,locale:Locale)=>name[locale]||name.en;

export function ShoppingList({pantry,disabled=false}:{pantry:Pantry;disabled?:boolean}){
  const {locale,unit}=useApp(),shopping=useShopping(),recovery=useRecovery();
  const copy=(key:Parameters<typeof shoppingText>[1],values?:Record<string,string|number>)=>shoppingText(locale,key,values);
  const [query,setQuery]=useState(''),[limit,setLimit]=useState(8),[busy,setBusy]=useState(false),[localError,setLocalError]=useState('');
  const currentIngredientIds=useMemo(()=>new Set(catalogue.ingredients.map(ingredient=>ingredient.id)),[]);
  const choices=useMemo(()=>catalogue.versions.filter(version=>{
    const cocktail=catalogue.cocktails.find(item=>item.id===version.cocktailId),source=catalogue.sources.find(item=>item.id===version.sourceId);
    return [cocktail?.name[locale],cocktail?.name.en,version.label[locale],source?.title].filter(Boolean).join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  }),[query,locale]);
  const locked=disabled||busy||shopping.saving||shopping.purchasing||!shopping.hydrated||Boolean(shopping.error);
  const change=async(fn:Parameters<typeof shopping.change>[0])=>{
    setBusy(true);setLocalError('');
    try{if(!await shopping.change(fn))setLocalError(copy('writeError'));}catch{setLocalError(copy('writeError'));}finally{setBusy(false);}
  };
  const retry=async()=>{setBusy(true);setLocalError('');try{await shopping.retry();}catch{setLocalError(copy('writeError'));}finally{setBusy(false);}};
  const buy=async(itemId:string)=>{setBusy(true);setLocalError('');try{if(!await shopping.purchase(itemId))setLocalError(copy('purchaseError'));}catch{setLocalError(copy('purchaseError'));}finally{setBusy(false);}};
  const pending=shopping.state.items.filter(item=>!item.bought),bought=shopping.state.items.filter(item=>item.bought);
  const title=(target:ShoppingTarget)=>recipeDisplayName(target.recipe,locale);
  return <View style={styles.content}>
    <Heading level={2} style={s.sectionHeading}>{copy('title')}</Heading><Text style={s.body}>{copy('intro')}</Text>
    {shopping.error?<View accessibilityRole="alert" style={[s.panel,shopping.error==='read'?s.errorPanel:s.warningPanel]}><Text style={s.body}>{copy(shopping.error==='read'?'readError':'writeError')}</Text><Action label={copy(busy?'saving':'retry')} disabled={busy} onPress={()=>void retry()}/></View>:null}
    {localError?<Text accessibilityRole="alert" style={s.statusMissing}>{localError}</Text>:null}
    {shopping.purchaseError==='exclusive-storage-unavailable'?<Text accessibilityRole="alert" style={s.statusMissing}>{backupText(locale,'noLock')}</Text>:recovery.state.notice==='purchase-failed'?<Text accessibilityRole="alert" style={s.statusMissing}>{copy('purchaseError')}</Text>:null}
    {!shopping.hydrated&&!shopping.error?<Text style={s.body}>{copy('loading')}</Text>:null}
    {shopping.hydrated?<>
      {!shopping.state.targets.length?<Text style={s.body}>{copy('empty')}</Text>:null}
      <Disclosure title={copy('addRecipes')} initial={!shopping.state.targets.length}>
        <TextInput accessibilityLabel={copy('search')} placeholder={copy('search')} placeholderTextColor={colors.secondary} value={query} onChangeText={value=>{setQuery(value);setLimit(8);}} style={styles.input}/>
        <View style={styles.recipes}>{choices.slice(0,limit).map(version=>{
          const recipe=recipeSnapshot(catalogue,version.id);if(!recipe)return null;
          const selected=shopping.state.targets.some(target=>target.recipe.version.id===recipe.version.id);
          const name=recipeDisplayName(recipe,locale),asset=media[version.cocktailId],cocktail=catalogue.cocktails.find(item=>item.id===version.cocktailId);
          return <View key={version.id} testID={`shopping-choice-${version.id}`} style={styles.recipeRow}>
            <View style={styles.recipeIdentity}>
              <ShoppingPhoto asset={asset} accent={cocktail?.accent??colors.raised} locale={locale}/>
              <View style={styles.recipeCopy}><Text style={s.strong}>{name}</Text><Text style={s.meta}>{localized(version.label,locale)} · {recipe.source.title}</Text>{asset&&!isAiMedia(asset)?<Text style={s.meta}>{asset.author}{asset.license?` · ${asset.license}`:''}</Text>:null}</View>
            </View>
            <Action label={selected?copy('saved'):copy('add',{recipe:`${name} · ${localized(version.label,locale)}`})} disabled={locked||selected} onPress={()=>void change(state=>addShoppingTarget(state,catalogue,recipe,pantry))}/>
          </View>;
        })}</View>
        {!choices.length?<Text style={s.body}>{copy('noResults')}</Text>:null}
        {choices.length>limit?<Action label={copy('showMore')} onPress={()=>setLimit(value=>value+8)}/>:null}
      </Disclosure>
      {shopping.state.targets.length?<Disclosure title={copy('selected',{count:shopping.state.targets.length})}>
        {shopping.state.targets.map(target=>{
          const asset=media[target.recipe.version.cocktailId],cocktail=catalogue.cocktails.find(item=>item.id===target.recipe.version.cocktailId);
          return <View key={target.id} testID={`shopping-target-${target.recipe.version.id}`} style={styles.target}>
          <View style={styles.targetHeader}>
            <ShoppingPhoto asset={asset} accent={cocktail?.accent??colors.raised} locale={locale}/>
            <View style={styles.recipeCopy}>
              <Heading level={3} style={s.strong}>{title(target)}</Heading><Text style={s.meta}>{localized(target.recipe.version.label,locale)} · {target.recipe.source.title}</Text>
              <Link href={{pathname:'/cocktails/[id]',params:{id:target.recipe.version.cocktailId,version:target.recipe.version.id,from:'pantry'}} as never} asChild><Pressable accessibilityRole="link" style={s.back}><Text style={s.backText}>{target.recipe.source.title} ↗</Text></Pressable></Link>
              {asset&&!isAiMedia(asset)?<Text style={s.meta}>{asset.author}{asset.license?` · ${asset.license}`:''}</Text>:null}
            </View>
          </View>
          {target.rows.filter(row=>!row.dismissed).map(row=>{
            const source=target.recipe.version.ingredients.find((_,index)=>rowId(target.recipe,index)===row.rowId),amount=source?formatAmount(source.amount,source.unit,unit):undefined;
            return <View key={row.rowId} style={styles.alternatives}>
              <Text style={s.strong}>{localized(row.sourceName,locale)}{amount?` · ${amount.amount} ${t(locale,`unit_${amount.unit}` as UiKey)}`:''}</Text>
              {source?.note?<Text style={s.meta}>{localized(source.note,locale)}</Text>:null}
              {row.candidates.length>1?<><Text style={s.body}>{copy('alternative')}</Text><View style={styles.actions}>{row.candidates.map(candidate=><Action key={candidate.ingredientId} label={copy('choose',{ingredient:localized(candidate.name,locale)})} selected={row.selectedIngredientId===candidate.ingredientId} disabled={locked||shopping.state.items.some(item=>item.bought&&item.refs.some(ref=>ref.targetId===target.id&&ref.rowId===row.rowId))} onPress={()=>void change(state=>selectShoppingAlternative(state,target.id,row.rowId,candidate.ingredientId))}/>)}</View></>:null}
            </View>;
          })}
          <Action label={copy('removeTarget',{recipe:title(target)})} disabled={locked} onPress={()=>void change(state=>removeShoppingTarget(state,target.id))}/>
        </View>;})}
      </Disclosure>:null}
      {shopping.state.targets.length?<View style={styles.group}><Heading level={3} style={s.sectionHeading}>{copy('pending',{count:pending.length})}</Heading>{!pending.length?<Text style={s.body}>{copy('ready')}</Text>:pending.map(item=><ShoppingRow key={item.id} item={item} available={item.known&&currentIngredientIds.has(item.ingredientId)} targets={shopping.state.targets} locale={locale} locked={locked} onBuy={()=>void buy(item.id)} onRemove={()=>void change(state=>removeShoppingItem(state,item.id))}/>)}</View>:null}
      {bought.length?<View style={styles.group}><Heading level={3} style={s.sectionHeading}>{copy('bought',{count:bought.length})}</Heading>{bought.map(item=><ShoppingRow key={item.id} item={item} available={item.known&&currentIngredientIds.has(item.ingredientId)} targets={shopping.state.targets} locale={locale} locked={locked} onRemove={()=>void change(state=>removeShoppingItem(state,item.id))}/>)}</View>:null}
    </>:null}
  </View>;
}

function ShoppingPhoto({asset,accent,locale}:{asset?:MediaAsset;accent:string;locale:Locale}){
  return <View style={styles.thumbnail}>{asset?<PhotoFrame asset={asset} accent={accent} locale={locale} height={92} borderRadius={0}/>:<View testID="shopping-photo-placeholder" style={styles.photoPending}><Text style={styles.photoPendingText}>{t(locale,'photoPending')}</Text></View>}</View>;
}

function ShoppingRow({item,available,targets,locale,locked,onBuy,onRemove}:{item:ShoppingItem;available:boolean;targets:ShoppingTarget[];locale:Locale;locked:boolean;onBuy?:()=>void;onRemove:()=>void}){
  const name=localized(item.name,locale),copy=(key:Parameters<typeof shoppingText>[1],values?:Record<string,string|number>)=>shoppingText(locale,key,values);
  const sourceTargets=targets.filter(target=>item.refs.some(ref=>ref.targetId===target.id));
  return <View style={styles.item}>
    <View style={styles.description}><Heading level={4} style={s.strong}>{name}</Heading>{sourceTargets.map(target=><Text key={target.id} style={s.meta}>{recipeDisplayName(target.recipe,locale)} · {localized(target.recipe.version.label,locale)}</Text>)}{!available?<Text style={s.statusCheck}>{copy('unknown')}</Text>:null}</View>
    <View style={styles.actions}>{onBuy?<Action primary label={copy('confirm',{ingredient:name})} disabled={locked||!available} onPress={onBuy}/>:null}<Action label={copy('removeItem',{ingredient:name})} disabled={locked} onPress={onRemove}/></View>
  </View>;
}

const styles=StyleSheet.create({content:{gap:18,maxWidth:1040},input:{minHeight:48,borderWidth:1,borderColor:colors.border,color:colors.text,paddingHorizontal:14,fontSize:16},recipes:{gap:0},recipeRow:{paddingVertical:14,borderBottomWidth:1,borderColor:colors.border,flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:12},recipeIdentity:{flexDirection:'row',alignItems:'center',gap:14,flexGrow:1,flexShrink:1,flexBasis:300,minWidth:0},thumbnail:{width:76,flexShrink:0},photoPending:{minHeight:92,padding:6,justifyContent:'center',alignItems:'center',backgroundColor:colors.panel,borderWidth:1,borderColor:colors.border},photoPendingText:{width:'100%',color:colors.secondary,fontSize:12,lineHeight:17,textAlign:'center'},recipeCopy:{flex:1,minWidth:0,gap:4},description:{flexGrow:1,flexBasis:230,minWidth:0,gap:4},target:{gap:8,paddingVertical:18,borderBottomWidth:1,borderColor:colors.border},targetHeader:{flexDirection:'row',alignItems:'center',gap:14},alternatives:{gap:8,paddingVertical:8},actions:{flexDirection:'row',flexWrap:'wrap',gap:10,alignItems:'flex-start'},group:{gap:12},item:{flexDirection:'row',flexWrap:'wrap',gap:14,alignItems:'center',paddingVertical:18,borderBottomWidth:1,borderColor:colors.border}});
