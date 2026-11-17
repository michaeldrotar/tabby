import { expect, it, vi } from 'vitest'
import { CHROME_PREFERENCES_STORAGE_KEY } from './createChromePreferences.js'
import {
  captureChromeWindowStack,
  focusChromeWindow,
  stackChromeWindow,
} from './focusChromeWindow.js'

const bounds = { left: -1440, top: 40, width: 1200, height: 800 }
const setup = (
  stackWindows: unknown = true,
  state: 'normal' | 'maximized' | 'fullscreen' = 'normal',
) => {
  const source = {
    id: 1,
    type: 'normal',
    state,
    ...bounds,
  } as chrome.windows.Window
  const destination = {
    id: 2,
    state: 'maximized',
    left: 100,
    top: 100,
    width: 600,
    height: 400,
    focused: false,
  }
  const api = {
    storage: {
      local: {
        get: vi.fn(async () => ({
          [CHROME_PREFERENCES_STORAGE_KEY]: { stackWindows },
        })),
      },
    },
    windows: {
      getLastFocused: vi.fn(async () => source),
      update: vi.fn(async (_id: number, values: chrome.windows.UpdateInfo) =>
        Object.assign(destination, values),
      ),
    },
  }
  return {
    api,
    source,
    destination,
    chromeApi: api as unknown as typeof chrome,
  }
}

it.each([false, null, 'true'])(
  'only stacks when explicitly enabled: %s',
  async (enabled) => {
    const { api, destination, chromeApi } = setup(enabled)
    await focusChromeWindow(chromeApi, 2)
    expect(destination).toMatchObject({
      left: 100,
      top: 100,
      width: 600,
      height: 400,
      focused: true,
    })
    expect(api.windows.getLastFocused).not.toHaveBeenCalled()
  },
)

it.each(['normal', 'maximized', 'fullscreen'] as const)(
  'matches source bounds and %s state across displays',
  async (state) => {
    const { api, destination, chromeApi } = setup(true, state)
    await focusChromeWindow(chromeApi, 2)
    expect(destination).toMatchObject({ ...bounds, state, focused: true })
    const updates = api.windows.update.mock.calls.map(([, update]) => update)
    expect(updates[0]).toEqual({ state: 'normal' })
    expect(updates.at(-1)).toEqual({ focused: true })
    for (const update of updates)
      if (update.state === 'maximized' || update.state === 'fullscreen')
        expect(update.left).toBeUndefined()
  },
)

it('retains source geometry after moving its last tab closes it', async () => {
  const { api, destination, chromeApi } = setup()
  const source = await captureChromeWindowStack(chromeApi)
  api.windows.getLastFocused.mockRejectedValue(new Error('Window closed'))
  await stackChromeWindow(chromeApi, 2, source)
  expect(destination).toMatchObject({
    ...bounds,
    state: 'normal',
    focused: false,
  })
})

it('leaves the current window geometry alone', async () => {
  const { api, chromeApi } = setup()
  await focusChromeWindow(chromeApi, 1)
  expect(api.windows.update).toHaveBeenCalledExactlyOnceWith(1, {
    focused: true,
  })
})

it('still focuses when storage, source lookup, or positioning fails', async () => {
  const { api, destination, chromeApi } = setup()
  api.storage.local.get.mockRejectedValueOnce(new Error('Storage unavailable'))
  await focusChromeWindow(chromeApi, 2)
  api.windows.getLastFocused.mockRejectedValueOnce(new Error('Window closed'))
  await focusChromeWindow(chromeApi, 2)
  api.windows.update.mockRejectedValueOnce(new Error('Cannot resize'))
  await focusChromeWindow(chromeApi, 2)
  expect(destination.focused).toBe(true)
  expect(api.windows.update).toHaveBeenLastCalledWith(2, { focused: true })
  api.windows.update.mockRejectedValue(new Error('Window closed'))
  await expect(focusChromeWindow(chromeApi, 2)).rejects.toThrow('Window closed')
})
