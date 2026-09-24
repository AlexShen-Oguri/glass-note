import type {Catalogue, Locale, RecipeVersion} from '../contracts';
import type {LabProject, LabSource, LabVersion} from '../lab/types';
import type {PrivateIngredient, PrivateRecipeContent, PrivateRecipeOrigin} from './types';

export function clonePrivateRecipeContent(content: PrivateRecipeContent): PrivateRecipeContent {
  return {...content, ingredients: content.ingredients.map(item => ({...item})), steps: [...content.steps]};
}

function ingredientName(catalogue: Catalogue, versionIngredient: RecipeVersion['ingredients'][number], locale: Locale) {
  return catalogue.ingredients.find(item => item.id === versionIngredient.ingredientId)?.name[locale] ?? versionIngredient.ingredientId;
}

export function catalogueRecipeContent(catalogue: Catalogue, version: RecipeVersion, locale: Locale): PrivateRecipeContent {
  const cocktail = catalogue.cocktails.find(item => item.id === version.cocktailId);
  if (!cocktail || !cocktail.versionIds.includes(version.id)) throw new Error('private-recipe-source-version-not-found');
  return {
    title: cocktail.name[locale],
    description: cocktail.description[locale],
    servings: version.servings,
    ingredients: version.ingredients.map((item, index): PrivateIngredient => {
      const brandName = item.brandId ? catalogue.brands.find(brand => brand.id === item.brandId)?.name : undefined;
      return {
        id: `ingredient-${index + 1}`,
        name: ingredientName(catalogue, item, locale),
        amount: item.amount === null ? '' : String(item.amount),
        unit: item.unit,
        ingredientId: item.ingredientId,
        ...(item.brandId ? {brandId: item.brandId} : {}),
        ...(brandName ? {brandName} : {}),
        ...(item.note ? {note: item.note[locale]} : {}),
        ...(item.optional ? {optional: true} : {}),
      };
    }),
    steps: [...version.steps[locale]],
    method: '',
    glass: version.glass[locale],
    garnish: version.garnish[locale],
    notes: '',
  };
}

export function catalogueRecipeOrigin(catalogue: Catalogue, versionId: string, locale: Locale, capturedAt: string): PrivateRecipeOrigin {
  const version = catalogue.versions.find(item => item.id === versionId);
  if (!version) throw new Error('private-recipe-source-version-not-found');
  const source = catalogue.sources.find(item => item.id === version.sourceId);
  if (!source) throw new Error('private-recipe-source-not-found');
  const content = catalogueRecipeContent(catalogue, version, locale);
  return {
    kind: 'catalogue-version',
    cocktailId: version.cocktailId,
    versionId: version.id,
    sourceId: source.id,
    sourceTitle: source.title,
    sourceUrl: source.url,
    ...(source.author ? {sourceAuthor: source.author} : {}),
    versionTitle: version.label[locale],
    capturedAt,
    capturedLocale: locale,
    snapshot: clonePrivateRecipeContent(content),
  };
}

function cloneLabSource(source: LabSource): LabSource {
  return {...source, ingredients: source.ingredients.map(item => ({...item}))};
}

export function labRecipeContent(project: LabProject, version: LabVersion): PrivateRecipeContent {
  if (!project.versions.some(item => item.id === version.id)) throw new Error('private-recipe-lab-version-not-found');
  const ingredients = version.ingredients
    .filter(item => item.name.trim() || item.bottleName?.trim())
    .map(item => ({...item, name: item.name.trim() || item.bottleName!.trim()}));
  return {
    title: project.name.trim() || version.name.trim() || version.id,
    description: project.goal,
    servings: 1,
    ingredients,
    steps: [],
    method: version.method,
    glass: '',
    garnish: '',
    notes: version.notes,
  };
}

export function labRecipeOrigin(project: LabProject, versionId: string, capturedAt: string): PrivateRecipeOrigin {
  const version = project.versions.find(item => item.id === versionId);
  if (!version) throw new Error('private-recipe-lab-version-not-found');
  const content = labRecipeContent(project, version);
  return {
    kind: 'lab-version',
    projectId: project.id,
    versionId: version.id,
    projectTitle: project.name.trim() || project.id,
    versionTitle: version.name.trim() || version.id,
    capturedAt,
    snapshot: clonePrivateRecipeContent(content),
    ...(project.source ? {source: cloneLabSource(project.source)} : {}),
  };
}
