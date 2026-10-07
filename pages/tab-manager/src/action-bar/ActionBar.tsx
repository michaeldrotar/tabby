import { t } from '@extension/i18n/i18n'
import { ToastStatus } from '@extension/ui/components/ToastStatus'
import { cn } from '@extension/ui/utils/cn'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  FolderPlus,
  Layers,
  MonitorUp,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatSelectionCount } from './actionBarLayout'
import { useActionBarActions } from './useActionBarActions'
import type { ActionBarItem } from './types'
import type { BrowserWindowID } from '@extension/chrome/window/BrowserWindowID'

type ActivePanel = { actionId: string }

type ActionBarProps = {
  selectedWindowId: BrowserWindowID | undefined
  onRenameGroup?: (groupId: number) => void
  openMenuRequest: number
}

export const ActionBar = ({
  selectedWindowId,
  onRenameGroup,
  openMenuRequest,
}: ActionBarProps) => {
  const { actions, selectedTabCount, selectedWindowCount, selectedGroupCount } =
    useActionBarActions(selectedWindowId, onRenameGroup)
  const [isMenuManuallyOpen, setIsMenuManuallyOpen] = useState(false)
  const [dismissedMenuRequest, setDismissedMenuRequest] =
    useState(openMenuRequest)
  const [activePanel, setActivePanel] = useState<ActivePanel | null>(null)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const lastActionTriggerRef = useRef<HTMLElement | null>(null)
  const restoreMenuTriggerFocus = useCallback(() => {
    menuTriggerRef.current?.focus()
  }, [])
  const hasUnseenMenuRequest = openMenuRequest > dismissedMenuRequest
  const isMenuOpen = isMenuManuallyOpen || hasUnseenMenuRequest

  const primaryActions = useMemo(
    () => actions.filter((action) => action.kind === 'primary'),
    [actions],
  )
  const secondaryActions = useMemo(
    () => actions.filter((action) => action.kind === 'secondary'),
    [actions],
  )
  const menuActions = [...primaryActions, ...secondaryActions]
  const activePanelAction =
    activePanel && !hasUnseenMenuRequest
      ? actions.find((action) => action.id === activePanel.actionId)
      : undefined

  const openPanel = (action: ActionBarItem) => {
    setIsMenuManuallyOpen(false)
    setDismissedMenuRequest(openMenuRequest)
    setActivePanel({ actionId: action.id })
  }

  const executeAction = (action: ActionBarItem) => {
    action.execute()
    setIsMenuManuallyOpen(false)
    setDismissedMenuRequest(openMenuRequest)
    setActivePanel(null)
  }

  const closePopups = useCallback(
    (restoreFocus: boolean) => {
      setIsMenuManuallyOpen(false)
      setDismissedMenuRequest(openMenuRequest)
      setActivePanel(null)
      if (restoreFocus) {
        requestAnimationFrame(() => {
          const actionTrigger = lastActionTriggerRef.current
          if (actionTrigger?.isConnected) actionTrigger.focus()
          else menuTriggerRef.current?.focus()
        })
      }
    },
    [openMenuRequest],
  )

  useEffect(() => {
    if (openMenuRequest === 0) return
    requestAnimationFrame(() => menuTriggerRef.current?.focus())
  }, [openMenuRequest])

  useEffect(() => {
    if (!isMenuOpen && activePanel === null) return
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('[data-action-bar-menu]')) return
      if (target.closest('[data-action-bar-menu-trigger]')) return
      if (target.closest('[data-action-bar-panel]')) return
      if (target.closest('[data-action-bar-panel-trigger]')) return
      closePopups(false)
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePopups(true)
    }
    window.addEventListener('click', handleClick, true)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('click', handleClick, true)
      window.removeEventListener('keydown', handleKey)
    }
  }, [activePanel, closePopups, isMenuOpen])

  return (
    <div data-action-bar-root className="bg-background relative z-50">
      <ToastStatus
        dismissLabel={t('toast_dismiss')}
        onDismiss={restoreMenuTriggerFocus}
      >
        <div className="border-border border-t p-2">
          <div className="flex h-9 items-center gap-2">
            <SelectionSummary
              tabCount={selectedTabCount}
              windowCount={selectedWindowCount}
              groupCount={selectedGroupCount}
              className="ml-auto"
            />
            <button
              ref={menuTriggerRef}
              type="button"
              data-action-bar-menu-trigger
              onClick={() => {
                lastActionTriggerRef.current = menuTriggerRef.current
                setActivePanel(null)
                if (isMenuOpen) {
                  setIsMenuManuallyOpen(false)
                  setDismissedMenuRequest(openMenuRequest)
                } else {
                  setIsMenuManuallyOpen(true)
                }
              }}
              aria-label="More actions"
              aria-expanded={isMenuOpen || Boolean(activePanelAction)}
              className={cn(
                `
                  text-muted flex h-9 w-9 flex-shrink-0 items-center
                  justify-center rounded-md transition-colors
                  hover:bg-highlighted/50 hover:text-foreground
                  focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                  focus-visible:ring-offset-background
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-offset-2
                `,
                (isMenuOpen || Boolean(activePanelAction)) &&
                  'bg-highlighted/50 text-foreground',
              )}
            >
              <Ellipsis size={18} />
            </button>
          </div>
        </div>
      </ToastStatus>

      <AnimatePresence>
        {isMenuOpen && (
          <PopupFrame key="overflow-menu">
            <div
              data-action-bar-menu
              className="flex max-h-[min(70vh,30rem)] flex-col"
            >
              {menuActions.length > 0 ? (
                <div className="min-h-0 flex-1 overflow-y-auto py-1">
                  {menuActions.map((action, index) => (
                    <OverflowMenuItem
                      key={action.id}
                      item={action}
                      showDivider={
                        index === primaryActions.length - 1 &&
                        secondaryActions.length > 0
                      }
                      onClick={(element) => {
                        lastActionTriggerRef.current = element
                        if (action.disabled) return
                        if (action.panel) openPanel(action)
                        else executeAction(action)
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted px-3 py-3 text-sm">
                  Select items to see actions.
                </p>
              )}
            </div>
          </PopupFrame>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePanelAction?.panel && activePanel && (
          <PopupFrame key={`panel-${activePanel.actionId}`} isPanel>
            <div
              className={`flex max-h-[min(75vh,34rem)] flex-col overflow-hidden`}
            >
              <div
                className={`
                  border-border flex flex-shrink-0 items-center justify-between
                  border-b px-3 py-2 text-sm font-medium
                `}
              >
                <span>{activePanelAction.label}</span>
              </div>
              <div
                data-action-bar-panel-scroll-region
                className={`
                  max-h-[min(58vh,24rem)] min-h-0 flex-1 overflow-y-auto
                `}
              >
                {activePanelAction.panel({
                  onClose: () => setActivePanel(null),
                })}
              </div>
              <div className="border-border flex-shrink-0 border-t p-2">
                <button
                  type="button"
                  onClick={() => {
                    setActivePanel(null)
                    setDismissedMenuRequest(openMenuRequest)
                    setIsMenuManuallyOpen(true)
                    requestAnimationFrame(() => menuTriggerRef.current?.focus())
                  }}
                  data-action-bar-panel-back
                  className={`
                    text-popover-foreground flex w-full items-center gap-2
                    rounded px-2 py-2 text-sm
                    hover:bg-highlighted/50
                    focus-visible:bg-highlighted/50 focus-visible:outline-none
                  `}
                >
                  <ChevronLeft size={15} />
                  <span>Back</span>
                </button>
              </div>
            </div>
          </PopupFrame>
        )}
      </AnimatePresence>
    </div>
  )
}

const PopupFrame = ({
  children,
  isPanel = false,
}: {
  children: React.ReactNode
  isPanel?: boolean
}) => (
  <motion.div
    {...(isPanel ? { 'data-action-bar-panel': '' } : {})}
    initial={{ y: 8, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 8, opacity: 0 }}
    transition={{ duration: 0.15, ease: 'easeOut' }}
    className={`
      bg-popover border-border absolute bottom-full right-2 z-50 mb-2
      w-[min(22rem,calc(100vw-1rem))] overflow-hidden rounded-lg border
      shadow-lg
    `}
  >
    {children}
  </motion.div>
)

const SelectionSummary = ({
  tabCount,
  windowCount,
  groupCount,
  className,
}: {
  tabCount: number
  windowCount: number
  groupCount: number
  className?: string
}) => {
  const tabs = formatSelectionCount(tabCount)
  const windows = formatSelectionCount(windowCount)
  const groups = formatSelectionCount(groupCount)
  return (
    <div
      data-selection-summary
      data-selected-tabs={tabCount}
      data-selected-windows={windowCount}
      data-selected-groups={groupCount}
      className={cn('flex flex-shrink-0 items-center gap-1', className)}
      aria-label={`${countLabel(windowCount, 'window')}, ${countLabel(groupCount, 'tab group')}, ${countLabel(tabCount, 'tab')}`}
    >
      <span
        title={countLabel(windowCount, 'window')}
        className={`
          text-muted flex h-7 w-[3.5rem] flex-shrink-0 items-center gap-1
          whitespace-nowrap text-xs
        `}
      >
        <MonitorUp size={14} aria-hidden="true" />
        {windows}
      </span>
      <span
        title={countLabel(groupCount, 'tab group')}
        className={`
          text-muted flex h-7 w-[3.5rem] flex-shrink-0 items-center gap-1
          whitespace-nowrap text-xs
        `}
      >
        <FolderPlus size={14} aria-hidden="true" />
        {groups}
      </span>
      <span
        title={countLabel(tabCount, 'tab')}
        className={`
          text-muted flex h-7 w-[3.5rem] flex-shrink-0 items-center gap-1
          whitespace-nowrap text-xs
        `}
      >
        <Layers size={14} aria-hidden="true" />
        {tabs}
      </span>
    </div>
  )
}

const countLabel = (count: number, entity: string): string => {
  const value = formatSelectionCount(count)
  return `${value} ${entity}${count === 1 ? '' : 's'}`
}

const OverflowMenuItem = ({
  item,
  showDivider,
  onClick,
}: {
  item: ActionBarItem
  showDivider: boolean
  onClick: (element: HTMLButtonElement) => void
}) => (
  <>
    <button
      type="button"
      onClick={(event) => onClick(event.currentTarget)}
      disabled={item.disabled}
      title={item.disabledReason}
      className={cn(
        `
          text-popover-foreground flex w-full items-center gap-3 px-3 py-2
          text-sm transition-colors
          hover:bg-highlighted/50
          focus-visible:bg-highlighted/50 focus-visible:outline-none
          disabled:cursor-not-allowed disabled:opacity-45
        `,
        item.destructive && 'text-destructive',
      )}
    >
      <span className="text-muted flex-shrink-0">{item.icon}</span>
      <span className="flex-1 text-left">{item.label}</span>
      {item.panel ? (
        <ChevronRight size={14} className="text-muted" />
      ) : (
        item.shortcut && (
          <kbd className="text-muted font-mono text-xs">{item.shortcut}</kbd>
        )
      )}
    </button>
    {showDivider && <div className="bg-border mx-2 my-1 h-px" />}
  </>
)
