# Agent Workflow

This is the approved workflow for the repository. `main` is the integration branch for accepted work. Apply the branch and release rules below.

In a worktree, if any tool or server's default port is already in use, use a different available port without asking for confirmation.

## Skill guidance

- Use the [Chrome Extensions skill](./.agents/skills/chrome-extensions/SKILL.md) and its references for Chrome extension implementation and Chrome Web Store publishing guidance. Its guidance takes precedence over conflicting project, React, and security guidance on those subjects.
- Use sentence case for interface headings, buttons, and labels, including when applying the [Web Design Guidelines skill](./.agents/skills/web-design-guidelines/SKILL.md).
- Close tabs and windows and reset preferences directly, without confirmation dialogs.
- Apply React and security guidance within the project's package and resource boundaries. Extension storage, content security policy, and sandboxed code execution follow the Chrome Extensions skill.
- Deliver skill review findings using the project's review rules: provide clickable source links and contextual draft PR comments. Complete fixes already authorized by the user's request; request a new decision only for work outside that scope.
- Write pull request descriptions as brief prose explaining the user benefit, with issue-closing references when applicable.
- Treat each Surface as an embedded product instance. Scope controls, themes, motion, and accessibility to that instance. Keep search view state in injected resources; only a user-selected web search puts a query in a destination URL.

## Issues

- Create or update GitHub issues when the user asks. Include the problem, desired outcome, acceptance criteria, and expected tests or release-note impact.
- Have a separate agent review new issue drafts for clarity before using them as implementation tasks.
- Do not keep plans in the repository. Use the issue and pull request for durable task context.

## Feature Work

- Start feature branches from `main` and open pull requests to `main`.
- Keep `main` buildable and green. CI checks lint, formatting, type checking, unit tests, headless browser workflows, and the production build. Commits have no lint or formatting hooks.
- Versioned release notes cover only user-facing changes to the Tabby browser extension. For those changes, update the active versioned release-notes file directly in the pull request. Name the file to match the release title, using a lowercase hyphenated slug (for example, `product/releases/v1.3.0-batch-actions-and-smarter-search.md`), and rename it if the title changes. Under **What's New**, add one concise entry with a descriptive subheading for each user-facing difference in the extension compared with the previous published release. Release notes describe the net result: omit work added and later removed if the released extension is back to its previous state, and do not describe intermediate changes made during development. For changes with no user-facing impact on the extension, state in the pull request that no extension release note is needed. See [RELEASE.md](./RELEASE.md#writing-release-notes) for scope.
- Add or update tests and, when relevant, documentation, product demos, and marketing-site content. Do not add a duplicate minor-release note for a fix already documented in its patch release.
- When a release changes a promotional component visually, recapture its corresponding image and update the checked-in promotional asset.
- For changes affecting the Chrome Web Store listing, permissions, privacy, screenshots, or version history, maintain `CHROMEWEBSTORE.md` according to the Chrome Extensions skill and [RELEASE.md](./RELEASE.md).
- Do not build or upload release artifacts during ordinary feature work. Use `pnpm zip` for a requested release.

## Local UI Previews

- Install dependencies in the worktree with `pnpm install --frozen-lockfile`. Run `pnpm preview` inside the agent thread/harness and leave it running for the user. It builds the current branch, serves the full Tab Manager with sample Chrome data, and prints the preview URL. The default port is automatically chosen; use `pnpm preview --port 5175` for a specific port.
- For Tab Manager visual work, open the printed `/tab-manager/index.html` URL in the harness's collaborative browser. Use its native preview tools when available, starting with `preview_status` and then `preview_open` if needed. Check a sidebar-sized viewport such as 480 × 640 and the narrow layout when relevant. Share the working URL and a screenshot or recording of the actual UI.
- Sample windows, tabs, groups, and preferences live in [`scripts/preview/browser-data.json`](./scripts/preview/browser-data.json). Pass `--fixture path/to/browser-data.json` to use task-specific sample data. Refreshing resets the preview to the fixture; rebuild and restart after application source changes.
- Keep simulations at the Chrome API boundary in [`scripts/preview/mock-chrome.js`](./scripts/preview/mock-chrome.js). Extend the shared fixture or mock when a task needs another interaction, and add focused coverage in [`scripts/preview/preview.spec.mjs`](./scripts/preview/preview.spec.mjs). Keep the application components, stores, styling, and animations real.
- Search and Settings buttons are inactive in the preview. Use the preview for manual UI checks and visual review. Use the headless extension smoke test for packaged extension integration.

## E2E Testing

- Run browser workflows headlessly by default. Keep one small extension smoke test for packaged entry points, shared preferences, saved search, and live tab updates. It uses an isolated profile and one normal browser window.
- Test Tab Manager workflows with fixture data through the shared preview Chrome API boundary. Keep application components, stores, styling, animations, and notifications real. Use the memory resources for component and performance tests.
- Use browser tests for native keyboard focus, layout, animation, and complete product workflows. Test command planning, API adapter mapping, and failure handling with unit tests; trust Chrome's implementation of its APIs.
- Prefer one complete workflow for related interactions, verifying visible results, action labels and counts, selection counts, and a meaningful final state. Add another workflow only for a meaningfully different starting state or outcome.
- Use large fixtures for performance coverage. Check render counts and the rows affected by an update in component tests; headless browser workflows cover layout and interaction with large datasets.

## Review and Merge

- The implementation agent must not review its own work. Ask a different agent, with fresh context, to review the issue criteria, diff, tests, release notes, and relevant docs.
- Reviewers should report important, actionable findings. Suggestions that do not block correctness or user value should not hold the pull request.
- The implementation agent fixes blocking findings. Use a fresh reviewer for each re-review. Merge when both workflow checks pass and no blocking findings remain.
- When the user asks you to implement or complete an issue, merge after those conditions are met. Link the issue with `Closes #N` so GitHub closes it on the merge to `main`.

## Patch Releases

- A patch release uses a temporary branch named for its version, such as `hotfix/v1.2.1`, created from the latest published tag, such as `v1.2.0`. It may collect multiple fixes before release.
- Fix PRs target that version-specific branch and update its patch-version release-notes file. Tag the reviewed patch commit, then forward-port each fix to `main` in a separately reviewed PR. Preserve `main`'s active version and release notes; do not repeat the patch note in the next minor release.
- Close the issue after the patch fix and its forward-port are merged.

## Release and Publishing Actions

- Release actions are user-triggered. CI and ordinary merges must not tag, package, upload, submit, or publish a release.
- Follow [RELEASE.md](./RELEASE.md) for versioning and packaging. Follow the Chrome Extensions skill for Chrome Web Store documentation and submission readiness. Never put store credentials in the repository.
- If the user explicitly asks to submit a release and publish it once accepted, that instruction authorizes the agent to monitor the Chrome Web Store review status and publish after acceptance.
- Preview marketing-site changes with their pull requests and deploy production as an explicit release action, coordinated with the published extension.
