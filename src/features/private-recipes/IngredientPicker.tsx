import React, {useMemo, useState} from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';

import {catalogue} from '../../content/catalogue';
import type {Ingredient, Locale} from '../../domain/contracts';
import {scoreTextSearch} from '../../domain/search';
import {colors, radii} from '../../theme/tokens';
import {privateRecipeText} from './copy';

export function IngredientPicker({locale, visible, onSelect, onClose}: {
  locale: Locale;
  visible: boolean;
  onSelect: (ingredient: Ingredient) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const items = useMemo(() => catalogue.ingredients.map(ingredient => ({
    ingredient,
    score: query.trim() ? scoreTextSearch(query, [...Object.values(ingredient.name), ...(ingredient.guide?.aliases ?? [])]) : 1,
  })).filter(item => item.score > 0).sort((left, right) => right.score - left.score
    || left.ingredient.name[locale].localeCompare(right.ingredient.name[locale])).slice(0, 80), [locale, query]);
  const close = () => { setQuery(''); onClose(); };
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.panel} onPress={event => event.stopPropagation()}>
          <View style={styles.headingRow}>
            <Text accessibilityRole="header" style={styles.heading}>{privateRecipeText(locale, 'selectIngredient')}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={privateRecipeText(locale, 'close')} onPress={close} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
          </View>
          <TextInput
            accessibilityLabel={privateRecipeText(locale, 'ingredientSearch')}
            value={query}
            onChangeText={setQuery}
            placeholder={privateRecipeText(locale, 'ingredientSearch')}
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            style={styles.search}
          />
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.results} contentContainerStyle={styles.resultContent}>
            {items.map(({ingredient}) => (
              <Pressable key={ingredient.id} accessibilityRole="button" onPress={() => { onSelect(ingredient); close(); }} style={({pressed}) => [styles.item, pressed && styles.pressed]}>
                <Text style={styles.itemName}>{ingredient.name[locale]}</Text>
                {locale === 'en' ? null : <Text style={styles.itemMeta}>{ingredient.name.en}</Text>}
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(4,8,6,0.76)', padding: 18, alignItems: 'center', justifyContent: 'center'},
  panel: {width: '100%', maxWidth: 560, maxHeight: '82%', padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: radii.large, backgroundColor: colors.panel},
  headingRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  heading: {flex: 1, color: colors.text, fontSize: 24, lineHeight: 31, fontWeight: '600'},
  close: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
  closeText: {color: colors.secondary, fontSize: 28},
  search: {minHeight: 48, marginTop: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radii.small, color: colors.text, backgroundColor: colors.background},
  results: {marginTop: 12},
  resultContent: {gap: 6, paddingBottom: 12},
  item: {minHeight: 52, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radii.small, justifyContent: 'center', backgroundColor: colors.raised},
  itemName: {color: colors.text, fontSize: 15, lineHeight: 21},
  itemMeta: {color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2},
  pressed: {opacity: 0.7},
});
