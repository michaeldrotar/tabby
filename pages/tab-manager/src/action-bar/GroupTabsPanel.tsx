import { t } from '@extension/i18n/i18n'
import { getGroupColorClasses } from '@extension/ui/tab-group/tabGroupColors'
import { FolderPlus } from 'lucide-react'
import type { BrowserTabGroup } from '@extension/chrome/tabGroup/BrowserTabGroup'

type GroupTabsPanelProps = {
  groups: readonly BrowserTabGroup[]
  selectedTabIds: readonly number[]
  selectedGroupIds: ReadonlySet<number>
  sourceWindowId?: number
  disabledReason?: string
  onCreateGroup: () => void
  onAddToGroup: (groupId: number) => void
}

const itemClass = `
  text-popover-foreground flex w-full items-center gap-3 px-3 py-2
  text-sm transition-colors
  hover:bg-highlighted/50
  focus-visible:bg-highlighted/50 focus-visible:outline-none
  disabled:cursor-not-allowed disabled:opacity-45
`

export const GroupTabsPanel = ({
  groups,
  selectedTabIds,
  selectedGroupIds,
  sourceWindowId,
  disabledReason,
  onCreateGroup,
  onAddToGroup,
}: GroupTabsPanelProps) => {
  const disabled = Boolean(disabledReason)
  const availableGroups = groups.filter(
    (group) => !selectedGroupIds.has(group.id),
  )

  return (
    <div className="py-1">
      <button
        type="button"
        disabled={disabled || sourceWindowId === undefined}
        title={disabledReason}
        onClick={onCreateGroup}
        className={itemClass}
      >
        <FolderPlus className="text-muted size-4" aria-hidden="true" />
        <span className="flex-1 text-left">
          {t('tabContextMenu_newGroup')} · {selectedTabIds.length}
        </span>
      </button>
      {availableGroups.length > 0 && (
        <div className="bg-border mx-2 my-1 h-px" />
      )}
      {availableGroups.map((group) => {
        const isTargetAvailable = group.windowId === sourceWindowId
        const itemDisabled = disabled || !isTargetAvailable
        const color = getGroupColorClasses(group.color)
        const title =
          disabledReason ||
          (isTargetAvailable
            ? undefined
            : 'Selected tabs must be in the target group’s window.')

        return (
          <button
            key={group.id}
            type="button"
            disabled={itemDisabled}
            title={title}
            onClick={() => onAddToGroup(group.id)}
            className={itemClass}
          >
            <span
              className={`
                size-3 flex-shrink-0 rounded-full
                ${color.dot}
              `}
              aria-hidden="true"
            />
            <span className="flex-1 truncate text-left">
              {group.title || t('tabContextMenu_untitledGroup')}
            </span>
            <span className="text-muted text-xs">{selectedTabIds.length}</span>
          </button>
        )
      })}
    </div>
  )
}
