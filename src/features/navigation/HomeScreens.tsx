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
import {BrandToolbar, serif, useViewport} from '../discovery/components';
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
  const compact = useViewport().width < 900;
  return <SafeAreaView style={styles.screen} edges={['top']}>
    <ScrollView contentContainerStyle={styles.page}><View style={styles.shell}>
      <BrandToolbar {...app} showUnits={false}/>
      <View style={[styles.professionalLayout, compact && styles.professionalLayoutCompact]}>
        <View style={[styles.hero, styles.professionalHero, compact && styles.professionalPartCompact]}>
          <Text style={styles.sectionNumber}>03 / GLASS NOTES</Text>
          <Heading style={styles.title}>{professionalText(app.locale,'title')}</Heading>
          <Text style={styles.subtitle}>{appNavigationText(app.locale,'professionalIntro')}</Text>
        </View>
        <View style={[styles.professionalDestinations, compact && styles.professionalPartCompact]}><ProfessionalLinks locale={app.locale} showHeading={false}/></View>
      </View>
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
      <View style={styles.hero}><Text style={styles.sectionNumber}>04 / GLASS NOTES</Text><Heading style={styles.title}>{appNavigationText(locale,'myTitle')}</Heading></View>
      <View style={styles.destinations}>
        <Destination index="01" href="/my-recipes" title={backupText(locale,'privateTitle')} description={p02NavigationText(locale,'privateHint')} count={count(privateRecipes.hydrated,privateRecipes.storageAvailable&&!privateRecipes.error,privateRecipes.recipes.length)}/>
        <Destination index="02" href="/favorites" title={copy.title} description={`${p02NavigationText(locale,'favoriteHint')}\n${favoritesSummary}`}/>
        <Destination index="03" href="/taste" title={tm(locale,'memoryTitle')} description={tm(locale,'memoryHint')} count={count(taste.hydrated,!taste.error,taste.savedState.entries.length)}/>
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

function Destination({href,title,description,count,index}: {href:'/my-recipes'|'/favorites'|'/taste'|'/backup'|'/help';title:string;description:string;count?:string;index?:string}) {
  return <Link href={href as React.ComponentProps<typeof Link>['href']} asChild><Pressable accessibilityRole="link" style={styles.destination}>
    {index && <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Text style={styles.destinationNumber}>{index}</Text></View>}
    <View style={styles.destinationCopy}><Text style={styles.destinationTitle}>{title}</Text><Text style={styles.hint}>{description}</Text></View>
    {count!==undefined&&<Text style={styles.count}>{count}</Text>}<View style={styles.arrowCircle}><Text style={styles.arrow}>↗</Text></View>
  </Pressable></Link>;
}

const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:'transparent'},
  page:{flexGrow:1,paddingHorizontal:26,paddingBottom:64},
  shell:{width:'100%',maxWidth:1100,alignSelf:'center'},
  hero:{paddingTop:32,paddingBottom:36,maxWidth:720},
  sectionNumber:{fontSize:10,lineHeight:17,letterSpacing:1.8,color:colors.accent,marginBottom:22},
  title:{color:colors.text,fontFamily:serif,fontSize:54,lineHeight:68,fontWeight:'400'},
  subtitle:{color:colors.secondary,fontSize:15,lineHeight:26,marginTop:22,maxWidth:400},
  professionalLayout:{flexDirection:'row',alignItems:'flex-start',gap:58,paddingTop:20},
  professionalLayoutCompact:{flexDirection:'column',gap:0,paddingTop:0},
  professionalHero:{flex:1,width:'100%'},
  professionalDestinations:{flex:1,width:'100%',paddingTop:20},
  professionalPartCompact:{flex:undefined,paddingTop:20},
  destinations:{borderTopWidth:1,borderColor:colors.border},
  destination:{minHeight:116,paddingVertical:24,borderBottomWidth:1,borderColor:colors.border,flexDirection:'row',alignItems:'center',gap:20},
  destinationNumber:{width:22,color:colors.muted,fontSize:10,letterSpacing:1},
  destinationCopy:{flex:1,minWidth:0,gap:6},
  destinationTitle:{fontFamily:serif,color:colors.text,fontSize:28,lineHeight:38,fontWeight:'400'},
  hint:{color:colors.secondary,fontSize:13,lineHeight:21},
  count:{fontFamily:serif,color:colors.accent,fontSize:25,lineHeight:34,maxWidth:'28%',textAlign:'right'},
  arrowCircle:{height:34,width:34,borderRadius:17,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},
  arrow:{color:colors.accent,fontSize:18,lineHeight:25},
  settings:{marginTop:46},
  settingRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:14},
  settingLabel:{color:colors.text,fontSize:15,lineHeight:23,flex:1},
  warning:{color:colors.amber,fontSize:13,lineHeight:21,marginVertical:10},
  storageNotice:{borderBottomWidth:1,borderColor:colors.border,paddingVertical:8},
  issueLink:{minHeight:44,justifyContent:'center',alignSelf:'flex-start'},
  pressed:{opacity:0.7},
});
