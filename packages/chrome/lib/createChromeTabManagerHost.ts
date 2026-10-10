import type { HostCapabilities } from '@extension/core/browser'

export type ChromeTabManagerHostApi = Pick<
  typeof chrome,
  'action' | 'runtime' | 'windows'
> & { sidePanel?: Pick<typeof chrome.sidePanel, 'open'> }

/** Host-only effects and cross-window activation signals, with an explicit owner lifecycle. */
export const createChromeTabManagerHost = (
  api: ChromeTabManagerHostApi,
  options: {
    writeClipboardText: (text: string) => Promise<void>
    onWindowActivated: (windowId: number) => void
    onSidebarExpandedChange?: (expanded: boolean) => void | Promise<void>
  },
) => {
  let currentWindowId: number | undefined
  let running = false,
    generation = 0
  const subscribers: (() => void)[] = []
  const onMessage = (message: unknown) => {
    if (!running || !message || typeof message !== 'object') return
    if (
      'type' in message &&
      message.type === 'TAB_MANAGER_WINDOW_ACTIVATED' &&
      'windowId' in message &&
      typeof message.windowId === 'number'
    )
      options.onWindowActivated(message.windowId)
  }
  const onFocused = (windowId: number) => {
    if (running && windowId === currentWindowId)
      options.onWindowActivated(windowId)
  }
  const requireRunning = () => {
    if (!running) throw new Error('The browser host is not running.')
  }
  const capabilities: HostCapabilities = {
    onSidebarExpandedChange: options.onSidebarExpandedChange
      ? async (expanded) => {
          requireRunning()
          await options.onSidebarExpandedChange?.(expanded)
        }
      : undefined,
    getCurrentWindowId: () => currentWindowId,
    openWindowTabManager: async (windowId) => {
      const operation = generation
      if (!running) return
      await api.runtime
        .sendMessage({ type: 'TAB_MANAGER_WINDOW_ACTIVATED', windowId })
        .catch(() => {})
      if (running && operation === generation)
        await api.sidePanel?.open({ windowId }).catch(() => {})
    },
    openSearch: async () => {
      requireRunning()
      await api.action.openPopup(
        currentWindowId === undefined
          ? undefined
          : { windowId: currentWindowId },
      )
    },
    openOptions: async () => {
      requireRunning()
      await api.runtime.openOptionsPage()
    },
    writeClipboardText: async (text) => {
      requireRunning()
      await options.writeClipboardText(text)
    },
  }
  return {
    capabilities,
    start: async () => {
      if (running) return currentWindowId
      running = true
      const operation = ++generation
      api.runtime.onMessage.addListener(onMessage)
      api.windows.onFocusChanged.addListener(onFocused)
      subscribers.push(
        () => api.runtime.onMessage.removeListener(onMessage),
        () => api.windows.onFocusChanged.removeListener(onFocused),
      )
      const current = await api.windows.getCurrent({})
      if (running && operation === generation) currentWindowId = current.id
      return running && operation === generation ? currentWindowId : undefined
    },
    dispose: () => {
      running = false
      generation++
      subscribers.splice(0).forEach((unsubscribe) => unsubscribe())
      currentWindowId = undefined
    },
  }
}
