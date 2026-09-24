import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Link} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {collectionCountState} from '../../domain/discovery/navigation-state';
import {appNavigationText} from '../../i18n/app-navigation';
import {favoriteCopy} from '../../i18n/favorites';
import {favoriteListText} from '../../i18n/favorite-lists';
import {professionalText} from '../../i18n/professional';
import {useApp} from '../../platform/AppProvider';
import {useFavorites} from '../../platform/FavoritesProvider';
import {useLab} from '../../platform/LabProvider';
import {colors} from '../../theme/tokens';
import {BrandToolbar, serif} from '../discovery/components';
import {ProfessionalLinks} from './ProfessionalLinks';
import {Heading} from './Heading';
import {Action, Fold} from '../workspace/ui';
import {usePrivateRecipes} from '../../platform/PrivateRecipesProvider';
import {tm} from '../../i18n/taste';
import {useTaste} from '../../platform/TasteProvider';
import {backupText} from '../../i18n/backup';
import {p02NavigationText} from '../../i18n/p02-navigation';
import {helpText} from '../../i18n/help';

export function ProfessionalHomeScreen() {
  const app = useApp();
  return <SafeAreaView style={styles.screen} edges={['top']}>
    <ScrollView contentContainerStyle={styles.page}><View style={styles.shell}>
      <BrandToolbar {...app} showUnits={false}/>
      <View style={styles.hero}>
        <Heading style={styles.title}>{professionalText(app.locale,'title')}</Heading>
        <Text style={styles.subtitle}>{appNavigationText(app.locale,'professionalIntro')}</Text>
      </View>
      <ProfessionalLinks locale={app.locale} showHeading={false}/>
    </View></ScrollView>
  </SafeAreaView>;
}

export function PersonalHomeScreen() {
  const app = useApp();
  const {locale,unit,motionPaused,preferenceStorageAvailable} = app;
  const favorites=useFavorites();
  const privateRecipes=usePrivateRecipes();
  const taste=useTaste();
  const lab=useLab();
  const copy=favoriteCopy(locale);
  const count=(hydrated:boolean,available:boolean,value:number)=>{
    const state=collectionCountState(hydrated&&available,available);
    return state==='value'?String(value):appNavigationText(locale,state==='loading'?'countLoading':'countUnavailable');
  };
  const unavailableSections=[
    {failed:!favorites.storageAvailable||!!favorites.error,title:copy.title,href:'/favorites'},
    {failed:!privateRecipes.storageAvailable||!!privateRecipes.error,title:backupText(locale,'privateTitle'),href:'/my-recipes'},
    {failed:!lab.storageAvailable||!!lab.error,title:professionalText(locale,'lab'),href:'/lab'},
    {failed:!!taste.error,title:tm(locale,'memoryTitle'),href:'/taste'},
  ] as const;
  const favoritesSummary = favorites.hydrated && favorites.storageAvailable && !favorites.error
    ? `${favorites.versionIds.length + favorites.unknownVersionIds.length} ${copy.count} · ${favorites.lists.length} ${favoriteListText(locale, 'listCount')}`
    : count(favorites.hydrated, favorites.storageAvailable && !favorites.error, 0);
  return <SafeAreaView style={styles.screen} edges={['top']}>
    <ScrollView contentContainerStyle={styles.page}><View style={styles.shell}>
      <BrandToolbar {...app} showUnits={false}/>
      <View style={styles.hero}><Heading style={styles.title}>{appNavigationText(locale,'myTitle')}</Heading></View>
      <View style={styles.destinations}>
        <Destination href="/my-recipes" title={backupText(locale,'privateTitle')} description={p02NavigationText(locale,'privateHint')} count={count(privateRecipes.hydrated,privateRecipes.storageAvailable&&!privateRecipes.error,privateRecipes.recipes.length)}/>
        <Destination href="/favorites" title={copy.title} description={`${p02NavigationText(locale,'favoriteHint')}\n${favoritesSummary}`}/>
        <Destination href="/taste" title={tm(locale,'memoryTitle')} description={tm(locale,'memoryHint')} count={count(taste.hydrated,!taste.error,taste.savedState.entries.length)}/>
      </View>
      {unavailableSections.filter(item=>item.failed).map(item=><View key={item.href} style={styles.storageNotice}><Text accessibilityRole="alert" style={styles.warning}>{item.title} · {p02NavigationText(locale,'storageIssue')}</Text><Link href={item.href} asChild><Pressable accessibilityRole="link" style={styles.issueLink}><Text style={styles.hint}>{p02NavigationText(locale,'reviewIssue')} ›</Text></Pressable></Link></View>)}
      <View style={styles.settings}>
        <Fold title={appNavigationText(locale,'preferences')}>
          <Text style={styles.hint}>{p02NavigationText(locale,'languageHint')}</Text>
          <View style={styles.settingRow}><Text style={styles.settingLabel}>{appNavigationText(locale,'units')}</Text><Action label={unit==='ml'?'ML':'FL OZ'} onPress={()=>app.setUnit(unit==='ml'?'oz':'ml')}/></View>
          <View style={styles.settingRow}><Text style={styles.settingLabel}>{appNavigationText(locale,'motion')}</Text><Action label={appNavigationText(locale,motionPaused?'motionPaused':'motionOn')} onPress={()=>app.setMotionPaused(!motionPaused)}/></View>
        </Fold>
        {!preferenceStorageAvailable&&<Text accessibilityRole="alert" style={styles.warning}>{appNavigationText(locale,'preferencesStorageWarning')}</Text>}
        <Destination href="/backup" title={backupText(locale,'title')} description={appNavigationText(locale,'localDataDescription')}/>
        <Destination href="/help" title={helpText(locale,'title')} description={helpText(locale,'hint')}/>
      </View>
    </View></ScrollView>
  </SafeAreaView>;
}

function Destination({href,title,description,count}: {href:'/my-recipes'|'/favorites'|'/taste'|'/backup'|'/help';title:string;description:string;count?:string}) {
  return <Link href={href as React.ComponentProps<typeof Link>['href']} asChild><Pressable accessibilityRole="link" style={styles.destination}>
    <View style={styles.destinationCopy}><Text style={styles.destinationTitle}>{title}</Text><Text style={styles.hint}>{description}</Text></View>
    {count!==undefined&&<Text style={styles.count}>{count}</Text>}<Text style={styles.arrow}>›</Text>
  </Pressable></Link>;
}

const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:'transparent'},
  page:{flexGrow:1,paddingHorizontal:20,paddingBottom:48},
  shell:{width:'100%',maxWidth:860,alignSelf:'center'},
  hero:{paddingTop:26,paddingBottom:22,maxWidth:720},
  title:{color:colors.text,fontFamily:serif,fontSize:36,lineHeight:46},
  subtitle:{color:colors.secondary,fontSize:15,lineHeight:24,marginTop:10},
  destinations:{borderTopWidth:1,borderColor:colors.border},
  destination:{minHeight:92,paddingVertical:18,borderBottomWidth:1,borderColor:colors.border,flexDirection:'row',alignItems:'center',gap:12},
  destinationCopy:{flex:1,minWidth:0,gap:6},
  destinationTitle:{fontFamily:serif,color:colors.text,fontSize:22,lineHeight:28},
  hint:{color:colors.secondary,fontSize:13,lineHeight:21},
  count:{color:colors.accent,fontSize:14,lineHeight:21,maxWidth:'28%',textAlign:'right'},
  arrow:{color:colors.secondary,fontSize:25},
  settings:{marginTop:30},
  settingRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:14},
  settingLabel:{color:colors.text,fontSize:15,lineHeight:23,flex:1},
  warning:{color:colors.amber,fontSize:13,lineHeight:21,marginVertical:10},
  storageNotice:{borderBottomWidth:1,borderColor:colors.border,paddingVertical:8},
  issueLink:{minHeight:44,justifyContent:'center',alignSelf:'flex-start'},
  pressed:{opacity:0.7},
});
