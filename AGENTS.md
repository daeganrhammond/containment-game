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
- When publishing, inspect the intended release files before staging. Stage the source, assets, docs, and generated archives deliberately; do not include stale build archives or unrelated artifacts by default. Verify the pushed commit and tag, then check the GitHub Pages workflow run before telling the user the live site is updated.

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
