import { THEME_ACCENT_PALETTES, THEME_NEUTRAL_PALETTES } from '../theme-colors'
import {
  analyzeTheme,
  compareThemePalettes,
  sortThemeFindings,
  themeStates,
} from './analyze'
import { composite } from './color'
import type {
  PaletteSample,
  ThemeFinding,
  ThemeMeasurement,
  ThemeSelection,
  ThemeState,
} from './analyze'
import type { Color } from './color'

const createColorReader = (document: Document) => {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context)
    throw new Error('Color measurements need a browser with canvas support.')
  const colors = new Map<string, Color>()
  return (value: string): Color => {
    const cached = colors.get(value)
    if (cached) return cached
    context.clearRect(0, 0, 1, 1)
    context.fillStyle = value
    context.fillRect(0, 0, 1, 1)
    const pixel = context.getImageData(0, 0, 1, 1).data
    const result: Color = [pixel[0]!, pixel[1]!, pixel[2]!, pixel[3]! / 255]
    colors.set(value, result)
    return result
  }
}

export const createThemeReader = (surface: HTMLElement) => {
  const document = surface.ownerDocument
  const view = document.defaultView!
  const color = createColorReader(document)
  const probe = document.createElement('span')
  probe.hidden = true
  const required = (selector: string) => {
    const element = surface.querySelector<HTMLElement>(selector)
    if (!element) throw new Error(`Theme sample is missing: ${selector}`)
    return element
  }
  const stateElements = Object.fromEntries(
    themeStates.map((state) => {
      const row = required(`[data-theme-state="${state}"] [data-tab-item]`)
      return [
        state,
        {
          row,
          text: row.querySelector<HTMLElement>('[data-tab-details] > div')!,
          secondary: row.querySelector<HTMLElement>(
            '[data-tab-details] > div + div',
          )!,
        },
      ]
    }),
  ) as Record<
    ThemeState,
    { row: HTMLElement; text: HTMLElement; secondary: HTMLElement }
  >
  const canvas = required('[data-tab-manager-shell]')
  const card = required('[data-theme-card]')
  const header = required('[data-theme-header]')
  const hover = required('[data-theme-header-hover]')
  const selectedMode = required(
    '[data-theme-mode-choices] input:checked + span',
  )
  const restingMode = required(
    '[data-theme-mode-choices] input:not(:checked) + span',
  )
  const backgrounds = new Map<HTMLElement, Color>()
  const background = (element: HTMLElement): Color => {
    const cached = backgrounds.get(element)
    if (cached) return cached
    const back: Color =
      element !== surface && element.parentElement
        ? background(element.parentElement)
        : [255, 255, 255, 1]
    const result = composite(
      color(view.getComputedStyle(element).backgroundColor),
      back,
    )
    backgrounds.set(element, result)
    return result
  }
  const token = (name: string) => {
    probe.style.color = `var(--${name})`
    return color(view.getComputedStyle(probe).color)
  }
  return (): ThemeMeasurement => {
    backgrounds.clear()
    surface.append(probe)
    try {
      const states = Object.fromEntries(
        themeStates.map((state) => {
          const { row, text, secondary } = stateElements[state]
          return [
            state,
            {
              background: background(row.firstElementChild as HTMLElement),
              text: color(view.getComputedStyle(text).color),
              secondary: color(view.getComputedStyle(secondary).color),
            },
          ]
        }),
      ) as ThemeMeasurement['states']
      return {
        states,
        canvas: background(canvas),
        foreground: states.normal.text,
        muted: states.normal.secondary,
        accent: token('accent'),
        selectedFill: states.selected.background,
        card: background(card),
        header: background(header),
        headerHover: background(hover),
        focus: token('focus-ring'),
        modeResting: background(restingMode),
        modeSelected: background(selectedMode),
      }
    } finally {
      probe.remove()
    }
  }
}

const applySelection = (surface: HTMLElement, selection: ThemeSelection) => {
  surface.dataset.theme = selection.mode
  surface.dataset.themeBackground = selection.background
  surface.dataset.themeForeground = selection.foreground
  surface.dataset.themeAccent = selection.accent
  surface.classList.toggle('dark', selection.mode === 'dark')
  surface.style.colorScheme = selection.mode
}

const preserveSurface = (surface: HTMLElement) => {
  const attributes = [
    'data-theme',
    'data-theme-background',
    'data-theme-foreground',
    'data-theme-accent',
    'class',
    'style',
  ].map((name) => [name, surface.getAttribute(name)] as const)
  return () =>
    attributes.forEach(([name, value]) =>
      value === null
        ? surface.removeAttribute(name)
        : surface.setAttribute(name, value),
    )
}

export const measureThemeSwatches = (
  surface: HTMLElement,
  selection: ThemeSelection,
) => {
  const restore = preserveSurface(surface)
  const read = createThemeReader(surface)
  const swatches: {
    field: 'background' | 'foreground' | 'accent'
    value: string
    color: Color
  }[] = []
  try {
    for (const field of ['background', 'foreground', 'accent'] as const) {
      const choices =
        field === 'accent' ? THEME_ACCENT_PALETTES : THEME_NEUTRAL_PALETTES
      for (const palette of choices) {
        const alternate = { ...selection, [field]: palette }
        applySelection(surface, alternate)
        const measurement = read()
        swatches.push({
          field,
          value: palette,
          color:
            measurement[
              field === 'background'
                ? 'canvas'
                : field === 'foreground'
                  ? 'foreground'
                  : 'selectedFill'
            ],
        })
      }
    }
    return swatches
  } finally {
    restore()
  }
}

export type ThemeReport = { combinations: number; findings: ThemeFinding[] }
export const themeCombinationCount =
  2 * THEME_NEUTRAL_PALETTES.length ** 2 * THEME_ACCENT_PALETTES.length

export const scanThemeCombinations = async (
  surface: HTMLElement,
  options: { signal: AbortSignal; onProgress?: (count: number) => void },
): Promise<ThemeReport> => {
  const restore = preserveSurface(surface)
  const read = createThemeReader(surface)
  const findings = new Map<string, ThemeFinding>()
  const samples: PaletteSample[] = []
  let combinations = 0
  const view = surface.ownerDocument.defaultView!
  const scheduler = (
    view as Window & {
      scheduler?: {
        postTask?: (
          task: () => void,
          options: { priority: 'background' },
        ) => Promise<void>
      }
    }
  ).scheduler
  const yieldToBrowser = () =>
    scheduler?.postTask
      ? scheduler.postTask(() => {}, { priority: 'background' })
      : new Promise<void>((resolve) => view.setTimeout(resolve, 0))
  let batchStarted = view.performance.now()
  try {
    for (const mode of ['light', 'dark'] as const)
      for (const background of THEME_NEUTRAL_PALETTES)
        for (const foreground of THEME_NEUTRAL_PALETTES)
          for (const accent of THEME_ACCENT_PALETTES) {
            options.signal.throwIfAborted()
            const selection = { mode, background, foreground, accent }
            applySelection(surface, selection)
            const measurement = read()
            samples.push({ selection, measurement })
            for (const finding of analyzeTheme(measurement, selection))
              findings.set(finding.id, finding)
            combinations++
            if (view.performance.now() - batchStarted >= 8) {
              options.onProgress?.(combinations)
              await yieldToBrowser()
              batchStarted = view.performance.now()
            }
          }
    for (const finding of compareThemePalettes(samples))
      findings.set(finding.id, finding)
    options.onProgress?.(combinations)
    return { combinations, findings: sortThemeFindings([...findings.values()]) }
  } finally {
    restore()
  }
}
