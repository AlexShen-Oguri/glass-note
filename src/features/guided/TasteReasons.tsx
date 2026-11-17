import React from 'react';
import type {Locale} from '../../domain/contracts';
import type {TasteResult} from '../../domain/taste/types';
import {tm} from '../../i18n/taste';
import {t} from '../../i18n/ui';
import {recommendationText} from '../../i18n/recommendations';
import {useTaste} from '../../platform/TasteProvider';
import {RecommendationReason} from '../taste/RecommendationReason';

export function TasteReasons({result,locale}:{result:TasteResult;locale:Locale}){
  const taste=useTaste();
  if (!result.memoryReasons.length) return null;
  const kinds=new Set(result.memoryReasons.map(reason=>reason.kind));
  const flavours=[...new Set(result.memoryReasons.flatMap(reason=>reason.flavours??[]))];
  const primary=kinds.has('liked-version')?tm(locale,'likedVersion'):kinds.has('disliked-version')?tm(locale,'dislikedVersion'):flavours.length?tm(locale,'likedFlavour',{flavours:flavours.map(flavour=>t(locale,`flavour.${flavour}`)).join(' · ')}):recommendationText(locale,'cautiousReason');
  const caution=flavours.length&&(kinds.has('sweet-caution')||kinds.has('strong-caution'))?` ${recommendationText(locale,'cautiousReason')}`:'';
  return <RecommendationReason locale={locale} text={`${primary}${caution}`} evidenceId={result.memoryReasons.flatMap(reason=>reason.feedbackIds)[0]} disabled={taste.saving||Boolean(taste.error)}/>;
}
