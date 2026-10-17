import * as Menu from '@radix-ui/react-menu'
import { animate } from 'framer-motion'
import {
  ArrowDown,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
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
import { Fragment, useLayoutEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { NotificationStack } from '../../components/NotificationStack'
import { useSurface, useSurfaceInputOwner } from '../../Surface'
import { getGroupColorClasses } from '../../tab-group/tabGroupColors'
import { useShouldReduceMotion } from '../../useShouldReduceMotion'
import { cn } from '../../utils/cn'
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
  ChevronDown,
  ChevronUp,
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
  'text-popover-foreground flex min-h-9 w-full cursor-default select-none items-center gap-3 rounded px-3 py-2 text-left text-sm outline-none data-[highlighted]:bg-highlighted/50 data-[state=open]:bg-highlighted/50 data-[disabled]:opacity-45'
const menuClass =
  'bg-popover border-border text-popover-foreground z-[80] min-w-48 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-lg border p-1 shadow-lg outline-none'
const OptionContent = ({
  option,
  windows,
}: {
  option: TabManagerActionOption
  windows: boolean
}) => (
  <>
    <span className="text-muted shrink-0">
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
      <span className="text-muted text-xs">{option.subtitle}</span>
    )}
  </>
)

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
  const run = (action: TabManagerAction, optionId?: string) =>
    onIntent({ type: 'run-action', actionId: action.id, optionId })
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
      const target = returnFocus.current?.isConnected
        ? returnFocus.current
        : (
            surface?.root ?? rootRef.current?.closest('[data-tab-manager]')
          )?.querySelector<HTMLElement>('[data-action-bar-menu-trigger]')
      target?.focus({ preventScroll: true })
    }
  }
  const renderItem = (
    id: string,
    content: React.ReactNode,
    activate: () => void,
    settings: {
      disabled?: boolean
      reason?: string
      destructive?: boolean
      panel?: boolean
    } = {},
  ) => {
    const props = {
      'data-action-id': id,
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
        onSelect={(event) => {
          if (settings.panel) event.preventDefault()
          activate()
        }}
        onKeyDown={(event) => {
          if (settings.panel && event.key === 'ArrowRight') {
            event.preventDefault()
            activate()
          }
        }}
      >
        {content}
      </Menu.Item>
    ) : (
      <button key={id} role="menuitem" {...props} onClick={activate}>
        {content}
      </button>
    )
  }
  const contents = !hasSelection ? (
    <div
      role="status"
      className={`
        text-muted flex aspect-square w-full flex-col items-center
        justify-center gap-4 p-6 text-center text-base
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
      {panel.options?.map((option) => (
        <Fragment key={option.id}>
          {option.dividerBefore && (
            <div role="separator" className="bg-border mx-2 my-1 h-px" />
          )}
          {renderItem(
            option.id,
            <OptionContent
              option={option}
              windows={panel.panel === 'windows'}
            />,
            () => run(panel, option.id),
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
          <span className="text-muted shrink-0">
            <ActionIcon name={action.icon} />
          </span>
          <span className="min-w-0 flex-1 text-left">{action.label}</span>
          {action.panel && (
            <ChevronRight size={14} className="text-muted shrink-0" />
          )}
        </>,
        () =>
          action.panel
            ? onIntent({ type: 'open-action-panel', actionId: action.id })
            : run(action),
        {
          disabled: action.disabled,
          reason: action.disabledReason,
          destructive: action.destructive,
          panel: !!action.panel,
        },
      ),
    )
  )
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (panel && event.key === 'ArrowLeft') {
      event.preventDefault()
      event.stopPropagation()
      onIntent({ type: 'dismiss-action-panel' })
    }
  }
  const popupClass = cn(menuClass, !hasSelection && 'w-56')
  const staticPopup = open && (
    <div
      ref={menuRef}
      role="menu"
      aria-label={panel?.label ?? 'Selection actions'}
      data-manager-action-menu
      data-action-bar-menu
      className={cn(
        popupClass,
        'absolute right-2 max-h-[75%]',
        hasSelection && 'w-[min(22rem,calc(100%-1rem))]',
      )}
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
      className="bg-background relative z-50"
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
          border-border bg-background flex h-12 shrink-0 items-center
          justify-between gap-1 border-t px-2
        `}
      >
        <div className="flex items-center gap-1">
          <button
            aria-label="Search everything"
            title="Search everything"
            className={cn(windowControlClass, 'size-10 px-0')}
            onClick={() => onIntent({ type: 'open-search' })}
          >
            <Search size={18} />
          </button>
          <button
            aria-label="Settings"
            title="Settings"
            className={cn(windowControlClass, 'size-10 px-0')}
            onClick={() => onIntent({ type: 'open-settings' })}
          >
            <Settings size={18} />
          </button>
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
            <Menu.Content
              ref={menuRef}
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
                  ? Math.max(160, surface.root.clientWidth - 16)
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
            </Menu.Content>
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
