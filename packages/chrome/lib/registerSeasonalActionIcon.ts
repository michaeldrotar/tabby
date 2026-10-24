import {
  getThemeIconId,
  getUpcomingSeasonalIcon,
  normalizePreferences,
} from '@extension/core'
import { CHROME_PREFERENCES_STORAGE_KEY } from './createChromePreferences.js'
import type { SeasonalIconId, ThemeIconId } from '@extension/core'

export const SEASONAL_ICON_DATE_ALARM = 'seasonal-icon-date-check'

const ICON_SIZES = [16, 32, 48, 128] as const
type IconPathSet = Record<(typeof ICON_SIZES)[number], string>

const DEFAULT_ICON_PATHS: IconPathSet = {
  16: 'tabby-face-16.png',
  32: 'tabby-face-32.png',
  48: 'tabby-face-48.png',
  128: 'tabby-face-128.png',
}

export const getSeasonalActionIconPaths = (
  iconId: SeasonalIconId | ThemeIconId,
): IconPathSet =>
  Object.fromEntries(
    ICON_SIZES.map((size) => [size, `seasonal-icons/${iconId}-${size}.png`]),
  ) as IconPathSet

export type SeasonalActionIconApi = Pick<
  typeof chrome,
  'action' | 'alarms' | 'i18n' | 'runtime' | 'storage'
>

export const registerSeasonalActionIcon = (
  api: SeasonalActionIconApi,
  now: () => Date = () => new Date(),
): void => {
  const scheduleNextDateCheck = async (currentDate: Date) => {
    const nextLocalMidnight = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + 1,
    )
    await api.alarms.create(SEASONAL_ICON_DATE_ALARM, {
      when: nextLocalMidnight.getTime(),
    })
  }

  const refresh = async () => {
    const currentDate = now()
    try {
      const values = await api.storage.local.get(CHROME_PREFERENCES_STORAGE_KEY)
      const preferences = normalizePreferences(
        values[CHROME_PREFERENCES_STORAGE_KEY],
      )
      const currentIcon =
        getThemeIconId(preferences) ??
        getUpcomingSeasonalIcon(
          preferences,
          currentDate,
          api.i18n.getUILanguage(),
        )?.iconId
      await api.action.setIcon({
        path: currentIcon
          ? getSeasonalActionIconPaths(currentIcon)
          : DEFAULT_ICON_PATHS,
      })
    } catch (error: unknown) {
      console.warn('Could not refresh the seasonal Tabby icon.', error)
    }

    try {
      await scheduleNextDateCheck(currentDate)
    } catch (error: unknown) {
      console.warn('Could not schedule the next seasonal icon check.', error)
    }
  }

  api.runtime.onInstalled.addListener(() => {
    void refresh()
  })
  api.runtime.onStartup.addListener(() => {
    void refresh()
  })
  api.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === SEASONAL_ICON_DATE_ALARM) void refresh()
  })
  api.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[CHROME_PREFERENCES_STORAGE_KEY]) {
      void refresh()
    }
  })

  void refresh()
}
