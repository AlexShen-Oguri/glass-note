# Dependency security compatibility

The npm lockfile installs the upstream fixes, not copied or renamed decoder code:

- `decode-uri-component` 0.5.1 fixes [GHSA-qr28-fpjm-wq7f](https://github.com/advisories/GHSA-qr28-fpjm-wq7f) and retains the earlier fix for [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr).
- `glob` 14.0.6 and `minimatch` 11.0.9 include the fixes for [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) and [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). Overrides cross the declared major ranges of the existing Glob 13 consumers and Expo Fingerprint's Minimatch dependency. Keep the Expo version stable and review its globbing and ignore-pattern consumers on changes to those overrides.
- `node-forge` 1.4.3 satisfies the existing Expo consumers' ranges. It includes the original RSA validation fix and subsequent upstream fixes. The RSA regression tests retain canonical signatures and reject noncanonical BER, including the case covered by [GHSA-6qrw-m8cv-hcxf](https://github.com/advisories/GHSA-6qrw-m8cv-hcxf).
- `uuid` 11.1.1 fixes [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq). The Xcode helper retained transitively by Expo CLI uses its unchanged CommonJS `v4()` API.
- `sharp` 0.35.5 updates the native image libraries covered by [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj), [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) and the later librsvg advisory [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w).
- `brace-expansion` 5.0.12 fixes the recursion and expansion advisories [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7), [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) and [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr). It remains within the installed Minimatch dependency range.
- `http-cache-semantics` 4.3.0 fixes [GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp), within the installed development cache dependency range.
- `compression` 1.8.2 fixes aborted-response stream cleanup ([GHSA-vc2v-76pw-4v95](https://github.com/advisories/GHSA-vc2v-76pw-4v95)); `shell-quote` 1.12.0 fixes line-terminator quoting ([GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv)); `source-map-js` 1.2.2 fixes indexed-map offset denial of service ([GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)). These updates stay within their existing parent ranges.

The Expo CLI dependency is scoped to upstream `zod` 4.6.6 to fix
[GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
The CLI still declares Zod 3, so this explicit override crosses its declared
major range; it does not upgrade Expo. Its two installed Zod import sites use
plugin/output validation and command-schema construction APIs supported by the
fixed release. Regression tests exercise these actual CLI consumers, including
invalid commands, parameter types, strict unknown-key rejection and output URLs.
A security regression verifies that oversized bounded arrays, sets and maps
reject before parsing their elements, as fixed by
[upstream PR #6652](https://github.com/colinhacks/zod/pull/6652).
Unbounded collection behavior is unchanged upstream; this fix does not impose
new bounds on Expo's schemas. No advisory recognition or audit suppression is
added for Zod. Reassess the override when changing Expo CLI, and remove it once
the parent consumes a fixed release natively.

The build-tool chain still includes `braces` 3.0.3. Its original advisory
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) was withdrawn.
`scripts/patch-dependency-security.mjs` retains the tested depth guard through
the existing `postinstall` command:

- Braces: fixed depth guards protect the internal compile, expand and stringify
  walkers, including stringify calls made by the parser, and the recursive
  append/flatten helpers. Each stops recursive depth above 64 with a controlled
  `RangeError`. They cover parsed or supplied ASTs, iterable and generator
  children, braces and parentheses without traversing valid AST back references
  or consuming iterators twice. Options cannot disable this limit. Ordinary
  ranges, alternatives and literal forms retain their previous behavior.
  [Upstream PR #75](https://github.com/micromatch/braces/pull/75), commit
  `bdb6fda18f2aba1ae63d78786cb4460b478459ba`, informed the review but was not
  copied: its guard does not cover every internal stringify path.

The installed CommonJS Braces copy is a build-tool dependency. The exported
`resolve-workspace-root` resolver uses Picomatch. Review any new direct
application dependency on either package or Forge.

Installation checks every locked copy of each package, pins the expected
versions and complete before/after SHA-256 values for the modified files,
supports repeat execution, and fails on missing or changed code. It preserves
package versions, lockfile integrity and upstream licence notices. Verify the
installed images without writing with
`node scripts/patch-dependency-security.mjs --check`. If install scripts are
disabled, explicitly run `node scripts/patch-dependency-compat.mjs` before any
build or test. Do not ignore a patch failure.

`npm run audit:dependencies` preserves the raw npm report and checks the
installed Braces guard, reviewed consumer file hashes, application imports
and configuration, and dependency regressions. The legacy Braces identity
and installed version are the only exact matches for the backport rule. Every
reported transitive entry must trace exclusively to a verified advisory, including
cycles in Metro/React Native's dependency graph. A cycle without a verified
advisory, unknown findings at any severity, incomplete reports, changed callers,
new direct/dynamic application consumers, patch failures and tool/network errors
block the gate. This is a narrowly approved source-remediation rule, not a claim
of zero npm advisories or a complete dependency security audit. Manual source
review remains required, including consumers created through module aliases or
other paths outside the automated application's import check.
The desktop release workflow runs the same gate after `npm ci` and before
tests, packaging or artifact uploads.

Do not force an Expo/React Native downgrade or rename dependencies to make the
audit pass. Replace the backports with compatible official releases and remove
their guards and remediation recognition once the upstream fixes are available.

Expo Router 57 depends on `query-string` 7.1.3, which expects the decoder to be a
CommonJS function. The fixed decoder is an ES module. The `postinstall` script
changes exactly that import to read its default export. It verifies both the
version and the complete original source hash, supports repeat installation,
and fails if upstream code differs. It does not implement decoding or suppress
audit findings. Node 24 is the documented development runtime; Metro bundles
the upstream ESM implementation for the shared application framework.

Use `npm ci` normally. If install scripts are disabled for inspection, explicitly
run `node scripts/patch-dependency-compat.mjs` before building or testing. Do not
ignore a patch failure. Remove this patch and the decoder override once the
supported Expo Router / query-string chain consumes the fixed version natively.
The UUID override can also be removed when all parents request a fixed version.

After a dependency update, run `npm audit`,
`node --test scripts/dependency-security.test.mjs scripts/dependency-backports.test.mjs`
and `npm run validate`.
The tests cover installed patch integrity and nested copies, deep patterns and
ASTs, invalid AlgorithmIdentifier parameters, valid signatures and the Expo
certificate/CSR/signing consumers, plus dependency resolution, query round trips, route
conversion, bounded malformed input, UUID buffer bounds and image processing.
Audit counts are advisory-database snapshots, not comprehensive security
certification or proof that every dependency advisory is reachable in the app.

The Rust lock uses Tokio 1.53.3 and Rustix 1.1.6 for
[RUSTSEC-2026-0386](https://rustsec.org/advisories/RUSTSEC-2026-0386.html) and
[RUSTSEC-2026-0486](https://rustsec.org/advisories/RUSTSEC-2026-0486.html).
The five `unic-*` maintenance notices apply through `urlpattern`. The
`glib`, `proc-macro-error`, `zbus_names`, `zvariant`, `zvariant_derive`
and yanked `async-executor` entries are outside the locked Windows x64 and
both macOS architecture build trees. Reassess the target trees when adding
another platform.
