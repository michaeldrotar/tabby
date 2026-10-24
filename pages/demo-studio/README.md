# Tabby Demo Studio

Run `pnpm demo-studio` from the workspace root and open [Demo Studio](http://localhost:5180/). Vite starts on port 5180 and chooses the next free port when needed; use the URL it prints. Tab Manager, Omnibar, and Options use the same experiences as the extension, with deterministic memory resources and local assets. They require no browser permissions.

Demo Studio starts with one instance. Choose Explore, Guided, Still, or Anatomy from the sidebar, then choose Tab Manager, Omnibar, or Options from the stage. Enable a second instance to compare sharing; browser data and preferences each have independent sharing toggles, while view state can be shared only with browser data. Only Tab Manager has wide and narrow viewport controls; its wide view is capped at 800 pixels. Omnibar keeps its usual 640-pixel maximum width, and Options uses the full stage. The Appearance controls set the selected instance's light or dark theme and edit its Background, Foreground, and Accent palettes. Changing sharing or sample data resets the scene. Samples include a single window, a standard browser, many windows, 400 tabs, normal/incognito windows, loading, an error, and an empty browser. Ignore data commands from the sample workspace controls.

Explore runs as a fully interactive product. The guided demo uses scripted mouse and keyboard actions across Tab Manager, Omnibar, and Options, with named chapters, a progress slider, play/pause, previous/next, and rewind. Checkpoints restore browser data and ID allocation, selection and anchors, viewed windows, panels, notifications, scroll, search queries/results, preferences, host navigation, the clock, and pointer/focus cues. Anatomy filters the component list to the selected product and highlights that component in the live instance. Still Frame blocks product input and settles motion.

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

See [UI styling and leaf-component usage](../../packages/ui/README.md) and [the complete scene](src/scenario.ts) for host callbacks and independent sharing. `serializeDemoState` / `deserializeDemoState` preserve selection Sets in JSON; the guided demo's checkpoint has an explicit scene version. `[data-surface-ready="true"]` indicates that the container and portal destination have mounted and its width has been measured. For image capture, also wait for required assets and data to load.

Extension hosts use `ChromeTabbyProvider` from `@extension/providers/chrome` with the same experiences. Run `pnpm preview` to inspect the Tab Manager with sample data at the Chrome boundary; open the printed URL. Search and Settings are inactive in that preview.

## Theme lab

Open **Theme lab** in the studio header, or visit [Theme lab](http://localhost:5180/?theme-lab) on the running studio. It automatically audits all 2,754 light/dark, background, foreground, and accent combinations using the current rendered styles. Small batches keep the interface available while progress updates. Observations cover every combination and do not change with preview selections. Filter contrast failures, similar palettes, or weak state changes, then select an observation to load the exact colors and highlight its state. Similar-palette observations open both choices in Compare. Download the complete HTML or JSON report for review.

Choose Explore for the real tab rows, theme mode samples, and header controls. Click Light or Dark, or choose a named swatch from the background, foreground, and accent palettes. Every swatch has a visible color name. Tab moves between palettes. Left and Right select the previous or next color and wrap at either end. Up and Down select the nearest swatch in the adjacent visible row and stop at the first and last rows. Home and End select the first and last colors. The foreground, background, and selection-fill strips also show the rendered theme colors. Choose Compare for two independent palettes, or Tab manager, Search, or Settings from Preview to try the live product with those colors. URLs preserve colors and comparisons. The audit reruns automatically when stylesheets change, including development hot reload. **Recalculate audit** starts another complete check. Audits are cancellable and leave the displayed palettes unchanged.

The [analyzer](../../packages/ui/lib/theme-audit/analyze.ts) uses [browser measurements](../../packages/ui/lib/theme-audit/measure.ts) of the product components. Text checks use 4.5:1; focus rings, active tab borders, selected tab markers, and selected mode borders use 3:1 against adjacent surfaces. Foreground similarity compares primary and secondary text; backgrounds compare canvas, card, and header; accents compare action text, selection fills, and focus. A pair is similar only when every measured role is close. OKLab distance below 0.01 identifies near duplicates for review; below 0.02 lists subtle palette pairs as information. Below 0.035 flags weak hover changes. Repeated observations are grouped by the palettes that affect their colors, with the weakest measured example and an affected-combination count. These design thresholds are advisory and use a 0–1 lightness scale; the interface displays distances multiplied by 100. Hover differences do not have a blanket 3:1 requirement.

The [browser workflow](../../packages/e2e/demo-studio/theme-lab.spec.ts) runs the automatic audit in CI, checks that palette selections leave it unchanged, and verifies automatic recalculation after stylesheet changes. It exports HTML, JSON, and a narrow screenshot to the **theme-and-browser-reports** artifact. Any covered contrast failure fails the check; all 2,754 combinations must pass. Palette suggestions remain advisory.

For a manual check, open Observations and inspect a similar background pair, then compare dark Neutral and Stone foregrounds in Explore. Switch one preview between Light and Dark, return to Observations, and confirm the complete list is unchanged. Inspect light Slate/Teal focus rings and selected/active indicators, along with dark header hover. Refresh to confirm the selected palettes remain selected. Edit a theme color in the shared stylesheet and confirm the audit updates automatically and newly failing combinations appear with an Inspect link. Download both reports, try a cancelled recalculation, and check a 375-pixel viewport. All browser data is supplied by the studio fixtures.

## Verification

Run `pnpm test:demo-studio` after `pnpm exec turbo ready` for the web workflows. The ordinary unit, extension E2E, type-check, lint, and build commands cover the workspace. Server rendering is tested without Chrome or browser globals.

For manual review, select each product and inspect its anatomy list. Enable a second instance and confirm view-state sharing is disabled until browser data is shared. Change the selected instance's theme, background, and foreground from Appearance. Confirm viewport controls appear for Tab Manager only, and compare its capped wide view with Omnibar's fixed maximum width. Select and close tabs, switch windows, use group/action panels, search via keyboard and mouse, and change preferences in Options. Try the 400-tab and normal/incognito samples. Play, pause, seek across all three products, move backward, and rewind. In Explore, scroll within the product surface and continue scrolling at its top and bottom to move the page. Review sidebar widths, then capture a Still Frame.
