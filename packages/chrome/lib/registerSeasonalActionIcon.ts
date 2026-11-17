import {
  getIncognitoIconPath,
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
  'action' | 'alarms' | 'i18n' | 'runtime' | 'storage' | 'tabs'
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

  const refresh = async (tab?: chrome.tabs.Tab) => {
    const currentDate = now()
    try {
      const values = await api.storage.local.get(CHROME_PREFERENCES_STORAGE_KEY)
      const preferences = normalizePreferences(
        values[CHROME_PREFERENCES_STORAGE_KEY],
      )
      if (!tab) {
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
      }
      const tabs = tab ? [tab] : await api.tabs.query({})
      const incognitoPaths = Object.fromEntries(
        ICON_SIZES.map((size) => [
          size,
          getIncognitoIconPath(preferences.incognitoIcon, size),
        ]),
      ) as IconPathSet
      await Promise.all(
        tabs.map(async (currentTab) => {
          if (!currentTab.incognito || currentTab.id === undefined) return
          try {
            await api.action.setIcon({
              tabId: currentTab.id,
              path: incognitoPaths,
            })
          } catch (error: unknown) {
            console.warn('Could not refresh the incognito Tabby icon.', error)
          }
        }),
      )
    } catch (error: unknown) {
      console.warn('Could not refresh the seasonal Tabby icon.', error)
    }

    if (tab) return
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
  api.tabs.onCreated.addListener((tab) => {
    if (tab.incognito) void refresh(tab)
  })
  api.tabs.onReplaced.addListener((addedTabId) => {
    void (async () => {
      try {
        const tab = await api.tabs.get(addedTabId)
        if (tab.incognito) await refresh(tab)
      } catch (error: unknown) {
        console.warn('Could not refresh the replaced Tabby icon.', error)
      }
    })()
  })

  void refresh()
}
