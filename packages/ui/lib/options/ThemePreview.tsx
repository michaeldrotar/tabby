import type { CuratedTheme, ThemeAppearance } from '@extension/core'

export const ThemePreview = ({
  theme,
  mode,
}: {
  theme: CuratedTheme
  mode: ThemeAppearance
}) => {
  const colors = theme[mode]
  return (
    <span
      className="curated-mini"
      style={{
        backgroundColor: colors.canvas,
        color: colors.text,
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
      <span
        className="curated-mini-chrome"
        style={{ background: colors.chrome }}
      >
        <i style={{ background: colors.accent }} />
        <i />
        <i />
      </span>
      <span className="curated-mini-body">
        <span className="curated-mini-row">
          <i style={{ background: colors.secondary }} />
          <b />
        </span>
        <span
          className="curated-mini-row"
          style={{
            background: colors.selection,
            borderLeft: `3px solid ${colors.accent}`,
          }}
        >
          <i style={{ background: colors.accent }} />
          <b />
        </span>
        <span className="curated-mini-row">
          <i style={{ background: colors.secondary }} />
          <b />
        </span>
      </span>
      {theme.icon && (
        <img src={`/seasonal-icons/${theme.icon}-128.png`} alt="" />
      )}
    </span>
  )
}
