import type {Cocktail, RecipeVersion, Source, Ingredient, Brand} from '../../domain/contracts';

export interface RecipeBatch {
  cocktails: Cocktail[];
  versions: RecipeVersion[];
  sources: Source[];
}

export interface CatalogueBatch extends RecipeBatch {
  ingredients: Ingredient[];
  brands: Brand[];
}
