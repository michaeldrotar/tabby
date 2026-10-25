import { curatedThemes, themeCollections } from '@extension/core'
import { cn } from '../utils/cn'
import { ThemeCard } from './ThemeCard'
import { ThemeModeChoices } from './ThemeModeChoices'
import type { OptionsProps } from './Options'

export const OptionsAppearance = ({
  preferences,
  activeThemeMode,
  onPreferenceChange,
}: Pick<
  OptionsProps,
  'preferences' | 'activeThemeMode' | 'onPreferenceChange'
>) => (
  <section className="mb-6">
    <h2 className="text-foreground mb-4 text-2xl font-semibold">Appearance</h2>
    <div className={cn('rounded-lg border p-4', 'border-border bg-card')}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-foreground text-xl font-medium">Mode</h3>
        </div>
        <ThemeModeChoices
          theme={preferences.theme}
          onChange={(theme) => onPreferenceChange({ theme })}
        />
      </div>
      <div className="border-border mt-4 border-t pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-foreground text-xl font-medium">Theme</h3>
          </div>
          <span className="text-muted text-sm" aria-live="polite">
            {curatedThemes.find((theme) => theme.id === preferences.themePreset)
              ?.name ?? 'Your saved colors'}
          </span>
        </div>
        {themeCollections.map((collection) => (
          <div
            key={collection}
            className="mt-5"
            role="group"
            aria-label={`${collection} themes`}
          >
            <h4 className="text-foreground mb-2 text-lg font-medium">
              {collection}
            </h4>
            <div
              className={`
                grid grid-cols-2 gap-2
                group-data-[wide=true]/options:grid-cols-3
              `}
            >
              {curatedThemes
                .filter((theme) => theme.collection === collection)
                .map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    mode={activeThemeMode}
                    selected={preferences.themePreset === theme.id}
                    onSelect={() =>
                      onPreferenceChange({ themePreset: theme.id })
                    }
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)
