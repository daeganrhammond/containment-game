# Canonical bridge interior art guide

There is one supported bridge design in the game: the integrated original bridge with the recessed foundry, cargo hold, and six fascia consoles. Do not generate or retain alternate bridge layouts.

## Production layers

- Canvas: 1672 × 941 design-art pixels.
- Closed bridge: `assets/bridge-command-foreground-foundry-smelt-refit-gold-detail.png`.
- Cargo hold open: `assets/bridge-command-foreground-foundry-smelt-refit-gold-cargo-open-detail.png`.
- Both foregrounds preserve a transparent window aperture. The exterior panorama is rendered behind them.
- Keep the foreground, console glass, cargo doors, foundry machine, output tray, center walking deck, and screen positions aligned across both states.

Use `ART_ASSET_HANDOFF.md` as the coordinate source for console insets and the foundry/cargo components. Never introduce a new bridge image into the application before checking it against the running browser build at matching 16:9 art bounds. Do not alter a browser screenshot or treat a screenshot as source artwork.