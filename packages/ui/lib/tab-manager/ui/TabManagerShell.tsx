import { ScrollArea } from '../../ScrollArea'
import { useSurface, useSurfaceId } from '../../Surface'
import { cn } from '../../utils/cn'

export type TabManagerShellProps = {
  sidebar: React.ReactNode
  children: React.ReactNode
  /** Optional overlay content (e.g., animation effects) that should cover the entire shell */
  overlay?: React.ReactNode
  /** Optional action bar rendered below the main content area */
  actionBar?: React.ReactNode
  className?: string
  /** Selection mode for visual styling of focus vs selection */
  selectionMode?: 'default' | 'multi-select'
}

export const TabManagerShell = ({
  sidebar,
  children,
  overlay,
  actionBar,
  className,
  selectionMode = 'default',
}: TabManagerShellProps) => {
  const surface = useSurface()
  const mainId = useSurfaceId('tab-manager-main')
  return (
    <div
      data-selection-mode={selectionMode}
      className={cn(
        'bg-background relative flex w-full overflow-hidden',
        surface ? 'h-full min-h-0' : 'h-screen',
        className,
      )}
    >
      <a
        href={`#${mainId}`}
        className={`
          bg-popover text-popover-foreground sr-only absolute left-2 top-2
          z-[90] rounded p-2 text-sm
          focus-visible:outline-accent focus-visible:outline
          focus-visible:outline-2
          focus:not-sr-only
        `}
        onClick={(event) => {
          event.preventDefault()
          event.currentTarget.ownerDocument.getElementById(mainId)?.focus()
        }}
      >
        Skip to tabs
      </a>
      <aside className="border-border flex-shrink-0 border-r">{sidebar}</aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <ScrollArea
          data-manager-scroll
          className="flex-1"
          orientation="vertical"
        >
          <main
            id={mainId}
            tabIndex={-1}
            aria-label="Tabs"
            className="h-full outline-none"
          >
            <h1 className="sr-only">Tab manager</h1>
            {children}
          </main>
        </ScrollArea>
        {actionBar}
      </div>
      {/* Overlay slot for effects that need to cover the entire shell */}
      {overlay}
    </div>
  )
}
