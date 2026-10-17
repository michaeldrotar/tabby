import { getMovedTabIds } from '@extension/core'
import { createChromeBackend } from './createChromeBackend.js'
import { createChromeTabManagerHost } from './createChromeTabManagerHost.js'
import type { BrowserCommand } from '@extension/core/browser'

type MoveCommand = Extract<
  BrowserCommand,
  { type: 'move-tabs' | 'move-group' | 'place-tabs' }
>
const isId = (id: unknown): id is number =>
  typeof id === 'number' && Number.isSafeInteger(id) && id >= 0
const isMove = (value: unknown): value is MoveCommand => {
  if (!value || typeof value !== 'object' || !('type' in value)) return false
  if (value.type === 'move-group')
    return (
      'groupId' in value &&
      isId(value.groupId) &&
      (!('windowId' in value) ||
        value.windowId === undefined ||
        isId(value.windowId))
    )
  if (
    !('tabIds' in value) ||
    !Array.isArray(value.tabIds) ||
    !value.tabIds.length ||
    !value.tabIds.every(isId)
  )
    return false
  if (value.type === 'move-tabs')
    return (
      !('windowId' in value) ||
      value.windowId === undefined ||
      isId(value.windowId)
    )
  if (
    value.type !== 'place-tabs' ||
    !('destination' in value) ||
    !value.destination ||
    typeof value.destination !== 'object'
  )
    return false
  const destination = value.destination
  return (
    'windowId' in destination &&
    isId(destination.windowId) &&
    (!('beforeTabId' in destination) ||
      destination.beforeTabId === undefined ||
      isId(destination.beforeTabId)) &&
    (!('groupId' in destination) ||
      destination.groupId === undefined ||
      isId(destination.groupId))
  )
}

/** The worker owns moves that can destroy the originating sidebar. */
export const registerClosingWindowMoves = (api: typeof chrome) => {
  api.runtime.onMessage.addListener(
    (message: unknown, sender, sendResponse) => {
      if (
        sender.id !== api.runtime.id ||
        !message ||
        typeof message !== 'object' ||
        !('type' in message) ||
        message.type !== 'tabby-move-from-closing-window' ||
        !('command' in message) ||
        !isMove(message.command)
      )
        return
      const command = message.command
      void (async () => {
        const backend = createChromeBackend(api)
        const host = createChromeTabManagerHost(api, {
          writeClipboardText: async () => {},
          onWindowActivated: () => {},
        })
        try {
          await backend.start()
          const before = backend.getSnapshot()
          const outcome = await backend.execute(command)
          const movedIds = getMovedTabIds(command, before, outcome)
          const first = backend
            .getSnapshot()
            .tabs.find((tab) => tab.id === movedIds[0])
          if (outcome.status === 'success' && first) {
            const ids = new Set(movedIds)
            const groups = new Set(
              backend
                .getSnapshot()
                .tabs.flatMap((tab) =>
                  ids.has(tab.id) && tab.groupId !== undefined
                    ? [tab.groupId]
                    : [],
                ),
            )
            for (const groupId of groups)
              await backend.execute({
                type: 'set-group-collapsed',
                groupId,
                collapsed: false,
              })
            await backend.execute({ type: 'activate-tab', tabId: first.id })
            await host.start()
            await host.capabilities.openWindowTabManager!(
              first.windowId,
              movedIds,
            )
          }
          sendResponse({ outcome })
        } catch (error) {
          sendResponse({
            outcome: {
              status: 'failed',
              requestedIds: [],
              succeededIds: [],
              failures: [
                {
                  id: -1,
                  message:
                    error instanceof Error
                      ? error.message
                      : 'Could not move tabs.',
                },
              ],
            },
          })
        } finally {
          backend.dispose()
          host.dispose()
        }
      })()
      return true
    },
  )
}
