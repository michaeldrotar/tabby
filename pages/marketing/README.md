# Tabby marketing site

Run `pnpm install --frozen-lockfile`, `pnpm exec turbo ready`, and `pnpm -F @extension/marketing dev` from the workspace root. Open [the marketing site](http://127.0.0.1:5183/). `pnpm -F @extension/marketing build` creates the standalone static site in this app’s `build` directory. `pnpm -F @extension/marketing preview` serves that build for local review.

The single page introduces Tab Manager, unified search, bulk actions, and personalization, and links to [Tabby on the Chrome Web Store](https://chromewebstore.google.com/detail/tabby/jjkakicjobpalhifpeaggabpgdllmmob). The [showcase](src/showcase.ts) supplies deterministic sample windows, tabs, groups, bookmarks, history, and recently closed results to the same product experiences used by the extension. The demo works entirely in memory.

Screenshots, the silent walkthrough, its captions, and the mascot are local [static assets](public/). Capture [Tab Manager](http://127.0.0.1:5183/?capture=manager) at 440 × 540 and [Search](http://127.0.0.1:5183/?capture=search) at 440 × 480. Record the [guided showcase](http://127.0.0.1:5183/?capture=tour) at 440 × 640 by clicking Play showcase. Its checkpoints and captions cover batch cleanup, search, and a custom theme. Refreshing restores the capture scene.

Run `pnpm test` for showcase coverage and `pnpm test:workbench` for browser workflows. For manual review, check desktop and 375px widths, explore each feature, search for “design”, select several tabs with Shift-click, change appearance, play/pause/seek/rewind the showcase, reset the sample browser, and play the captioned video. The sample data is set up automatically. Production deployment is an explicit release action coordinated with the published extension.
