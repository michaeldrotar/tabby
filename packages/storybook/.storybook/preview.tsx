import './storybook.css'
import {
  THEME_ACCENT_PALETTES,
  THEME_ACCENT_STRENGTH_OPTIONS,
  THEME_NEUTRAL_PALETTES,
} from '@extension/ui/theme-colors'
import { useEffect } from 'react'
import type {
  ThemeAccentPalette,
  ThemeNeutralPalette,
} from '@extension/ui/theme-colors'
import type { Preview } from '@storybook/react'

type ResolvedThemeMode = 'light' | 'dark'

const neutralPalettes = THEME_NEUTRAL_PALETTES
const accentPalettes = THEME_ACCENT_PALETTES
const accentStrengthOptions = THEME_ACCENT_STRENGTH_OPTIONS

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      disable: true,
    },
    options: {
      storySort: {
        order: ['Theme', '*'],
      },
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme Mode',
      description: 'Light or Dark mode',
      defaultValue: 'dark',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: false,
      },
    },
    themeBackground: {
      name: 'Background',
      description: 'Background color palette',
      defaultValue: 'slate',
      toolbar: {
        icon: 'paintbrush',
        items: neutralPalettes.map((palette) => ({
          value: palette,
          title: palette.charAt(0).toUpperCase() + palette.slice(1),
        })),
        dynamicTitle: true,
      },
    },
    themeForeground: {
      name: 'Foreground',
      description: 'Foreground/text color palette',
      defaultValue: 'zinc',
      toolbar: {
        icon: 'document',
        items: neutralPalettes.map((palette) => ({
          value: palette,
          title: palette.charAt(0).toUpperCase() + palette.slice(1),
        })),
        dynamicTitle: true,
      },
    },
    themeAccent: {
      name: 'Accent',
      description: 'Accent color palette',
      defaultValue: 'blue',
      toolbar: {
        icon: 'contrast',
        items: accentPalettes.map((palette) => ({
          value: palette,
          title: palette.charAt(0).toUpperCase() + palette.slice(1),
        })),
        dynamicTitle: true,
      },
    },
    accentStrength: {
      name: 'Accent Strength',
      description: 'Accent color intensity (10-50%)',
      defaultValue: 15,
      toolbar: {
        icon: 'circle',
        items: accentStrengthOptions.map((strength) => ({
          value: String(strength),
          title: `${strength}%`,
        })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'dark',
    themeBackground: 'slate',
    themeForeground: 'zinc',
    themeAccent: 'blue',
    accentStrength: '15',
  },
  decorators: [
    (Story, context) => {
      const rawTheme = context.globals.theme
      const rawBackground = context.globals.themeBackground
      const rawForeground = context.globals.themeForeground
      const rawAccent = context.globals.themeAccent
      const rawStrength = context.globals.accentStrength

      const theme = (
        rawTheme === '_reset' || !rawTheme ? 'dark' : rawTheme
      ) as ResolvedThemeMode
      const themeBackground = (
        rawBackground === '_reset' || !rawBackground ? 'slate' : rawBackground
      ) as ThemeNeutralPalette
      const themeForeground = (
        rawForeground === '_reset' || !rawForeground ? 'zinc' : rawForeground
      ) as ThemeNeutralPalette
      const themeAccent = (
        rawAccent === '_reset' || !rawAccent ? 'blue' : rawAccent
      ) as ThemeAccentPalette

      // Accent strength: prefer global control, then per-story parameter, then default
      const globalStrength =
        rawStrength === '_reset' || !rawStrength ? 15 : Number(rawStrength)
      const accentStrength =
        (context.parameters.accentStrength as number | undefined) ??
        globalStrength

      useEffect(() => {
        document.body.setAttribute('data-theme', theme)
        document.body.setAttribute('data-theme-background', themeBackground)
        document.body.setAttribute('data-theme-foreground', themeForeground)
        document.body.setAttribute('data-theme-accent', themeAccent)
        document.body.style.setProperty(
          '--accent-strength',
          String(accentStrength),
        )
      }, [theme, themeBackground, themeForeground, themeAccent, accentStrength])

      return (
        <div
          className={`
            bg-background text-foreground min-h-screen p-8 antialiased
          `}
        >
          <Story />
        </div>
      )
    },
  ],
}

export default preview
