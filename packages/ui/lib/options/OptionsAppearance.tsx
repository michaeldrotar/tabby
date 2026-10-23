import { PaletteChoices } from '../PaletteChoices'
import {
  accentSwatchByPalette,
  neutralSwatchByPalette,
  THEME_ACCENT_PALETTES,
  THEME_NEUTRAL_PALETTES,
} from '../theme-colors'
import { cn } from '../utils/cn'
import { ThemeModeChoices } from './ThemeModeChoices'
import type { OptionsProps } from './Options'
import type { ThemeAccentPalette, ThemeNeutralPalette } from '@extension/core'

export const OptionsAppearance = ({
  preferences,
  activeThemeMode,
  onPreferenceChange,
  randomizeColors,
}: Pick<
  OptionsProps,
  'preferences' | 'activeThemeMode' | 'onPreferenceChange' | 'randomizeColors'
>) => {
  const {
    theme,
    themeLightBackground,
    themeLightForeground,
    themeLightAccent,
    themeDarkBackground,
    themeDarkForeground,
    themeDarkAccent,
  } = preferences
  const activeThemeBackground =
    activeThemeMode === 'light' ? themeLightBackground : themeDarkBackground
  const activeThemeForeground =
    activeThemeMode === 'light' ? themeLightForeground : themeDarkForeground
  const activeThemeAccent =
    activeThemeMode === 'light' ? themeLightAccent : themeDarkAccent

  const neutralPalettes = THEME_NEUTRAL_PALETTES
  const accentPalettes = THEME_ACCENT_PALETTES

  return (
    <section className="mb-6">
      <h2 className="text-foreground mb-4 text-lg font-semibold">Appearance</h2>
      <div className={cn('rounded-lg border p-4', 'border-border bg-card')}>
        <div
          className={`
            flex flex-col gap-4
            group-data-[wide=true]/options:flex-row
            group-data-[wide=true]/options:items-center
            group-data-[wide=true]/options:justify-between
          `}
        >
          <div>
            <h3 className="text-foreground font-medium">Theme</h3>
            <p className="text-muted text-sm">
              Match your system appearance, or override it
            </p>
          </div>
          <ThemeModeChoices
            theme={theme}
            onChange={(theme) => onPreferenceChange({ theme })}
          />
        </div>

        <div className="border-border mt-4 border-t pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-foreground font-medium">
              {activeThemeMode === 'light' ? 'Light' : 'Dark'} mode colors
            </h3>
            <button
              type="button"
              onClick={randomizeColors}
              className={cn(
                `
                  text-foreground decoration-current/30 flex-shrink-0 rounded-md
                  px-2 py-1.5 text-xs font-medium underline underline-offset-4
                  focus-visible:ring-accent focus-visible:ring-offset-background
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-offset-2
                  hover:decoration-current
                `,
              )}
            >
              Randomize colors
            </button>
          </div>

          <div className="mt-6 space-y-6">
            <PaletteChoices
              label="Background"
              value={activeThemeBackground}
              palettes={neutralPalettes}
              swatches={neutralSwatchByPalette}
              onChange={(value) =>
                onPreferenceChange(
                  activeThemeMode === 'light'
                    ? { themeLightBackground: value as ThemeNeutralPalette }
                    : { themeDarkBackground: value as ThemeNeutralPalette },
                )
              }
            />
            <PaletteChoices
              label="Foreground"
              value={activeThemeForeground}
              palettes={neutralPalettes}
              swatches={neutralSwatchByPalette}
              onChange={(value) =>
                onPreferenceChange(
                  activeThemeMode === 'light'
                    ? { themeLightForeground: value as ThemeNeutralPalette }
                    : { themeDarkForeground: value as ThemeNeutralPalette },
                )
              }
            />
            <PaletteChoices
              label="Accent"
              value={activeThemeAccent}
              palettes={accentPalettes}
              swatches={accentSwatchByPalette}
              onChange={(value) =>
                onPreferenceChange(
                  activeThemeMode === 'light'
                    ? { themeLightAccent: value as ThemeAccentPalette }
                    : { themeDarkAccent: value as ThemeAccentPalette },
                )
              }
            />
          </div>
        </div>
      </div>
    </section>
  )
}
