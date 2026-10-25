import { describe, expect, it } from 'vitest'
import { defaultPreferences } from './preferences'
import {
  getSeasonalHolidayDate,
  getUpcomingSeasonalIcon,
} from './seasonalIcons'
import { getThemeIconId } from './themes'

describe('seasonal icon dates', () => {
  it.each([
    ['valentines', new Date(2026, 1, 1), new Date(2026, 1, 14), 13],
    ['st-patricks', new Date(2026, 2, 10), new Date(2026, 2, 17), 7],
    ['easter', new Date(2026, 2, 22), new Date(2026, 3, 5), 14],
    ['thanksgiving', new Date(2026, 10, 19), new Date(2026, 10, 26), 7],
    ['halloween', new Date(2026, 9, 15), new Date(2026, 9, 31), 16],
    ['christmas', new Date(2026, 11, 1), new Date(2026, 11, 25), 24],
  ] as const)(
    'shows %s only during its seasonal window',
    (holidayId, start, holiday, leadDays) => {
      const before = new Date(start)
      before.setDate(before.getDate() - 1)
      const end = holidayId === 'christmas' ? new Date(2027, 0, 1) : holiday
      const after = new Date(end)
      after.setDate(after.getDate() + 1)
      const getIcon = (date: Date) =>
        getUpcomingSeasonalIcon(defaultPreferences, date, 'en-US')

      expect(getIcon(before)).toBeUndefined()
      expect(getIcon(start)).toEqual({
        holidayId,
        iconId: defaultPreferences.seasonalIconSelections[holidayId],
        daysUntil: leadDays,
      })
      expect(getIcon(holiday)?.daysUntil).toBe(0)
      expect(getIcon(end)?.holidayId).toBe(holidayId)
      expect(getIcon(after)).toBeUndefined()
    },
  )

  it('hands overlapping windows from St. Patrick’s Day to Easter after March 17', () => {
    const getIcon = (day: number) =>
      getUpcomingSeasonalIcon(
        defaultPreferences,
        new Date(2008, 2, day, 12),
        'en-US',
      )

    expect(getIcon(9)?.holidayId).toBe('easter')
    expect(getIcon(10)?.holidayId).toBe('st-patricks')
    expect(getIcon(17)?.holidayId).toBe('st-patricks')
    expect(getIcon(18)?.holidayId).toBe('easter')
    expect(getIcon(23)?.daysUntil).toBe(0)
    expect(getIcon(24)).toBeUndefined()
    expect(
      getUpcomingSeasonalIcon(
        {
          ...defaultPreferences,
          seasonalIconSelections: {
            ...defaultPreferences.seasonalIconSelections,
            'st-patricks': 'off',
          },
        },
        new Date(2008, 2, 17, 12),
        'en-US',
      )?.holidayId,
    ).toBe('easter')
  })

  it('uses the selected Easter calendar and Thanksgiving region for display windows', () => {
    const preferences = {
      ...defaultPreferences,
      seasonalEasterCalendar: 'orthodox',
      seasonalThanksgivingRegion: 'canada',
    } as const
    const getIcon = (date: Date) =>
      getUpcomingSeasonalIcon(preferences, date, 'en-US')

    expect(getIcon(new Date(2026, 2, 28))).toBeUndefined()
    expect(getIcon(new Date(2026, 2, 29))?.holidayId).toBe('easter')
    expect(getIcon(new Date(2026, 3, 12))?.daysUntil).toBe(0)
    expect(getIcon(new Date(2026, 3, 13))).toBeUndefined()
    expect(getIcon(new Date(2026, 9, 4))).toBeUndefined()
    expect(getIcon(new Date(2026, 9, 5))?.holidayId).toBe('thanksgiving')
    expect(getIcon(new Date(2026, 9, 12))?.daysUntil).toBe(0)
    expect(getIcon(new Date(2026, 9, 13))).toBeUndefined()
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

it('does not force an icon from a hidden seasonal theme', () => {
  expect(
    getThemeIconId({ ...defaultPreferences, themePreset: 'summer' }),
  ).toBeUndefined()
})
