import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Link, router, useFocusEffect} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useApp} from '../../platform/AppProvider';
import type {Cocktail} from '../../domain/contracts';
import {t} from '../../i18n/ui';
import {colors, radii} from '../../theme/tokens';
import {BrandToolbar, nativeDriver, serif, useViewport} from '../discovery/components';
import {useMotionEnabled} from '../motion';
import Waterfall from '../guided/Waterfall';
import {Heading} from '../navigation/Heading';
import {appNavigationText} from '../../i18n/app-navigation';
import {BrandMark} from '../brand/BrandIdentity';
import {recipeCategoryText} from '../../i18n/recipe-categories';

export default function WelcomeScreen() {
  const app = useApp();
  const {locale, motionPaused, dispatchGuided} = app;
  const {width, height} = useViewport();
  const reduceMotion = !useMotionEnabled();
  const entrance = useRef(new Animated.Value(0)).current;
  const [focused, setFocused] = useState(false);
  const compact = width < 820;

  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));

  useEffect(() => {
    if (!focused) return;
    if (reduceMotion || motionPaused) {
      entrance.stopAnimation();
      entrance.setValue(1);
      return;
    }
    const animation = Animated.timing(entrance, {
      toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [entrance, focused, motionPaused, reduceMotion]);

  const customize = () => {
    dispatchGuided({type: 'restart'});
    router.push('/customize' as never);
  };

  const openCocktail = useCallback((cocktail: Cocktail) => {
    router.push({
      pathname: '/cocktails/[id]',
      params: {id: cocktail.id, version: cocktail.defaultVersionId, from: 'welcome'},
    } as never);
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.shell}>
          <BrandToolbar {...app} showUnits={false} />
          <View style={[styles.hero, compact && styles.heroCompact, !compact && {minHeight: Math.max(520, height - 155)}]}>
            <Animated.View style={[styles.copy, compact && styles.copyCompact, {
              opacity: entrance,
              transform: [{translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [12, 0]})}],
            }]}>
              <Heading style={[styles.title, compact && styles.titleCompact, locale === 'zh' && !compact && {fontSize: Math.min(53, Math.floor((Math.min(width - 40, 1280) * 0.54 - 80) / 8))}]}>{t(locale, 'welcomeTitle')}</Heading>
              <View style={styles.choices}>
                <Pressable accessibilityRole="button" accessibilityLabel={t(locale, 'customizeMode')} onPress={customize} style={({pressed}) => [styles.choice, styles.primary, pressed && styles.pressed]}>
                  <View style={styles.choiceCopy}>
                    <Text style={styles.primaryTitle}>{t(locale, 'customizeMode')}</Text>
                    <Text style={styles.primaryDescription}>{t(locale, 'customizeDescription')}</Text>
                  </View>
                  <Text style={styles.primaryArrow}>↗</Text>
                </Pressable>
                <Link href="/discover" asChild><Pressable accessibilityRole="link" accessibilityLabel={t(locale, 'browseMode')} style={StyleSheet.flatten([styles.choice, styles.secondary])}>
                  <View style={styles.choiceCopy}>
                    <Text style={styles.secondaryTitle}>{t(locale, 'browseMode')}</Text>
                    <Text style={styles.secondaryDescription}>{t(locale, 'browseDescription')}</Text>
                  </View>
                  <Text style={styles.secondaryArrow}>→</Text>
                </Pressable></Link>
                <Link href="/topics" asChild><Pressable accessibilityRole="link" style={StyleSheet.flatten([styles.choice,styles.secondary])}>
                  <View style={styles.choiceCopy}><Text style={styles.secondaryTitle}>{recipeCategoryText(locale,'topics')}</Text><Text style={styles.secondaryDescription}>{recipeCategoryText(locale,'topicsHint')}</Text></View>
                  <Text style={styles.secondaryArrow}>→</Text>
                </Pressable></Link>
              </View>
            </Animated.View>
            <View style={[styles.visual, compact && styles.visualCompact]}>
              <Waterfall locale={locale} paused={motionPaused || !focused} reduceMotion={reduceMotion} onCocktailPress={openCocktail} height={compact ? 260 : Math.min(640, Math.max(490, height - 150))} />
              <View style={styles.visualCaption}><Text style={styles.caption}>{t(locale, 'guidedCollection')}</Text><View style={styles.captionMark}><BrandMark size={18} decorative /></View></View>
            </View>
          </View>
          <View style={styles.destinations}>
            {([['/pantry','cabinet'],['/professional','professional'],['/my','my']] as const).map(([href,label])=><Link key={href} href={href} asChild><Pressable accessibilityRole="link" style={styles.destination}><Text style={styles.destinationText}>{appNavigationText(locale,label)}</Text></Pressable></Link>)}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: 'transparent'},
  page: {flexGrow: 1, paddingHorizontal: 20, paddingBottom: 26},
  shell: {width: '100%', maxWidth: 1280, alignSelf: 'center'},
  hero: {flexDirection: 'row', alignItems: 'center', gap: 80, paddingVertical: 26},
  heroCompact: {flexDirection: 'column', alignItems: 'stretch', gap: 30, paddingTop: 30, paddingBottom: 0},
  copy: {flex: 1, paddingBottom: 24},
  copyCompact: {flex: undefined, paddingBottom: 0},
  title: {fontFamily: serif, color: colors.text, fontSize: 53, lineHeight: 66, letterSpacing: -0.8, maxWidth: 560},
  titleCompact: {fontSize: 36, lineHeight: 47, letterSpacing: -0.4},
  destinations: {flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:24,marginTop:24,borderTopWidth:1,borderColor:colors.border,paddingTop:8},
  destination: {minHeight:44,justifyContent:'center',paddingHorizontal:12},
  destinationText: {fontSize:14,lineHeight:22,color:colors.secondary},
  choices: {gap: 12, marginTop: 34, maxWidth: 440},
  choice: {minHeight: 90, paddingHorizontal: 22, paddingVertical: 18, borderRadius: radii.medium, flexDirection: 'row', alignItems: 'center', gap: 18, borderWidth: 1},
  choiceCopy: {flex: 1},
  primary: {backgroundColor: colors.accent, borderColor: colors.accent},
  primaryTitle: {color: colors.background, fontSize: 18, fontWeight: '700'},
  primaryDescription: {color: colors.accentDark, fontSize: 13, lineHeight: 20, marginTop: 6},
  primaryArrow: {color: colors.background, fontSize: 27},
  secondary: {borderColor: colors.border},
  secondaryTitle: {color: colors.text, fontSize: 18},
  secondaryDescription: {color: colors.secondary, fontSize: 13, lineHeight: 20, marginTop: 6},
  secondaryArrow: {color: colors.accent, fontSize: 24},
  pressed: {opacity: 0.76},
  visual: {width: '46%', maxWidth: 560},
  visualCompact: {width: '100%', maxWidth: undefined},
  visualCaption: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 16},
  caption: {color: colors.muted, fontSize: 11, lineHeight: 18, flex: 1},
  captionMark: {opacity: 0.55},
});
