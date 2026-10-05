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
