# Chrome Web Store listing — Tabby

Last updated: 2026-10-25

Publishing reference for Tabby's store listing, images, permissions explanations, privacy disclosures, and submission records. Detailed release notes are linked from the version history.

## Store listing

**Listing:** [Tabby](https://chromewebstore.google.com/detail/tabby/jjkakicjobpalhifpeaggabpgdllmmob)

**Extension name:** Tabby

**Short description:** Search tabs, bookmarks, and history, then organize tabs and groups across Chrome windows.

**Detailed description:**

Find the page you need and organize your open browser windows with Tabby.

Find a page

Search open tabs, windows, tab groups, bookmarks, browsing history, and recently closed pages in one place. Repeat a search to bring the result you recently chose toward the top. Open a result, restore a closed page, or send a search to Google. Use Cmd/Ctrl with a result to open a new tab, or Shift to open a new window. If a destination cannot be opened, Tabby explains the problem and keeps your query so you can try again.

Recognize every window

Choose active-tab or first-tab defaults in Options, or use the pencil to give a window a custom name, icon, and color. Changes save immediately; Reset returns that window to the global default. Picking a window brings it forward and opens its Tab Manager. Tabby names appear in search and move destinations. Search a custom window name in the omnibar and choose its Window result to focus it without changing its active tab. Names are stored on your device, with conservative matching for restored windows.

Keep favorite pages close

Choose a Chrome bookmark folder or create Tabby Favorites to show its pages above the window controls. Add the current page without duplicates, browse folders, and remove bookmarks from favorite settings. Changes stay in sync with Chrome bookmarks. Click a favorite to focus a tab with the same address in the current window, or open one if needed. Cmd/Ctrl-click or middle-click opens a fresh tab; Shift-click opens a new window.

Organize one window at a time

Click a tab to select and activate it. Use CMD/CTRL-click to toggle selection or SHIFT-click to select a range without activating. The active tab starts selected, and Escape restores that selection. Use Ctrl+A or Cmd+A to select all tabs and groups, including collapsed groups. Right-click opens actions beside the cursor, where options open on click. Keyboard context menus open beside the focused item. Escape returns focus to the control used before opening the menu. Complete groups stay intact when moved. Create and close windows in the picker; use the header pencil to edit the current window.

Drag tabs, selected tabs, or whole groups to choose their position. Hold over the window header to reveal your windows, then drop on a window to move tabs there. Long lists scroll as you drag near their edges. Moving tabs through dragging or the menu brings the destination forward and opens its Tab Manager with the moved tabs selected, ready to reorder.

Middle-click a tab to close it, or create a new tab directly below an existing tab.

Work with the keyboard

Click the Tabby toolbar icon to search, or press Cmd+E on macOS or Alt+E on Windows and Linux. Open the tab manager from search, or press Cmd+Shift+E on macOS or Alt+Shift+E on Windows and Linux. You can customize shortcuts in Chrome’s extension settings.

Use Tab to reach controls and arrow keys to browse tabs, groups, and the window picker. Reorder tabs and groups with Alt+Up/Down. Create windows in the picker, and use Search, More actions, and Options in the bottom bar at every panel width. Find a guide to Tab manager keyboard shortcuts in Options.

Make Tabby comfortable to use

Choose from fifteen coordinated colorful and tonal themes, each with a light and dark version. Try contrasting hues or a quieter single-color palette. Choose seasonal Tabby icons for holidays throughout the year. Clear selection and focus indicators help you keep your place with the mouse or keyboard. Screen readers announce search results and the selected item, and settings menus follow your preference for reduced animation. Routine tab actions finish quietly. Notifications explain errors and partial results, and copy actions confirm when text reaches your clipboard.

New installs and extension updates start with Porcelain’s quiet neutral surfaces and warm highlights in System mode. Choose another theme in Options at any time.

Keep your browsing data local

Your tabs, bookmarks, and history are searched on your device. The developer receives none of your browsing data or saved preferences. If you choose Search Google, Google receives the query you send.

For help or feedback, visit https://github.com/michaeldrotar/tabby/issues.

**Category:** Tools, as shown on the published listing.

**Single purpose:** Find and organize the tabs and windows in your browser.

**Primary language:** English.

## Graphics and assets

| Asset                      | Dimensions    | Status | File                                                                              |
| -------------------------- | ------------- | ------ | --------------------------------------------------------------------------------- |
| Store icon                 | 128 × 128 PNG | Ready  | [Store icon](chrome-extension/public/tabby-face-128.png)                          |
| Overview screenshot        | 1280 × 800    | Ready  | [Overview](product/promotional-assets/screenshots/01-overview.jpg)                |
| Search screenshot          | 1280 × 800    | Ready  | [Find anything](product/promotional-assets/screenshots/02-find-anything.jpg)      |
| Themes screenshot          | 1280 × 800    | Ready  | [Themes](product/promotional-assets/screenshots/03-themes.jpg)                    |
| Project windows screenshot | 1280 × 800    | Ready  | [Project windows](product/promotional-assets/screenshots/04-project-windows.jpg)  |
| Bulk actions screenshot    | 1280 × 800    | Ready  | [Bulk actions](product/promotional-assets/screenshots/05-bulk-actions.jpg)        |
| Small promo tile           | 440 × 280     | Ready  | [Small promo tile](product/promotional-assets/promo-tiles/small-440-280.jpg)      |
| Marquee promo tile         | 1400 × 560    | Ready  | [Marquee promo tile](product/promotional-assets/promo-tiles/marquee-1400-560.jpg) |

Screenshots show the current product with realistic sample tabs, readable labels, and no development controls.

The overview and project-window screenshots need refreshing to include the favorites section.

The theme screenshot shows full Tab Manager previews in Porcelain, Graphite, and Arcade, including light and dark mode.

Run `TABBY_CAPTURE_PROMOS=1 pnpm -F @extension/e2e exec playwright test --config promotional-assets.config.ts` to regenerate the screenshots and promotional tiles from their checked layouts.

## Permissions justification

The manifest declares these permissions. It declares no host permissions or production content scripts.

| Permission  | Type        | Justification                                                                                                                               |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `alarms`    | permissions | Schedule a local daily check so the toolbar icon updates when a seasonal display window begins or ends.                                     |
| `favicon`   | permissions | Show recognizable website icons beside tabs, bookmarks, history, and search results using Chrome’s favicon cache.                           |
| `storage`   | permissions | Save appearance preferences, unfinished queries, recent search choices, window labels, and hashed URL fingerprints locally.                 |
| `tabs`      | permissions | List tab titles and addresses across windows, search open tabs, activate them, and perform the tab management actions selected by the user. |
| `tabGroups` | permissions | Display and search tab groups and let the user create, rename, recolor, collapse, expand, move, and ungroup them.                           |
| `sidePanel` | permissions | Display the persistent tab manager beside the current browser page.                                                                         |
| `bookmarks` | permissions | Search saved bookmarks, show a chosen favorites folder, and create or remove bookmarks at the user's request.                               |
| `history`   | permissions | Search browsing history locally and open the result selected by the user.                                                                   |
| `sessions`  | permissions | Search recently closed tabs and windows and restore the item selected by the user.                                                          |

## Privacy and data use

### Data handling

Tabby handles browsing data locally. The publisher does not collect it or receive saved preferences. The submitted listing discloses **Web history** and **User activity**.

| Data type                           | Handled?                | Transmitted off-device by Tabby? | Purpose                                                                              | Shared with the publisher? |
| ----------------------------------- | ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------ | -------------------------- |
| Personally identifiable information | No dedicated collection | No                               | —                                                                                    | No                         |
| Health information                  | No dedicated collection | No                               | —                                                                                    | No                         |
| Financial information               | No dedicated collection | No                               | —                                                                                    | No                         |
| Authentication information          | No                      | No                               | —                                                                                    | No                         |
| Personal communications             | No page-content access  | No                               | —                                                                                    | No                         |
| Location                            | No                      | No                               | —                                                                                    | No                         |
| Web history                         | Yes, locally            | No                               | Search titles and addresses locally; use hashed window URLs to restore Tabby labels. | No                         |
| User activity                       | Search choices, locally | No                               | Remember which result was chosen for a query to improve search ranking.              | No                         |
| Website content                     | No page-content access  | No                               | —                                                                                    | No                         |

Search Google is an explicit navigation chosen by the user. Google receives that query through the search URL. Do not describe the extension as never sending any data to third parties. Copy actions put only the selected text on the device’s clipboard.

Appearance preferences, an unfinished search query, recent search choices, Tabby window names and icons, and SHA-256 window URL fingerprints stay in local browser storage. Search-choice records contain a query, destination, and selection time; unused choices expire after 90 days and each store retains at most 200 query-and-destination pairs. Choices for live tabs, groups, and windows remain in session storage. Private-window choices use a separate session store. Raw URLs are not persisted as fingerprints. Closed-window fingerprints expire after 90 days, and at most 200 identities are retained. Private-window identities use session storage only. Tabby does not sync them to a server. Successful search actions clear the saved query; dismissing search preserves it. Reset in the window editor removes that window’s saved custom identity. Uninstalling removes the extension’s saved data.

The favorites folder selection stays in local preferences as a bookmark ID. Favorite pages and folders remain native Chrome bookmarks, managed through Chrome's bookmarks API. Chrome handles their synchronization according to the user's browser settings. Tabby creates a favorites folder only when the user requests it.

### Data use certification

- Data is not sold to third parties.
- Data is used only for the extension’s stated functionality.
- Data is not used for creditworthiness or lending decisions.

## Privacy policy

**Public URL:** [Tabby privacy policy](https://github.com/michaeldrotar/tabby/blob/main/PRIVACY.md).

**Repository policy:** [PRIVACY.md](PRIVACY.md).

## Distribution

**Visibility:** The listing is publicly accessible.

**Regions:** All regions.

## Developer information

**Publisher:** michaeldrotar.

**Public contact email:** michaeldrotar@gmail.com.

**Support:** [GitHub issues](https://github.com/michaeldrotar/tabby/issues).

**Homepage:** [Tabby website](https://www.gettabby.org/).

## Version history

| Version                                                                      | Submission date | Summary                                                                                 | Store status   |
| ---------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------- | -------------- |
| [1.8.0](product/releases/v1.8.0-bookmark-favorites.md)                       | —               | Native bookmark favorites in the Tab Manager.                                           | Not submitted  |
| [1.7.0](product/releases/v1.7.0-a-more-polished-tabby.md)                    | 2026-10-25      | Tab controls, drag and drop, coordinated colorful and tonal themes, and smarter search. | Pending review |
| [1.6.0](product/releases/v1.6.0-named-windows-and-a-simpler-tab-manager.md)  | 2026-10-17      | Named windows and a simpler Tab Manager.                                                | Published      |
| [1.5.0](product/releases/v1.5.0-seasonal-icons.md)                           | 2026-10-15      | Seasonal icons.                                                                         | Published      |
| [1.4.0](product/releases/v1.4.0-clearer-controls-and-safer-navigation.md)    | 2026-10-14      | Clearer controls and safer navigation.                                                  | Published      |
| [1.3.0](product/releases/v1.3.0-batch-actions-and-smarter-search.md)         | 2026-10-08      | Batch actions and smarter search.                                                       | Published      |
| [1.2.0](product/releases/v1.2.0-tab-manager-redesign-and-personalization.md) | 2025-12-17      | Tab manager redesign and personalization.                                               | Not recorded   |
| [1.1.0](product/releases/v1.1.0-polishing-the-experience.md)                 | 2025-12-04      | Search and interface polish.                                                            | Not recorded   |
| [1.0.1](https://github.com/michaeldrotar/tabby/compare/v1.0.0...v1.0.1)      | 2025-11-29      | Fix default keyboard shortcuts.                                                         | Not recorded   |
| [1.0.0](product/releases/v1.0.0-the-launch.md)                               | 2025-11-24      | Initial release.                                                                        | Not recorded   |

Version links open detailed release notes or the patch changes. Submission dates through 1.3.0 use the tagged commit dates confirmed by the publisher. Earlier store publication statuses are not recorded.

## Review notes

### Latest submission

Version 1.7.0 was submitted on 2026-10-25 with automatic publishing after approval enabled. The [developer dashboard](https://chrome.google.com/webstore/devconsole/671ad32f-f7c3-4765-93ce-bd218ed23ab9/jjkakicjobpalhifpeaggabpgdllmmob/edit/status) confirmed **Pending review**. The submission includes the updated description, five current screenshots, both promotional tiles, storage justification for recent search choices, and Web history and User activity disclosures. The release package and finalized notes are attached to the [GitHub release](https://github.com/michaeldrotar/tabby/releases/tag/v1.7.0).

### Latest publication

Version 1.6.0 is published in the [Chrome Web Store](https://chromewebstore.google.com/detail/tabby/jjkakicjobpalhifpeaggabpgdllmmob), verified on 2026-10-18. Its submission date is 2026-10-17. The listing includes the updated description, five screenshots, both promotional tiles, and storage justification for named windows. Distribution regions, permission justifications, and privacy disclosures were checked against the [pre-publish checklist](.agents/skills/chrome-extensions/references/webstore/review-checklist.md). Publishing status is available in the [developer dashboard](https://chrome.google.com/webstore/devconsole/671ad32f-f7c3-4765-93ce-bd218ed23ab9/jjkakicjobpalhifpeaggabpgdllmmob/edit/status).

### Known limitations

- Extension shortcuts can be reassigned by Chrome or the user; Options shows current assignments alongside Tab Manager keyboard shortcuts.
- Tabby manages browser tabs and metadata; it does not inspect or modify website content.
- Browsing data is not sent to the publisher. User-selected Google searches send their query to Google.

### Rejection history

No rejection history is recorded in the repository.
