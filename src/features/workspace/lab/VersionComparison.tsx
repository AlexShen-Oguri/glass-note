import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {Locale} from '../../../domain/contracts';
import type {LabVersion} from '../../../domain/lab/types';
import {labRefinementText} from '../../../i18n/lab-refinement';
import {colors, radii} from '../../../theme/tokens';
import {Action, Panel, ws} from '../ui';
import {initialVersionSelection, reconcileVersionSelection} from './selection';
import {VersionComparisonTable} from './VersionComparisonTable';
import {useApp} from '../../../platform/AppProvider';

type Copy = (key: 'needTwo' | 'ingredients' | 'method' | 'notes') => string;
type FieldKey = 'ingredients' | 'method' | 'notes';
const fields: FieldKey[] = ['ingredients', 'method', 'notes'];

function valueSignature(version: LabVersion, key: FieldKey): string {
  if (key !== 'ingredients') return version[key];
  return JSON.stringify(version.ingredients.map(({name, amount, unit, ingredientId, bottleId, bottleName}) => ({
    name, amount, unit, ingredientId, bottleId, bottleName,
  })));
}

export function VersionComparison({versions, l, locale}: {versions: LabVersion[]; l: Copy; locale: Locale}) {
  const versionIds = useMemo(() => versions.map(version => version.id), [versions]);
  const [selected, setSelected] = useState(() => initialVersionSelection(versionIds));
  const {unit} = useApp();
  const text = (key: Parameters<typeof labRefinementText>[1]) => labRefinementText(locale, key);

  useEffect(() => {
    setSelected(current => {
      const next = reconcileVersionSelection(current, versionIds);
      return next.length === current.length && next.every((id, index) => id === current[index]) ? current : next;
    });
  }, [versionIds]);

  if (versions.length < 2) return <Panel><Text style={ws.body}>{l('needTwo')}</Text></Panel>;
  const selectedVersions = reconcileVersionSelection(selected, versionIds)
    .map(id => versions.find(version => version.id === id))
    .filter((version): version is LabVersion => Boolean(version));
  const fieldShared = Object.fromEntries(fields.map(key => [
    key,
    selectedVersions.every(version => valueSignature(version, key) === valueSignature(selectedVersions[0]!, key)),
  ])) as Record<FieldKey, boolean>;
  const toggle = (id: string) => setSelected(current => {
    const stable = reconcileVersionSelection(current, versionIds);
    if (stable.includes(id)) return stable.length > 2 ? stable.filter(value => value !== id) : stable;
    return stable.length < 3 ? [...stable, id] : stable;
  });

  return <View style={styles.root}>
    <Panel title={text('chooseVersions')}>
      <Text style={ws.muted}>{text('chooseVersionsHint')}</Text>
      <View style={ws.row}>{versions.map((version, index) => {
        const isSelected = selectedVersions.some(item => item.id === version.id);
        const disabled = (isSelected && selectedVersions.length <= 2) || (!isSelected && selectedVersions.length >= 3);
        return <Action key={version.id} label={version.name || `v${index + 1}`} selected={isSelected} disabled={disabled} onPress={() => toggle(version.id)}/>;
      })}</View>
    </Panel>
    <Panel title={text('comparisonSummary')}>
      <View style={styles.summary}>{fields.map(key => <View key={key} style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>{l(key)}</Text>
        <Text style={[styles.badge, fieldShared[key] ? styles.shared : styles.differs]}>{text(fieldShared[key] ? 'shared' : 'differs')}</Text>
      </View>)}</View>
    </Panel>
    <VersionComparisonTable versions={selectedVersions} locale={locale} unit={unit}/>
  </View>;
}

const styles = StyleSheet.create({
  root: {gap: 16},
  summary: {gap: 10},
  summaryRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  summaryLabel: {flex: 1, color: colors.secondary, fontSize: 14, lineHeight: 21},
  badge: {overflow: 'hidden', borderRadius: radii.small, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, lineHeight: 16, fontWeight: '700'},
  shared: {color: colors.accent, borderColor: colors.accentDark, backgroundColor: colors.background},
  differs: {color: colors.text, borderColor: colors.border, backgroundColor: colors.raised},
});
