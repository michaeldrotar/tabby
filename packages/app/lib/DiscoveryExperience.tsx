import { discoveryTips } from '@extension/core/discovery'
import { useSurface } from '@extension/ui/Surface'
import { discoveryButtonClass, Walkthrough } from '@extension/ui/Walkthrough'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { createPortal } from 'react-dom'
import { useTabbyResources } from './TabbyProvider'
import type {
  DiscoveryResource,
  DiscoveryTip,
  WalkthroughId,
} from '@extension/core/discovery'
import type { PreferenceState } from '@extension/core/preferences'
import type { WalkthroughStep } from '@extension/ui/Walkthrough'

export const walkthroughSteps: Record<
  WalkthroughId,
  readonly WalkthroughStep[]
> = {
  omnibar: [
    {
      title: 'Find a page or a command',
      description:
        'Search tabs, windows, groups, bookmarks, history, and closed pages. Use ↑ and ↓ to choose a result, then Enter to open it. Cmd/Ctrl+Enter opens a new tab; Shift+Enter opens a window.',
      target: '[data-omnibar-query]',
    },
    {
      title: 'Choose where to search',
      description:
        'Click this button or press Tab to choose a search scope. Pick a letter, or use the arrow keys and Enter. Your search text stays in place.',
      target: '[data-omnibar-scope-trigger]',
    },
    {
      title: 'Keep your tools close',
      description:
        'The X button or Escape closes search. From an empty search, Open tab manager organizes your windows and Open options holds settings, tips, and both walkthroughs.',
      target: '[data-omnibar-shortcuts]',
    },
  ],
  'tab-manager': [
    {
      title: 'Find your windows',
      description:
        'Click the window name to see your windows. Use the pencil to give a window a name, icon, and color. Hold Shift when picking a window to reverse whether you switch to it.',
      target: '[data-window-picker-trigger]',
    },
    {
      title: 'Organize tabs together',
      description:
        'Cmd/Ctrl-click toggles tabs; Shift-click selects a range. Drag tabs or whole groups to move them. Hold over the window header to reveal other destinations. Shift reverses whether you follow.',
      target: '[data-tab-id]',
    },
    {
      title: 'Actions and shortcuts',
      description:
        'Search finds pages. Options holds settings, tips, and these walkthroughs. More actions works on your selection and shows shortcut keys: try W to move, G to group, or P to pin.',
      target: '[data-keyboard-section="tools"]',
    },
  ],
}

const tourNames: Record<WalkthroughId, string> = {
  omnibar: 'Search walkthrough',
  'tab-manager': 'Tab manager walkthrough',
}

const useDiscoverySnapshot = (resource: DiscoveryResource) =>
  useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getSnapshot,
  )

const useDiscoveryActions = () => {
  const { preferences } = useTabbyResources()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [undo, setUndo] = useState<Partial<PreferenceState> | null>(null)
  const report = (error: unknown) =>
    setError(error instanceof Error ? error.message : String(error))
  const run = async (action: () => void | Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (error) {
      report(error)
    } finally {
      setBusy(false)
    }
  }
  const apply = async (tip: DiscoveryTip) => {
    if (!('patch' in tip)) return
    const current = preferences.getSnapshot()
    const previous = Object.fromEntries(
      Object.keys(tip.patch).map((key) => [
        key,
        current[key as keyof PreferenceState],
      ]),
    )
    await preferences.set(tip.patch)
    setUndo(previous)
  }
  return {
    busy,
    error,
    run,
    apply,
    report,
    feedback: undo ? (
      <SettingSnackbar
        busy={busy}
        onDismiss={() => setUndo(null)}
        onUndo={() =>
          void run(async () => {
            await preferences.set(undo)
            setUndo(null)
          })
        }
      />
    ) : null,
  }
}

const SettingSnackbar = ({
  busy,
  onUndo,
  onDismiss,
}: {
  busy: boolean
  onUndo: () => void
  onDismiss: () => void
}) => {
  const [paused, setPaused] = useState(false)
  const undoButton = useRef<HTMLButtonElement>(null)
  const surface = useSurface()
  useLayoutEffect(() => {
    const previous = surface?.root?.ownerDocument.activeElement
    return () => {
      const root = surface?.root
      queueMicrotask(() => {
        if (
          root &&
          root.ownerDocument.activeElement === root.ownerDocument.body
        ) {
          if (previous instanceof HTMLElement && previous.isConnected)
            previous.focus({ preventScroll: true })
          else
            root
              .querySelector<HTMLElement>(
                '[data-omnibar-query], [data-window-picker-trigger]',
              )
              ?.focus({ preventScroll: true })
        }
      })
    }
  }, [surface?.root])
  useLayoutEffect(() => {
    if (!busy) undoButton.current?.focus({ preventScroll: true })
  }, [busy, surface?.portalHost])
  useEffect(() => {
    if (paused || busy) return
    const timer = setTimeout(onDismiss, 10000)
    return () => clearTimeout(timer)
  }, [onDismiss, paused, busy])
  const snackbar = (
    <div
      role="status"
      className="
        absolute inset-x-3 bottom-3 z-110 mx-auto flex max-w-md flex-wrap
        items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm
        text-card-foreground shadow-lg
      "
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
      }}
    >
      <span className="mr-auto">Setting changed.</span>
      <button
        ref={undoButton}
        type="button"
        className={discoveryButtonClass}
        disabled={busy}
        onClick={onUndo}
      >
        Undo
      </button>
      <button
        type="button"
        className={discoveryButtonClass}
        disabled={busy}
        onClick={onDismiss}
      >
        Dismiss
      </button>
    </div>
  )
  return surface?.portalHost
    ? createPortal(snackbar, surface.portalHost)
    : snackbar
}

export const DiscoveryExperience = ({
  area,
  ready,
}: {
  area: WalkthroughId
  ready: boolean
}) => {
  const { discovery } = useTabbyResources()
  return discovery ? (
    <ConnectedDiscovery area={area} ready={ready} resource={discovery} />
  ) : null
}

const ConnectedDiscovery = ({
  area,
  ready,
  resource,
}: {
  area: WalkthroughId
  ready: boolean
  resource: DiscoveryResource
}) => {
  const { host, omnibar, backend } = useTabbyResources()
  const surface = useSurface()
  const state = useDiscoverySnapshot(resource)
  const actions = useDiscoveryActions()
  if (!ready || !state.loaded || (surface && surface.inputMode !== 'live'))
    return null
  if (!state.completedTours.includes(area))
    return (
      <Walkthrough
        name={tourNames[area]}
        steps={walkthroughSteps[area]}
        busy={actions.busy}
        error={actions.error}
        onComplete={() => void actions.run(() => resource.completeTour(area))}
      />
    )
  const windowId =
    host?.getCurrentWindowId?.() ??
    backend.getSnapshot().windows.find((window) => window.focused)?.id
  const pending = state.tipsEnabled
    ? state.pendingTips.find(
        (tip) =>
          (tip.id === 'search-scopes'
            ? area === 'omnibar'
            : area === 'tab-manager') &&
          (tip.windowId === undefined || tip.windowId === windowId),
      )
    : undefined
  const tip = discoveryTips.find((tip) => tip.id === pending?.id)
  return (
    <>
      {tip && !actions.feedback && (
        <aside
          aria-label="Tabby tip"
          aria-live="polite"
          className="
            absolute inset-x-3 bottom-16 z-90 mx-auto max-w-sm rounded-lg border
            border-accent-border bg-card p-4 text-card-foreground shadow-lg
          "
        >
          <h2 className="text-base font-semibold">{tip.title}</h2>
          <p className="mt-2 text-sm/relaxed">{tip.description}</p>
          {actions.error && (
            <p role="alert" className="mt-2 text-sm">
              {actions.error}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {'patch' in tip && (
              <button
                type="button"
                disabled={actions.busy}
                className={discoveryButtonClass}
                onClick={() =>
                  void actions.run(async () => {
                    await actions.apply(tip)
                    await resource.dismissTip(tip.id)
                  })
                }
              >
                {tip.action}
              </button>
            )}
            <button
              type="button"
              disabled={actions.busy}
              className={discoveryButtonClass}
              onClick={() =>
                void actions.run(() => resource.dismissTip(tip.id))
              }
            >
              Got it
            </button>
            <a
              href="/options/index.html#tips-and-walkthroughs"
              target="_blank"
              rel="noreferrer"
              aria-disabled={actions.busy}
              className="
                rounded-sm text-sm text-accent underline
                focus-visible:outline-2 focus-visible:outline-accent
              "
              onClick={(event) => {
                event.preventDefault()
                if (actions.busy) return
                void actions.run(async () => {
                  await resource.dismissTip(tip.id)
                  if (area === 'omnibar')
                    await omnibar.execute({ kind: 'options' })
                  else await host?.openOptions?.()
                })
              }}
            >
              Open options
            </a>
          </div>
        </aside>
      )}
      {actions.feedback}
      {actions.error && (actions.feedback || !tip) && (
        <p
          role="alert"
          className="
            absolute inset-x-3 bottom-16 z-110 rounded-lg border border-border
            bg-card p-3 text-sm
          "
        >
          {actions.error}
        </p>
      )}
    </>
  )
}

export const DiscoveryOptions = () => {
  const { discovery } = useTabbyResources()
  return discovery ? <ConnectedDiscoveryOptions resource={discovery} /> : null
}

const ConnectedDiscoveryOptions = ({
  resource,
}: {
  resource: DiscoveryResource
}) => {
  const state = useDiscoverySnapshot(resource)
  const actions = useDiscoveryActions()
  return (
    <section aria-label="Tips and walkthroughs" className="mb-6">
      <h2 id="tips-and-walkthroughs" className="mb-4 text-2xl font-semibold">
        Tips and walkthroughs
      </h2>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted">
          Replay a brief tour, or browse every tip at your own pace.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['omnibar', 'tab-manager'] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={discoveryButtonClass}
              disabled={actions.busy || !state.loaded}
              onClick={() => void actions.run(() => resource.restartTour(id))}
            >
              Replay {id === 'omnibar' ? 'search' : 'tab manager'} walkthrough
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">
          Open search or the tab manager to start its walkthrough. Tips appear
          gradually as you use Tabby.
        </p>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={state.tipsEnabled}
            disabled={actions.busy || !state.loaded}
            onChange={(event) =>
              void actions.run(() =>
                resource.setTipsEnabled(event.target.checked),
              )
            }
          />
          Show tips as I use Tabby
        </label>
        {actions.error && (
          <p role="alert" className="mt-3 text-sm">
            {actions.error}
          </p>
        )}
        <div className="mt-4 space-y-2">
          {(['omnibar', 'tab-manager'] as const).map((id) => (
            <details key={id} className="rounded-sm border border-border p-3">
              <summary className="cursor-pointer text-sm font-medium">
                {tourNames[id]}
              </summary>
              <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm">
                {walkthroughSteps[id].map((step) => (
                  <li key={step.title}>
                    <p className="font-medium">{step.title}</p>
                    <p className="mt-1 text-muted">{step.description}</p>
                  </li>
                ))}
              </ol>
            </details>
          ))}
          {discoveryTips.map((tip) => (
            <details
              key={tip.id}
              className="rounded-sm border border-border p-3"
              onToggle={(event) => {
                if (
                  event.currentTarget.open &&
                  !state.seenTips.includes(tip.id)
                )
                  void resource.dismissTip(tip.id).catch(actions.report)
              }}
            >
              <summary className="cursor-pointer text-sm font-medium">
                {tip.title}{' '}
                <span className="ml-1 font-normal text-muted">
                  {state.seenTips.includes(tip.id) ? 'Seen' : 'New'}
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted">{tip.description}</p>
              {'patch' in tip && (
                <button
                  type="button"
                  className={`
                    ${discoveryButtonClass}
                    mt-3
                  `}
                  disabled={actions.busy || !state.loaded}
                  onClick={() =>
                    void actions.run(async () => {
                      await actions.apply(tip)
                      await resource.dismissTip(tip.id)
                    })
                  }
                >
                  {tip.action}
                </button>
              )}
            </details>
          ))}
        </div>
      </div>
      {actions.feedback}
    </section>
  )
}
