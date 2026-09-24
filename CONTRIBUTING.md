# Contributing

Use Node.js 24 and install the committed dependency versions with `npm ci`. Start development with `npm run web`.

## Changes

Keep a change focused and include a test for behaviour or error handling that could regress. Review interface changes at phone and desktop widths, including keyboard use and reduced motion.

Run `npm run validate` before proposing a release candidate. Run `npm run brand:check` if assets or build tooling change. Windows host changes also require `npm run desktop:test` and an installation check.

Generated exports, validation logs, dependencies, editor state and personal backups stay out of Git. Never put credentials in application configuration; the exported website can be read by anyone who downloads it.

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
