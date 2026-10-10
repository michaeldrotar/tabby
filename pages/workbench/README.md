# Tab Manager workbench

Run `pnpm workbench` from the workspace root. Open [the workbench](http://localhost:5180/).
The page uses the reusable Tab Manager with deterministic sample browser data.

Choose separate data and views, shared data with separate views, or shared data
and view state. Preference sharing is independent; each surface can override its
theme. Changing sharing resets the sample scene. The interactive mode supports
selection, keyboard navigation, group collapse, window activation, creating
windows, and closing tabs or windows. Ignoring commands returns an honest ignored
outcome while leaving browser data unchanged.

The scripted tutorial has named steps, progress, play, pause, previous/next step,
and rewind controls. Product input stays blocked while playing and paused. Every
step restores browser data and ID allocation, selection and its anchors, viewed
window, menus, notices, scroll position, preferences, clock, and pointer/focus cues.
Still-frame mode disables product input and motion.

## Resource composition

`@extension/core` owns the browser, command and preference contracts and the pure
selection/batch algorithms. `@extension/ui/tab-manager/TabManager` accepts a view
model and emits semantic intents. `Surface` owns an instance's theme, size, portal
container, input mode and motion. `@extension/app` projects resources into that
model and handles the intents. It has no Chrome or storage imports.

The host creates and starts resources, then disposes them when the scene ends.
Sharing a backend shares browser data; sharing a view handle also shares selection,
panels and the viewed window. Actual DOM focus remains with the instance receiving
input. Sharing a preference resource shares settings.

```tsx
const fixtures = createFixtureBuilder({ seed: 'documentation', now: 1700000000000 })
const backend = new MemoryBackend(fixtures.generateScene({
  windows: [fixtures.generateWindow({
    tabs: [fixtures.generateTab({ title: 'Tabby' })],
  })],
}))
const preferences = createMemoryPreferences({ theme: 'light' })
const view = createTabManagerView()
await Promise.all([backend.start(), preferences.start()])

<TabbyProvider backend={backend} view={view} preferences={preferences}
  environment={{ now: () => 1700000000000, systemTheme: 'light' }}>
  <Surface theme="light" inputMode="live">
    <TabManagerExperience />
  </Surface>
</TabbyProvider>
```

The same experience accepts `createChromeBackend(chrome)` and
`createChromePreferences(chrome)` from `@extension/chrome`. To inspect that local
composition, run `CLI_CEB_ARCHITECTURE_PROOF=true pnpm preview`, then open the
printed Tab Manager URL with `?architecture=provider`. The flag defaults off.

## Verification

Run `pnpm test:workbench` after `pnpm exec turbo ready` for the browser workflow.
The normal unit, extension E2E, type-check, lint and build commands cover the
workspace. Sample data is created by the workbench; it needs no browser permissions.

For manual review, try all sharing choices with contrasting themes. Open a window
in one instance, select and close tabs, create a window, and change the accent with
preference sharing enabled. In scripted mode, play and pause, step to the action
menu and close action, then move backward and rewind. Hover, click, type and scroll
over the product while paused to verify it stays still. Check both a wide page and
a narrow viewport.
