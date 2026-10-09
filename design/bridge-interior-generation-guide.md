# Starship Bridge Interior Generation Guide

## Assets

- **Locked window overlay:** `design/bridge-window-anchor-layer.png`
- **Canvas:** 1672 × 941 pixels
- **Alpha:** transparent areas must stay transparent

The PNG is the original window/frame pixels isolated as a transparent overlay. Place it above the newly generated interior. Do not paint into, warp, scale, crop, relight, recolor, or regenerate any nontransparent pixel in this overlay. Keep the canvas size and coordinates exact. The existing exterior vista/drift is composited behind the transparent opening by the game.

## Base prompt

> Create a new starship command bridge interior as a separate transparent PNG layer at exactly 1672 × 941 pixels. The supplied `bridge-window-anchor-layer.png` is a locked foreground overlay, not a style reference. Do not redraw or include a window, window frame, stars, planets, or exterior view. Leave the entire window opening clear. Keep every new object below the window sill or outside the protected window-frame area. The new design must be a complete architectural rework; do not reuse the original bridge's floor plan, console shapes, platform, or interior layout. Use a dark, comfortable palette and calm cinematic ambience. Include at least four distinct blank dark-glass screens/terminals, each with its own bezel and clearly separated physical panel, so each screen can receive its own animation and clickable control. Add small, clearly bounded indicator lights in clusters that can pulse intermittently; keep bloom tight to the fixture and preserve crisp material detail. Use restrained realistic floor reflections. No text, labels, logos, people, or UI graphics. Export with transparency and exact canvas alignment. Composite the untouched supplied window overlay above this layer as the final step.

## Apply one distinct design direction

Append exactly one of these to the base prompt for each generation:

### A — Cathedral command nave

> Make the bridge a monumental, symmetrical command cathedral with towering ribbed walls, deep vertical scale, multiple side galleries, broad amphitheater steps, and a raised command dais well below the window sill. Distribute at least eight separate dark screens across distinct side stations and tiers. Use charcoal stone-like composite, black metal, subdued brass, and sparse amber/cyan indicators. The atmosphere should feel solemn, spacious, and cinematic.

### B — Orbital observatory

> Make the bridge an elegant, asymmetrical orbital observatory with sweeping curved balconies, sculpted dark ceramic and smoked-glass surfaces, open circulation space, and crescent-shaped console islands. Do not use a central circular platform. Include six separate, individually framed dark screens across freestanding side consoles. Use deep indigo, graphite, and muted violet with soft indirect practical lighting. The atmosphere should feel calm, refined, and spacious.

### C — Tactical operations well

> Make the bridge a rugged, multi-level tactical operations pit with a sunken center floor, offset command tower, side operator bays, stairs and catwalks kept below the window sill, exposed trusses, service hatches, and armored bulkheads. Include at least ten individually framed dark screens distributed across clearly distinct sensor, navigation, and engineering stations. Use worn charcoal steel, desaturated navy, and sparse amber indicators. The atmosphere should feel practical, deep, and quietly intense.

## Assembly check

1. Keep the generated interior on its own layer.
2. Put the original window overlay above it at 100% scale and at `(0, 0)`.
3. Do not flatten or resize before aligning the layers.
4. Verify that the window opening remains transparent and unobstructed.
5. Confirm every screen is a separate surface with enough bezel clearance for independent animation and hit testing.
