# Tabby marketing

Run `pnpm marketing` from the workspace root. The local app serves three single-page designs:

- [Companion](http://localhost:5182/companion): a friendly tab companion with a live product introduction.
- [Focus](http://localhost:5182/focus): a search-first workspace with a dark palette and keyboard shortcuts.
- [Playground](http://localhost:5182/playground): a colorful tour through projects, search, batch actions, and personalization.

All designs share [feature content](src/content.ts), checked-in promotional screenshots, and the real [product experiences](../../packages/app/lib/index.ts). [Demo resources](src/demo.ts) provide deterministic sample windows, tabs, bookmarks, history, and recently closed pages. Each demo owns its browser data, views, preferences, and playback. Refresh or Reset restores the samples; the app needs no Chrome permissions.

Use `pnpm test:marketing` for the headless browser workflows, `pnpm -F @extension/marketing type-check` for types, and `pnpm -F @extension/marketing build` for the standalone production app in `build/`.

## Domain hosting

Build with `pnpm -F @extension/marketing build --base /projects/tabby/` and copy the contents of `build/` into `public/projects/tabby/` in [the personal website repository](https://github.com/michaeldrotar/michaeldrotar.com). Replace the complete exported directory when updating it. Vite scopes scripts, images, fonts, and media to this base path. The website serves the same export at `/projects/tabby`, `/projects/tabby/companion`, `/projects/tabby/focus`, and `/projects/tabby/playground`; the pathname selects the design.

For a manual check, open each design at desktop and phone widths. Try a window in the rail, select multiple tabs and use More actions, search for “design,” switch themes and accents, and play/pause/seek the tour. Reset restores the demo. Check the video controls and captions and the Chrome Web Store links.

The [capture view](http://localhost:5182/?capture) provides the shared product tour at 960 × 720. Run `TABBY_CAPTURE_MARKETING=1 pnpm -F @extension/e2e exec playwright test --config marketing.config.ts tour.spec.ts` to record the checked tour and update [the video](public/media/tabby-tour.webm) and [its poster](public/media/tour-poster.png). [Captions](public/media/tabby-tour.vtt) describe its steps. Fonts are served locally with their licenses in [public/fonts](public/fonts).

Run the same browser workflows against a hosted export with `TABBY_MARKETING_BASE_URL=http://localhost:5183/projects/tabby/ pnpm test:marketing`. Set that URL to the public `/projects/tabby/` location to verify a deployment.
