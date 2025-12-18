# Release Instructions

This document provides step-by-step instructions for releasing new versions of Tabby.

## Branch Strategy

- **`main`**: The current stable release
- **`next`**: The next feature release in development
- **`hotfix`**: Hotfix branches for patch releases

## Feature Release (Minor/Major)

Feature releases are developed on the `next` branch and may span multiple commits over weeks or months.

### 1. Start Development

```bash
git checkout next
git pull origin next
pnpm prep minor          # or: pnpm prep major, pnpm prep 2.0.0
git add .
git commit -m "Bump version to vVERSION" # mention the new version number
git push origin next
```

This creates `package.json` with the new version and a release notes template in `product/releases/vVERSION-new-release.md`.

**Important**: Bump the version immediately when starting work on `next`. This ensures everyone (human and AI) knows which release notes file to update for any changes.

### 2. Develop Features

- Develop features on the `next` branch via feature branches and PRs
- For each user-facing change or bug fix for a previously released feature, update the release notes in `product/releases/vVERSION-new-release.md`
- Only document bug fixes that existed in previous releases, not issues introduced and resolved during current development
- The release notes will accumulate changes over time and may become messy - this is expected

### 3. Finalize Release Notes

Before releasing, review and consolidate the release notes:

- **Rename the file**: Choose a descriptive slug based on the full set of changes (e.g., rename `v1.2.0-new-release.md` to `v1.2.0-tab-manager-settings.md`)
- **Set the title**: Update the `# Release` heading to reflect the key theme (e.g., `# Tab Manager Settings & Compact View ⚙️`)
- **Present user-facing features clearly**: Reorganize the notes to be easily digestible for end users
- **Remove internal fixes**: Avoid mentioning fixes or changes to things that were fixed or changed internally during development but didn't exist in previous released versions
- **Update submission date**: Change "Release Date: TBD" to the date you're submitting to the Chrome Web Store (format: `January 15, 2025`)
  - Note: This is the "submission date" rather than the official Chrome Web Store release date, which may be several days later after approval

### 4. Build and Test

```bash
pnpm lint:fix
pnpm format
pnpm test
```

If all goes well, then

```bash
pnpm zip
```

This will create a new clean build in `dist/` and zip the release into `dist-zip/`.
Load the extension from `dist/` (or reload it) to verify the new build before submitting the zip to the chrome web store.

### 5. Merge to Main and Tag

```bash
git checkout main
git pull origin main
git merge next
git push origin main
git tag vVERSION
git push origin vVERSION
```

### 6. Upload to Chrome Web Store

1. Navigate to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Upload the zip file from `dist-zip/tabby-VERSION.zip`
3. Submit for review
4. Wait for approval (typically 1-7 days)

### 7. Start the Next Release

Once the release is submitted to the Chrome Web Store:

```bash
git checkout next
git pull origin next
git merge origin/main
git push origin next
```

## Patch Release (Hotfix)

Patch releases fix critical bugs in the current release without adding new features.

### 1. Create Patch Branch

```bash
git checkout main
git pull origin main
git checkout -b hotfix
```

### 2. Bump Version

```bash
pnpm prep patch          # or: pnpm prep 1.0.1
git add .
git commit -m "Bump version to vVERSION"
```

This creates `package.json` with the new version and a release notes template in `product/releases/vVERSION-patch-release.md`.

### 3. Fix the Bug

- Implement and test the fix
- Update the release notes with the fix details
- Commit your changes

### 4. Build and Test

```bash
pnpm lint:fix
pnpm format
pnpm test
```

If all goes well, then

```bash
pnpm zip
```

This will create a new clean build in `dist/` and zip the release into `dist-zip/`.
Load the extension from `dist/` (or reload it) to verify the new build before submitting the zip to the chrome web store.

### 5. Merge to Main and Tag

```bash
git checkout main
git pull origin main
git merge hotfix
git push origin main
git tag vVERSION
git push origin vVERSION
```

### 6. Upload to Chrome Web Store

1. Navigate to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Upload the zip file from `dist-zip/tabby-VERSION.zip`
3. Submit for review
4. Wait for approval (typically 1-7 days)

### 7. Merge into Next

```bash
git checkout next
git pull origin next
git merge origin/main
git push origin next
```

This ensures the patch is included in the next feature release.

## Version Numbering

- **Major** (e.g., 1.0.0 → 2.0.0): Major marketing updates that may appear to be a wholly new extension (rare)
- **Minor** (e.g., 1.0.0 → 1.1.0): New features, improvements, changes, rewrites, refactors, redesigns (common, must be backward compatible)
- **Patch** (e.g., 1.0.0 → 1.0.1): Bug fixes only, no new features (as needed, for quick release)

## Release Notes

- **File naming**: `product/releases/v<version>-<slug>.md` (e.g., `v1.2.0-tab-manager-settings.md`)
  - During development: Use the generic slug created by `pnpm prep` (e.g., `v1.2.0-new-release.md`)
  - During release: Rename with a descriptive slug that captures the release theme
- **One file per version**: Append to the existing file for the current version
- **Release Date**: Set to the submission date when finalizing the release
- **Organization**:
  - For feature releases: Organize by user-facing value, not chronological order of development
  - For patch releases: List only the bugs that existed in previous releases

### Writing Release Notes (Product Owner Perspective)

When writing or editing release notes, adopt a **product owner mindset** focused on customer value:

- **Audience**: End users, not developers. Avoid technical jargon and implementation details.
- **Focus on Benefits**: Explain what users can do now that they couldn't before, or what problems are solved.
- **User Problems First**: Frame features around the user need they address, not the technical solution.
- **Avoid Tedious Details**:
  - ✅ "Choose from over 15 color options"
  - ❌ "Choose from Blue, Violet, Purple, Pink, Red, Orange, Amber, Yellow, Lime, Green, Emerald, Teal, Cyan, Sky, Indigo, Fuchsia, or Rose"
- **Skip Technical Implementation**:
  - ✅ "Themes adapt automatically to your system's light or dark mode"
  - ❌ "Separate palette storage for light and dark mode themes"
- **Be Concise**: Every sentence should deliver value. Remove filler and redundancy.
- **Highlight Impact**: Lead with what's most impactful to users, not what was built first.
- **Use Plain Language**: Write like you're explaining to a friend, not documenting an API.

## Tips

- Always pull before merging to avoid conflicts
- Tag releases after pushing to `main` to ensure the tag points to the correct commit
- Keep `next` up to date with `main` after each release
- The Chrome Web Store approval process can take several days, so plan accordingly
