# Current asset handoff

## One canonical bridge

The game has exactly one playable bridge interior. It is the original integrated bridge with the recessed foundry and illuminated cargo hold. Alternate layouts and their assets are retired and must not be reintroduced as settings, saved preferences, runtime branches, or bundled artwork.

Production foreground pair, both transparent 1672×941 design-art bounds:

- `assets/bridge-command-foreground-foundry-smelt-refit-gold-detail.png` — doors closed.
- `assets/bridge-command-foreground-foundry-smelt-refit-gold-cargo-open-detail.png` — doors open, lit hold visible.

`App.tsx` selects these two files and crossfades them. The vista is rendered separately behind their transparent window. Do not bake the vista into bridge art or substitute an unreviewed duplicate asset.

## Measured console insets

Normalized to the 1672×941 bridge art canvas. These bounds describe the visible glass, not the outer bezel; visuals and hit targets must share them and respect each screen's tilt.

| Console | x | y | w | h | Tilt |
|---|---:|---:|---:|---:|---:|
| Credits | 0.025 | 0.744 | 0.068 | 0.050 | — |
| Themes | 0.128 | 0.727 | 0.084 | 0.041 | −3° |
| Flight Log | 0.241 | 0.720 | 0.060 | 0.047 | −7° |
| Starmap Jump / Atlas preview | 0.704 | 0.718 | 0.058 | 0.046 | +6° |
| Live sector | 0.785 | 0.738 | 0.078 | 0.039 | +4° |
| Bay Navigation | 0.894 | 0.750 | 0.076 | 0.050 | +4° |

These values live in `PANEL.original` in `BridgeInteriorAmbience.tsx`. The stage preview uses the `live` inset. The foundry machine, fire, rack, output tray, cargo hatch, and movement anchors are calibrated to this same canvas in their owning components. Keep the central deck and window clear.

## Exterior vistas

Keep background panoramas in `assets/bridge-vistas/`, catalogued in `bridgeVistaCatalog.ts`. `BridgeVistaRenderer.tsx` renders and animates the selected exterior behind the transparent foreground, using the same centered 16:9 art bounds. Vistas must not include a ship interior, frame, or gameplay UI.

## Verification

Before release, inspect the actual localhost bridge at a regular desktop viewport, confirm the six screen overlays remain inside their glass, click Bay Navigation and Cargo Hold, and verify closed/open hold art. Run lint, TypeScript, web export, and Playwright desktop/phone checks. Then verify the published page and exact deployed commit; matching hashes alone do not prove the screen layout is correct.