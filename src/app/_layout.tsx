import React, {useState} from 'react';
import {Platform, Pressable, Text, View} from 'react-native';
import {router, Stack, usePathname} from 'expo-router';
import Head from 'expo-router/head';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppProvider, useApp} from '../platform/AppProvider';
import {colors} from '../theme/tokens';
import {AmbientLight} from '../features/discovery/AmbientLight';
import {useReduceMotion, useViewport} from '../features/discovery/components';
import {PantryProvider} from '../platform/PantryProvider';
import {FavoritesProvider} from '../platform/FavoritesProvider';
import {LabProvider} from '../platform/LabProvider';
import {BottleProvider} from '../platform/BottleProvider';
import {AppNavigation} from '../features/navigation';
import {RecoveryProvider, useRecovery} from '../platform/RecoveryProvider';
import {PrivateRecipesProvider} from '../platform/PrivateRecipesProvider';
import {backupText} from '../i18n/backup';
import {privateRecipeText} from '../features/private-recipes/copy';
import {TasteProvider} from '../platform/TasteProvider';
import {MakingProvider} from '../platform/MakingProvider';
import {MotionTransition,useMotionEnabled} from '../features/motion';

// Use the navigator's own render state: the global pathname can update after its screen DOM.
const sceneLayout: NonNullable<React.ComponentProps<typeof Stack>['layout']> = ({state, children}) => (
  <MotionTransition changeKey={state.routes[state.index]?.key??state.key} disabled={Platform.OS!=='web'} style={{flex:1,minHeight:0}}>
    {children}
  </MotionTransition>
);

function AppScene() {
  const {motionPaused, locale} = useApp();
  const {state} = useRecovery();
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();
  const notice = state.notice;
  const reduceMotion = useReduceMotion();
  const canAnimate = useMotionEnabled();
  const desktop = useViewport().width >= 760;
  return <View style={{flex: 1, backgroundColor: colors.background}}>
    {desktop && <AppNavigation />}
    {!dismissed && pathname !== '/backup' && (notice === 'restored' || notice === 'rolled-back' || notice === 'stale') && <View style={{padding:16,gap:10,backgroundColor:colors.panel}}>
      <Text accessibilityLiveRegion="polite" style={{color:colors.accent,fontSize:14,lineHeight:22}}>{backupText(locale,notice==='restored'?'restored':notice==='rolled-back'?'rolledBack':'stale')}</Text>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
        <Pressable accessibilityRole="link" onPress={()=>router.navigate('/backup' as never)} style={{minHeight:44,justifyContent:'center'}}><Text style={{color:colors.text}}>{backupText(locale,'title')} ↗</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={privateRecipeText(locale,'close')} onPress={()=>setDismissed(true)} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}><Text style={{color:colors.text,fontSize:22}}>×</Text></Pressable>
      </View>
    </View>}
    <View {...(Platform.OS === 'web' ? {role:'main' as const} : {})} style={{flex:1,minHeight:0}}><Stack layout={sceneLayout} screenOptions={{title:'Glass Notes', headerShown:false, contentStyle:{backgroundColor:colors.background}, animation:Platform.OS==='web'||!canAnimate?'none':'fade',animationDuration:700}} /></View>
    {!desktop && <AppNavigation />}
    <AmbientLight paused={motionPaused||!canAnimate} reduceMotion={reduceMotion} />
  </View>;
}

export default function RootLayout() {
  return <SafeAreaProvider><RecoveryProvider><AppProvider><PantryProvider><FavoritesProvider><LabProvider><BottleProvider><PrivateRecipesProvider><MakingProvider><TasteProvider>
    <Head><title>Glass Notes</title></Head>
    <StatusBar style="light" />
    <AppScene />
  </TasteProvider></MakingProvider></PrivateRecipesProvider></BottleProvider></LabProvider></FavoritesProvider></PantryProvider></AppProvider></RecoveryProvider></SafeAreaProvider>;
}
