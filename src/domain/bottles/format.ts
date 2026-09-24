import type {Bottle} from './types';
import {normalizeSearchText} from '../search';
import type {Locale} from '../contracts';

/** Product names such as "London Dry Gin" need their brand in standalone selectors. */
export function bottleDisplayName(
  bottle:Pick<Bottle,'name'|'brandName'|'nameTranslations'>,
  locale?:Locale,
):string {
  const canonical=normalizeSearchText(bottle.name).includes(normalizeSearchText(bottle.brandName))
    ? bottle.name : `${bottle.brandName} ${bottle.name}`;
  const translated=locale?bottle.nameTranslations?.[locale]?.name.trim():'';
  return translated||canonical;
}

/** Search every recorded identity without duplicating equivalent brand/name values. */
export function bottleSearchNames(
  bottle:Pick<Bottle,'name'|'brandName'|'aliases'|'nameTranslations'>,
):string[] {
  const names=[
    bottleDisplayName(bottle),
    bottle.brandName,
    bottle.name,
    ...bottle.aliases,
    ...Object.values(bottle.nameTranslations??{}).map(translation=>translation?.name??''),
  ];
  const seen=new Set<string>();
  return names.filter(value=>{
    const key=normalizeSearchText(value);
    if(!key||seen.has(key))return false;
    seen.add(key);
    return true;
  });
}
