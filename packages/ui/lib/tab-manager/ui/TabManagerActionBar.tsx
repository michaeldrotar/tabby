import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDown,
  ChevronDown,
  ChevronLeft,
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
  Palette,
  Pencil,
  Pin,
  PinOff,
  RefreshCw,
  Trash2,
  Ungroup,
  Volume2,
  VolumeOff,
} from 'lucide-react'
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { NotificationStack } from '../../components/NotificationStack'
import { useSurface } from '../../Surface'
import { getGroupColorClasses } from '../../tab-group/tabGroupColors'
import { useShouldSettleMotion } from '../../useShouldReduceMotion'
import { cn } from '../../utils/cn'
import { formatSelectionCount } from './actionBarLayout'
import type {
  TabManagerAction,
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
  RefreshCw,
  Trash2,
  Ungroup,
  Volume2,
  VolumeOff,
}
const ActionIcon = ({ name }: { name?: string }) => {
  const key = Object.keys(icons).find(
    (candidate) =>
      candidate.toLowerCase() === name?.replaceAll('-', '').toLowerCase(),
  )
  const Icon = icons[(key ?? 'Layers') as keyof typeof icons]
  return <Icon size={17} aria-hidden="true" />
}
const countLabel = (count: number, entity: string) =>
  `${formatSelectionCount(count)} ${entity}${count === 1 ? '' : 's'}`
const itemClass = `text-popover-foreground flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-highlighted/50 focus-visible:bg-highlighted/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45`

export const TabManagerActionBar = ({
  model,
  onIntent,
  menuRef,
}: {
  model: TabManagerViewModel
  onIntent: (intent: TabManagerIntent) => void
  menuRef: RefObject<HTMLDivElement | null>
}) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const surface = useSurface()
  const settle = useShouldSettleMotion()
  const actions =
    model.actionMenu?.target && model.contextActions
      ? model.contextActions
      : (model.actions ?? [])
  const ordered = [
    ...actions.filter((action) => action.kind === 'primary'),
    ...actions.filter((action) => action.kind === 'secondary'),
  ]
  const panelAction = [
    ...actions,
    ...(model.actions ?? []),
    ...(model.contextActions ?? []),
  ].find((action) => action.id === model.actionPanel?.actionId)
  const selectedGroupCount =
    model.selectedGroupCount ?? model.selectedGroupIds.length
  const open = Boolean(model.actionMenu || model.actionPanel)
  const run = (action: TabManagerAction) =>
    onIntent(
      action.panel
        ? { type: 'open-action-panel', actionId: action.id }
        : { type: 'run-action', actionId: action.id },
    )
  const popup = (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key={model.actionPanel?.actionId ?? 'overflow-menu'}
          ref={menuRef}
          data-manager-action-menu
          {...(model.actionPanel
            ? { 'data-action-bar-panel': '' }
            : { 'data-action-bar-menu': '' })}
          role="menu"
          aria-label={panelAction?.label ?? 'Selection actions'}
          initial={settle ? false : { y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ duration: settle ? 0 : 0.15, ease: 'easeOut' }}
          className={`
            bg-popover border-border absolute bottom-16 right-2 z-[80] flex
            max-h-[min(75%,34rem)] w-[min(22rem,calc(100%-1rem))] flex-col
            overflow-hidden rounded-lg border shadow-lg
          `}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              onIntent({ type: 'dismiss-action-menu' })
              surface?.root
                ?.querySelector<HTMLElement>('[data-action-bar-menu-trigger]')
                ?.focus()
            } else if (
              ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)
            ) {
              event.preventDefault()
              const entries = Array.from(
                menuRef.current?.querySelectorAll<HTMLElement>(
                  '[role="menuitem"]:not(:disabled)',
                ) ?? [],
              )
              const index = entries.indexOf(event.target as HTMLElement)
              const next =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? entries.length - 1
                    : (index +
                        (event.key === 'ArrowUp' ? -1 : 1) +
                        entries.length) %
                      entries.length
              entries[next]?.focus()
            }
          }}
        >
          {model.actionPanel && panelAction ? (
            <>
              <div
                className={`
                  border-border flex-shrink-0 border-b px-3 py-2 text-sm
                  font-medium
                `}
              >
                {panelAction.label}
              </div>
              <div
                data-action-bar-panel-scroll-region
                className="min-h-0 flex-1 overflow-y-auto py-1"
              >
                {panelAction.options?.map((option) => (
                  <div key={option.id}>
                    {option.dividerBefore && (
                      <div className="bg-border mx-2 my-1 h-px" />
                    )}
                    <button
                      role="menuitem"
                      disabled={option.disabled}
                      title={option.disabledReason}
                      className={cn(
                        itemClass,
                        option.destructive && 'text-destructive',
                      )}
                      onClick={() =>
                        onIntent({
                          type: 'run-action',
                          actionId: panelAction.id,
                          optionId: option.id,
                        })
                      }
                    >
                      <span className="text-muted flex-shrink-0">
                        {option.color ? (
                          <span
                            role="img"
                            aria-label={`${option.label} color swatch`}
                            className={cn(
                              'block size-4 rounded-full',
                              getGroupColorClasses(option.color).dot,
                            )}
                          />
                        ) : option.iconUrl ? (
                          <img
                            src={option.iconUrl}
                            width={16}
                            height={16}
                            alt=""
                          />
                        ) : (
                          <ActionIcon name={option.icon} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-left">
                        {option.label}
                      </span>
                      {option.subtitle && (
                        <span className="text-muted text-xs">
                          {option.subtitle}
                        </span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-border flex-shrink-0 border-t p-2">
                <button
                  role="menuitem"
                  data-action-bar-panel-back
                  className={cn(itemClass, 'rounded px-2')}
                  onClick={() => onIntent({ type: 'dismiss-action-panel' })}
                >
                  <ChevronLeft size={15} />
                  <span>Back</span>
                </button>
              </div>
            </>
          ) : ordered.length ? (
            <div className="min-h-0 flex-1 overflow-y-auto py-1">
              {ordered.map((action, index) => (
                <div key={action.id}>
                  <button
                    role="menuitem"
                    disabled={action.disabled}
                    title={action.disabledReason}
                    className={cn(
                      itemClass,
                      action.destructive && 'text-destructive',
                    )}
                    onClick={() => run(action)}
                  >
                    <span className="text-muted flex-shrink-0">
                      <ActionIcon name={action.icon} />
                    </span>
                    <span className="flex-1 text-left">{action.label}</span>
                    {action.panel ? (
                      <ChevronRight size={14} className="text-muted" />
                    ) : (
                      action.shortcut && (
                        <kbd className="text-muted font-mono text-xs">
                          {action.shortcut}
                        </kbd>
                      )
                    )}
                  </button>
                  {action.kind === 'primary' &&
                    ordered[index + 1]?.kind === 'secondary' && (
                      <div className="bg-border mx-2 my-1 h-px" />
                    )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted px-3 py-3 text-sm">
              Select items to see actions.
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
  return (
    <div
      ref={rootRef}
      data-action-bar-root
      className="bg-background relative z-50"
    >
      <div
        inert={!!model.notifications?.items.length}
        aria-hidden={model.notifications?.items.length ? true : undefined}
        className={cn(
          'border-border border-t p-2',
          !!model.notifications?.items.length && 'invisible',
        )}
      >
        <div className="flex h-9 items-center gap-2">
          <div
            data-selection-summary
            data-selected-tabs={model.selectedTabIds.length}
            data-selected-windows={model.selectedWindowIds.length}
            data-selected-groups={selectedGroupCount}
            className="ml-auto flex flex-shrink-0 items-center gap-1"
            aria-label={`${countLabel(model.selectedWindowIds.length, 'window')}, ${countLabel(selectedGroupCount, 'tab group')}, ${countLabel(model.selectedTabIds.length, 'tab')}`}
          >
            {[
              [MonitorUp, model.selectedWindowIds.length, 'window'],
              [FolderPlus, selectedGroupCount, 'tab group'],
              [Layers, model.selectedTabIds.length, 'tab'],
            ].map(([Icon, count, entity]) => {
              const ItemIcon = Icon as typeof Layers
              return (
                <span
                  key={String(entity)}
                  title={countLabel(Number(count), String(entity))}
                  className={`
                    text-muted flex h-7 w-[3.5rem] flex-shrink-0 items-center
                    gap-1 whitespace-nowrap text-xs
                  `}
                >
                  <ItemIcon size={14} aria-hidden="true" />
                  {formatSelectionCount(Number(count))}
                </span>
              )
            })}
          </div>
          <button
            type="button"
            data-action-bar-menu-trigger
            aria-label="More actions"
            aria-expanded={open}
            className={cn(
              `
                text-muted flex h-9 w-9 flex-shrink-0 items-center
                justify-center rounded-md transition-colors
                hover:bg-highlighted/50 hover:text-foreground
                focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                focus-visible:ring-offset-background focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-offset-2
              `,
              open && 'bg-highlighted/50 text-foreground',
            )}
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
        </div>
      </div>
      <NotificationStack
        items={model.notifications?.items ?? []}
        expanded={model.notifications?.expanded ?? false}
        onExpand={(expanded) =>
          onIntent({ type: 'expand-notifications', expanded })
        }
        onDismiss={(id) => onIntent({ type: 'dismiss-notice', id })}
        onEmptyFocus={() =>
          rootRef.current
            ?.querySelector<HTMLButtonElement>('[data-action-bar-menu-trigger]')
            ?.focus()
        }
      />
      {surface?.portalHost ? createPortal(popup, surface.portalHost) : popup}
    </div>
  )
}
