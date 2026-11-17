# Contributing

Use Node.js 24 and install the committed dependency versions with `npm ci`. Start development with `npm run web`. Install Chromium once with `npm run browser:install`; Linux CI also uses `-- --with-deps` to install its system dependencies.

## Changes

Use focused changes and describe the relevant verification in your pull request.

Keep a change focused and include a test for behaviour or error handling that could regress. Review interface changes at phone and desktop widths, including keyboard use and reduced motion. Phone acceptance targets the website in actual mobile browsers, including persistence and backup file operations. Supported application targets are Web and Windows/macOS Tauri hosts; native mobile development and iOS export are retired.

Run `npm run validate` before proposing a release candidate. It includes browser E2E checks against the newly exported website; `npm run test:e2e` reruns those checks against an existing `dist/`. Checks use synthetic records in fresh Chromium profiles and bind only to loopback. They write ignored `artifacts/e2e/` outputs and never use your normal browser data. Source/browser CI runs on pull requests and main; desktop release builds also require these browser checks before packaging. Run `npm run brand:check` if assets or build tooling change. Desktop host changes also require `npm run desktop:test` and an installation check.

Use the [Windows/macOS upgrade acceptance guide](docs/DESKTOP-ACCEPTANCE.md) for installer checks and old-to-new business-data preservation. Keep actual CI evidence separate from manual platform acceptance; the Windows marker-file check (default baseline 1.0.0) and macOS bundle checks do not cover all saved records or every supported host.

Generated exports, validation logs, dependencies, editor state and personal backups stay out of Git. Never put credentials in application configuration; the exported website can be read by anyone who downloads it.

Describe task progress and verification in the conversation and use Git commits for change history. Do not create task plans, iteration reports, agent handoffs, prompt dumps or development diaries unless explicitly requested. Update existing documentation for lasting behaviour or architecture changes; preserve source evidence, licence records and test fixtures.

## Compatibility

- Keep cocktail, source-version, ingredient and bottle IDs stable.
- Match all search conditions within a single recipe version.
- Preserve saved recipe snapshots and explicit source/translation distinctions.
- Treat storage read or write failures as errors, not as empty data or successful saves.
- Test old backups and interrupted restores before changing a storage schema, key or recovery mechanism.
- Keep platform differences in adapters and shared rules in the domain layer. See [architecture](docs/ARCHITECTURE.md).

## Content contributions

Provide the recipe or product source, original name and evidence for translated names. Label editorial translations and flavour inference. For images, record the author, source URL and applicable redistribution terms. Access to an image on a public website does not establish permission to redistribute it.

Do not submit private backups, copied credentials, unpublished personal details or material you cannot contribute. Original code uses the [MIT licence](LICENSE); third-party assets retain their own terms.

Report the commands you actually ran and distinguish browser emulation from physical-device testing. A successful build is not evidence of a working installation or a completed security audit.


## Repository organization

Name files and folders by their content or responsibility, not development rounds, phases or agent assignments. Keep maintained brand sources in `assets/brand`; Web/desktop entry points generate ignored icons under `public/brand` and `src-tauri/icons`. Previews, worksheets and reports belong in ignored `artifacts/`. Use `npm run validation:test` for the validation-runner checks.

Research inputs are indexed in `research/README.md`; distinguish source evidence and reviewed content choices from generated output. Preserve licence records, selected image originals and stable saved-data IDs. A source-file rename does not authorize changing persisted recipe or bottle identities.
