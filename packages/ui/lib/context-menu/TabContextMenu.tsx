import {
  ArrowDown,
  Copy,
  ExternalLink,
  FileText,
  FolderPlus,
  Layers,
  Link2,
  MonitorUp,
  Pin,
  PinOff,
  RefreshCw,
  Trash2,
  Ungroup,
  Volume2,
  VolumeOff,
} from 'lucide-react'
import { Kbd } from '../Kbd'
import { getGroupColorClasses } from '../tab-group/tabGroupColors'
import { cn } from '../utils/cn'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './ContextMenu'
import type { BrowserTab } from '@extension/chrome/tab/BrowserTab'
import type { BrowserTabGroup } from '@extension/chrome/tabGroup/BrowserTabGroup'
import type { BrowserWindow } from '@extension/chrome/window/BrowserWindow'
import type { ReactNode } from 'react'

export type TabContextMenuLabels = {
  duplicateTab: string
  reload: string
  pinTab: string
  unpinTab: string
  muteTab: string
  unmuteTab: string
  addToGroup: string
  newGroup: string
  untitledGroup: string
  removeFromGroup: string
  moveToWindow: string
  newWindow: string
  copy: string
  copyUrl: string
  copyTitle: string
  copyTitleAndUrl: string
  closeOtherTabs: string
  closeTabsBelow: string
  closeTab: string
  windowLabelPopup: string
  windowLabelDevtools: string
  windowLabelPrivate: string
  windowLabelIncognito: string
  windowLabelDefault: (id: string) => string
}

export type TabContextMenuProps = {
  children: ReactNode
  tab: BrowserTab
  groups?: BrowserTabGroup[]
  windows?: BrowserWindow[]
  currentWindowId?: number
  labels: TabContextMenuLabels
  isMac?: boolean
  onPin?: () => void
  onUnpin?: () => void
  onMute?: () => void
  onUnmute?: () => void
  onDuplicate?: () => void
  onReload?: () => void
  onClose?: () => void
  onCloseOther?: () => void
  onCloseAfter?: () => void
  onCopyUrl?: () => void
  onCopyTitle?: () => void
  onCopyTitleAndUrl?: () => void
  onAddToGroup?: (groupId: number) => void
  onAddToNewGroup?: () => void
  onRemoveFromGroup?: () => void
  onMoveToWindow?: (windowId: number) => void
  onMoveToNewWindow?: () => void
}

export const TabContextMenu = ({
  children,
  tab,
  groups = [],
  windows = [],
  currentWindowId,
  labels,
  isMac = false,
  onPin,
  onUnpin,
  onMute,
  onUnmute,
  onDuplicate,
  onReload,
  onClose,
  onCloseOther,
  onCloseAfter,
  onCopyUrl,
  onCopyTitle,
  onCopyTitleAndUrl,
  onAddToGroup,
  onAddToNewGroup,
  onRemoveFromGroup,
  onMoveToWindow,
  onMoveToNewWindow,
}: TabContextMenuProps) => {
  const isPinned = tab.pinned
  const isMuted = tab.mutedInfo?.muted ?? false
  const isInGroup = tab.groupId !== undefined && tab.groupId !== -1
  const isAudible = tab.audible ?? false

  const otherWindows = windows.filter((w) => w.id !== currentWindowId)
  const availableGroups = groups.filter((g) => g.id !== tab.groupId)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* Navigation */}
        <ContextMenuItem onSelect={onDuplicate}>
          <Layers className="size-4" aria-hidden="true" />
          <span>{labels.duplicateTab}</span>
        </ContextMenuItem>

        <ContextMenuItem onSelect={onReload}>
          <RefreshCw className="size-4" aria-hidden="true" />
          <span>{labels.reload}</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* State toggles */}
        {isPinned ? (
          <ContextMenuItem onSelect={onUnpin}>
            <PinOff className="size-4" aria-hidden="true" />
            <span>{labels.unpinTab}</span>
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onSelect={onPin}>
            <Pin className="size-4" aria-hidden="true" />
            <span>{labels.pinTab}</span>
          </ContextMenuItem>
        )}

        {(isAudible || isMuted) &&
          (isMuted ? (
            <ContextMenuItem onSelect={onUnmute}>
              <Volume2 className="size-4" aria-hidden="true" />
              <span>{labels.unmuteTab}</span>
            </ContextMenuItem>
          ) : (
            <ContextMenuItem onSelect={onMute}>
              <VolumeOff className="size-4" aria-hidden="true" />
              <span>{labels.muteTab}</span>
            </ContextMenuItem>
          ))}

        <ContextMenuSeparator />

        {/* Grouping */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderPlus className="size-4" aria-hidden="true" />
            <span>{labels.addToGroup}</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onSelect={onAddToNewGroup}>
              <FolderPlus className="size-4" aria-hidden="true" />
              <span>{labels.newGroup}</span>
            </ContextMenuItem>
            {availableGroups.length > 0 && (
              <>
                <ContextMenuSeparator />
                {availableGroups.map((group) => (
                  <ContextMenuItem
                    key={group.id}
                    onSelect={() => onAddToGroup?.(group.id)}
                  >
                    <div
                      className={cn(
                        'size-3 rounded-full',
                        getGroupColorClasses(group.color).dot,
                      )}
                      aria-hidden="true"
                    />
                    <span>{group.title || labels.untitledGroup}</span>
                  </ContextMenuItem>
                ))}
              </>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {isInGroup && (
          <ContextMenuItem onSelect={onRemoveFromGroup}>
            <Ungroup className="size-4" aria-hidden="true" />
            <span>{labels.removeFromGroup}</span>
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Move */}
        {(otherWindows.length > 0 || onMoveToNewWindow) && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <MonitorUp className="size-4" aria-hidden="true" />
                <span>{labels.moveToWindow}</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem onSelect={onMoveToNewWindow}>
                  <ExternalLink className="size-4" aria-hidden="true" />
                  <span>{labels.newWindow}</span>
                </ContextMenuItem>
                {otherWindows.length > 0 && (
                  <>
                    <ContextMenuSeparator />
                    {otherWindows.map((window) => (
                      <ContextMenuItem
                        key={window.id}
                        onSelect={() => onMoveToWindow?.(window.id)}
                      >
                        <MonitorUp className="size-4" aria-hidden="true" />
                        <span className="truncate">
                          {getWindowLabel(window, isMac, labels)}
                        </span>
                      </ContextMenuItem>
                    ))}
                  </>
                )}
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
          </>
        )}

        {/* Copy */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Copy className="size-4" aria-hidden="true" />
            <span>{labels.copy}</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onSelect={onCopyUrl}>
              <Link2 className="size-4" aria-hidden="true" />
              <span>{labels.copyUrl}</span>
            </ContextMenuItem>
            <ContextMenuItem onSelect={onCopyTitle}>
              <FileText className="size-4" aria-hidden="true" />
              <span>{labels.copyTitle}</span>
            </ContextMenuItem>
            <ContextMenuItem onSelect={onCopyTitleAndUrl}>
              <Copy className="size-4" aria-hidden="true" />
              <span>{labels.copyTitleAndUrl}</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Close actions */}
        <ContextMenuItem onSelect={onCloseOther}>
          <Trash2 className="size-4" aria-hidden="true" />
          <span>{labels.closeOtherTabs}</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={onCloseAfter}>
          <ArrowDown className="size-4" aria-hidden="true" />
          <span>{labels.closeTabsBelow}</span>
        </ContextMenuItem>
        <ContextMenuItem variant="destructive" onSelect={onClose}>
          <Trash2 className="size-4" aria-hidden="true" />
          <span>{labels.closeTab}</span>
          <ContextMenuShortcut>
            <Kbd>{isMac ? '⌫' : 'Del'}</Kbd>
          </ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

const getWindowLabel = (
  window: BrowserWindow,
  isMac: boolean,
  labels: TabContextMenuLabels,
): string => {
  if (window.type === 'popup') return labels.windowLabelPopup
  if (window.type === 'devtools') return labels.windowLabelDevtools
  if (window.incognito)
    return isMac ? labels.windowLabelPrivate : labels.windowLabelIncognito
  return labels.windowLabelDefault(String(window.id))
}
