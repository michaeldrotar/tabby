import type { BrowserTabGroupID } from '@extension/chrome/tabGroup/BrowserTabGroupID'

/** Focuses an open group's window and activates one of its member tabs. */
export const activateTabGroup = async (
  groupId: BrowserTabGroupID,
): Promise<void> => {
  const [groups, groupTabs] = await Promise.all([
    chrome.tabGroups.query({}),
    chrome.tabs.query({ groupId }),
  ])

  const group = groups.find((candidate) => candidate.id === groupId)
  const memberTabs = groupTabs.filter(
    (tab): tab is chrome.tabs.Tab & { id: number } =>
      typeof tab.id === 'number',
  )
  if (!group || memberTabs.length === 0) return

  const targetTab =
    memberTabs.find((tab) => tab.active) ??
    memberTabs.reduce((first, tab) => (tab.index < first.index ? tab : first))

  if (group.collapsed) {
    await chrome.tabGroups.update(group.id, { collapsed: false })
  }
  await chrome.windows.update(group.windowId, { focused: true })
  await chrome.tabs.update(targetTab.id, { active: true })
}
