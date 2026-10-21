import { describe, expect, it } from 'vitest'
import {
  analyzeTheme,
  compareThemePalettes,
  contrastRegressions,
  themeStates,
} from './analyze'
import { colorDistance, composite, contrastRatio } from './color'
import { findingURL, renderThemeReport } from './report'
import type { ThemeMeasurement, ThemeSelection } from './analyze'
import type { Color } from './color'

const white: Color = [255, 255, 255, 1]
const black: Color = [0, 0, 0, 1]
const selection: ThemeSelection = {
  mode: 'dark',
  background: 'slate',
  foreground: 'neutral',
  accent: 'blue',
}
const measurement = (): ThemeMeasurement => ({
  states: Object.fromEntries(
    themeStates.map((state) => [
      state,
      { background: white, text: black, secondary: black },
    ]),
  ) as ThemeMeasurement['states'],
  canvas: white,
  foreground: black,
  muted: black,
  accent: black,
  selectedFill: white,
  card: white,
  header: white,
  headerHover: white,
  focus: black,
  modeResting: white,
  modeSelected: white,
})

describe('theme analysis', () => {
  it('measures contrast after compositing translucent colors', () => {
    expect(contrastRatio(black, white)).toBe(21)
    expect(contrastRatio(white, black)).toBe(21)
    expect(contrastRatio([0, 0, 0, 0.5], white)).toBeCloseTo(3.98, 2)
    expect(composite([255, 0, 0, 0.5], [0, 0, 255, 0.5])).toEqual([
      170, 0, 85, 0.75,
    ])
    expect(composite([1, 2, 3, 0], [4, 5, 6, 0])).toEqual([0, 0, 0, 0])
  })

  it('distinguishes similar near-white text from a meaningful color change', () => {
    expect(colorDistance([245, 245, 245, 1], [245, 245, 244, 1])).toBeLessThan(
      0.002,
    )
    expect(colorDistance([255, 0, 0, 1], [0, 0, 255, 1])).toBeGreaterThan(0.1)
  })

  it('reports text and focus failures separately from weak state changes', () => {
    const sample = measurement()
    sample.states.selected.text = [180, 180, 180, 1]
    sample.focus = [180, 180, 180, 1]
    const findings = analyzeTheme(sample, selection)
    expect(
      findings.find((finding) => finding.id.endsWith('selected-text/neutral')),
    ).toMatchObject({ kind: 'contrast', severity: 'failure', threshold: 4.5 })
    expect(
      findings.find((finding) => finding.id.endsWith('focus-selection')),
    ).toMatchObject({ kind: 'contrast', threshold: 3 })
    expect(
      findings.find((finding) => finding.id.endsWith('focus-canvas')),
    ).toMatchObject({ sample: 'focus-resting' })
    expect(
      findings.find((finding) => finding.id.endsWith('focus-header')),
    ).toMatchObject({ sample: 'focus-header' })
    expect(
      findings.find((finding) => finding.id.endsWith('header-hover')),
    ).toMatchObject({ kind: 'state', severity: 'warning', value: 0 })
    expect(
      findings
        .filter((finding) => finding.kind === 'contrast')
        .every((finding) => finding.value < finding.threshold),
    ).toBe(true)
  })

  it('compares primary text palettes within the same mode', () => {
    const samples = [
      {
        selection,
        measurement: {
          ...measurement(),
          foreground: [245, 245, 245, 1] as Color,
        },
      },
      {
        selection: { ...selection, foreground: 'stone' as const },
        measurement: {
          ...measurement(),
          foreground: [245, 245, 244, 1] as Color,
        },
      },
      {
        selection: {
          ...selection,
          mode: 'light' as const,
          foreground: 'mist' as const,
        },
        measurement: {
          ...measurement(),
          foreground: [245, 245, 245, 1] as Color,
        },
      },
    ]
    const findings = compareThemePalettes(samples)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      kind: 'similarity',
      severity: 'warning',
      alternative: { ...selection, foreground: 'stone' },
    })
  })

  it('blocks new or worsening contrast failures while leaving design warnings advisory', () => {
    const sample = measurement()
    sample.focus = [180, 180, 180, 1]
    const findings = analyzeTheme(sample, selection)
    const baseline = Object.fromEntries(
      findings
        .filter((finding) => finding.kind === 'contrast')
        .map((finding) => [finding.id, finding.value]),
    )
    expect(contrastRegressions(findings, baseline)).toEqual([])
    expect(contrastRegressions(findings, {})).toHaveLength(3)
    const first = findings.find((finding) => finding.kind === 'contrast')!
    expect(
      contrastRegressions([{ ...first, value: first.value - 0.1 }], baseline),
    ).toHaveLength(1)
  })

  it('exports inspectable findings with escaped content and the exact palette pair', () => {
    const finding = compareThemePalettes([
      { selection, measurement: measurement() },
      {
        selection: { ...selection, foreground: 'stone' },
        measurement: measurement(),
      },
    ])[0]!
    const url = new URL(findingURL(finding, 'http://localhost:5180'))
    expect(url.searchParams.has('theme-lab')).toBe(true)
    expect(url.searchParams.get('foreground')).toBe('neutral')
    expect(url.searchParams.get('compare-foreground')).toBe('stone')
    const html = renderThemeReport(
      {
        combinations: 2754,
        findings: [{ ...finding, message: '<script>alert(1)</script>' }],
      },
      'http://localhost:5180',
    )
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).toContain('2,754 combinations checked')
  })
})
