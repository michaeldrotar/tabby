import { AnimatePresence, motion } from 'framer-motion'
import { Layers, Pin, Volume2, VolumeOff } from 'lucide-react'
import { forwardRef, memo, useEffect, useRef, useState } from 'react'
import { RadialLoadingSpinner } from './RadialLoadingSpinner'
import { useShouldReduceMotion } from './useShouldReduceMotion'
import { cn } from './utils/cn'
import { formatTimeAgo } from './utils/formatTimeAgo'
import type { HTMLAttributes, ReactNode } from 'react'

/** When true, floor age to minute before formatting: 0–59s → "just now", 60–119s → "1m". */
const timestampForFormatting = (ts: number, reduceMotion: boolean): number => {
  if (!reduceMotion) return ts
  const ageSeconds = (Date.now() - ts) / 1000
  const flooredSeconds = Math.floor(ageSeconds / 60) * 60
  return Date.now() - flooredSeconds * 1000
}

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

  // Status indicator props
  /** Audio state: 'muted' shows muted icon, 'on' shows playing icon, 'off' shows nothing */
  audio?: 'muted' | 'on' | 'off'
  /** Timestamp in milliseconds when the tab was last accessed */
  lastAccessed?: number
  /** Whether this tab is a duplicate (same URL as another tab) */
  duplicate?: boolean
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
        audio,
        lastAccessed,
        duplicate = false,
        ...props
      },
      forwardedRef,
    ) => {
      const rootRef = useRef<HTMLDivElement>(null)
      const setRef = (el: HTMLDivElement | null) => {
        ;(rootRef as { current: HTMLDivElement | null }).current = el
        if (typeof forwardedRef === 'function') {
          forwardedRef(el)
        } else if (forwardedRef) {
          ;(forwardedRef as { current: HTMLDivElement | null }).current = el
        }
      }
      const shouldReduceMotion = useShouldReduceMotion(rootRef) ?? false

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

      // Auto-update timestamp display as time passes. Store formatted string in state;
      // interval runs every 1s and updates only when the string changes, avoiding
      // unnecessary re-renders (e.g. "5h" tabs re-render at most hourly).
      // When reduced motion: floor age to minute (0–59s → "just now", 60–119s → "1m").
      const [timeAgoText, setTimeAgoText] = useState<string>(() =>
        lastAccessed
          ? formatTimeAgo(
              timestampForFormatting(lastAccessed, shouldReduceMotion),
            )
          : '',
      )
      useEffect(() => {
        if (!lastAccessed) return

        const format = () =>
          formatTimeAgo(
            timestampForFormatting(lastAccessed, shouldReduceMotion),
          )
        queueMicrotask(() => setTimeAgoText(format()))

        const interval = setInterval(() => {
          const next = format()
          setTimeAgoText((prev) => (next !== prev ? next : prev))
        }, 1000)

        return () => clearInterval(interval)
      }, [lastAccessed, shouldReduceMotion])

      // Format title with attention highlighting
      const formatTitle = (titleText?: string): ReactNode => {
        if (!titleText) return null

        // Check for "(N) Title" pattern
        const numberMatch = titleText.match(/^(\(\d+\))\s(.+)$/)
        if (numberMatch) {
          const [, numberPart, rest] = numberMatch
          return (
            <>
              <span className="text-accent">{numberPart}</span> {rest}
            </>
          )
        }

        // Check for "• Title" pattern
        if (titleText.startsWith('• ')) {
          return (
            <>
              <span className="text-accent">•</span> {titleText.slice(2)}
            </>
          )
        }

        return titleText
      }

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
        }
      }

      return (
        <motion.div
          ref={setRef}
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
          data-audio={audio || undefined}
          data-duplicate={duplicate || undefined}
          aria-label={`Tab: ${title || 'Tab'}${pinned ? ' (pinned)' : ''}${discarded ? ' (unloaded)' : ''}${audio === 'on' ? ' (playing audio)' : ''}${audio === 'muted' ? ' (muted)' : ''}${duplicate ? ' (duplicate)' : ''}`}
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
                {formatTitle(title)}
              </motion.div>
            )}

            {/* Domain */}
            {domain && (
              <motion.div
                className="text-muted flex min-w-0 items-center gap-1 text-xs"
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
                {timeAgoText ? (
                  <>
                    <span className="min-w-0 truncate">{domain}</span>
                    <span className="flex-shrink-0"> • {timeAgoText}</span>
                  </>
                ) : (
                  <span className="min-w-0 truncate">{domain}</span>
                )}
              </motion.div>
            )}
          </div>

          {/* Status indicators */}
          <div className="flex flex-shrink-0 items-center gap-1.5">
            {/* Audio indicator */}
            {audio === 'muted' && (
              <div
                className="text-muted flex-shrink-0"
                aria-label="Muted"
                title="Muted"
              >
                <VolumeOff className="h-3.5 w-3.5" />
              </div>
            )}
            {audio === 'on' && (
              <div
                className="text-accent flex-shrink-0"
                aria-label="Playing audio"
                title="Playing audio"
              >
                <Volume2 className="h-3.5 w-3.5 animate-pulse" />
              </div>
            )}

            {/* Duplicate indicator */}
            {duplicate && (
              <div
                className="text-muted flex-shrink-0"
                aria-label="Duplicate tab"
                title="Duplicate tab"
              >
                <Layers className="h-3.5 w-3.5" />
              </div>
            )}

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
          </div>
        </motion.div>
      )
    },
  ),
)
