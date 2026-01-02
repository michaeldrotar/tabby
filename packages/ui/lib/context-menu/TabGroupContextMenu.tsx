import { t } from '@extension/i18n/t'
import {
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Palette,
  Pencil,
  Trash2,
  Ungroup,
} from 'lucide-react'
import {
  getGroupColorClasses,
  TAB_GROUP_COLOR_IDS,
} from '../tab-group/tabGroupColors'
import { cn } from '../utils/cn'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './ContextMenu'
import type {
  BrowserTabGroup,
  BrowserTabGroupColor,
} from '@extension/chrome/tabGroup/BrowserTabGroup'
import type { ReactNode } from 'react'

export type TabGroupContextMenuProps = {
  children: ReactNode
  group: BrowserTabGroup
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onRename?: () => void
  onChangeColor?: (color: BrowserTabGroupColor) => void
  onUngroup?: () => void
  onCopyUrls?: () => void
  onMoveToNewWindow?: () => void
  onClose?: () => void
}

export const TabGroupContextMenu = ({
  children,
  group,
  isCollapsed = false,
  onToggleCollapse,
  onRename,
  onChangeColor,
  onUngroup,
  onCopyUrls,
  onMoveToNewWindow,
  onClose,
}: TabGroupContextMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onSelect={onToggleCollapse}>
          {isCollapsed ? (
            <>
              <ChevronDown className="size-4" aria-hidden="true" />
              <span>{t('groupContextMenu_expandGroup')}</span>
            </>
          ) : (
            <>
              <ChevronUp className="size-4" aria-hidden="true" />
              <span>{t('groupContextMenu_collapseGroup')}</span>
            </>
          )}
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onSelect={onRename}>
          <Pencil className="size-4" aria-hidden="true" />
          <span>{t('groupContextMenu_renameGroup')}</span>
        </ContextMenuItem>

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Palette className="size-4" aria-hidden="true" />
            <span>{t('groupContextMenu_changeColor')}</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40">
            <ContextMenuRadioGroup
              value={group.color}
              onValueChange={(value) =>
                onChangeColor?.(value as BrowserTabGroupColor)
              }
            >
              {TAB_GROUP_COLOR_IDS.map((id) => {
                const config = getGroupColorClasses(id)
                return (
                  <ContextMenuRadioItem key={id} value={id}>
                    <div
                      className={cn('size-3 rounded-full', config.dot)}
                      aria-hidden="true"
                    />
                    <span>{config.label}</span>
                  </ContextMenuRadioItem>
                )
              })}
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem onSelect={onUngroup}>
          <Ungroup className="size-4" aria-hidden="true" />
          <span>{t('groupContextMenu_ungroupTabs')}</span>
        </ContextMenuItem>

        <ContextMenuItem onSelect={onMoveToNewWindow}>
          <ExternalLink className="size-4" aria-hidden="true" />
          <span>{t('groupContextMenu_moveToNewWindow')}</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onSelect={onCopyUrls}>
          <Copy className="size-4" aria-hidden="true" />
          <span>{t('groupContextMenu_copyAllUrls')}</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem variant="destructive" onSelect={onClose}>
          <Trash2 className="size-4" aria-hidden="true" />
          <span>{t('groupContextMenu_closeGroup')}</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
