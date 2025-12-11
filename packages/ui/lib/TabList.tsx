import { cn } from './utils/cn'

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

const GROUP_COLORS: Record<string, { dot: string; text: string }> = {
  grey: { dot: 'bg-gray-500', text: 'text-gray-700 dark:text-gray-400' },
  blue: { dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400' },
  red: { dot: 'bg-red-500', text: 'text-red-700 dark:text-red-400' },
  yellow: {
    dot: 'bg-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-400',
  },
  green: { dot: 'bg-green-500', text: 'text-green-700 dark:text-green-400' },
  pink: { dot: 'bg-pink-500', text: 'text-pink-700 dark:text-pink-400' },
  purple: {
    dot: 'bg-purple-500',
    text: 'text-purple-700 dark:text-purple-400',
  },
  cyan: { dot: 'bg-cyan-500', text: 'text-cyan-700 dark:text-cyan-400' },
  orange: {
    dot: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-400',
  },
}

export type TabListGroupProps = {
  /** The title of the group. Defaults to 'Group'. */
  title?: string
  /** The color name for the group indicator (e.g., 'red', 'blue'). */
  color?: string
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
  const colorClasses =
    color && GROUP_COLORS[color]
      ? GROUP_COLORS[color]
      : { dot: 'bg-gray-400', text: 'text-gray-600 dark:text-gray-400' }

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border border-transparent bg-gray-50/50 p-1 transition-colors dark:bg-gray-900/30',
        isActive && 'bg-blue-50/50 dark:bg-blue-900/10',
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
