import { isNavigableUrl } from '@extension/core/navigation'
import type { OmnibarAction, OmnibarModifier } from '@extension/core'

export type ChromeOmnibarNavigationApi = Pick<
  typeof chrome,
  'windows' | 'tabs' | 'tabGroups' | 'sessions' | 'runtime' | 'sidePanel'
>

export const createChromeOmnibarNavigator = (
  api: ChromeOmnibarNavigationApi,
  originalWindowId?: number,
  current: (operation?: number) => void = () => {},
) => {
  const openUrl = async (
    url: string,
    modifier?: OmnibarModifier,
    fallbackWindowId?: number,
    operation = 0,
  ) => {
    current(operation)
    if (!isNavigableUrl(url))
      throw new Error(
        'This URL cannot be opened. Use a web address or a supported browser page.',
      )
    if (modifier === 'new-window') {
      await api.windows.create({ url, focused: true })
      return
    }
    const windowId = originalWindowId ?? fallbackWindowId
    if (modifier === 'new-tab') {
      await api.tabs.create({
        ...(windowId === undefined ? {} : { windowId }),
        url,
        active: true,
      })
      current(operation)
      if (windowId !== undefined)
        await api.windows.update(windowId, { focused: true })
      return
    }
    if (windowId !== undefined) {
      const [tab] = await api.tabs.query({ windowId, active: true })
      current(operation)
      if (tab?.id !== undefined)
        await api.tabs.update(tab.id, { url, active: true })
      else await api.tabs.create({ windowId, url, active: true })
      current(operation)
      await api.windows.update(windowId, { focused: true })
    } else await api.tabs.update({ url })
  }
  return async (
    action: OmnibarAction,
    modifier: OmnibarModifier | undefined,
    operation: number,
  ) => {
    current(operation)
    switch (action.kind) {
      case 'url':
        await openUrl(action.url, modifier, undefined, operation)
        break
      case 'tab':
        if (modifier && action.url) {
          try {
            await openUrl(action.url, modifier, action.windowId, operation)
            return
          } catch {
            current(operation)
          }
        }
        // Activate first: focusing a different window can close the popup host.
        await api.tabs.update(action.tabId, { active: true })
        current(operation)
        await api.windows.update(action.windowId, { focused: true })
        break
      case 'group': {
        const [groups, tabs] = await Promise.all([
          api.tabGroups.query({}),
          api.tabs.query({ groupId: action.groupId }),
        ])
        current(operation)
        const group = groups.find(
          (candidate) => candidate.id === action.groupId,
        )
        const members = tabs
          .filter(
            (tab): tab is chrome.tabs.Tab & { id: number } =>
              tab.id !== undefined,
          )
          .sort((a, b) => a.index - b.index)
        const tab = members.find((member) => member.active) ?? members[0]
        if (!group || !tab)
          throw new Error('This tab group is no longer available.')
        if (group.collapsed)
          await api.tabGroups.update(group.id, { collapsed: false })
        current(operation)
        await api.tabs.update(tab.id, { active: true })
        current(operation)
        await api.windows.update(group.windowId, { focused: true })
        break
      }
      case 'window':
        await api.windows.update(action.windowId, { focused: true })
        break
      case 'restore':
        await api.sessions.restore(action.sessionId)
        break
      case 'tab-manager': {
        const windowId =
          originalWindowId ?? (await api.windows.getLastFocused()).id
        current(operation)
        if (windowId !== undefined) await api.sidePanel.open({ windowId })
        break
      }
      case 'options':
        await api.runtime.openOptionsPage()
        break
    }
  }
}
