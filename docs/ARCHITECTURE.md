# Architecture

Glass Notes uses one Expo / React Native / TypeScript application for Web and native iOS development. The Windows and macOS Tauri hosts load a static Web export. There is no application backend, account service or runtime model API.

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
| `src-tauri` | Windows/macOS host, storage bridge, capabilities and installer configuration |
| `scripts` | Development, verification, content authoring and packaging commands |

## Content boundaries

A cocktail owns its card identity and can have several independent source versions. Search conditions must be satisfied by one version, never by combining facts from different versions. Results carry the selected version ID into details.

Runtime records live in `src/content`; offline research is not imported into the app. Tests also use reviewed provenance fixtures. Public display translations do not rewrite stored recipe fingerprints or user-authored titles. Image provenance, recipe sources, translations and editorial flavour inference are separate records.

## Personal records

Root providers stay mounted across route changes. Business keys cover preferences, favourites and lists, cupboard materials, owned bottles, experiments, private recipes, backup references, making sessions and taste experiences. Platform adapters retain explicit loading, failure and retry states.

Saved recipes and making sessions keep exact snapshots. Private recipes append revisions on Save; experiments autosave. Optional private photos are compressed local JPEG data URLs, bounded to 200,000 characters.

Full backup export uses schema 3 and reads schemas 1, 2 and 3. Individual sections are independently versioned. Restore previews changes, checks fingerprints, keeps before-images, journals writes, verifies readback and invalidates stale writers. Missing sections in an older backup must not erase newer data. Backups are not encrypted.

Browser storage belongs to its origin. A domain or protocol change does not move that data; export and restore explicitly. Desktop host storage belongs to the stable application identifier `com.glassnotes.desktop`, in each operating system's application-data directory.

## Desktop boundary

Five host commands expose whitelisted local storage and bounded import/export dialogs. Host code owns filesystem paths and the 5,000,000-byte file limit. The 21 permitted keys must stay aligned between TypeScript and Rust. Preserve the local-origin checks, capabilities, CSP and single-instance behaviour; do not add arbitrary filesystem access.

Windows uses a current-user NSIS installer. macOS merges `tauri.macos.conf.json` to produce an app and DMG for macOS 12+, with ad-hoc signing; release builds combine arm64 and x86_64. Both platforms share the same host and local-file contract. Desktop release CI checks Rust storage behaviour, Windows installation/upgrade and macOS bundle integrity before uploading build artifacts. Publishing remains separate from building, and no automatic updater is configured.

## Presentation

Mobile and desktop browsers share routes and rules. Responsive styles adjust layout without changing stored data. Motion respects pause, reduced motion and background state. The Liquid G assets and `src/theme/tokens.ts` define the existing identity.

The presentation uses deep green, ivory Songti/serif display type, ruled editorial rows and sage actions. Web/Tauri keep one original procedural Three.js coupe and orbital composition mounted across routes; the GPU module loads after hydration, pauses on inactive scenes and disposes with the shell. Native retains its light-layer adapter. Typography uses local fonts and works offline; recipe imagery and provenance remain catalogue inputs.

Guided results compose the ranked sequence by count: one hero, a pair, a trio, four in two rows, five with a centred final pair, and six in two rows of three. Narrow screens use two columns after the single hero. Partial rows remain centred; layout never changes the ranking or selected recipe version.

Web and the Tauri webview use GSAP with `@gsap/react` in `.web` motion adapters; native views retain native-driver animations. Scoped `useGSAP` contexts clean up route/step transitions and event callbacks. Animate transforms and opacity, release temporary layer promotion, and avoid outgoing DOM clones or per-frame layout measurements. Result filters commit immediately and stagger at most eight cards, with a control to skip the entrance. System motion preferences use a shared ready snapshot; an unresolved preference cannot consume a newly mounted entrance. Cross-route photos use one captured canvas texture and a batched destination measurement; navigation, pause, scroll and resize interrupt the flight and restore the live image. Loop playheads pause when offscreen, backgrounded or user-paused. Modal portals open directly and preserve their keyboard focus contract. Browser motion regression checks are in `scripts/check-transitions.playwright.js`.

Route and question changes commit immediately while foreground entrances overlap the background's slower movement. Web/Tauri guided progress and actions remain in the stable frame, and revealed cards are accessible throughout their entrance. Outgoing titles and cross-route photos use bounded canvas textures from the live heading and existing local image; React retains ownership of every semantic node. The relay preserves source-version routes and destination controls. A photo is concealed before its destination mounts; its captured hover crop bridges to the destination and remains there until the live image decodes. Cold route contents acknowledge an entrance only when real targets mount; photo geometry is read after route scroll restoration. Hidden zero-width measurements cannot replace a results layout. Workflow state never waits for animation completion. An interruption lands the current view and clears temporary presentation state.

The home archive draws three different drinks with reviewed local media and valid default versions on each fresh visit. Resizing and changing language retain the selection, as does returning from an archive recipe, so the shared photo has a stable return destination. Both phone and desktop show all three entries, with two-line captions. Desktop home navigation follows the editorial entries in document flow with at least 32px of clearance; short windows scroll instead of overlapping controls. Phone navigation retains its inset bottom bar.

Foreground choreography excludes retained hidden routes and gives question grids and result entrances one animation owner. The ambient space bridges committed endpoints using transforms; the canvas measures its untransformed size, warms shaders asynchronously and can lower pixel density under sustained frame pressure while keeping the motion cadence.

Web export produces `dist`; desktop preparation copies that export into a separate build directory. Native iOS export creates JavaScript and resources, not an IPA. Community, accounts and cloud synchronisation are not required for this architecture.
