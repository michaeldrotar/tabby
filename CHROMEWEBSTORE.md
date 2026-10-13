# Chrome Web Store listing — Tabby

Last updated: 2026-10-13

## Store listing

**Listing:** [Tabby](https://chromewebstore.google.com/detail/tabby/jjkakicjobpalhifpeaggabpgdllmmob)

**Extension name:** Tabby

**Short description:** Search tabs, bookmarks, and history, then organize tabs and groups across Chrome windows.

**Detailed description — current branch draft:**

Find the page you need and organize your open browser windows with Tabby.

Search open tabs, tab groups, bookmarks, browsing history, and recently closed pages in one place. Open a result, restore a closed page, or send a search to Google. Use Cmd/Ctrl with a result to open a new tab, or Shift to open a new window.

The tab manager keeps your windows and groups within reach in a side panel. Click a tab row to select it, and click its favicon, double-click the row, or press Enter to go to it. Active tabs stand out across the full row. Keep selections while viewing other windows, see selected window, group, and tab counts, and press Escape to clear the full selection. Selecting a window or group includes its children; deselecting a child keeps the other children selected. Select several tabs, groups, or windows to move, group, pin, duplicate, reload, discard, close, or copy them together.

Click the Tabby toolbar icon to search, or press Cmd+E on macOS or Alt+E on Windows and Linux. Open the tab manager from search, or press Cmd+Shift+E on macOS or Alt+Shift+E on Windows and Linux. You can customize shortcuts in Chrome’s extension settings.

Choose a light or dark theme, adjust your colors, and use the keyboard to navigate sections, create windows and tabs, select, and reorder tabs. Options lists side panel position, global Chrome shortcuts, and Tab manager shortcuts in one column, with unassigned shortcuts clearly marked. Search announces the selected result for assistive technology, and controls follow your reduced-motion preference.

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

**Regions:** Not recorded in the repository; confirm the configured dashboard regions before submission.

## Developer information

**Publisher:** michaeldrotar.

**Public contact email:** michaeldrotar@gmail.com.

**Support:** [GitHub issues](https://github.com/michaeldrotar/tabby/issues).

**Homepage:** [Tabby repository](https://github.com/michaeldrotar/tabby).

## Version history

| Version | Date                     | Changes                                                                                                                                                                                                                                                                                                                                                                                             | Status    |
| ------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1.4.0   | Not submitted            | Improve accessible controls and search, navigate manager sections and creation actions with the keyboard, distinguish global and Tab manager shortcuts in Options, use More actions for selected-tab operations and keyboard controls for reordering, and improve large-list rendering and group responsiveness. [Release notes](product/releases/v1.4.0-clearer-controls-and-safer-navigation.md). | Draft     |
| 1.3.0   | Store updated 2026-10-08 | Batch actions, tab group search, numbered window shortcuts, manual tab discard, keyboard reordering, and a standard search popup. [Release notes](product/releases/v1.3.0-batch-actions-and-smarter-search.md).                                                                                                                                                                                     | Published |

The published listing identifies version 1.3.0 and its update date. Record submission dates when submitting a version; do not substitute a GitHub release date for a store submission date.

## Review notes

### Submission readiness

Version 1.4.0 has not been submitted. Confirm dashboard regions and disclosure fields, and complete the [pre-publish checklist](.agents/skills/chrome-extensions/references/webstore/review-checklist.md) before a requested submission.

### Known limitations

- Extension shortcuts can be reassigned by Chrome or the user; Options shows current assignments alongside Tab Manager keyboard shortcuts.
- Tabby manages browser tabs and metadata; it does not inspect or modify website content.
- Browsing data is not sent to the publisher. User-selected Google searches send their query to Google.

### Rejection history

No rejection history is recorded in the repository.
