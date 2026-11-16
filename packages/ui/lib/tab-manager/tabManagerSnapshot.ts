import type { TabManagerViewModel } from './TabManager'
import type { BrowserSnapshot } from '@extension/core'

export const toTabManagerSnapshot = (
  windows: TabManagerViewModel['windows'],
): BrowserSnapshot => ({
  state: 'loaded',
  revision: 0,
  windows,
  tabs: windows.flatMap((window) =>
    window.tabs.map((tab, index) => ({ ...tab, windowId: window.id, index })),
  ),
  groups: windows.flatMap((window) =>
    window.groups.map((group) => ({
      ...group,
      windowId: window.id,
      color: group.color ?? 'grey',
    })),
  ),
})
