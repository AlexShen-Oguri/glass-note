import type {Locale, Localized} from '../../domain/contracts';
import type {Bottle} from '../../domain/bottles/types';
import {editorialBottleBrands} from './bottle-brand-editorial';
import {bottleProductRows} from './bottle-product-editorial';
import {bottleVariantRows, bottleProperVariantRows} from './bottle-variant-editorial';

const words = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toLowerCase().match(/[a-z0-9]+/g) ?? [];
const phrases = new Map<string, Localized>();
for (const row of `${bottleProductRows.trim()}\n${bottleVariantRows.trim()}`.split('\n')) {
  const [source, en, zh, fr, de, es, ko, ja, it] = row.split('|') as [string, string, string, string, string, string, string, string, string];
  for (const alias of source.split('~')) phrases.set(words(alias).join(' '), {en, zh, fr, de, es, ko, ja, it});
}
for (const row of bottleProperVariantRows.trim().split('\n')) {
  const [source, zh, ko, ja] = row.split('|') as [string, string, string, string];
  phrases.set(words(source).join(' '), {en: source, fr: source, de: source, es: source, it: source, zh, ko, ja});
}
const maxPhraseWords = Math.max(...[...phrases.keys()].map(key => key.split(' ').length));

/** Source spelling variants only. No parent company or generic-family alias. */
const brandPrefixes: Record<string, string[]> = {
  'St. George Spirits': ['St George'], 'Rhum Barbancourt': ['Barbancourt'],
  'Rhum Clément': ['Clement'], 'Bacardí': ['Bacardi'], 'Martini & Rossi': ['Martini'],
  'Havana Club (Puerto Rico)': ['Havana Club'], 'Ferrand': ['Pierre Ferrand'],
  'St Elizabeth': ['St. Elizabeth'], 'Baileys': ["Bailey's"],
  'Jeppson\'s Malort': ["Jeppson's"], 'Mezcal Amarás': ['Amaras'],
  'Eda Rhyne Distilling Company': ['Eda Rhyne Distilling Co'],
  'Fee Brothers': ["Fee Brother's"], 'Casoni 1814': ['Casoni'],
  'Fernet-Branca': ['Fernet Branca'], 'Mezcal Unión': ['Mezcal Union'],
  'Ancho Reyes': ['Ancho Chile Reyes'],
};

export function bottleEditorialName(bottle: Pick<Bottle, 'brandName' | 'name'>, locale: Locale): {name: string; uncovered: string[]} {
  const numbers: string[] = [];
  const numericSource = bottle.name.replace(/\b\d+(?:\.\d+)?%|\b\d+\.\d+/g, value => {
    numbers.push(value); return ` numeral${numbers.length - 1} `;
  });
  const tokens = words(numericSource);
  const prefixes = [bottle.brandName, ...(brandPrefixes[bottle.brandName] ?? [])].map(words).sort((a, b) => b.length - a.length);
  for (const prefix of prefixes) {
    const start = tokens.findIndex((_, index) => prefix.every((part, offset) => tokens[index + offset] === part));
    if (start >= 0) {tokens.splice(start, prefix.length); break;}
  }
  const brand = ['zh', 'ko', 'ja'].includes(locale)
    ? editorialBottleBrands[bottle.brandName]?.[locale as 'zh' | 'ko' | 'ja'] ?? bottle.brandName
    : bottle.brandName;
  const translated: string[] = [];
  const uncovered: string[] = [];
  for (let index = 0; index < tokens.length;) {
    let found = false;
    for (let length = Math.min(maxPhraseWords, tokens.length - index); length > 0; length--) {
      const entry = phrases.get(tokens.slice(index, index + length).join(' '));
      if (!entry) continue;
      translated.push(entry[locale]); index += length; found = true; break;
    }
    if (!found) {
      const token = tokens[index++]!;
      const number = /^numeral(\d+)$/.exec(token);
      translated.push(number ? numbers[Number(number[1])]! : token);
      if (!number && !/^\d+$/.test(token)) uncovered.push(token);
    }
  }
  const liqueur = phrases.get('liqueur')![locale].toLocaleLowerCase();
  const parts = translated.filter((part, index) => part.toLocaleLowerCase() !== liqueur || !translated.slice(0, index).some(previous => previous.toLocaleLowerCase().endsWith(liqueur)));
  const product = parts.join(locale === 'zh' ? '' : ' ');
  return {name: [brand, product].filter(Boolean).join(' '), uncovered};
}
