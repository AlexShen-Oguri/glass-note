# Hosting Glass Notes

The website is a static export. It needs no database, application API, account service or server-side secrets. Use a dedicated domain or subdomain at its root; deploying under a path prefix is not configured.

## Build an upload bundle

Use Node.js 24 and a `tar` executable (included with current Windows and commonly available on macOS/Linux):

```sh
npm ci
npm run validate
npm run release:web
```

The command creates a new directory and `.tar.gz` archive under `release/`. The bundle contains `site/`, file hashes, this guide and a Caddy configuration example. It never publishes or changes DNS. Existing bundles are preserved. A source revision and dirty-worktree indicator identify the build inputs; these do not certify security or content rights.

Upload only the contents of `site/` as the web root. Never expose the repository, `.git`, `.env`, research, backups, logs or local caches through a web server.

## Hosting requirements

- Serve over HTTPS. Browser storage and file APIs depend on browser security policies.
- Resolve clean routes such as `/discover` to `/discover.html` and nested routes to their matching exported HTML. Keep query strings. Do not rewrite every missing path or asset to the homepage.
- Serve HTML with revalidation (`Cache-Control: no-cache`) so updates do not leave users on an old bundle. Preserve MIME types and `X-Content-Type-Options: nosniff`.
- Return 404 for missing paths, disable directory listing and accept only GET/HEAD for static content.
- Use an atomic directory or deployment switch. Keep the previous complete export available for rollback; do not mix HTML from one build with assets from another.

The default HTML currently requests no search-engine indexing while this candidate is under review. Remove that restriction only when the public release is approved.

## Optional self-hosting with Caddy

`deploy/Caddyfile.example` uses the [documented static file resolution](https://caddyserver.com/docs/caddyfile/directives/try_files). Install Caddy separately, then set `GLASS_NOTES_DOMAIN` to the domain you own and `GLASS_NOTES_WEB_ROOT` to the absolute `site/` directory. Validate before starting:

```sh
caddy validate --config deploy/Caddyfile.example --adapter caddyfile
caddy run --config deploy/Caddyfile.example --adapter caddyfile
```

For a bundled archive, the example is named `Caddyfile.example` at the bundle root. A public domain requires DNS pointing to the host, externally reachable ports 80/443 and writable persistent Caddy storage for certificate management. See [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https). No domain or hosting service is purchased by the build commands.

For isolated HTTP testing, copy the configuration, use `GLASS_NOTES_DOMAIN=http://127.0.0.1:4187`, add `bind 127.0.0.1` inside the site block, and disable the admin endpoint with a global `admin off` option. A loopback hostname alone does not restrict Caddy's listening interface. This test does not verify public DNS or TLS. Do not expose the development or preview server as the production website.

## User data and release checks

Records stay in each browser's local storage. Changing domain, subdomain, port or HTTP/HTTPS origin does not migrate them. Export a backup on the old origin and restore it on the new one. Backups are unencrypted and should never be uploaded with the website.

Before publishing, resolve software and third-party asset licences, complete security and secret scans, test mobile/desktop navigation and backup recovery, and verify production DNS/TLS and rollback. A successful static export alone does not complete these checks.
