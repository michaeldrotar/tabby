import type {
  DownloadAction,
  DownloadsSnapshot,
} from '@extension/core/downloads'
import type { TabManagerAction } from '@extension/ui/tab-manager/TabManager'

export const downloadActionLabels: Record<
  DownloadAction,
  { verb: string; icon: string }
> = {
  open: { verb: 'Open', icon: 'ExternalLink' },
  show: { verb: 'Show in folder', icon: 'FolderOpen' },
  pause: { verb: 'Pause', icon: 'Pause' },
  resume: { verb: 'Resume', icon: 'Play' },
  cancel: { verb: 'Cancel', icon: 'X' },
  erase: { verb: 'Remove from history', icon: 'Trash2' },
}

export const projectDownloadActions = (
  snapshot: DownloadsSnapshot,
  selectedIds: ReadonlySet<number>,
): TabManagerAction[] => {
  const selected = snapshot.items.filter((item) => selectedIds.has(item.id))
  const actions = Object.entries(downloadActionLabels).flatMap(
    ([id, { verb, icon }]) => {
      const count = selected.filter((item) =>
        item.actions.includes(id as DownloadAction),
      ).length
      if (!count) return []
      const noun = `${count} download${count === 1 ? '' : 's'}`
      return [
        {
          id,
          label:
            id === 'show'
              ? `Show ${noun} in folder`
              : id === 'erase'
                ? `Remove ${noun} from history`
                : `${verb} ${noun}`,
          icon,
          kind:
            id === 'open' || id === 'resume'
              ? ('primary' as const)
              : ('secondary' as const),
          disabled: id === 'open' && !snapshot.canOpen,
          disabledReason:
            id === 'open' && !snapshot.canOpen
              ? 'Allow opening files to use this action.'
              : id === 'erase'
                ? 'Files stay on disk.'
                : undefined,
        },
      ]
    },
  )
  if (selected.some((item) => item.warning))
    actions.push({
      id: 'review',
      label: 'Review in Chrome',
      icon: 'ShieldAlert',
      kind: 'primary',
      disabled: false,
      disabledReason: undefined,
    })
  return actions
}
