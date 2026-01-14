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
    ({ tabId, title, url, favicon, className, onClick, ...props }, ref) => {
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
          role="button"
          tabIndex={0}
          className={cn(
            // Base layout
            'group flex items-center gap-3 px-4 py-2',
            // Sizing
            'min-h-[48px]',
            // Styling
            'rounded-lg',
            'transition-colors duration-150',
            // Interactive states
            'hover:bg-highlighted/50',
            'focus-visible:ring-2',
            'focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]',
            'focus-visible:ring-offset-2',
            'focus-visible:ring-offset-background',
            // Cursor
            'cursor-pointer',
            className,
          )}
          onClick={onClick}
          onKeyDown={handleKeyDown}
          data-tab-id={tabId}
          aria-label={`Tab: ${title}`}
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
