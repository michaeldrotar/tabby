# Privacy Policy for Tabby

Last updated: November 24, 2025

## Introduction

Your privacy is critically important to us. This Privacy Policy explains how Tabby ("we", "us", or "our") collects, uses, and protects your information when you use our Chrome extension.

**The short version:** We do not collect, store, or transmit your personal data. All processing happens locally on your device.

## Data Collection and Usage

Tabby is designed with privacy as a core value.

- **No Remote Servers:** Tabby does not have a backend server. It does not transmit your search queries, browsing history, bookmarks, or any other personal data to us or any third parties.
- **Local Processing:** All search and management functionality (searching tabs, history, bookmarks) is performed locally within your browser.
- **Local Storage:** We use your browser's local storage (`chrome.storage`) solely to save your user preferences (e.g., your last search query or UI settings). This data never leaves your device.

## Permissions

To provide its functionality, Tabby requires certain permissions. We operate on a strict "need-to-know" basis. Here is a detailed explanation of why each permission is requested:

| Permission  | Reason                                                                                                                                                         |
| :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `activeTab` | Grants temporary access to the current page only when you explicitly invoke the extension. This ensures Tabby does not run in the background on all your tabs. |
| `favicon`   | Required to display icons for your tabs, bookmarks, and history items in the search results.                                                                   |
| `storage`   | Used to save your local preferences and settings on your device.                                                                                               |
| `scripting` | Allows the extension to inject the secure Omnibar overlay into the page you are viewing.                                                                       |
| `tabs`      | Core functionality for listing, switching, and managing your open tabs.                                                                                        |
| `tabGroups` | Enables viewing and organizing your tab groups.                                                                                                                |
| `sidePanel` | Required to display the Tab Manager in the browser's side panel.                                                                                               |
| `bookmarks` | Allows searching and navigating your saved bookmarks locally.                                                                                                  |
| `history`   | Allows searching and navigating your browsing history locally.                                                                                                 |

## Security

- **Sandboxed UI:** Tabby injects its interface into a secure, isolated `iframe`. This ensures that the websites you visit cannot detect or read your search results, keeping your bookmarks and history private from malicious scripts on the web.
- **Restricted Pages:** Tabby respects browser security restrictions and does not inject scripts into sensitive `chrome://` pages.

## Changes to This Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.

## Contact Us

If you have any questions about this Privacy Policy, please contact us via our GitHub repository.
