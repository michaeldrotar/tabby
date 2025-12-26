import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
} from './ContextMenu'
import {
  TAB_GROUP_COLOR_IDS,
  getGroupColorClasses,
} from '../tab-group/tabGroupColors'
import { cn } from '../utils/cn'
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Palette,
  Ungroup,
  Copy,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import type { BrowserTabGroup } from '@extension/chrome'
import type { BrowserTabGroupColor } from '@extension/chrome/lib/tabGroup/BrowserTabGroup'
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
              <ChevronDown className="size-4" />
              <span>Expand Group</span>
            </>
          ) : (
            <>
              <ChevronUp className="size-4" />
              <span>Collapse Group</span>
            </>
          )}
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onSelect={onRename}>
          <Pencil className="size-4" />
          <span>Rename Group</span>
        </ContextMenuItem>

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Palette className="size-4" />
            <span>Change Color</span>
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
                    <div className={cn('size-3 rounded-full', config.dot)} />
                    <span>{config.label}</span>
                  </ContextMenuRadioItem>
                )
              })}
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem onSelect={onUngroup}>
          <Ungroup className="size-4" />
          <span>Ungroup Tabs</span>
        </ContextMenuItem>

        <ContextMenuItem onSelect={onMoveToNewWindow}>
          <ExternalLink className="size-4" />
          <span>Move Group to New Window</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onSelect={onCopyUrls}>
          <Copy className="size-4" />
          <span>Copy All URLs</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem variant="destructive" onSelect={onClose}>
          <Trash2 className="size-4" />
          <span>Close Group</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
