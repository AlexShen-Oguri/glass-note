import React,{useMemo,useState} from 'react';
import {router} from 'expo-router';
import {StyleSheet,Text,View} from 'react-native';
import {bottles} from '../../content/bottles';
import {catalogue} from '../../content/catalogue';
import type {Locale} from '../../domain/contracts';
import {mergeOwnedPantry} from '../../domain/ingredients/presence';
import {recipeSnapshot} from '../../domain/making';
import {addShoppingTarget} from '../../domain/shopping';
import {shoppingText} from '../../i18n/shopping';
import {useBottles} from '../../platform/BottleProvider';
import {usePantry} from '../../platform/PantryProvider';
import {useShopping} from '../../platform/ShoppingProvider';
import {makingStyles as s} from '../making/styles';
import {Action} from '../making/ui';

export function RecipeShoppingAction({versionId,locale}:{versionId:string;locale:Locale}){
  const shopping=useShopping(),pantry=usePantry(),owned=useBottles();
  const [busy,setBusy]=useState(false),[error,setError]=useState(false);
  const merged=useMemo(()=>mergeOwnedPantry(pantry.pantry,bottles.filter(bottle=>owned.ids.includes(bottle.id))),[pantry.pantry,owned.ids]);
  const selected=shopping.state.targets.some(target=>target.recipe.version.id===versionId);
  const recipe=useMemo(()=>recipeSnapshot(catalogue,versionId),[versionId]);
  const confirmed=selected&&!shopping.error&&!shopping.saving;
  const ready=shopping.hydrated&&pantry.hydrated&&owned.hydrated&&!shopping.error&&!pantry.error&&!owned.error&&pantry.storageAvailable;
  const add=async()=>{
    if(!recipe||!ready||busy||selected||shopping.saving||shopping.purchasing)return;
    setBusy(true);setError(false);
    try{const saved=await shopping.change(state=>addShoppingTarget(state,catalogue,recipe,merged));if(saved)router.push({pathname:'/pantry',params:{tab:'shopping'}} as never);else setError(true);}catch{setError(true);}finally{setBusy(false);}
  };
  const sourceReadFailed=pantry.error==='read'||owned.error==='read';
  const sourceWriteFailed=pantry.error==='write'||owned.error==='write'||!pantry.storageAvailable;
  const retry=async()=>{setBusy(true);try{
    if(pantry.error||!pantry.storageAvailable)await pantry.retry();
    if(owned.error==='read'||!owned.hydrated)await owned.load();else if(owned.error==='write')await owned.retrySave();
    if(shopping.error||error){const saved=await shopping.retry();if(saved)setError(false);}
  }catch{setError(true);}finally{setBusy(false);}};
  const label=shoppingText(locale,busy||shopping.saving?'saving':confirmed?'saved':'addVersion');
  const showError=error&&!confirmed||Boolean(shopping.error||sourceReadFailed||sourceWriteFailed);
  return <View testID={`shopping-action-${versionId}`} style={{gap:8,minWidth:0}}>
    <Action style={styles.button} label={label} disabled={!recipe||selected||!ready||busy||shopping.saving||shopping.purchasing} onPress={()=>void add()}/>
    {confirmed?<Action style={styles.button} label={shoppingText(locale,'title')} onPress={()=>router.push({pathname:'/pantry',params:{tab:'shopping'}} as never)}/>:null}
    {showError?<><Text accessibilityRole="alert" style={s.statusMissing}>{shoppingText(locale,shopping.error==='read'||sourceReadFailed?'readError':'writeError')}</Text><Action style={styles.button} label={shoppingText(locale,busy?'saving':'retry')} disabled={busy} onPress={()=>void retry()}/></>:null}
  </View>;
}

const styles=StyleSheet.create({button:{alignSelf:'stretch',minHeight:50}});
