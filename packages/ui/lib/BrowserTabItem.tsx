import { forwardRef, memo } from 'react'
import { cn } from './utils/cn'
import type { HTMLAttributes, ReactNode } from 'react'

/**
 * Props for the BrowserTabItem component.
 * Represents the data needed to display a browser tab.
 */
export type BrowserTabItemProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'title'
> & {
  /** Unique tab identifier */
  tabId?: number | string
  /** Tab title text */
  title?: string
  /** Full URL of the tab */
  url?: string
  /** Custom favicon component (overrides favIconUrl) */
  favicon?: ReactNode
  /** Additional CSS classes */
  className?: string
  /** Handler for when tab is clicked */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void

  // Interactive state props
  /** Whether this tab is currently selected (for keyboard navigation or multi-select) */
  selected?: boolean
  /** Whether this tab represents the currently active browser tab */
  active?: boolean
}

/**
 * BrowserTabItem - A presentational component for displaying a browser tab.
 *
 * This is a "dumb" component that receives all data via props and has no business logic
 * or Chrome API dependencies. It purely handles the visual representation of a tab.
 *
 * Design principles followed:
 * - Dumb/presentational component (no API calls, no business logic)
 * - Receives all data via props
 * - Uses custom theme colors (not hardcoded Tailwind colors)
 * - Accessible with proper semantic HTML
 * - Memoized for performance in large lists
 *
 * @example
 * ```tsx
 * <BrowserTabItem
 *   tabId={123}
 *   title="GitHub - microsoft/vscode"
 *   url="https://github.com/microsoft/vscode"
 *   favicon={<FaviconComponent />}
 *   onClick={(e) => console.log('Tab clicked')}
 * />
 * ```
 */
export const BrowserTabItem = memo(
  forwardRef<HTMLDivElement, BrowserTabItemProps>(
    (
      {
        tabId,
        title,
        url,
        favicon,
        className,
        onClick,
        selected = false,
        active = false,
        ...props
      },
      ref,
    ) => {
      // Extract domain from URL for display
      const getDomain = (url?: string): string => {
        if (!url) return ''
        try {
          const urlObj = new URL(url)
          return urlObj.hostname.replace(/^www\./, '')
        } catch {
          return url
        }
      }

      const domain = getDomain(url)

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
        }
      }

      return (
        <div
          ref={ref}
          role="option"
          tabIndex={0}
          className={cn(
            `
              focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
              focus-visible:ring-offset-background focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-offset-2
              data-[focus]:ring-accent/[calc(var(--accent-strength)*1%)]
              data-[focus]:ring-offset-background data-[focus]:ring-2
              data-[focus]:ring-offset-2
              group relative flex min-h-[48px] cursor-pointer items-center gap-3
              rounded-lg border border-transparent px-4 py-2 transition-all
              duration-200 ease-out
              motion-reduce:transition-none
            `,

            !selected &&
              `
                hover:bg-accent/[calc(var(--accent-strength)*0.5%)]
                data-[hover]:bg-accent/[calc(var(--accent-strength)*0.5%)]
              `,

            selected &&
              `
                bg-accent/[calc(var(--accent-strength)*1%)] text-foreground
                hover:brightness-95
                data-[hover]:brightness-95
              `,

            active &&
              `bg-background border-border/40 translate-y-[-0.5px] shadow-md`,

            active &&
              selected &&
              `
                bg-accent/[calc(var(--accent-strength)*1.2%)]
                border-accent/[calc(var(--accent-strength)*1%)] shadow-accent/25
                shadow-md
              `,

            className,
          )}
          onClick={onClick}
          onKeyDown={handleKeyDown}
          data-tab-id={tabId}
          data-selected={selected || undefined}
          data-active={active || undefined}
          aria-label={`Tab: ${title}`}
          aria-selected={selected}
          aria-current={active ? 'page' : undefined}
          {...props}
        >
          {/* Favicon */}
          <div className="flex-shrink-0">
            {favicon ?? (
              <div className="flex h-5 w-5 items-center justify-center rounded">
                {
                  // Generic fallback icon when no favicon
                  <div className="bg-muted/40 h-4 w-4 rounded-sm" />
                }
              </div>
            )}
          </div>

          {/* Tab info */}
          <div className="min-w-0 flex-1">
            {/* Title */}
            <div className="text-foreground truncate text-sm font-medium">
              {title || 'Untitled'}
            </div>

            {/* Domain */}
            <div className="text-muted truncate text-xs">{domain}</div>
          </div>
        </div>
      )
    },
  ),
)
