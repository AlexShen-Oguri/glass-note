import assert from "node:assert/strict";
import test from "node:test";

import { LOCALES } from "../domain/contracts";
import { UI_EN, type UiKey } from "../i18n/keys";
import { translations } from "../i18n/ui";
import { catalogue } from "./catalogue";

const localeKeys = <T extends Record<string, unknown>>(value: T): string[] => Object.keys(value);

test("catalogue has the bounded drink and version shape", () => {
  assert.equal(catalogue.cocktails.length, 367);
  assert.equal(catalogue.versions.length, 371);
  assert.equal(new Set(catalogue.cocktails.map(({ id }) => id)).size, catalogue.cocktails.length);
  assert.equal(new Set(catalogue.versions.map(({ id }) => id)).size, catalogue.versions.length);

  const cocktailIds = new Set(catalogue.cocktails.map(({ id }) => id));
  const versionIds = new Set(catalogue.versions.map(({ id }) => id));
  const ingredientIds = new Set(catalogue.ingredients.map(({ id }) => id));
  const sourceIds = new Set(catalogue.sources.map(({ id }) => id));

  for (const cocktail of catalogue.cocktails) {
    assert.ok(cocktailIds.has(cocktail.id));
    assert.ok(versionIds.has(cocktail.defaultVersionId));
    assert.equal(cocktail.versionIds.includes(cocktail.defaultVersionId), true);
    for (const versionId of cocktail.versionIds) {
      const version = catalogue.versions.find(({ id }) => id === versionId);
      assert.ok(version, `missing version ${versionId}`);
      assert.equal(version?.cocktailId, cocktail.id);
    }
    for (const locale of LOCALES) {
      assert.ok(cocktail.name[locale].trim());
      assert.ok(cocktail.description[locale].trim());
    }
  }

  for (const version of catalogue.versions) {
    assert.ok(cocktailIds.has(version.cocktailId));
    assert.ok(sourceIds.has(version.sourceId));
    assert.ok(Number.isInteger(version.servings) && version.servings > 0);
    assert.equal(version.sourceChecked, true);
    assert.equal(version.translationStatus, "draft");
    assert.ok(LOCALES.includes(version.originalLanguage));
    assert.ok(version.originalSteps?.length);
    for (const ingredient of version.ingredients) {
      assert.ok(ingredientIds.has(ingredient.ingredientId));
      if (ingredient.note) {
        for (const locale of LOCALES) assert.ok(ingredient.note[locale].trim());
      }
    }
    for (const locale of LOCALES) {
      assert.ok(version.label[locale].trim());
      assert.ok(version.glass[locale].trim());
      assert.ok(version.garnish[locale].trim());
      assert.ok(version.profileNote[locale].trim());
      assert.ok(version.steps[locale].length > 0);
      for (const step of version.steps[locale]) assert.ok(step.trim());
    }
  }

  for (const ingredient of catalogue.ingredients) {
    for (const locale of LOCALES) assert.ok(ingredient.name[locale].trim());
  }
});

test("sources, ingredients, and brands are internally referential", () => {
  const sourceIds = new Set(catalogue.sources.map(({ id }) => id));
  const ingredientIds = new Set(catalogue.ingredients.map(({ id }) => id));
  const brandIds = new Set(catalogue.brands.map(({ id }) => id));
  assert.equal(sourceIds.size, catalogue.sources.length, 'duplicate source ID');
  assert.equal(ingredientIds.size, catalogue.ingredients.length, 'duplicate ingredient ID');
  assert.equal(brandIds.size, catalogue.brands.length, 'duplicate brand ID');
  for (const source of catalogue.sources) {
    assert.ok(source.url.startsWith("https://"));
    assert.match(source.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Number.isFinite(Date.parse(source.checkedAt)));
  }
  for (const ingredient of catalogue.ingredients) {
    for (const brandId of ingredient.brandIds ?? []) assert.ok(brandIds.has(brandId));
    for (const tag of ingredient.exclusionTags) {
      assert.ok(["egg", "dairy", "gin", "rum", "tequila", "whiskey", "vodka", "brandy", "mezcal", "cachaca", "grappa", "none"].includes(tag));
    }
  }
  for (const brand of catalogue.brands) {
    for (const ingredientId of brand.ingredientIds) assert.ok(ingredientIds.has(ingredientId));
  }
  for (const version of catalogue.versions) {
    assert.ok(sourceIds.has(version.sourceId));
    for (const ingredient of version.ingredients) {
      if (ingredient.brandId) {
        const brand = catalogue.brands.find(({ id }) => id === ingredient.brandId);
        assert.ok(brand, `missing brand ${ingredient.brandId}`);
        assert.ok(brand.ingredientIds.includes(ingredient.ingredientId), `${brand.id} does not describe ${ingredient.ingredientId}`);
      }
    }
  }
});

test("alcohol-free entries are source-backed and explicitly alcohol-free", () => {
  const alcoholFree = catalogue.cocktails.filter(({ category }) => category === "alcohol-free");
  assert.equal(alcoholFree.length, 5);
  for (const cocktail of alcoholFree) {
    for (const versionId of cocktail.versionIds) {
      const version = catalogue.versions.find(({ id }) => id === versionId);
      assert.ok(version);
      assert.equal(version?.strength, "none");
      assert.equal(version?.sourceChecked, true);
      for (const ingredient of version?.ingredients ?? []) {
        const record = catalogue.ingredients.find(({ id }) => id === ingredient.ingredientId);
        assert.equal(record?.base, undefined);
      }
    }
  }
});

test("Dry Martini keeps two independent verified source versions", () => {
  const dryMartini = catalogue.cocktails.find(({ id }) => id === "dry-martini");
  assert.ok(dryMartini);
  assert.equal(dryMartini?.versionIds.length, 2);
  const iba = catalogue.versions.find(({ id }) => id === "dry-martini-iba");
  const ideal = catalogue.versions.find(({ id }) => id === "dry-martini-ideal-gin");
  assert.ok(iba && ideal);
  assert.notEqual(iba?.sourceId, ideal?.sourceId);
  assert.deepEqual(iba?.ingredients.map(({ amount, unit }) => [amount, unit]), [[60, "ml"], [10, "ml"]]);
  assert.deepEqual(ideal?.ingredients.map(({ amount, unit }) => [amount, unit]), [[2, "oz"], [1, "oz"], [1, "dash"]]);
});

test("source servings and non-metric units remain explicit", () => {
  const version = (id: string) => catalogue.versions.find(({ id: versionId }) => versionId === id);
  assert.equal(version("daiquiri-iba")?.servings, 1);
  assert.equal(version("mojito-mocktail-good-food")?.servings, 2);
  assert.equal(version("amaretto-sour-alcohol-free-good-food")?.servings, 2);

  const mocktailSugar = version("mojito-mocktail-good-food")?.ingredients.find(({ ingredientId }) => ingredientId === "superfine-sugar");
  const mocktailMint = version("mojito-mocktail-good-food")?.ingredients.find(({ ingredientId }) => ingredientId === "mint-leaves");
  const palomaSalt = version("paloma-iba")?.ingredients.find(({ ingredientId }) => ingredientId === "salt");
  assert.deepEqual([mocktailSugar?.amount, mocktailSugar?.unit], [1, "tbsp"]);
  assert.deepEqual([mocktailMint?.amount, mocktailMint?.unit], [1, "bunch"]);
  assert.deepEqual([palomaSalt?.amount, palomaSalt?.unit], [1, "pinch"]);

  for (const locale of LOCALES) {
    assert.ok(translations[locale].unit_tbsp);
    assert.ok(translations[locale].unit_pinch);
    assert.ok(translations[locale].unit_bunch);
    assert.ok(translations[locale].servings);
  }
});

test("all eight UI locales cover every UI key", () => {
  const keys = localeKeys(UI_EN).sort();
  for (const locale of LOCALES) {
    const localized = translations[locale];
    assert.deepEqual(localeKeys(localized).sort(), keys, `missing UI key in ${locale}`);
    for (const key of keys as UiKey[]) assert.ok(localized[key].trim(), `${locale}.${key} is empty`);
  }
});
