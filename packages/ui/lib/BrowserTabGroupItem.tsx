import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { forwardRef, memo, useCallback, useEffect, useRef } from 'react'
import { DragReveal } from './components/DragReveal'
import { useSurfaceId, useSurfaceInputOwner } from './Surface'
import {
  getGroupColorClasses,
  TAB_GROUP_COLOR_IDS,
} from './tab-group/tabGroupColors'
import {
  useShouldReduceMotion,
  useShouldSettleMotion,
} from './useShouldReduceMotion'
import { cn } from './utils/cn'
import type { BrowserTabGroupColor } from '@extension/core'
import type { HTMLAttributes, ReactNode } from 'react'

export type BrowserTabGroupItemProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onSelect'
> & {
  groupId?: number | string
  title?: string
  color?: BrowserTabGroupColor | string
  collapsed?: boolean
  dragReveal?: boolean
  active?: boolean
  isRenaming?: boolean
  renameTitle?: string
  onRenameTitleChange?: (title: string) => void
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
        dragReveal = false,
        active = false,
        isRenaming = false,
        renameTitle,
        onRenameTitleChange,
        selected = false,
        isMultiSelectMode: _isMultiSelectMode = false,
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
      const { ownsInput } = useSurfaceInputOwner()
      const prefersReducedMotion = useShouldReduceMotion()
      const shouldSettleMotion = useShouldSettleMotion()
      const contentId = useSurfaceId(`tab-group-content-${String(groupId)}`)
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
          const frame = requestAnimationFrame(() => {
            if (!ownsInput()) return
            inputRef.current?.focus()
            inputRef.current?.select()
          })
          return () => cancelAnimationFrame(frame)
        }
        if (restoreFocusOnExitRef.current) {
          restoreFocusOnExitRef.current = false
          const frame = requestAnimationFrame(() => {
            if (!ownsInput()) return
            buttonRef.current?.focus()
          })
          return () => cancelAnimationFrame(frame)
        }
        return undefined
      }, [isRenaming, ownsInput])

      return (
        <div
          ref={ref}
          className={cn(
            'group/tab-group relative flex flex-col rounded-lg py-1 pl-4 pr-1',
            'transition-[background-color,border-color,box-shadow] duration-200',
            selected && 'ring-accent-border ring-2 ring-inset',
            `
              has-[[data-group-header]>button:focus-visible]:after:ring-focus
              has-[[data-group-header]>button:focus-visible]:after:ring-2
              has-[[data-group-header]>button:focus-visible]:after:ring-inset
              after:pointer-events-none after:absolute after:inset-0
              after:rounded-[inherit]
            `,
            className,
          )}
          data-nav-type="group"
          data-group-item={groupId}
          data-group-id={groupId}
          data-selected={selected}
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
                'bg-accent-selected',
              )}
            />
          )}

          <div
            data-group-header
            className={`
              mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1
            `}
          >
            {isRenaming ? (
              <input
                ref={inputRef}
                type="text"
                name="group-name"
                aria-label="Group name"
                autoComplete="off"
                {...(renameTitle === undefined
                  ? { defaultValue: title ?? '' }
                  : { value: renameTitle })}
                onChange={(event) =>
                  onRenameTitleChange?.(event.currentTarget.value)
                }
                onKeyDown={handleRenameKeyDown}
                onFocus={() => {
                  hasRenameInputFocusedRef.current = ownsInput()
                }}
                onBlur={handleRenameBlur}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  `
                    border-border bg-background flex-1 rounded border px-1.5
                    py-0.5 text-sm font-semibold outline-none
                    focus:border-accent focus:ring-accent focus:ring-1
                  `,
                  colorClasses.text,
                )}
              />
            ) : (
              <button
                ref={buttonRef}
                data-group-option="true"
                type="button"
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onKeyDown={handleButtonKeyDown}
                aria-expanded={!collapsed}
                aria-controls={groupId !== undefined ? contentId : undefined}
                className={cn(
                  `
                    hover:bg-highlighted/30
                    min-w-0 flex-1 rounded text-left text-sm font-semibold
                    focus-visible:outline-none
                  `,
                  colorClasses.text,
                )}
              >
                <span className="block truncate">
                  {title || 'Untitled group'}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={handleChevronClick}
              onDoubleClick={handleChevronDoubleClick}
              aria-expanded={!collapsed}
              aria-controls={groupId !== undefined ? contentId : undefined}
              aria-label={`${collapsed ? 'Expand' : 'Collapse'} group ${title || 'Untitled group'}`}
              className={`
                hover:bg-background/80
                order-first flex h-5 w-5 shrink-0 items-center justify-center
                rounded transition-colors
                focus-visible:outline-none
              `}
            >
              <DragReveal active={dragReveal}>
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
              </DragReveal>
            </button>
          </div>

          {shouldSettleMotion ? (
            !collapsed && children ? (
              <div
                id={groupId !== undefined ? contentId : undefined}
                className="overflow-hidden"
              >
                {children}
              </div>
            ) : null
          ) : (
            <AnimatePresence initial={false}>
              {!collapsed && children && (
                <motion.div
                  id={groupId !== undefined ? contentId : undefined}
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
          )}
        </div>
      )
    },
  ),
)
