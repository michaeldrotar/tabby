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
When writing, reviewing, or refactoring React (or Next.js–style) code—components, data fetching, re-renders, bundle size.

- **Index and when to use:** [.agents/skills/vercel-react-best-practices/SKILL.md](.agents/skills/vercel-react-best-practices/SKILL.md)
- **Full guide (all rules expanded):** [.agents/skills/vercel-react-best-practices/AGENTS.md](.agents/skills/vercel-react-best-practices/AGENTS.md)
- **Per-rule files:** [.agents/skills/vercel-react-best-practices/rules/](.agents/skills/vercel-react-best-practices/rules/)

**React composition patterns:**
When refactoring components with boolean prop proliferation, building component libraries, or designing reusable APIs (compound components, render props, context, React 19 APIs).

- **Index and when to use:** [.agents/skills/vercel-composition-patterns/SKILL.md](.agents/skills/vercel-composition-patterns/SKILL.md)
- **Full guide:** [.agents/skills/vercel-composition-patterns/AGENTS.md](.agents/skills/vercel-composition-patterns/AGENTS.md)
- **Per-rule files:** [.agents/skills/vercel-composition-patterns/rules/](.agents/skills/vercel-composition-patterns/rules/)

**Web design guidelines:**
When reviewing UI for accessibility, auditing design/UX, or checking against web interface best practices.

- [.agents/skills/web-design-guidelines/SKILL.md](.agents/skills/web-design-guidelines/SKILL.md) (fetches latest guidelines from source; use for UI review tasks)

**Frontend design:**  
When building or styling web components, pages, or interfaces—distinctive aesthetics, typography, motion, layout. Use for net-new UI or major visual overhauls.

- [.agents/skills/frontend-design/SKILL.md](.agents/skills/frontend-design/SKILL.md)

**Vitest:**  
When writing tests, mocking, configuring coverage, or working with test filtering and fixtures.

- **Index and references:** [.agents/skills/vitest/SKILL.md](.agents/skills/vitest/SKILL.md)
- **Reference docs:** [.agents/skills/vitest/references/](.agents/skills/vitest/references/) (core-config, core-expect, features-mocking, etc.)

---

## Conventions (summary)

- Functional React components; TypeScript strict; Tailwind for styling.
- Import from `@extension/*` packages (e.g. `@extension/ui`, `@extension/chrome`, `@extension/storage`). Use `workspace:*` in package.json.
- Chrome extension: manifest from `chrome-extension/manifest.ts`; background in `chrome-extension/src/background/index.ts`; keep user interfaces in extension-owned surfaces instead of injecting into pages; use `@extension/storage` instead of raw `chrome.storage`.
- Before editing code, read applicable skills and guidance from the listing above; then follow those guidelines.
