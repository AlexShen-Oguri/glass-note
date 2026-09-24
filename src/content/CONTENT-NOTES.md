# Content and provenance

The canonical catalogue is assembled in `src/content/catalogue.ts`. It currently contains 367 cocktails and 371 source-specific recipe versions. Bottle records and their media have separate identities. A source variant must not be counted as another cocktail.

## Source boundaries

Recipe versions retain source URLs, original steps, quantities, units, brand requirements and editorial translations. Searches must satisfy all conditions within one version. Do not combine ingredients from different sources to make a version match.

Flavour profiles, occasion tags, translations and alcohol estimates are editorial guidance. They are not source-author endorsements, measured tasting results, medical advice or verified allergen guarantees. Unknown composition stays unknown. Ingredient identity and taxonomy ancestry do not prove substitution or brand ownership.

## Images

[The cocktail manifest](../../assets/styled/manifest.json) records AI-generated delivery images, reference/source URLs and recorded reference/output checks. These are original illustrative outputs, not the referenced photographs. A review flag is historical metadata, not a licence or independent re-review of the current release.

[Retained photographs](../../assets/photos/ATTRIBUTION.md) retain their individual attribution and licence terms. [Bottle media](../../assets/bottles/README.md) retain product-image provenance and unresolved rights. MIT covers application code, not these third-party assets or trademarks.

## Maintenance

Regression evidence lives in [research](../../research/README.md). It is dated evidence, not an up-to-date claim that every external page has been revisited. Preserve IDs and backup compatibility when updating content. Run the complete test suite after changing source facts, aliases, translations or media.

See the [ingredient catalogue notes](ingredients/README.md) and [third-party notices](../../THIRD_PARTY_NOTICES.md) for database and attribution boundaries.
