import React, {useMemo} from 'react';
import {Image, Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Link, router} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useApp} from '../../platform/AppProvider';
import {catalogue} from '../../content/catalogue';
import {media} from '../../media';
import {t} from '../../i18n/ui';
import {colors} from '../../theme/tokens';
import {BrandToolbar, isAiMedia, serif, useViewport} from '../discovery/components';
import {useSceneTransition} from '../motion/SceneTransition';
import {motionData} from '../motion/attributes';
import {recipeCategoryText} from '../../i18n/recipe-categories';
import {appNavigationText} from '../../i18n/app-navigation';

const cover = {ivory: '#f0ebdf', muted: '#a7b3a7', line: 'rgba(181,198,169,.24)'};

export default function WelcomeScreen() {
  const app = useApp();
  const {run}=useSceneTransition();
  const {locale, dispatchGuided} = app;
  const {width, height} = useViewport();
  const compact = width <= 700;
  const short = !compact && height <= 800;
  const narrow = !compact && width <= 1100;
  const large = width >= 1600;
  const previews = useMemo(() => ['alexander', 'old-fashioned', 'negroni'].flatMap(id => {
    const cocktail = catalogue.cocktails.find(item => item.id === id);
    return cocktail ? [cocktail] : [];
  }), []);
  const titleSize = compact ? 61 : short ? Math.min(100, Math.max(75, width * .069)) : narrow ? 85 : Math.min(126, Math.max(75, width * .078));
  const lineHeight = titleSize * (compact ? 1.11 : short ? 1.09 : 1.13);
  const scenePadding = width * (compact ? .07 : .061);
  const mask = {paddingBottom: titleSize * .11, marginBottom: -titleSize * .11};
  const titleStyle = {fontSize: titleSize, lineHeight, letterSpacing: titleSize * -.065};

  const customize = () => run(() => {
    dispatchGuided({type: 'restart'});
    router.push('/customize' as never);
  },{label:'一杯'});
  const entries = [
    {number: '01', title: t(locale, 'customizeMode'), description: t(locale, 'customizeDescription'), action: customize, primary: true},
    {number: '02', title: t(locale, 'browseMode'), description: t(locale, 'browseDescription'), href: '/discover' as const},
    {number: '03', title: recipeCategoryText(locale, 'topics'), description: recipeCategoryText(locale, 'topicsHint'), href: '/topics' as const},
  ];

  return <SafeAreaView {...motionData({nightHome: ''})} style={styles.screen} edges={['top']}>
    <ScrollView contentContainerStyle={styles.page}>
      <BrandToolbar {...app} showUnits={false} variant="home"/>
      <View {...motionData({sceneContent:''})} testID="night-home-copy" style={[styles.scene, {paddingHorizontal: scenePadding, minHeight: compact ? 0 : height - 220, paddingTop: compact ? 23 : short ? 20 : large ? 75 : 51}]}>
        <View {...motionData({motionPart: 'kicker'})} style={[styles.kicker, compact && styles.kickerCompact]}><View style={[styles.kickerRule, compact && styles.kickerRuleCompact]}/><Text style={[styles.kickerText, compact && styles.kickerTextCompact]}>GLASS NOTES / EVERY TASTE TELLS A STORY</Text></View>
        <View {...motionData({motionHeading: 'home'})} testID="night-home-title" accessibilityRole="header" accessibilityLabel={t(locale, 'welcomeTitle')} {...(Platform.OS === 'web' ? {'aria-level': 1} : {})} pointerEvents="none" style={[styles.heading, {width: compact ? '100%' : narrow ? '70%' : '66%', marginTop: compact ? 26 : short ? 20 : large ? 40 : 27}]}>
          {locale === 'zh' ? <>
            <View style={[styles.lineMask, mask]}><Text {...motionData({motionPart: 'title-line'})} style={[styles.title, titleStyle]}>今天你想</Text></View>
            <View style={[styles.lineMask, mask, {paddingLeft: compact ? (width - scenePadding * 2) * .07 : width * .046}]}><Text {...motionData({motionPart: 'title-line'})} style={[styles.title, titleStyle]}>喝点<Text style={styles.titleAccent}>什么</Text></Text></View>
          </> : <View style={[styles.lineMask, mask]}><Text {...motionData({motionPart: 'title-line'})} style={[styles.title, titleStyle]}>{t(locale, 'welcomeTitle')}</Text></View>}
        </View>
        <Text {...motionData({motionPart: 'detail'})} style={[styles.subtitle, {marginLeft: compact ? (width - scenePadding * 2) * .07 : width * .05, marginTop: compact ? 16 : short ? 14 : 18}, compact && styles.subtitleCompact]}>{locale === 'zh' ? '让这一杯，刚好属于此刻。' : t(locale, 'welcomeSubtitle')}</Text>
        <View style={[styles.choices, {maxWidth: compact ? '100%' : short ? 490 : narrow ? 460 : large ? 600 : 530, marginTop: compact ? 365 : short ? 24 : large ? 65 : 40}]}>
          {entries.map(entry => {
            const button = <Pressable {...motionData({motionPart: 'entry', nightEntry: entry.number})} accessibilityRole={entry.href ? 'link' : 'button'} accessibilityLabel={entry.title} onPress={entry.action} style={StyleSheet.flatten([styles.choice, compact && styles.choiceCompact, short && styles.choiceShort])}>
              <View {...motionData({nightRule:''})} pointerEvents="none" style={styles.choiceRule}/>
              <Text style={[styles.choiceNumber, compact && styles.choiceNumberCompact]}>{entry.number}</Text><View style={styles.choiceCopy}><Text style={[styles.choiceTitle, compact && styles.choiceTitleCompact, entry.primary && styles.primaryTitle]}>{entry.title}</Text><Text style={[styles.choiceDescription, compact && styles.choiceDescriptionCompact]}>{entry.description}</Text></View><View style={[styles.arrowTrack, compact && styles.arrowTrackCompact]}><View {...motionData({nightArrow:''})} style={styles.choiceArrow}><Text style={styles.arrowText}>↗</Text></View></View>
            </Pressable>;
            return entry.href ? <Link key={entry.number} href={entry.href} asChild>{button}</Link> : <React.Fragment key={entry.number}>{button}</React.Fragment>;
          })}
        </View>
        <View {...motionData({motionPart: 'archive'})} style={[styles.archive, {right: width * (compact ? .05 : narrow ? .04 : .058), bottom: compact ? undefined : short ? 44 : large ? 65 : 74}, compact && styles.archiveCompact, narrow && styles.archiveNarrow]}>
          {(compact ? previews.slice(0, 1) : previews).map((cocktail, index) => {
            const asset = media[cocktail.id];
            return <Link key={cocktail.id} asChild href={{pathname: '/cocktails/[id]', params: {id: cocktail.id, version: cocktail.defaultVersionId, from: 'welcome'}} as never}><Pressable accessibilityRole="link" accessibilityLabel={`${cocktail.name[locale]}. ${t(locale, 'viewRecipe')}`} accessibilityHint={asset && isAiMedia(asset) ? t(locale, 'aiImage') : asset ? `${asset.author}${asset.license ? ` · ${asset.license}` : ''}` : undefined} style={StyleSheet.flatten([styles.archiveItem, index === 1 && styles.archiveRaised, narrow && styles.archiveItemNarrow, compact && styles.archiveItemCompact])}>
              <View {...motionData({motionPhoto: cocktail.id})} style={[styles.archivePhoto, narrow && styles.archivePhotoNarrow, compact && styles.archivePhotoCompact]}>{asset && <Image source={{uri: asset.uri}} resizeMode="cover" style={StyleSheet.absoluteFill} accessibilityLabel={isAiMedia(asset) ? t(locale, 'aiImage') : t(locale, 'photograph')}/>}</View>
              <Text style={[styles.archiveName, compact && styles.archiveNameCompact]}>{String(index + 1).padStart(2, '0')} / {cocktail.name.en}</Text>
            </Pressable></Link>;
          })}
        </View>
        {!compact && <View style={[styles.collection, {right: width * .07}]}><View style={styles.collectionRule}/><Text style={styles.collectionText}>THE COLLECTION</Text><Text style={styles.collectionText}>{catalogue.cocktails.length} RECIPES</Text></View>}
      </View>
    </ScrollView>
    <SafeAreaView edges={compact ? ['bottom'] : []} {...(Platform.OS === 'web' ? {role: 'navigation' as const} : {})} accessibilityLabel={appNavigationText(locale, 'primaryNavigation')} style={[styles.homeNav, {left: compact ? 0 : width * .061}, compact && styles.homeNavCompact]}>
      {([['/', 'home'], ['/pantry', 'cabinet'], ['/professional', 'professional'], ['/my', 'my']] as const).map(([href, label]) => <Link key={href} href={href} asChild><Pressable accessibilityRole="link" accessibilityLabel={appNavigationText(locale, label)} {...(Platform.OS === 'web' && href === '/' ? {'aria-current': 'page' as const} : {})} style={StyleSheet.flatten([styles.destination, compact && styles.destinationCompact])}><Text style={[styles.destinationText, href === '/' && styles.destinationActive]}>{appNavigationText(locale, label)}</Text></Pressable></Link>)}
    </SafeAreaView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: 'transparent'},
  page: {flexGrow: 1, paddingBottom: 120},
  scene: {position: 'relative', width: '100%'},
  kicker: {flexDirection: 'row', alignItems: 'center', gap: 15},
  kickerCompact: {gap: 10},
  kickerRule: {width: 32, height: 1, backgroundColor: colors.accent},
  kickerRuleCompact: {width: 22},
  kickerText: {color: colors.accent, fontSize: 10, lineHeight: 16, letterSpacing: 2.5},
  kickerTextCompact: {fontSize: 8, lineHeight: 12.8, letterSpacing: 1.36},
  heading: {position: 'relative', zIndex: 2},
  lineMask: {overflow: 'hidden'},
  title: {fontFamily: serif, color: cover.ivory, fontWeight: '400'},
  titleAccent: {color: colors.accent, fontWeight: '400'},
  subtitle: {color: cover.muted, fontSize: 12, lineHeight: 19.2, letterSpacing: .48},
  subtitleCompact: {fontSize: 10, lineHeight: 16, letterSpacing: .4},
  choices: {width: '100%'},
  choice: {minHeight: 74, paddingVertical: 13, borderBottomWidth: 1, borderColor: cover.line, flexDirection: 'row', alignItems: 'center'},
  choiceCompact: {minHeight: 78},
  choiceShort: {minHeight: 65, paddingVertical: 9},
  choiceRule: {position:'absolute',bottom:-1,left:0,right:0,height:1,backgroundColor:colors.accent,transform:[{scaleX:0}],...(Platform.OS==='web'?{transformOrigin:'left'} as never:{})},
  choiceNumber: {width: 35, color: cover.muted, fontSize: 10, lineHeight: 16, letterSpacing: 1.2},
  choiceNumberCompact: {width: 28},
  choiceCopy: {flex: 1, minWidth: 0},
  choiceTitle: {fontFamily: serif, fontWeight: '400', color: cover.ivory, fontSize: 25, lineHeight: 31.25},
  choiceTitleCompact: {fontSize: 24, lineHeight: 30},
  primaryTitle: {color: colors.accent},
  choiceDescription: {color: cover.muted, fontSize: 11, lineHeight: 17.6, marginTop: 5},
  choiceDescriptionCompact: {fontSize: 10, lineHeight: 16},
  arrowTrack: {width: 42, minHeight: 44, justifyContent: 'center'},
  arrowTrackCompact: {width: 35},
  choiceArrow: {width: 36, height: 36, borderWidth: 1, borderColor: cover.line, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  arrowText: {color: cover.ivory, fontSize: 15, lineHeight: 24},
  archive: {position: 'absolute', flexDirection: 'row', alignItems: 'flex-end', gap: 17},
  archiveCompact: {top: 356, gap: 0, opacity: .85},
  archiveNarrow: {gap: 10},
  archiveItem: {width: 96},
  archiveRaised: {marginBottom: 24},
  archiveItemNarrow: {width: 70},
  archiveItemCompact: {width: 65, marginBottom: 0},
  archivePhoto: {height: 119, overflow: 'hidden'},
  archivePhotoNarrow: {height: 92},
  archivePhotoCompact: {height: 86},
  archiveName: {color: cover.muted, fontSize: 9, lineHeight: 14.4, letterSpacing: .9, marginTop: 8},
  archiveNameCompact: {fontSize: 8, lineHeight: 12.8, letterSpacing: .8},
  collection: {position: 'absolute', bottom: 35, flexDirection: 'row', alignItems: 'center', gap: 16},
  collectionRule: {width: 47, height: 1, backgroundColor: cover.line},
  collectionText: {color: cover.muted, fontSize: 10, lineHeight: 16, letterSpacing: 1.5},
  homeNav: {position: 'absolute', bottom: 33, flexDirection: 'row', alignItems: 'center', gap: 35, zIndex: 10},
  homeNavCompact: {right: 0, bottom: 0, gap: 0, justifyContent: 'space-around', backgroundColor: '#142019', borderTopWidth: 1, borderColor: cover.line, paddingTop: 5, paddingHorizontal: 9, paddingBottom: 8},
  destination: {minHeight: 44, justifyContent: 'center'},
  destinationCompact: {minWidth: 65, height: 49},
  destinationText: {fontSize: 11, lineHeight: 17.6, letterSpacing: 1.65, color: cover.muted},
  destinationActive: {color: cover.ivory},
});
