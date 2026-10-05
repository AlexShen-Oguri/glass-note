import React, {useEffect, useState} from 'react';
import {Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {Link, useGlobalSearchParams, usePathname} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {PrimaryNavigationSection} from '../../domain/discovery/navigation-state';
import {primarySectionForPath, shouldShowPrimaryNavigation} from '../../domain/discovery/navigation-state';
import {appNavigationText, type AppNavigationKey} from '../../i18n/app-navigation';
import {useApp} from '../../platform/AppProvider';
import {colors} from '../../theme/tokens';
import {useViewport} from '../discovery/components';

interface NavigationItem {
  key: PrimaryNavigationSection;
  labelKey: AppNavigationKey;
  href: '/' | '/pantry' | '/professional' | '/my';
}

const items: readonly NavigationItem[] = [
  {key: 'explore', labelKey: 'home', href: '/'},
  {key: 'cabinet', labelKey: 'cabinet', href: '/pantry'},
  {key: 'professional', labelKey: 'professional', href: '/professional'},
  {key: 'my', labelKey: 'my', href: '/my'},
];

export function AppNavigation() {
  const pathname = usePathname();
  const {from} = useGlobalSearchParams<{from?: string | string[]}>();
  const {locale} = useApp();
  const {width} = useViewport();
  const [queryReady, setQueryReady] = useState(false);
  const [pressedItem, setPressedItem] = useState<PrimaryNavigationSection | null>(null);
  useEffect(() => setQueryReady(true), []);
  const desktop = width >= 760;
  const masthead = width >= 1024;
  const selected = primarySectionForPath(pathname, queryReady ? Array.isArray(from) ? from[0] : from : undefined);

  if (!shouldShowPrimaryNavigation(pathname)) return null;

  return (
    <SafeAreaView pointerEvents="box-none" edges={desktop ? ['top'] : ['bottom']} style={[styles.safeArea, desktop && styles.desktopSafeArea, masthead && styles.mastheadSafeArea]}>
      <View
        {...(Platform.OS === 'web' ? {role: 'navigation' as const} : {})}
        accessibilityLabel={appNavigationText(locale, 'primaryNavigation')}
        style={[styles.navigation, desktop && styles.desktopNavigation, masthead && styles.mastheadNavigation]}
      >
        {items.map((item) => {
          const active = item.key === selected && (item.href !== '/' || pathname === '/');
          const label = appNavigationText(locale, item.labelKey);
          return (
            <Link key={item.key} href={item.href} asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={label}
              accessibilityState={Platform.OS==='web'?undefined:{selected: active}}
              {...(Platform.OS === 'web' ? {'aria-current': active ? pathname === item.href ? 'page' as const : 'location' as const : undefined} : {})}
              onPressIn={() => setPressedItem(item.key)}
              onPressOut={() => setPressedItem(null)}
              style={StyleSheet.flatten([
                styles.item,
                desktop && styles.desktopItem,
                active && styles.selectedItem,
                pressedItem === item.key && styles.pressed,
              ])}
            >
              <Text numberOfLines={2} style={[styles.label, desktop && styles.desktopLabel, active && styles.selectedLabel]}>
                {label}
              </Text>
              <View style={[styles.indicator, active && styles.selectedIndicator]} />
            </Pressable></Link>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default AppNavigation;

const styles = StyleSheet.create({
  safeArea: {backgroundColor: 'rgba(16,23,20,0.98)', borderTopWidth: 1, borderTopColor: colors.border},
  desktopSafeArea: {paddingTop: 4, paddingHorizontal: 24, borderTopWidth: 0, backgroundColor: 'transparent'},
  mastheadSafeArea: {position: 'absolute', top: 24, left: '50%', width: 400, marginLeft: -200, paddingTop: 0, paddingHorizontal: 0, zIndex: 20},
  navigation: {minHeight: 60, flexDirection: 'row', alignItems: 'stretch'},
  desktopNavigation: {
    width: '100%', maxWidth: 620, minHeight: 48, alignSelf: 'center',
    borderBottomWidth: 1, borderColor: colors.border, backgroundColor: 'transparent',
  },
  mastheadNavigation: {borderBottomWidth: 0, minHeight: 44},
  item: {flex: 1, minWidth: 0, minHeight: 56, paddingHorizontal: 5, paddingTop: 10, alignItems: 'center', justifyContent: 'center'},
  desktopItem: {minHeight: 44, paddingTop: 6, paddingHorizontal: 12},
  selectedItem: {backgroundColor: 'transparent'},
  label: {color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: '500', textAlign: 'center'},
  desktopLabel: {fontSize: 12, lineHeight: 17, letterSpacing: 0.5},
  selectedLabel: {color: colors.text},
  indicator: {width: 5, height: 5, marginTop: 6, borderRadius: 3, backgroundColor: 'transparent'},
  selectedIndicator: {backgroundColor: colors.amber},
  pressed: {opacity: 0.66},
});
