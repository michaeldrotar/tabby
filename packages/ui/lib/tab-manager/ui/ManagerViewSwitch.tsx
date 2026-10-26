import { useLayoutEffect, useRef } from 'react'
import { useSurfaceInputOwner } from '../../Surface'
import { cn } from '../../utils/cn'

export const ManagerViewSwitch = ({
  view,
  onChange,
  restoreFocus = false,
  disabled = false,
}: {
  view: 'tabs' | 'bookmarks'
  onChange: (view: 'tabs' | 'bookmarks') => void
  restoreFocus?: boolean
  disabled?: boolean
}) => {
  const root = useRef<HTMLDivElement>(null)
  const { canFocusInput } = useSurfaceInputOwner()
  useLayoutEffect(() => {
    if (restoreFocus && canFocusInput())
      root.current
        ?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
        ?.focus({ preventScroll: true })
  }, [view, restoreFocus, canFocusInput])
  return (
    <div
      ref={root}
      role="group"
      aria-label="Tab manager views"
      className="bg-background/40 flex items-center gap-0.5 rounded-lg p-0.5"
    >
      {(['tabs', 'bookmarks'] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          title={value === 'tabs' ? 'Windows and tabs' : 'Bookmarks'}
          disabled={disabled}
          className={cn(
            `
              text-muted min-h-10 rounded-md px-2 text-xs
              hover:bg-accent-hover hover:text-foreground
              focus-visible:ring-focus focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-inset
              disabled:opacity-50
            `,
            view === value && 'bg-accent-selected text-foreground',
          )}
          onClick={() => {
            if (value !== view) onChange(value)
          }}
        >
          {value === 'tabs' ? 'Tabs' : 'Bookmarks'}
        </button>
      ))}
    </div>
  )
}
