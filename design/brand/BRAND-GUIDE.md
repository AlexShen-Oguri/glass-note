# Glass Notes brand assets

The Liquid G and Glass Notes wordmark use the contours of `design/brand/selected-reference.png`. The source image SHA-256 is `13d2cce880a22c5e15e45bd26b9fc42d209571c926ff2b1cfa3b11a611eb692f`.

The lockup is one shape: do not replace its typeface, redraw the G separately, stretch it or crop it with cover. The app mark uses its own traced source region. Ivory `#F0EBDF` is used on dark backgrounds; ink `#101714` on light backgrounds. The mark itself has no glow, shadow or animation.

Run `npm run brand:build` to trace, compare and generate shared Web, Expo and Tauri assets. Comparison checks the source hash and requires contour overlap of at least 0.995 before generation. `npm run brand:check` verifies the versioned asset manifest. Preserve both scripts and manifest-referenced sources.

The horizontal production canvas is 1024 × 275; toolbar lockups scale proportionally. Stable application identifiers and personal-data keys must not change when brand assets change.

These consistency checks do not establish trademark rights or replace visual checks on target devices.
