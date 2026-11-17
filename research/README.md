# Content evidence and maintenance inputs

These reviewed inputs support catalogue maintenance and content regression tests. The app uses checked-in `src/content/` data and local assets; it does not import this directory or fetch source pages at runtime. Review dates describe archived evidence, not a fresh check of every external page.

| Path | Purpose |
| --- | --- |
| `catalogue/identity-baseline.json` | Frozen cocktail/bottle identities and saved-recipe fingerprints used to detect compatibility regressions. |
| `catalogue/cocktail-selection.json` | The reviewed cocktail additions, exclusions and source corrections used by catalogue tests. |
| `competitions/recipe-selection.json` | Organizer sources, serving/preparation facts, selected competition years, removed empty records and rights limitations for the published-recipe selections. |
| `localization/bottle-name-evidence.json` | Dated bottle-name facts from brand, owner or distributor pages. |
| `localization/cocktail-name-review.json` | Cocktail/locale name decisions, source links, old-name aliases and editorial limitations. |
| `recommendations/context-review.json` | Source-linked recipe facts and editorial occasion/season suggestions. |
| `techniques/mixing-methods-review.json` | Interpretation of archived source steps, evidence hashes and unresolved methods. |
| `ingredients/open-food-facts/` | Selected source records, ten bar-technique materials and the upstream server licence. |
| `ingredients/translation-overlays.json` | Ordered translation layers, their source/editorial basis and corrections. Runtime overlay names remain drafts. |

The ingredient source snapshot retains 1,096 selected records in their original order, the pinned upstream revision/URL/hash, selection policies and original record fields. It combines the product selection and resolved additional selections; the broader unselected taxonomy drafts are not maintained. It is a reviewed snapshot, not a claim that the original upstream selection process can be automatically reproduced.

To regenerate the ingredient catalogue, run these commands from the repository root:

```sh
node --import tsx scripts/build-ingredient-library.ts
node scripts/merge-ingredient-translations.mjs
```

These commands intentionally update `src/content/ingredients/records.json` and `translations.json`. Translation worksheets, accepted-name lists and reports go to ignored `artifacts/ingredients/`; generate the worksheet before merging translations. Review the resulting content diff and run `npm test`. Selection, source identity and translation changes need content review; a successful generator is not source verification.

Keep source attribution, licence records and regression inputs when reorganizing this directory. Runtime recipe/media provenance remains under `src/content/`, `src/media/` and the asset manifests. See [content notes](../src/content/CONTENT-NOTES.md) and [ingredient notes](../src/content/ingredients/README.md).
