# Glass Notes brand assets

The Liquid G and Glass Notes wordmark use the contours of `assets/brand/reference.png`. The source image SHA-256 is `13d2cce880a22c5e15e45bd26b9fc42d209571c926ff2b1cfa3b11a611eb692f`.

The lockup is one shape: do not replace its typeface, redraw the G separately, stretch it or crop it with cover. The app mark uses its own traced source region. Ivory `#F0EBDF` is used on dark backgrounds; ink `#101714` on light backgrounds. The mark itself has no glow, shadow or animation.

Run `npm run brand:build` to trace, compare and generate shared Web, Expo and Tauri assets. Comparison checks the source hash and requires contour overlap of at least 0.995 before generation. `npm run brand:check` verifies the versioned asset manifest. Preserve both scripts and manifest-referenced sources.

The horizontal production canvas is 1024 × 275; toolbar lockups scale proportionally. Stable application identifiers and personal-data keys must not change when brand assets change.

These consistency checks do not establish trademark rights or replace visual checks on target devices.


This directory is the maintained brand source. `reference.png`, traced SVGs, geometry and the manifest define the mark and lockup; app PNGs are also kept here. Web and desktop entry points prepare the ignored `public/brand/` icons and the six ignored `src-tauri/icons/` outputs automatically. Their paths and public URLs are stable; they are not duplicate maintenance directories.

Contour and production previews are generated under ignored `artifacts/brand/`. To deliberately update the identity, run `npm run brand:build` and review the source/manifest diff. `brand:check` restores missing generated icons and fails if maintained inputs differ from the manifest.
