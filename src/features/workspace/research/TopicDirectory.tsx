import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';

import {catalogue} from '../../../content/catalogue';
import type {ResearchTopic} from '../../../content/topics';
import type {Locale} from '../../../domain/contracts';
import {buildTopicDirectory, directoryCountries, directoryPage, filterTopicDirectory, type DirectoryKind, type DirectoryKindFilter, uniqueWorkCount} from '../../../domain/research/directory';
import {topicCountryText, topicDirectoryText} from '../../../i18n/topic-directory';
import {colors, radii} from '../../../theme/tokens';
import {serif} from '../../discovery/components';
import {Heading} from '../../navigation/Heading';

const PAGE_SIZE = 12;

function entryTitle(topic: ResearchTopic): string {
  return topic.kind === 'bar' ? topic.venue?.name ?? topic.competition : topic.competition;
}

function entryMeta(topic: ResearchTopic): string {
  const city = topic.venue?.city?.trim() ?? '';
  const region = topic.region.trim();
  const cityKey = city.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const regionKey = region.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const location = cityKey && regionKey && (cityKey.includes(regionKey) || regionKey.includes(cityKey))
    ? (city.length >= region.length ? city : region)
    : [city, region].filter(Boolean).join(' · ');
  const parts = [topic.year > 0 ? String(topic.year) : '', location].filter(Boolean);
  return parts.join(' · ');
}

function Choice({label, selected, onPress}: {label: string; selected: boolean; onPress: () => void}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{selected}} aria-pressed={selected}
      accessibilityLabel={label} onPress={onPress}
      style={({pressed}) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function TopicDirectory({topics, locale, onSelect}: {topics: readonly ResearchTopic[]; locale: Locale; onSelect: (topic: ResearchTopic) => void}) {
  const [kind, setKind] = useState<DirectoryKindFilter>('all');
  const [country, setCountry] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [searchFocused, setSearchFocused] = useState(false);

  const entries = useMemo(() => buildTopicDirectory(topics, catalogue, locale), [locale, topics]);
  const countries = useMemo(() => directoryCountries(entries), [entries]);
  const filtered = useMemo(() => filterTopicDirectory(entries, {text:query, kind, country}).sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === 'competition' ? -1 : 1;
    if (left.kind === 'competition' && left.topic.year !== right.topic.year) return right.topic.year - left.topic.year;
    return entryTitle(left.topic).localeCompare(entryTitle(right.topic), locale);
  }), [country, entries, kind, locale, query]);
  const page = useMemo(() => directoryPage(filtered, limit), [filtered, limit]);
  const groups = (['competition','bar'] as DirectoryKind[]).map((groupKind) => {
    const all = filtered.filter((entry) => entry.kind === groupKind);
    return {kind:groupKind, all, visible:page.items.filter((entry) => entry.kind === groupKind)};
  }).filter((group) => group.visible.length);

  const changeKind = (next: DirectoryKindFilter) => { setKind(next); setLimit(PAGE_SIZE); };
  const changeCountry = (next: string | null) => { setCountry(next); setCountryOpen(false); setLimit(PAGE_SIZE); };
  const changeQuery = (next: string) => { setQuery(next); setLimit(PAGE_SIZE); };
  const clear = () => { setKind('all'); setCountry(null); setQuery(''); setCountryOpen(false); setLimit(PAGE_SIZE); };
  const selectedCountry = country ? topicCountryText(locale, country) : topicDirectoryText(locale, 'allCountries');

  return (
    <View style={styles.directory}>
      <View style={styles.intro}>
        <Heading level={2} style={styles.title}>{topicDirectoryText(locale, 'directoryTitle')}</Heading>
        <Text style={styles.body}>{topicDirectoryText(locale, 'directoryIntro')}</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.filterBlock}>
          <Text style={styles.label}>{topicDirectoryText(locale, 'categoryLabel')}</Text>
          <View style={styles.choiceRow}>
            <Choice label={topicDirectoryText(locale, 'allTopics')} selected={kind === 'all'} onPress={() => changeKind('all')} />
            <Choice label={topicDirectoryText(locale, 'competitions')} selected={kind === 'competition'} onPress={() => changeKind('competition')} />
            <Choice label={topicDirectoryText(locale, 'bars')} selected={kind === 'bar'} onPress={() => changeKind('bar')} />
          </View>
        </View>

        <View style={styles.countryBlock}>
          <Text style={styles.label}>{topicDirectoryText(locale, 'countryLabel')}</Text>
          <Pressable accessibilityRole="button" accessibilityState={{expanded:countryOpen}} aria-expanded={countryOpen}
            accessibilityLabel={`${topicDirectoryText(locale, 'countryLabel')}: ${selectedCountry}`}
            onPress={() => setCountryOpen((value) => !value)}
            style={({pressed}) => [styles.countrySummary, pressed && styles.pressed]}>
            <Text style={styles.countryValue}>{selectedCountry}</Text>
            <Text style={styles.countryAction}>{topicDirectoryText(locale, countryOpen ? 'closeCountries' : 'chooseCountry')}</Text>
          </Pressable>
          {countryOpen ? <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.countryViewport} contentContainerStyle={styles.countryList}>
            <Choice label={topicDirectoryText(locale, 'allCountries')} selected={country === null} onPress={() => changeCountry(null)} />
            {countries.map((code) => <Choice key={code} label={topicCountryText(locale, code)} selected={country === code} onPress={() => changeCountry(code)} />)}
          </ScrollView> : null}
        </View>

        <View style={styles.searchBlock}>
          <Text style={styles.label}>{topicDirectoryText(locale, 'searchLabel')}</Text>
          <View style={[styles.search, searchFocused && styles.searchFocused]}>
            <TextInput accessibilityLabel={topicDirectoryText(locale, 'searchLabel')} autoCapitalize="none" autoCorrect={false}
              onBlur={() => setSearchFocused(false)} onFocus={() => setSearchFocused(true)} onChangeText={changeQuery}
              placeholder={topicDirectoryText(locale, 'searchPlaceholder')} placeholderTextColor={colors.muted}
              returnKeyType="search" style={styles.searchInput} value={query} />
          </View>
        </View>
      </View>

      <Text accessibilityLiveRegion="polite" style={styles.resultCount}>{topicDirectoryText(locale, 'resultSummary', {topics:filtered.length, works:uniqueWorkCount(filtered)})}</Text>

      {groups.map((group) => (
        <View key={group.kind} style={styles.group}>
          <Heading level={3} style={styles.groupTitle}>{topicDirectoryText(locale, group.kind === 'competition' ? 'competitionGroup' : 'barGroup', {topics:group.all.length, works:uniqueWorkCount(group.all)})}</Heading>
          <View style={styles.list}>
            {group.visible.map((entry) => {
              const title = entryTitle(entry.topic);
              const meta = entryMeta(entry.topic);
              const count = topicDirectoryText(locale, 'workCount', {count:entry.workCount});
              return <Pressable key={entry.topic.id} accessibilityRole="button"
                accessibilityLabel={`${topicDirectoryText(locale, 'openTopic')}: ${title}. ${meta}. ${count}`}
                onPress={() => onSelect(entry.topic)} style={({pressed}) => [styles.row, pressed && styles.rowPressed]}>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{title}</Text>
                  <Text style={styles.rowMeta}>{meta}</Text>
                </View>
                <Text style={styles.rowCount}>{count}</Text>
              </Pressable>;
            })}
          </View>
        </View>
      ))}

      {!filtered.length ? <View style={styles.empty}>
        <Heading level={3} style={styles.emptyTitle}>{topicDirectoryText(locale, 'emptyTitle')}</Heading>
        <Text style={styles.body}>{topicDirectoryText(locale, 'emptyBody')}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={topicDirectoryText(locale, 'clearFilters')} onPress={clear} style={({pressed}) => [styles.clear, pressed && styles.pressed]}>
          <Text style={styles.clearText}>{topicDirectoryText(locale, 'clearFilters')}</Text>
        </Pressable>
      </View> : null}

      {page.hasMore ? <Pressable accessibilityRole="button" accessibilityLabel={topicDirectoryText(locale, 'showMore')}
        onPress={() => setLimit((value) => value + PAGE_SIZE)} style={({pressed}) => [styles.more, pressed && styles.pressed]}>
        <Text style={styles.moreText}>{topicDirectoryText(locale, 'showMore')}</Text>
      </Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  directory:{gap:24},
  intro:{gap:7,maxWidth:720},
  title:{fontFamily:serif,color:colors.text,fontSize:26,lineHeight:34},
  body:{color:colors.secondary,fontSize:14,lineHeight:23,maxWidth:720},
  controls:{gap:16,paddingVertical:18,borderTopWidth:1,borderBottomWidth:1,borderColor:colors.border},
  filterBlock:{gap:8},countryBlock:{gap:8},searchBlock:{gap:8},
  label:{color:colors.secondary,fontSize:12,lineHeight:19,fontWeight:'700'},
  choiceRow:{flexDirection:'row',flexWrap:'wrap',gap:8},
  choice:{minHeight:44,justifyContent:'center',paddingHorizontal:14,paddingVertical:10,borderWidth:1,borderColor:colors.border,borderRadius:radii.small,backgroundColor:colors.raised},
  choiceSelected:{borderColor:colors.accent,backgroundColor:colors.accentDark},
  choiceText:{color:colors.secondary,fontSize:13,lineHeight:19,fontWeight:'700'},
  choiceTextSelected:{color:colors.text},
  countrySummary:{minHeight:48,flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:10,paddingHorizontal:12,borderWidth:1,borderColor:colors.border,borderRadius:radii.small,backgroundColor:colors.background},
  countryValue:{color:colors.text,fontSize:14,lineHeight:20,fontWeight:'700'},
  countryAction:{color:colors.accent,fontSize:12,lineHeight:18,fontWeight:'700'},
  countryViewport:{maxHeight:232,borderWidth:1,borderColor:colors.border,borderRadius:radii.small},
  countryList:{flexDirection:'row',flexWrap:'wrap',gap:8,padding:10},
  search:{minHeight:48,justifyContent:'center',borderWidth:1,borderColor:colors.border,borderRadius:radii.small,backgroundColor:colors.background,paddingHorizontal:12},
  searchFocused:{borderColor:colors.accent,outlineColor:colors.accent,outlineStyle:'solid',outlineWidth:2,outlineOffset:2} as never,
  searchInput:{minHeight:46,color:colors.text,fontSize:15,outlineStyle:'none'} as never,
  resultCount:{color:colors.muted,fontSize:12,lineHeight:19,fontVariant:['tabular-nums']},
  group:{gap:10},
  groupTitle:{color:colors.secondary,fontSize:13,lineHeight:20,fontWeight:'800'},
  list:{borderTopWidth:1,borderColor:colors.border},
  row:{minHeight:78,flexDirection:'row',alignItems:'center',gap:14,paddingVertical:14,borderBottomWidth:1,borderColor:colors.border},
  rowPressed:{backgroundColor:colors.raised},
  rowCopy:{flex:1,minWidth:0,gap:3},
  rowTitle:{color:colors.text,fontFamily:serif,fontSize:20,lineHeight:27},
  rowMeta:{color:colors.muted,fontSize:12,lineHeight:18},
  rowCount:{color:colors.accent,fontSize:12,lineHeight:18,fontWeight:'700',textAlign:'right',fontVariant:['tabular-nums'],maxWidth:'30%'},
  empty:{gap:8,paddingVertical:20,borderTopWidth:1,borderBottomWidth:1,borderColor:colors.border},
  emptyTitle:{color:colors.text,fontFamily:serif,fontSize:21,lineHeight:28},
  clear:{minHeight:44,alignSelf:'flex-start',justifyContent:'center',paddingVertical:10,paddingRight:12},
  clearText:{color:colors.accent,fontSize:13,lineHeight:19,fontWeight:'700'},
  more:{minHeight:48,alignSelf:'stretch',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.border,borderRadius:radii.small},
  moreText:{color:colors.accent,fontSize:13,lineHeight:19,fontWeight:'700'},
  pressed:{opacity:0.72},
});
