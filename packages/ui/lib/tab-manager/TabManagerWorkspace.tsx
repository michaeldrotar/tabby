import { useLayoutEffect, useRef } from 'react'
import { useSurface, useSurfaceInputOwner } from '../Surface'
import type { ReactNode } from 'react'

export type TabManagerPane = { id: string; label: string; content: ReactNode }

export const TabManagerWorkspace = ({
  panes,
  value,
  onChange,
}: {
  panes: readonly TabManagerPane[]
  value: string
  onChange: (id: string) => void
}) => {
  const root = useRef<HTMLDivElement>(null)
  const select = useRef<HTMLSelectElement>(null)
  const { canFocusInput } = useSurfaceInputOwner()
  const surface = useSurface()
  const live = !surface || surface.inputMode === 'live'
  const selected = panes.find((pane) => pane.id === value) ?? panes[0]
  const previous = useRef(selected?.id)
  useLayoutEffect(() => {
    if (
      previous.current !== selected?.id &&
      live &&
      canFocusInput() &&
      (root.current?.ownerDocument.activeElement ===
        root.current?.ownerDocument.body ||
        root.current?.contains(root.current?.ownerDocument.activeElement))
    )
      select.current?.focus()
    previous.current = selected?.id
  }, [selected?.id, live, canFocusInput])
  return (
    <div
      role="presentation"
      ref={root}
      data-manager-workspace
      className="flex h-full min-h-0 flex-col"
      onKeyDown={(event) => {
        if (
          event.key === 'Escape' &&
          !event.defaultPrevented &&
          selected?.id !== 'tabs' &&
          live &&
          canFocusInput()
        ) {
          event.preventDefault()
          event.stopPropagation()
          onChange('tabs')
        }
      }}
    >
      <nav
        aria-label="Tab manager views"
        className={`
          border-border shrink-0 border-b bg-[var(--manager-chrome)] px-3 py-1
        `}
      >
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">View</span>
          <select
            ref={select}
            aria-label="Tab manager view"
            value={selected?.id}
            onChange={(event) => {
              if (live) onChange(event.target.value)
            }}
            className={`
              text-foreground min-h-10 min-w-0 flex-1 rounded-md
              bg-[var(--manager-chrome)] px-2 font-medium outline-none
              focus-visible:ring-focus focus-visible:ring-2
            `}
          >
            {panes.map((pane) => (
              <option key={pane.id} value={pane.id}>
                {pane.label}
              </option>
            ))}
          </select>
        </label>
      </nav>
      <div
        key={selected?.id}
        data-manager-pane={selected?.id}
        className="min-h-0 flex-1"
      >
        {selected?.content}
      </div>
    </div>
  )
}
