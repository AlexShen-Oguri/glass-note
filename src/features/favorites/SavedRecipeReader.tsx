import React from 'react';
import {Text, View} from 'react-native';
import type {Locale, MeasureUnit, UnitPreference} from '../../domain/contracts';
import type {MakingRecipe} from '../../domain/making';
import {formatAmount} from '../../domain/search';
import {favoriteListText} from '../../i18n/favorite-lists';
import {preparationCopy} from '../../i18n/preparations';
import {t} from '../../i18n/ui';
import {favoriteStyles as styles} from './favoritesStyles';
import {RecipeExperience} from '../taste/RecipeExperience';

function localize(value: Record<Locale, string> | undefined, locale: Locale): string {
  return value?.[locale] || value?.en || '';
}

function unitLabel(locale: Locale, unit: MeasureUnit): string {
  return t(locale, `unit_${unit}` as 'unit_ml');
}

function rowLabel(recipe: MakingRecipe, ingredientId: string, locale: Locale): string {
  return localize(recipe.ingredientNames[ingredientId], locale) || ingredientId;
}

export function SavedRecipeReader({recipe, locale, unit, listId}: {recipe: MakingRecipe; locale: Locale; unit: UnitPreference; listId: string}) {
  const version = recipe.version;
  const steps = version.steps[locale] || version.steps.en;
  const preparation = recipe.preparation;
  const preparationCopyValue = preparationCopy(locale);
  return <View style={styles.snapshot}>
    <Text style={styles.snapshotHeading}>{favoriteListText(locale, 'snapshot')}</Text>
    <RecipeExperience recipe={recipe} locale={locale} listId={listId}/>
    <View>
      <Text style={styles.sourceLine}>{t(locale, 'servings')}: {version.servings}</Text>
      <Text style={styles.sourceLine}>{t(locale, 'glass')}: {localize(version.glass, locale)} · {t(locale, 'garnish')}: {localize(version.garnish, locale)}</Text>
      <Text style={styles.sourceLine}>{t(locale, 'profile')}: {localize(version.profileNote, locale)}</Text>
    </View>
    <View>
      <Text style={styles.sectionLabel}>{favoriteListText(locale, 'materials')}</Text>
      {version.ingredients.map((row, index) => {
        const amount = formatAmount(row.amount, row.unit, unit);
        const brand = row.brandId ? recipe.brandNames[row.brandId] : undefined;
        const note = row.note ? localize(row.note, locale) : '';
        return <View key={`${version.id}:ingredient:${index}`} style={styles.materialRow}>
          <Text style={styles.materialAmount}>{amount.amount ? `${amount.amount} ${unitLabel(locale, amount.unit)}` : unitLabel(locale, amount.unit)}</Text>
          <View style={{flex: 1}}>
            <Text style={styles.materialName}>{rowLabel(recipe, row.ingredientId, locale)}{brand ? `, ${brand}` : ''}</Text>
            {row.optional ? <Text style={styles.optional}>{favoriteListText(locale, 'optional')}</Text> : null}
            {note ? <Text style={styles.optional}>{note}</Text> : null}
          </View>
        </View>;
      })}
    </View>
    <View>
      <Text style={styles.sectionLabel}>{favoriteListText(locale, 'method')}</Text>
      {steps.map((step, index) => <View key={`${version.id}:step:${index}`} style={styles.stepRow}>
        <Text style={styles.stepNumber}>{index + 1}</Text>
        <Text style={styles.stepText}>{step}</Text>
      </View>)}
    </View>
    {preparation ? <View>
      <Text style={styles.sectionLabel}>{favoriteListText(locale, 'preparedComponents')}</Text>
      <Text style={styles.stepText}>{localize(preparation.summary, locale)}</Text>
      {preparation.gaps.length ? <Text style={styles.preparedText}>{preparationCopyValue.gaps}: {preparation.gaps.map((gap) => localize(gap, locale)).join(' ')}</Text> : null}
      {preparation.cards.map((card) => <View key={card.id} style={styles.preparedCard}>
        <Text style={styles.preparedTitle}>{localize(card.title, locale)}</Text>
        <Text style={styles.preparedText}>{card.role === 'prepared-ingredient' ? preparationCopyValue.preparedIngredient : preparationCopyValue.process}</Text>
        {card.inputs.length ? <Text style={styles.preparedText}>{preparationCopyValue.inputs}: {card.inputs.map((input) => localize(input, locale)).join(', ')}</Text> : null}
        {card.steps.map((step, index) => <Text key={`${card.id}:step:${index}`} style={styles.preparedText}>{index + 1}. {localize(step, locale)}</Text>)}
        {card.equipment ? <Text style={styles.preparedText}>{preparationCopyValue.equipment}: {localize(card.equipment, locale)}</Text> : null}
        {card.timing ? <Text style={styles.preparedText}>{preparationCopyValue.timing}: {localize(card.timing, locale)}</Text> : null}
        {card.temperature ? <Text style={styles.preparedText}>{preparationCopyValue.temperature}: {localize(card.temperature, locale)}</Text> : null}
        {card.yield ? <Text style={styles.preparedText}>{preparationCopyValue.yield}: {localize(card.yield, locale)}</Text> : null}
        {card.gaps.length ? <Text style={styles.preparedText}>{preparationCopyValue.gaps}: {card.gaps.map((gap) => localize(gap, locale)).join(' ')}</Text> : null}
      </View>)}
    </View> : null}
  </View>;
}
