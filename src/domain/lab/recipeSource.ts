import type {Catalogue,Locale,RecipeVersion} from '../contracts';
import type {RecipePreparation} from '../preparations/types';
import type {LabSource} from './types';
import {preparationCopy} from '../../i18n/preparations';
import {t} from '../../i18n/ui';

/** Copy one exact source version; compound inputs stay within preparation blocks. */
export function recipeLabSource(catalogue:Catalogue,version:RecipeVersion,locale:Locale,preparation?:RecipePreparation):LabSource {
  const cocktail=catalogue.cocktails.find(c=>c.id===version.cocktailId);
  const source=catalogue.sources.find(s=>s.id===version.sourceId);
  if(!cocktail||!source||!cocktail.versionIds.includes(version.id))throw new Error('source-version-not-found');
  if(preparation&&preparation.versionId!==version.id)throw new Error('source-preparation-version-mismatch');
  const pc=preparationCopy(locale);
  const ingredients=version.ingredients.map((item,index)=>{
    const name=catalogue.ingredients.find(i=>i.id===item.ingredientId)?.name[locale]??item.ingredientId;
    const brand=item.brandId?catalogue.brands.find(b=>b.id===item.brandId)?.name:undefined;
    return {id:`source-${index}`,ingredientId:item.ingredientId,name:[name,brand,item.optional?t(locale,'optional'):undefined].filter(Boolean).join(' · '),amount:item.amount===null?'':String(item.amount),unit:item.unit};
  });
  const blocks=[`${version.label[locale]}\n${source.title}${source.author?' · '+source.author:''}`,
    `${t(locale,'servings')}: ${version.servings}`,version.steps[locale].join('\n'),
    `${t(locale,'glass')}: ${version.glass[locale]}\n${t(locale,'garnish')}: ${version.garnish[locale]}`,
    ...version.ingredients.flatMap((item,index)=>item.note?[`(${index+1}) ${ingredients[index]!.name}\n${item.note[locale]}`]:[])];
  if(preparation){
    blocks.push(`${pc.title} · ${pc[preparation.status]}\n${preparation.summary[locale]}`,pc.sourceNote);
    if(preparation.gaps.length)blocks.push(`${pc.gaps}\n${preparation.gaps.map(g=>g[locale]).join('\n')}`);
    for(const card of preparation.cards){
      const status=pc[card.status];
      blocks.push([
        `${card.title[locale]} · ${card.role==='process'?pc.process:pc.preparedIngredient} · ${status}`,
        `${card.role==='process'?pc.processInputs:pc.inputs}\n${card.inputs.map(i=>i[locale]).join('\n')}`,
        `${pc.method}\n${card.steps.map(s=>s[locale]).join('\n')}`,
        ...(['equipment','timing','temperature','yield'] as const).flatMap(key=>card[key]?[`${pc[key]}: ${card[key]![locale]}`]:[]),
        ...(card.gaps.length?[`${pc.gaps}\n${card.gaps.map(g=>g[locale]).join('\n')}`]:[]),
        ...card.sources.map(s=>`${pc.source}: ${s.title} — ${s.url}`),
      ].join('\n'));
    }
  }
  return {cocktailId:cocktail.id,versionId:version.id,title:cocktail.name[locale],sourceTitle:source.title,url:source.url,ingredients,method:blocks.join('\n\n')};
}
