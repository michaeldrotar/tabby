import type { HostCapabilities } from '@extension/core/browser'

export type ChromeTabManagerHostApi = Pick<
  typeof chrome,
  'action' | 'runtime' | 'windows'
> & {
  sidePanel?: Pick<typeof chrome.sidePanel, 'open'>
  storage?: Pick<typeof chrome.storage, 'session'>
}

/** Host-only effects and cross-window activation signals, with an explicit owner lifecycle. */
export const createChromeTabManagerHost = (
  api: ChromeTabManagerHostApi,
  options: {
    writeClipboardText: (text: string) => Promise<void>
    onWindowActivated: (
      windowId: number,
      tabIds?: readonly number[],
    ) => void | boolean
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
            const tabIds =
              'tabIds' in message &&
              Array.isArray(message.tabIds) &&
              message.tabIds.every((id) => Number.isSafeInteger(id) && id >= 0)
                ? (message.tabIds as number[])
                : undefined
            const received = options.onWindowActivated(
              window.id,
              ...(tabIds ? [tabIds] : []),
            )
            if (tabIds && received !== false)
              await api.storage?.session.remove(`tabby-moved-tabs-${window.id}`)
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
    openWindowTabManager: async (windowId, tabIds) => {
      const operation = generation
      if (!running) return
      if (!Number.isSafeInteger(windowId) || windowId < 0)
        throw new Error('The destination window is invalid.')
      const key = `tabby-moved-tabs-${windowId}`
      const saving = tabIds
        ? api.storage?.session.set({ [key]: [...tabIds] })
        : undefined
      const opening = api.sidePanel?.open({ windowId })
      try {
        await Promise.all([saving, opening])
        await api.runtime
          .sendMessage({
            type: 'TAB_MANAGER_WINDOW_ACTIVATED',
            windowId,
            ...(tabIds ? { tabIds } : {}),
          })
          .catch(() => undefined)
        if (!running || operation !== generation) return
        await api.windows.update(windowId, { focused: true })
      } catch (error) {
        if (tabIds) await api.storage?.session.remove(key)
        throw error
      }
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
    restoreMovedTabs: async () => {
      const windowId = currentWindowId
      const operation = generation
      if (!running || windowId === undefined || !api.storage) return
      const key = `tabby-moved-tabs-${windowId}`
      const stored = (await api.storage.session.get(key))[key]
      if (
        running &&
        operation === generation &&
        Array.isArray(stored) &&
        stored.every((id) => Number.isSafeInteger(id) && id >= 0)
      ) {
        if (options.onWindowActivated(windowId, stored) !== false)
          await api.storage.session.remove(key)
      }
    },
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
