import {catalogue} from '../../content/catalogue';
import type {Locale} from '../../domain/contracts';
import {t} from '../../i18n/ui';

/** Compact identity outside the catalogue; links still carry the exact version ID. */
export function plainVersionLabel(versionId:string,locale:Locale):string{
  const cocktail=catalogue.cocktails.find(item=>item.versionIds.includes(versionId));
  const index=cocktail?.versionIds.indexOf(versionId)??-1;
  return `${t(locale,'version')}${index>=0?` ${index+1}`:''}`;
}
