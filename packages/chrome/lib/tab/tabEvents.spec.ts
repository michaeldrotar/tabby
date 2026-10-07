import {
  clearDiagnostics,
  stopDiagnostics,
} from '@extension/shared/devDiagnostics'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBrowserStore } from '../useBrowserStore.js'
import {
  registerChromeTabEventHandlers,
  unregisterChromeTabEventHandlers,
} from './tabEvents.js'
import type { BrowserTab } from './BrowserTab.js'

type Listener = (...args: unknown[]) => void

const createEvent = () => {
  const listeners = new Set<Listener>()
  return {
    addListener: vi.fn((listener: Listener) => listeners.add(listener)),
    removeListener: vi.fn((listener: Listener) => listeners.delete(listener)),
    fire: (...args: unknown[]) =>
      listeners.forEach((listener) => listener(...args)),
    listenerCount: () => listeners.size,
  }
}

describe('tab event diagnostics', () => {
  const events = {
    onActivated: createEvent(),
    onAttached: createEvent(),
    onCreated: createEvent(),
    onDetached: createEvent(),
    onHighlighted: createEvent(),
    onMoved: createEvent(),
    onRemoved: createEvent(),
    onReplaced: createEvent(),
    onUpdated: createEvent(),
  }

  beforeEach(() => {
    vi.stubGlobal('chrome', {
      tabs: { ...events, get: vi.fn() },
      windows: { WINDOW_ID_NONE: -1 },
    })
    useBrowserStore.setState({
      tabById: {
        42: { id: 42, title: 'Before', lifecycle: 'loaded' } as BrowserTab,
      },
    })
  })

  afterEach(() => {
    unregisterChromeTabEventHandlers()
    stopDiagnostics()
    clearDiagnostics()
    useBrowserStore.setState({ tabById: {} })
    vi.unstubAllGlobals()
    Object.values(events).forEach((event) => {
      event.addListener.mockClear()
      event.removeListener.mockClear()
    })
  })

  it('removes and restores one handler across register cycles', () => {
    const chromeTab = {
      id: 42,
      title: 'After',
      status: 'complete',
    } as chrome.tabs.Tab

    registerChromeTabEventHandlers()
    events.onUpdated.fire(42, { title: 'After' }, chromeTab)
    unregisterChromeTabEventHandlers()

    expect(events.onUpdated.listenerCount()).toBe(0)
    expect(useBrowserStore.getState().tabById[42]?.title).toBe('After')

    registerChromeTabEventHandlers()
    events.onUpdated.fire(
      42,
      { title: 'After again' },
      {
        ...chromeTab,
        title: 'After again',
      },
    )

    expect(events.onUpdated.listenerCount()).toBe(1)
    expect(events.onUpdated.addListener).toHaveBeenCalledTimes(2)
  })
})
