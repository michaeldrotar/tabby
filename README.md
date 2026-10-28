# Tabby

Tabby is a Chrome extension I built with React, Vite, and Tailwind CSS, with help from AI agents.

[![Visit the Tabby website](product/brand/website-cta.svg)](https://www.gettabby.org/)
[![Get Tabby for Chrome](product/brand/chrome-store-cta.svg)](https://chromewebstore.google.com/detail/tabby/jjkakicjobpalhifpeaggabpgdllmmob)

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

### Tab manager

Manage all your windows and tabs in a clear view. Use the default Tab Manager shortcut—`Cmd+Shift+E` on macOS or `Alt+Shift+E` on Windows/Linux—or choose **Open tab manager** inside the search popup to open the side panel.

- **Window switcher:** Choose a window to bring it forward and open its Tab Manager. Each window keeps its own selection and editor state.
- **Window names and icons:** Choose active-tab or first-tab defaults in Settings. Use the header pencil to edit a window's custom name, icon, and color; edits save immediately. Reset returns that window to the global default. Search a custom window name in the omnibar and choose its Window result to focus it while keeping its active tab.
- **Tab and group selection:** Clicking a tab selects and activates it. Cmd/Ctrl-click toggles selection; Shift-click selects a range without activating. The active tab is selected on load and after Escape. Cmd/Ctrl+A selects all tabs and groups, including collapsed groups.
- **Window controls:** Create and close windows in the window picker, which opens scrolled to the current window.
- **Everyday controls:** Search and Settings stay at the bottom left, with More actions at the bottom right. Right-clicking a tab or group opens its actions beside the cursor; click an action to show its options there. New tab stays with the tabs, and New window sits at the end of the window picker.

| Gesture                          | Result                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| Click a tab or press Enter on it | Select and activate that tab                                                                        |
| Cmd/Ctrl-click a tab             | Toggle selection without activating; toggling the last selected tab leaves no selection             |
| Shift-click a tab                | Select a range without activating                                                                   |
| Click a group name               | Select the group and its tabs                                                                       |
| Choose a window                  | Bring it forward and open its Tab Manager                                                           |
| Move selected tabs or groups     | Keep managing the source window while it exists; complete groups retain their identity              |
| Right-click a tab or group       | Preserve selection if it includes the item; otherwise select it, then open More actions             |
| Up/Down, Home/End                | Move focus; ordinary navigation selects the item, while multi-select navigation preserves selection |
| Space                            | Toggle selection and enter multi-select mode                                                        |
| Cmd/Ctrl+A                       | Select all tabs and groups in the current window                                                    |
| Escape                           | Close the current menu or editor, or restore the active-tab selection                               |

Up and Down connect the window header, tab list, and bottom tools. Left and Right move between header controls or bottom tools. Keyboard context menus open beside the focused item. Closing a menu with Escape restores its opening focus. Tab and Shift+Tab move between sections. Enter toggles a focused group or chooses a window in the picker. Alt/Option+Up/Down reorders a tab or group. F2 edits a group's name.

Tabby names are separate from Chrome's native window names: the [Chrome windows API](https://developer.chrome.com/docs/extensions/reference/api/windows) exposes no supported native-name field or rename method. Names, icon shapes, and icon colors stay on this device. The service worker tracks a live window through its browser session and keeps hashes of its web/file URLs to match a restored window. Restore matching requires a unique, strong match; ambiguous windows stay unnamed. Window position alone never assigns a name. Duplicate cleanup closes exact URL matches across all windows and keeps the chosen tab.

Closed-window fingerprints expire after 90 days, with at most 200 saved identities retained. Private-window labels last for the browser session and are excluded from persistent fingerprints.

## Bookmarks

Use the **Tabs** and **Bookmarks** switch in the bottom bar to move between windows/tabs and Chrome's native bookmarks. Browse folders or filter all bookmarks by name or address. Right-click an entry or use **More actions** for the current selection. Cmd/Ctrl-click toggles selection, Shift-click selects a range, Space enters multi-select mode, and Cmd/Ctrl+A selects the visible entries. Move or delete several entries together. Duplicate names remain separate entries. Chrome-managed folders and bookmarks are read-only. Folder deletion shows the affected bookmark and folder counts before removing the contents from Chrome bookmarks.

A bookmark opens in the current window's active tab. Middle-click opens a new tab; the context menu can open selected bookmarks together in new tabs, a new window, or a new group. Folder actions can open only the direct bookmark children as tabs in the current window, in a new window, or in one new tab group. **Open folder structure as windows and groups** opens direct bookmarks in one window, then each immediate child folder with bookmarks in its own window. Within those windows, the next folder level becomes groups, with deeper descendants flattened into their nearest group. Empty branches are skipped and bookmark order is retained.

**Bookmark a window** saves one chosen window into a new or existing native bookmark folder. Existing folders keep their current entries; the saved tabs are appended. **Restore as one window** opens that folder's direct bookmarks as tabs and child folders as groups. This format preserves URLs, bookmark titles, order, group boundaries, labels, and colors. Restored pages supply their own live tab titles. It does not preserve window geometry, back/forward history, pinned state, active-tab selection, or page/form state. Recently closed pages remain available through Search.

Group folders use `<label> [Tabby group v1:<payload>]` titles, where the payload is a URI-encoded JSON array of group identity, label, and Chrome color. Tabby shows the decoded label; renaming through Tabby preserves the encoding. Editing or removing the encoded suffix in another bookmark manager makes the folder an ordinary group with Chrome's default gray color. The folder remains native bookmark data and follows Chrome's bookmark sync settings. Only the selected sidebar folder is stored locally as a preference.

Tabby skips executable or unsupported addresses when saving/opening folders and reports how many were skipped. If Chrome rejects a supported address while opening a folder, other bookmarks still open and the result reports the rejected count. If Chrome rejects a window save, Tabby removes the entries created by that save and reports any cleanup failure. A single bookmark rejected by Chrome stays available for editing.

## Privacy and security

Privacy is a core value of Tabby. Searches across your tabs, bookmarks, and history happen locally on your device. If you choose **Search Google**, Tabby opens Google with your query in the search URL.

### Permissions

See [Chrome Web Store documentation](./CHROMEWEBSTORE.md#permissions-justification) for every requested permission and its purpose, and the [privacy policy](./PRIVACY.md) for data handling.

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

## Preview with Sample Data

After installing dependencies, run:

```bash
pnpm preview
```

Open the URL printed by the command. It builds the current branch and runs the
full Tab Manager with simulated Chrome APIs and sample data. Selection, sidebar
transitions, themes, and notifications use the application code. Browser actions
update the sample data and emit events to the real stores. Search and Settings
buttons are inactive in this preview.

The server chooses an available local port. To choose a port or a different
fixture, use:

```bash
pnpm preview --port 5175 --fixture scripts/preview/browser-data.json
```

Edit [`browser-data.json`](./scripts/preview/browser-data.json) to set up windows,
tabs, groups, and preferences. Refresh to reset the sample data. Rebuild and
restart after application source changes. The preview data stays in memory;
A small headless extension smoke test covers packaged extension integration.

## Demo Studio

Run `pnpm demo-studio` and open the URL it prints (usually [Demo Studio](http://localhost:5180/)) to use Tab Manager, Omnibar, and Options with sample data. Demo Studio starts with one instance; enable a second to compare shared browser data, view state, preferences, and themes. Choose Explore, Guided, Still, or Anatomy from the sidebar, then switch products from the stage. Appearance controls set the selected instance's theme and edit its background, foreground, and accent palettes.

The [Demo Studio guide](./pages/demo-studio/README.md) documents resource composition, sample scenes, and verification. The [UI guide](./packages/ui/README.md) covers styling and embedding complete surfaces or individual components.

## Testing

Run `pnpm exec turbo ready` and `pnpm test` for unit, component, and render-regression tests. The [200-tab render fixture](./packages/app/lib/TabManagerPerformance.spec.tsx) checks which rows update during selection, clock changes, tab updates, and opening and activating a tab.

Run `pnpm e2e` to build and run the headless browser workflows. Tab Manager selection, grouping, movement, keyboard focus, and window navigation use sample data through the [shared preview mock](./scripts/preview/mock-chrome.js). One extension smoke test checks packaged pages, shared preferences, saved search, and live tab updates in an isolated profile with one normal browser window. The tests do not open desktop windows or take focus.

Run `pnpm test:demo-studio` for the headless Demo Studio workflows, including the 400-tab fixture. To inspect the Tab Manager manually, run `pnpm preview` and use the sample-data preview.

## Releasing

This project uses **semantic versioning**: `Major.Minor.Patch`

- **Major** (`1.0.0`): Breaking changes
- **Minor** (`1.1.0`): New features
- **Patch** (`1.0.1`): Bug fixes

The version is stored in the root `package.json` only. All other packages use `0.0.0` since they're private and never published.

### Release Process

`main` is the integration branch for the latest accepted code. Feature changes
and patch fixes go through reviewed pull requests; publishing to the Chrome Web
Store happens only when requested. See
[`RELEASE.md`](./RELEASE.md) for the versioning, release-notes, patch, and
publishing workflow.
