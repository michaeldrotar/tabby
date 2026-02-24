import { BrowserTabGroupItem } from '@extension/ui/BrowserTabGroupItem'
import { forwardRef, memo } from 'react'
import type { BrowserTabGroup } from '@extension/chrome/tabGroup/BrowserTabGroup'
import type { HTMLAttributes, ReactNode } from 'react'

export type TabGroupHeaderProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onSelect'
> & {
  group: BrowserTabGroup
  isActive?: boolean
  isRenaming?: boolean
  /** Whether this group is part of selection */
  selected?: boolean
  /** Whether in multi-select mode (affects visual treatment of focus vs selection) */
  isMultiSelectMode?: boolean
  /** Called when the group header is clicked for selection (with modifier keys) */
  onSelect?: (event: React.MouseEvent) => void
  onRenameComplete?: (newTitle: string) => void
  onRenameCancel?: () => void
  onRenameStart?: () => void
  onToggleCollapse?: () => void
  onClose?: () => void
  children?: ReactNode
}

export const TabGroupHeader = memo(
  forwardRef<HTMLDivElement, TabGroupHeaderProps>(
    (
      {
        group,
        isActive = false,
        isRenaming = false,
        selected = false,
        isMultiSelectMode = false,
        onSelect,
        onRenameComplete,
        onRenameCancel,
        onRenameStart,
        onToggleCollapse,
        onClose,
        children,
        className,
        ...props
      },
      ref,
    ) => (
      <BrowserTabGroupItem
        ref={ref}
        groupId={group.id}
        title={group.title}
        color={group.color}
        collapsed={group.collapsed}
        active={isActive}
        isRenaming={isRenaming}
        selected={selected}
        isMultiSelectMode={isMultiSelectMode}
        onSelect={onSelect}
        onRenameComplete={onRenameComplete}
        onRenameCancel={onRenameCancel}
        onRenameStart={onRenameStart}
        onToggleCollapse={onToggleCollapse}
        onClose={onClose}
        className={className}
        {...props}
      >
        {children}
      </BrowserTabGroupItem>
    ),
  ),
)
