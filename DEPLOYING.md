# Sharing Containment

Containment is currently a desktop-first web game. The production export is a static website, so players can use it in a browser without installing the development tools.

## Build a release

From this folder, run:

```sh
npm ci
npm run export:web
```

The ready-to-host website is written to `dist/`. Upload the **contents** of that folder to any static website host. To check a release locally, serve `dist/` over HTTP; opening `index.html` directly as a `file://` URL will not load its bundled resources correctly.

## Automatic updates with GitHub Pages

The included `.github/workflows/deploy-pages.yml` builds and republishes the game whenever changes are pushed to `main`. It handles the repository subpath used by project Pages sites as well as a `username.github.io` site.

To turn it on, create or connect a GitHub repository for this project, push the project files to its `main` branch, then select **Settings → Pages → Source → GitHub Actions**. GitHub will show the public game URL in the Pages settings and in the workflow run. Future patches published to `main` update that URL automatically.

The source repository and the hosted game have separate visibility settings. Choose the repository visibility deliberately; the built game can be public while the source stays private when the GitHub plan allows Pages for private repositories.

