# Tabby marketing

Run `pnpm marketing` from the workspace root. The local app serves three single-page designs:

- [Companion](http://localhost:5182/companion): a friendly tab companion with a live product introduction.
- [Focus](http://localhost:5182/focus): a search-first workspace with a dark palette and keyboard shortcuts.
- [Playground](http://localhost:5182/playground): a colorful tour through projects, search, batch actions, and personalization.

Two unlinked feedback pages are available by direct path:

- [Promotional assets](http://localhost:5182/promotional-assets): the Web Store screenshots and promo tiles.
- [Seasonal icons](http://localhost:5182/seasonal-icons): the holiday icon gallery.

All designs share [feature content](src/content.ts), checked-in promotional screenshots, and the real [product experiences](../../packages/app/lib/index.ts). [Demo resources](src/demo.ts) provide deterministic sample windows, tabs, bookmarks, history, and recently closed pages. Each demo owns its browser data, views, preferences, and playback. Refresh or Reset restores the samples; the app needs no Chrome permissions.

Use `pnpm test:marketing` for the headless browser workflows, `pnpm -F @extension/marketing type-check` for types, and `pnpm -F @extension/marketing build` for the standalone production app in `build/`.

## Hosting

The [Tabby marketing project](https://vercel.com/michael-drotars-projects/tabby-marketing) hosts the standalone app on Vercel. Its root directory is `pages/marketing`, with files outside that directory included so the shared workspace packages and promotional assets are available. Use Node.js 22.x. [vercel.json](vercel.json) defines the frozen dependency install, preparation of the marketing app's dependencies, Vite build, output directory, and design routes. The root URL opens Companion; `/companion`, `/focus`, and `/playground` select each design.

For a manual check, open each design at desktop and phone widths. Try a window in the rail, select multiple tabs and use More actions, search for “design,” switch themes and accents, and play/pause/seek the tour. Reset restores the demo. Check the video controls and captions and the Chrome Web Store links.

The [capture view](http://localhost:5182/?capture) provides the shared product tour at 960 × 720. Run `TABBY_CAPTURE_MARKETING=1 pnpm -F @extension/e2e exec playwright test --config marketing.config.ts tour.spec.ts` to record the checked tour and update [the video](public/media/tabby-tour.webm) and [its poster](public/media/tour-poster.png). [Captions](public/media/tabby-tour.vtt) describe its steps. Fonts are served locally with their licenses in [public/fonts](public/fonts).

Run the same browser workflows against a deployment with `TABBY_MARKETING_BASE_URL=https://your-deployment.vercel.app/ pnpm test:marketing`. The URL must end with a slash. Use `pnpm -F @extension/marketing exec vite preview --host 127.0.0.1 --port 5184` to serve the production build locally, then run the workflows with `TABBY_MARKETING_BASE_URL=http://127.0.0.1:5184/`.
