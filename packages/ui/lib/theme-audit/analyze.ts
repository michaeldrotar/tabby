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
  'selected',
  'selected-hover',
  'focus',
  'focus-resting',
] as const
export type ThemeState = (typeof themeStates)[number]
export const stateLabels: Record<ThemeState, string> = {
  normal: 'Resting tab',
  hover: 'Hovered tab',
  active: 'Active tab',
  selected: 'Selected tab',
  'selected-hover': 'Hovered selection',
  focus: 'Focus on selected tab',
  'focus-resting': 'Focus on resting tab',
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
}
export type ThemeFinding = {
  id: string
  kind: 'contrast' | 'state' | 'similarity'
  severity: 'failure' | 'warning'
  message: string
  sample: ThemeState | 'header' | 'focus-header' | 'mode' | 'palette'
  selection: ThemeSelection
  value: number
  threshold: number
  colors: readonly [Color, Color]
  alternative?: ThemeSelection
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
export const similarityLimits = { palette: 0.02, state: 0.035 } as const

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
      id: `${key}/${check.id}${check.id.startsWith('focus-') ? '' : `/${selection.foreground}`}`,
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
      'mode-selection',
      'mode',
      [measurement.modeResting, measurement.modeSelected],
      'Selected theme mode is hard to distinguish',
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
          id === 'header-hover'
            ? `${selection.mode}/${selection.background}/${id}`
            : `${key}/${id}`,
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
          const token =
            field === 'background'
              ? 'canvas'
              : field === 'foreground'
                ? 'foreground'
                : 'selectedFill'
          const colors = [
            first.measurement[token],
            second.measurement[token],
          ] as const
          const distance = colorDistance(...colors)
          if (distance < similarityLimits.palette)
            findings.push({
              id: `${mode}/${field}/${first.selection[field]}/${second.selection[field]}`,
              kind: 'similarity',
              severity: 'warning',
              sample: 'palette',
              selection: first.selection,
              alternative: {
                ...first.selection,
                [field]: second.selection[field],
              },
              message: `${first.selection[field]} and ${second.selection[field]} ${field === 'accent' ? 'selection fills' : field === 'foreground' ? 'primary text colors' : 'canvases'} look very similar in ${mode} mode`,
              value: distance,
              threshold: similarityLimits.palette,
              colors,
            })
        }
    }
  return findings
}

export const contrastRegressions = (
  findings: readonly ThemeFinding[],
  baseline: Readonly<Record<string, number>>,
) =>
  findings.filter(
    (finding) =>
      finding.kind === 'contrast' &&
      finding.severity === 'failure' &&
      (baseline[finding.id] === undefined ||
        finding.value < baseline[finding.id]! - 0.005),
  )

export const sortThemeFindings = (findings: ThemeFinding[]) =>
  findings.sort((first, second) => {
    const rank = (finding: ThemeFinding) =>
      finding.severity === 'failure' ? 0 : finding.kind === 'similarity' ? 1 : 2
    return (
      rank(first) - rank(second) ||
      first.value - second.value ||
      first.id.localeCompare(second.id)
    )
  })
