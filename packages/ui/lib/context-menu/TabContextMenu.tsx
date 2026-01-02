import { usePlatformInfo } from '@extension/chrome/usePlatformInfo'
import { t } from '@extension/i18n/t'
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

export type TabContextMenuProps = {
  children: ReactNode
  tab: BrowserTab
  groups?: BrowserTabGroup[]
  windows?: BrowserWindow[]
  currentWindowId?: number
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
  const { data: platformInfo } = usePlatformInfo()
  const isMac = platformInfo?.os === 'mac'

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
          <span>{t('tabContextMenu_duplicateTab')}</span>
        </ContextMenuItem>

        <ContextMenuItem onSelect={onReload}>
          <RefreshCw className="size-4" aria-hidden="true" />
          <span>{t('tabContextMenu_reload')}</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* State toggles */}
        {isPinned ? (
          <ContextMenuItem onSelect={onUnpin}>
            <PinOff className="size-4" aria-hidden="true" />
            <span>{t('tabContextMenu_unpinTab')}</span>
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onSelect={onPin}>
            <Pin className="size-4" aria-hidden="true" />
            <span>{t('tabContextMenu_pinTab')}</span>
          </ContextMenuItem>
        )}

        {(isAudible || isMuted) &&
          (isMuted ? (
            <ContextMenuItem onSelect={onUnmute}>
              <Volume2 className="size-4" aria-hidden="true" />
              <span>{t('tabContextMenu_unmuteTab')}</span>
            </ContextMenuItem>
          ) : (
            <ContextMenuItem onSelect={onMute}>
              <VolumeOff className="size-4" aria-hidden="true" />
              <span>{t('tabContextMenu_muteTab')}</span>
            </ContextMenuItem>
          ))}

        <ContextMenuSeparator />

        {/* Grouping */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderPlus className="size-4" aria-hidden="true" />
            <span>{t('tabContextMenu_addToGroup')}</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onSelect={onAddToNewGroup}>
              <FolderPlus className="size-4" aria-hidden="true" />
              <span>{t('tabContextMenu_newGroup')}</span>
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
                    <span>
                      {group.title || t('tabContextMenu_untitledGroup')}
                    </span>
                  </ContextMenuItem>
                ))}
              </>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {isInGroup && (
          <ContextMenuItem onSelect={onRemoveFromGroup}>
            <Ungroup className="size-4" aria-hidden="true" />
            <span>{t('tabContextMenu_removeFromGroup')}</span>
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Move */}
        {(otherWindows.length > 0 || onMoveToNewWindow) && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <MonitorUp className="size-4" aria-hidden="true" />
                <span>{t('tabContextMenu_moveToWindow')}</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem onSelect={onMoveToNewWindow}>
                  <ExternalLink className="size-4" aria-hidden="true" />
                  <span>{t('tabContextMenu_newWindow')}</span>
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
                          {getWindowLabel(window, isMac)}
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
            <span>{t('tabContextMenu_copy')}</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onSelect={onCopyUrl}>
              <Link2 className="size-4" aria-hidden="true" />
              <span>{t('tabContextMenu_copyUrl')}</span>
            </ContextMenuItem>
            <ContextMenuItem onSelect={onCopyTitle}>
              <FileText className="size-4" aria-hidden="true" />
              <span>{t('tabContextMenu_copyTitle')}</span>
            </ContextMenuItem>
            <ContextMenuItem onSelect={onCopyTitleAndUrl}>
              <Copy className="size-4" aria-hidden="true" />
              <span>{t('tabContextMenu_copyTitleAndUrl')}</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Close actions */}
        <ContextMenuItem onSelect={onCloseOther}>
          <Trash2 className="size-4" aria-hidden="true" />
          <span>{t('tabContextMenu_closeOtherTabs')}</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={onCloseAfter}>
          <ArrowDown className="size-4" aria-hidden="true" />
          <span>{t('tabContextMenu_closeTabsBelow')}</span>
        </ContextMenuItem>
        <ContextMenuItem variant="destructive" onSelect={onClose}>
          <Trash2 className="size-4" aria-hidden="true" />
          <span>{t('tabContextMenu_closeTab')}</span>
          <ContextMenuShortcut>
            <Kbd>{isMac ? '⌫' : 'Del'}</Kbd>
          </ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

const getWindowLabel = (window: BrowserWindow, isMac: boolean): string => {
  if (window.type === 'popup') return t('windowLabel_popup')
  if (window.type === 'devtools') return t('windowLabel_devtools')
  if (window.incognito)
    return isMac ? t('windowLabel_privateMac') : t('windowLabel_incognito')
  return t('windowLabel_default', String(window.id))
}
