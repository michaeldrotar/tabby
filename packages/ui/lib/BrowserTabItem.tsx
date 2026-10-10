import { AnimatePresence, motion } from 'framer-motion'
import { Layers, Pin, Volume2, VolumeOff, X } from 'lucide-react'
import { forwardRef, memo, useEffect, useRef, useState } from 'react'
import { RadialLoadingSpinner } from './RadialLoadingSpinner'
import {
  useShouldReduceMotion,
  useShouldSettleMotion,
} from './useShouldReduceMotion'
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

/** Pattern for "(N) Title" in formatTitle. */
const TITLE_NUMBER_PATTERN = /^(\(\d+\))\s(.+)$/

/**
 * Renders " • {timeAgo}" and updates every second when the string changes.
 * Isolated so interval-driven state updates only re-render this component.
 */
const TimeAgoText = memo(function TimeAgoText({
  lastAccessed,
  shouldReduceMotion,
}: {
  lastAccessed?: number
  shouldReduceMotion: boolean
}) {
  const [timeAgoText, setTimeAgoText] = useState<string>(() =>
    lastAccessed
      ? formatTimeAgo(timestampForFormatting(lastAccessed, shouldReduceMotion))
      : '',
  )
  useEffect(() => {
    if (!lastAccessed) return
    const format = () =>
      formatTimeAgo(timestampForFormatting(lastAccessed, shouldReduceMotion))
    queueMicrotask(() => setTimeAgoText(format()))
    const interval = setInterval(() => {
      const next = format()
      setTimeAgoText((prev) => (next !== prev ? next : prev))
    }, 1000)
    return () => clearInterval(interval)
  }, [lastAccessed, shouldReduceMotion])
  if (!timeAgoText) return null
  return <span className="flex-shrink-0"> • {timeAgoText}</span>
})

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
  /** Whether in multi-select mode (affects focus ring styling) */
  isMultiSelectMode?: boolean

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
  /** Explicit display text; skips clock-based updates when supplied. */
  ageLabel?: string
  /** Whether this tab is a duplicate (same URL as another tab) */
  duplicate?: boolean

  /** Called when the close button is clicked or Delete/Backspace is pressed. When provided, a close button is shown. */
  onClose?: () => void
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
        isMultiSelectMode = false,
        loading = false,
        blurred = false,
        pinned = false,
        discarded = false,
        audio,
        lastAccessed,
        ageLabel,
        duplicate = false,
        onClose,
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
      const shouldSettleMotion = useShouldSettleMotion()
      const shouldReduceMotion = useShouldReduceMotion(rootRef) ?? false
      const transition = shouldSettleMotion
        ? { duration: 0 }
        : shouldReduceMotion
          ? { duration: 0.15, ease: 'linear' as const }
          : { type: 'spring' as const, stiffness: 300, damping: 25 }

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

      // Format title with attention highlighting
      const formatTitle = (titleText?: string): ReactNode => {
        if (!titleText) return null

        // Check for "(N) Title" pattern
        const numberMatch = titleText.match(TITLE_NUMBER_PATTERN)
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
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (onClose) {
            e.preventDefault()
            onClose()
          }
          return
        }
        if (e.key === 'Enter') {
          e.preventDefault()
          onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
        }
      }

      const handleCloseClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onClose?.()
      }

      const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent text selection when using shift+click for multi-select
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          e.preventDefault()
        }
      }

      return (
        <motion.div
          ref={setRef}
          layout={!shouldReduceMotion}
          initial={
            shouldSettleMotion
              ? false
              : shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.95 }
          }
          animate={{ opacity: 1, scale: 1 }}
          exit={
            shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }
          }
          transition={transition}
          className={cn(
            `group relative overflow-hidden rounded-lg`,
            // Transition for smooth mode changes
            'transition-shadow duration-150',
            // Focus ring styling: option (tab row) or button (close) can be focused
            isMultiSelectMode
              ? `
                has-[[data-tab-option]:focus-visible]:ring-accent/[calc(var(--accent-strength)*1%)]
                has-[[data-tab-option]:focus-visible]:ring-offset-background
                has-[[data-tab-option]:focus-visible]:ring-2
                has-[[data-tab-option]:focus-visible]:ring-offset-2
                has-[button:focus-visible]:ring-accent/[calc(var(--accent-strength)*1%)]
                has-[button:focus-visible]:ring-offset-background
                has-[button:focus-visible]:ring-2
                has-[button:focus-visible]:ring-offset-2
              `
              : selected
                ? `
                  has-[[data-tab-option]:focus-visible]:ring-foreground/20
                  has-[[data-tab-option]:focus-visible]:ring-1
                  has-[[data-tab-option]:focus-visible]:ring-inset
                  has-[button:focus-visible]:ring-foreground/20
                  has-[button:focus-visible]:ring-1
                  has-[button:focus-visible]:ring-inset
                `
                : `
                  has-[[data-tab-option]:focus-visible]:ring-accent/[calc(var(--accent-strength)*1%)]
                  has-[[data-tab-option]:focus-visible]:ring-offset-background
                  has-[[data-tab-option]:focus-visible]:ring-2
                  has-[[data-tab-option]:focus-visible]:ring-offset-2
                  has-[button:focus-visible]:ring-accent/[calc(var(--accent-strength)*1%)]
                  has-[button:focus-visible]:ring-offset-background
                  has-[button:focus-visible]:ring-2
                  has-[button:focus-visible]:ring-offset-2
                `,
            className,
          )}
          data-nav-type="tab"
          data-tab-item={tabId}
          data-tab-id={tabId}
          data-selected={selected}
          data-active={active || undefined}
          data-loading={loading || undefined}
          data-blurred={blurred || undefined}
          data-pinned={pinned || undefined}
          data-discarded={discarded || undefined}
          data-audio={audio || undefined}
          data-duplicate={duplicate || undefined}
          {...(props as Record<string, unknown>)}
        >
          <div
            className={cn(
              `
                flex min-h-[48px] w-full items-center gap-0 rounded-lg border
                border-transparent
                transition-[opacity,background-color,filter,transform,box-shadow,border-color]
                duration-200 ease-out
              `,
              !selected &&
                `
                  hover:bg-accent/[calc(var(--accent-strength)*0.5%)]
                  group-data-[hover=true]:bg-accent/[calc(var(--accent-strength)*0.5%)]
                `,
              selected &&
                `
                  bg-accent/[calc(var(--accent-strength)*1%)] text-foreground
                  hover:brightness-95
                  group-data-[hover=true]:brightness-95
                `,
              active &&
                `bg-background border-border/40 translate-y-[-0.5px] shadow-md`,
              active &&
                selected &&
                `
                  bg-accent/[calc(var(--accent-strength)*1.2%)]
                  border-accent/[calc(var(--accent-strength)*1%)]
                  shadow-accent/25 shadow-md
                `,
              discarded && 'opacity-50 grayscale',
            )}
          >
            <div
              role="option"
              aria-selected={selected}
              tabIndex={0}
              data-tab-option
              className={cn(
                `
                  flex min-h-[48px] min-w-0 flex-1 cursor-pointer select-none
                  items-center gap-3 rounded-lg py-2 pl-4 pr-2 text-left
                  transition-[background-color,filter,transform,box-shadow]
                  duration-200 ease-out
                  focus:outline-none
                  focus-visible:outline-none
                `,
              )}
              onClick={onClick}
              onMouseDown={handleMouseDown}
              onKeyDown={handleKeyDown}
              aria-label={`Tab: ${title || 'Tab'}${pinned ? ' (pinned)' : ''}${discarded ? ' (unloaded)' : ''}${audio === 'on' ? ' (playing audio)' : ''}${audio === 'muted' ? ' (muted)' : ''}${duplicate ? ' (duplicate)' : ''}`}
              aria-current={active ? 'page' : undefined}
              aria-busy={loading}
            >
              {/* Favicon */}
              <div className="relative flex-shrink-0">
                {/* Favicon with scale animation during loading (skip scale when reduced: decorative) */}
                <motion.div
                  animate={{
                    scale: shouldReduceMotion ? 1 : loading ? 0.75 : 1,
                  }}
                  transition={transition}
                  className="flex items-center justify-center"
                >
                  {favicon ?? (
                    <div
                      className={`
                        flex h-5 w-5 items-center justify-center rounded
                      `}
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
                      initial={
                        shouldSettleMotion
                          ? false
                          : shouldReduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, scale: 0.8 }
                      }
                      animate={
                        shouldReduceMotion
                          ? { opacity: 1 }
                          : { opacity: 1, scale: 1.15 }
                      }
                      exit={
                        shouldReduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, scale: 0.8 }
                      }
                      transition={transition}
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
                    transition={transition}
                  >
                    {formatTitle(title)}
                  </motion.div>
                )}

                {/* Domain */}
                {domain && (
                  <motion.div
                    className={`
                      text-muted flex min-w-0 items-center gap-1 text-xs
                    `}
                    animate={{
                      filter: blurred ? 'blur(4px)' : 'blur(0px)',
                    }}
                    transition={
                      shouldSettleMotion
                        ? { duration: 0 }
                        : shouldReduceMotion
                          ? { duration: 0.15, ease: 'linear' as const }
                          : {
                              type: 'spring' as const,
                              stiffness: 300,
                              damping: 25,
                              delay: 0.05,
                            }
                    }
                  >
                    <span className="min-w-0 truncate">{domain}</span>
                    {ageLabel !== undefined ? (
                      ageLabel ? (
                        <span className="flex-shrink-0"> • {ageLabel}</span>
                      ) : null
                    ) : (
                      <TimeAgoText
                        lastAccessed={lastAccessed}
                        shouldReduceMotion={shouldReduceMotion}
                      />
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
                    <VolumeOff className="h-3.5 w-3.5" aria-hidden />
                  </div>
                )}
                {audio === 'on' && (
                  <div
                    className="text-accent flex-shrink-0"
                    aria-label="Playing audio"
                    title="Playing audio"
                  >
                    <Volume2
                      className="h-3.5 w-3.5 animate-pulse"
                      aria-hidden
                    />
                  </div>
                )}

                {/* Duplicate indicator */}
                {duplicate && (
                  <div
                    className="text-muted flex-shrink-0"
                    aria-label="Duplicate tab"
                    title="Duplicate tab"
                  >
                    <Layers className="h-3.5 w-3.5" aria-hidden />
                  </div>
                )}

                {/* Pinned indicator */}
                {pinned && !loading && (
                  <div
                    className="text-muted flex-shrink-0"
                    aria-label="Pinned"
                    title="Pinned tab"
                  >
                    <Pin className="h-3.5 w-3.5" aria-hidden />
                  </div>
                )}
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                tabIndex={-1}
                onClick={handleCloseClick}
                className={cn(
                  `
                    text-muted flex h-11 min-h-[44px] w-11 min-w-[44px]
                    flex-shrink-0 items-center justify-center rounded
                    transition-opacity
                    hover:text-foreground
                    focus:outline-none focus:ring-0
                    focus-visible:outline-none
                  `,
                  active
                    ? 'opacity-100'
                    : cn(
                        'opacity-0',
                        'group-hover:opacity-100',
                        'group-data-[hover=true]:opacity-100',
                        `
                          group-has-[[data-tab-option]:focus-visible]:opacity-100
                        `,
                        'group-has-[button:focus-visible]:opacity-100',
                      ),
                )}
                aria-label="Close tab"
                title="Close tab"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      )
    },
  ),
)
