# Third-party notices

The MIT licence in `LICENSE` applies to original application code owned by AlexShen-Oguri. It does not relicense third-party dependencies, datasets, images, reference material or trademarks. Preserve applicable attribution and licence notices with distributed copies.

## Dependencies

JavaScript dependencies are pinned in `package-lock.json`; Rust dependencies are pinned in `src-tauri/Cargo.lock`. They retain their upstream licences. Installed package licences and notices must accompany any distribution where those terms require them.

`scripts/patch-dependency-security.mjs` contains a temporary RSA validation backport from [Digital Bazaar Forge PR #1157](https://github.com/digitalbazaar/forge/pull/1157), commit `683ab3344899cc08a581e4d5675a33e87aff7b04`, including Cristhian Hernandez's [PR #1152](https://github.com/digitalbazaar/forge/pull/1152) and itsalexfer's NULL-parameter supplement. The backported code is used under Forge's BSD 3-clause option; the original source headers and installed package licence remain intact. The project-written Braces depth guard is separate original code; Braces retains Jon Schlinkert's MIT licence in the installed package.

The Forge backport retains these terms:

> Copyright (c) 2010, Digital Bazaar, Inc.
> All rights reserved.
>
> Redistribution and use in source and binary forms, with or without
> modification, are permitted provided that the following conditions are met:
> * Redistributions of source code must retain the above copyright
>   notice, this list of conditions and the following disclaimer.
> * Redistributions in binary form must reproduce the above copyright
>   notice, this list of conditions and the following disclaimer in the
>   documentation and/or other materials provided with the distribution.
> * Neither the name of Digital Bazaar, Inc. nor the
>   names of its contributors may be used to endorse or promote products
>   derived from this software without specific prior written permission.
>
> THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
> ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
> WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
> DISCLAIMED. IN NO EVENT SHALL DIGITAL BAZAAR BE LIABLE FOR ANY
> DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
> (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
> LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
> ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
> (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
> SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

Web motion uses [GSAP](https://gsap.com/) and [@gsap/react](https://github.com/greensock/react), under the [GSAP Standard License](https://gsap.com/standard-license/). The GSAP skills used for this implementation are maintained at [greensock/gsap-skills](https://github.com/greensock/gsap-skills) under MIT.

## Ingredient database

The derived Open Food Facts ingredient dataset and its editorial overlays retain the database terms described in [ingredient notes](src/content/ingredients/README.md): ODbL 1.0 and the Database Contents License. Source revision and source record identifiers remain in the data. The upstream server-code licence retained in `research/ingredients/round-six/openfoodfacts-server-LICENSE.txt` is not a substitute for the database licence.

## Photographs and product images

Retained Commons photographs have per-file authors, source links and licences in [photo attribution](assets/photos/ATTRIBUTION.md) and `assets/photos/manifest.json`. They include different CC BY, CC BY-SA and public-domain terms; there is no single blanket image licence.

Bottle images retain their source URLs and rights status in `assets/bottles/manifest.json` and `src/content/bottle-media.ts`. Redistribution permission for these images has not been independently confirmed. The repository includes them as product references and does not grant a licence to their copyrights or trademarks. Public availability, attribution and the application's MIT licence do not establish third-party permission.

## Cocktail illustrations, facts and trademarks

`assets/styled/manifest.json` identifies AI-generated cocktail illustrations and their reference URLs. They are not the source photographs. Recorded visual checks do not establish copyright clearance or grant rights to referenced material.

Recipe and product records retain source attribution. Attribution alone is not a permission to reproduce protected text or databases. Review intended distribution against the relevant source terms. Product names and marks identify their respective owners and do not imply affiliation or endorsement.

This notice records known sources and licence boundaries. It does not claim that all third-party rights have been cleared. To report an image-rights concern, open an issue identifying the affected file and source; do not include private documents or personal information in a public issue.
