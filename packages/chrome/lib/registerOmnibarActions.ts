import { createAsyncQueue } from '@extension/core/asyncQueue'
import {
  getOmnibarExecutionChoices,
  readOmnibarChoices,
} from '@extension/core/omnibarChoices'
import { createChromeOmnibarNavigator } from './createChromeOmnibarNavigator.js'
import {
  isPrivateOmnibar,
  loadChromeOmnibarChoices,
  saveChromeOmnibarChoices,
} from './omnibarChoices.js'
import type { OmnibarAction } from '@extension/core'

const isId = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const isAction = (value: unknown): value is OmnibarAction => {
  if (!value || typeof value !== 'object' || !('kind' in value)) return false
  switch (value.kind) {
    case 'url':
      return 'url' in value && typeof value.url === 'string'
    case 'tab':
      return (
        'tabId' in value &&
        isId(value.tabId) &&
        'windowId' in value &&
        isId(value.windowId) &&
        (!('url' in value) ||
          value.url === undefined ||
          typeof value.url === 'string')
      )
    case 'window':
      return 'windowId' in value && isId(value.windowId)
    case 'group':
      return 'groupId' in value && isId(value.groupId)
    case 'restore':
      return 'sessionId' in value && typeof value.sessionId === 'string'
    case 'tab-manager':
    case 'options':
      return true
    default:
      return false
  }
}

/** The worker finishes navigation and learning even when activation closes the popup. */
export const registerOmnibarActions = (api: typeof chrome) => {
  const writes = createAsyncQueue()
  api.runtime.onMessage.addListener((message: unknown, sender, respond) => {
    if (
      sender.id === api.runtime.id &&
      message &&
      typeof message === 'object' &&
      'type' in message &&
      message.type === 'tabby-omnibar-choices' &&
      'windowId' in message &&
      isId(message.windowId)
    ) {
      const windowId = message.windowId
      void (async () => {
        try {
          respond({
            choices: await writes.run(() =>
              loadChromeOmnibarChoices(api, windowId),
            ),
          })
        } catch {
          respond({ choices: [] })
        }
      })()
      return true
    }
    if (
      sender.id !== api.runtime.id ||
      !message ||
      typeof message !== 'object' ||
      !('type' in message) ||
      message.type !== 'tabby-omnibar-execute' ||
      !('action' in message) ||
      !isAction(message.action) ||
      !('windowId' in message) ||
      !isId(message.windowId) ||
      ('modifier' in message &&
        message.modifier !== undefined &&
        message.modifier !== 'new-tab' &&
        message.modifier !== 'new-window')
    )
      return
    const action = message.action
    const modifier =
      'modifier' in message
        ? (message.modifier as 'new-tab' | 'new-window' | undefined)
        : undefined
    const windowId = message.windowId
    // Start immediately so opening the side panel retains the incoming gesture.
    const opening = createChromeOmnibarNavigator(api, windowId)(
      action,
      modifier,
      0,
    )
    const privacy = isPrivateOmnibar(api, windowId).catch(() => undefined)
    void (async () => {
      try {
        const openedTabs = await opening
        const privateWindow = await privacy
        const now = Date.now()
        const choices = readOmnibarChoices(
          'choice' in message ? [message.choice] : [],
          now,
        )
        if (privateWindow !== undefined && choices[0]) {
          const choice = choices[0]
          await writes
            .run(() =>
              saveChromeOmnibarChoices(
                api,
                getOmnibarExecutionChoices(choice, openedTabs),
                privateWindow,
              ),
            )
            .catch(() => undefined)
        }
        respond({ success: true })
      } catch (error) {
        respond({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Could not open this search result.',
        })
      }
    })()
    return true
  })
}
