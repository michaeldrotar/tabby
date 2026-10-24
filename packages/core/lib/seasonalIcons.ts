export const SEASONAL_HOLIDAYS = [
  {
    id: 'valentines',
    name: "Valentine's Day",
    dateLabel: 'February 14',
    iconOptions: [
      { id: 'valentines-heart-eyes', name: 'Heart eyes' },
      { id: 'valentines-heart-hoodie', name: 'Heart hoodie' },
      { id: 'valentines-love-bow', name: 'Love bow' },
    ],
  },
  {
    id: 'st-patricks',
    name: "St. Patrick's Day",
    dateLabel: 'March 17',
    iconOptions: [
      { id: 'st-patricks-shamrock', name: 'Shamrock scarf' },
      { id: 'st-patricks-lucky-hat', name: 'Leprechaun hat' },
      { id: 'st-patricks-shamrock-hoodie', name: 'Shamrock hoodie' },
    ],
  },
  {
    id: 'easter',
    name: 'Easter',
    iconOptions: [
      { id: 'easter-bunny-ears', name: 'Bunny ears' },
      { id: 'easter-chick-hoodie', name: 'Peep hoodie' },
      { id: 'easter-painted-egg', name: 'Painted egg' },
    ],
  },
  {
    id: 'summer',
    name: 'Summer',
    dateLabel: 'June–August',
    iconOptions: [
      { id: 'summer-sunhat', name: 'Sun hat' },
      { id: 'summer-snorkel', name: 'Snorkel' },
      { id: 'summer-hibiscus', name: 'Hibiscus' },
    ],
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    iconOptions: [
      { id: 'thanksgiving-harvest-leaf', name: 'Harvest leaf' },
      { id: 'thanksgiving-harvest-scarf', name: 'Harvest scarf' },
      { id: 'thanksgiving-pumpkin-hoodie', name: 'Pumpkin hoodie' },
    ],
  },
  {
    id: 'halloween',
    name: 'Halloween',
    dateLabel: 'October 31',
    iconOptions: [
      { id: 'halloween-witch-hat', name: 'Witch hat' },
      { id: 'halloween-fangs', name: 'Vampire fangs' },
      { id: 'halloween-frankenstein-hoodie', name: 'Frankencat' },
    ],
  },
  {
    id: 'christmas',
    name: 'Christmas',
    dateLabel: 'December 25',
    iconOptions: [
      { id: 'christmas-santa-hat', name: 'Santa hat' },
      { id: 'christmas-candy-cane-scarf', name: 'Candy cane scarf' },
      { id: 'christmas-reindeer', name: 'Reindeer' },
    ],
  },
] as const

export type SeasonalHolidayId = (typeof SEASONAL_HOLIDAYS)[number]['id']
export type SeasonalIconId =
  (typeof SEASONAL_HOLIDAYS)[number]['iconOptions'][number]['id']
export type SeasonalIconSelections = Record<
  SeasonalHolidayId,
  SeasonalIconId | 'off'
>
export type SeasonalEasterCalendar = 'local' | 'western' | 'orthodox'
export type SeasonalThanksgivingRegion = 'local' | 'us' | 'canada'

export const DEFAULT_SEASONAL_ICON_SELECTIONS: Readonly<SeasonalIconSelections> =
  Object.freeze({
    valentines: 'valentines-heart-hoodie',
    'st-patricks': 'st-patricks-shamrock-hoodie',
    easter: 'easter-chick-hoodie',
    summer: 'summer-sunhat',
    thanksgiving: 'thanksgiving-pumpkin-hoodie',
    halloween: 'halloween-frankenstein-hoodie',
    christmas: 'christmas-santa-hat',
  })

export type SeasonalIconPreferences = {
  seasonalIconsEnabled: boolean
  seasonalIconSelections: SeasonalIconSelections
  seasonalEasterCalendar: SeasonalEasterCalendar
  seasonalThanksgivingRegion: SeasonalThanksgivingRegion
}

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000
const SEASONAL_ICON_LEAD_DAYS: Record<SeasonalHolidayId, number> = {
  valentines: 13,
  'st-patricks': 7,
  easter: 14,
  summer: 91,
  thanksgiving: 7,
  halloween: 16,
  christmas: 24,
}
const ORTHODOX_EASTER_REGIONS = new Set([
  'BG',
  'BY',
  'CY',
  'GE',
  'GR',
  'ME',
  'MK',
  'MD',
  'RO',
  'RS',
  'RU',
  'UA',
])
const ORTHODOX_EASTER_LANGUAGES = new Set([
  'be',
  'bg',
  'el',
  'ka',
  'mk',
  'ro',
  'ru',
  'sr',
  'uk',
])

const getLocaleParts = (locale: string) => {
  try {
    const parsed = new Intl.Locale(locale)
    return {
      language: parsed.language.toLowerCase(),
      region: parsed.region?.toUpperCase(),
    }
  } catch {
    return { language: '', region: undefined }
  }
}

const getLocalEasterCalendar = (locale: string): 'western' | 'orthodox' => {
  const { language, region } = getLocaleParts(locale)
  return region && ORTHODOX_EASTER_REGIONS.has(region)
    ? 'orthodox'
    : !region && ORTHODOX_EASTER_LANGUAGES.has(language)
      ? 'orthodox'
      : 'western'
}

const getThanksgivingRegion = (
  setting: SeasonalThanksgivingRegion,
  locale: string,
): 'us' | 'canada' => {
  if (setting !== 'local') return setting
  return getLocaleParts(locale).region === 'CA' ? 'canada' : 'us'
}

const getWesternEaster = (year: number) => {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const value = h + l - 7 * m + 114
  return new Date(year, Math.floor(value / 31) - 1, (value % 31) + 1)
}

const getOrthodoxEaster = (year: number) => {
  const a = year % 4
  const b = year % 7
  const c = year % 19
  const d = (19 * c + 15) % 30
  const e = (2 * a + 4 * b - d + 34) % 7
  const value = d + e + 114
  const julianMonth = Math.floor(value / 31)
  const julianDay = (value % 31) + 1
  const julianGregorianOffset =
    Math.floor(year / 100) - Math.floor(year / 400) - 2
  return new Date(year, julianMonth - 1, julianDay + julianGregorianOffset)
}

const getNthWeekday = (
  year: number,
  monthIndex: number,
  weekday: number,
  occurrence: number,
) => {
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const firstOccurrence = 1 + ((weekday - firstWeekday + 7) % 7)
  return new Date(year, monthIndex, firstOccurrence + 7 * (occurrence - 1))
}

export const isSeasonalIconChoice = (
  holidayId: SeasonalHolidayId,
  value: unknown,
): value is SeasonalIconId | 'off' => {
  if (value === 'off') return true
  const holiday = SEASONAL_HOLIDAYS.find((item) => item.id === holidayId)
  return Boolean(holiday?.iconOptions.some((option) => option.id === value))
}

export const normalizeSeasonalIconSelections = (
  value: unknown,
): SeasonalIconSelections => {
  const record =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  return Object.fromEntries(
    SEASONAL_HOLIDAYS.map((holiday) => {
      const candidate = record[holiday.id]
      return [
        holiday.id,
        isSeasonalIconChoice(holiday.id, candidate)
          ? candidate
          : DEFAULT_SEASONAL_ICON_SELECTIONS[holiday.id],
      ]
    }),
  ) as SeasonalIconSelections
}

export const isSeasonalIconSelections = (
  value: unknown,
): value is SeasonalIconSelections => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return SEASONAL_HOLIDAYS.every((holiday) =>
    isSeasonalIconChoice(holiday.id, record[holiday.id]),
  )
}

export const getSeasonalHolidayDate = (
  holidayId: SeasonalHolidayId,
  year: number,
  preferences: Pick<
    SeasonalIconPreferences,
    'seasonalEasterCalendar' | 'seasonalThanksgivingRegion'
  >,
  locale: string,
): Date => {
  switch (holidayId) {
    case 'valentines':
      return new Date(year, 1, 14)
    case 'st-patricks':
      return new Date(year, 2, 17)
    case 'easter': {
      const calendar =
        preferences.seasonalEasterCalendar === 'local'
          ? getLocalEasterCalendar(locale)
          : preferences.seasonalEasterCalendar
      return calendar === 'orthodox'
        ? getOrthodoxEaster(year)
        : getWesternEaster(year)
    }
    case 'thanksgiving': {
      const region = getThanksgivingRegion(
        preferences.seasonalThanksgivingRegion,
        locale,
      )
      return region === 'canada'
        ? getNthWeekday(year, 9, 1, 2)
        : getNthWeekday(year, 10, 4, 4)
    }
    case 'summer':
      return new Date(year, 7, 31)
    case 'halloween':
      return new Date(year, 9, 31)
    case 'christmas':
      return new Date(year, 11, 25)
  }
}

const getLocalDayNumber = (date: Date) =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) /
  DAY_IN_MILLISECONDS

export const getUpcomingSeasonalIcon = (
  preferences: SeasonalIconPreferences,
  today: Date,
  locale: string,
):
  | { holidayId: SeasonalHolidayId; iconId: SeasonalIconId; daysUntil: number }
  | undefined => {
  if (!preferences.seasonalIconsEnabled) return undefined

  const todayNumber = getLocalDayNumber(today)
  let closest:
    | {
        holidayId: SeasonalHolidayId
        iconId: SeasonalIconId
        daysUntil: number
      }
    | undefined

  for (const holiday of SEASONAL_HOLIDAYS) {
    const iconId = preferences.seasonalIconSelections[holiday.id]
    if (iconId === 'off') continue

    const holidayYear =
      today.getFullYear() -
      (holiday.id === 'christmas' && today.getMonth() === 0 ? 1 : 0)
    const holidayDate = getSeasonalHolidayDate(
      holiday.id,
      holidayYear,
      preferences,
      locale,
    )
    const daysUntil = getLocalDayNumber(holidayDate) - todayNumber
    const trailingDays = holiday.id === 'christmas' ? 7 : 0
    if (
      daysUntil >= -trailingDays &&
      daysUntil <= SEASONAL_ICON_LEAD_DAYS[holiday.id] &&
      (!closest || daysUntil < closest.daysUntil)
    ) {
      closest = { holidayId: holiday.id, iconId, daysUntil }
    }
  }

  return closest
}
