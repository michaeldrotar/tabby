# Chrome Web Store listing — Tabby

Last updated: 2026-10-15

Publishing reference for Tabby's store listing, images, permissions explanations, privacy disclosures, and submission records. Detailed release notes are linked from the version history.

## Store listing

**Listing:** [Tabby](https://chromewebstore.google.com/detail/tabby/jjkakicjobpalhifpeaggabpgdllmmob)

**Extension name:** Tabby

**Short description:** Search tabs, bookmarks, and history, then organize tabs and groups across Chrome windows.

**Detailed description — 1.4.0 submission:**

Find the page you need and organize your open browser windows with Tabby.

Find a page

Search open tabs, tab groups, bookmarks, browsing history, and recently closed pages in one place. Open a result, restore a closed page, or send a search to Google. Use Cmd/Ctrl with a result to open a new tab, or Shift to open a new window. If a destination cannot be opened, Tabby explains the problem and keeps your query so you can try again.

Select across windows

The tab manager keeps your windows and groups within reach in a side panel. Click a tab row to select it without leaving your current page. Click its icon, double-click the row, or press Enter to go to it. Browse other windows while keeping your selected tabs. Select a window or group, then deselect individual tabs while keeping the rest selected. Press Escape to clear the full selection.

Organize and clean up

Select several tabs, groups, or windows and use More actions to move, group, pin, duplicate, reload, discard, close, or copy them together. Close duplicate tabs across all windows from a tab's action menu while keeping the tab you chose. Large tab lists stay responsive as you scroll and navigate, and groups expand and collapse promptly.

Work with the keyboard

Click the Tabby toolbar icon to search, or press Cmd+E on macOS or Alt+E on Windows and Linux. Open the tab manager from search, or press Cmd+Shift+E on macOS or Alt+Shift+E on Windows and Linux. You can customize shortcuts in Chrome’s extension settings.

Jump between parts of the tab manager with Tab, and use arrow keys to reach tabs, groups, New tab, and New window. Reorder tabs and groups with Alt+Up/Down. In narrow panels, the sidebar moves out of the way when you navigate into the tab list. Find a guide to Tab manager keyboard shortcuts in Options.

Make Tabby comfortable to use

Choose a light or dark theme and adjust your colors. Screen readers announce search results and the selected item, and settings menus follow your preference for reduced animation. Routine tab actions finish quietly. Notifications explain errors and partial results, and copy actions confirm when text reaches your clipboard.

Keep your browsing data local

Your tabs, bookmarks, and history are searched on your device. The developer receives none of your browsing data or saved preferences. If you choose Search Google, Google receives the query you send.

For help or feedback, visit https://github.com/michaeldrotar/tabby/issues.

**Category:** Tools, as shown on the published listing.

**Single purpose:** Find and organize the tabs and windows in your browser.

**Primary language:** English.

## Graphics and assets

| Asset                  | Dimensions    | Status | File                                                                       |
| ---------------------- | ------------- | ------ | -------------------------------------------------------------------------- |
| Store icon             | 128 × 128 PNG | Ready  | [tabby-face-128.png](chrome-extension/public/tabby-face-128.png)           |
| Tab manager screenshot | 1280 × 800    | Ready  | [Current asset](product/promotional-assets/tab-manager-1280-800.jpg)       |
| Search screenshot      | 1280 × 800    | Ready  | [Search screenshot](product/promotional-assets/omnibar-1280-800.png)       |
| Small promo tile       | 440 × 280     | Ready  | [Small promo tile](product/promotional-assets/cws-small-promo-440-280.jpg) |
| Marquee promo tile     | 1400 × 560    | Ready  | [Marquee promo tile](product/promotional-assets/cws-marquee-1400-560.jpg)  |

Screenshots show the current product with realistic sample tabs. Capture the tab manager and search separately, with readable labels and no development controls.

## Permissions justification

The manifest declares these permissions. It declares no host permissions or production content scripts.

| Permission  | Type        | Justification                                                                                                                               |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `alarms`    | permissions | Schedule a local daily check so the toolbar icon updates when a seasonal display window begins or ends.                                     |
| `favicon`   | permissions | Show recognizable website icons beside tabs, bookmarks, history, and search results using Chrome’s favicon cache.                           |
| `storage`   | permissions | Save local appearance and tab manager preferences and preserve an unfinished search query between popup sessions.                           |
| `tabs`      | permissions | List tab titles and addresses across windows, search open tabs, activate them, and perform the tab management actions selected by the user. |
| `tabGroups` | permissions | Display and search tab groups and let the user create, rename, recolor, collapse, expand, move, and ungroup them.                           |
| `sidePanel` | permissions | Display the persistent tab manager beside the current browser page.                                                                         |
| `bookmarks` | permissions | Search saved bookmarks locally and open the result selected by the user.                                                                    |
| `history`   | permissions | Search browsing history locally and open the result selected by the user.                                                                   |
| `sessions`  | permissions | Search recently closed tabs and windows and restore the item selected by the user.                                                          |

## Privacy and data use

### Data handling

Tabby handles browsing data locally. The publisher does not collect it or receive saved preferences. The published listing discloses **Web history**.

| Data type                           | Handled?                 | Transmitted off-device by Tabby? | Purpose                                                                                      | Shared with the publisher? |
| ----------------------------------- | ------------------------ | -------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------- |
| Personally identifiable information | No dedicated collection  | No                               | —                                                                                            | No                         |
| Health information                  | No dedicated collection  | No                               | —                                                                                            | No                         |
| Financial information               | No dedicated collection  | No                               | —                                                                                            | No                         |
| Authentication information          | No                       | No                               | —                                                                                            | No                         |
| Personal communications             | No page-content access   | No                               | —                                                                                            | No                         |
| Location                            | No                       | No                               | —                                                                                            | No                         |
| Web history                         | Yes, locally             | No                               | Search titles and addresses of tabs, bookmarks, browsing history, and recently closed pages. | No                         |
| User activity                       | No tracking or analytics | No                               | —                                                                                            | No                         |
| Website content                     | No page-content access   | No                               | —                                                                                            | No                         |

Search Google is an explicit navigation chosen by the user. Google receives that query through the search URL. Do not describe the extension as never sending any data to third parties. Copy actions put only the selected text on the device’s clipboard.

Appearance preferences and an unfinished search query stay in local browser storage. Tabby does not sync them to a server. Successful search actions clear the saved query; dismissing search preserves it. Reset restores appearance and tab manager defaults. Uninstalling removes the extension’s saved data.

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

**Homepage:** [Tabby repository](https://github.com/michaeldrotar/tabby).

## Version history

| Version                                                                      | Submission date | Summary                                   | Store status   |
| ---------------------------------------------------------------------------- | --------------- | ----------------------------------------- | -------------- |
| [1.5.0](product/releases/v1.5.0-seasonal-icons.md)                           | —               | Seasonal icons.                           | Draft          |
| [1.4.0](product/releases/v1.4.0-clearer-controls-and-safer-navigation.md)    | 2026-10-14      | Clearer controls and safer navigation.    | Pending review |
| [1.3.0](product/releases/v1.3.0-batch-actions-and-smarter-search.md)         | 2026-10-08      | Batch actions and smarter search.         | Published      |
| [1.2.0](product/releases/v1.2.0-tab-manager-redesign-and-personalization.md) | 2025-12-17      | Tab manager redesign and personalization. | Not recorded   |
| [1.1.0](product/releases/v1.1.0-polishing-the-experience.md)                 | 2025-12-04      | Search and interface polish.              | Not recorded   |
| [1.0.1](https://github.com/michaeldrotar/tabby/compare/v1.0.0...v1.0.1)      | 2025-11-29      | Fix default keyboard shortcuts.           | Not recorded   |
| [1.0.0](product/releases/v1.0.0-the-launch.md)                               | 2025-11-24      | Initial release.                          | Not recorded   |

Version links open detailed release notes or the patch changes. Submission dates through 1.3.0 use the tagged commit dates confirmed by the publisher. Earlier store publication statuses are not recorded.

## Review notes

### Current submission

Version 1.4.0 was submitted on 2026-10-14 and is pending review with automatic publishing enabled. The listing includes five screenshots and both promotional tiles. Distribution regions, permission justifications, and privacy disclosures were checked against the [pre-publish checklist](.agents/skills/chrome-extensions/references/webstore/review-checklist.md). Track review status in the [developer dashboard](https://chrome.google.com/webstore/devconsole/671ad32f-f7c3-4765-93ce-bd218ed23ab9/jjkakicjobpalhifpeaggabpgdllmmob/edit/status).

### Known limitations

- Extension shortcuts can be reassigned by Chrome or the user; Options shows current assignments alongside Tab Manager keyboard shortcuts.
- Tabby manages browser tabs and metadata; it does not inspect or modify website content.
- Browsing data is not sent to the publisher. User-selected Google searches send their query to Google.

### Rejection history

No rejection history is recorded in the repository.
