import { useEffect, useRef, useState } from 'react'
import { BrowserTabItem } from '../BrowserTabItem'
import { ThemeModeChoices } from '../options/ThemeModeChoices'
import { Surface } from '../Surface'
import { windowControlClass } from '../tab-manager/ui/WindowNavigation'
import { cn } from '../utils/cn'
import { stateLabels, themeStates } from './analyze'
import { colorCSS } from './color'
import { createThemeReader, measureThemeSwatches } from './measure'
import type { ThemeFinding, ThemeSelection } from './analyze'
import type { Color } from './color'

const ignoreChoice = () => undefined

/** State samples reuse the extension's rows, mode controls, and header controls. */
export const ThemeSamples = ({
  mode,
  compact = false,
  highlight,
}: {
  mode: ThemeSelection['mode']
  compact?: boolean
  highlight?: ThemeFinding['sample']
}) => (
  <div
    data-theme-samples
    data-tab-manager-shell
    className="rounded-lg bg-[var(--manager-canvas)] p-3"
  >
    <div
      className={cn('bg-card mb-3 rounded-md p-2', compact && 'hidden')}
      data-theme-card
      data-theme-spotlight={highlight === 'mode' || undefined}
    >
      <ThemeModeChoices theme={mode} onChange={ignoreChoice} />
      <p className="text-muted mb-1 mt-3 text-xs">Hovered mode</p>
      <ThemeModeChoices theme={mode} onChange={ignoreChoice} hovered />
    </div>
    <div
      data-theme-header
      className={cn(
        'mb-3 flex flex-wrap gap-2 rounded-md bg-[var(--manager-chrome)] p-2',
        compact && 'hidden',
      )}
      data-theme-spotlight={highlight === 'header' || undefined}
    >
      <button type="button" className={windowControlClass}>
        Window
      </button>
      <button
        type="button"
        data-theme-header-hover
        data-hover="true"
        className={windowControlClass}
      >
        Hovered window
      </button>
      <button
        type="button"
        data-theme-header-focus
        data-theme-spotlight={highlight === 'focus-header' || undefined}
        className={cn(windowControlClass, 'ring-focus ring-2 ring-inset')}
      >
        Focused window
      </button>
      <button
        type="button"
        data-theme-header-focus-hover
        data-hover="true"
        data-theme-spotlight={highlight === 'focus-header-hover' || undefined}
        className={cn(windowControlClass, 'ring-focus ring-2 ring-inset')}
      >
        Focused hovered window
      </button>
    </div>
    <div
      className={`
        grid gap-2
        sm:grid-cols-2
      `}
    >
      {themeStates.map((state) => (
        <div
          key={state}
          data-theme-state={state}
          data-theme-spotlight={highlight === state || undefined}
          className={cn(
            compact && state !== 'normal' && state !== 'selected' && 'hidden',
          )}
        >
          <p className="text-muted mb-1 text-xs">{stateLabels[state]}</p>
          <div inert>
            <BrowserTabItem
              tabId={`theme-${state}`}
              title="Project notes"
              url="https://docs.google.com"
              selected={
                state === 'selected' ||
                state === 'selected-hover' ||
                state === 'focus' ||
                state === 'focus-selected-hover'
              }
              active={state === 'active' || state === 'active-hover'}
              data-hover={
                state === 'hover' ||
                state === 'selected-hover' ||
                state === 'active-hover' ||
                state === 'focus-hover' ||
                state === 'focus-selected-hover' ||
                undefined
              }
              className={
                state.startsWith('focus')
                  ? 'after:ring-focus after:ring-2 after:ring-inset'
                  : undefined
              }
            />
          </div>
        </div>
      ))}
    </div>
  </div>
)

export const FindingDescription = ({
  finding,
  detailed = true,
}: {
  finding: ThemeFinding
  detailed?: boolean
}) => (
  <>
    <span className="font-medium">{finding.message}</span>
    <span className="mt-1 block text-xs">
      {finding.kind === 'contrast'
        ? `${finding.value.toFixed(2)}:1 contrast · needs ${finding.threshold}:1`
        : detailed
          ? `${finding.kind === 'similarity' ? 'Palette similarity' : 'State visibility'} · color difference ${(finding.value * 100).toFixed(2)} / target ${(finding.threshold * 100).toFixed(1)}`
          : finding.kind === 'similarity'
            ? 'These choices may look the same at normal text sizes.'
            : 'Look for a clearly visible change when you hover or select.'}
    </span>
    {finding.affectedCombinations !== undefined && (
      <span className="mt-1 block text-xs">
        {finding.affectedCombinations.toLocaleString()} combinations share this
        observation.
      </span>
    )}
  </>
)

export const FindingColors = ({ finding }: { finding: ThemeFinding }) => (
  <span
    aria-hidden="true"
    className={`
      border-current/20 inline-flex shrink-0 overflow-hidden rounded border
    `}
  >
    {finding.colors.map((color, index) => (
      <span
        key={index}
        className="h-6 w-5"
        style={{ backgroundColor: colorCSS(color) }}
      />
    ))}
  </span>
)

export const ThemePreview = ({
  selection,
  compact = false,
  highlight,
  onPaletteChange,
}: {
  selection: ThemeSelection
  compact?: boolean
  highlight?: ThemeFinding['sample']
  onPaletteChange?: (selection: ThemeSelection) => void
}) => {
  const root = useRef<HTMLDivElement>(null)
  const [result, setResult] = useState<{
    canvas: Color
    swatches: ReturnType<typeof measureThemeSwatches>
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { mode, background, foreground, accent } = selection
  useEffect(() => {
    if (
      typeof CSS === 'undefined' ||
      typeof CSS.supports !== 'function' ||
      !CSS.supports('color', 'oklch(0.5 0.1 30)')
    )
      return
    const frame = requestAnimationFrame(() => {
      const surface = root.current?.querySelector<HTMLElement>('[data-surface]')
      if (!surface) return
      try {
        const palette = { mode, background, foreground, accent }
        const measurement = createThemeReader(surface)()
        setResult({
          canvas: measurement.canvas,
          swatches: measureThemeSwatches(surface, palette),
        })
        setError(null)
      } catch (error) {
        setResult(null)
        setError(
          error instanceof Error
            ? error.message
            : 'Could not measure these colors.',
        )
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [mode, background, foreground, accent])
  return (
    <div ref={root} data-theme-preview className="min-w-0">
      <div aria-label={`${mode} theme state preview`} role="img">
        <div aria-hidden="true">
          <Surface
            theme={mode}
            palette={{ background, foreground, accent }}
            inputMode="static"
            motion="reduced"
            className="pointer-events-none"
          >
            <ThemeSamples mode={mode} compact={compact} highlight={highlight} />
          </Surface>
        </div>
      </div>
      {!compact && result && onPaletteChange && (
        <div className="mt-5 space-y-4" data-theme-palette-strips>
          {(['foreground', 'background', 'accent'] as const).map((field) => (
            <fieldset key={field}>
              <legend className="mb-2 text-sm font-medium">
                {field === 'foreground'
                  ? 'Foreground choices'
                  : field === 'background'
                    ? 'Background choices'
                    : 'Accent selection fills'}
              </legend>
              <div
                className={`
                  grid grid-cols-5 gap-2
                  sm:grid-cols-9
                `}
              >
                {result.swatches
                  .filter((swatch) => swatch.field === field)
                  .map((swatch) => (
                    <button
                      type="button"
                      key={swatch.value}
                      aria-label={`${swatch.value} ${field}`}
                      aria-pressed={selection[field] === swatch.value}
                      onClick={() =>
                        onPaletteChange({ ...selection, [field]: swatch.value })
                      }
                      className={`
                        min-w-0 rounded p-1 text-center text-xs
                        focus-visible:outline focus-visible:outline-2
                        focus-visible:outline-offset-2
                        aria-pressed:ring-2 aria-pressed:ring-current
                      `}
                    >
                      <span
                        className={`
                          mb-1 flex h-8 items-center justify-center rounded
                        `}
                        style={{
                          backgroundColor: colorCSS(
                            field === 'foreground'
                              ? result.canvas
                              : swatch.color,
                          ),
                          color: colorCSS(swatch.color),
                        }}
                      >
                        {field === 'foreground' ? 'Aa' : ''}
                      </span>
                      <span className="capitalize">{swatch.value}</span>
                    </button>
                  ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}
      {error && <p role="status">{error}</p>}
    </div>
  )
}
