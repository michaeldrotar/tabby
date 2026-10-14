# Tabby marketing

Run `pnpm marketing` from the workspace root. The [homepage](http://localhost:5182/) uses the Companion style with a labeled interactive demo, separate tabs/search/settings and color controls, and a rotating switch to the product video with music and captions. Reduced-motion preferences use an instant switch. Three single-page design previews are also available:

- [Companion](http://localhost:5182/companion): a friendly tab companion with a live product introduction.
- [Focus](http://localhost:5182/focus): a search-first workspace with a dark palette and keyboard shortcuts.
- [Playground](http://localhost:5182/playground): a colorful tour through projects, search, batch actions, and personalization.

All designs share [feature content](src/content.ts), checked-in promotional screenshots, and the real [product experiences](../../packages/app/lib/index.ts). [Demo resources](src/demo.ts) provide deterministic sample windows, tabs, bookmarks, history, and recently closed pages. Each demo owns its browser data, views, preferences, and playback. Refresh or Reset restores the samples; the app needs no Chrome permissions.

Use `pnpm test:marketing` for the headless browser workflows, `pnpm -F @extension/marketing type-check` for types, and `pnpm -F @extension/marketing build` for the standalone production app in `build/`.

## Hosting

The [Tabby marketing project](https://vercel.com/michael-drotars-projects/tabby-marketing) hosts the standalone app on Vercel. Its root directory is `pages/marketing`, with files outside that directory included so the shared workspace packages and promotional assets are available. Use Node.js 22.x. [vercel.json](vercel.json) defines the frozen dependency install, preparation of the marketing app's dependencies, Vite build, output directory, and design routes. The root URL opens the homepage; `/companion`, `/focus`, and `/playground` select each design preview.

For a manual check, open the homepage and each design at desktop and phone widths. On the homepage, switch between the hero demo and video; the sign, content, and switch text rotate together, and returning to the demo keeps your sample changes and pauses the video. Check the instant switch with reduced motion enabled. Try a window in the rail, select multiple tabs and use More actions, search for “design,” and switch themes and accents. The design previews also offer guided-tour playback controls. Reset restores the demo. Videos start muted; enable music with the player's volume control and check that your choice persists when switching between the hero demo and video. Check captions and the Chrome Web Store links.

The [capture view](http://localhost:5182/?capture) provides the shared product tour at 960 × 720. With FFmpeg installed, run `TABBY_CAPTURE_MARKETING=1 pnpm -F @extension/e2e exec playwright test --config marketing.config.ts tour.spec.ts` to record the checked tour and update [the video](public/media/tabby-tour.webm) and [its poster](public/media/tour-poster.png). The capture combines the recording with [the soundtrack](public/media/tabby-tour-audio.ogg), which contains original instrumental music. Set `FFMPEG_PATH` to use a specific executable. [Captions](public/media/tabby-tour.vtt) describe its steps. Fonts are served locally with their licenses in [public/fonts](public/fonts).

Run the same browser workflows against a deployment with `TABBY_MARKETING_BASE_URL=https://your-deployment.vercel.app/ pnpm test:marketing`. The URL must end with a slash. Use `pnpm -F @extension/marketing exec vite preview --host 127.0.0.1 --port 5184` to serve the production build locally, then run the workflows with `TABBY_MARKETING_BASE_URL=http://127.0.0.1:5184/`.
