# Tabby

Tabby is a Chrome extension built with React, Vite, Tailwind CSS, and Copilot.

## Features

### Omnibar

More than just search, it's your browser's command line. Press `Cmd+E` (Mac) or `Ctrl+E` (Windows) to instantly access:

- **Universal Search**: Query across open tabs, bookmarks, and browsing history simultaneously.
- **Web Search**: Type a query to search Google directly.
- **Direct Navigation**: Paste or type a URL to open it.
- **Browser Actions**: Execute commands like opening Chrome settings or opening the Tabby Tab Manager.

Most commands support `Cmd/Ctrl` to open in a new tab and `Shift` to open in a new window.

### Tab Manager

Manage all your windows and tabs in a clear view. Press `Cmd+Shift+E` (Mac) or `Ctrl+Shift+E` (Windows) to open the side panel.

- **Multi-Window View**: See all your open windows and easily switch between them.
- **Tab Organization**: View and manage tabs within each window, including support for Tab Groups.

## Privacy & Security

Privacy is a core value of Tabby. All processing happens locally on your device, and no data is ever sent to external servers.

### Secure Architecture

Unlike many extensions that inject content scripts into every page you visit, potentially degrading performance and exposing private data, Tabby operates on a strict "need-to-know" basis.

- **On-Demand Access**: Tabby utilizes the [`activeTab`](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab) permission. This grants the extension temporary access to the current tab _only_ when you explicitly invoke it. It does not run in the background on your open tabs.
- **Sandboxed UI**: To protect your data, Tabby injects its interface into a secure, isolated `iframe`. This ensures that the websites you visit cannot detect or read your search results, keeping your bookmarks and history private from malicious scripts.
- **Restricted Pages**: For security reasons, browsers block extensions from injecting scripts into `chrome://` pages (like Settings or Extensions). In these cases, Tabby seamlessly falls back to a popup window that behaves just like the overlay.

### Permissions

We believe in transparency. Here is a breakdown of every permission Tabby requests and why:

| Permission                                                                             | Reason                                                                          |
| :------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| [`activeTab`](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab) | Grants temporary access to the current page only when you invoke the extension. |
| [`favicon`](https://developer.chrome.com/docs/extensions/reference/api/favicon)        | Required to display icons for your tabs, bookmarks, and history items.          |
| [`storage`](https://developer.chrome.com/docs/extensions/reference/api/storage)        | Used to save local preferences, such as your last search query.                 |
| [`scripting`](https://developer.chrome.com/docs/extensions/reference/api/scripting)    | Allows the extension to inject the secure Omnibar overlay into the page.        |
| [`tabs`](https://developer.chrome.com/docs/extensions/reference/api/tabs)              | Core functionality for listing, switching, and managing your open tabs.         |
| [`tabGroups`](https://developer.chrome.com/docs/extensions/reference/api/tabGroups)    | Enables viewing and organizing your tab groups.                                 |
| [`sidePanel`](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)    | Required to display the Tab Manager in the browser's side panel.                |
| [`bookmarks`](https://developer.chrome.com/docs/extensions/reference/api/bookmarks)    | Allows searching and navigating your saved bookmarks.                           |
| [`history`](https://developer.chrome.com/docs/extensions/reference/api/history)        | Allows searching and navigating your browsing history.                          |
| [`sessions`](https://developer.chrome.com/docs/extensions/reference/api/sessions)      | Allows searching and restoring your recently closed tabs and windows.           |

## Credits & Inspiration

Tabby is the result of standing on the shoulders of giants (and AI).

- **[Zen Browser](https://zen-browser.app/)**: The primary inspiration for Tabby's design and functionality. We wanted to bring that seamless, keyboard-centric experience to Chrome users.
- **[Chrome Extension Boilerplate](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite)**: This amazing repository by Jonghakseo provided the robust foundation and monorepo structure that made development a breeze.
- **GitHub Copilot**: This project is a testament to the power of AI-assisted development. It was built in close collaboration with GitHub Copilot, which helped provide guidance on security and performance, as well as help instrument large refactors and drive the entire look and feel.

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

1.  **Prep the release on `next` branch:**

    ```bash
    git checkout next
    git pull origin next
    pnpm prep minor          # or: pnpm prep patch, pnpm prep major, pnpm prep 2.0.0
    git add package.json
    git commit -m "Bump version to v1.1.0"
    git push origin next
    ```

2.  **Build new features:**

    Develop your features on the `next` branch via feature branches and PRs.

3.  **Update release notes:**

    Update or create the relevant file in `product/releases/` (e.g., `v1.1.0-polishing-the-experience.md`).

    ```bash
    git add product/releases/
    git commit -m "Add release notes for v1.1.0"
    git push origin next
    ```

4.  **Merge to `main` and tag:**

    Once ready to release, merge `next` into `main`:

    ```bash
    git checkout main
    git pull origin main
    git merge next
    git push origin main
    git tag v1.1.0
    git push origin v1.1.0
    ```

5.  **Build and upload:**

    ```bash
    git checkout v1.1.0
    pnpm zip
    ```

    This creates a zip file in `dist-zip/` ready for upload to the Chrome Web Store.

### Hotfix Process

If you need to fix a bug in a released version:

1.  **Create hotfix branch from the release tag:**

    ```bash
    git checkout v1.0.0
    git checkout -b hotfix/v1.0.1
    ```

2.  **Fix the bug and update version:**

    ```bash
    pnpm prep patch          # or: pnpm prep 1.0.1
    git add package.json
    git commit -m "Fix critical bug"
    ```

3.  **Merge to `main`, tag, and ship:**

    ```bash
    git checkout main
    git merge hotfix/v1.0.1
    git push origin main
    git tag v1.0.1
    git push origin v1.0.1
    pnpm zip
    ```

4.  **Merge into `next`:**

    ```bash
    git checkout next
    git merge main
    git push origin next
    ```
