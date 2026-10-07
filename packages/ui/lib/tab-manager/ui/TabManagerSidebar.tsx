import { memo, useEffect, useRef, useState } from 'react'
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from '../../icons'
import { ScrollArea } from '../../ScrollArea'
import { cn } from '../../utils/cn'

const NARROW_SIDEBAR_QUERY = '(max-width: 599px)'

export type TabManagerSidebarProps = {
  isExpanded: boolean
  onToggleExpand: () => void
  windowList: React.ReactNode
  actions: React.ReactNode
  windowCount?: number
  className?: string
  collapseSidebarLabel: string
  expandSidebarLabel: string
}

export const TabManagerSidebar = memo(function TabManagerSidebar({
  isExpanded,
  onToggleExpand,
  windowList,
  actions,
  windowCount,
  className,
  collapseSidebarLabel,
  expandSidebarLabel,
}: TabManagerSidebarProps) {
  const [isNarrowViewport, setIsNarrowViewport] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.(NARROW_SIDEBAR_QUERY).matches === true,
  )
  const [surfaceState, setSurfaceState] = useState({
    isExpanded,
    isRaised: isExpanded,
  })
  if (surfaceState.isExpanded !== isExpanded) {
    setSurfaceState({ isExpanded, isRaised: true })
  }
  const sidebarSurfaceRef = useRef<HTMLDivElement>(null)
  const isOverlayExpanded = isExpanded && isNarrowViewport

  useEffect(() => {
    const mediaQuery = window.matchMedia?.(NARROW_SIDEBAR_QUERY)
    if (!mediaQuery) return

    const handleChange = (event: MediaQueryListEvent) => {
      setIsNarrowViewport(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (isExpanded) return

    const widthTransition = sidebarSurfaceRef.current
      ?.getAnimations?.()
      .find(
        (animation) =>
          'transitionProperty' in animation &&
          animation.transitionProperty === 'width',
      )
    let cancelled = false
    const lowerSurface = () => {
      if (!cancelled) {
        setSurfaceState((state) =>
          state.isRaised ? { ...state, isRaised: false } : state,
        )
      }
    }
    void (widthTransition?.finished ?? Promise.resolve()).then(
      lowerSurface,
      lowerSurface,
    )
    return () => {
      cancelled = true
    }
  }, [isExpanded, isNarrowViewport])

  useEffect(() => {
    if (!isOverlayExpanded) return

    const dismissOutside = (event: Event) => {
      const target = event.target
      if (
        target instanceof Node &&
        sidebarSurfaceRef.current?.contains(target)
      ) {
        return
      }
      onToggleExpand()
    }
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onToggleExpand()
    }

    // Capture dismissal without preventing the click from reaching its target.
    document.addEventListener('click', dismissOutside, true)
    document.addEventListener('contextmenu', dismissOutside, true)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('click', dismissOutside, true)
      document.removeEventListener('contextmenu', dismissOutside, true)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [isOverlayExpanded, onToggleExpand])

  return (
    <div
      data-sidebar-layout={isOverlayExpanded ? 'overlay' : 'inline'}
      className={cn(
        `
          relative h-full flex-shrink-0 transition-[width] duration-300
          ease-in-out
          motion-reduce:transition-none
        `,
        isNarrowViewport ? 'w-16' : isExpanded ? 'w-64' : 'w-16',
        className,
      )}
    >
      <div
        ref={sidebarSurfaceRef}
        data-sidebar-surface
        className={cn(
          `
            flex h-full flex-col overflow-x-clip
            bg-[color-mix(in_srgb,var(--input)_30%,var(--background))]
            transition-[width,box-shadow] duration-300 ease-in-out
            motion-reduce:transition-none
          `,
          isExpanded ? 'w-64' : 'w-16',
          isNarrowViewport
            ? `border-border absolute left-0 top-0 border-r`
            : 'relative',
          // Keep the closing surface above content until its width transition ends.
          isNarrowViewport &&
            (isExpanded || surfaceState.isRaised ? 'z-[60]' : 'z-0'),
          isOverlayExpanded && 'shadow-lg',
        )}
      >
        {/* Top Sticky: Toggle Mode */}
        {/* Keep fixed width so the text doesn't move as the sidebar opens and closes to reveal the full content */}
        <div
          className={`
            flex h-14 w-64 flex-shrink-0 items-center justify-between px-3
          `}
        >
          <button
            onClick={onToggleExpand}
            className={`
              text-muted flex h-10 w-10 flex-shrink-0 items-center
              justify-center rounded-md transition-colors
              hover:bg-highlighted/50 hover:text-foreground
              focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
              focus-visible:ring-offset-background focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-offset-2
              focus:outline-none
            `}
            title={isExpanded ? collapseSidebarLabel : expandSidebarLabel}
            aria-label={isExpanded ? collapseSidebarLabel : expandSidebarLabel}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <PanelLeftCloseIcon size={20} aria-hidden="true" />
            ) : (
              <PanelLeftOpenIcon size={20} aria-hidden="true" />
            )}
          </button>
          {windowCount && (
            <span
              className={cn(
                `
                  text-muted whitespace-nowrap text-xs font-medium
                  transition-[visibility] duration-300
                `,
                isExpanded ? 'visible' : 'invisible',
              )}
            >
              {windowCount} Windows
            </span>
          )}
        </div>

        <div className="bg-border h-[1px] w-full"></div>

        {/* Middle Scrollable: Window List */}
        <ScrollArea className="flex-1 py-2" orientation="vertical">
          <div className="flex flex-col gap-2 px-2 py-1">{windowList}</div>
        </ScrollArea>

        {/* Bottom Sticky: Actions */}
        <div
          className={`
            border-border flex flex-shrink-0 flex-col gap-1 border-t p-2
          `}
        >
          {actions}
        </div>
      </div>
    </div>
  )
})
