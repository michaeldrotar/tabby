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
import type { ReactNode } from 'react'

export type TabGroupColor =
  | 'grey'
  | 'blue'
  | 'red'
  | 'yellow'
  | 'green'
  | 'pink'
  | 'purple'
  | 'cyan'
  | 'orange'

const GROUP_COLORS: { value: TabGroupColor; label: string; hex: string }[] = [
  { value: 'grey', label: 'Grey', hex: '#5f6368' },
  { value: 'blue', label: 'Blue', hex: '#1a73e8' },
  { value: 'red', label: 'Red', hex: '#d93025' },
  { value: 'yellow', label: 'Yellow', hex: '#f9ab00' },
  { value: 'green', label: 'Green', hex: '#1e8e3e' },
  { value: 'pink', label: 'Pink', hex: '#d01884' },
  { value: 'purple', label: 'Purple', hex: '#a142f4' },
  { value: 'cyan', label: 'Cyan', hex: '#007b83' },
  { value: 'orange', label: 'Orange', hex: '#fa903e' },
]

export type TabGroupContextMenuProps = {
  children: ReactNode
  group: BrowserTabGroup
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onRename?: () => void
  onChangeColor?: (color: TabGroupColor) => void
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
              onValueChange={(value) => onChangeColor?.(value as TabGroupColor)}
            >
              {GROUP_COLORS.map((color) => (
                <ContextMenuRadioItem key={color.value} value={color.value}>
                  <div
                    className="size-3 rounded-full"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span>{color.label}</span>
                </ContextMenuRadioItem>
              ))}
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
