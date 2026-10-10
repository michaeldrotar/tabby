# Product workbench

Run `pnpm workbench` from the workspace root and open [the workbench](http://localhost:5180/). Tab Manager, Omnibar, and Options use the same experiences as the extension, with deterministic memory resources and local assets. They require no browser permissions.

Choose separate data and views, shared data with separate views, or shared data and view state. Preference sharing is independent. Each Surface can use its own theme or follow its preference resource. Changing sharing or sample data resets the scene. Samples include a single window, a standard browser, many windows, 400 tabs, normal/incognito windows, loading, an error, and an empty browser. The command policy can apply actions to memory or explicitly ignore them.

The tutorial provides named steps, a progress slider, play/pause, previous/next, and rewind. Product input stays blocked while playing and paused. Checkpoints restore browser data and ID allocation, selection and anchors, viewed windows, panels, notifications, scroll, search queries/results, preferences, host navigation, the clock, and pointer/focus cues. Still Frame blocks product input and settles motion.

## Resource composition

`@extension/core` owns contracts and pure command, selection, search, and preference rules. `@extension/ui` owns presentation. `Surface` scopes theme, dimensions, portal destination, input, and motion. `@extension/app` connects injected resources and restorable view handles to the UI through one [TabbyProvider](../../packages/app/lib/TabbyProvider.tsx). `@extension/demo` supplies fixtures, scene presets, memory resources, scene serialization, and playback. `@extension/chrome` supplies injected Chrome resources. `@extension/providers` builds the shared provider contract for Chrome and memory hosts.

One provider supplies Tab Manager, Omnibar, and Options. Its resources are `backend`, `preferences`, `omnibar`, and `options`; `views` holds independent `tabManager`, `omnibar`, and `options` handles. `environment` supplies the clock, system theme, platform, and optional scheduling/randomness. `host` supplies navigation and clipboard capabilities. The base provider requires these resources and leaves their lifecycle to the caller.

Sharing a backend shares browser data. Sharing view handles also shares selection, panels, queries, and the viewed window. Physical DOM focus stays with the instance receiving input. Sharing a preference resource shares settings. [TabbySurface](../../packages/app/lib/TabbyProvider.tsx) derives appearance from the provider and accepts per-instance theme, input, and motion overrides.

```tsx
import {
  TabbySurface,
  TabManagerExperience,
  OmnibarExperience,
  OptionsExperience,
} from '@extension/app'
import { MemoryTabbyProvider } from '@extension/providers/memory'

const Demo = () => (
  <MemoryTabbyProvider scene="standard">
    <div style={{ width: 480, height: 640 }}>
      <TabbySurface theme="dark" inputMode="live">
        <TabManagerExperience />
      </TabbySurface>
    </div>
    <TabbySurface theme="light">
      <OmnibarExperience onDismiss={() => {}} />
    </TabbySurface>
    <TabbySurface>
      <OptionsExperience />
    </TabbySurface>
  </MemoryTabbyProvider>
)
```

Memory presets are `single-window`, `standard`, `many-windows`, `large`, `restricted`, `loading`, `error`, and `empty`. Change the `scene` prop to replace owned browser data and views. Unrelated preference and externally supplied handles stay independent. Supply `preferences` for initial settings, `commands="ignore"` to ignore data actions, and `overrides` for the important browser details:

```tsx
import { createFixtureBuilder } from '@extension/demo'

const fixtures = createFixtureBuilder({ seed: 'documentation' })
const overrides = {
  windows: [
    fixtures.generateWindow({
      tabs: [fixtures.generateTab({ title: 'Tabby' })],
    }),
  ],
}

const CustomDemo = () => (
  <MemoryTabbyProvider scene="single-window" overrides={overrides}>
    <TabbySurface inputMode="static">
      <TabManagerExperience />
    </TabbySurface>
  </MemoryTabbyProvider>
)
```

Pass existing handles through `resources` and `views` to share selected pieces. Injected handles stay under the caller's lifecycle control; the memory wrapper starts and disposes only resources it creates. `createMemoryTabbyData` also builds the complete data bundle for hosts that manage their own lifecycle and use the base provider directly.

See [UI styling and leaf-component usage](../../packages/ui/README.md) and [the complete scene](src/scenario.ts) for host callbacks and independent sharing. `serializeDemoState` / `deserializeDemoState` preserve selection Sets in JSON; the tutorial's checkpoint has an explicit scene version. `[data-surface-ready="true"]` indicates that the container and portal destination have mounted and its width has been measured. For image capture, also wait for required assets and data to load.

Extension hosts use `ChromeTabbyProvider` from `@extension/providers/chrome` with the same experiences. Run `pnpm preview` to inspect the Tab Manager with sample data at the Chrome boundary; open the printed URL. Search and Settings are inactive in that preview.

## Verification

Run `pnpm test:workbench` after `pnpm exec turbo ready` for the web workflows. The ordinary unit, extension E2E, type-check, lint, and build commands cover the workspace. Server rendering is tested without Chrome or browser globals.

For manual review, try all sharing choices with contrasting themes. Select and close tabs, switch windows, use group/action panels, search via keyboard and mouse, and change shared preferences in Options. Try the 400-tab and normal/incognito samples. Play, pause, seek across all three products, move backward, and rewind. Hover, click, type, and scroll over the paused product to confirm it stays still. Review sidebar widths, then capture a Still Frame.
