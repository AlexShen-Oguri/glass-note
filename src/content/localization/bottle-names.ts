import type {Locale} from '../../domain/contracts';
import type {Bottle, BottleNameTranslation} from '../../domain/bottles/types';
import reviewedNames from './bottle-names.json';
import {LOCALES} from '../../domain/contracts';
import {bottleEditorialName} from './bottle-editorial';

/** Name evidence is independent of the product's market, strength and tasting sources. */
export const reviewedBottleNames = reviewedNames as Record<string, Partial<Record<Locale, BottleNameTranslation>>>;

export function applyBottleNames(bottle: Bottle): Bottle {
  const names = Object.fromEntries(LOCALES.map(locale => [locale,
    reviewedBottleNames[bottle.id]?.[locale] ?? {
      name: bottleEditorialName(bottle, locale).name,
      basis: 'editorial', sources: [],
    },
  ])) as Record<Locale, BottleNameTranslation>;
  return {
    ...bottle,
    nameTranslations: {...bottle.nameTranslations, ...names},
    // Keep reviewed names searchable in legacy selectors that read aliases directly.
    aliases: [...new Set([...bottle.aliases, ...Object.values(names).map(value => value!.name)])],
  };
}
