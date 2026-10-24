import { defaultPreferences } from '@extension/core'
import { describe, expect, it, vi } from 'vitest'
import { CHROME_PREFERENCES_STORAGE_KEY } from './createChromePreferences.js'
import {
  getSeasonalActionIconPaths,
  registerSeasonalActionIcon,
  SEASONAL_ICON_DATE_ALARM,
} from './registerSeasonalActionIcon.js'
import type { SeasonalActionIconApi } from './registerSeasonalActionIcon.js'

const createStorageChangeEvent = () => {
  const listeners: Array<
    (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => void
  > = []
  return {
    addListener: (listener: (typeof listeners)[number]) => {
      listeners.push(listener)
    },
    emit: (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => listeners.forEach((listener) => listener(changes, areaName)),
  }
}

const createApi = () => {
  let preferences: unknown = { ...defaultPreferences }
  const storageChanges = createStorageChangeEvent()
  const api = {
    action: { setIcon: vi.fn(async () => {}) },
    alarms: {
      create: vi.fn(async () => {}),
      onAlarm: { addListener: vi.fn() },
    },
    i18n: { getUILanguage: () => 'en-US' },
    runtime: {
      onInstalled: { addListener: vi.fn() },
      onStartup: { addListener: vi.fn() },
    },
    storage: {
      local: {
        get: vi.fn(async () => ({
          [CHROME_PREFERENCES_STORAGE_KEY]: preferences,
        })),
      },
      onChanged: storageChanges,
    },
  }
  return {
    api: api as unknown as SeasonalActionIconApi,
    mock: api,
    storageChanges,
    setPreferences: (next: unknown) => {
      preferences = next
    },
  }
}

describe('seasonal action icon', () => {
  it('uses the chosen summer icon during the summer season', async () => {
    const { api, mock, setPreferences } = createApi()
    setPreferences({
      ...defaultPreferences,
      themePreset: 'summer',
      seasonalIconSelections: {
        ...defaultPreferences.seasonalIconSelections,
        summer: 'summer-snorkel',
      },
    })
    registerSeasonalActionIcon(api, () => new Date(2026, 6, 24, 12))
    await vi.waitFor(() =>
      expect(mock.action.setIcon).toHaveBeenCalledWith({
        path: getSeasonalActionIconPaths('summer-snorkel'),
      }),
    )
  })
  it('shows the chosen holiday icon during its lead-in and schedules a local-day refresh', async () => {
    const { api, mock } = createApi()
    registerSeasonalActionIcon(api, () => new Date(2026, 9, 24, 12))

    await vi.waitFor(() => expect(mock.action.setIcon).toHaveBeenCalledOnce())
    expect(mock.action.setIcon).toHaveBeenCalledWith({
      path: {
        16: 'seasonal-icons/halloween-frankenstein-hoodie-16.png',
        32: 'seasonal-icons/halloween-frankenstein-hoodie-32.png',
        48: 'seasonal-icons/halloween-frankenstein-hoodie-48.png',
        128: 'seasonal-icons/halloween-frankenstein-hoodie-128.png',
      },
    })
    expect(
      Object.keys(getSeasonalActionIconPaths('halloween-frankenstein-hoodie')),
    ).toEqual(['16', '32', '48', '128'])
    expect(mock.alarms.create).toHaveBeenCalledWith(SEASONAL_ICON_DATE_ALARM, {
      when: new Date(2026, 9, 25).getTime(),
    })
  })

  it('restores Tabby’s regular toolbar icon when the feature is turned off', async () => {
    const { api, mock, setPreferences, storageChanges } = createApi()
    registerSeasonalActionIcon(api, () => new Date(2026, 9, 24, 12))
    await vi.waitFor(() => expect(mock.action.setIcon).toHaveBeenCalledOnce())

    const disabledPreferences = {
      ...defaultPreferences,
      seasonalIconsEnabled: false,
    }
    setPreferences(disabledPreferences)
    storageChanges.emit(
      {
        [CHROME_PREFERENCES_STORAGE_KEY]: {
          newValue: disabledPreferences,
        },
      },
      'local',
    )

    await vi.waitFor(() => expect(mock.action.setIcon).toHaveBeenCalledTimes(2))
    expect(mock.action.setIcon).toHaveBeenLastCalledWith({
      path: {
        16: 'tabby-face-16.png',
        32: 'tabby-face-32.png',
        48: 'tabby-face-48.png',
        128: 'tabby-face-128.png',
      },
    })
  })
})
