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
const setup = () => {
  const onMessage = event(),
    onFocusChanged = event()
  const api = {
    windows: { getCurrent: vi.fn(async () => ({ id: 5 })), onFocusChanged },
    sidePanel: { open: vi.fn(async () => {}) },
    action: { openPopup: vi.fn(async () => {}) },
    runtime: {
      openOptionsPage: vi.fn(async () => {}),
      sendMessage: vi.fn(async () => undefined),
      onMessage,
    },
  }
  const activate = vi.fn(),
    clipboard = vi.fn(async () => {})
  const host = createChromeTabManagerHost(
    api as unknown as ChromeTabManagerHostApi,
    { writeClipboardText: clipboard, onWindowActivated: activate },
  )
  return { api, host, activate, clipboard, onMessage, onFocusChanged }
}

describe('Chrome Tab Manager host', () => {
  it('targets the current window and handles activation signals only during its owned lifecycle', async () => {
    const { api, host, activate, clipboard, onMessage, onFocusChanged } =
      setup()
    expect(await host.start()).toBe(5)
    await host.start()
    expect(onMessage.size()).toBe(1)
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
    onFocusChanged.emit(9)
    onFocusChanged.emit(5)
    onMessage.emit({ type: 'TAB_MANAGER_WINDOW_ACTIVATED', windowId: 9 })
    onMessage.emit({
      type: 'TAB_MANAGER_WINDOW_ACTIVATED',
      windowId: 'invalid',
    })
    expect(activate.mock.calls).toEqual([[5], [9]])
    host.dispose()
    onMessage.emit({ type: 'TAB_MANAGER_WINDOW_ACTIVATED', windowId: 2 })
    expect(onMessage.size()).toBe(0)
    expect(onFocusChanged.size()).toBe(0)
    expect(activate).toHaveBeenCalledTimes(2)
    await host.start()
    expect(onMessage.size()).toBe(1)
    host.dispose()
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
