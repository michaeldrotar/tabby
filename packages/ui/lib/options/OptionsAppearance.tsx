import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../Select'
import { Slider } from '../Slider'
import { useSurfaceId } from '../Surface'
import { THEME_ACCENT_PALETTES, THEME_NEUTRAL_PALETTES } from '../theme-colors'
import { cn } from '../utils/cn'
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
      <SelectTrigger className="w-full">
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
  const themeModeId = useSurfaceId('theme-mode')
  const {
    theme,
    themeLightBackground,
    themeLightForeground,
    themeLightAccent,
    themeLightAccentStrength,
    themeDarkBackground,
    themeDarkForeground,
    themeDarkAccent,
    themeDarkAccentStrength,
  } = preferences
  const activeThemeBackground =
    activeThemeMode === 'light' ? themeLightBackground : themeDarkBackground
  const activeThemeForeground =
    activeThemeMode === 'light' ? themeLightForeground : themeDarkForeground
  const activeThemeAccent =
    activeThemeMode === 'light' ? themeLightAccent : themeDarkAccent

  const activeThemeAccentStrength =
    activeThemeMode === 'light'
      ? themeLightAccentStrength
      : themeDarkAccentStrength

  const neutralPalettes = THEME_NEUTRAL_PALETTES
  const accentPalettes = THEME_ACCENT_PALETTES

  const neutralSwatchByPalette = {
    slate: 'bg-slate-500',
    gray: 'bg-gray-500',
    zinc: 'bg-zinc-500',
    neutral: 'bg-neutral-500',
    stone: 'bg-stone-500',
  } satisfies Record<ThemeNeutralPalette, string>

  const accentSwatchByPalette = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    amber: 'bg-amber-500',
    yellow: 'bg-yellow-500',
    lime: 'bg-lime-500',
    green: 'bg-green-500',
    emerald: 'bg-emerald-500',
    teal: 'bg-teal-500',
    cyan: 'bg-cyan-500',
    sky: 'bg-sky-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    violet: 'bg-violet-500',
    purple: 'bg-purple-500',
    fuchsia: 'bg-fuchsia-500',
    pink: 'bg-pink-500',
    rose: 'bg-rose-500',
  } satisfies Record<ThemeAccentPalette, string>

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
          <fieldset className="flex shrink-0 items-center gap-2">
            <legend className="sr-only">Theme mode</legend>
            {(
              [
                { value: 'system' as const, label: 'System' },
                { value: 'light' as const, label: 'Light' },
                { value: 'dark' as const, label: 'Dark' },
              ] as const
            ).map((option) => {
              return (
                <label key={option.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name={themeModeId}
                    className="peer sr-only"
                    checked={theme === option.value}
                    onChange={() =>
                      onPreferenceChange({
                        theme: option.value,
                      })
                    }
                  />
                  <span
                    className={cn(
                      `
                        bg-input text-foreground inline-flex rounded-lg px-3
                        py-2 text-sm font-medium transition-colors
                        hover:bg-input/70
                        peer-checked:bg-accent/[calc(var(--accent-strength)*1%)]
                        peer-checked:text-foreground
                        peer-checked:hover:bg-accent/[calc((var(--accent-strength)+5)*1%)]
                        peer-focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                        peer-focus-visible:ring-offset-background
                        peer-focus-visible:ring-2
                        peer-focus-visible:ring-offset-2
                      `,
                    )}
                  >
                    {option.label}
                  </span>
                </label>
              )
            })}
          </fieldset>
        </div>

        <div className="border-border mt-4 border-t pt-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-foreground font-medium">Colors</h3>
              <p className="text-muted text-sm">
                Controls Tabby’s neutral palettes and accent across the UI
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
                  focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                  focus-visible:ring-offset-background
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

              <fieldset
                className={`
                  min-w-0
                  group-data-[wide=true]/options:col-span-3
                `}
              >
                <legend className="text-foreground mb-2 text-sm font-medium">
                  Accent strength
                </legend>
                <div className="flex items-center gap-4">
                  <Slider
                    aria-label="Accent strength"
                    value={[activeThemeAccentStrength]}
                    min={10}
                    max={50}
                    step={5}
                    onValueChange={(value) =>
                      onPreferenceChange({
                        ...(activeThemeMode === 'light'
                          ? {
                              themeLightAccentStrength:
                                value[0] ??
                                preferences.themeLightAccentStrength,
                            }
                          : {
                              themeDarkAccentStrength:
                                value[0] ?? preferences.themeDarkAccentStrength,
                            }),
                      })
                    }
                    className="flex-1"
                  />
                  <span
                    className={`
                      text-muted w-12 shrink-0 text-right text-sm tabular-nums
                    `}
                  >
                    {activeThemeAccentStrength}%
                  </span>
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
