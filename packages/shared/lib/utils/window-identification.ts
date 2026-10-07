export type WindowIdentificationMode = 'active' | 'first'

type WindowIdentificationTab = {
  active?: boolean
  index: number
}

export const getWindowIdentificationTab = <Tab extends WindowIdentificationTab>(
  tabs: readonly Tab[],
  mode: WindowIdentificationMode,
): Tab | undefined => {
  let firstTab: Tab | undefined

  for (const tab of tabs) {
    if (!firstTab || tab.index < firstTab.index) firstTab = tab
    if (mode === 'active' && tab.active) return tab
  }

  return firstTab
}
