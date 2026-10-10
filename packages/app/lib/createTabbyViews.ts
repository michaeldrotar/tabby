import { createOmnibarView } from './OmnibarExperience'
import { createOptionsView } from './OptionsExperience'
import { createTabManagerView } from './view'
import type { TabbyViews } from './TabbyProvider'

export const createTabbyViews = (
  overrides: Partial<TabbyViews> = {},
): TabbyViews => ({
  tabManager: overrides.tabManager ?? createTabManagerView(),
  omnibar: overrides.omnibar ?? createOmnibarView(),
  options: overrides.options ?? createOptionsView(),
})
