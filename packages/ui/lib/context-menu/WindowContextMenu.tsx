import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ContextMenu'
import {
  Focus,
  VolumeOff,
  Volume2,
  RefreshCw,
  Copy,
  Trash2,
} from 'lucide-react'
import type { BrowserWindow } from '@extension/chrome'
import type { ReactNode } from 'react'

export type WindowContextMenuProps = {
  children: ReactNode
  window: BrowserWindow
  tabCount?: number
  hasAudibleTabs?: boolean
  hasMutedTabs?: boolean
  isCurrent?: boolean
  onFocus?: () => void
  onMuteAll?: () => void
  onUnmuteAll?: () => void
  onReloadAll?: () => void
  onCopyAllUrls?: () => void
  onClose?: () => void
}

export const WindowContextMenu = ({
  children,
  window: _window,
  tabCount = 0,
  hasAudibleTabs = false,
  hasMutedTabs = false,
  isCurrent = false,
  onFocus,
  onMuteAll,
  onUnmuteAll,
  onReloadAll,
  onCopyAllUrls,
  onClose,
}: WindowContextMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {!isCurrent && (
          <>
            <ContextMenuItem onSelect={onFocus}>
              <Focus className="size-4" />
              <span>Focus Window</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {hasAudibleTabs && !hasMutedTabs && (
          <ContextMenuItem onSelect={onMuteAll}>
            <VolumeOff className="size-4" />
            <span>Mute All Tabs</span>
          </ContextMenuItem>
        )}

        {hasMutedTabs && (
          <ContextMenuItem onSelect={onUnmuteAll}>
            <Volume2 className="size-4" />
            <span>Unmute All Tabs</span>
          </ContextMenuItem>
        )}

        <ContextMenuItem onSelect={onReloadAll}>
          <RefreshCw className="size-4" />
          <span>Reload All Tabs</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onSelect={onCopyAllUrls}>
          <Copy className="size-4" />
          <span>Copy All URLs</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          variant="destructive"
          onSelect={onClose}
          disabled={tabCount === 0}
        >
          <Trash2 className="size-4" />
          <span>Close Window</span>
          {tabCount > 0 && (
            <span className="ml-auto text-xs opacity-60">
              {tabCount} {tabCount === 1 ? 'tab' : 'tabs'}
            </span>
          )}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
