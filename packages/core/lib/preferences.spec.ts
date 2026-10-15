import { describe, expect, it } from 'vitest'
import {
  applyPreferencePatch,
  defaultPreferences,
  normalizePreferences,
} from './preferences'

describe('preferences', () => {
  it('keeps valid persisted fields and defaults invalid or missing fields', () => {
    expect(
      normalizePreferences({
        theme: 'dark',
        tabManagerCompactIconMode: 'first',
        themeDarkAccent: 'invalid',
        themeLightAccentStrength: Infinity,
        themeLightForeground: 'gray',
      }),
    ).toEqual({
      ...defaultPreferences,
      theme: 'dark',
      tabManagerCompactIconMode: 'first',
      themeLightForeground: 'gray',
    })
    expect(normalizePreferences(null)).toEqual(defaultPreferences)
  })
  it('applies valid patches without changing other fields and rejects invalid edits', () => {
    expect(
      applyPreferencePatch(
        { ...defaultPreferences },
        { themeDarkAccent: 'rose' },
      ),
    ).toEqual({ ...defaultPreferences, themeDarkAccent: 'rose' })
    expect(() =>
      applyPreferencePatch(
        { ...defaultPreferences },
        { themeLightAccentStrength: 11 },
      ),
    ).toThrow('Invalid preference')
  })

  it('keeps valid seasonal choices and defaults invalid holidays independently', () => {
    expect(
      normalizePreferences({
        seasonalIconsEnabled: false,
        seasonalIconSelections: {
          valentines: 'off',
          halloween: 'not-a-halloween-icon',
        },
        seasonalEasterCalendar: 'orthodox',
      }),
    ).toMatchObject({
      seasonalIconsEnabled: false,
      seasonalIconSelections: {
        ...defaultPreferences.seasonalIconSelections,
        valentines: 'off',
      },
      seasonalEasterCalendar: 'orthodox',
    })
    expect(() =>
      applyPreferencePatch(defaultPreferences, {
        seasonalIconSelections: {
          ...defaultPreferences.seasonalIconSelections,
          halloween: 'not-a-halloween-icon',
        } as never,
      }),
    ).toThrow('Invalid preference')
  })
})
