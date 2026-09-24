# Glass Notes

Glass Notes helps you find a cocktail, choose a source recipe and keep your own recipes, lists and flavour experiences.

The catalogue contains 367 cocktails, 371 source versions and 1,042 bottles. Search by name, ingredients or flavour, or use your cupboard to find recipes with fewer missing ingredients. The interface supports Chinese, English, French, German, Spanish, Korean, Japanese and Italian.

Personal records stay on your device. There are no accounts or automatic cloud sync. JSON backup and restore can move records between installations and browser origins. Backups are not encrypted.

## Run locally

Use Node.js 24 and npm:

```sh
npm ci
npm run web
```

For the exported website:

```sh
npm run build:web
npm run preview
```

Open http://127.0.0.1:4173. Rebuild after source changes. The preview server is for local testing.

## Build and test

```sh
npm run validate
npm run brand:check
```

Validation runs TypeScript checks, behaviour and content tests, Web export, and iOS JavaScript/resource export. An iOS resource export is not a signed app or a device test.

Windows builds use the existing Tauri wrapper:

```sh
npm run desktop:prepare
npm run desktop:test
npm run desktop:build
```

They require Rust with the MSVC toolchain, Visual Studio C++ build tools and the Windows SDK. The installer targets Windows x64 and installs for the current user. Installed use requires WebView2, not Node.js or Expo.

The Web application is a static website suitable for an independent domain. Hosting, DNS and HTTPS are configured separately; no particular hosting provider is required. See [hosting](docs/HOSTING.md), [architecture](docs/ARCHITECTURE.md) and [contributing](CONTRIBUTING.md).

## Data and images

Each search result represents one cocktail. All selected filters must match the same source version. Sources remain visible in the catalogue and recipe details.

Some names are editorial translations or transliterations; original names are shown when different. Flavour descriptions and alcohol estimates are guidance, not measured tasting results. Cocktail pictures include AI-created images reviewed against source references and do not represent source photographs.

Original application code is licensed under the [MIT licence](LICENSE), copyright 2026 AlexShen-Oguri. Third-party dependencies, images, datasets and trademarks retain their own terms; the code licence does not grant rights to them. Source attribution and third-party notices remain in the content and asset records.

The catalogue includes third-party product photographs whose redistribution permissions have not been independently confirmed. They are excluded from the MIT licence. See [third-party notices](THIRD_PARTY_NOTICES.md) and the asset records before reusing those files; inclusion in this repository does not grant permission from their rights holders.
