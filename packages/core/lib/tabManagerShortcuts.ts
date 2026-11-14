/** Local action keys shared by the manager and its shortcut reference. */
export const TAB_MANAGER_ACTION_SHORTCUTS = [
  {
    key: 'p',
    label: 'Pin or unpin tabs',
    actionIds: ['pin-selected-tabs', 'unpin-selected-tabs'],
  },
  {
    key: 'm',
    label: 'Mute or unmute tabs with audio',
    actionIds: ['mute-selected-tabs', 'unmute-selected-tabs'],
  },
  { key: 'd', label: 'Duplicate tabs', actionIds: ['duplicate-selected-tabs'] },
  { key: 'r', label: 'Reload tabs', actionIds: ['reload-selected-tabs'] },
  {
    key: 'w',
    opensPanel: true,
    label: 'Choose a window for tabs',
    actionIds: ['move-selected-tabs'],
  },
  {
    key: 'c',
    opensPanel: true,
    label: 'Choose what to copy from tabs',
    actionIds: ['copy-selected-tabs'],
  },
  { key: 'n', label: 'Create a new tab below', actionIds: ['new-tab-below'] },
  {
    key: 'z',
    label: 'Discard eligible tabs',
    actionIds: ['discard-selected-tabs'],
  },
  {
    key: 'g',
    opensPanel: true,
    label: 'Choose a group for tabs',
    actionIds: ['group-selected-tabs'],
  },
  {
    key: 'u',
    label: 'Remove tabs from groups',
    actionIds: ['ungroup-selected-groups', 'remove-selected-tabs-from-group'],
  },
] as const

export const getTabManagerActionShortcut = (
  key: string,
):
  | {
      key: string
      label: string
      actionIds: readonly string[]
      opensPanel?: boolean
    }
  | undefined =>
  TAB_MANAGER_ACTION_SHORTCUTS.find(
    (shortcut) => shortcut.key === key.toLowerCase(),
  )

export const getTabManagerActionShortcutLabel = (actionId: string) => {
  if (actionId === 'close-selected-tabs') return 'Delete / Backspace'
  if (actionId === 'rename-selected-group') return 'F2'
  return TAB_MANAGER_ACTION_SHORTCUTS.find((shortcut) =>
    shortcut.actionIds.some((id) => id === actionId),
  )?.key.toUpperCase()
}
