import React, {useCallback, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Link, router, useFocusEffect} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useApp} from '../../platform/AppProvider';
import {catalogue} from '../../content/catalogue';
import {waterfallPreview} from '../../domain/guided/waterfall';
import {media} from '../../media';
import {t} from '../../i18n/ui';
import {colors} from '../../theme/tokens';
import {BrandToolbar, isAiMedia, PhotoFrame, serif, useViewport} from '../discovery/components';
import {MotionEntrance} from '../motion/primitives';
import {motionData} from '../motion/attributes';
import {Heading} from '../navigation/Heading';
import {recipeCategoryText} from '../../i18n/recipe-categories';
import {appNavigationText} from '../../i18n/app-navigation';

export default function WelcomeScreen() {
  const app = useApp();
  const {locale, dispatchGuided} = app;
  const {width, height} = useViewport();
  const [focused, setFocused] = useState(false);
  const compact = width < 820;
  const previews = useMemo(() => waterfallPreview(catalogue.cocktails).slice(0, 3), []);

  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));

  const customize = () => {
    dispatchGuided({type: 'restart'});
    router.push('/customize' as never);
  };

  const title = locale === 'zh' ? '今天你想\n喝点什么' : t(locale, 'welcomeTitle');
  const titleSize = compact ? locale === 'zh' ? 61 : 48 : locale === 'zh' ? Math.min(94, width * 0.069) : 70;
  const stage = (
    <View testID="night-home-stage" style={[styles.visual, compact && styles.visualCompact, !compact && {minHeight: Math.max(530, height - 230)}]}>
      <View style={[styles.archive, compact && styles.archiveCompact]}>
        {(compact ? previews.slice(0, 1) : previews).map((cocktail, index) => {
          const asset = media[cocktail.id];
          return <Link key={cocktail.id} asChild href={{pathname: '/cocktails/[id]', params: {id: cocktail.id, version: cocktail.defaultVersionId, from: 'welcome'}} as never}><Pressable accessibilityRole="link" accessibilityLabel={`${cocktail.name[locale]}. ${t(locale, 'viewRecipe')}`} style={StyleSheet.flatten([styles.archiveItem, index === 1 && styles.archiveRaised, compact && styles.archiveItemCompact])}>
            <View {...motionData({motionPhoto: cocktail.id})}><PhotoFrame asset={asset} accent={cocktail.accent} locale={locale} height={compact ? 86 : 126} borderRadius={0}/></View>
            <Text style={styles.archiveName} numberOfLines={1}>{String(index + 1).padStart(2, '0')} / {cocktail.name.en}</Text>
            <Text style={styles.archiveCredit} numberOfLines={1}>{asset && isAiMedia(asset) ? t(locale, 'aiImage') : asset ? `${asset.author}${asset.license ? ` · ${asset.license}` : ''}` : undefined}</Text>
          </Pressable></Link>;
        })}
      </View>
      <Text style={[styles.visualCaption, compact && styles.visualCaptionCompact]}>{t(locale, 'guidedCollection')} / {catalogue.cocktails.length}</Text>
    </View>
  );

  const entries = <View style={styles.choices}>
    <Pressable accessibilityRole="button" accessibilityLabel={t(locale, 'customizeMode')} onPress={customize} style={({pressed}) => [styles.choice, pressed && styles.pressed]}>
      <Text style={styles.choiceNumber}>01</Text><View style={styles.choiceCopy}><Text style={[styles.choiceTitle, styles.primaryTitle]}>{t(locale, 'customizeMode')}</Text><Text style={styles.choiceDescription}>{t(locale, 'customizeDescription')}</Text></View><View style={styles.choiceArrow}><Text style={styles.arrowText}>↗</Text></View>
    </Pressable>
    <Link href="/discover" asChild><Pressable accessibilityRole="link" accessibilityLabel={t(locale, 'browseMode')} style={styles.choice}>
      <Text style={styles.choiceNumber}>02</Text><View style={styles.choiceCopy}><Text style={styles.choiceTitle}>{t(locale, 'browseMode')}</Text><Text style={styles.choiceDescription}>{t(locale, 'browseDescription')}</Text></View><View style={styles.choiceArrow}><Text style={styles.arrowText}>→</Text></View>
    </Pressable></Link>
    <Link href="/topics" asChild><Pressable accessibilityRole="link" style={styles.choice}>
      <Text style={styles.choiceNumber}>03</Text><View style={styles.choiceCopy}><Text style={styles.choiceTitle}>{recipeCategoryText(locale, 'topics')}</Text><Text style={styles.choiceDescription}>{recipeCategoryText(locale, 'topicsHint')}</Text></View><View style={styles.choiceArrow}><Text style={styles.arrowText}>→</Text></View>
    </Pressable></Link>
  </View>;

  return <SafeAreaView {...motionData({nightHome: ''})} style={styles.screen} edges={['top', 'bottom']}>
    <ScrollView contentContainerStyle={[styles.page, compact && styles.pageCompact]}>
      <View style={styles.shell}>
        <BrandToolbar {...app} showUnits={false}/>
        <View style={[styles.hero, compact && styles.heroCompact]}>
          <MotionEntrance active={focused} testID="night-home-copy" style={[styles.copy, compact && styles.copyCompact]}>
            <View style={styles.kicker}><View style={styles.kickerRule}/><Text style={styles.kickerText}>GLASS NOTES / {t(locale, 'browseMode')}</Text></View>
            <Heading accessibilityLabel={t(locale, 'welcomeTitle')} style={[styles.title, {fontSize: titleSize, lineHeight: titleSize * 1.17}, compact && styles.titleCompact]}>{title}</Heading>
            <Text style={styles.subtitle}>{t(locale, 'welcomeSubtitle')}</Text>
            {compact ? stage : entries}
          </MotionEntrance>
          {compact ? entries : stage}
        </View>
        <View style={styles.destinations}>
          {([['/pantry', 'cabinet'], ['/professional', 'professional'], ['/my', 'my']] as const).map(([href, label]) => <Link key={href} href={href} asChild><Pressable accessibilityRole="link" accessibilityLabel={appNavigationText(locale, label)} style={styles.destination}><Text style={styles.destinationText}>{appNavigationText(locale, label)}</Text><Text style={styles.destinationArrow}>↗</Text></Pressable></Link>)}
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: 'transparent'},
  page: {flexGrow: 1, paddingHorizontal: 48, paddingBottom: 32},
  pageCompact: {paddingHorizontal: 26, paddingBottom: 34},
  shell: {width: '100%', maxWidth: 1360, alignSelf: 'center'},
  hero: {flexDirection: 'row', alignItems: 'center', gap: 38, paddingTop: 20},
  heroCompact: {flexDirection: 'column', alignItems: 'stretch', gap: 0, paddingTop: 20},
  copy: {width: '53%', minWidth: 0, paddingBottom: 24},
  copyCompact: {width: '100%', paddingBottom: 0},
  kicker: {flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 26},
  kickerRule: {width: 32, height: 1, backgroundColor: colors.accent},
  kickerText: {color: colors.accent, fontSize: 10, lineHeight: 16, letterSpacing: 1.4, textTransform: 'uppercase', flexShrink: 1},
  title: {fontFamily: serif, color: colors.text, fontWeight: '400', letterSpacing: -1.7, maxWidth: 720},
  titleCompact: {letterSpacing: -0.8},
  subtitle: {color: colors.secondary, fontSize: 13, lineHeight: 23, marginTop: 20, maxWidth: 460},
  choices: {width: '100%', maxWidth: 550, marginTop: 30},
  choice: {minHeight: 82, paddingVertical: 15, borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 16},
  choiceNumber: {width: 23, color: colors.muted, fontSize: 10, letterSpacing: 1},
  choiceCopy: {flex: 1, minWidth: 0},
  choiceTitle: {fontFamily: serif, fontWeight: '400', color: colors.text, fontSize: 26, lineHeight: 34},
  primaryTitle: {color: colors.accent},
  choiceDescription: {color: colors.secondary, fontSize: 12, lineHeight: 19, marginTop: 4},
  choiceArrow: {width: 36, height: 36, borderWidth: 1, borderColor: colors.border, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  arrowText: {color: colors.accent, fontSize: 20, lineHeight: 27},
  pressed: {opacity: 0.7},
  visual: {width: '44%', minWidth: 0, alignSelf: 'stretch', justifyContent: 'flex-end', paddingBottom: 36},
  visualCompact: {width: '100%', height: 320, minHeight: 320, paddingBottom: 0},
  archive: {flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 17},
  archiveCompact: {position: 'absolute', right: 0, top: 70, flexDirection: 'column', gap: 8},
  archiveItem: {width: 88},
  archiveRaised: {marginBottom: 26},
  archiveItemCompact: {width: 62, marginBottom: 0},
  archiveName: {color: colors.secondary, fontSize: 9, lineHeight: 15, letterSpacing: 0.4, marginTop: 8},
  archiveCredit: {color: colors.muted, fontSize: 8, lineHeight: 13, marginTop: 2},
  visualCaption: {color: colors.muted, fontSize: 10, lineHeight: 16, letterSpacing: 1, textAlign: 'right', marginTop: 26},
  visualCaptionCompact: {position: 'absolute', left: 0, bottom: 16, fontSize: 9, textAlign: 'left'},
  destinations: {flexDirection: 'row', gap: 20, borderTopWidth: 1, borderColor: colors.border, marginTop: 28, paddingTop: 8},
  destination: {flex: 1, minWidth: 0, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 10},
  destinationText: {fontFamily: serif, fontSize: 18, lineHeight: 26, color: colors.secondary, flexShrink: 1},
  destinationArrow: {fontSize: 15, lineHeight: 22, color: colors.accent},
});
