# Dependency security compatibility

The npm lockfile installs the upstream fixes, not copied or renamed decoder code:

- `decode-uri-component` 0.5.0 fixes [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr).
- `uuid` 11.1.1 fixes [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq). Xcode and the optional ngrok development helper use its unchanged CommonJS `v4()` API.
- `sharp` 0.35.4 updates the native image libraries covered by [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) and [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c).

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
`node --test scripts/dependency-security.test.mjs` and `npm run validate`.
The tests cover real installed dependency resolution, query round trips, route
conversion, bounded malformed input, UUID buffer bounds and image processing.
Audit counts are advisory-database snapshots, not comprehensive security
certification or proof that every dependency advisory is reachable in the app.
