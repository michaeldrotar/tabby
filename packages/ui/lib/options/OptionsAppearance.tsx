import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../Select'
import {
  accentSwatchByPalette,
  neutralSwatchByPalette,
  THEME_ACCENT_PALETTES,
  THEME_NEUTRAL_PALETTES,
} from '../theme-colors'
import { cn } from '../utils/cn'
import { ThemeModeChoices } from './ThemeModeChoices'
import type { OptionsControlBindings, OptionsProps } from './Options'
import type { ThemeAccentPalette, ThemeNeutralPalette } from '@extension/core'

const PaletteSelect = ({
  label,
  value,
  palettes,
  swatches,
  control,
  onChange,
}: {
  label: string
  value: string
  palettes: readonly string[]
  swatches: Record<string, string>
  control: ReturnType<OptionsControlBindings>
  onChange: (value: string) => void
}) => (
  <fieldset className="min-w-0">
    <legend className="text-foreground mb-2 text-sm font-medium">
      {label}
    </legend>
    <Select {...control} value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-full">
        <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
      </SelectTrigger>
      <SelectContent>
        {palettes.map((palette) => (
          <SelectItem key={palette} value={palette}>
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn('h-3.5 w-3.5 rounded-sm', swatches[palette])}
              />
              <span className="capitalize">{palette}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </fieldset>
)

export const OptionsAppearance = ({
  preferences,
  activeThemeMode,
  onPreferenceChange,
  randomizeColors,
  controlProps,
}: Pick<
  OptionsProps,
  'preferences' | 'activeThemeMode' | 'onPreferenceChange' | 'randomizeColors'
> & { controlProps: OptionsControlBindings }) => {
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
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-foreground font-medium">Colors</h3>
              <p className="text-muted text-sm">
                Choose your background, text, and accent. Highlights adapt to
                light and dark mode.
              </p>
            </div>
            <button
              type="button"
              onClick={randomizeColors}
              className={cn(
                `
                  bg-input text-foreground flex-shrink-0 rounded-lg px-3 py-2
                  text-sm font-medium transition-colors
                  hover:bg-input/70
                  focus-visible:ring-accent focus-visible:ring-offset-background
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-offset-2
                `,
              )}
            >
              Randomize colors
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div
              className={`
                grid gap-4
                group-data-[wide=true]/options:grid-cols-3
              `}
            >
              <PaletteSelect
                label="Background"
                value={activeThemeBackground}
                palettes={neutralPalettes}
                swatches={neutralSwatchByPalette}
                control={controlProps('background')}
                onChange={(value) =>
                  onPreferenceChange(
                    activeThemeMode === 'light'
                      ? { themeLightBackground: value as ThemeNeutralPalette }
                      : { themeDarkBackground: value as ThemeNeutralPalette },
                  )
                }
              />
              <PaletteSelect
                label="Foreground"
                value={activeThemeForeground}
                palettes={neutralPalettes}
                swatches={neutralSwatchByPalette}
                control={controlProps('foreground')}
                onChange={(value) =>
                  onPreferenceChange(
                    activeThemeMode === 'light'
                      ? { themeLightForeground: value as ThemeNeutralPalette }
                      : { themeDarkForeground: value as ThemeNeutralPalette },
                  )
                }
              />
              <PaletteSelect
                label="Accent"
                value={activeThemeAccent}
                palettes={accentPalettes}
                swatches={accentSwatchByPalette}
                control={controlProps('accent')}
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
      </div>
    </section>
  )
}
