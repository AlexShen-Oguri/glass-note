# Source evidence and content-maintenance inputs

This directory retains data used by content regression tests and the ingredient-library maintenance scripts. It contains no required network credentials. Runtime builds use the checked-in catalogue and assets; they do not fetch external source pages.

- `bottles/expansion-100-300/baseline.json` and `expansion/100-cocktails/selection-100.json`: frozen identity/count baselines.
- `localization/p02/bottle-name-evidence.json`: dated localized bottle-name evidence.
- `localization/round-ten/names-review.json`: editorial name coverage, including review limitations.
- `recommendations/p02-context-review.json` and `techniques/p02-mixing-methods-review.json`: source-linked editorial/method regression facts.
- `ingredients/`: pinned taxonomy inputs, explicit selections, translation overlays and upstream licence documentation needed to maintain the independent ingredient catalogue.

Directory names identify when evidence was collected; they do not define current product stages. Checks against archived facts are not fresh website checks. Generated output and inferred translations are never substitutes for primary-source evidence.

Run `npm test` after changing these files. The full runtime sources and media provenance remain under `src/content/`, `src/media/` and the asset manifests. See [content notes](../src/content/CONTENT-NOTES.md).
