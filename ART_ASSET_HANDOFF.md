# Containment — Graphics Generation Checklist

Use this as the inventory for brainstorming and generating replacement or alternate graphics. Match the stable IDs exactly when returning proposed art so it is clear which game slot and animation the files belong to. Generate alternatives freely; do not assume the names below prescribe the visual design.

## Minimal integration context

- Game: **Containment**, a desktop-first Expo / React Native browser game. Source repo: <https://github.com/daeganrhammond/containment-game>.
- Graphics combine imported transparent PNG concept art with code-drawn effects and programmatic animations. Static art is supported in the selected skin slots; frame-based imported animation sheets still need a shared playback pipeline.
- Current version commit: `4674c140c4b245e036ab9dcf4a96f996dfcc3bb7` (`v0.1.0-playtest`).
- Return transparent PNGs for raster art (SVG is also useful for icons/decals). For frame animation, return either consistently sized numbered PNG frames or a uniform-cell sprite sheet, plus a small manifest with frame order, FPS, loop/one-shot, canvas dimensions and anchor/pivot. Include a contact sheet/preview.
- Keep each object/effect on a consistent canvas and retain alpha where appropriate. Do not bake in UI, labels, or backgrounds unless the requested asset is a full-board background or scene.
- Art does not change game physics. Metal balls have a circular collision shape. Standard pickups have a circular hitbox 1.4× the ball radius; Bubble's hitbox is 1.2× the standard pickup hitbox. Pickup art may use any silhouette and extend beyond its hitbox. The route beacon cannot despawn or be destroyed.
- Design freely. The IDs and slots below identify where an asset attaches; they are not visual constraints. Related idle and event animations for a selected skin should share a coherent theme.
- Output path suggestion: `assets/art/<category>/<stable-id>/`. Name files `<stable-id>_<slot>[_NN].png`, e.g. `vital-seed_idle.png`, `vital-seed_capture_01.png`.

## Command bridge layering contract

- `assets/bridge-command-foreground.png` is the transparent foreground cutout aligned to the bridge's 1672×941 design canvas. Preserve that canvas and keep every window opening transparent when preparing updated interior art.
- The bridge panorama is an independent exterior layer behind the cutout. One selected photo spans the center and both side panes; automatic rotation is populated from built-in scenery plus the user's uploaded vista library. The renderer uses the same aspect-fitted design-art bounds and centered offset as the transparent foreground, clips drift within those bounds, and never exposes the panorama outside the windows. Do not bake a specific vista into replacement interior art.
- Built-in exterior plates and their ambient profiles are cataloged in `bridgeVistaCatalog.ts`; `BridgeVistaRenderer.tsx` composes the selected plate with reusable, independently timed effects. Panoramas continuously sweep and gently zoom beneath the fixed bridge frame. Deep-space traffic uses four independently scheduled crossing slots, with no more than four ships visible at once; a craft remains visible until it has fully cleared the view.
- `assets/bridge-vistas/blue-ringworld-vista.jpg` is the first optimized 1536×864 panorama. Transparent ship sprites are cataloged in `bridgeShipCatalog.ts`: `survey-shuttle-sprite.png` (original, 664×345), `ships/blue-spear-interceptor.png` (1536×1024), `ships/ironwake-hauler.png` (1728×910), and `ships/needlewing-courier.png` (1723×913). Ships travel in either direction behind the interior and across the full panorama bounds, including the side windows. Engine glow is a soft code-driven layer attached to each craft.
- New built-in panorama plates (all optimized to 1536×864 JPEG) are registered in `bridgeVistaCatalog.ts`: `pelagic-megacity` (`assets/bridge-vistas/pelagic-megacity.jpg`), `emberline-shipyard` (`assets/bridge-vistas/emberline-shipyard.jpg`), `nacre-ice-giant` (`assets/bridge-vistas/nacre-ice-giant.jpg`), and `eventide-binary-eclipse` (`assets/bridge-vistas/eventide-binary-eclipse.jpg`). Reusable renderer profiles add gentle weather/rain and city glints, shipyard beacon glints, drifting aurora/ring glints, and a soft eclipse-corona pulse respectively; all retain panorama drift and independently routed traffic.
- Generated bridge vista plates (1672×941 PNG) are registered in `bridgeVistaCatalog.ts`: `glass-desert-dawn` → `glass-desert`, `pilgrim-beacons` → `pilgrim-beacons`, `aurora-reef` → `aurora-reef`, `comet-caravan` → `comet-caravan`, `blue-meridian` → `blue-meridian`, `vesper-horizon` → `vesper-horizon`, `blueworld-patrol` → `blueworld-patrol`, `dawnward-escort` → `dawnward-escort`, `emberfall-frontier` → `emberfall-frontier`, and `leviathan-orbit` → `leviathan-orbit`; each file is under `assets/bridge-vistas/<scene-id>.png`.
- `cinder-comet-shoals` and `copperline-orbital-foundry` currently use the shared panorama drift only. Their experimental crack and lamp overlays were removed because they did not create enough convincing motion at normal viewing size.
- The shared bridge drift runs on both the browser JS animation driver and the native driver. Each scene gets a seeded, continuous random walk toward changing safe edges of the panorama, with varied directions, a gentle randomized zoom, eased 30–82 second legs, and brief pauses. At each edge it chooses a new direction without snapping to a starting point. Preserve this behavior for uploaded and built-in vistas.
- Future scene motion should start with an approved feature map from the actual source: identify one or two visible subjects, mark their precise source-image bounds, and prepare an image-based motion sample before writing renderer code. Prefer a short image-to-video loop for organic motion such as clouds, fire, or moving machinery. Use code overlays only for effects that can be convincingly registered and previewed at normal window size. Do not spend time refining a mask if a two-frame browser comparison cannot clearly show the effect.
- Keep the preview path short: use the existing local server, pin one vista in Developer, capture the still and motion sample, and ask for a visual decision before expanding to the next scene. Reuse a common player for approved loops/masks; do not add one-off animated components until a source-based preview is accepted.
- The bridge vista player supports still panoramas and local MP4 video scenes through `expo-video` (SDK 57). The Krea test scene `krea-space-scape` is `assets/bridge-vistas/krea-space-scape.mp4` (2560×1440, H.264/AAC, 6.58 seconds, 9,034,760 bytes); it autoplays muted and loops under the existing clipped window mask and varied drift. The clip loop repeats, but its endpoints are not guaranteed to be seamless. Keep video assets short and test their playback in browser and native builds.
- Uploaded bridge vistas keep the existing saved archive format. The renderer selects a stable ambience profile from descriptive filename/name terms, then a deterministic per-image fallback when terms are inconclusive. The profile adds restrained scene effects; the panorama itself keeps a seeded, randomized drift route so each uploaded scene has distinct direction, travel, zoom, easing, and duration. This is filename-based routing, not semantic recognition of image pixels; independent movement of a specific photographed object requires preparing a separate cutout/background layer.
- Reusable `nebula-clouds` and `asteroid-belt` profiles add independent, slow cloud-form drift and small debris passes. Keep them behind the bridge foreground, clipped to the existing panorama bounds, with per-scene seeded placement/timing and the browser-safe JS animation driver on web.
- The playable board occupies the center viewing area only. Side panes continue to show the exterior. Game Picture events belong to the game board and must not override the menu's exterior vista.
- Interactive consoles, interior animations, and future room props belong on separate foreground/UI layers so they can animate without changing window masks or exterior alignment.

## Integrated concept art

Selected concepts from the recent graphics pass are now used by gameplay and Developer previews. The 4×4 transparent source atlases are preserved as `assets/selected-skins-atlas.png` and `assets/selected-skins-atlas-2.png`; individual cells are sliced under `assets/skins/selected/` and `assets/skins/selected-2/`. `scripts/slice-skin-atlas.cjs` reproduces those slices. Credit symbols use `assets/credits/`, and the full-board procedural-event backgrounds use `assets/backgrounds/`.

The integrated skin art covers Singularity Reliquary, Clockwork Sun, Ironwake Asteroid, Phoenix Ember, Moth Lantern, Thunder Lattice, Ion Skiff, Mantis Breacher, Meteor Maul, Radiant Coin, Star Reliquary, Orbital Astrolabe, Wayfinder Compass, Merchant Fleet Coin, Star Chart Astrolabe, Skyglass Merchant, Lantern Gate Token, Aurora Crown, Tiny Glassworld, Inkblot Comet, Striped Scout, Brass Finder Badge, Solar Mint Seal, Circuit Ledger Relay, Void Prism Scrip, all three Engi egg capsules, all three Engi pet concepts, and both additional exit craft. Sunshard, Circuit Chit, and Void Prism credit symbols are separate raster assets.

Existing mechanics supply idle motion and the stable-ID capture/break effects for these assets. Imported sprites remain decorative: collision radius, pickup behavior, and animation-event timing are controlled by game code.

## Maintenance convention

When adding future skins, effects, animation variants, or asset categories, update this checklist in the same format: record the stable game ID, display name when applicable, and the object/effect slot it attaches to. Keep visual descriptions and design prescriptions out of the inventory so external agents can brainstorm freely. Add only technical integration context needed to make the generated files usable.

## Generation request

For each selected entry below, generate one or more **distinct visual concepts** for its idle/skin art and its listed animation variants. Return a mapping from generated filename to the exact stable ID and animation slot. The goal is to let the game team select and integrate variants without guessing which object/effect they belong to.

## Skinnable objects and attached animation slots

### Metal ball skins — attach to `BALL_SKINS`

| Stable ID | Display name | Additional modifier overlays that must remain compatible |
|---|---|---|
| `polished-chrome` | Polished Chrome | `anchor`, `splitter`, `skimmer`, `drifter-active`, `phase` |
| `brushed-steel` | Brushed Steel | same |
| `machined-gunmetal` | Machined Gunmetal | same |
| `celestial-plasma` | Celestial Plasma | same |
| `verdant-seed` | Verdant Seed | same |
| `voidglass` | Voidglass | same |
| `asteroid` | Ironwake Asteroid | same |
| `singularity-reliquary` | Singularity Reliquary | same |
| `clockwork-sun` | Clockwork Sun | same |

Ball-skin slot: `idle`. Modifier-specific overlays/states: `anchor-active`; `splitter-before-split`; `skimmer-active`; `drifter-active`; `phase-active`; optionally `ram-charged`.

### Pickup skins — attach to `PICKUP_SKINS[kind]`

Each skin has an `idle` asset, a passive travel animation/state, and the named capture animation. If a break animation is listed, also provide it for that skin. Pickup physics and input are shared within each kind. Bubble and Treasure are not auto-collected just because they spawn or drift over already-claimed territory; they must be directly tapped or actively captured by a new claim.

| Kind | Stable ID | Display name | Capture animation | Break animation |
|---|---|---|---|---|
| Life | `classic-heart` | Classic Heart | `heart-beat` | — |
| Life | `vital-seed` | Vital Seed | `seed-bloom` | — |
| Life | `ruby-prism` | Ruby Prism | `ruby-shatter` | — |
| Life | `ember-bloom` | Ember Bloom | `heart-flare` | — |
| Life | `necrotic-heart` | Necrotic Heart | `necrotic-spores` | — |
| Life | `crimson-orb` | Crimson Star Orb | `orb-burst` | — |
| Life | `phoenix-ember` | Phoenix Ember | `phoenix-rise` | — |
| Life | `moth-lantern` | Moth Lantern | `moth-bloom` | — |
| Speed | `electric-star` | Electric Star | `electric-surge` | — |
| Speed | `ion-comet` | Ion Comet | `speed-comet` | — |
| Speed | `phase-ribbon` | Phase Ribbon | `speed-ribbon` | — |
| Speed | `pulse-engine` | Pulse Engine | `speed-pulse` | — |
| Speed | `solar-dash` | Solar Dash | `speed-comet` | — |
| Speed | `thunder-lattice` | Thunder Lattice | `thunder-collapse` | — |
| Speed | `ion-skiff` | Ion Skiff | `ion-launch` | — |
| Ram | `spark-orb` | Spark Orb | `ember-impact` | — |
| Ram | `wedge-core` | Wedge Core | `metal-shatter` | — |
| Ram | `flanged-mauler` | Flanged Mauler | `gear-shock` | — |
| Ram | `shock-piston` | Shock Piston | `piston-strike` | — |
| Ram | `cinder-meteor` | Cinder Meteor | `meteor-burst` | — |
| Ram | `mantis-breacher` | Mantis Breacher | `mantis-snap` | — |
| Ram | `meteor-maul` | Meteor Maul | `meteor-reform` | — |
| Treasure | `gilded-coffer` | Gilded Coffer | `golden-cache` | — |
| Treasure | `suncoin` | Suncoin | `coin-glint` | — |
| Treasure | `radiant-coin` | Radiant Coin | `radiant-flare` | — |
| Treasure | `moon-silver` | Moon Silver | `silver-shimmer` | — |
| Treasure | `star-reliquary` | Star Reliquary | `reliquary-unseal` | — |
| Treasure | `orbital-astrolabe` | Orbital Astrolabe | `astrolabe-awaken` | — |
| Merchant | `compass-wheel` | Wayfinder Compass | `compass-pulse` | `compass-break` |
| Merchant | `merchant-sailing-coin` | Merchant Fleet Coin | `sailcoin-glint` | `shipcoin-break` |
| Merchant | `star-chart-astrolabe` | Star Chart Astrolabe | `chart-unfold` | `chart-shatter` |
| Merchant | `skyglass-merchant` | Skyglass Merchant | `ship-launch` | `glass-fracture` |
| Merchant | `lantern-gate-token` | Lantern Gate Token | `bazaar-opening` | `gate-collapse` |
| Bubble | `cosmic-pearl` | Cosmic Pearl | `bubble-pop` | — |
| Bubble | `prismatic-soap` | Prismatic Soap | `bubble-pop` | — |
| Bubble | `nebula-cell` | Nebula Cell | `bubble-pop` | — |
| Bubble | `aurora-crown` | Aurora Crown | `aurora-bloom` | — |
| Bubble | `tiny-glassworld` | Tiny Glassworld | `glassworld-pop` | — |
| Bubble | `inkblot-comet` | Inkblot Comet | `inkblot-pop` | — |
| Waldo | `striped-scout` | Striped Scout | `waldo-triumph` | — |
| Waldo | `finder-badge` | Brass Finder Badge | `finder-spark` | — |
| Credit | `mint-scrip` | Mint Scrip | `credit-cascade` | `token-fracture` |
| Credit | `ledger-relay` | Ledger Relay | `credit-surge` | `drone-spark` |
| Credit | `solar-mint-seal` | Solar Mint Seal | `mint-solarburst` | `mint-fracture` |
| Credit | `circuit-ledger-relay` | Circuit Ledger Relay | `ledger-rain` | `ledger-fracture` |
| Credit | `void-prism-scrip` | Void Prism Scrip | `prism-cascade` | `prism-fracture` |
| Engi egg | `engi-cocoon` | Aegis Petal Cocoon | `cocoon-unfurl` | `cocoon-crack` |
| Engi egg | `engi-seed-pod` | Sentinel Seed Pod | `eye-awakening` | `pod-fracture` |
| Engi egg | `engi-scarab-capsule` | Scarab Shell Capsule | `scarab-emerge` | `shell-scatter` |
| Exit | `sector-beacon` | Wayfinder Courier | `sector-warp` | — |
| Exit | `courier-skiff` | Aegis Courier Skiff | `skiff-warp` | — |
| Exit | `folded-transit` | Foldspace Transit | `folded-transit` | — |

Shared pickup state slots: `idle/travel`, `capture`, optional `break`, `despawn-warning`. Speed also has a continuous `spin` slot. Life skins use `beat/pulse`; Treasure and Merchant coins do not spin. Bubble has `sheen` and `pop`. Route beacon has `gentle-steer` and `capture/warp`. Other pickups each have passive travel motion appropriate to their art.

### Credit symbol skins — attach to `CREDIT_SKINS`

Slot for each: `hud-symbol`; additionally `gain-symbol` and `merchant-symbol` (same mark, shown at different scales).

| Stable ID | Display name | Passive animation |
|---|---|---|
| `sunshard` | Sunshard Seal | `sunshard-pulse-glint` |
| `circuit-chit` | Circuit Chit | `circuit-scan` |
| `void-prism` | Void Prism | `void-prism-refraction` |
| `tidal-pearl` | Tidal Pearl | `tidal-orbit` |
| `ember-scrip` | Ember Scrip | `ember-flicker` |

### Arena background skins — attach to `BACKGROUND_SKINS`

| Stable ID | Display name |
|---|---|
| `abyss` | Abyss |
| `violet` | Violet Vault |
| `verdant` | Verdant |
| `ember` | Ember |
| `slate` | Slate |

### Procedural Picture-event themes — attach to `PICTURE_EVENT_THEMES`

These are instructions for generating the image revealed by claimed territory during a Picture event. They are not normal arena backgrounds and should not appear in the arena-background selector.

| Stable ID | Theme |
|---|---|
| `stellar-nebula` | Stellar Nebula |
| `cosmic-forest` | Astral Grove |
| `fractal-sky` | Fractal Sky |

The current procedural renderer assigns one theme per Picture event seed and combines it with varied palettes and layouts. The PNGs in `assets/backgrounds/` are visual references for these themes, not selectable arena skins.

Also used behind/within the board: procedural Picture-event art and saved Picture-event images; Waldo crowd-scene art and a separate saved Waldo-image library. Those event images are full-board portrait images, revealed progressively by claimed territory. Waldo event art needs the Waldo target location recorded separately as normalized `x/y` coordinates (0–1, origin top-left).

## Non-skin animation/effect variants

These are animation slots attached to gameplay events, rather than object skins. Generate named alternatives by slot; do not create new mechanics.

### Wall-break effects — attach to `wallBreakStyle`

- `glass-shards`
- `ember-snap`
- `sonic-shear`
- `wall-crack`
- `wall-crumble`
- `anchor-break` (Anchor breaks a wall segment to its nearest junction)

### Territory, combo, credit and smelter

- `territory-gain-01` … `territory-gain-N` — percentage-gain popup variants; randomized when territory is claimed; placement is wall or captured area.
- `combo-capture` — multi-pickup capture flourish; followed by Bubble spawning.
- `skewer-capture` — pickup capture plus blue crackle traveling along the actual skewering wall; longer than regular capture.
- `credit-gain-orbiting` — +amount and selected credit symbol, orbiting variant.
- `credit-gain-ticker` — +amount and selected credit symbol, drifting ticker variant.
- `overflow-smelt-start`, `overflow-smelt-success`, `overflow-smelt-failure` — resource-to-Credit processing.
- `despawn-warning-pulse` — shared final-five-second opacity pulse for pickups configured to despawn.
- `isotypes-contained` — stage-center text overlay; exact string: “Isotypes Contained”.
- `pickup-break` — pickup-specific impact/break effects where applicable: Merchant collision, Credit collision, Engi Cocoon collision, Anchor collision with a pickup, and phase chest break.

### Ram, collision, treasure and phase events

- `ram-hit` — successful ball target activation.
- `ram-miss` — miss explosion at tap location.
- `ram-wall-shatter` — charged ball safely breaks the next wall it hits.
- `treasure-jackpot-reveal`, `treasure-jackpot-burst`, `treasure-reward-cascade`.
- `phase-active` — active Phase ball overlay; `phase-rupture`; `phase-chest-break`.
- `anchor-charged-break` — high-speed Anchor wall cutting.
- `speed-ball-impact` — Speed pickup destroyed; impacted ball accelerates.
- `bubble-capture-pop`, `bubble-tap-pop`, `bubble-lost`.
- `merchant-token-break` — use Merchant skin’s configured break animation.
- `pickup-impact-break` — individual break effects for each pickup type that can be destroyed by a projectile; bind to the impacted pickup skin where a per-skin break slot exists.

### Waldo and pets

- `waldo-found-fireworks` — Waldo found callout/fireworks.
- `engi-hatch`, `engi-wall-repair`, `engi-break/loss`.
- `waldo-pet-clean`, `waldo-pet-wander`, `waldo-pet-paint`, `waldo-pet-hang-painting`, `waldo-pet-climb`, `waldo-pet-rest`, `waldo-pet-hit/loss`.
- Engi pet loop/task states: `engi-inspect`, `engi-weld`, `engi-scan`, `engi-tinker`, `engi-rest`, `engi-wander`, `engi-jump`, `engi-climb`.
- Waldo wall-art thumbnails: `waldo-painting-01` … `waldo-painting-05`.

### Level transition

Attach to `levelClearStyle`:

- `nova` — Starforge Nova.
- `prism` — Prismatic Gate.
- `rift` — Signal Rift.

### Merchant ambience

- `merchant-background` — static scene layers.
- `merchant-npc-walk-loop`, `merchant-npc-interact-loop`, `merchant-reactor-idle-loop`, `merchant-power-assign`, `merchant-power-unassign`, `merchant-purchase`.
- `merchant-reward-type` — modular reward-card icon slots; current kinds: Life, Speed, Ram, Treasure, Waldo. Keep additional slots open for future reward kinds.

## Current skin records for brainstorming variants

### Ball skins

`polished-chrome` — Polished Chrome; `brushed-steel` — Brushed Steel; `machined-gunmetal` — Machined Gunmetal; `celestial-plasma` — Celestial Plasma; `verdant-seed` — Verdant Seed; `voidglass` — Voidglass; `asteroid` — Ironwake Asteroid; `singularity-reliquary` — Singularity Reliquary; `clockwork-sun` — Clockwork Sun.

### Pickup skins

- Life: `classic-heart` Classic Heart; `vital-seed` Vital Seed; `ruby-prism` Ruby Prism; `ember-bloom` Ember Bloom; `necrotic-heart` Necrotic Heart; `crimson-orb` Crimson Star Orb; `phoenix-ember` Phoenix Ember; `moth-lantern` Moth Lantern.
- Speed: `electric-star` Electric Star; `ion-comet` Ion Comet; `phase-ribbon` Phase Ribbon; `pulse-engine` Pulse Engine; `solar-dash` Solar Dash; `thunder-lattice` Thunder Lattice; `ion-skiff` Ion Skiff.
- Ram: `spark-orb` Spark Orb; `wedge-core` Wedge Core; `flanged-mauler` Flanged Mauler; `shock-piston` Shock Piston; `cinder-meteor` Cinder Meteor; `mantis-breacher` Mantis Breacher; `meteor-maul` Meteor Maul.
- Treasure: `gilded-coffer` Gilded Coffer; `suncoin` Suncoin; `moon-silver` Moon Silver.
- Merchant: `compass-wheel` Wayfinder Compass; `merchant-sailing-coin` Merchant Fleet Coin; `star-chart-astrolabe` Star Chart Astrolabe; `skyglass-merchant` Skyglass Merchant; `lantern-gate-token` Lantern Gate Token.
- Bubble: `cosmic-pearl` Cosmic Pearl; `prismatic-soap` Prismatic Soap; `nebula-cell` Nebula Cell; `aurora-crown` Aurora Crown; `tiny-glassworld` Tiny Glassworld; `inkblot-comet` Inkblot Comet.
- Bubble: `cosmic-pearl` Cosmic Pearl; `prismatic-soap` Prismatic Soap; `nebula-cell` Nebula Cell.
- Waldo: `striped-scout` Striped Scout; `finder-badge` Brass Finder Badge.
- Credit: `mint-scrip` Mint Scrip; `ledger-relay` Ledger Relay; `solar-mint-seal` Solar Mint Seal; `circuit-ledger-relay` Circuit Ledger Relay; `void-prism-scrip` Void Prism Scrip.
- Engi egg: `engi-cocoon` Aegis Petal Cocoon; `engi-seed-pod` Sentinel Seed Pod; `engi-scarab-capsule` Scarab Shell Capsule. A cocoon pickup is assigned one of these three skins at random when it spawns.
- Exit: `sector-beacon` Wayfinder Courier; `courier-skiff` Aegis Courier Skiff; `folded-transit` Foldspace Transit.

### Pet skins

Attach to `ENGI_PET_SKINS`; each gets the shared task slots listed above:

- `salvage-engi` — Aegis Scaffold.
- `verdant-engi` — Mica Cartographer.
- `cobalt-engi` — Bellows Pilgrim.
- Waldo pet stable ID: `classic-waldo`.

## Returned-file mapping template

| Filename | Category | Stable object ID | Slot / animation ID | Dimensions / frames | Loop or one-shot |
|---|---|---|---|---|---|
| `...` | `pickup` / `effect` / `pet` / `background` | `...` | `...` | `...` | `...` |

One row per file/animation. Keep one concept per stable ID and slot, then add lettered or numbered concept suffixes for alternatives, such as `vital-seed_capture_concept-a_01.png` and `vital-seed_capture_concept-b_01.png`.

### New exterior vistas (2026-10-08)

Seven user-supplied 1376×768 images were optimized as JPEG plates under `assets/bridge-vistas/` and added to `bridgeVistaCatalog.ts`. These are still-image scenes with `ambience: 'none'`, so each gets the shared bridge drift only:

- `violet-rimlands` — `violet-rimlands.jpg` (146,342 bytes)
- `quiet-supernova` — `quiet-supernova.jpg` (162,624 bytes)
- `pilgrim-ring-station` — `pilgrim-ring-station.jpg` (114,474 bytes)
- `umbral-shardfield` — `umbral-shardfield.jpg` (75,007 bytes)
- `roseglass-observation-deck` — `roseglass-observation-deck.jpg` (170,526 bytes; intentionally depicts an observation-deck interior/window as a special nested vista)
- `midnight-anchorage` — `midnight-anchorage.jpg` (141,898 bytes)
- `somber-nebula` — `somber-nebula.jpg` (93,618 bytes)

### Picture Event vista unlocks

Future built-in vista art can join both Picture Event rotation and the bridge archive by setting `pictureEventUnlock: true` on its `bridgeVistaCatalog.ts` entry. That single static image is used for the board event and the exterior vista. The player earns its permanent, cross-run unlock after collecting the level-clear beacon; the Themes tab lists independent locked stars with no fixed order. Developer → Events has unlock-all, reset, and per-scene switches for paired entries. Existing scenes remain freely available unless explicitly marked for this reward path.

### New generated exterior vistas (2026-10-08)

Six generated 1672×941 PNG scenes were added as new Picture Event rewards and window vistas. Each uses the existing continuous bridge drift (`ambience: 'none'`) without scene-specific animation. Clearing the level after discovering its Picture Event permanently unlocks the matching vista in the Themes → Window Vistas tree. Developer event controls can unlock/reset each scene for playtesting:

- `amber-ringworld` — `assets/bridge-vistas/amber-ringworld.png` (2,453,919 bytes)
- `violet-giant` — `assets/bridge-vistas/violet-giant.png` (2,325,417 bytes)
- `emerald-ocean` — `assets/bridge-vistas/emerald-ocean.png` (2,402,661 bytes)
- `ancient-megastructure` — `assets/bridge-vistas/ancient-megastructure.png` (2,332,990 bytes)
- `eclipse-over-fire` — `assets/bridge-vistas/eclipse-over-fire.png` (2,509,609 bytes)
- `star-nursery` — `assets/bridge-vistas/star-nursery.png` (2,757,890 bytes)

### New approved vista collection and traffic craft (2026-10-08)

Ten user-approved generated vista concepts are registered as Picture Event rewards (`pictureEventUnlock: true`) and use the shared bridge drift only. Photo plates were downsampled to 1536×864 JPEG at quality 91 for web/mobile size:

- `broken-halo` — `assets/bridge-vistas/broken-halo.jpg` (308,526 bytes)
- `wandering-world` — `assets/bridge-vistas/wandering-world.jpg` (191,305 bytes)
- `glass-sea` — `assets/bridge-vistas/glass-sea.jpg` (267,944 bytes)
- `red-dwarf-shadow` — `assets/bridge-vistas/red-dwarf-shadow.jpg` (260,735 bytes)
- `great-storm` — `assets/bridge-vistas/great-storm.jpg` (327,276 bytes)
- `pilgrim-fleet` — `assets/bridge-vistas/pilgrim-fleet.jpg` (205,553 bytes)
- `gravity-well` — `assets/bridge-vistas/gravity-well.jpg` (279,921 bytes)
- `hanging-gardens` — `assets/bridge-vistas/hanging-gardens.jpg` (395,913 bytes)
- `silent-wreck` — `assets/bridge-vistas/silent-wreck.jpg` (357,098 bytes)
- `far-lanterns` — `assets/bridge-vistas/far-lanterns.jpg` (292,812 bytes)

Three isolated transparent craft were added to `BRIDGE_SHIP_SKINS`; existing random selection and the four-craft simultaneous cap remain in effect:

- `pilgrim-courier` — `assets/bridge-vistas/ships/pilgrim-courier.png` (1983×793, 1,422,127 bytes)
- `greenline-surveyor` — `assets/bridge-vistas/ships/greenline-surveyor.png` (1774×887, 1,272,490 bytes)
- `asteroid-salvage-tug` — `assets/bridge-vistas/ships/asteroid-salvage-tug.png` (1774×887, 2,184,534 bytes)

Vista drift uses randomized eased legs of 18–100 seconds and zoom targets from 1.005× to 1.10× to widen the motion/speed variation.

### Bridge console controls and registered light layer (2026-10-08)

Interactive Themes, Scores, Play Mode, and Nav Console controls are mapped to the four built-in bridge console faces. The transparent foreground is 1672×941; panel bounds are normalized in `BridgeInteriorAmbience.tsx`. `assets/bridge-ambient-emission.png` (1672×941, 174,005 bytes) is derived from the cyan and amber fixture pixels in `assets/bridge-command-foreground.png`, with spill clipped against the foreground alpha so the window remains clear. Regenerate it with `node scripts/build-bridge-emission.cjs`; the app animates the registered layer with a restrained irregular flicker.


### Alternative bridge interior (2026-10-09)

A selectable Cathedral bridge interior was added without replacing the original. Developer → Gameplay → Bridge Interior switches between ORIGINAL BRIDGE and CATHEDRAL ALTERNATIVE; the choice persists on this device. The original remains the default. Both alternate image layers use the original 1672×941 canvas. The alternate foreground alpha was clipped to the original foreground alpha so the window opening remains transparent and the exterior vista/drift renderer stays independent.

The Cathedral alternative reuses the original foreground through the window sill, then blends into its new lower bridge interior. This keeps the original window frame, aperture, and vista alignment unchanged while preserving the alternate steps and floor. Its four screen faces now display separate idle holograms for Themes, Scores, Play Mode, and Bay Navigation, with each screen's symbol, name, live value, and click action integrated in the same control.

- assets/bridge-command-cathedral-alt.png (1672×941; 1502490 bytes)
- assets/bridge-ambient-emission-cathedral-alt.png (1672×941; 1460656 bytes)

### Integrated bridge cargo access (2026-10-10)

The cargo hold is now represented by a physical double-door hatch beneath the left console in both bridge layouts. The new foreground variants retain the 1672×941 canvas and the original window opening; their alpha changes are confined below the window edge. The original bridge now uses `bridge-command-foreground-cargo.png` so its hatch is actually present under the occupancy display. The display and animated opening reveal are aligned to that hatch, and clicking it opens the shared Cargo Hold over the bridge. The floating mini-sector card and developer tile were removed from the bridge view; launch, resume, and jump actions now live on the Starmap console.

- `assets/bridge-command-foreground-cargo.png` (1672×941)
- `assets/bridge-command-cathedral-cargo.png` (1672×941)

### Per-layout screen alignment (2026-10-10)

Console animation bounds and click targets are calibrated independently for each interior in `BridgeInteriorAmbience.tsx`. The original layout uses its four separate monitor insets. Cathedral's two wide monitors are divided into four separate, animated navigation zones. Each visible animation and its hit target use the same rotation and normalized bounds, so text and interactions remain on the glass as the bridge scales.
- Stable selector id: cathedral
- This is an interior variant, not a vista; exterior scene selection and drift are unchanged.

### Integrated bridge monitor refit (2026-10-10)

The original bridge lower console fascia now has four substantially larger recessed glass monitors integrated into the physical artwork. The app renders only live animation and labels within the glass, without adding a second opaque screen card or bezel. The generated lower interior is composited below source row 639; byte comparison confirms the original foreground RGBA data from rows 0–639 is preserved exactly, including the full window, frame, and sill. The original bridge's blurred emission overlay is disabled so the new consoles retain their sharp, restrained lighting.

- `assets/bridge-command-foreground-integrated.png` (1672×941; 1,860,554 bytes)
- Generated with built-in image generation, then composited with the existing source window/sill region before integration.
- Four clickable display bounds are independently calibrated in `BridgeInteriorAmbience.tsx` for Themes, Scores, Starmap Jump, and Bay Navigation.

### Open-deck console alignment (2026-10-10)

The current original bridge foreground is `assets/bridge-command-foreground-open-deck.png`, with its door-open companion `assets/bridge-command-foreground-open-deck-cargo-open.png`. Both remain on the 1672×941 design-art canvas. This revision removes bulky lower-corner furniture to preserve the center deck for future crew ambience and exposes six physical glass faces: cargo readout, Themes, Flight Log, Starmap Jump, live sector preview, and Bay Navigation. The established window aperture and exterior rendering remain independent.

The glass insets below are normalized to that canvas and live in `PANEL.original` in `BridgeInteriorAmbience.tsx`. They are the safe content bounds (inside the cyan rim), not the full monitor bezel:

| Display | x | y | w | h | Tilt |
|---|---:|---:|---:|---:|---:|
| Cargo readout | 0.025 | 0.744 | 0.068 | 0.050 | — |
| Themes | 0.128 | 0.727 | 0.084 | 0.041 | −3° |
| Flight Log | 0.241 | 0.720 | 0.060 | 0.047 | −7° |
| Starmap Jump | 0.704 | 0.718 | 0.058 | 0.046 | +6° |
| Live sector | 0.785 | 0.738 | 0.078 | 0.039 | +4° |
| Bay Navigation | 0.894 | 0.750 | 0.076 | 0.050 | +4° |

These compact faces use content-only holograms instead of duplicating monitor frames. Keep label count and animation scale appropriate to these narrow in-world screens. The live preview uses the same live-sector bounds and tilt; its header/footer must remain small enough to leave a visible board area. When the bridge artwork changes, remeasure the actual glass inset at native resolution and update this table and `PANEL.original` together. Do not derive coordinates from a viewport screenshot until its aspect-fit offset and scale are accounted for.

- `assets/bridge-command-foreground-open-deck.png` (1672×941)
- `assets/bridge-command-foreground-open-deck-cargo-open.png` (1672×941)
- Console actions remain attached to the physical screen faces; cargo bay door interaction remains attached to the separate hatch below the left displays.


### New generated Picture Event vistas (2026-10-09)

Sixty generated still scenes are registered as Picture Event rewards and bridge-window vistas (`pictureEventUnlock: true`). They use the shared randomized bridge drift with `ambience: 'none'`; each scene gets its own seeded drift route. The images were optimized to 1536×864 JPEG, quality 90, so the set adds about 22.2 MB. Unlocking continues to happen only after clearing the level where the Picture Event was discovered.

- `silent-wreck` — The Silent Wreck: `assets/bridge-vistas/silent-wreck.jpg` (357,098 bytes)
- `far-lanterns` — The Far Lanterns: `assets/bridge-vistas/far-lanterns.jpg` (292,812 bytes)
- `glassstorm-expanse` — Glassstorm Expanse: `assets/bridge-vistas/glassstorm-expanse.jpg` (497,865 bytes)
- `sunwell-containment-array` — Sunwell Containment Array: `assets/bridge-vistas/sunwell-containment-array.jpg` (441,478 bytes)
- `wandering-ark` — Wandering Ark: `assets/bridge-vistas/wandering-ark.jpg` (350,842 bytes)
- `rift-tide-moon` — Rift-Tide Moon: `assets/bridge-vistas/rift-tide-moon.jpg` (451,920 bytes)
- `saffron-expanse` — Saffron Expanse: `assets/bridge-vistas/saffron-expanse.jpg` (331,574 bytes)
- `listening-array` — Listening Array: `assets/bridge-vistas/listening-array.jpg` (388,579 bytes)
- `blackglass-shore` — Blackglass Shore: `assets/bridge-vistas/blackglass-shore.jpg` (424,273 bytes)
- `archive-vault` — Archive Vault: `assets/bridge-vistas/archive-vault.jpg` (303,209 bytes)
- `lantern-migration` — Lantern Migration: `assets/bridge-vistas/lantern-migration.jpg` (361,712 bytes)
- `tidal-foundry` — Tidal Foundry: `assets/bridge-vistas/tidal-foundry.jpg` (378,308 bytes)
- `cobalt-thunderhead` — Cobalt Thunderhead: `assets/bridge-vistas/cobalt-thunderhead.jpg` (321,338 bytes)
- `quiet-crossing` — Quiet Crossing: `assets/bridge-vistas/quiet-crossing.jpg` (325,286 bytes)
- `iron-orchard` — Iron Orchard: `assets/bridge-vistas/iron-orchard.jpg` (386,817 bytes)
- `crown-of-embers` — Crown of Embers: `assets/bridge-vistas/crown-of-embers.jpg` (391,863 bytes)
- `deepwater-window` — Deepwater Window: `assets/bridge-vistas/deepwater-window.jpg` (385,761 bytes)
- `clockwork-eclipse` — Clockwork Eclipse: `assets/bridge-vistas/clockwork-eclipse.jpg` (281,634 bytes)
- `pale-signal` — Pale Signal: `assets/bridge-vistas/pale-signal.jpg` (306,030 bytes)
- `last-greenhouse` — Last Greenhouse: `assets/bridge-vistas/last-greenhouse.jpg` (375,247 bytes)
- `pulsar-lighthouse` — Pulsar Lighthouse: `assets/bridge-vistas/pulsar-lighthouse.jpg` (347,850 bytes)
- `ribbonworld-canyon` — Ribbonworld Canyon: `assets/bridge-vistas/ribbonworld-canyon.jpg` (454,666 bytes)
- `long-migration` — Long Migration: `assets/bridge-vistas/long-migration.jpg` (425,194 bytes)
- `tidebreak-moon` — Tidebreak Moon: `assets/bridge-vistas/tidebreak-moon.jpg` (404,719 bytes)
- `nightglass-metropolis` — Nightglass Metropolis: `assets/bridge-vistas/nightglass-metropolis.jpg` (442,075 bytes)
- `solar-sail-regatta` — Solar Sail Regatta: `assets/bridge-vistas/solar-sail-regatta.jpg` (371,215 bytes)
- `rings-at-the-edge` — Rings at the Edge: `assets/bridge-vistas/rings-at-the-edge.jpg` (238,829 bytes)
- `under-the-blue-giant` — Under the Blue Giant: `assets/bridge-vistas/under-the-blue-giant.jpg` (264,434 bytes)
- `ashfall-basin` — Ashfall Basin: `assets/bridge-vistas/ashfall-basin.jpg` (459,904 bytes)
- `sleeper-shipyard` — Sleeper Shipyard: `assets/bridge-vistas/sleeper-shipyard.jpg` (460,718 bytes)
- `satellite-crown` — Satellite Crown: `assets/bridge-vistas/satellite-crown.jpg` (301,573 bytes)
- `silver-mercury-sea` — Silver Mercury Sea: `assets/bridge-vistas/silver-mercury-sea.jpg` (353,767 bytes)
- `ion-veil` — Ion Veil: `assets/bridge-vistas/ion-veil.jpg` (389,841 bytes)
- `orchard-of-wrecks` — Orchard of Wrecks: `assets/bridge-vistas/orchard-of-wrecks.jpg` (346,817 bytes)
- `glassback-range` — Glassback Range: `assets/bridge-vistas/glassback-range.jpg` (446,160 bytes)
- `red-silence` — Red Silence: `assets/bridge-vistas/red-silence.jpg` (332,502 bytes)
- `duskline-causeway` — Duskline Causeway: `assets/bridge-vistas/duskline-causeway.jpg` (305,752 bytes)
- `black-current` — Black Current: `assets/bridge-vistas/black-current.jpg` (416,927 bytes)
- `burnished-exosphere` — Burnished Exosphere: `assets/bridge-vistas/burnished-exosphere.jpg` (309,169 bytes)
- `dust-choir` — Dust Choir: `assets/bridge-vistas/dust-choir.jpg` (541,566 bytes)
- `long-shadow-convoy` — Long Shadow Convoy: `assets/bridge-vistas/long-shadow-convoy.jpg` (287,363 bytes)
- `vitrified-forest` — Vitrified Forest: `assets/bridge-vistas/vitrified-forest.jpg` (548,501 bytes)
- `magnetar-veil` — Magnetar Veil: `assets/bridge-vistas/magnetar-veil.jpg` (359,828 bytes)
- `first-light-at-varda` — First Light at Varda: `assets/bridge-vistas/first-light-at-varda.jpg` (422,522 bytes)
- `hollow-comet` — Hollow Comet: `assets/bridge-vistas/hollow-comet.jpg` (337,065 bytes)
- `resonance-spires` — Resonance Spires: `assets/bridge-vistas/resonance-spires.jpg` (382,426 bytes)
- `flooded-crater` — Flooded Crater: `assets/bridge-vistas/flooded-crater.jpg` (384,085 bytes)
- `salt-of-the-void` — Salt of the Void: `assets/bridge-vistas/salt-of-the-void.jpg` (384,661 bytes)
- `violet-rain` — Violet Rain: `assets/bridge-vistas/violet-rain.jpg` (356,497 bytes)
- `cloud-harbor` — Cloud Harbor: `assets/bridge-vistas/cloud-harbor.jpg` (370,445 bytes)
- `unmoored-moon` — Unmoored Moon: `assets/bridge-vistas/unmoored-moon.jpg` (231,119 bytes)
- `choir-of-antennas` — Choir of Antennas: `assets/bridge-vistas/choir-of-antennas.jpg` (365,324 bytes)
- `glass-rain-night-world` — Glass Rain on a Night World: `assets/bridge-vistas/glass-rain-night-world.jpg` (370,260 bytes)
- `magnetotail-comet` — Magnetotail Comet: `assets/bridge-vistas/magnetotail-comet.jpg` (368,053 bytes)
- `hollow-sea` — The Hollow Sea: `assets/bridge-vistas/hollow-sea.jpg` (461,022 bytes)
- `half-lit-ring-habitat` — Half-lit Ring Habitat: `assets/bridge-vistas/half-lit-ring-habitat.jpg` (329,052 bytes)
- `gravitational-lens` — Gravitational Lens: `assets/bridge-vistas/gravitational-lens.jpg` (344,394 bytes)
- `eclipsed-pulsar` — Eclipsed Pulsar: `assets/bridge-vistas/eclipsed-pulsar.jpg` (257,284 bytes)
- `seed-vault-convoy` — Seed Vault Convoy: `assets/bridge-vistas/seed-vault-convoy.jpg` (318,774 bytes)
- `terminal-ocean` — The Terminal Ocean: `assets/bridge-vistas/terminal-ocean.jpg` (397,988 bytes)

### Rebalanced bridge console integration (2026-10-10)

The initial panoramic console add-on proved too deep: it covered the old bridge foreground and reduced floor area reserved for crew movement and ambient activity. The active implementation now uses the earlier bridge's open-deck composition and side-console geometry, with live graphics fitted to the four built-in angled displays. This keeps the center walkway and foredeck visible while preserving the fixed main window and vista system.

- Active bridge art: `assets/bridge-command-foreground-open-deck.png` (closed cargo hatch) and `assets/bridge-command-foreground-open-deck-cargo-open.png` (lit cargo room exposed). Both retain the 1672×941 bridge composition, original alpha cutout for the window, and central floor.
- Six physical monitors now host the cargo capacity/item preview, Themes, Flight Records/Scores, Starmap Jump, live/saved sector preview, and Bay Navigation. Ship Systems remains a fascia action connected to Developer access.
- The lower corner seat-like obstructions are removed; the side displays are exposed and the open central deck remains available for crew movement. The cargo hatch opens first, waits 1.5 seconds, then opens the translucent cargo inventory UI. Leaving the hold animates the hatch closed.
- `BridgeInteriorAmbience.tsx` defines normalized, per-variant display, action, cargo hitbox, and readout bounds. Recalibrate live visuals and hit targets together if the artwork changes.
- Preserve the open central deck for crew and ambient movement. Do not place the deep panoramic console rework over it. Keep the main window aperture unobstructed and the navigation panel below its sill.

### Foundry fascia integration (2026-10-11)

- The monitor-only pass and raised fascia machine both blocked the user's requested placement. Current artwork lowers the installation into a recessed floor well below the window sill, with an amber crucible, mineral conveyor, material racks, output tray, exhaust, and a tactile control plate with a physical `SMELT` button. The machine leaves the central route visible and does not intrude into window glass.
- Active transparent 1672×941 foreground layers: `assets/bridge-command-foreground-foundry.png` (1,672,692 bytes), cargo-open state `assets/bridge-command-foreground-foundry-cargo-open.png` (1,664,586 bytes), and alternate cathedral layout `assets/bridge-command-cathedral-foundry.png` (1,491,359 bytes). The cargo-open layer preserves the illuminated cargo room. Cathedral's foundry is lowered below its raised window sill into the rear deck.
- `BridgeFoundryStation.tsx` has a transparent machine hit target, a separate clickable hitbox on the painted `SMELT` control, a small rising idle ember, the active resource's colored shape in the fire, and a matching moving piece on the feed conveyor. The large Foundry panel reports the full material name, source, timer, and progress. Its cargo selector stores a selected material; the bridge button queues one manual unit only when that item is available above its protected reserve and Manual mode is active. No overlay draws housing, screen glass, labels, or panel backgrounds over the bridge art.
- Original bounds in `BridgeFoundryStation.tsx`: machine `{ x: 0.286, y: 0.596, w: 0.43, h: 0.21 }`; fire `{ x: 0.469, y: 0.676, w: 0.062, h: 0.085 }`; feed `{ x: 0.345, y: 0.696, w: 0.09, h: 0.03 }`; physical button `{ x: 0.575, y: 0.744, w: 0.056, h: 0.048 }`. Keep all live pixels and hit targets aligned to the new sunken installation. Preserve the window, side stations, cargo doors, central crew route, and floor.

### Bridge fascia and foundry feed/output refit (2026-10-11)

- Active original-bridge art is now `assets/bridge-command-foreground-foundry-smelt-refit.png` and `assets/bridge-command-foreground-foundry-smelt-refit-cargo-open.png`. Both are 1672×941 RGBA PNGs; the panorama aperture has alpha 0 and the ship foreground remains opaque. The open version preserves the lit cargo compartment. `App.tsx` selects these matched states.
- The physical display mapping is Credits (far-left), Themes (left-center), Flight Log (inner-left), Jump/Route Atlas mode switch (wide starboard screen), and live stage preview (far-starboard). Measured content bounds live in `PANEL.original` in `BridgeInteriorAmbience.tsx`; the display pixels and hit zones rotate with the angled glass. Keep content inside the artwork's bezel, without drawing replacement screen cards.
- The foundry artwork restores ruby-red and cobalt-blue feed crystals on the left conveyor and a lower-right empty SMELT output bin with a separate red-lit front button. `BridgeFoundryStation.tsx` draws actual pending credit output only inside the bin, removes the idle OUTPUT caption/outline, and maps the collection hitbox to the bin and the manual queue hitbox to the red button.
- Current original-bridge foundry bounds in `BridgeFoundryStation.tsx`: SMELT button `{ x: 0.613, y: 0.779, w: 0.03, h: 0.022 }`; output bin `{ x: 0.566, y: 0.738, w: 0.066, h: 0.036 }`. The machine/status/fire/feed/rack retain their existing bounds. The lower hardware-button rows now animate only their colored indicator lights over the artwork's built-in buttons.

### Bridge interior HD asset pass (2026-10-12)

- Active bridge art uses detail-enhanced native-canvas assets: `assets/bridge-command-foreground-foundry-smelt-refit-gold-detail.png`, `assets/bridge-command-foreground-foundry-smelt-refit-gold-cargo-open-detail.png`, and `assets/bridge-command-cathedral-foundry-live-detail.png`.
- The active images are 1672×941 and preserve the app's native art coordinate system. `BridgeInterior` crossfades closed/open foregrounds together, so keep these active images at native resolution to limit decoded image memory. Do not alter normalized panel or hitbox bounds during this asset-only pass.
- The window aperture remains transparent. Existing blank display glass, foundry, shelves, cargo doorway, and floor remain part of the foreground. The cargo-open variant preserves the illuminated hold state.
- Revisit the displayed app at regular size after the art swap to confirm monitor overlays remain centered within the physical glass on both bridge layouts and the open hold remains visibly open.
