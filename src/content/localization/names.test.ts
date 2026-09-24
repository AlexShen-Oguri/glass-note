import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {deepEqual, equal, notEqual, ok} from "node:assert/strict";
import {test} from "node:test";
import {catalogue} from "../catalogue";
import {LOCALES} from "../../domain/contracts";
import {applyCocktailNames} from "./names";

test("applies reviewed names while preserving catalogue records", () => {
  const spritz = catalogue.cocktails.find(({id}) => id === "spritz");
  ok(spritz, "spritz must be present in the source catalogue");
  const before = JSON.stringify(spritz);

  const [updated] = applyCocktailNames([spritz]);
  ok(updated);
  equal(updated.name.zh, "阿佩罗橙光");
  ok(updated.aliases.includes("斯普利兹"));
  ok(updated.aliases.includes("Aperol Spritz"));
  equal(updated.id, spritz.id);
  equal(updated.defaultVersionId, spritz.defaultVersionId);
  deepEqual(updated.versionIds, spritz.versionIds);
  deepEqual(updated.description, spritz.description);
  equal(JSON.stringify(spritz), before, "the source object must not be mutated");
  notEqual(updated.name, spritz.name);
  notEqual(updated.aliases, spritz.aliases);
});

test("name review report covers every cocktail and locale", async () => {
  const reportPath = fileURLToPath(new URL(
    "../../../research/localization/round-ten/names-review.json",
    import.meta.url,
  ));
  const report = JSON.parse(await readFile(reportPath, "utf8")) as {
    coverage: {expectedRows: number; actualRows: number; uniqueCocktails: number; locales: string[]};
    rows: Array<Record<string, unknown>>;
  };
  const expectedRows = catalogue.cocktails.length * LOCALES.length;
  equal(report.coverage.expectedRows, expectedRows);
  equal(report.coverage.actualRows, expectedRows);
  equal(report.coverage.uniqueCocktails, catalogue.cocktails.length);
  deepEqual(report.coverage.locales, [...LOCALES]);

  const rowKeys = new Set<string>();
  const appliedById = new Map(applyCocktailNames(catalogue.cocktails).map((cocktail) => [cocktail.id, cocktail]));
  for (const row of report.rows) {
    const id = row.cocktailId;
    const locale = row.locale;
    ok(typeof id === "string" && id.length > 0);
    ok(typeof locale === "string" && (LOCALES as readonly string[]).includes(locale));
    rowKeys.add(`${id}:${locale}`);
    ok(typeof row.oldValue === "string" && row.oldValue.length > 0);
    ok(typeof row.newValue === "string" && row.newValue.length > 0);
    ok(["keep", "correct", "original-name"].includes(String(row.decision)));
    ok(["name-source", "editorial-consistent", "user-term"].includes(String(row.evidenceLevel)));
    ok(typeof row.evidenceUrl === "string" && row.evidenceUrl.startsWith("https://"));
    ok(typeof row.note === "string" && row.note.length > 0);
    if (row.oldValue !== row.newValue) {
      const applied = appliedById.get(String(id));
      ok(applied, `reviewed cocktail ${String(id)} must remain in the applied catalogue`);
      ok(applied.aliases.includes(String(row.oldValue)), `legacy name ${String(row.oldValue)} must remain searchable`);
    }
  }
  equal(rowKeys.size, expectedRows);
});
