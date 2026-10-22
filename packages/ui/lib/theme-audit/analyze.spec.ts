import { describe, expect, it } from 'vitest'
import { analyzeTheme, compareThemePalettes, themeStates } from './analyze'
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
  modeHovered: white,
  modeIndicator: black,
  selectionIndicator: black,
  activeIndicator: black,
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
      findings.find(
        (finding) =>
          finding.kind === 'state' && finding.id.endsWith('header-hover'),
      ),
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

  it('checks selection, active, and mode indicators against adjacent surfaces', () => {
    const sample = measurement()
    sample.selectionIndicator = white
    sample.activeIndicator = white
    sample.modeIndicator = white
    expect(
      analyzeTheme(sample, selection).filter((f) =>
        f.id.endsWith('-indicator'),
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sample: 'selected', threshold: 3, value: 1 }),
        expect.objectContaining({ sample: 'active', threshold: 3, value: 1 }),
        expect.objectContaining({ sample: 'mode', threshold: 3, value: 1 }),
      ]),
    )
  })

  it('detects focus and mode contrast lost only during hover', () => {
    const sample = measurement()
    sample.headerHover = black
    sample.states['focus-hover'].background = black
    sample.modeHovered = black
    const failures = analyzeTheme(sample, selection).filter(
      (f) => f.kind === 'contrast',
    )
    expect(failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sample: 'focus-header-hover', value: 1 }),
        expect.objectContaining({ sample: 'focus-hover', value: 1 }),
        expect.objectContaining({ sample: 'mode', value: 1 }),
      ]),
    )
    expect(failures.some((f) => f.id.endsWith('/focus-header'))).toBe(false)
  })

  it('opens the hovered indicator state when it has the weakest contrast', () => {
    const sample = measurement()
    sample.states['selected-hover'].background = black
    sample.states['active-hover'].background = black
    expect(analyzeTheme(sample, selection)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sample: 'selected-hover',
          message: 'Selection indicator has low contrast',
          value: 1,
        }),
        expect.objectContaining({
          sample: 'active-hover',
          message: 'Active tab border has low contrast',
          value: 1,
        }),
      ]),
    )
  })

  it('retains palettes when a secondary role is distinct', () => {
    const first = measurement()
    const second = {
      ...measurement(),
      foreground: [1, 1, 1, 1] as Color,
      muted: [130, 130, 130, 1] as Color,
    }
    expect(
      compareThemePalettes([
        { selection, measurement: first },
        {
          selection: { ...selection, foreground: 'stone' },
          measurement: second,
        },
      ]),
    ).toEqual([])
  })

  it('groups hover observations by the palette that changes their colors', () => {
    const first = analyzeTheme(measurement(), selection)
    const second = analyzeTheme(measurement(), {
      ...selection,
      accent: 'red',
      foreground: 'stone',
    })
    expect(first.find((f) => f.id.endsWith('tab-hover'))?.id).toBe(
      second.find((f) => f.id.endsWith('tab-hover'))?.id,
    )
    expect(first.find((f) => f.id.endsWith('selected-hover'))?.id).not.toBe(
      second.find((f) => f.id.endsWith('selected-hover'))?.id,
    )
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
