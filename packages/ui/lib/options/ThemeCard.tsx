import { ThemePreview } from './ThemePreview'
import type { CuratedTheme, ThemeAppearance } from '@extension/core'

type ThemeCardContentProps = {
  theme: CuratedTheme
  mode: ThemeAppearance
  selected?: boolean
  size?: 'regular' | 'compact'
}

export const ThemeCardContent = ({
  theme,
  mode,
  selected = false,
  size = 'regular',
}: ThemeCardContentProps) => (
  <span className="curated-card-content" data-size={size}>
    <ThemePreview theme={theme} mode={mode} />
    <span className="curated-card-label">
      {theme.name}
      <span aria-hidden="true">{selected ? '✓' : ''}</span>
    </span>
  </span>
)

export const ThemeCard = ({
  theme,
  mode,
  selected,
  size,
  onSelect,
}: ThemeCardContentProps & {
  selected: boolean
  onSelect: () => void
}) => (
  <button
    type="button"
    className="curated-card"
    aria-pressed={selected}
    onClick={onSelect}
  >
    <ThemeCardContent
      theme={theme}
      mode={mode}
      selected={selected}
      size={size}
    />
  </button>
)
