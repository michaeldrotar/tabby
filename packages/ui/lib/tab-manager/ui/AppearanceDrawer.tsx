import {
  accentSwatchByPalette,
  neutralSwatchByPalette,
  THEME_ACCENT_PALETTES,
  THEME_NEUTRAL_PALETTES,
} from '../../theme-colors'
import { cn } from '../../utils/cn'
import type { TabManagerIntent, TabManagerViewModel } from '../TabManager'

const Swatches = ({
  label,
  values,
  selected,
  colors,
  onChange,
}: {
  label: string
  values: readonly string[]
  selected: string
  colors: Record<string, string>
  onChange: (value: string) => void
}) => (
  <div
    role="group"
    aria-label={label}
    className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-2"
  >
    <span className="text-xs">{label}</span>
    <div className="flex flex-wrap gap-1">
      {values.map((value) => (
        <button
          key={value}
          type="button"
          aria-label={`${label}: ${value}`}
          title={value[0]!.toUpperCase() + value.slice(1)}
          aria-pressed={value === selected}
          className={cn(
            `
              focus-visible:ring-focus focus-visible:outline-none
              focus-visible:ring-2
              flex size-6 items-center justify-center rounded border
              border-transparent
            `,
            value === selected && 'border-foreground',
          )}
          onClick={() => onChange(value)}
        >
          <span
            aria-hidden
            className={cn('size-4 rounded-sm', colors[value])}
          />
        </button>
      ))}
    </div>
  </div>
)

// Temporary palette controls for the appearance review; remove before release.
export const AppearanceDrawer = ({
  id,
  appearance,
  onIntent,
}: {
  id: string
  appearance: NonNullable<TabManagerViewModel['appearance']>
  onIntent: (intent: TabManagerIntent) => void
}) => {
  const { preferences, theme } = appearance
  const prefix = theme === 'light' ? 'themeLight' : 'themeDark'
  return (
    <section
      id={id}
      data-appearance-drawer
      aria-label="Appearance"
      className={`
        border-border space-y-1 border-t bg-[var(--manager-chrome)] p-2
      `}
    >
      <div
        role="group"
        aria-label="Theme"
        className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-2"
      >
        <span className="text-xs">Theme</span>
        <div className="flex gap-1">
          {(['system', 'light', 'dark'] as const).map((mode) => (
            <button
              type="button"
              key={mode}
              aria-pressed={preferences.theme === mode}
              className={cn(
                `
                  focus-visible:ring-focus focus-visible:outline-none
                  focus-visible:ring-2
                  min-h-7 rounded px-2 text-xs
                `,
                preferences.theme === mode && 'bg-accent-selected',
              )}
              onClick={() =>
                onIntent({ type: 'change-appearance', value: { theme: mode } })
              }
            >
              {mode[0]!.toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {(['Background', 'Foreground', 'Accent'] as const).map((label) => (
        <Swatches
          key={label}
          label={label}
          values={
            label === 'Accent' ? THEME_ACCENT_PALETTES : THEME_NEUTRAL_PALETTES
          }
          colors={
            label === 'Accent' ? accentSwatchByPalette : neutralSwatchByPalette
          }
          selected={preferences[`${prefix}${label}`]}
          onChange={(value) =>
            onIntent({
              type: 'change-appearance',
              value: { [`${prefix}${label}`]: value },
            })
          }
        />
      ))}
    </section>
  )
}
