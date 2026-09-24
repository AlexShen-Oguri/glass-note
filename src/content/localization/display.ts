import type {Locale} from '../../domain/contracts';
import type {MakingRecipe} from '../../domain/making/types';
import {catalogue} from '../catalogue';
import {bottles} from '../bottles';
import {bottleDisplayName} from '../../domain/bottles/format';

/** Resolve only real public versions. Private/archived titles stay user-owned. */
export function recipeDisplayCocktail(recipe: MakingRecipe) {
  return catalogue.cocktails.find(item => item.id === recipe.version.cocktailId && item.versionIds.includes(recipe.version.id));
}

export function recipeDisplayName(recipe: MakingRecipe, locale: Locale): string {
  return recipeDisplayCocktail(recipe)?.name[locale] || recipe.title[locale] || recipe.title.en;
}

/** Localize linked public bottle annotations, never free-text private names. */
export function linkedBottleDisplay(ingredient: {name: string; bottleId?: string; bottleName?: string}, locale: Locale) {
  const bottle = bottles.find(item => item.id === ingredient.bottleId);
  const bottleName = bottle ? bottleDisplayName(bottle, locale) : ingredient.bottleName;
  const same = (a: string, b?: string) => a.trim().normalize('NFKC').toLowerCase() === b?.trim().normalize('NFKC').toLowerCase();
  const name = bottle && (same(ingredient.name, ingredient.bottleName) || same(ingredient.name, bottleDisplayName(bottle)))
    ? bottleName! : [ingredient.name, !same(ingredient.name, bottleName) ? bottleName : ''].filter(Boolean).join(' · ');
  return {name, bottle};
}
