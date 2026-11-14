import type { TabManagerItem } from './TabManager'

export const getTabManagerFocusSelector = (
  item: TabManagerItem | null | undefined,
  windowPicker = false,
) =>
  windowPicker
    ? '[data-window-choice][aria-current="true"], [data-window-choice]'
    : !item
      ? '[data-window-picker-trigger]'
      : item.type === 'tab'
        ? `[data-tab-id="${item.id}"] [data-tab-option]`
        : item.type === 'group'
          ? `[data-group-id="${item.id}"] [data-group-option]`
          : `[data-nav-type="window"][data-nav-id="${item.id}"]`
