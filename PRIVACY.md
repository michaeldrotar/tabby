# Privacy policy for Tabby

Last updated: October 21, 2026

## Introduction

Your privacy is critically important to me. This Privacy Policy explains how I handle information when you use the Tabby Chrome extension.

**The short version:** I do not receive your browsing data or preferences. Tabby stores your preferences, including your last search query and recent search choices, and your Tabby window names and icons in your browser's local storage. Searches across tabs, bookmarks, and history happen locally. If you choose **Search Google**, Tabby opens Google with your query in the search URL, and Google receives it.

## Data collection and usage

Tabby is designed with privacy as a core value.

- **No Backend Server:** Tabby does not have a backend server. I do not receive your browsing history, bookmarks, or saved preferences.
- **Local Processing:** Searches across your tabs, history, and bookmarks, along with tab management, happen locally within your browser.
- **Google Searches:** When you select **Search Google**, Tabby opens Google with your query in the search URL. Google receives the query; see [Google's Privacy Policy](https://policies.google.com/privacy) for how Google handles information.
- **Search Choices:** Tabby remembers the query, destination, and time when you choose a search result, so repeating that query can bring the same result toward the top. These records stay on your device, expire after 90 days of disuse, and are limited to 200 query-and-destination pairs per store. Choices for live tabs, groups, and windows remain in session storage. Private-window choices use a separate session store. No search-choice records are sent to the publisher.
- **Local Storage:** Tabby uses your browser's local storage (`chrome.storage`) to save your preferences, unfinished search query, and Tabby window names and icons. To recognize restored windows, it also keeps SHA-256 hashes of their web and file URLs. Raw addresses are not saved as window fingerprints. Closed-window fingerprints expire after 90 days; at most 200 saved window identities are retained. Private-window names and icons remain in session storage and are not included in persistent fingerprints. This information is stored in your browser, not on a Tabby server.

## Permissions

To provide its functionality, Tabby requires certain permissions.

| Permission  | Reason                                                                                            |
| :---------- | :------------------------------------------------------------------------------------------------ |
| `favicon`   | Required to display icons for your tabs, bookmarks, and history items in the search results.      |
| `storage`   | Used to save preferences, search choices, window labels, and restore fingerprints on your device. |
| `tabs`      | Core functionality for listing, switching, and managing your open tabs.                           |
| `tabGroups` | Enables viewing and organizing your tab groups.                                                   |
| `sidePanel` | Required to display the tab manager in the browser's side panel.                                  |
| `bookmarks` | Allows searching and navigating your saved bookmarks locally.                                     |
| `history`   | Allows searching and navigating your browsing history locally.                                    |
| `sessions`  | Allows searching and restoring your recently closed tabs and windows.                             |

Successful search actions clear the saved query; dismissing search preserves it. Reset restores appearance defaults. Clear a window’s name and choose its automatic icon to remove its saved identity. Uninstalling removes the extension’s saved data. Tabby does not access website content or send your activity to the publisher.

## Changes to this policy

I may update this Privacy Policy from time to time. I will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.

## Contact me

If you have any questions about this Privacy Policy, please contact me through [GitHub issues](https://github.com/michaeldrotar/tabby/issues).
