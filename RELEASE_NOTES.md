# Containment Playtest v0.2.0

This is the second distinct public playtest version. The first published version is preserved at the `v0.1.0-playtest` Git tag. To return to this release later, check out `v0.2.0-playtest`.

## Highlights

- Reworked the Developer panel into navigable categories with live tuning, saved balance profiles, and grouped pickup controls.
- Added a size control for every pickup, measured against the metal-ball diameter and applied consistently to artwork and collision radius.
- Expanded picture-event art generation with varied palettes, layouts, astronomical, landscape, forest, and fractal motifs.
- Added tuning for per-level Treasure and Picture event chances, plus saved-versus-generated Picture and Waldo art selection.
- Expanded ball modifiers, pickup behaviors, pet systems, merchant progression, territory feedback, and wall-break effects.
- Added touch/swipe input for touch-enabled devices while retaining desktop drag controls.
- Retained GitHub Pages deployment from `main`; pushing a release commit triggers a fresh web build.

## Balance defaults

- Picture event chance: 50% per level.
- Treasure eligibility: 100% per level, with the existing treasure pickup weight unchanged.
- Saved Picture background selection: 50% when the library contains entries.
- Saved Waldo puzzle selection: 50% when the library contains entries.

All event rates can be changed from Developer settings and stored in a named balance profile.
