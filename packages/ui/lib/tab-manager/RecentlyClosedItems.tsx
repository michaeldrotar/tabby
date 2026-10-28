import { useLayoutEffect, useRef } from 'react'
import { Favicon } from '../Favicon'
import { useSurface, useSurfaceInputOwner } from '../Surface'
import { windowControlClass } from './ui/WindowNavigation'
import type {
  ClosedSession,
  RecentlyClosedSnapshot,
} from '@extension/core/recentlyClosed'

const SessionSummary = ({
  session,
  formatClosedAt,
}: {
  session: ClosedSession
  formatClosedAt: (timestamp: number) => string
}) => (
  <span className="min-w-0 flex-1">
    <span className="text-foreground block truncate font-medium">
      {session.tabs[0]?.title ?? 'Closed window'}
    </span>
    <span className="text-muted mt-1 block text-xs">
      {session.kind === 'window'
        ? `Window · ${session.tabs.length} ${session.tabs.length === 1 ? 'tab' : 'tabs'}`
        : 'Tab'}{' '}
      · Closed{' '}
      <time dateTime={new Date(session.closedAt).toISOString()}>
        {formatClosedAt(session.closedAt)}
      </time>
    </span>
    <span className="mt-2 flex gap-1" aria-hidden="true">
      {session.tabs.slice(0, 5).map((tab, index) => (
        <Favicon key={index} faviconUrl={tab.faviconUrl} size={16} />
      ))}
    </span>
  </span>
)

export const RecentlyClosedItems = ({
  snapshot,
  onRestore,
  onRefresh,
  formatClosedAt,
}: {
  snapshot: RecentlyClosedSnapshot
  onRestore: (sessionId: string) => void
  onRefresh: () => void
  formatClosedAt: (timestamp: number) => string
}) => {
  const root = useRef<HTMLElement>(null)
  const focusOwner = useRef<HTMLElement | null>(null)
  const surface = useSurface()
  const live = !surface || surface.inputMode === 'live'
  const { canFocusInput } = useSurfaceInputOwner()
  useLayoutEffect(() => {
    const owner = focusOwner.current
    if (
      live &&
      canFocusInput() &&
      owner &&
      !owner.isConnected &&
      root.current?.ownerDocument.activeElement ===
        root.current?.ownerDocument.body
    )
      root.current?.querySelector<HTMLElement>('summary, h2')?.focus()
  }, [snapshot, live, canFocusInput])
  return (
    <section
      aria-label="Recently closed items"
      ref={root}
      data-recently-closed
      data-keyboard-section="recently-closed"
      className="space-y-2 p-3"
      onFocusCapture={(event) => {
        focusOwner.current = event.target as HTMLElement
      }}
      onKeyDownCapture={(event) => {
        if (!live || !canFocusInput()) return
        if (
          !['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key) ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        )
          return
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'summary, details[open] button:not(:disabled), [data-closed-tab] button:not(:disabled), [data-retry]',
          ),
        )
        const index = controls.indexOf(event.target as HTMLElement)
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? controls.length - 1
              : index + (event.key === 'ArrowUp' ? -1 : 1)
        const manager = root.current?.closest('[data-manager-workspace]')
        const destination =
          controls[next] ??
          manager?.querySelector<HTMLElement>(
            next < 0
              ? '[aria-label="Tab manager view"]'
              : '[data-keyboard-section="tools"] button',
          )
        if (destination) {
          event.preventDefault()
          event.stopPropagation()
          destination.focus()
          destination.scrollIntoView?.({ block: 'nearest' })
        }
      }}
    >
      <h2 tabIndex={-1} className="px-3 text-sm font-medium outline-none">
        Recently closed
      </h2>
      <p className="text-muted px-3 text-xs">
        Chrome keeps up to 25 closed tabs and windows combined. This is not a
        permanent archive.
      </p>
      {snapshot.error && (
        <div role="alert" className="px-3 text-sm">
          <p>{snapshot.error}</p>
          <button
            data-retry
            className={windowControlClass}
            onClick={() => {
              if (live) onRefresh()
            }}
          >
            Try again
          </button>
        </div>
      )}
      {snapshot.status === 'loading' ? (
        <p role="status" className="text-muted px-3 text-sm">
          Loading recently closed items…
        </p>
      ) : snapshot.status === 'ready' && snapshot.sessions.length === 0 ? (
        <p role="status" className="text-muted px-3 text-sm">
          No recently closed items available.
        </p>
      ) : null}
      {snapshot.sessions.map((session) =>
        session.kind === 'tab' ? (
          <article
            key={session.sessionId}
            data-closed-tab
            className={`
              border-border flex min-w-0 items-center gap-2 rounded-md border
              p-3
            `}
          >
            <SessionSummary session={session} formatClosedAt={formatClosedAt} />
            <button
              className={windowControlClass}
              disabled={!!snapshot.restoringSessionId}
              onClick={() => {
                if (live) onRestore(session.sessionId)
              }}
            >
              {snapshot.restoringSessionId === session.sessionId
                ? 'Restoring tab…'
                : 'Restore tab'}
            </button>
          </article>
        ) : (
          <details
            key={session.sessionId}
            className="border-border rounded-md border"
          >
            <summary
              className={`
                ${windowControlClass}
                cursor-pointer justify-start py-3
              `}
            >
              <SessionSummary
                session={session}
                formatClosedAt={formatClosedAt}
              />
              <span aria-hidden="true" className="text-muted text-xs">
                Preview
              </span>
            </summary>
            <ul
              aria-label="Tabs in this closed window"
              className="space-y-2 px-3 pb-3 text-sm"
            >
              {session.tabs.map((tab, index) => (
                <li key={index} className="flex min-w-0 items-center gap-2">
                  <Favicon faviconUrl={tab.faviconUrl} size={16} />
                  <span className="truncate" title={tab.url}>
                    {tab.title}
                  </span>
                </li>
              ))}
            </ul>
            <button
              className={`
                ${windowControlClass}
                bg-accent-selected text-foreground m-2 w-[calc(100%-1rem)]
                disabled:opacity-50
              `}
              disabled={!!snapshot.restoringSessionId}
              onClick={() => {
                if (live) onRestore(session.sessionId)
              }}
            >
              {snapshot.restoringSessionId === session.sessionId
                ? 'Restoring window…'
                : 'Restore entire window'}
            </button>
          </details>
        ),
      )}
    </section>
  )
}
