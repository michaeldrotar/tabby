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
import { Kbd } from '../Kbd'
import { usePlatformInfo } from '@extension/chrome'
import {
  Pin,
  PinOff,
  Volume2,
  VolumeOff,
  Copy,
  ExternalLink,
  Trash2,
  RefreshCw,
  Ungroup,
  FolderPlus,
  Layers,
  ArrowDown,
  FileText,
  Link2,
  MonitorUp,
} from 'lucide-react'
import type {
  BrowserTab,
  BrowserTabGroup,
  BrowserWindow,
} from '@extension/chrome'
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
          <Layers className="size-4" />
          <span>Duplicate Tab</span>
        </ContextMenuItem>

        <ContextMenuItem onSelect={onReload}>
          <RefreshCw className="size-4" />
          <span>Reload</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* State toggles */}
        {isPinned ? (
          <ContextMenuItem onSelect={onUnpin}>
            <PinOff className="size-4" />
            <span>Unpin Tab</span>
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onSelect={onPin}>
            <Pin className="size-4" />
            <span>Pin Tab</span>
          </ContextMenuItem>
        )}

        {(isAudible || isMuted) &&
          (isMuted ? (
            <ContextMenuItem onSelect={onUnmute}>
              <Volume2 className="size-4" />
              <span>Unmute Tab</span>
            </ContextMenuItem>
          ) : (
            <ContextMenuItem onSelect={onMute}>
              <VolumeOff className="size-4" />
              <span>Mute Tab</span>
            </ContextMenuItem>
          ))}

        <ContextMenuSeparator />

        {/* Grouping */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderPlus className="size-4" />
            <span>Add to Group</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onSelect={onAddToNewGroup}>
              <FolderPlus className="size-4" />
              <span>New Group</span>
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
                      className="size-3 rounded-full"
                      style={{
                        backgroundColor: getGroupColor(group.color),
                      }}
                    />
                    <span>{group.title || 'Untitled Group'}</span>
                  </ContextMenuItem>
                ))}
              </>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {isInGroup && (
          <ContextMenuItem onSelect={onRemoveFromGroup}>
            <Ungroup className="size-4" />
            <span>Remove from Group</span>
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Move */}
        {(otherWindows.length > 0 || onMoveToNewWindow) && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <MonitorUp className="size-4" />
                <span>Move to Window</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem onSelect={onMoveToNewWindow}>
                  <ExternalLink className="size-4" />
                  <span>New Window</span>
                </ContextMenuItem>
                {otherWindows.length > 0 && (
                  <>
                    <ContextMenuSeparator />
                    {otherWindows.map((window) => (
                      <ContextMenuItem
                        key={window.id}
                        onSelect={() => onMoveToWindow?.(window.id)}
                      >
                        <MonitorUp className="size-4" />
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
            <Copy className="size-4" />
            <span>Copy</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onSelect={onCopyUrl}>
              <Link2 className="size-4" />
              <span>Copy URL</span>
            </ContextMenuItem>
            <ContextMenuItem onSelect={onCopyTitle}>
              <FileText className="size-4" />
              <span>Copy Title</span>
            </ContextMenuItem>
            <ContextMenuItem onSelect={onCopyTitleAndUrl}>
              <Copy className="size-4" />
              <span>Copy Title + URL</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Close actions */}
        <ContextMenuItem onSelect={onCloseOther}>
          <Trash2 className="size-4" />
          <span>Close Other Tabs</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={onCloseAfter}>
          <ArrowDown className="size-4" />
          <span>Close Tabs Below</span>
        </ContextMenuItem>
        <ContextMenuItem variant="destructive" onSelect={onClose}>
          <Trash2 className="size-4" />
          <span>Close Tab</span>
          <ContextMenuShortcut>
            <Kbd>{isMac ? '⌫' : 'Del'}</Kbd>
          </ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

const GROUP_COLORS: Record<string, string> = {
  grey: '#5f6368',
  blue: '#1a73e8',
  red: '#d93025',
  yellow: '#f9ab00',
  green: '#1e8e3e',
  pink: '#d01884',
  purple: '#a142f4',
  cyan: '#007b83',
  orange: '#fa903e',
}

const getGroupColor = (color: string): string => {
  return GROUP_COLORS[color] ?? GROUP_COLORS.grey
}

const getWindowLabel = (window: BrowserWindow, isMac: boolean): string => {
  if (window.type === 'popup') return 'Popup Window'
  if (window.type === 'devtools') return 'DevTools'
  if (window.incognito) return isMac ? 'Private Window' : 'Incognito Window'
  return `Window ${window.id}`
}
