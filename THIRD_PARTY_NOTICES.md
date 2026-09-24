# Third-party notices

The MIT licence in `LICENSE` applies to original application code owned by AlexShen-Oguri. It does not relicense third-party dependencies, datasets, images, reference material or trademarks. Preserve applicable attribution and licence notices with distributed copies.

## Dependencies

JavaScript dependencies are pinned in `package-lock.json`; Rust dependencies are pinned in `src-tauri/Cargo.lock`. They retain their upstream licences. Installed package licences and notices must accompany any distribution where those terms require them.

## Ingredient database

The derived Open Food Facts ingredient dataset and its editorial overlays retain the database terms described in [ingredient notes](src/content/ingredients/README.md): ODbL 1.0 and the Database Contents License. Source revision and source record identifiers remain in the data. The upstream server-code licence retained in `research/ingredients/round-six/openfoodfacts-server-LICENSE.txt` is not a substitute for the database licence.

## Photographs and product images

Retained Commons photographs have per-file authors, source links and licences in [photo attribution](assets/photos/ATTRIBUTION.md) and `assets/photos/manifest.json`. They include different CC BY, CC BY-SA and public-domain terms; there is no single blanket image licence.

Bottle images retain their source URLs and rights status in `assets/bottles/manifest.json` and `src/content/bottle-media.ts`. Redistribution permission for these images has not been independently confirmed. The repository includes them as product references and does not grant a licence to their copyrights or trademarks. Public availability, attribution and the application's MIT licence do not establish third-party permission.

## Cocktail illustrations, facts and trademarks

`assets/styled/manifest.json` identifies AI-generated cocktail illustrations and their reference URLs. They are not the source photographs. Recorded visual checks do not establish copyright clearance or grant rights to referenced material.

Recipe and product records retain source attribution. Attribution alone is not a permission to reproduce protected text or databases. Review intended distribution against the relevant source terms. Product names and marks identify their respective owners and do not imply affiliation or endorsement.

This notice records known sources and licence boundaries. It does not claim that all third-party rights have been cleared. To report an image-rights concern, open an issue identifying the affected file and source; do not include private documents or personal information in a public issue.
