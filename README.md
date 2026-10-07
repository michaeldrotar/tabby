# Tabby

Tabby is a Chrome extension I built with React, Vite, and Tailwind CSS, with help from AI agents.

## Features

### Omnibar

More than just search, it's your browser's command line. Click the Tabby toolbar icon or use the default search shortcut—`Cmd+E` on macOS or `Alt+E` on Windows/Linux—to open Tabby and instantly access:

- **Universal Search**: Query across open tabs, bookmarks, and browsing history simultaneously.
- **Web Search**: Type a query to search Google directly.
- **Direct Navigation**: Paste or type a URL to open it.
- **Browser Actions**: Execute commands like opening Chrome settings or opening the Tabby Tab Manager.

Most commands support `Cmd/Ctrl` to open in a new tab and `Shift` to open in a new window.

You can change Tabby's shortcuts in Chrome's extension shortcut settings. The
shortcuts shown above are the defaults.

### Tab Manager

Manage all your windows and tabs in a clear view. Use the default Tab Manager shortcut—`Cmd+Shift+E` on macOS or `Alt+Shift+E` on Windows/Linux—or choose **Open Tab Manager** inside the search popup to open the side panel.

- **Multi-Window View**: See all your open windows and easily switch between them.
- **Tab Organization**: View and manage tabs within each window, including support for Tab Groups.
- **Multi-Selection**: Select multiple tabs using familiar keyboard and mouse patterns:
  - Click to select a single tab
  - `Shift+Click` to select a range
  - `Cmd/Ctrl+Click` to toggle individual items
  - `Cmd/Ctrl+A` to select all tabs in the current window
  - Arrow keys to navigate
  - `Shift+Up/Down` to select a range
  - `Space` to toggle individual items in multi-select mode
  - `ESC` to clear selections and return to standard selection mode

## Privacy & Security

Privacy is a core value of Tabby. Searches across your tabs, bookmarks, and history happen locally on your device. If you choose **Search Google**, Tabby opens Google with your query in the search URL.

### Permissions

I believe in transparency. Here is a breakdown of every permission Tabby requests and why:

| Permission                                                                          | Reason                                                                  |
| :---------------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| [`favicon`](https://developer.chrome.com/docs/extensions/reference/api/favicon)     | Required to display icons for your tabs, bookmarks, and history items.  |
| [`storage`](https://developer.chrome.com/docs/extensions/reference/api/storage)     | Used to save local preferences, such as your last search query.         |
| [`tabs`](https://developer.chrome.com/docs/extensions/reference/api/tabs)           | Core functionality for listing, switching, and managing your open tabs. |
| [`tabGroups`](https://developer.chrome.com/docs/extensions/reference/api/tabGroups) | Enables viewing and organizing your tab groups.                         |
| [`sidePanel`](https://developer.chrome.com/docs/extensions/reference/api/sidePanel) | Required to display the Tab Manager in the browser's side panel.        |
| [`bookmarks`](https://developer.chrome.com/docs/extensions/reference/api/bookmarks) | Allows searching and navigating your saved bookmarks.                   |
| [`history`](https://developer.chrome.com/docs/extensions/reference/api/history)     | Allows searching and navigating your browsing history.                  |
| [`sessions`](https://developer.chrome.com/docs/extensions/reference/api/sessions)   | Allows searching and restoring your recently closed tabs and windows.   |

## Credits & Inspiration

Tabby is the result of standing on the shoulders of giants (and AI).

- **[Zen Browser](https://zen-browser.app/)**: The primary inspiration for Tabby's design and functionality. I wanted to bring that seamless, keyboard-centric experience to Chrome users.
- **[Chrome Extension Boilerplate](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite)**: This amazing repository by Jonghakseo provided the robust foundation and monorepo structure that made development a breeze.
- **AI Agents**: I use AI agents for guidance on security and performance, large refactors, and shaping the look and feel.

## Installing Locally

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/michaeldrotar/tabby.git
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Run development server:**

    ```bash
    pnpm dev
    ```

4.  **Load extension in Chrome:**
    - Go to `chrome://extensions/`
    - Enable "Developer mode"
    - Click "Load unpacked"
    - Select the `dist` folder

## Releasing

This project uses a **Product SemVer** versioning scheme: `Major.Minor.Patch`

- **Major** (`1.0.0`): Marketing major releases (e.g., Tabby 2.0)
- **Minor** (`1.1.0`): New features
- **Patch** (`1.0.1`): Bug fixes

The version is stored in the root `package.json` only. All other packages use `0.0.0` since they're private and never published.

### Release Process

`main` is the integration branch for the latest accepted code. Feature changes
and patch fixes go through reviewed pull requests; publishing to the Chrome Web
Store happens only when requested. See
[`RELEASE.md`](./RELEASE.md) for the versioning, release-notes, patch, and
publishing workflow.
