import { AnimatePresence, motion } from 'framer-motion'
import { Pin } from 'lucide-react'
import { forwardRef, memo } from 'react'
import { RadialLoadingSpinner } from './RadialLoadingSpinner'
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

  // Content state props
  /** Whether the tab is loading - shows radial spinner over favicon */
  loading?: boolean
  /** Whether to blur title and URL text (typically during initial load) */
  blurred?: boolean
  /** Whether the tab is pinned */
  pinned?: boolean
  /** Whether the tab is discarded/unloaded (grayed out) */
  discarded?: boolean
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
        loading = false,
        blurred = false,
        pinned = false,
        discarded = false,
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
        <motion.div
          ref={ref}
          role="option"
          tabIndex={0}
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
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

            discarded && 'cursor-default opacity-50 grayscale',

            className,
          )}
          onClick={discarded ? undefined : onClick}
          onKeyDown={handleKeyDown}
          data-tab-id={tabId}
          data-selected={selected || undefined}
          data-active={active || undefined}
          data-loading={loading || undefined}
          data-blurred={blurred || undefined}
          data-pinned={pinned || undefined}
          data-discarded={discarded || undefined}
          aria-label={`Tab: ${title || 'Tab'}${pinned ? ' (pinned)' : ''}${discarded ? ' (unloaded)' : ''}`}
          aria-selected={selected}
          aria-current={active ? 'page' : undefined}
          aria-busy={loading}
          {...(props as Record<string, unknown>)}
        >
          {/* Favicon */}
          <div className="relative flex-shrink-0">
            {/* Favicon with scale animation during loading */}
            <motion.div
              animate={{
                scale: loading ? 0.75 : 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
              className="flex items-center justify-center"
            >
              {favicon ?? (
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded`}
                >
                  {
                    // Generic fallback icon when no favicon
                    <div className="bg-muted/40 h-4 w-4 rounded-sm" />
                  }
                </div>
              )}
            </motion.div>

            {/* Radial loading spinner overlay */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1.15 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                  }}
                  className={`
                    pointer-events-none absolute inset-0 flex items-center
                    justify-center
                  `}
                >
                  <RadialLoadingSpinner
                    size={22}
                    variant={active ? 'accent' : 'muted'}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tab info */}
          <div className="min-w-0 flex-1">
            {/* Title */}
            {title && (
              <motion.div
                className="text-foreground truncate text-sm font-medium"
                animate={{
                  filter: blurred ? 'blur(4px)' : 'blur(0px)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                }}
              >
                {title}
              </motion.div>
            )}

            {/* Domain */}
            {domain && (
              <motion.div
                className="text-muted truncate text-xs"
                animate={{
                  filter: blurred ? 'blur(4px)' : 'blur(0px)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  delay: 0.05,
                }}
              >
                {status} {domain}
              </motion.div>
            )}
          </div>

          {/* Pinned indicator */}
          {pinned && !loading && (
            <div
              className="text-muted flex-shrink-0"
              aria-label="Pinned"
              title="Pinned tab"
            >
              <Pin className="h-3.5 w-3.5" />
            </div>
          )}
        </motion.div>
      )
    },
  ),
)
