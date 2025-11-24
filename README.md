# Tabby

Tabby is a Chrome extension built with React, Vite, and Tailwind CSS.

## Features

- **Modern Tech Stack**: Built with React 19, Vite, and TypeScript.
- **Monorepo Structure**: Organized using Turbo and pnpm workspaces.
- **Styling**: Tailwind CSS for rapid UI development.
- **Testing**: End-to-end testing with Vitest.

## Features

### 🔍 Universal Search

Instantly find any tab across all your open windows.

- **Overlay Mode**: Press `Cmd+E` (Mac) or `Ctrl+E` (Windows) to open a spotlight-like search bar on top of your current page.
- **Smart Navigation**: Jump to tabs, or open results in new tabs/windows.

### 🗂️ Window & Tab Management

The Side Panel (`Cmd+Shift+E` / `Ctrl+Shift+E`) gives you a command center for your browser session.

- **Multi-Window View**: See all your open windows as a list or grid.
- **Tab Organization**: Drill down into specific windows to manage their tabs.
- **Drag & Drop**: (Coming Soon) Reorganize tabs between windows.

### ⌨️ Keyboard Shortcuts

| Command          | Mac                   | Windows                | Description                                 |
| :--------------- | :-------------------- | :--------------------- | :------------------------------------------ |
| **Quick Search** | `Cmd` + `E`           | `Ctrl` + `E`           | Open the search overlay on the current page |
| **Side Panel**   | `Cmd` + `Shift` + `E` | `Ctrl` + `Shift` + `E` | Open the management sidebar                 |
| **Panel Search** | `Cmd` + `K`           | `Ctrl` + `K`           | Open search within the side panel           |
| **Close**        | `Esc`                 | `Esc`                  | Close search or side panel                  |

## 🤖 Built with AI

This project is a testament to the power of AI-assisted development. It was built in collaboration with **GitHub Copilot**, leveraging advanced capabilities to:

- **Architect the Monorepo**: Seamlessly integrating Chrome Extension APIs with a modern React/Vite workspace.
- **Generate Complex Logic**: Handling state management for multi-window synchronization and tab tracking.
- **Accelerate UI Development**: Rapidly prototyping and refining the Tailwind CSS interface.

## Getting Started

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

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=michaeldrotar/tabby&type=Date)](https://star-history.com/#michaeldrotar/tabby&Date)

## License

MIT © [Michael Drotar](https://github.com/michaeldrotar)
