import { useSurfaceId } from '../Surface'
import { THEME_MODE_OPTIONS } from '../theme-colors'
import { ThemeColorSettings } from '../ThemeColorSettings'
import { cn } from '../utils/cn'
import type { OptionsControlBindings, OptionsProps } from './Options'

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
  const { theme } = preferences

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
            {THEME_MODE_OPTIONS.map((option) => {
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

          <ThemeColorSettings
            preferences={preferences}
            activeThemeMode={activeThemeMode}
            onPreferenceChange={onPreferenceChange}
            controlProps={controlProps}
            className={`
              mt-4
              group-data-[wide=true]/options:grid-cols-3
            `}
          />
        </div>
      </div>
    </section>
  )
}
