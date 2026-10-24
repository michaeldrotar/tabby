import type { ThemeColors } from '@extension/core'

export const ThemePalette = ({ colors }: { colors: ThemeColors }) => (
  <span className="theme-palette" aria-hidden="true">
    {(['canvas', 'chrome', 'selection', 'accent', 'secondary'] as const).map(
      (role) => (
        <i key={role} style={{ backgroundColor: colors[role] }} />
      ),
    )}
  </span>
)
