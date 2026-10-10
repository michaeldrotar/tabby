import { defaultPreferences } from '@extension/core/preferences'
import { describe, expect, it, vi } from 'vitest'
import { createChromePreferences } from './createChromePreferences.js'
import type { ChromePreferencesApi } from './createChromePreferences.js'

const storageKey = 'preference-storage-key'

const mockStorage = () => {
  const listeners = new Set<
    (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => void
  >()
  let data: Record<string, unknown> = {
    [storageKey]: { ...defaultPreferences, theme: 'dark' },
  }
  const emit = (value: unknown, area = 'local') => {
    listeners.forEach((listener) =>
      listener({ [storageKey]: { newValue: value } }, area),
    )
  }
  const api = {
    storage: {
      local: {
        get: vi.fn(async () => structuredClone(data)),
        remove: vi.fn(async (key: string) => {
          delete data[key]
          emit(undefined)
        }),
        set: vi.fn(async (values: Record<string, unknown>) => {
          data = { ...data, ...values }
          emit(data[storageKey])
        }),
      },
      onChanged: {
        addListener: (
          listener: (
            changes: Record<string, chrome.storage.StorageChange>,
            area: string,
          ) => void,
        ) => listeners.add(listener),
        removeListener: (
          listener: (
            changes: Record<string, chrome.storage.StorageChange>,
            area: string,
          ) => void,
        ) => listeners.delete(listener),
      },
    },
  }
  return {
    api: api as unknown as ChromePreferencesApi,
    mock: api,
    emit,
    size: () => listeners.size,
  }
}

describe('Chrome preferences', () => {
  it('preserves the storage key, merges queued patches, syncs local changes, and cleans up', async () => {
    const { api, mock, emit, size } = mockStorage()
    const preferences = createChromePreferences(api)
    expect(preferences.getSnapshot()).toEqual(defaultPreferences)
    await preferences.start()
    expect(preferences.getSnapshot().theme).toBe('dark')
    await Promise.all([
      preferences.set({ theme: 'light' }),
      preferences.set({ tabManagerCompactLayout: 'list' }),
    ])
    expect(mock.storage.local.set).toHaveBeenLastCalledWith({
      [storageKey]: {
        ...defaultPreferences,
        theme: 'light',
        tabManagerCompactLayout: 'list',
      },
    })
    emit({ theme: 'dark' }, 'sync')
    expect(preferences.getSnapshot().theme).toBe('light')
    emit({ theme: 'dark' })
    expect(preferences.getSnapshot()).toEqual({
      ...defaultPreferences,
      theme: 'dark',
    })
    await preferences.reset()
    expect(mock.storage.local.remove).toHaveBeenCalledWith(storageKey)
    expect(preferences.getSnapshot()).toEqual(defaultPreferences)
    preferences.dispose()
    expect(size()).toBe(0)
    await expect(preferences.set({ theme: 'light' })).rejects.toThrow(
      'not running',
    )
  })

  it('waits for persisted values before applying an early edit and reports write failures', async () => {
    const { api, mock, size } = mockStorage()
    let finish!: (value: Record<string, unknown>) => void
    mock.storage.local.get.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const preferences = createChromePreferences(api)
    const loading = preferences.start()
    const editing = preferences.set({ tabManagerCompactLayout: 'list' })
    await Promise.resolve()
    expect(mock.storage.local.set).not.toHaveBeenCalled()
    finish({ [storageKey]: { ...defaultPreferences, theme: 'dark' } })
    await Promise.all([loading, editing])
    expect(preferences.getSnapshot()).toMatchObject({
      theme: 'dark',
      tabManagerCompactLayout: 'list',
    })
    mock.storage.local.set.mockRejectedValueOnce(
      new Error('Storage unavailable.'),
    )
    await expect(preferences.set({ theme: 'light' })).rejects.toThrow(
      'Storage unavailable.',
    )
    expect(preferences.getSnapshot().theme).toBe('dark')
    preferences.dispose()
    mock.storage.local.get.mockRejectedValueOnce(new Error('Read failed.'))
    await expect(preferences.start()).rejects.toThrow('Read failed.')
    expect(size()).toBe(0)
    await preferences.start()
    expect(size()).toBe(1)
    preferences.dispose()
  })

  it('does not publish late writes over a live event or a restarted connection', async () => {
    const { api, mock, emit } = mockStorage()
    let finish!: () => void
    mock.storage.local.set.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const preferences = createChromePreferences(api)
    await preferences.start()
    const editing = preferences.set({ theme: 'light' })
    await vi.waitFor(() =>
      expect(mock.storage.local.set).toHaveBeenCalledOnce(),
    )
    emit({ ...defaultPreferences, theme: 'system' })
    finish()
    await editing
    expect(preferences.getSnapshot().theme).toBe('system')
    mock.storage.local.set.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const oldEdit = preferences.set({ theme: 'light' })
    await vi.waitFor(() =>
      expect(mock.storage.local.set).toHaveBeenCalledTimes(2),
    )
    preferences.dispose()
    await preferences.start()
    const current = preferences.getSnapshot()
    finish()
    await oldEdit
    expect(preferences.getSnapshot()).toBe(current)
    preferences.dispose()
  })

  it('protects current data from initial-load races and loads from a disposed generation', async () => {
    const { api, mock, emit, size } = mockStorage()
    let finish!: (value: Record<string, unknown>) => void
    mock.storage.local.get.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const preferences = createChromePreferences(api)
    const oldLoad = preferences.start()
    emit({ theme: 'light' })
    finish({ [storageKey]: { theme: 'dark' } })
    await oldLoad
    expect(preferences.getSnapshot().theme).toBe('light')
    preferences.dispose()
    await preferences.start()
    expect(preferences.getSnapshot().theme).toBe('dark')
    expect(size()).toBe(1)
    preferences.dispose()
  })
})
