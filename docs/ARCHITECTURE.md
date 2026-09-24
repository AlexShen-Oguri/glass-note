# Architecture

Glass Notes uses one Expo / React Native / TypeScript application for Web and native iOS development. The Windows Tauri host loads a static Web export. There is no application backend, account service or runtime model API.

## Code layout

| Directory | Responsibility |
| --- | --- |
| `src/app` | Expo Router routes and provider composition |
| `src/features` | Screens and shared interface components |
| `src/domain` | Search, recommendations, recipe snapshots, calculations and validation |
| `src/content` | Bundled recipes, bottles, ingredients, translations and source records |
| `src/platform` | Local storage, file access, restore coordination and platform adapters |
| `src/i18n`, `src/theme` | Eight-language interface text and visual tokens |
| `src/media`, `assets`, `public` | Bundled images, thumbnails and brand assets |
| `src-tauri` | Windows host, storage bridge, capabilities and installer configuration |
| `scripts` | Development, verification, content authoring and packaging commands |

## Content boundaries

A cocktail owns its card identity and can have several independent source versions. Search conditions must be satisfied by one version, never by combining facts from different versions. Results carry the selected version ID into details.

Runtime records live in `src/content`; offline research is not imported into the app. Tests also use reviewed provenance fixtures. Public display translations do not rewrite stored recipe fingerprints or user-authored titles. Image provenance, recipe sources, translations and editorial flavour inference are separate records.

## Personal records

Root providers stay mounted across route changes. Business keys cover preferences, favourites and lists, cupboard materials, owned bottles, experiments, private recipes, backup references, making sessions and taste experiences. Platform adapters retain explicit loading, failure and retry states.

Saved recipes and making sessions keep exact snapshots. Private recipes append revisions on Save; experiments autosave. Optional private photos are compressed local JPEG data URLs, bounded to 200,000 characters.

Full backup export uses schema 3 and reads schemas 1, 2 and 3. Individual sections are independently versioned. Restore previews changes, checks fingerprints, keeps before-images, journals writes, verifies readback and invalidates stale writers. Missing sections in an older backup must not erase newer data. Backups are not encrypted.

Browser storage belongs to its origin. A domain or protocol change does not move that data; export and restore explicitly. Windows host storage belongs to the stable application identifier `com.glassnotes.desktop`.

## Windows boundary

Five host commands expose whitelisted local storage and bounded import/export dialogs. Host code owns filesystem paths and the 5,000,000-byte file limit. The 21 permitted keys must stay aligned between TypeScript and Rust. Preserve the local-origin checks, capabilities, CSP and single-instance behaviour; do not add arbitrary filesystem access.

## Presentation

Mobile and desktop browsers share routes and rules. Responsive styles adjust layout without changing stored data. Motion respects pause, reduced motion and background state. The Liquid G assets and `src/theme/tokens.ts` define the existing identity.

Web export produces `dist`; desktop preparation copies that export into a separate build directory. Native iOS export creates JavaScript and resources, not an IPA. Community, accounts and cloud synchronisation are not required for this architecture.
