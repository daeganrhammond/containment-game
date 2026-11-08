This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Efficient iteration

- `App.tsx` is a very large screen module. Find the relevant component or handler with `rg` first, then inspect only a bounded section around it; avoid dumping the full file.
- Prefer small, symbol-scoped edits over broad text replacement, especially in long JSX. Re-read the edited section immediately after patching to catch malformed markup before running checks.
- Keep gameplay changes localized. Extract a helper or component when it makes the requested change safer or easier to maintain; avoid unrelated refactors during feature work.
- Once an integration is stable, run `npx expo lint` and `npx tsc --noEmit` concurrently. Run them again only after a code change that could affect their results.

## Browser and phone-sized verification

- Playwright is configured in `playwright.config.ts`; `npm run test:e2e` checks the bridge vista in desktop Chromium and a phone-sized Chromium viewport. Install its browser once with `npx playwright install chromium`.
- For vista motion, compare the computed transform on the animated image wrapper and its ancestors. React Native Web applies `Animated.Image` transforms to a wrapper element, so inspecting only the `<img>` can falsely report that drift is static.
- A phone-sized Chromium project verifies responsive web behavior only. Do not describe it as a native Android/iOS runtime test; use a device or emulator for that.
- Keep screenshots, traces, and Playwright output in ignored output directories. Don't commit generated browser binaries or test artifacts.

## Bridge vista and ambience workflow

Use this short path for new exterior scenes and ambient motion; the existing scene pipeline is the source of truth:

1. Check `ART_ASSET_HANDOFF.md`, `bridgeVistaCatalog.ts`, and `BridgeVistaRenderer.tsx` first. Do not re-open the full `App.tsx`; use `rg` to locate only the scene-selection and renderer call sites if the task requires them.
2. Keep a vista as a clean, continuous panorama with no ship interior, window frames, UI, or baked gameplay board. Prefer 16:9 at 1536×864 for built-in plates. Save optimized JPEG/WebP plates under `assets/bridge-vistas/`; use transparent PNG for independent moving craft or effects.
3. Add built-in scenery by adding one typed catalog entry with a stable id, display name, source, and optional reusable ambience profile. Uploaded/pinned scenes are already handled by the user library; do not duplicate them as built-ins or edit storage/import logic for routine scene additions.
4. Keep scene rendering and passive animation in `BridgeVistaRenderer.tsx`. Add a reusable ambience profile/effect there instead of creating one-off animation code per image. Keep panorama drift continuous (long, eased sweeps with no long stationary pauses), and schedule decorative craft independently with a hard cap of four simultaneous passes. A ship should remain visible until its entire sprite clears the panorama bounds. Prefer compositing code-driven motion (vista drift, star twinkle, routed craft with light/glow layers) over generating a new video for every scene. Keep motion lightweight and decorative; it must not affect gameplay physics or inputs. Reserve generated clips for distinctive one-off events that need complex organic motion.
5. The vista layer must use the same aspect-fitted design-art bounds as `BridgeInterior` (including its centered left/top offset), not the raw screen bounds. Clip the panorama and all of its motion to those bounds; use `cover` inside them. Pass the measured bounds from the owning layout into the renderer. Do not independently measure, aspect-fit, or center a nested vista image: that produced partial-window alignment failures and revealed scenery outside the glass on shorter screens. Do not change window coordinates or interior artwork just to fit a new photo.
6. For integration, make only the asset/catalog/renderer edits needed. Inspect the edited blocks and `git diff --stat`, then open the running web preview once and capture a screenshot to confirm the image fills the center and both side windows behind the interior. If the preview is already running, reuse it instead of starting another server. Check one phone-sized layout when the change affects responsive sizing; do not repeat browser tours for unchanged code.
7. Record the new asset dimensions, file path, scene id, and any ambience profile in `ART_ASSET_HANDOFF.md`. Keep `PROJECT_BRIEF.md` and `SESSION_LOG.md` concise: update only when the project-level direction or a meaningful milestone changes.

## Patch and release workflow

- For behavior changes, gather unresolved behavior choices into one concise, numbered clarification before implementation. Include a recommended default for each material choice; do not ask again about decisions already answered in the conversation.
- Start with `git status --short`, branch, and latest release tag. Keep the patch scoped to the requested feature; don't mix release/version changes into ordinary development work unless publishing is requested.
- For large source files, search once with `rg`, read only the bounded relevant region, make the edit, then inspect that region and `git diff --stat` before checks. Prefer one targeted implementation pass over repeatedly dumping or re-reading entire files.
- Preserve each edited file's existing line endings. Check with `git ls-files --eol <paths>` before scripted edits; use `git diff --ignore-space-at-eol` to distinguish meaningful edits from line-ending churn. Never normalize a whole file as part of a feature patch.
- Run lint and typecheck together once after code edits settle. Run a web export only for web-facing changes or a release. Don't repeat successful checks unless code changes afterward.
- When publishing, inspect the intended release files before staging. Stage the source, assets, and docs deliberately; do not include stale build archives or unrelated artifacts by default. Verify the pushed commit and tag, then wait for the GitHub Pages workflow to succeed for that exact commit. Confirm the deployed URL from the Pages deployment/environment or Pages settings and verify it returns the app before saying it is live. Always include the direct live link in the final response after a successful deployment; if deployment is still running or failed, report that without implying the site updated.

### Computer build is the sole release source — required for every game update

- Treat the current game version on the user's computer as the only source of truth. Never substitute a stale branch, another worktree, an old `dist/`, a remote checkout, or an assumed default screen for it. Locate and record the exact project path, running local URL/build, branch, commit, and dirty files before touching anything.
- The user's visible current build includes its source, configuration, and required assets. Before publishing, compare the complete required-file manifest against Git. Required untracked or newly created artwork is part of the release; never publish a partial code-only commit. Do not sweep unrelated previews, logs, or generated test output into the game.
- Build the web release from that same exact local project state. Record the source revision and a manifest/hash of the exported files. Publish that artifact only; do not independently rebuild from a different checkout or claim equivalence based only on matching commit names.
- Before deployment, capture the local version at the target browser size and state. After deployment, capture the live URL at the same size and state and visually compare them. Check every requested physical bridge screen (score, jump/map, foundry, cargo bay) for presence, alignment, correct art, and readable interaction. A passing typecheck or interaction test is not visual-parity evidence.
- Test real user actions in the exported build and again at the live URL: click the cargo hold and observe the physical doors open before inventory; operate the hold-open switch; open the score screen and jump/map preview; operate the foundry and inspect its actual selected art. Assert visible outcomes, expected control bounds, asset responses, and no browser runtime errors. Save screenshots/traces on failure.
- Do not add or change web-only stacking, geometry, art, or navigation to fix a test without comparing the resulting browser screenshot against the local reference. A screen-reader label, DOM marker, asset URL change, or state transition alone does not prove that the game looks or behaves correctly.
- The release workflow must build from the exact approved revision, run lint/typecheck and the full browser suite before upload, then verify the deployed Pages URL and exact artifact contents after deployment. Wait for that run to finish. If any check or visual comparison fails, stop the release and report the exact failing layer; never call it complete or hand out the link as current.
- Before reporting success, state the local reference, source revision, exported-artifact result, deployment run/result, and live-browser comparison separately. Do not say “matches” unless the same screens and actions were observed in both builds.
- Respect the user's approval boundary. When game-edit permissions are revoked, do not edit game code/assets or publish. Do agent/process work only when explicitly requested.
- Timebox work to ten minutes maximum without the user's approval. At eight minutes, report concise progress and the next concrete step; stop at ten minutes unless approval is given. Do not hide tool waits, repeat successful checks, or expand scope.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Persistent progression and save verification

- Whenever adding a resource or pickup that can be stored, add its typed cargo ID, built-in default footprint, stack/refinery rules, and visual representation to the cargo catalog. The Developer → Cargo Shapes editor enumerates catalog IDs automatically; verify the new item appears there and that custom footprints drive packing and capacity checks.
- Treat `Run.ended` as optional in legacy active saves; if absent, the saved run is still active. Normalize it without discarding balances, route, or upgrades.
- Route active-run, profile, score, and Captain's Log archive writes through `progressionStorage.ts`. Keep closeout recoverable: persist the ended run first, commit the archive once, and remove the recovery save only after the archive commit succeeds.
- When adding saved fields, supply explicit legacy defaults and cover old-save migration, corrupt/future-version preservation, interrupted writes, replay idempotence, and new-run reset boundaries with focused `node --test tests/progression.test.cjs` cases.
- Verify startup against an existing active save and inspect Flight Records/archive after reload. Do not press New Run or otherwise replace a player's active save merely to verify reset behavior; use the isolated storage tests or a disposable test profile.
- Keep progression readiness independent from optional cosmetics/settings loads. A bad optional preference should produce a useful notice without disabling an otherwise initialized save archive.
- Before reporting localhost as playable, confirm the Expo server is alive and the page responds. If browser automation is unavailable because its browser binary is missing, report that limitation; don't treat a successful typecheck as browser verification.

## Bridge visual integration

- Use built-in image-generation tools or local image-processing workflows for project artwork. Do not use Krea or its MCP tools unless the user explicitly asks for Krea.
- For bridge feature work, redesign or replace the non-window ship interior as needed to make features feel native. The user explicitly encourages changing bridge geometry, consoles, and furniture; do not preserve old console placement when a requested rehaul calls for a new layout.
- The main window's size, shape, position, frame, and exterior function are fixed. Never cover or alter the window. Keep generated console and cargo artwork below/outside its aperture and verify that boundary after compositing.
- Build controls and animations into dedicated physical console faces, hatches, readers, or fascia controls. Keep the underlying feature behavior reachable, and make opened inventory/navigation UI translucent and anchored to the relevant ship area rather than floating over the vista. Preserve open central deck/floor space for crew movement and ambient activity.
- For bridge art changes, compare the full composition at the running app's viewport, verify screen interaction alignment and cargo open/close states, and confirm the window remains unobstructed before considering the edit complete.
- A ship feature is not physically integrated if its housing, bezel, hatch, machinery, or panel is drawn only by an absolutely positioned React view over the bridge picture. Put that physical geometry in the bridge artwork/model first; let code draw only live pixels and a hit target inside the matching real screen or opening. If the bridge has no suitable aperture, redesign the non-window ship geometry. Never use a floating card as the first integration pass.
- Before calling a ship integration done, inspect the composite at normal app size and verify the physical housing belongs to the fascia, the live readout stays within its glass, the window remains untouched, and the crew floor remains open. When there are alternate bridge and door-open art states, update and inspect each state too.

### Efficient physical-console refits

- Start every ship integration by inspecting the actual bridge artwork and identifying the physical space the feature needs. The user has explicitly authorized changing the non-window ship image, geometry, consoles, and furniture. Treat that as a real design option from the beginning, not a last resort after repeated overlay adjustments.
- If a screen, control, or feature looks pasted on, floats, misses its glass, or fights the ship perspective, stop adjusting guessed coordinates. Fix the physical artwork/geometry or the display plane first; then fit live pixels and hit targets to the redesigned surface. A flat rotated rectangle does not match a perspective trapezoid. Use a matching clipped/perspective shape or redesign the panel to provide a front-facing inset that code can fill cleanly.
- Before implementation, inspect the exact bridge PNG at native resolution and the live app at the user's current viewport. Map the actual visible glass/pad corners on the source canvas, including tilt and perspective, and account for the fitted art's rendered offset and scale. Store measured per-variant geometry next to the component that uses it; keep visual pixels and hit targets on the same measured plane.
- The original/open-deck bridge art uses a 1672×941 canvas. Its controls are laid out in that design-art coordinate space and scaled with the fitted art bounds. Do not treat approximate normalized percentages or a screenshot-only estimate as final alignment.
- Keep tiny in-world screens legible at their actual rendered size. Fit content to the glass inset: prefer a short heading, one live value/state, and a restrained animation. Avoid cards, thick borders, long captions, or multi-row chrome that exceeds the physical display. If the art screen is trapezoidal, keep content inset within the safe rectangle or use a matching clipped shape; match its tilt without letting rotated corners spill over the bezel.
- For a pure refit, leave the vista/window layer, game state, and unrelated mechanics alone. If a screen cannot be fit cleanly, it is acceptable to change the non-window console geometry or redraw/refit the screen artwork; do not sacrifice the fixed window aperture or central crew floor to preserve old furniture.
- Ask the user when a visual decision has more than one materially different reasonable interpretation, or when any requested behavior/layout remains unclear. The user has explicitly said they do not currently trust agent judgment on ship integration; do not conceal assumptions or claim confidence in a speculative fit. Explain the options with a concrete preview or marked-up plan when useful.
- Ship-integration workflow is plan first, then edit: before changing ship artwork, geometry, console placement, or ship-integrated UI, present the user a concrete plan of the affected physical areas, what will change in the artwork versus live UI, how perspective/alignment will be handled, and what will be visually verified. Wait for the user's approval before making those integration edits. Existing permission to change the ship removes the need to ask permission for scope, but does not bypass this requested plan approval step.
- Inspect close crops of every affected physical screen and pad at normal app size, as well as the full bridge composition. Confirm pixels stay within the real glass/pad, text is legible, lights sit inside the physical controls, and the hit target matches the displayed plane. A full-screen screenshot alone is not enough to approve alignment.
- Iterate from visual evidence: capture the current preview, map the relevant physical surfaces, make a coordinated artwork/geometry and UI adjustment, then capture and inspect the post-change result. Check every affected screen, keep actions accessible, and confirm the cargo doors/panel still behave. Do not declare integration complete while any part still reads as a floating overlay or misaligned rectangle.
- Reuse the already-running local preview rather than starting a second server. Lint and typecheck once after the visual/code edit settles. Do not create new test suites or run the existing gameplay/e2e suites unless the user asks; the visual task should be verified in the live preview.

### Crew and pet content scope

- Crew/pet infrastructure and character content are separate approvals. Until the user asks to design a specific crew member or pet, implement only generic roster/data contracts, recruitment, duties, behavior/pathing hooks, and neutral abstract proxies where needed to exercise those systems. Do not invent names, species, portraits, models, personalities, traits, dialogue, or individual bonuses. Define each character or pet one at a time in a separate, user-reviewed content step.

## Canonical bridge interior

- The only playable interior is the integrated original bridge. Do not add alternate layouts, layout selectors, saved layout preferences, or alternate bridge foreground assets.
- The sole active art pair is the closed and cargo-open `*-gold-detail.png` foreground pair documented in `ART_ASSET_HANDOFF.md`. Keep runtime visuals and hit targets on its measured screen insets; never substitute duplicate HD2x/WebP or historical art files.
- Before publishing bridge changes, inspect the actual localhost render and verify the individual console placements and cargo door state, then inspect the exact published build. A matching commit or loaded image is not visual proof.
