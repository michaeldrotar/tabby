import { curatedThemes, themeCollections, themeTokens } from '@extension/core'
import { expect, it } from 'vitest'
import { contrastRatio } from './color-contrast'
import type { Color } from './color-contrast'

const rgb = (hex: string): Color => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
  1,
]
const mix = (front: Color, back: Color, weight: number): Color => [
  front[0] * weight + back[0] * (1 - weight),
  front[1] * weight + back[1] * (1 - weight),
  front[2] * weight + back[2] * (1 - weight),
  1,
]

it('keeps text and title counts readable across resting, selected, and hover states', () => {
  for (const theme of curatedThemes) {
    for (const mode of ['light', 'dark'] as const) {
      const c = theme[mode]
      const tokens = themeTokens(c)
      const canvas = rgb(c.canvas)
      const accent = rgb(c.accent)
      const secondary = rgb(c.secondary)
      const backgrounds = {
        canvas,
        surface: rgb(c.surface),
        chrome: rgb(c.chrome),
        selection: rgb(c.selection),
        hover: mix(secondary, canvas, 0.18),
        active: mix(accent, canvas, 0.1),
        'active-hover': mix(accent, canvas, 0.18),
        'selected-hover': mix(secondary, rgb(c.selection), 0.12),
      }
      for (const [state, background] of Object.entries(backgrounds)) {
        for (const role of [
          'foreground',
          'accent-foreground',
          'muted',
        ] as const) {
          expect(
            contrastRatio(rgb(tokens[role]), background),
            `${theme.name} ${mode}: ${role} on ${state}`,
          ).toBeGreaterThanOrEqual(4.5)
        }
        expect(
          contrastRatio(rgb(tokens['focus-ring']), background),
          `${theme.name} ${mode}: focus on ${state}`,
        ).toBeGreaterThanOrEqual(3)
      }
    }
  }
})

it('keeps the shipped theme collection in complete rows with plain names', () => {
  for (const collection of themeCollections)
    expect(
      curatedThemes.filter((theme) => theme.collection === collection).length %
        3,
    ).toBe(0)
  expect(new Set(curatedThemes.map((theme) => theme.name)).size).toBe(
    curatedThemes.length,
  )
  expect(curatedThemes.every((theme) => /^[A-Za-z ]+$/.test(theme.name))).toBe(
    true,
  )
})
