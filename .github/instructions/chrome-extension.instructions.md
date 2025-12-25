# Chrome Extension Architecture

## Project Structure

**Tabby** follows a **modular Chrome Extension** architecture with distinct layers:

1. **`chrome-extension/`** - Background service worker, manifest generation
2. **`pages/`** - Individual UI entry points (omnibar-overlay, tab-manager, etc.)
3. **`packages/`** - Shared internal libraries with `@extension/*` namespace:
   - `@extension/ui` - Shared React components (Omnibar, TabList, etc.)
   - `@extension/chrome` - React hooks/utilities wrapping Chrome APIs with TanStack Query + Zustand
   - `@extension/storage` - Chrome storage abstractions (preferenceStorage)
   - `@extension/shared` - Common types, HOCs, and utilities
   - `@extension/i18n` - Internationalization utilities
   - `@extension/vite-config` - Shared Vite configuration (withPageConfig)
   - `@extension/tailwindcss-config` - Base Tailwind presets (extended via `withUI()`)
   - `@extension/env` - Environment variables and build flags

## Key Architectural Patterns

- Each page in `pages/` is a standalone Vite app with its own entry point and output directory
- Pages import from `@extension/*` packages using workspace protocol (`workspace:*`)
- Extension uses on-demand injection via `activeTab` permission, not persistent content scripts
- Background service worker handles keyboard commands and coordinates page injection

## Chrome Extension Specifics

- **Manifest:** Auto-generated from `chrome-extension/manifest.ts` (version synced from root package.json)
- **Background Worker:** Lives in `chrome-extension/src/background/index.ts`, handles commands and tab management
- **Content Injection:** Pages like omnibar-overlay are injected into iframes via `chrome.scripting.executeScript`
- **Permissions:** Uses `activeTab` (temporary access only when invoked), not persistent content scripts
- **Storage:** Use `@extension/storage` abstractions, not raw chrome.storage APIs

## Privacy & Security Principles

- **Local-first:** All processing happens on device, no external servers
- **Minimal permissions:** Use `activeTab` over `<all_urls>` to avoid persistent access
- **Sandboxed UI:** Extension UI injected in isolated iframes to protect from page scripts
