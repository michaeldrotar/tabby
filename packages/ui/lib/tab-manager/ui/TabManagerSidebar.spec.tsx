// @vitest-environment jsdom

import * as matchers from '@testing-library/jest-dom/matchers'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TabManagerSidebar } from './TabManagerSidebar'

expect.extend(matchers)

const createMatchMedia = (initialMatches: boolean) => {
  let matches = initialMatches
  const listeners = new Set<(event: MediaQueryListEvent) => void>()

  return {
    matchMedia: (query: string) =>
      ({
        get matches() {
          return matches
        },
        media: query,
        onchange: null,
        addEventListener: (_type: string, listener: EventListener) => {
          listeners.add(listener as (event: MediaQueryListEvent) => void)
        },
        removeEventListener: (_type: string, listener: EventListener) => {
          listeners.delete(listener as (event: MediaQueryListEvent) => void)
        },
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList,
    setMatches: (nextMatches: boolean) => {
      matches = nextMatches
      listeners.forEach((listener) =>
        listener({ matches: nextMatches } as MediaQueryListEvent),
      )
    },
  }
}

const SidebarHarness = ({
  onOutsideClick,
  onOutsideContextMenu,
}: {
  onOutsideClick: () => void
  onOutsideContextMenu: () => void
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <>
      <TabManagerSidebar
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded((expanded) => !expanded)}
        windowList={<button type="button">Window item</button>}
        actions={<button type="button">Sidebar action</button>}
        windowCount={2}
        collapseSidebarLabel="Collapse sidebar"
        expandSidebarLabel="Expand sidebar"
      />
      <button
        type="button"
        onClick={onOutsideClick}
        onContextMenu={onOutsideContextMenu}
      >
        Open tab
      </button>
    </>
  )
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('TabManagerSidebar', () => {
  it('overlays in narrow panels and dismisses without swallowing outside clicks', () => {
    const viewport = createMatchMedia(false)
    const onOutsideClick = vi.fn()
    const onOutsideContextMenu = vi.fn()
    vi.stubGlobal('matchMedia', viewport.matchMedia)

    render(
      <SidebarHarness
        onOutsideClick={onOutsideClick}
        onOutsideContextMenu={onOutsideContextMenu}
      />,
    )

    const layout = document.querySelector('[data-sidebar-layout]')
    const surface = document.querySelector('[data-sidebar-surface]')
    expect(layout).toHaveAttribute('data-sidebar-layout', 'inline')
    expect(layout).toHaveClass('w-64')
    expect(surface).toHaveClass('relative')

    act(() => viewport.setMatches(true))

    expect(layout).toHaveAttribute('data-sidebar-layout', 'overlay')
    expect(layout).toHaveClass('w-16')
    expect(surface).toHaveClass('absolute', 'w-64', 'z-[60]')
    expect(
      screen.getByRole('button', { name: 'Collapse sidebar' }),
    ).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Window item' }))
    expect(layout).toHaveAttribute('data-sidebar-layout', 'overlay')

    fireEvent.click(screen.getByRole('button', { name: 'Open tab' }))

    expect(onOutsideClick).toHaveBeenCalledOnce()
    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }))
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Open tab' }))

    expect(onOutsideContextMenu).toHaveBeenCalledOnce()
    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }))
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toHaveAttribute('aria-expanded', 'false')
  })
})
