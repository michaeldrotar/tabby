import * as Menu from '@radix-ui/react-menu'
import { animate } from 'framer-motion'
import {
  ArrowDown,
  ArrowLeft,
  BrushCleaning,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardCopy,
  Copy,
  Delete,
  Ellipsis,
  ExternalLink,
  FileText,
  Focus,
  FolderPlus,
  Layers,
  Link2,
  MemoryStick,
  MonitorUp,
  MousePointer2,
  Palette,
  Pencil,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  Ungroup,
  Volume2,
  VolumeOff,
  X,
} from 'lucide-react'
import { Fragment, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NotificationStack } from '../../components/NotificationStack'
import { Kbd } from '../../Kbd'
import { SummerMotionControl, SummerToolbarArt } from '../../SummerTheme'
import { useSurface, useSurfaceInputOwner } from '../../Surface'
import { getGroupColorClasses } from '../../tab-group/tabGroupColors'
import { useShouldReduceMotion } from '../../useShouldReduceMotion'
import { cn } from '../../utils/cn'
import { getTabManagerFocusSelector } from '../itemFocus'
import { windowControlClass, WindowIcon } from './WindowNavigation'
import type {
  TabManagerAction,
  TabManagerActionOption,
  TabManagerIntent,
  TabManagerViewModel,
} from '../TabManager'
import type { RefObject } from 'react'

const icons = {
  ArrowDown,
  BrushCleaning,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  Copy,
  ExternalLink,
  FileText,
  Focus,
  FolderPlus,
  Layers,
  Link2,
  MemoryStick,
  MonitorUp,
  Palette,
  Pencil,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Trash2,
  Ungroup,
  Volume2,
  VolumeOff,
  X,
}
const ActionIcon = ({ name }: { name?: string }) => {
  const key = Object.keys(icons).find(
    (candidate) =>
      candidate.toLowerCase() === name?.replaceAll('-', '').toLowerCase(),
  )
  const Icon = icons[(key ?? 'Layers') as keyof typeof icons]
  return <Icon size={17} aria-hidden="true" />
}
const itemClass =
  'text-popover-foreground flex min-h-9 w-full cursor-default select-none items-center gap-3 rounded px-3 py-2 text-left text-sm outline-hidden data-[highlighted]:bg-highlighted/50 data-[state=open]:bg-highlighted/50 data-[disabled]:opacity-45'
const menuClass =
  'bg-popover border-border text-popover-foreground z-[80] w-80 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-lg border p-1 shadow-lg outline-hidden'
const OptionContent = ({
  option,
  windows,
}: {
  option: TabManagerActionOption
  windows: boolean
}) => (
  <>
    <span className="shrink-0 text-muted">
      {option.color ? (
        <span
          role="img"
          aria-label={`${option.label} color swatch`}
          className={cn(
            'block size-4 rounded-full',
            getGroupColorClasses(option.color).dot,
          )}
        />
      ) : windows && option.id !== 'new' ? (
        <WindowIcon
          icon={option.icon}
          iconUrl={option.iconUrl}
          color={option.windowIconColor}
          size={17}
        />
      ) : (
        <ActionIcon name={option.icon} />
      )}
    </span>
    <span className="min-w-0 flex-1 truncate text-left">{option.label}</span>
    {option.subtitle && (
      <span className="text-xs text-muted">{option.subtitle}</span>
    )}
  </>
)

const StableMenuContent = ({
  menuRef,
  position,
  side,
  style,
  ...props
}: React.ComponentProps<typeof Menu.Content> & {
  menuRef: RefObject<HTMLDivElement | null>
  position: { x: number; y: number } | null
}) => {
  const [layout, setLayout] = useState<{
    position: typeof position
    side: 'top' | 'bottom'
    height: number
  } | null>(null)
  const captureLayout = useRef<() => void>(() => {})
  useLayoutEffect(() => {
    const menu = menuRef.current
    const wrapper = menu?.parentElement
    if (!menu || !wrapper) return
    let frame = 0
    const capture = () => {
      if (wrapper.style.transform.includes('-200%') || !menu.offsetHeight)
        return
      observer.disconnect()
      cancelAnimationFrame(frame)
      setLayout({
        position,
        side: menu.dataset.side === 'top' ? 'top' : 'bottom',
        height: menu.offsetHeight,
      })
    }
    captureLayout.current = capture
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(capture)
      })
    })
    observer.observe(wrapper, {
      attributes: true,
      subtree: true,
      attributeFilter: ['style', 'data-side'],
    })
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [menuRef, position])
  const openingLayout = layout?.position === position ? layout : null
  return (
    <Menu.Content
      {...props}
      ref={menuRef}
      side={openingLayout?.side ?? side}
      onKeyDownCapture={() => {
        if (!openingLayout) captureLayout.current()
      }}
      onPointerDownCapture={() => {
        if (!openingLayout) captureLayout.current()
      }}
      style={{
        ...style,
        ...(openingLayout && {
          maxHeight: `min(${openingLayout.height}px, 75vh, var(--radix-popper-available-height))`,
        }),
      }}
    />
  )
}

export const TabManagerActionBar = ({
  model,
  onIntent,
  menuRef,
  menuPosition,
  returnFocus,
}: {
  model: TabManagerViewModel
  onIntent: (intent: TabManagerIntent) => void
  menuRef: RefObject<HTMLDivElement | null>
  menuPosition: RefObject<{ x: number; y: number } | null>
  returnFocus: RefObject<HTMLElement | null>
}) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const focusSelector = getTabManagerFocusSelector(
    model.focusedItem,
    model.windowPicker,
  )
  // Menu teardown can call an earlier render's focus handler.
  const latestFocusSelector = useRef(focusSelector)
  useLayoutEffect(() => {
    latestFocusSelector.current = focusSelector
  }, [focusSelector])
  const followOnSelect = useRef(false)
  const surface = useSurface()
  const { canFocusInput } = useSurfaceInputOwner()
  const actions =
    model.actionMenu?.target && model.contextActions
      ? model.contextActions
      : (model.actions ?? [])
  const ordered = [
    ...actions.filter((a) => a.kind === 'primary'),
    ...actions.filter((a) => a.kind === 'secondary'),
  ]
  const open = Boolean(
    (model.actionMenu || model.actionPanel) &&
    model.actionMenu?.target?.type !== 'window',
  )
  const hasSelection =
    model.selectedTabIds.length > 0 || model.selectedGroupIds.length > 0
  const interactive =
    (!surface || surface.inputMode === 'live') && canFocusInput()
  const panel = ordered.find(
    (action) => action.id === model.actionPanel?.actionId,
  )
  const panelId = panel?.id
  const previousPanel = useRef<string | undefined>(undefined)
  useLayoutEffect(() => {
    const previous = previousPanel.current
    previousPanel.current = panelId
    if (!open || !interactive) return
    const target =
      previous && !panelId
        ? menuRef.current?.querySelector<HTMLElement>(
            `[data-action-id="${previous}"]`,
          )
        : menuRef.current?.querySelector<HTMLElement>(
            '[role="menuitem"]:not(:disabled):not([data-disabled])',
          )
    target?.focus({ preventScroll: true })
  }, [panelId, open, interactive, menuRef])
  const position = open ? menuPosition.current : null
  const reducedMotion = useShouldReduceMotion()
  const previousPosition = useRef<typeof position>(null)
  useLayoutEffect(() => {
    const previous = previousPosition.current
    previousPosition.current = position
    if (
      !previous ||
      !position ||
      previous === position ||
      !menuRef.current ||
      reducedMotion
    )
      return
    const animation = animate(
      menuRef.current,
      { opacity: [1, 0, 1] },
      { duration: 0.16, ease: 'easeOut' },
    )
    return () => animation.stop()
  }, [position, menuRef, reducedMotion])
  const anchor = useMemo(
    () => ({
      current: {
        getBoundingClientRect: () =>
          position
            ? new DOMRect(position.x, position.y, 0, 0)
            : ((surface?.root ?? rootRef.current?.closest('[data-tab-manager]'))
                ?.querySelector('[data-action-bar-menu-trigger]')
                ?.getBoundingClientRect() ?? new DOMRect()),
      },
    }),
    [surface?.root, position],
  )
  const run = (action: TabManagerAction, optionId?: string, follow = false) =>
    onIntent({
      type: 'run-action',
      actionId: action.id,
      optionId,
      ...(follow ? { follow: true } : {}),
    })
  const activateAction = (action: TabManagerAction) =>
    action.panel
      ? onIntent({ type: 'open-action-panel', actionId: action.id })
      : run(action)
  const restoreFocus = (event: Event) => {
    event.preventDefault()
    if (canFocusInput()) {
      const active = rootRef.current?.ownerDocument.activeElement
      if (
        active &&
        active !== active.ownerDocument.body &&
        !menuRef.current?.contains(active)
      )
        return
      const manager = rootRef.current?.closest('[data-tab-manager]')
      const origin = returnFocus.current
      const target =
        origin?.isConnected && !origin.closest('[inert],[aria-hidden="true"]')
          ? origin
          : (manager?.querySelector<HTMLElement>(latestFocusSelector.current) ??
            manager?.querySelector<HTMLElement>(
              '[data-action-bar-menu-trigger]',
            ))
      target?.focus({ preventScroll: true })
    }
  }
  const renderItem = (
    id: string,
    content: React.ReactNode,
    activate: (follow?: boolean) => void,
    settings: {
      disabled?: boolean
      reason?: string
      destructive?: boolean
      panel?: boolean
      shortcut?: string
    } = {},
  ) => {
    const props = {
      'data-action-id': id,
      'aria-keyshortcuts': settings.shortcut?.replace(' / ', ' '),
      title: settings.reason,
      disabled: settings.disabled,
      className: cn(itemClass, settings.destructive && 'text-destructive'),
    }
    return interactive ? (
      <Menu.Item
        key={id}
        {...props}
        onPointerUp={(event) => {
          if (event.button !== 0) event.preventDefault()
        }}
        onClick={(event) => {
          if (event.detail > 0 || event.shiftKey)
            followOnSelect.current = event.shiftKey
        }}
        onSelect={(event) => {
          if (settings.panel) event.preventDefault()
          const follow = followOnSelect.current
          followOnSelect.current = false
          activate(follow)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ')
            followOnSelect.current = event.shiftKey
          if (settings.panel && event.key === 'ArrowRight') {
            event.preventDefault()
            activate()
          }
        }}
      >
        {content}
      </Menu.Item>
    ) : (
      <button
        key={id}
        role="menuitem"
        {...props}
        onClick={(event) => activate(event.shiftKey)}
      >
        {content}
      </button>
    )
  }
  const contents = !hasSelection ? (
    <div
      role="status"
      className={`
        flex aspect-square w-full flex-col items-center justify-center gap-4 p-6
        text-center text-base text-muted
      `}
    >
      <MousePointer2 size={32} className="text-accent" aria-hidden="true" />
      <p>Select tabs or groups to see actions.</p>
    </div>
  ) : panel ? (
    <>
      {renderItem(
        'back',
        <>
          <ArrowLeft size={17} />
          <span>Back</span>
        </>,
        () => onIntent({ type: 'dismiss-action-panel' }),
        { panel: true },
      )}
      {panel.panel === 'windows' && (
        <p className="px-3 py-2 text-xs text-muted">
          Hold Shift to move and switch.
        </p>
      )}
      {panel.options?.map((option) => (
        <Fragment key={option.id}>
          {option.dividerBefore && (
            <div role="separator" className="mx-2 my-1 h-px bg-border" />
          )}
          {renderItem(
            option.id,
            <OptionContent
              option={option}
              windows={panel.panel === 'windows'}
            />,
            (follow) => run(panel, option.id, follow),
            {
              disabled: option.disabled,
              reason: option.disabledReason,
              destructive: option.destructive,
            },
          )}
        </Fragment>
      ))}
    </>
  ) : (
    ordered.map((action) =>
      renderItem(
        action.id,
        <>
          <span className="shrink-0 text-muted">
            <ActionIcon name={action.icon} />
          </span>
          <span className="min-w-0 flex-1 text-left">{action.label}</span>
          <span
            aria-hidden="true"
            title={
              action.shortcut === 'Delete / Backspace'
                ? 'Delete or Backspace'
                : action.shortcut
            }
            className="
              ml-auto inline-grid shrink-0 grid-cols-[1.75rem_0.875rem]
              items-center gap-2
            "
          >
            <span className="flex w-7 justify-end">
              {action.shortcut && (
                <Kbd className="w-7" data-shortcut={action.shortcut}>
                  {action.id === 'close-selected-tabs' ? (
                    <Delete className="size-3.5" />
                  ) : (
                    action.shortcut
                  )}
                </Kbd>
              )}
            </span>
            <span className="flex size-3.5 items-center">
              {action.panel && (
                <ChevronRight size={14} className="text-muted" />
              )}
            </span>
          </span>
        </>,
        () => activateAction(action),
        {
          disabled: action.disabled,
          reason: action.disabledReason,
          destructive: action.destructive,
          panel: !!action.panel,
          shortcut: action.shortcut,
        },
      ),
    )
  )
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (panel && event.key === 'ArrowLeft') {
      event.preventDefault()
      event.stopPropagation()
      onIntent({ type: 'dismiss-action-panel' })
      return
    }
    if (
      panel ||
      !interactive ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.repeat ||
      event.nativeEvent.isComposing
    )
      return
    const action = ordered.find(
      (action) =>
        !action.disabled &&
        action.shortcut
          ?.split(' / ')
          .some((key) => key.toLowerCase() === event.key.toLowerCase()),
    )
    if (!action) return
    event.preventDefault()
    event.stopPropagation()
    activateAction(action)
  }
  const popupClass = menuClass
  const staticPopup = open && (
    <div
      ref={menuRef}
      role="menu"
      aria-label={panel?.label ?? 'Selection actions'}
      data-manager-action-menu
      data-action-bar-menu
      className={cn(popupClass, 'absolute right-2 max-h-[75%]')}
      style={{
        bottom: 57 + (model.notifications?.items.length ? 53 : 0),
      }}
    >
      {contents}
    </div>
  )
  return (
    <div
      ref={rootRef}
      data-action-bar-root
      className="relative z-50 bg-background"
    >
      <div
        className="pointer-events-none relative"
        style={{ height: model.notifications?.items.length ? 53 : 0 }}
      >
        <NotificationStack
          items={model.notifications?.items ?? []}
          expanded={model.notifications?.expanded ?? false}
          onExpand={(expanded) =>
            onIntent({ type: 'expand-notifications', expanded })
          }
          onDismiss={(id) => onIntent({ type: 'dismiss-notice', id })}
          onEmptyFocus={() =>
            rootRef.current
              ?.querySelector<HTMLButtonElement>(
                '[data-action-bar-menu-trigger]',
              )
              ?.focus()
          }
        />
      </div>
      <nav
        aria-label="Tab Manager tools"
        data-keyboard-section="tools"
        className={`
          relative flex h-12 shrink-0 items-center justify-between gap-1
          border-t border-border bg-(--manager-chrome) px-2
        `}
      >
        <SummerToolbarArt />
        <div className="flex items-center gap-1">
          <button
            aria-label="Search"
            title="Search"
            className={cn(windowControlClass, 'size-10 px-0')}
            onClick={() => onIntent({ type: 'open-search' })}
          >
            <Search size={18} />
          </button>
          <button
            aria-label="Options"
            title="Options"
            className={cn(windowControlClass, 'size-10 px-0')}
            onClick={() => onIntent({ type: 'open-settings' })}
          >
            <Settings size={18} />
          </button>
          <SummerMotionControl />
        </div>
        <button
          type="button"
          data-action-bar-menu-trigger
          aria-label="More actions"
          title="More actions"
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(windowControlClass, 'size-10 px-0')}
          onClick={() =>
            onIntent(
              open
                ? { type: 'dismiss-action-menu' }
                : { type: 'open-action-menu' },
            )
          }
        >
          <Ellipsis size={18} />
        </button>
      </nav>
      {interactive ? (
        <Menu.Root
          open={open}
          modal={false}
          onOpenChange={(value) => {
            if (!value && open) onIntent({ type: 'dismiss-action-menu' })
          }}
        >
          <Menu.Anchor virtualRef={anchor} />
          <Menu.Portal container={surface?.portalHost ?? undefined}>
            {open && (
              <StableMenuContent
                menuRef={menuRef}
                position={position}
                data-manager-action-menu
                data-action-bar-menu
                aria-label={panel?.label ?? 'Selection actions'}
                side={position ? 'bottom' : 'top'}
                align={position ? 'start' : 'end'}
                sideOffset={position ? 0 : 12}
                collisionBoundary={surface?.root ?? undefined}
                collisionPadding={8}
                loop
                className={popupClass}
                style={{
                  maxHeight: 'min(75vh, var(--radix-popper-available-height))',
                  maxWidth: surface?.root
                    ? `min(calc(100vw - 1rem), ${Math.max(160, surface.root.clientWidth - 16)}px)`
                    : undefined,
                }}
                onCloseAutoFocus={restoreFocus}
                onInteractOutside={(event) => {
                  const target = event.detail.originalEvent.target
                  if (
                    !(target instanceof Element) ||
                    !rootRef.current
                      ?.closest('[data-tab-manager]')
                      ?.contains(target)
                  )
                    return
                  if (
                    target.closest(
                      '[data-action-bar-menu-trigger],[data-tab-id],[data-group-id]',
                    )
                  )
                    event.preventDefault()
                }}
                onKeyDown={onKeyDown}
              >
                {contents}
              </StableMenuContent>
            )}
          </Menu.Portal>
        </Menu.Root>
      ) : surface?.portalHost ? (
        createPortal(staticPopup, surface.portalHost)
      ) : (
        staticPopup
      )}
    </div>
  )
}
