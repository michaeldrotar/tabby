import { isNavigableUrl } from '@extension/core/navigation'
import type { OmnibarAction, OmnibarModifier } from '@extension/core'

export type ChromeOmnibarNavigationApi = Pick<
  typeof chrome,
  'windows' | 'tabs' | 'tabGroups' | 'sessions' | 'runtime' | 'sidePanel'
>

type OpenedTab = Pick<chrome.tabs.Tab, 'id' | 'url'>

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
  ): Promise<OpenedTab[]> => {
    current(operation)
    if (!isNavigableUrl(url))
      throw new Error(
        'This URL cannot be opened. Use a web address or a supported browser page.',
      )
    if (modifier === 'new-window') {
      const window = await api.windows.create({ url, focused: true })
      return (window?.tabs ?? []).map((tab) => ({
        ...tab,
        url: tab.url ?? url,
      }))
    }
    const windowId = originalWindowId ?? fallbackWindowId
    if (modifier === 'new-tab') {
      const tab = await api.tabs.create({
        ...(windowId === undefined ? {} : { windowId }),
        url,
        active: true,
      })
      current(operation)
      if (windowId !== undefined)
        await api.windows.update(windowId, { focused: true })
      return [{ ...tab, url: tab.url ?? url }]
    }
    if (windowId !== undefined) {
      const [tab] = await api.tabs.query({ windowId, active: true })
      current(operation)
      const opened =
        tab?.id !== undefined
          ? await api.tabs.update(tab.id, { url, active: true })
          : await api.tabs.create({ windowId, url, active: true })
      current(operation)
      await api.windows.update(windowId, { focused: true })
      return [{ ...opened, id: opened?.id ?? tab?.id, url }]
    }
    const tab = await api.tabs.update({ url })
    return [{ ...tab, url }]
  }
  return async (
    action: OmnibarAction,
    modifier: OmnibarModifier | undefined,
    operation: number,
  ): Promise<OpenedTab[]> => {
    current(operation)
    switch (action.kind) {
      case 'url':
        return openUrl(action.url, modifier, undefined, operation)
      case 'tab':
        if (modifier && action.url) {
          try {
            return await openUrl(
              action.url,
              modifier,
              action.windowId,
              operation,
            )
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
      case 'restore': {
        const restored = await api.sessions.restore(action.sessionId)
        return restored.tab ? [restored.tab] : (restored.window?.tabs ?? [])
      }
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
    return []
  }
}
