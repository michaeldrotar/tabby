# Tabby – Agent Instructions

Tabby is a Chrome extension for tab management and search. This file gives agents persistent context. Prefer **retrieval-led reasoning**: read the listed docs and skills when working on Chrome extension or React code instead of relying only on pre-training.

---

## Project overview

- **Product:** Chrome extension (Manifest V3); cat-friendly tab management and omnibar search.
- **Repo:** pnpm monorepo with Turborepo. React 19, TypeScript 5, Vite 7, Tailwind, TanStack Query, Zustand.
- **Structure:** `chrome-extension/` (background + manifest), `pages/` (UI entry points: tab-manager, omnibar-overlay, options, etc.), `packages/` (shared `@extension/*` libs: ui, chrome, storage, shared, i18n, vite-config, env).

---

## Commands (use pnpm scripts only)

Never invoke `turbo` or other tools directly; use root `package.json` scripts so env (e.g. `set-global-env`) is applied.

| Command           | When to use                                            |
| ----------------- | ------------------------------------------------------ |
| `pnpm dev`        | Start dev server (only when user asks)                 |
| `pnpm build`      | Production build (only when asked)                     |
| `pnpm type-check` | After TypeScript changes                               |
| `pnpm lint:fix`   | Lint; fix auto-fixable issues                          |
| `pnpm format`     | Format code                                            |
| `pnpm test`       | Run Vitest (when asked or when changing tests)         |
| `pnpm zip`        | Build + create distributable zip (only when user asks) |

Do not run `pnpm dev`, `pnpm build`, `pnpm zip`, or `pnpm test` unless the user requests it.

---

## Where to find detailed guidance (listing)

Read the following when they apply to the files or task you’re working on.

**React / Next.js performance (Vercel best practices):**

When writing, reviewing, or refactoring React (or Next.js–style) code—components, data fetching, re-renders, bundle size—use the project skill:

- **Index and when to use:** [.agents/skills/vercel-react-best-practices/SKILL.md](.agents/skills/vercel-react-best-practices/SKILL.md)
- **Full guide (all rules expanded):** [.agents/skills/vercel-react-best-practices/AGENTS.md](.agents/skills/vercel-react-best-practices/AGENTS.md)
- **Per-rule files:** [.agents/skills/vercel-react-best-practices/rules/](.agents/skills/vercel-react-best-practices/rules/) (e.g. `rerender-defer-reads.md`)

---

## Conventions (summary)

- Functional React components; TypeScript strict; Tailwind for styling.
- Import from `@extension/*` packages (e.g. `@extension/ui`, `@extension/chrome`, `@extension/storage`). Use `workspace:*` in package.json.
- Chrome extension: manifest from `chrome-extension/manifest.ts`; background in `chrome-extension/src/background/index.ts`; use `activeTab`, not persistent content scripts; use `@extension/storage` instead of raw `chrome.storage`.
- Before editing code, identify and read all applicable instruction files from the table above; then follow those guidelines.
