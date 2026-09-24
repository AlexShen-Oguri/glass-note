# Glass Notes

[中文](README.md) · English

Find a drink for tonight, make it with what you have, and remember what you enjoyed. Glass Notes is a personal cocktail app for discovering recipes, keeping a bottle cupboard and building your own recipe book, lists and tasting notes.

**367 cocktails · 371 source versions · 1,042 bottles · 8 interface languages**

![Glass Notes in English, with discovery choices and a flowing cocktail gallery](docs/images/home-en.png)

[Features](#features) · [Get started](#get-started) · [Local data](#local-data-and-backups) · [Development](#development-and-builds) · [Sources and licence](#sources-and-licence)

This repository publishes the 0.1.8 source. You can build the Windows x64 app yourself; a formal installer Release and the standalone website are still in preparation. Shared iOS code is retained, while App Store delivery is deferred. A successful build is not a device test or security clearance.

The images below are real browser captures at desktop and phone widths. Detailed examples use the Chinese interface; the app also has an English interface. Personal entries marked as demos were created in an isolated browser, not taken from a user's records. The photo-picker example uses an existing app illustration, not a claimed photograph of a homemade drink.

## Features

### Choose by taste, or mix with what you own

Start with **Find my glass** on the home screen. Choose a mode, then explore aroma, taste, strength and the first-sip experience. Select several options or skip a question. Occasion, season and your saved taste memory are optional.

| Have a drink | Mix it myself |
| --- | --- |
| Find something that suits your taste, without needing the ingredients at home. | Use cupboard ingredients and the supported ingredient mappings of bottles you own. |
| Read the reasons for a suggestion and open its recipe. | **Ready base spirits come first**, then fewer missing ingredients within each group. Recipes missing 3 or more ingredients are excluded; missing items are listed. |

An empty cupboard prompts you to add ingredients or choose by taste first. The latter clearly states that cupboard filtering has not been applied. Ingredient presence does not confirm quantities, specified bottles, equipment or special preparations; check the recipe before making it.

<p>
  <img src="docs/images/customize-zh.png" width="32%" alt="Phone view of the two discovery modes">
  <img src="docs/images/flavours-zh.png" width="32%" alt="Guided aroma selection with multiple choices and a skip option">
  <img src="docs/images/taste-zh.png" width="32%" alt="An explicit flavour experience with a demo private note">
</p>

### Browse a visual catalogue and keep the right version

Search names, aliases and ingredients; filter by base spirit, included or excluded ingredients, flavour, technique or alcohol-free recipes. Browse classics, competition entries and published bar recipes, with optional occasion and season suggestions.

Each cocktail has one card. Different source recipes do not inflate the drink count. All selected filters must match **the same recipe version**, and that version follows you into the details.

![English catalogue with search, categories, filters and cocktail photographs and illustrations](docs/images/discover-en.png)

Recipe details include ingredients, measures, steps, glassware, garnish, preparation notes and flavour guidance. Switch source versions, read steps in the source language and open the original reference. Source facts, editorial translations, flavour inference and image provenance are recorded separately.

![Negroni details with its exact source version and making, order-card, favourite and taste actions](docs/images/recipe-zh.png)

### Your cupboard, ingredient library and bottle archive

Record which ingredients and bottles you own to inform the mixing recommendations. The active interface does not require remaining-volume tracking or deduct stock when you finish a drink.

Use the ingredient library to explore ingredients and related recipes. Search the bottle archive by product, brand, alias or flavour description; filter by category, inspect images and available strength information, mark ownership or select bottles for comparison.

Owning one brand does not mean owning all its products. Bottle-to-ingredient mappings help recommendations without assuming every possible substitute is available.

![Bottle archive with familiar gins, translated and original names, and product descriptions](docs/images/bottles-zh.png)

### Follow a recipe or show an order card

**Start making** opens ingredients, steps, practical tips and a read-only alcohol estimate. Progress is saved locally. Finishing shows a gradual completion transition, then offers another drink or a return to the catalogue.

Alcohol estimates use available measures and documented ingredient or bottle strengths. They describe a **before-ice range**, not a measured finished drink. Missing evidence or unsupported measures produce no invented percentage. Do not use an estimate to judge driving or drinking safety.

An order card presents the drink name, ingredients and explicit requests. Use the app language or source language, show the card, copy its text or share text where the platform supports it. Your private tasting notes are not included.

<p>
  <img src="docs/images/making-zh.png" width="44%" alt="Phone making screen with ingredients, steps and practical tips">
  <img src="docs/images/order-zh.png" width="44%" alt="Phone order card showing a drink name and concise ingredients">
</p>

### Favourites, personal lists and taste memory

Favourite a specific recipe, or create a list for a weekend, gathering or tasting session. **Add drinks** opens the same visual catalogue used for browsing, where you can select the exact version to save.

Lists retain a snapshot of the recipe at the time it was added. Read that saved recipe or open the current catalogue version separately. Cards show the drink image and group its saved source versions together.

![Demo personal list with drink images and saved recipe versions](docs/images/lists-zh.png)

**Record taste** opens a drink-specific flavour experience. Record whether you drank or made it, liked or disliked the version, found it too sweet or strong, and which aromas you enjoyed. A private note is optional.

Recommendations use deliberately saved structured feedback, and taste memory can be turned off. Browsing and note text are not interpreted as preferences. Marking a drink as tried or made does not imply that you liked it.

### Your recipes, including your own photos

Start from scratch, copy an exact catalogue recipe or take a version from the lab. Edit ingredients, quantities, steps, glassware, garnish and notes. Saving changes retains revision history.

Choose a photo from your device. It is compressed and stored locally, travels with recipe backups and is not published to a community. User-written names and notes are not automatically translated or rewritten.

![Private recipe editor with a locally selected image and editable recipe fields](docs/images/private-recipe-zh.png)

### Research topics and your lab

| Tool | What it supports |
| --- | --- |
| Research topics | Explore curated works by country, competition and bar; open exact catalogue versions where available. |
| Bottle comparison | Compare product information and create a controlled comparison from scratch or from an existing recipe. |
| Recipe versions | Create projects, edit quantities and methods, copy the next version and compare changes. |
| Trial batches | Preserve the recipe used for a batch; record time, temperature, aroma, palate, appearance, results and next steps. |
| Result comparison | Compare actual batches, continue from a chosen snapshot as a named version or save it to your recipe book. |

Lab entries autosave locally. Research summaries and editorial flavour descriptions are not measurements from your own trials.

![Demo lab project with recipe versions, trial batches and result comparison](docs/images/lab-zh.png)

### Eight languages and responsive layouts

Chinese, English, French, German, Spanish, Korean, Japanese and Italian are available. The initial choice follows supported device languages; use the toolbar to change it. Public drink and bottle names follow the selected language, with smaller original names where they differ. Some names are editorial translations or transliterations, not official local names. Native-language review remains ongoing.

Desktop and phone browsers share features and data rules. Switch between ml and fl oz where volume conversion applies; mass, dashes and other measures are not silently converted to volume. Page transitions, the cocktail waterfall and background motion can be paused and respect the system's reduced-motion preference.

## Local data and backups

No account is required. There is no community publishing or automatic cloud sync. Favourites, lists, cupboard records, recipes, experiments, making sessions, taste feedback and preferences stay in the current browser or app.

Open **My → Backup & restore** to export JSON. Import it on another device or installation, review sections and conflicts, then merge or replace. File validation and interrupted-restore handling keep read failures distinct from empty records.

- Browser profiles, app installations and website origins (protocol, domain or port) have separate storage.
- Clearing site data, ending private browsing or uninstalling can remove records. Export before migrating.
- Backups include private notes and photos and **are not encrypted**. Never commit them or upload them with the website.
- Replace can remove existing records in selected sections. Review the preview and keep an earlier backup.
- A complete browser offline cache is not promised. Local storage does not make the first website load network-free.

## Get started

Use Node.js 24 and npm:

```sh
git clone https://github.com/AlexShen-Oguri/glass-note.git
cd glass-note
npm ci
npm run web
```

To run the exported website:

```sh
npm run build:web
npm run preview
```

Open http://127.0.0.1:4173. Rebuild after source changes. The preview server is for local testing.

## Development and builds

Expo, React Native and TypeScript share interface and domain code. The Windows app uses Tauri 2 to load a static Web export. Runtime use requires no application backend, database or model API key.

```sh
npm run validate
npm run brand:check
```

Validation runs type checks, behaviour and content tests, Web export and iOS JavaScript/resource export. An iOS export is not a signed application or a physical-device test.

For Windows x64:

```sh
npm run desktop:prepare
npm run desktop:test
npm run desktop:build
```

Use Rust with the MSVC toolchain, Visual Studio C++ build tools and the Windows SDK. The installer targets the current user. Installed use requires WebView2, not Node.js or Expo. macOS and Linux installers are outside the current delivery scope.

For an independently hosted website:

```sh
npm run release:web
```

This produces a static archive, file hashes and a Caddy configuration example under `release/`. It does not buy a domain, change DNS or deploy. Upload only `site/`, never the whole repository directory.

| Directory | Responsibility |
| --- | --- |
| `src/app`, `src/features` | Routes and interface |
| `src/domain` | Search, recommendations, snapshots, calculations and validation |
| `src/content`, `src/media`, `assets` | Recipes, bottles, ingredients, localised content and images |
| `src/platform` | Storage, file selection, recovery and platform adapters |
| `src-tauri` | Windows host and bounded file bridge |
| `scripts`, `deploy` | Tests, builds, packaging and self-hosting examples |

See [architecture](docs/ARCHITECTURE.md), [hosting](docs/HOSTING.md) and [contributing](CONTRIBUTING.md).

## Release and security status

The source is public. A formal desktop Release and the standalone website remain in preparation. Security review is ongoing; passing tests or a secret scan is not comprehensive security certification. Dependency advisories, clean Windows installation, signing and physical-phone acceptance require separate checks.

For ordinary bug reports, include reproduction steps, platform and version. Do not attach personal backups, credentials or private information.

## Sources and licence

Original application code is licensed under [MIT](LICENSE), copyright 2026 AlexShen-Oguri. Third-party dependencies, photographs, datasets, reference material and trademarks retain their own terms.

Cocktail imagery includes AI-created illustrations reviewed against source references; these are not photographs from the source websites. Recipes and image manifests retain source and generation records. Flavour guidance and alcohol estimates are not measured tasting results.

Third-party product photographs remain in the repository with redistribution permission not independently confirmed. Public access, attribution and noncommercial use do not establish permission. Consult [third-party notices](THIRD_PARTY_NOTICES.md), [photo attribution](assets/photos/ATTRIBUTION.md) and the relevant asset records before reuse. Images visible in README screenshots retain those same boundaries.
