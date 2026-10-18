import { AnimatePresence, motion } from 'framer-motion'
import { Check, Layers, Pin, Volume2, VolumeOff } from 'lucide-react'
import { forwardRef, memo, useRef } from 'react'
import { RowCloseButton } from './components/RowCloseButton'
import { RadialLoadingSpinner } from './RadialLoadingSpinner'
import {
  useShouldReduceMotion,
  useShouldSettleMotion,
} from './useShouldReduceMotion'
import { cn } from './utils/cn'
import type { HTMLAttributes, ReactNode } from 'react'

/** Pattern for "(N) Title" in formatTitle. */
const TITLE_NUMBER_PATTERN = /^(\(\d+\))\s(.+)$/

export const tabRowHeightClass = 'min-h-[54px]'

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
  onActivate?: () => void

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
        onActivate,
        selected = false,
        active = false,
        isMultiSelectMode: _isMultiSelectMode = false,
        loading = false,
        blurred = false,
        pinned = false,
        discarded = false,
        audio,
        lastAccessed: _lastAccessed,
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
          if (onActivate) onActivate()
          else onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
        }
      }

      const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent text selection when using shift+click for multi-select
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          e.preventDefault()
        }
        if ((e.target as Element).closest('[data-tab-favicon]')) {
          rootRef.current
            ?.querySelector<HTMLElement>('[data-tab-option]')
            ?.focus({ preventScroll: true })
        }
      }

      const faviconContent = (
        <>
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
        </>
      )

      return (
        <motion.div
          ref={setRef}
          layout={!shouldReduceMotion && !shouldSettleMotion}
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
            `
              group/tab-row group/closable-row relative cursor-pointer
              overflow-hidden rounded-lg
            `,
            // Transition for smooth mode changes
            'transition-shadow duration-150',
            `
              has-[[data-tab-option]:focus-visible]:after:ring-accent/70
              has-[[data-tab-option]:focus-visible]:after:ring-2
              has-[[data-tab-option]:focus-visible]:after:ring-inset
              has-[button:focus-visible]:after:ring-accent/70
              has-[button:focus-visible]:after:ring-2
              has-[button:focus-visible]:after:ring-inset
              after:pointer-events-none after:absolute after:inset-0
              after:rounded-[inherit]
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
          onClick={onClick}
          onMouseDown={handleMouseDown}
          {...(props as Record<string, unknown>)}
        >
          <div
            className={cn(
              `
                flex w-full items-center gap-0 rounded-lg border
                border-transparent
                transition-[opacity,background-color,filter,transform,box-shadow,border-color]
                duration-200 ease-out
              `,
              tabRowHeightClass,
              !selected &&
                !active &&
                `
                  hover:bg-accent/[calc(var(--accent-strength)*0.5%)]
                  group-data-[hover=true]/tab-row:bg-accent/[calc(var(--accent-strength)*0.5%)]
                `,
              selected &&
                `
                  bg-accent/[min(35%,calc(var(--accent-strength)*1.2%))]
                  text-foreground
                  hover:bg-accent/[min(40%,calc(var(--accent-strength)*1.5%))]
                  group-data-[hover=true]/tab-row:bg-accent/[min(40%,calc(var(--accent-strength)*1.5%))]
                `,
              active && 'border-accent/40',
              active &&
                !selected &&
                `
                  bg-accent/[min(30%,calc(var(--accent-strength)*0.65%))]
                  hover:bg-accent/[min(35%,calc(var(--accent-strength)*1%))]
                  group-data-[hover=true]/tab-row:bg-accent/[min(35%,calc(var(--accent-strength)*1%))]
                `,
              discarded && 'opacity-50 grayscale',
            )}
          >
            <div
              data-tab-favicon
              className={`
                relative ml-2 flex size-9 flex-shrink-0 items-center
                justify-center
              `}
            >
              {faviconContent}
            </div>
            <div
              role="option"
              aria-selected={selected}
              tabIndex={0}
              data-tab-option
              className={cn(
                `
                  flex min-h-[48px] min-w-0 flex-1 cursor-pointer select-none
                  items-center gap-3 rounded-lg py-2 pl-2 pr-2 text-left
                  transition-[background-color,filter,transform,box-shadow]
                  duration-200 ease-out
                  focus:outline-none
                  focus-visible:outline-none
                `,
              )}
              onKeyDown={handleKeyDown}
              aria-label={`Tab: ${title || 'Tab'}${pinned ? ' (pinned)' : ''}${discarded ? ' (unloaded)' : ''}${audio === 'on' ? ' (playing audio)' : ''}${audio === 'muted' ? ' (muted)' : ''}${duplicate ? ' (duplicate)' : ''}`}
              aria-current={active ? 'page' : undefined}
              aria-busy={loading}
            >
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
                    className={cn(
                      'flex min-w-0 items-center gap-1 text-xs',
                      selected || active
                        ? 'text-foreground'
                        : `
                          text-muted
                          group-hover/tab-row:text-foreground
                          group-data-[hover=true]/tab-row:text-foreground
                        `,
                    )}
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
                    {ageLabel && (
                      <span className="flex-shrink-0"> • {ageLabel}</span>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Status indicators */}
              <div className="flex flex-shrink-0 items-center gap-1.5">
                {selected && (
                  <Check className="text-foreground size-4" aria-hidden />
                )}
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
              <RowCloseButton
                label="Close tab"
                active={active}
                onClose={onClose}
              />
            )}
          </div>
        </motion.div>
      )
    },
  ),
)
