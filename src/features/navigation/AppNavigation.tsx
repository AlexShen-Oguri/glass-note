import React, {useEffect, useState} from 'react';
import {Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {Link, useGlobalSearchParams, usePathname} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {PrimaryNavigationSection} from '../../domain/discovery/navigation-state';
import {primarySectionForPath, shouldShowPrimaryNavigation} from '../../domain/discovery/navigation-state';
import {appNavigationText, type AppNavigationKey} from '../../i18n/app-navigation';
import {useApp} from '../../platform/AppProvider';
import {colors, radii} from '../../theme/tokens';
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
  const selected = primarySectionForPath(pathname, queryReady ? Array.isArray(from) ? from[0] : from : undefined);

  if (!shouldShowPrimaryNavigation(pathname)) return null;

  return (
    <SafeAreaView edges={desktop ? ['top'] : ['bottom']} style={[styles.safeArea, desktop && styles.desktopSafeArea]}>
      <View
        {...(Platform.OS === 'web' ? {role: 'navigation' as const} : {})}
        accessibilityLabel={appNavigationText(locale, 'primaryNavigation')}
        style={[styles.navigation, desktop && styles.desktopNavigation]}
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
  desktopSafeArea: {paddingTop: 7, paddingHorizontal: 18, borderTopWidth: 0},
  navigation: {minHeight: 60, flexDirection: 'row', alignItems: 'stretch'},
  desktopNavigation: {
    width: '100%', maxWidth: 620, minHeight: 48, alignSelf: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill,
    backgroundColor: 'rgba(25,35,30,0.96)', overflow: 'hidden',
  },
  item: {flex: 1, minWidth: 0, minHeight: 56, paddingHorizontal: 5, paddingTop: 10, alignItems: 'center', justifyContent: 'center'},
  desktopItem: {minHeight: 46, paddingTop: 7, paddingHorizontal: 10},
  selectedItem: {backgroundColor: 'rgba(181,198,169,0.07)'},
  label: {color: colors.muted, fontSize: 12, lineHeight: 16, fontWeight: '700', textAlign: 'center'},
  desktopLabel: {fontSize: 12, lineHeight: 16},
  selectedLabel: {color: colors.text},
  indicator: {width: 22, height: 2, marginTop: 6, borderRadius: 1, backgroundColor: 'transparent'},
  selectedIndicator: {backgroundColor: colors.accent},
  pressed: {opacity: 0.66},
});
