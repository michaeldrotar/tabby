import { colorDistance, contrastRatio } from './color'
import type { Color } from './color'
import type { ThemeAccentPalette, ThemeNeutralPalette } from '@extension/core'

export type ThemeSelection = {
  mode: 'light' | 'dark'
  background: ThemeNeutralPalette
  foreground: ThemeNeutralPalette
  accent: ThemeAccentPalette
}

export const themeStates = [
  'normal',
  'hover',
  'active',
  'active-hover',
  'selected',
  'selected-hover',
  'focus',
  'focus-resting',
  'focus-hover',
  'focus-selected-hover',
] as const
export type ThemeState = (typeof themeStates)[number]
export const stateLabels: Record<ThemeState, string> = {
  normal: 'Resting tab',
  hover: 'Hovered tab',
  active: 'Active tab',
  'active-hover': 'Hovered active tab',
  selected: 'Selected tab',
  'selected-hover': 'Hovered selection',
  focus: 'Focus on selected tab',
  'focus-resting': 'Focus on resting tab',
  'focus-hover': 'Focus on hovered tab',
  'focus-selected-hover': 'Focus on hovered selection',
}
export type ThemeSample = { background: Color; text: Color; secondary: Color }
export type ThemeMeasurement = {
  states: Record<ThemeState, ThemeSample>
  canvas: Color
  foreground: Color
  muted: Color
  accent: Color
  selectedFill: Color
  card: Color
  header: Color
  headerHover: Color
  focus: Color
  modeResting: Color
  modeSelected: Color
  modeHovered: Color
  modeIndicator: Color
  selectionIndicator: Color
  activeIndicator: Color
}
export type ThemeFinding = {
  id: string
  kind: 'contrast' | 'state' | 'similarity'
  severity: 'failure' | 'warning' | 'info'
  message: string
  sample:
    | ThemeState
    | 'header'
    | 'focus-header'
    | 'focus-header-hover'
    | 'mode'
    | 'palette'
  selection: ThemeSelection
  value: number
  threshold: number
  colors: readonly [Color, Color]
  alternative?: ThemeSelection
  affectedCombinations?: number
}
export type ContrastCheck = {
  id: string
  sample: ThemeFinding['sample']
  label: string
  ratio: number
  minimum: number
  colors: readonly [Color, Color]
}

// Palette choice and interaction feedback have separate design thresholds.
export const similarityLimits = {
  palette: 0.02,
  nearDuplicate: 0.01,
  state: 0.035,
} as const

export const contrastChecks = (
  measurement: ThemeMeasurement,
): ContrastCheck[] => {
  const checks: ContrastCheck[] = []
  for (const state of themeStates) {
    const sample = measurement.states[state]
    for (const text of ['text', 'secondary'] as const) {
      checks.push({
        id: `${state}-${text}`,
        sample: state,
        label: `${stateLabels[state]} ${text === 'text' ? 'title' : 'details'}`,
        ratio: contrastRatio(sample[text], sample.background),
        minimum: 4.5,
        colors: [sample[text], sample.background],
      })
    }
  }
  for (const [id, background, label] of [
    ['card', measurement.card, 'Settings cards'],
    ['header', measurement.header, 'Header controls'],
  ] as const) {
    for (const [token, color] of [
      ['text', measurement.foreground],
      ['secondary', measurement.muted],
    ] as const) {
      checks.push({
        id: `${id}-${token}`,
        sample: id === 'card' ? 'palette' : 'header',
        label: `${label} ${token === 'text' ? 'text' : 'details'}`,
        ratio: contrastRatio(color, background),
        minimum: 4.5,
        colors: [color, background],
      })
    }
  }
  for (const [id, sample, background, label] of [
    [
      'focus-canvas',
      'focus-resting',
      measurement.states['focus-resting'].background,
      'Focus ring on resting tabs',
    ],
    [
      'focus-selection',
      'focus',
      measurement.states.focus.background,
      'Focus ring on selected tabs',
    ],
    [
      'focus-hover',
      'focus-hover',
      measurement.states['focus-hover'].background,
      'Focus ring on hovered tabs',
    ],
    [
      'focus-selected-hover',
      'focus-selected-hover',
      measurement.states['focus-selected-hover'].background,
      'Focus ring on hovered selections',
    ],
    [
      'focus-header-hover',
      'focus-header-hover',
      measurement.headerHover,
      'Focus ring on hovered header controls',
    ],
    [
      'focus-header',
      'focus-header',
      measurement.header,
      'Focus ring on header controls',
    ],
  ] as const) {
    checks.push({
      id,
      sample,
      label,
      ratio: contrastRatio(measurement.focus, background),
      minimum: 3,
      colors: [measurement.focus, background],
    })
  }
  for (const [id, indicator, backgrounds, label] of [
    [
      'selected-indicator',
      measurement.selectionIndicator,
      [
        [measurement.states.selected.background, 'selected'],
        [measurement.states['selected-hover'].background, 'selected-hover'],
      ],
      'Selection indicator',
    ],
    [
      'active-indicator',
      measurement.activeIndicator,
      [
        [measurement.states.active.background, 'active'],
        [measurement.states['active-hover'].background, 'active-hover'],
        [measurement.canvas, 'active'],
      ],
      'Active tab border',
    ],
    [
      'mode-indicator',
      measurement.modeIndicator,
      [
        [measurement.modeSelected, 'mode'],
        [measurement.modeHovered, 'mode'],
        [measurement.card, 'mode'],
      ],
      'Selected theme mode border',
    ],
  ] as const) {
    const [background, sample] = [...backgrounds].sort(
      (a, b) => contrastRatio(indicator, a[0]) - contrastRatio(indicator, b[0]),
    )[0]!
    checks.push({
      id,
      sample,
      label,
      ratio: contrastRatio(indicator, background),
      minimum: 3,
      colors: [indicator, background],
    })
  }
  return checks
}

export const analyzeTheme = (
  measurement: ThemeMeasurement,
  selection: ThemeSelection,
): ThemeFinding[] => {
  const key = `${selection.mode}/${selection.background}/${selection.accent}`
  const findings: ThemeFinding[] = contrastChecks(measurement)
    .filter((check) => check.ratio < check.minimum)
    .map((check) => ({
      id: `${key}/${check.id}${check.id.startsWith('focus-') || check.id.endsWith('-indicator') ? '' : `/${selection.foreground}`}`,
      kind: 'contrast',
      severity: 'failure',
      message: `${check.label} has low contrast`,
      sample: check.sample,
      selection,
      value: check.ratio,
      threshold: check.minimum,
      colors: check.colors,
    }))
  for (const [id, sample, colors, message] of [
    [
      'header-hover',
      'header',
      [measurement.header, measurement.headerHover],
      'Header hover barely changes the fill',
    ],
    [
      'tab-hover',
      'hover',
      [
        measurement.states.normal.background,
        measurement.states.hover.background,
      ],
      'Tab hover barely changes the fill',
    ],
    [
      'selected-hover',
      'selected-hover',
      [
        measurement.states.selected.background,
        measurement.states['selected-hover'].background,
      ],
      'Hovering a selection barely changes its fill',
    ],
  ] as const) {
    const distance = colorDistance(...colors)
    if (distance < similarityLimits.state)
      findings.push({
        id:
          id === 'selected-hover'
            ? `${selection.mode}/${selection.accent}/${id}`
            : `${selection.mode}/${selection.background}/${id}`,
        kind: 'state',
        severity: 'warning',
        message,
        sample,
        selection,
        value: distance,
        threshold: similarityLimits.state,
        colors,
      })
  }
  return findings
}

export type PaletteSample = {
  selection: ThemeSelection
  measurement: ThemeMeasurement
}
export const compareThemePalettes = (
  samples: readonly PaletteSample[],
): ThemeFinding[] => {
  const findings: ThemeFinding[] = []
  for (const mode of ['light', 'dark'] as const)
    for (const field of ['background', 'foreground', 'accent'] as const) {
      const palettes = new Map<string, PaletteSample>()
      for (const sample of samples)
        if (sample.selection.mode === mode)
          palettes.set(sample.selection[field], sample)
      const choices = [...palettes.values()]
      for (let i = 0; i < choices.length; i++)
        for (let j = i + 1; j < choices.length; j++) {
          const first = choices[i]!
          const second = choices[j]!
          const tokens =
            field === 'background'
              ? (['canvas', 'card', 'header'] as const)
              : field === 'foreground'
                ? (['foreground', 'muted'] as const)
                : (['accent', 'selectedFill', 'focus'] as const)
          // A family is redundant only when its most distinct measured role is similar.
          const pairs = tokens
            .map((token) => ({
              colors: [
                first.measurement[token],
                second.measurement[token],
              ] as const,
              distance: colorDistance(
                first.measurement[token],
                second.measurement[token],
              ),
            }))
            .sort((a, b) => b.distance - a.distance)
          const { colors, distance } = pairs[0]!
          if (distance < similarityLimits.palette)
            findings.push({
              id: `${mode}/${field}/${first.selection[field]}/${second.selection[field]}`,
              kind: 'similarity',
              severity:
                distance < similarityLimits.nearDuplicate ? 'warning' : 'info',
              sample: 'palette',
              selection: first.selection,
              alternative: {
                ...first.selection,
                [field]: second.selection[field],
              },
              message: `${first.selection[field]} and ${second.selection[field]} ${field === 'accent' ? 'accent roles' : field === 'foreground' ? 'text roles' : 'background roles'} look very similar in ${mode} mode`,
              value: distance,
              threshold: similarityLimits.palette,
              colors,
            })
        }
    }
  return findings
}

export const sortThemeFindings = (findings: ThemeFinding[]) =>
  findings.sort((first, second) => {
    const rank = (finding: ThemeFinding) =>
      finding.severity === 'failure'
        ? 0
        : finding.severity === 'warning'
          ? 1
          : 2
    return (
      rank(first) - rank(second) ||
      first.value - second.value ||
      first.id.localeCompare(second.id)
    )
  })
