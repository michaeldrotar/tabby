import { Omnibar } from '@extension/ui/omnibar/Omnibar'
import { Surface } from '@extension/ui/Surface'
import type { OmnibarSearchResult } from '@extension/ui/omnibar/Omnibar'
import type { SurfaceProps } from '@extension/ui/Surface'

const defaultPalette: NonNullable<SurfaceProps['palette']> = {
  background: 'stone',
  foreground: 'stone',
  accent: 'orange',
  strength: 20,
}

export const PromoOmnibar = ({
  query,
  results,
  className = 'h-full',
  surfaceClassName,
  palette = defaultPalette,
}: {
  query: string
  results: OmnibarSearchResult[]
  className?: string
  surfaceClassName?: string
  palette?: NonNullable<SurfaceProps['palette']>
}) => (
  <Surface
    className={surfaceClassName}
    theme="light"
    palette={palette}
    inputMode="static"
    motion="reduced"
  >
    <Omnibar
      className={className}
      query={query}
      results={results}
      selectedIndex={0}
      onDismiss={() => undefined}
      autofocus={false}
    />
  </Surface>
)
