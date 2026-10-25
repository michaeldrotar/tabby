import { useSurfaceId } from '../Surface'
import type { ThemeMode } from '@extension/core'

export const ThemeModeChoices = ({
  theme,
  onChange,
  hovered = false,
}: {
  theme: ThemeMode
  hovered?: boolean
  onChange: (theme: ThemeMode) => void
}) => {
  const name = useSurfaceId('theme-mode')
  return (
    <fieldset
      data-theme-mode-choices
      data-hover={hovered || undefined}
      className={`
        group/theme-mode flex min-w-0 shrink-0 flex-wrap items-center gap-2
      `}
    >
      <legend className="sr-only">Theme mode</legend>
      {(['system', 'light', 'dark'] as const).map((value) => (
        <label key={value} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            className="peer sr-only"
            checked={theme === value}
            onChange={() => onChange(value)}
          />
          <span
            className={`
              bg-input text-foreground inline-flex rounded-lg border
              border-transparent px-3 py-2 text-base font-medium capitalize
              transition-colors
              hover:bg-input/70
              peer-checked:border-focus peer-checked:bg-accent-selected
              peer-checked:text-foreground
              peer-checked:hover:bg-accent-selected-hover
              peer-checked:group-data-[hover=true]/theme-mode:bg-accent-selected-hover
              peer-focus-visible:ring-focus
              peer-focus-visible:ring-offset-background
              peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2
            `}
          >
            {value[0]!.toUpperCase() + value.slice(1)}
          </span>
        </label>
      ))}
    </fieldset>
  )
}
