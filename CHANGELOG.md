# Changelog

## Unreleased

- Check Windows installation registration before showing completion. A missing or mismatched version, executable or installation path stops the installer with an error.
- Test completed making sessions across disk reload and full backup export, including preservation of older records and failed-write handling.

## 0.1.8 (2026-09-25, prerelease)

- Update vulnerable decoder, UUID and Sharp dependency chains, preserving Expo Router's decoder interface with a source-verified one-line installation patch.
- Bound backup reference traversal and conflict lookup so long chains or many historical variants cannot stall import preview through repeated full scans.
- Add complete Chinese and English README guides with real desktop and phone-width screenshots, feature explanations, data boundaries and build instructions.
- Keep recipe ingredients and instructions at their natural height when stacked on phone screens. Desktop keeps the two-column layout.
- Prepare the accepted catalogue, translated names and photo-based list selection for standalone Web and Windows distribution.

The Windows installer is unsigned. Installation verification and security review remain separate release checks.
