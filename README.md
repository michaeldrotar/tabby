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

### Tab manager

Manage all your windows and tabs in a clear view. Use the default Tab Manager shortcut—`Cmd+Shift+E` on macOS or `Alt+Shift+E` on Windows/Linux—or choose **Open tab manager** inside the search popup to open the side panel.

- **Multi-Window View**: See all your open windows and easily switch between them.
- **Tab Organization**: View and manage tabs within each window, including support for Tab Groups.
- **Multi-selection**: Keep selected tabs, groups, and windows while browsing other windows. Selecting a group or window includes its children. Toggling a child off deselects its parents and keeps the other children selected.

| Gesture                                     | Selection and keyboard focus                                                                               | Viewed window                                   | Chrome activation                                         |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| Click a tab row or group name               | Select only that item and its children; focus it                                                           | Keep the current pane                           | None                                                      |
| Click a tab favicon                         | Keep selection; focus the tab                                                                              | Keep the current pane                           | Activate the tab                                          |
| Double-click a tab row                      | Select and focus that tab                                                                                  | Keep the current pane                           | Activate the tab                                          |
| Click a window                              | Keep selection; focus the window                                                                           | Show that window's tabs                         | None                                                      |
| Cmd/Ctrl-click an item, including a favicon | Toggle that item and its children; focus it                                                                | Keep the current pane                           | None                                                      |
| Shift-click an item                         | Select a range in that pane; focus the endpoint                                                            | Keep the current pane                           | None                                                      |
| Right-click an item                         | Focus its action menu; keep selection if it includes the item, otherwise select that item and its children | Keep the current pane                           | None                                                      |
| Up/Down                                     | Move focus; replace selection in standard mode or keep it in multi-select mode                             | Show the focused window when navigating windows | None                                                      |
| Left/Right                                  | Move focus between windows and tabs; use the same selection rules as Up/Down                               | Keep the current pane                           | None                                                      |
| Space                                       | Enter multi-select mode, then toggle items; a selected parent's child can be deselected directly           | Keep the current pane                           | None                                                      |
| Enter                                       | Keep selection                                                                                             | Show a focused window's tabs                    | Activate a tab or window; toggle a group's collapse state |
| Escape                                      | Dismiss open menus first; otherwise clear selection across all windows                                     | Keep the current pane                           | None                                                      |

Use `Cmd/Ctrl+A` to select all items in the focused pane and `Shift+Up/Down` to select a range. Arrow navigation to **New tab** or **New window** clears standard selection and preserves multi-selection. Moving keyboard focus into tabs collapses the expanded window sidebar in narrow panels.

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

Run `pnpm e2e` to build and run the headless browser workflows. Tab Manager selection, grouping, movement, keyboard focus, and sidebar animation use sample data through the [shared preview mock](./scripts/preview/mock-chrome.js). One extension smoke test checks packaged pages, shared preferences, saved search, and live tab updates in an isolated profile with one normal browser window. The tests do not open desktop windows or take focus.

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
