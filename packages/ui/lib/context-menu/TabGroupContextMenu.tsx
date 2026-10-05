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

export type TabGroupContextMenuLabels = {
  expandGroup: string
  collapseGroup: string
  renameGroup: string
  changeColor: string
  colorLabels: Record<BrowserTabGroupColor, string>
  ungroupTabs: string
  moveToNewWindow: string
  copyAllUrls: string
  closeGroup: string
}

export type TabGroupContextMenuProps = {
  children: ReactNode
  group: BrowserTabGroup
  isCollapsed?: boolean
  labels: TabGroupContextMenuLabels
  onToggleCollapse?: () => void
  onRename?: () => void
  onChangeColor?: (color: BrowserTabGroupColor) => void
  onUngroup?: () => void
  onCopyUrls?: () => void
  onMoveToNewWindow?: () => void
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
  renameDisabled?: boolean
  renameDisabledReason?: string
}

export const TabGroupContextMenu = ({
  children,
  group,
  isCollapsed = false,
  labels,
  onToggleCollapse,
  onRename,
  onChangeColor,
  onUngroup,
  onCopyUrls,
  onMoveToNewWindow,
  onClose,
  onOpenChange,
  renameDisabled = false,
  renameDisabledReason,
}: TabGroupContextMenuProps) => {
  return (
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onSelect={onToggleCollapse}>
          {isCollapsed ? (
            <>
              <ChevronDown className="size-4" aria-hidden="true" />
              <span>{labels.expandGroup}</span>
            </>
          ) : (
            <>
              <ChevronUp className="size-4" aria-hidden="true" />
              <span>{labels.collapseGroup}</span>
            </>
          )}
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          disabled={renameDisabled}
          title={renameDisabledReason}
          onSelect={onRename}
        >
          <Pencil className="size-4" aria-hidden="true" />
          <span>{labels.renameGroup}</span>
        </ContextMenuItem>

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Palette className="size-4" aria-hidden="true" />
            <span>{labels.changeColor}</span>
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
                    <span>{labels.colorLabels[id]}</span>
                  </ContextMenuRadioItem>
                )
              })}
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem onSelect={onUngroup}>
          <Ungroup className="size-4" aria-hidden="true" />
          <span>{labels.ungroupTabs}</span>
        </ContextMenuItem>

        <ContextMenuItem onSelect={onMoveToNewWindow}>
          <ExternalLink className="size-4" aria-hidden="true" />
          <span>{labels.moveToNewWindow}</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onSelect={onCopyUrls}>
          <Copy className="size-4" aria-hidden="true" />
          <span>{labels.copyAllUrls}</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem variant="destructive" onSelect={onClose}>
          <Trash2 className="size-4" aria-hidden="true" />
          <span>{labels.closeGroup}</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
