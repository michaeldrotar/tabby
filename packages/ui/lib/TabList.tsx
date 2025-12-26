import { getGroupColorClasses } from './tab-group/tabGroupColors'
import { cn } from './utils/cn'
import type { BrowserTabGroupColor } from '@extension/chrome/lib/tabGroup/BrowserTabGroup'

/**
 * A container for a list of tabs.
 * Renders an ordered list (`<ol>`) with standard spacing.
 */
export const TabList = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => <ol className={cn('flex flex-col gap-1', className)}>{children}</ol>

/**
 * A list item for a tab or a group of tabs.
 * Renders a list item (`<li>`) with full width and flex column layout.
 */
export const TabListItem = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => <li className={cn('flex w-full flex-col', className)}>{children}</li>

export type TabListGroupProps = {
  /** The title of the group. Defaults to 'Group'. */
  title?: string
  /** The tab group color from Chrome's API. */
  color?: BrowserTabGroupColor
  /** Whether the group contains an active tab. Highlights the group background. */
  isActive?: boolean
  /** The list of tabs within the group. */
  children: React.ReactNode
}

/**
 * A visual grouping for a set of tabs.
 * Displays a header with a color indicator and title, followed by the list of tabs.
 */
export const TabListGroup = ({
  title = 'Group',
  color,
  isActive,
  children,
}: TabListGroupProps) => {
  const colorClasses = getGroupColorClasses(color)

  return (
    <div
      className={cn(
        `
          flex flex-col rounded-lg border border-transparent p-1
          transition-colors
        `,
        colorClasses.bg,
        isActive && 'bg-accent/[calc(var(--accent-strength)*1%)]',
      )}
    >
      <div className="mb-1 flex items-center gap-2 px-2 py-1">
        <div className={cn('h-3 w-3 rounded-full', colorClasses.dot)} />
        <h4
          className={cn(
            'text-xs font-bold uppercase tracking-wider opacity-80',
            colorClasses.text,
          )}
        >
          {title}
        </h4>
      </div>
      <TabList className="gap-0.5 pl-2">{children}</TabList>
    </div>
  )
}
