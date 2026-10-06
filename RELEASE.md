# Release Process

## Branches

- **`main`** is the integration branch for the latest accepted code, including work not yet published. Pull requests target `main`. Require both CI workflow checks before merging and keep the branch buildable.
- **Issue branches** are short-lived and start from the branch they target. Feature pull requests target `main`.
- **Patch branches** are short-lived and version-specific, such as `hotfix/v1.2.1`. Create one from the latest published tag (`v1.2.0` in this example), and target patch-fix pull requests to it. Tag the finished patch commit as `v1.2.1`, then forward-port the fixes to `main` in separate pull requests. Do not bring the patch version bump or patch notes into `main`.

A tag labels a finished commit; pull requests merge into branches. For a patch release, merge fixes into its version-specific branch, tag that commit, then forward-port the fixes to `main`.

## Versioning and Release Notes

The version in the root `package.json` is the source for the Chrome extension manifest. Other packages remain private and use `0.0.0`.

Start a feature-release cycle on `main` by preparing its version and notes file:

```bash
pnpm prep minor        # or: pnpm prep major, pnpm prep 2.0.0
```

Commit this preparation through a pull request to `main`. The command updates `package.json` and creates a versioned file such as `product/releases/v1.4.0-new-release.md`. Each user-facing feature pull request adds its line directly to that active file under the appropriate heading. Keep changes concise and user-focused. For internal work, state in the pull request that no release note is needed.

Use one versioned release-notes file for each planned release. If parallel pull requests touch nearby lines, resolve conflicts by retaining each distinct line once. Do not use per-pull-request note fragments.

For a patch release, create a version-specific branch from the latest published tag, then prepare its patch version there. For example:

```bash
git switch -c hotfix/v1.2.1 v1.2.0
pnpm prep patch
```

Replace the example versions with the latest published tag and the next patch version. Each patch-fix pull request adds a line to that patch version's file, such as `product/releases/v1.2.1-patch-release.md`. Keep the note on the patch release, not in the active minor-release notes. When forwarding the fix to `main`, preserve `main`'s in-progress version and do not duplicate the line in its release-notes file.

## Feature Work and CI

1. Start from an issue with a clear outcome and acceptance criteria. Use a short-lived issue branch and open a pull request to `main`.
2. Include the code, relevant tests, and direct update to the active versioned release-notes file. Update documentation, Storybook examples, and marketing-site content when the change affects them.
3. CI runs lint, formatting checks, type checking, unit tests, and a production build on pull requests. The E2E workflow runs Chrome-extension E2E tests on pull requests. Both workflow checks must pass before merging. The build is a check only: CI does not upload an artifact. Commits do not run lint or formatting hooks.
4. A separate agent reviews the issue criteria and diff with fresh context. The implementation agent fixes blocking findings; a new reviewer rechecks the changes. Merge when both workflow checks pass and no blocking findings remain.
5. Use `Closes #N` in the pull request description to close the issue when the pull request is merged to `main`.

## Cut a Minor or Major Release

Run these steps when the user asks to cut a release:

1. Confirm the intended release version and that the active release-notes file describes the changes accurately. Finalize its title, filename, and submission date.
2. Ensure the release commit is on `main`, CI passes, and no blocking review feedback remains.
3. Build and smoke-test the packaged extension in Chrome:

   ```bash
   pnpm zip
   ```

   This creates the production build in `dist/` and the ZIP in `dist-zip/`. Load the built extension in Chrome and exercise the changed flows.

4. Create and push the version tag on the exact release commit:

   ```bash
   git tag vVERSION
   git push origin vVERSION
   ```

5. Create a GitHub release for that tag and attach the ZIP and finalized notes.
6. Submit the package to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) only when the user asks. Upload the ZIP to the existing listing, check any applicable listing and privacy declarations, then submit it for review. The Chrome Web Store API v2 may also be used when credentials are configured; neither path is triggered automatically by CI, a merge, or a tag.
7. If the user asks to publish once accepted, monitor the review status and publish after the Chrome Web Store accepts the submission. If the submission is rejected, report the reason and wait for a fix and new review. Record the submission date in the release notes.
8. Verify the published version and smoke-test the installed Chrome Web Store update.

The Chrome Web Store requires each uploaded version to be higher than the previously published version. Keep the release tag, manifest version, ZIP, and GitHub release notes aligned. See [version requirements](https://developer.chrome.com/docs/webstore/prepare) and the [Chrome Web Store API v2 guide](https://developer.chrome.com/docs/webstore/using-api) for the current upload and submission options.

## Cut a Patch Release

Patch releases contain fixes for the latest published version and may include more than one fix.

1. Create a branch named for the next patch version from the latest published tag. For example, if the latest tag is `v1.2.0`, create `hotfix/v1.2.1` from `v1.2.0`. Run `pnpm prep patch` on the new branch.
2. For each fix, create an issue branch from `hotfix/vX.Y.Z` and open a pull request back to that branch. Apply the same CI and independent review process as a feature pull request. Add the fix to the patch notes file.
3. When the patch is ready, finalize its notes, run the release checks, build and smoke-test the ZIP, then tag the reviewed patch commit as `vX.Y.Z` and create its GitHub release.
4. Forward-port each fix to `main` in a separate issue branch and reviewed pull request. Keep `main`'s active version and notes file; do not add the patch note to the upcoming minor notes. Use `Closes #N` on the forward-port pull request so the issue closes after the fix is retained on `main`.
5. Submit and publish through the Chrome Web Store only when the user asks. After the patch is published, retire `hotfix/vX.Y.Z`. A later patch gets its own branch from the new latest published tag.

## Writing Release Notes

- Write for extension users. Describe the benefit or problem solved, not implementation details.
- Put a feature under **Highlights** or **Improvements** and a released-code bug fix under **Fixes**.
- Do not report problems that were introduced and fixed before users received the release.
- Keep patch notes limited to fixes for the released version being patched.
- Use the submission date, not the date Chrome finishes its review.

## Future Marketing Site

When the marketing site exists, use pull-request previews for review. Deploy production as an explicit release action after the extension is published, so the site does not announce features that are not yet available in the store.
