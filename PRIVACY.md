# Privacy Policy for Tabby

Last updated: October 1, 2026

## Introduction

Your privacy is critically important to us. This Privacy Policy explains how Tabby ("we", "us", or "our") collects, uses, and protects your information when you use our Chrome extension.

**The short version:** We do not collect, store, or transmit your personal data. All processing happens locally on your device.

## Data Collection and Usage

Tabby is designed with privacy as a core value.

- **No Remote Servers:** Tabby does not have a backend server. It does not transmit your search queries, browsing history, bookmarks, or any other personal data to us or any third parties.
- **Local Processing:** All search and management functionality (searching tabs, history, bookmarks) is performed locally within your browser.
- **Local Storage:** We use your browser's local storage (`chrome.storage`) solely to save your user preferences (e.g., your last search query or UI settings). This data never leaves your device.

## Permissions

To provide its functionality, Tabby requires certain permissions. The search popup and Tab Manager run in extension-owned surfaces; Tabby does not inject UI into web pages or request access to the page you are viewing.

| Permission  | Reason                                                                                       |
| :---------- | :------------------------------------------------------------------------------------------- |
| `favicon`   | Required to display icons for your tabs, bookmarks, and history items in the search results. |
| `storage`   | Used to save your local preferences and settings on your device.                             |
| `tabs`      | Core functionality for listing, switching, and managing your open tabs.                      |
| `tabGroups` | Enables viewing and organizing your tab groups.                                              |
| `sidePanel` | Required to display the Tab Manager in the browser's side panel.                             |
| `bookmarks` | Allows searching and navigating your saved bookmarks locally.                                |
| `history`   | Allows searching and navigating your browsing history locally.                               |
| `sessions`  | Allows searching and restoring your recently closed tabs and windows.                        |

## Security

- **Extension-owned UI:** Search opens in Chrome's standard extension popup and tab management opens in the native side panel. Neither surface is part of a website you visit.
- **Restricted Pages:** Because Tabby does not inject scripts into web pages, its search popup works independently of page restrictions such as `chrome://` URLs.

## Changes to This Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.

## Contact Us

If you have any questions about this Privacy Policy, please contact us via our GitHub repository.
