import type {Locale} from '../domain/contracts';
import type {Bottle} from '../domain/bottles/types';

const copy:Record<Locale,{title:string;product:string;brand:string;note:string}>={
  en:{title:'China market references',product:'China · product record',brand:'China · brand presence only',note:'References do not establish sales rank, live stock, or identical regional packaging.'},
  zh:{title:'中国市场资料',product:'中国 · 具体瓶款资料',brand:'中国 · 仅品牌在华资料',note:'资料不代表销量排名、实时库存或各地区包装完全一致。'},
  fr:{title:'Références du marché chinois',product:'Chine · fiche produit',brand:'Chine · présence de la marque uniquement',note:'Ces références ne prouvent ni le classement des ventes, ni le stock actuel, ni un conditionnement identique.'},
  de:{title:'Quellen zum chinesischen Markt',product:'China · Produktnachweis',brand:'China · nur Markenpräsenz',note:'Die Quellen belegen keine Verkaufsrangfolge, aktuellen Lagerbestände oder identischen regionalen Verpackungen.'},
  es:{title:'Referencias del mercado chino',product:'China · ficha de producto',brand:'China · solo presencia de marca',note:'Estas referencias no acreditan ventas, existencias actuales ni envases idénticos en cada región.'},
  ko:{title:'중국 시장 자료',product:'중국 · 개별 제품 자료',brand:'중국 · 브랜드 진출 자료만 있음',note:'판매 순위, 현재 재고 또는 지역별 포장이 같다는 것을 뜻하지 않습니다.'},
  ja:{title:'中国市場の資料',product:'中国 · 個別製品の資料',brand:'中国 · ブランド展開の資料のみ',note:'販売順位、現在の在庫、地域ごとのパッケージの一致を示すものではありません。'},
  it:{title:'Riferimenti sul mercato cinese',product:'Cina · scheda prodotto',brand:'Cina · sola presenza del marchio',note:'Le fonti non attestano classifiche di vendita, scorte attuali o confezioni identiche tra mercati.'},
};
export const bottleMarketText=(locale:Locale)=>copy[locale];
export const bottleMarketSummary=(bottle:Bottle,locale:Locale)=>bottle.marketEvidence?.length
  ? copy[locale][bottle.marketEvidence.some(source=>source.scope==='product')?'product':'brand']
  : bottle.market;
