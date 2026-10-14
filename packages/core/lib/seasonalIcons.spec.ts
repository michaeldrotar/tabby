import { describe, expect, it } from 'vitest'
import { defaultPreferences } from './preferences'
import {
  getSeasonalHolidayDate,
  getUpcomingSeasonalIcon,
} from './seasonalIcons'

describe('seasonal icon dates', () => {
  it('uses the selected icon from 21 days before through the holiday date', () => {
    expect(
      getUpcomingSeasonalIcon(
        defaultPreferences,
        new Date(2026, 0, 24, 12),
        'en-US',
      ),
    ).toEqual({
      holidayId: 'valentines',
      iconId: 'valentines-heart-hoodie',
      daysUntil: 21,
    })
    expect(
      getUpcomingSeasonalIcon(
        defaultPreferences,
        new Date(2026, 0, 23, 12),
        'en-US',
      ),
    ).toBeUndefined()
    expect(
      getUpcomingSeasonalIcon(
        defaultPreferences,
        new Date(2026, 1, 14, 12),
        'en-US',
      )?.daysUntil,
    ).toBe(0)
    expect(
      getUpcomingSeasonalIcon(
        defaultPreferences,
        new Date(2026, 1, 15, 12),
        'en-US',
      ),
    ).toBeUndefined()
  })

  it('prefers the closest holiday when seasonal windows overlap', () => {
    expect(
      getUpcomingSeasonalIcon(
        defaultPreferences,
        new Date(2026, 2, 17, 12),
        'en-US',
      ),
    ).toEqual({
      holidayId: 'st-patricks',
      iconId: 'st-patricks-shamrock-hoodie',
      daysUntil: 0,
    })
  })

  it('shows the selected Halloween look three weeks ahead', () => {
    expect(
      getUpcomingSeasonalIcon(
        defaultPreferences,
        new Date(2026, 9, 14, 12),
        'en-US',
      ),
    ).toEqual({
      holidayId: 'halloween',
      iconId: 'halloween-frankenstein-hoodie',
      daysUntil: 17,
    })
  })

  it('follows selected Easter calendars and browser-region defaults', () => {
    expect(
      getSeasonalHolidayDate(
        'easter',
        2026,
        {
          seasonalEasterCalendar: 'western',
          seasonalThanksgivingRegion: 'local',
        },
        'en-US',
      ),
    ).toEqual(new Date(2026, 3, 5))
    expect(
      getSeasonalHolidayDate(
        'easter',
        2026,
        {
          seasonalEasterCalendar: 'orthodox',
          seasonalThanksgivingRegion: 'local',
        },
        'en-US',
      ),
    ).toEqual(new Date(2026, 3, 12))
    expect(
      getSeasonalHolidayDate(
        'easter',
        2026,
        {
          seasonalEasterCalendar: 'local',
          seasonalThanksgivingRegion: 'local',
        },
        'el-GR',
      ),
    ).toEqual(new Date(2026, 3, 12))
  })

  it('uses Canadian and US Thanksgiving dates from browser region or override', () => {
    expect(
      getSeasonalHolidayDate(
        'thanksgiving',
        2026,
        {
          seasonalEasterCalendar: 'local',
          seasonalThanksgivingRegion: 'local',
        },
        'en-CA',
      ),
    ).toEqual(new Date(2026, 9, 12))
    expect(
      getSeasonalHolidayDate(
        'thanksgiving',
        2026,
        {
          seasonalEasterCalendar: 'local',
          seasonalThanksgivingRegion: 'us',
        },
        'en-CA',
      ),
    ).toEqual(new Date(2026, 10, 26))
  })

  it('respects the master switch and per-holiday Off choice', () => {
    const today = new Date(2026, 9, 24, 12)
    expect(
      getUpcomingSeasonalIcon(
        {
          ...defaultPreferences,
          seasonalIconSelections: {
            ...defaultPreferences.seasonalIconSelections,
            halloween: 'off',
          },
        },
        today,
        'en-US',
      ),
    ).toBeUndefined()
    expect(
      getUpcomingSeasonalIcon(
        { ...defaultPreferences, seasonalIconsEnabled: false },
        today,
        'en-US',
      ),
    ).toBeUndefined()
  })
})
