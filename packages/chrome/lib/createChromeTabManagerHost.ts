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
  },
) => {
  let currentWindowId: number | undefined
  let running = false,
    generation = 0
  const subscribers: (() => void)[] = []
  const onMessage = (
    message: unknown,
    sender: chrome.runtime.MessageSender,
  ) => {
    if (
      !running ||
      sender?.id !== api.runtime.id ||
      !message ||
      typeof message !== 'object'
    )
      return
    if (
      'type' in message &&
      message.type === 'TAB_MANAGER_WINDOW_ACTIVATED' &&
      'windowId' in message &&
      typeof message.windowId === 'number' &&
      Number.isSafeInteger(message.windowId) &&
      message.windowId >= 0
    ) {
      const operation = generation
      void (async () => {
        try {
          const window = await api.windows.getCurrent({})
          if (
            running &&
            operation === generation &&
            window.id !== undefined &&
            window.id === message.windowId
          ) {
            currentWindowId = window.id
            options.onWindowActivated(window.id)
          }
        } catch {
          /* The originating window may already be closed. */
        }
      })()
    }
  }
  const onFocused = (windowId: number) => {
    if (running && windowId === currentWindowId)
      options.onWindowActivated(windowId)
  }
  const requireRunning = () => {
    if (!running) throw new Error('The browser host is not running.')
  }
  const capabilities: HostCapabilities = {
    getCurrentWindowId: () => currentWindowId,
    openWindowTabManager: async (windowId) => {
      const operation = generation
      if (!running) return
      if (!Number.isSafeInteger(windowId) || windowId < 0)
        throw new Error('The destination window is invalid.')
      // Start the panel opening while the originating user gesture is active.
      const opening = api.sidePanel?.open({ windowId })
      const signaling = api.runtime
        .sendMessage({ type: 'TAB_MANAGER_WINDOW_ACTIVATED', windowId })
        .catch(() => undefined)
      await Promise.all([opening, signaling])
      if (!running || operation !== generation) return
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
