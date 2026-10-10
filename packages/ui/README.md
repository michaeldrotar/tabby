# Tabby UI

This package contains reusable presentation components. Browser data, preferences, clocks, navigation, and command execution are supplied by their hosts. The components run with Chrome resources or memory resources through the same application layer.

The main interfaces are [TabManager](lib/tab-manager/TabManager.tsx), [Omnibar](lib/omnibar/Omnibar.tsx), and [Options](lib/options/Options.tsx). Each accepts display data and callbacks. [Surface](lib/Surface.tsx) owns the theme, container dimensions, input policy, motion policy, unique IDs, and portal destination for one mounted instance.

## Styling

Add `@extension/ui` as a workspace dependency and include its classes in the consuming application's Tailwind configuration:

```ts
import { createTailwindConfig } from '@extension/ui/create-tailwind-config'
import { uiTailwindConfig } from '@extension/ui/ui-tailwind-config'

export default createTailwindConfig(uiTailwindConfig, {
  content: ['index.html', 'src/**/*.{ts,tsx}'],
})
```

Import the base stylesheet:

```css
@import '@extension/ui/base.css';
```

Give each product a sized container. Themes and portals remain inside its Surface, allowing multiple themes on one page:

```tsx
import { Surface } from '@extension/ui/Surface'
import { TabManager } from '@extension/ui/tab-manager/TabManager'
import type { TabManagerProps } from '@extension/ui/tab-manager/TabManager'

export const ManagerFrame = (props: TabManagerProps) => (
  <div style={{ width: 480, height: 640 }}>
    <Surface theme="dark">
      <TabManager {...props} />
    </Surface>
  </div>
)
```

Use `palette` for preference-driven background, foreground, accent, and strength values. [PreferenceSurface](../app/lib/PreferenceSurface.tsx) subscribes to an injected preference resource and applies those values.

## Interaction and motion

- `inputMode="live"` accepts ordinary mouse, keyboard, and scroll input.
- `inputMode="scripted"` blocks real input. The host changes controlled component state to play or restore a frame.
- `inputMode="static"` blocks input and settles motion for a still frame.
- `motion="system"` follows the user's reduced-motion setting; `full` and `reduced` explicitly select the presentation policy.

Script playback controls belong outside the blocked product Surface. Application views hold restorable query, selection, focus cues, menus, and scroll positions. Browser commands and persistence belong to injected resources, rather than UI callbacks calling platform APIs directly.

## Development

Run `pnpm workbench` from the repository root to inspect Tab Manager, Omnibar, and Options with deterministic sample data in the [product workbench](../../pages/workbench/README.md).

The UI TypeScript configuration excludes Chrome ambient types. Lint prohibits Chrome and storage imports throughout this package. Keep new components data-driven and supply image URLs, timestamps, translated labels, and event callbacks explicitly.
