# Release hook

Enable the local completeness check once per checkout:

```sh
git config core.hooksPath .githooks
```

After enabling, every normal `git push` is blocked if the worktree is dirty, an asset is untracked, or a tracked asset is missing. GitHub Actions runs the committed-source/assets guard before uploading the Pages artifact. Do not bypass the hook for a game release.
