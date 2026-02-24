import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { forwardRef, memo, useCallback, useEffect, useRef } from 'react'
import {
  getGroupColorClasses,
  TAB_GROUP_COLOR_IDS,
} from './tab-group/tabGroupColors'
import { cn } from './utils/cn'
import type { BrowserTabGroupColor } from '@extension/chrome/tabGroup/BrowserTabGroup'
import type { HTMLAttributes, ReactNode } from 'react'

export type BrowserTabGroupItemProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onSelect'
> & {
  groupId?: number | string
  title?: string
  color?: BrowserTabGroupColor | string
  collapsed?: boolean
  active?: boolean
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

export const BrowserTabGroupItem = memo(
  forwardRef<HTMLDivElement, BrowserTabGroupItemProps>(
    (
      {
        groupId,
        title,
        color,
        collapsed = false,
        active = false,
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
    ) => {
      const inputRef = useRef<HTMLInputElement>(null)
      const buttonRef = useRef<HTMLButtonElement>(null)
      const renameCommittedRef = useRef(false)
      const hasRenameInputFocusedRef = useRef(false)
      const restoreFocusOnExitRef = useRef(false)
      const prefersReducedMotion = useReducedMotion()
      const resolvedColor = TAB_GROUP_COLOR_IDS.includes(
        color as BrowserTabGroupColor,
      )
        ? (color as BrowserTabGroupColor)
        : undefined
      const colorClasses = getGroupColorClasses(resolvedColor)

      const handleClick = useCallback(
        (e: React.MouseEvent) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey) {
            e.preventDefault()
            onSelect?.(e)
          } else {
            onSelect?.(e)
          }
        },
        [onSelect],
      )

      const handleDoubleClick = useCallback(
        (e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
          onRenameStart?.()
        },
        [onRenameStart],
      )

      const handleChevronClick = useCallback(
        (e: React.MouseEvent) => {
          e.stopPropagation()
          onToggleCollapse?.()
        },
        [onToggleCollapse],
      )

      const handleChevronDoubleClick = useCallback((e: React.MouseEvent) => {
        // Prevent double-click on chevron from bubbling and entering rename mode.
        e.preventDefault()
        e.stopPropagation()
      }, [])

      const handleRenameKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
          // Keep key events inside input to avoid parent shortcuts (e.g. Backspace close).
          e.stopPropagation()
          if (e.key === 'Enter') {
            e.preventDefault()
            renameCommittedRef.current = true
            onRenameComplete?.(inputRef.current?.value ?? title ?? '')
          } else if (e.key === 'Escape') {
            e.preventDefault()
            renameCommittedRef.current = true
            restoreFocusOnExitRef.current = true
            onRenameCancel?.()
          }
        },
        [onRenameCancel, onRenameComplete, title],
      )

      const handleRenameBlur = useCallback(() => {
        // Context-menu initiated rename can transiently blur before input focuses.
        if (!hasRenameInputFocusedRef.current) return
        if (renameCommittedRef.current) {
          renameCommittedRef.current = false
          return
        }
        onRenameComplete?.(inputRef.current?.value ?? title ?? '')
      }, [onRenameComplete, title])

      const handleButtonKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
          if (e.key === 'F2' && !isRenaming) {
            e.preventDefault()
            e.stopPropagation()
            onRenameStart?.()
            return
          }
          if (e.key === 'Enter' && !isRenaming) {
            e.preventDefault()
            e.stopPropagation()
            onToggleCollapse?.()
            return
          }
          if ((e.key === 'Delete' || e.key === 'Backspace') && onClose) {
            e.preventDefault()
            onClose()
          }
        },
        [isRenaming, onClose, onRenameStart, onToggleCollapse],
      )

      useEffect(() => {
        if (isRenaming) {
          if (!inputRef.current) return
          renameCommittedRef.current = false
          hasRenameInputFocusedRef.current = false
          requestAnimationFrame(() => {
            inputRef.current?.focus()
            inputRef.current?.select()
          })
          return
        }
        if (restoreFocusOnExitRef.current) {
          restoreFocusOnExitRef.current = false
          requestAnimationFrame(() => {
            buttonRef.current?.focus()
          })
        }
      }, [isRenaming])

      return (
        <div
          ref={ref}
          className={cn(
            'relative flex flex-col rounded-lg py-1 pl-4 pr-1',
            'transition-all duration-200',
            selected &&
              'ring-accent/[calc(var(--accent-strength)*1%)] ring-2 ring-inset',
            isMultiSelectMode
              ? `
                has-[button:focus-visible]:ring-accent/[calc(var(--accent-strength)*1%)]
                has-[button:focus-visible]:ring-offset-background
                has-[button:focus-visible]:ring-2
                has-[button:focus-visible]:ring-offset-2
              `
              : selected
                ? `
                  has-[button:focus-visible]:ring-foreground/20
                  has-[button:focus-visible]:ring-1
                  has-[button:focus-visible]:ring-inset
                `
                : `
                  has-[button:focus-visible]:ring-accent/[calc(var(--accent-strength)*1%)]
                  has-[button:focus-visible]:ring-offset-background
                  has-[button:focus-visible]:ring-2
                  has-[button:focus-visible]:ring-offset-2
                `,
            className,
          )}
          data-nav-type="group"
          data-group-item={groupId}
          data-group-id={groupId}
          data-selected={selected || undefined}
          data-active={active || undefined}
          data-collapsed={collapsed || undefined}
          {...props}
        >
          <div
            className={cn(
              'absolute bottom-2 left-1 top-2 w-1 rounded-full',
              colorClasses.dot,
            )}
            aria-hidden="true"
          />

          {active && (
            <div
              className={cn(
                'absolute bottom-2 left-0 top-2 w-0.5 rounded-full',
                'bg-accent/[calc(var(--accent-strength)*1%)]',
              )}
            />
          )}

          <button
            ref={buttonRef}
            type="button"
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleButtonKeyDown}
            className={cn(
              `
                hover:bg-highlighted/30
                mb-1 flex w-full cursor-pointer items-center gap-2 rounded-md
                px-2 py-1 text-left transition-colors
                focus:outline-none
                focus-visible:outline-none
              `,
            )}
            aria-expanded={!collapsed}
            aria-controls={
              groupId !== undefined
                ? `tab-group-content-${String(groupId)}`
                : undefined
            }
          >
            <div
              role="button"
              tabIndex={-1}
              onClick={handleChevronClick}
              onDoubleClick={handleChevronDoubleClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleCollapse?.()
                }
              }}
              className={`
                hover:bg-background/80
                flex h-5 w-5 items-center justify-center rounded
                transition-colors
              `}
              aria-label={collapsed ? 'Expand group' : 'Collapse group'}
            >
              {prefersReducedMotion ? (
                collapsed ? (
                  <ChevronRight
                    className={cn('size-4', colorClasses.text)}
                    aria-hidden="true"
                  />
                ) : (
                  <ChevronDown
                    className={cn('size-4', colorClasses.text)}
                    aria-hidden="true"
                  />
                )
              ) : (
                <motion.div
                  animate={{ rotate: collapsed ? -90 : 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                  }}
                >
                  <ChevronDown
                    className={cn('size-4', colorClasses.text)}
                    aria-hidden="true"
                  />
                </motion.div>
              )}
            </div>

            {isRenaming ? (
              <input
                ref={inputRef}
                type="text"
                defaultValue={title ?? ''}
                onKeyDown={handleRenameKeyDown}
                onFocus={() => {
                  hasRenameInputFocusedRef.current = true
                }}
                onBlur={handleRenameBlur}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  `
                    border-border bg-background flex-1 rounded border px-1.5
                    py-0.5 text-xs font-bold uppercase tracking-wider
                    outline-none
                    focus:border-accent focus:ring-accent focus:ring-1
                  `,
                  colorClasses.text,
                )}
              />
            ) : (
              <h4
                className={cn(
                  'text-xs font-bold uppercase tracking-wider opacity-80',
                  colorClasses.text,
                )}
              >
                {title || 'Untitled Group'}
              </h4>
            )}
          </button>

          <AnimatePresence initial={false}>
            {!collapsed && children && (
              <motion.div
                id={
                  groupId !== undefined
                    ? `tab-group-content-${String(groupId)}`
                    : undefined
                }
                initial={
                  prefersReducedMotion ? false : { height: 0, opacity: 0 }
                }
                animate={{ height: 'auto', opacity: 1 }}
                exit={
                  prefersReducedMotion ? undefined : { height: 0, opacity: 0 }
                }
                transition={{
                  height: { type: 'spring', stiffness: 400, damping: 30 },
                  opacity: { duration: 0.15 },
                }}
                className="overflow-hidden"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    },
  ),
)
