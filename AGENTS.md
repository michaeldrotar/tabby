# Agent Workflow

This is the approved workflow for the repository. `main` is the integration branch for accepted work. Apply the branch and release rules below.

## Issues

- Create or update GitHub issues when the user asks. Include the problem, desired outcome, acceptance criteria, and expected tests or release-note impact.
- Have a separate agent review new issue drafts for clarity before using them as implementation tasks.
- Do not keep plans in the repository. Use the issue and pull request for durable task context.

## Feature Work

- Start feature branches from `main` and open pull requests to `main`.
- Keep `main` buildable and green. CI checks lint, formatting, type checking, unit tests, Chrome-extension E2E tests, and the production build. Commits have no lint or formatting hooks.
- Update the active versioned release-notes file directly in the pull request. Name the file to match the release title, using a lowercase hyphenated slug (for example, `product/releases/v1.3.0-batch-actions-and-smarter-search.md`), and rename it if the title changes. Add one concise line under the right heading for each user-facing difference in the release compared with the previous published release. Release notes describe the net result: omit work added and later removed if the released product is back to its previous state, and do not describe intermediate changes made during development. If a change has no user-facing impact, say so in the pull request instead of adding a note.
- Add or update tests and, when relevant, documentation, product demos, and marketing-site content. Do not add a duplicate minor-release note for a fix already documented in its patch release.
- Do not build or upload release artifacts during ordinary feature work. Use `pnpm zip` for a requested release.

## Local UI Previews

- Install dependencies in the worktree with `pnpm install --frozen-lockfile`. Run `pnpm preview` inside the agent thread/harness and leave it running for the user. It builds the current branch, serves the full Tab Manager with sample Chrome data, and prints the preview URL. The default port is automatically chosen; use `pnpm preview --port 5175` for a specific port.
- For Tab Manager visual work, open the printed `/tab-manager/index.html` URL in the harness's collaborative browser. Use its native preview tools when available, starting with `preview_status` and then `preview_open` if needed. Check a sidebar-sized viewport such as 480 × 640 and the narrow layout when relevant. Share the working URL and a screenshot or recording of the actual UI.
- Sample windows, tabs, groups, and preferences live in [`scripts/preview/browser-data.json`](./scripts/preview/browser-data.json). Pass `--fixture path/to/browser-data.json` to use task-specific sample data. Refreshing resets the preview to the fixture; rebuild and restart after application source changes.
- Keep simulations at the Chrome API boundary in [`scripts/preview/mock-chrome.js`](./scripts/preview/mock-chrome.js). Extend the shared fixture or mock when a task needs another interaction, and add focused coverage in [`scripts/preview/preview.spec.mjs`](./scripts/preview/preview.spec.mjs). Keep the application components, stores, styling, and animations real.
- Search and Settings buttons are inactive in the preview. Use the preview for manual UI checks and visual review. Continue using the Chrome-extension E2E tests for actual browser API behavior.

## E2E Testing

- Structure E2E tests as complete user workflows with a realistic starting point and a meaningful end state. Use unit tests for isolated behavior that does not need a real browser.
- For one cohesive workflow, prefer one E2E test that follows the user through related actions and verifies visible results, action labels and counts, selection counts, and the final state. Avoid separate browser tests for each small interaction when they can be covered in that workflow.
- Add another E2E test when it starts from a meaningfully different supported state that changes the workflow or outcome, such as a substantially larger dataset. Do not test states the browser guarantees cannot occur, such as an extension starting with no window or tab.
- Keep browser setup proportional to the workflow. Create only the tabs and windows needed to exercise it; do not open many windows to repeat the same actions.

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
- Follow [RELEASE.md](./RELEASE.md) for versioning, packaging, and Chrome Web Store steps. Never put store credentials in the repository.
- If the user explicitly asks to submit a release and publish it once accepted, that instruction authorizes the agent to monitor the Chrome Web Store review status and publish after acceptance.
- Once a marketing site exists, preview it with its pull request and deploy production as an explicit release action, coordinated with the published extension.
