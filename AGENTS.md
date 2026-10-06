# Agent Workflow

This is the intended workflow after the branch cutover. These instructions are staged on `next` for review; until the owner completes the cutover, follow the branch named in the task and do not retarget, rename, delete, or merge long-lived branches.

## Issues

- Create or update GitHub issues when the user asks. Include the problem, desired outcome, acceptance criteria, and expected tests or release-note impact.
- Have a separate agent review new issue drafts for clarity before using them as implementation tasks.
- Do not keep plans in the repository. Use the issue and pull request for durable task context.

## Feature Work

- After the branch cutover, start feature branches from `main` and open pull requests to `main`.
- Keep `main` buildable and green. CI checks lint, formatting, type checking, unit tests, Chrome-extension E2E tests, and the production build. Commits have no lint or formatting hooks.
- Update the active versioned release-notes file directly in the pull request. Add one concise line under the right heading. If a change has no user-facing impact, say so in the pull request instead of adding a note.
- Add or update tests and, when relevant, documentation, Storybook examples, and marketing-site content. Do not add a duplicate minor-release note for a fix already documented in its patch release.
- Do not build or upload release artifacts during ordinary feature work. Use `pnpm zip` for a requested release.

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
