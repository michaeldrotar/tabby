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
  const c = theme[mode]
  return (
    <button
      type="button"
      className="curated-card"
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span
        className="curated-mini"
        style={{
          backgroundColor: c.canvas,
          color: c.text,
          ...(theme.scene === 'summer'
            ? {
                backgroundImage: `url('/themes/summer/${mode === 'dark' ? 'night' : 'day'}.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {}),
        }}
        aria-hidden="true"
      >
        <span className="curated-mini-chrome" style={{ background: c.chrome }}>
          <i style={{ background: c.accent }} />
          <i />
          <i />
        </span>
        <span className="curated-mini-body">
          <span className="curated-mini-row">
            <i style={{ background: c.secondary }} />
            <b />
          </span>
          <span
            className="curated-mini-row"
            style={{
              background: c.selection,
              borderLeft: `3px solid ${c.accent}`,
            }}
          >
            <i style={{ background: c.accent }} />
            <b />
          </span>
          <span className="curated-mini-row">
            <i style={{ background: c.secondary }} />
            <b />
          </span>
        </span>
        {theme.icon && (
          <img src={`/seasonal-icons/${theme.icon}-128.png`} alt="" />
        )}
      </span>
      <span className="curated-card-label">
        {theme.name}
        <span aria-hidden="true">{selected ? '✓' : ''}</span>
      </span>
    </button>
  )
}
