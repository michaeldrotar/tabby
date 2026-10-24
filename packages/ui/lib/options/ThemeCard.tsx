import { ThemePalette } from './ThemePalette'
import { ThemePreview } from './ThemePreview'
import type { CuratedTheme, ThemeAppearance } from '@extension/core'

export const ThemeCard = ({
  theme,
  mode,
  selected,
  onSelect,
}: {
  theme: CuratedTheme
  mode: ThemeAppearance
  selected: boolean
  onSelect: () => void
}) => {
  return (
    <button
      type="button"
      className="curated-card"
      aria-pressed={selected}
      onClick={onSelect}
    >
      <ThemePreview theme={theme} mode={mode} />
      <span className="curated-card-label">
        {theme.name}
        <span aria-hidden="true">{selected ? '✓' : ''}</span>
      </span>
      <ThemePalette colors={theme[mode]} />
    </button>
  )
}
