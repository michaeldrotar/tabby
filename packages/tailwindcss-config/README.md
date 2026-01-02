# Tailwind CSS Config Package

This package provides the centralized Tailwind CSS configuration and theming system for the Tabby Chrome Extension.

## Overview

All Tailwind-related configuration is consolidated here:

- **Color token mappings** - Semantic color names that reference CSS variables
- **Dark mode strategy** - How the extension switches between light/dark themes
- **CSS variables** - The actual HSL color values for all theme presets
- **Merge utility** - Helper for combining Tailwind configs (rarely needed with presets)

## Usage in Pages

### Basic Setup

```typescript
// pages/your-page/tailwind.config.ts
import { createTailwindConfig } from '@extension/tailwindcss-config/create-tailwind-config'

export default createTailwindConfig({
  content: ['index.html', 'src/**/*.{ts,tsx}'],
})
```

```css
/* pages/your-page/src/index.css */
@import '@extension/tailwindcss-config/base.css';
```

### With UI and Omnibar Packages

```typescript
// pages/your-page/tailwind.config.ts
import { omnibarTailwindConfig } from '@extension/omnibar/omnibar-tailwind-config'
import { createTailwindConfig } from '@extension/tailwindcss-config/create-tailwind-config'
import { uiTailwindConfig } from '@extension/ui/ui-tailwind-config'

export default createTailwindConfig(uiTailwindConfig, omnibarTailwindConfig, {
  content: ['index.html', 'src/**/*.{ts,tsx}'],
})
```

## What's Inside

### tailwind.config.ts

The main Tailwind configuration with:

- Empty `content` array (pages specify their own content)
- Dark mode variant strategy
- Extended color theme using CSS variable references
- Plugin array (empty, can be extended)

### base.css

All CSS variable definitions for the theming system:

- Light/dark mode base variables
- Background color presets (slate, gray, zinc, neutral, stone)
- Foreground color presets (slate, gray, zinc, neutral, stone)
- Accent color presets (red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose)
- Base body and element styles

### merge.ts

Utility for merging multiple Tailwind configs using deepmerge. Generally not needed when using the preset system correctly.

## Modifying Theme

### Adding New Colors

Edit `tailwind.config.ts` to add new color tokens:

```typescript
colors: {
  background: 'hsl(from var(--background) h s l / <alpha-value>)',
  // Add new color token:
  'my-color': 'hsl(from var(--my-color) h s l / <alpha-value>)',
}
```

Then add the CSS variable in `base.css`:

```css
[data-theme='light'] {
  --my-color: theme(colors.blue.500);
}

[data-theme='dark'] {
  --my-color: theme(colors.blue.400);
}
```

### Adding New Theme Presets

Add new data attribute combinations in `base.css`:

```css
[data-theme='light'][data-theme-background='custom'] {
  --background: theme(colors.custom.100);
  /* ... */
}
```
