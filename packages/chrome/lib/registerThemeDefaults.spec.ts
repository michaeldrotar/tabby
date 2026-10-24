import { defaultPreferences } from '@extension/core/preferences'
import { describe, expect, it, vi } from 'vitest'
import { CHROME_PREFERENCES_STORAGE_KEY } from './createChromePreferences.js'
import { registerThemeDefaults } from './registerThemeDefaults.js'

const setup = (saved?: Record<string, unknown>) => {
  const api = {
    runtime: { onInstalled: { addListener: vi.fn() } },
    storage: {
      local: {
        get: vi.fn(async () => ({ [CHROME_PREFERENCES_STORAGE_KEY]: saved })),
        set: vi.fn(async () => {}),
      },
    },
  }
  registerThemeDefaults(
    api as unknown as Parameters<typeof registerThemeDefaults>[0],
  )
  const installed = api.runtime.onInstalled.addListener.mock
    .calls[0]![0] as (details: { reason: string }) => Promise<void>
  return { api, installed }
}

describe('theme defaults', () => {
  it('starts new installs with the default theme', async () => {
    const { api, installed } = setup()
    await installed({ reason: 'install' })
    expect(api.storage.local.set).toHaveBeenCalledWith({
      [CHROME_PREFERENCES_STORAGE_KEY]: defaultPreferences,
    })
  })

  it.each([undefined, null, 'reef'])(
    'resets theme %s on extension updates while preserving other preferences',
    async (themePreset) => {
      const { api, installed } = setup({
        ...defaultPreferences,
        theme: 'dark',
        themePreset,
        themeLightBackground: 'slate',
        themeDarkAccent: 'rose',
        themeDarkAccentStrength: 50,
        tabManagerCompactIconMode: 'first',
        seasonalIconsEnabled: false,
      })
      await installed({ reason: 'update' })
      expect(api.storage.local.set).toHaveBeenCalledWith({
        [CHROME_PREFERENCES_STORAGE_KEY]: {
          ...defaultPreferences,
          tabManagerCompactIconMode: 'first',
          seasonalIconsEnabled: false,
        },
      })
    },
  )

  it('keeps the chosen theme when Chrome updates', async () => {
    const { api, installed } = setup({ themePreset: 'reef', theme: 'dark' })
    await installed({ reason: 'chrome_update' })
    expect(api.storage.local.set).not.toHaveBeenCalled()
  })
})
