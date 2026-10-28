import { Download, PanelsTopLeft } from 'lucide-react'
import { cn } from '../utils/cn'

const panes = [
  { id: 'tabs', label: 'Tabs', icon: PanelsTopLeft },
  { id: 'downloads', label: 'Downloads', icon: Download },
] as const
export type ManagerPane = (typeof panes)[number]['id']

export const ManagerPaneSwitcher = ({
  active,
  onChange,
  id,
}: {
  id: string
  active: ManagerPane
  onChange: (pane: ManagerPane) => void
}) => {
  return (
    <div
      role="tablist"
      aria-label="Manager panes"
      className={`
        border-border flex shrink-0 gap-1 overflow-x-auto border-b
        bg-[var(--manager-chrome)] px-2
      `}
    >
      {panes.map(({ id: pane, label, icon: Icon }, index) => (
        <button
          key={pane}
          id={`${id}-${pane}`}
          role="tab"
          aria-selected={active === pane}
          aria-controls={`${id}-${pane}-panel`}
          tabIndex={active === pane ? 0 : -1}
          className={cn(
            `
              focus-visible:ring-focus focus-visible:ring-2
              focus-visible:ring-inset
              relative flex min-h-11 shrink-0 items-center gap-2 px-3 text-sm
              outline-none
            `,
            active === pane
              ? `
                text-foreground font-medium
                after:bg-accent after:absolute after:inset-x-3 after:bottom-0
                after:h-0.5
              `
              : `
                text-muted
                hover:text-foreground
              `,
          )}
          onClick={() => onChange(pane)}
          onKeyDown={(event) => {
            const next =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? panes.length - 1
                  : event.key === 'ArrowRight'
                    ? (index + 1) % panes.length
                    : event.key === 'ArrowLeft'
                      ? (index + panes.length - 1) % panes.length
                      : undefined
            if (next === undefined || !panes[next]) return
            event.preventDefault()
            onChange(panes[next].id)
            event.currentTarget.parentElement
              ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
              [next]?.focus()
          }}
        >
          <Icon size={16} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  )
}
