import { describe, expect, it, vi } from 'vitest'
import { createChromeTabManagerHost } from './createChromeTabManagerHost.js'
import type { ChromeTabManagerHostApi } from './createChromeTabManagerHost.js'

const event = () => {
  const callbacks = new Set<(...args: unknown[]) => void>()
  return {
    addListener: (callback: (...args: unknown[]) => void) =>
      callbacks.add(callback),
    removeListener: (callback: (...args: unknown[]) => void) =>
      callbacks.delete(callback),
    emit: (...args: unknown[]) =>
      callbacks.forEach((callback) => callback(...args)),
    size: () => callbacks.size,
  }
}
const setup = (currentWindowId = 5, onFocusChanged = event()) => {
  const onMessage = event()
  const api = {
    windows: {
      getCurrent: vi.fn(async () => ({ id: currentWindowId })),
      update: vi.fn(async () => ({ id: 9, focused: true })),
      onFocusChanged,
    },
    sidePanel: { open: vi.fn(async () => {}) },
    storage: {
      session: { set: vi.fn(async () => {}), remove: vi.fn(async () => {}) },
    },
    action: { openPopup: vi.fn(async () => {}) },
    runtime: {
      id: 'tabby-test',
      openOptionsPage: vi.fn(async () => {}),
      sendMessage: vi.fn(async () => undefined),
      onMessage,
    },
  }
  const activate = vi.fn(),
    focusChanged = vi.fn(),
    clipboard = vi.fn(async () => {})
  const host = createChromeTabManagerHost(
    api as unknown as ChromeTabManagerHostApi,
    {
      writeClipboardText: clipboard,
      onWindowActivated: activate,
      onWindowFocusChanged: focusChanged,
    },
  )
  return {
    api,
    host,
    activate,
    focusChanged,
    clipboard,
    onMessage,
    onFocusChanged,
  }
}

describe('Chrome Tab Manager host', () => {
  it('targets the current window and handles activation signals only during its owned lifecycle', async () => {
    const { api, host, activate, clipboard, onMessage, onFocusChanged } =
      setup()
    expect(await host.start()).toBe(5)
    await host.start()
    expect(onMessage.size()).toBe(1)
    expect(onFocusChanged.size()).toBe(1)
    await host.capabilities.openSearch!()
    await host.capabilities.openOptions!()
    await host.capabilities.writeClipboardText!('Tabby')
    expect(api.action.openPopup).toHaveBeenCalledWith({ windowId: 5 })
    expect(api.runtime.openOptionsPage).toHaveBeenCalledOnce()
    expect(clipboard).toHaveBeenCalledWith('Tabby')
    await host.capabilities.openWindowTabManager!(9)
    expect(api.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'TAB_MANAGER_WINDOW_ACTIVATED',
      windowId: 9,
    })
    expect(api.sidePanel.open).toHaveBeenCalledWith({ windowId: 9 })
    expect(api.windows.update).toHaveBeenCalledWith(9, { focused: true })
    expect(api.windows.update.mock.invocationCallOrder[0]).toBeGreaterThan(
      api.sidePanel.open.mock.invocationCallOrder[0]!,
    )
    onFocusChanged.emit(9)
    onFocusChanged.emit(5)
    onMessage.emit(
      { type: 'TAB_MANAGER_WINDOW_ACTIVATED', windowId: 9 },
      { id: api.runtime.id },
    )
    onMessage.emit(
      {
        type: 'TAB_MANAGER_WINDOW_ACTIVATED',
        windowId: 'invalid',
      },
      { id: api.runtime.id },
    )
    onMessage.emit(
      { type: 'TAB_MANAGER_WINDOW_ACTIVATED', windowId: 3 },
      { id: 'another-extension' },
    )
    onMessage.emit(
      { type: 'TAB_MANAGER_WINDOW_ACTIVATED', windowId: NaN },
      { id: api.runtime.id },
    )
    await Promise.resolve()
    expect(activate.mock.calls).toEqual([])
    onMessage.emit(
      { type: 'TAB_MANAGER_WINDOW_ACTIVATED', windowId: 5 },
      { id: api.runtime.id },
    )
    await Promise.resolve()
    expect(activate.mock.calls).toEqual([[5]])
    host.dispose()
    onMessage.emit({ type: 'TAB_MANAGER_WINDOW_ACTIVATED', windowId: 2 })
    expect(onMessage.size()).toBe(0)
    expect(onFocusChanged.size()).toBe(0)
    expect(activate).toHaveBeenCalledTimes(1)
    await host.start()
    expect(onMessage.size()).toBe(1)
    host.dispose()
  })

  it('returns every running manager to its own window when browser window focus changes', async () => {
    const first = setup()
    const second = setup(9, first.onFocusChanged)
    await Promise.all([first.host.start(), second.host.start()])

    first.onFocusChanged.emit(-1)
    expect(first.focusChanged).not.toHaveBeenCalled()
    expect(second.focusChanged).not.toHaveBeenCalled()

    first.onFocusChanged.emit(9)
    first.onFocusChanged.emit(5)
    expect(first.focusChanged.mock.calls).toEqual([[5], [5]])
    expect(second.focusChanged.mock.calls).toEqual([[9], [9]])
    expect(first.host.capabilities.getCurrentWindowId!()).toBe(5)
    expect(second.host.capabilities.getCurrentWindowId!()).toBe(9)

    first.host.dispose()
    first.onFocusChanged.emit(9)
    expect(first.focusChanged).toHaveBeenCalledTimes(2)
    expect(second.focusChanged).toHaveBeenCalledTimes(3)
    second.host.dispose()
    expect(first.onFocusChanged.size()).toBe(0)
  })

  it('does not restore a disposed current-window lookup after restarting', async () => {
    const { api, host } = setup()
    let resolve!: (value: { id: number }) => void
    api.windows.getCurrent.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const initial = host.start()
    host.dispose()
    await host.start()
    resolve({ id: 99 })
    expect(await initial).toBeUndefined()
    expect(host.capabilities.getCurrentWindowId!()).toBe(5)
    host.dispose()
  })
})

it('retains a moved selection until the destination is ready, then consumes it once', async () => {
  const { api } = setup()
  const stored: Record<string, unknown> = { 'tabby-moved-tabs-5': [11, 12] }
  const session = {
    get: async (key: string) => ({ [key]: stored[key] }),
    remove: async (key: string) => {
      delete stored[key]
    },
  }
  let ready = false
  const received: number[][] = []
  const host = createChromeTabManagerHost(
    { ...api, storage: { session } } as unknown as ChromeTabManagerHostApi,
    {
      writeClipboardText: async () => {},
      onWindowActivated: (_, ids) => {
        if (!ready) return false
        if (ids) received.push([...ids])
        return true
      },
    },
  )
  await host.start()
  await host.restoreMovedTabs()
  expect(stored).toEqual({ 'tabby-moved-tabs-5': [11, 12] })
  ready = true
  await host.restoreMovedTabs()
  await host.restoreMovedTabs()
  expect(received).toEqual([[11, 12]])
  expect(stored).toEqual({})
  host.dispose()
})
