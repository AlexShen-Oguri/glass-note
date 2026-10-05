# Dependency security compatibility

The npm lockfile installs the upstream fixes, not copied or renamed decoder code:

- `decode-uri-component` 0.5.0 fixes [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr).
- `uuid` 11.1.1 fixes [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq). Xcode and the optional ngrok development helper use its unchanged CommonJS `v4()` API.
- `sharp` 0.35.4 updates the native image libraries covered by [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) and [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c).
- `brace-expansion` 5.0.12 fixes the recursion and expansion advisories [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7), [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) and [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr). It remains within the installed Minimatch dependency range.
- `http-cache-semantics` 4.3.0 fixes [GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp), within the installed development cache dependency range.

The build-tool dependency chain still includes `braces` 3.0.3
([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) and
`node-forge` 1.4.0
([GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)).
As of 2026-10-05, neither advisory has a published upstream fixed version.
`scripts/patch-dependency-security.mjs` applies these temporary source fixes
through the existing `postinstall` command:

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
- Forge: the `lib/rsa.js` post-image is byte-identical to
  [upstream PR #1157](https://github.com/digitalbazaar/forge/pull/1157), commit
  `683ab3344899cc08a581e4d5675a33e87aff7b04`, which includes
  [PR #1152](https://github.com/digitalbazaar/forge/pull/1152). RSA PKCS#1 v1.5
  verification rejects extra nested AlgorithmIdentifier elements and nonempty
  NULL parameters. Valid absent/empty SHA parameters, legacy BER, PSS, raw
  signature schemes and Expo's certificate/signing workflows are preserved.

These fixes apply to the installed CommonJS source consumed by the project's
build tools. No application source directly imports these packages. The
unused vendored browser bundles in Forge and the copied Braces implementation
in `resolve-workspace-root` are not modified; the latter's exported resolver
uses Picomatch rather than the vulnerable Braces walkers. Reassess this scope
before introducing new consumers or using the browser bundles.

Installation checks every locked copy of each package, pins the expected
versions and complete before/after SHA-256 values for the modified files,
supports repeat execution, and fails on missing or changed code. It preserves
package versions, lockfile integrity and upstream licence notices. Verify the
installed images without writing with
`node scripts/patch-dependency-security.mjs --check`. If install scripts are
disabled, explicitly run `node scripts/patch-dependency-compat.mjs` before any
build or test. Do not ignore a patch failure.

`npm audit` uses published package-version metadata and still reports these
advisories after the local source fixes. `npm run audit:dependencies` preserves
that complete raw report and separately checks the actual patches, reviewed
consumer file hashes, application imports/configuration and the vulnerability
regression/compatibility tests. Only these two exact advisory identities and
versions can be recognized as fixed by the backports. Every transitively
affected package must trace exclusively to those verified advisories, including
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
the upstream ESM implementation for Web and native.

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
