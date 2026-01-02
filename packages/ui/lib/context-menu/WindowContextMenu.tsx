import { tt } from '@extension/i18n/plurals'
import { t } from '@extension/i18n/t'
import {
  Copy,
  Focus,
  RefreshCw,
  Trash2,
  Volume2,
  VolumeOff,
} from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ContextMenu'
import type { BrowserWindow } from '@extension/chrome/window/BrowserWindow'
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
              <Focus className="size-4" aria-hidden="true" />
              <span>{t('windowContextMenu_focusWindow')}</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {hasAudibleTabs && !hasMutedTabs && (
          <ContextMenuItem onSelect={onMuteAll}>
            <VolumeOff className="size-4" aria-hidden="true" />
            <span>{t('windowContextMenu_muteAllTabs')}</span>
          </ContextMenuItem>
        )}

        {hasMutedTabs && (
          <ContextMenuItem onSelect={onUnmuteAll}>
            <Volume2 className="size-4" aria-hidden="true" />
            <span>{t('windowContextMenu_unmuteAllTabs')}</span>
          </ContextMenuItem>
        )}

        <ContextMenuItem onSelect={onReloadAll}>
          <RefreshCw className="size-4" aria-hidden="true" />
          <span>{t('windowContextMenu_reloadAllTabs')}</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onSelect={onCopyAllUrls}>
          <Copy className="size-4" aria-hidden="true" />
          <span>{t('windowContextMenu_copyAllUrls')}</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          variant="destructive"
          onSelect={onClose}
          disabled={tabCount === 0}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          <span>{t('windowContextMenu_closeWindow')}</span>
          {tabCount > 0 && (
            <span className="ml-auto text-xs opacity-60">
              {tt('nTabs', tabCount)}
            </span>
          )}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
