import React, {useRef} from 'react';
import {Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Link} from 'expo-router';

import type {Locale} from '../../domain/contracts';
import {professionalText, type ProfessionalKey} from '../../i18n/professional';
import {colors, radii} from '../../theme/tokens';
import {serif} from '../discovery/components';
import {Heading} from './Heading';

export type ProfessionalSection = 'lab' | 'topics' | 'bottles';
export type ProfessionalLinksVariant = 'full' | 'compact' | 'nav';

export interface ProfessionalLinksProps {
  locale: Locale;
  variant?: ProfessionalLinksVariant;
  selected?: ProfessionalSection;
  showHeading?: boolean;
}

interface Destination {
  key: ProfessionalSection;
  route: '/lab' | '/topics' | '/bottles';
  icon: string;
  titleKey: ProfessionalKey;
  descriptionKey: ProfessionalKey;
}

const destinations: readonly Destination[] = [
  {key: 'lab', route: '/lab', icon: '✦', titleKey: 'lab', descriptionKey: 'labDescription'},
  {key: 'topics', route: '/topics', icon: '⌖', titleKey: 'topics', descriptionKey: 'topicsDescription'},
  {key: 'bottles', route: '/bottles', icon: '◫', titleKey: 'bottles', descriptionKey: 'bottlesDescription'},
];

export function ProfessionalLinks({locale, variant = 'full', selected, showHeading = true}: ProfessionalLinksProps) {
  const compact = variant === 'compact';
  const navigation = variant === 'nav';
  const tabsRef=useRef<ScrollView>(null);
  const currentX=useRef(0);
  const revealCurrent=()=>tabsRef.current?.scrollTo({x:currentX.current,animated:false});

  if (navigation) return <View {...(Platform.OS === 'web' ? {role:'navigation' as const} : {})} accessibilityLabel={professionalText(locale,'title')} style={styles.navigationSection}>
    <ScrollView ref={tabsRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} onContentSizeChange={revealCurrent} onLayout={revealCurrent}>
      {destinations.map(item=><Link key={item.key} href={item.route} asChild><Pressable accessibilityRole="link" accessibilityState={Platform.OS==='web'?undefined:{selected:item.key===selected}} {...(Platform.OS==='web'?{'aria-current':item.key===selected?'page' as const:undefined}:{})} onLayout={event=>{if(item.key===selected){currentX.current=event.nativeEvent.layout.x;revealCurrent();}}} style={StyleSheet.flatten([styles.tab,item.key===selected&&styles.activeTab])}><Text style={[styles.tabText,item.key===selected&&{color:colors.text}]}>{professionalText(locale,item.titleKey)}</Text></Pressable></Link>)}
    </ScrollView>
  </View>;

  return (
    <View style={[styles.section, compact && styles.compactSection, navigation && styles.navigationSection]}>
      {showHeading ? <View style={[styles.heading, navigation && styles.navigationHeading]}>
        <Heading level={2} style={[styles.title, compact && styles.compactTitle, navigation && styles.navigationTitle]}>
          {professionalText(locale, 'title')}
        </Heading>
        {navigation ? (
          selected ? <Text style={styles.current}>{professionalText(locale, selected)}</Text> : null
        ) : (
          <Text style={[styles.description, compact && styles.compactDescription]}>
            {professionalText(locale, 'description')}
          </Text>
        )}
      </View> : null}
      <View style={[styles.cards, compact && styles.compactCards, navigation && styles.navigationCards]}>
        {destinations.map((item) => {
          const isSelected = item.key === selected;
          const title = professionalText(locale, item.titleKey);
          const description = professionalText(locale, item.descriptionKey);
          return (
            <Link key={item.key} href={item.route} asChild><Pressable
              accessibilityRole="link"
              accessibilityLabel={`${title}. ${description}`}
              accessibilityState={Platform.OS==='web'?undefined:{selected: isSelected}}
              style={StyleSheet.flatten([
                styles.card,
                compact && styles.compactCard,
                navigation && styles.navigationCard,
                isSelected && styles.selectedCard,
              ])}
            >
              <View style={styles.cardCopy}>
                <Text style={[styles.cardTitle, compact && styles.compactCardTitle, navigation && styles.navigationCardTitle, isSelected && styles.selectedCardTitle]}>
                  {title}
                </Text>
                {!navigation ? <Text style={[styles.cardDescription, compact && styles.compactCardDescription]}>{description}</Text> : null}
              </View>
              {!navigation ? <Text style={[styles.arrow, compact && styles.compactArrow]}>↗</Text> : null}
            </Pressable></Link>
          );
        })}
      </View>
    </View>
  );
}

export default ProfessionalLinks;

const styles = StyleSheet.create({
  section: {width: '100%', marginTop: 24, gap: 12},
  compactSection: {marginTop: 20, gap: 10},
  navigationSection: {minWidth:0,flex:1},
  tabs:{gap:8,alignItems:'center'},
  tab:{minHeight:44,paddingHorizontal:10,justifyContent:'center',borderBottomWidth:2,borderBottomColor:'transparent'},
  activeTab:{borderBottomColor:colors.accent},
  tabText:{fontSize:13,lineHeight:20,color:colors.secondary},
  heading: {gap: 4},
  navigationHeading: {flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 8},
  title: {fontFamily: serif, fontSize: 23, lineHeight: 30, color: colors.text},
  compactTitle: {fontSize: 19, lineHeight: 25},
  navigationTitle: {fontFamily: undefined, fontSize: 11, lineHeight: 16, letterSpacing: 1.4, fontWeight: '800', color: colors.accent, textTransform: 'uppercase'},
  current: {fontSize: 12, lineHeight: 18, color: colors.secondary},
  description: {fontSize: 12, lineHeight: 18, color: colors.secondary, maxWidth: 620},
  compactDescription: {fontSize: 11, lineHeight: 17},
  cards: {gap: 0},
  compactCards: {gap: 8},
  navigationCards: {gap: 8},
  card: {
    minHeight: 104,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactCard: {flexBasis: 145, minHeight: 88, padding: 11, gap: 9, alignItems: 'center'},
  navigationCard: {flexBasis: 100, minWidth: 94, minHeight: 50, paddingHorizontal: 10, paddingVertical: 8, gap: 7, alignItems: 'center', backgroundColor: 'transparent', borderRadius: radii.small},
  selectedCard: {backgroundColor: colors.accentDark, borderColor: colors.accent},
  icon: {width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.raised, borderWidth: 1, borderColor: colors.border},
  compactIcon: {width: 29, height: 29, borderRadius: 15},
  navigationIcon: {width: 25, height: 25, borderRadius: 13},
  selectedIcon: {backgroundColor: colors.accent, borderColor: colors.accent},
  iconText: {color: colors.accent, fontSize: 18, lineHeight: 22},
  selectedIconText: {color: colors.background},
  cardCopy: {flex: 1, minWidth: 0},
  cardTitle: {fontFamily: serif, fontSize: 18, lineHeight: 24, color: colors.text},
  compactCardTitle: {fontSize: 15, lineHeight: 20},
  navigationCardTitle: {fontFamily: undefined, fontSize: 12, lineHeight: 17, fontWeight: '700', color: colors.secondary},
  selectedCardTitle: {color: colors.text},
  cardDescription: {fontSize: 12, lineHeight: 18, color: colors.secondary, marginTop: 5},
  compactCardDescription: {fontSize: 10, lineHeight: 15, marginTop: 3},
  arrow: {color: colors.accent, fontSize: 19, lineHeight: 24},
  compactArrow: {fontSize: 16, lineHeight: 20},
  pressed: {opacity: 0.68, transform: [{scale: 0.985}]},
});
