// @vitest-environment jsdom
import * as matchers from '@testing-library/jest-dom/matchers'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Surface } from '../Surface'
import { TabManager } from './TabManager'
import type { TabManagerViewModel } from './TabManager'

expect.extend(matchers)
afterEach(cleanup)

const model: TabManagerViewModel = {
  windows: [
    {
      id: 1,
      title: 'Research',
      active: true,
      tabs: [
        {
          id: 10,
          title: 'Tabby',
          url: 'https://example.com',
          ageLabel: '5m',
          groupId: 20,
        },
      ],
      groups: [{ id: 20, title: 'Reading', color: 'blue' }],
    },
  ],
  viewedWindowId: 1,
  selectedTabIds: [],
  selectedGroupIds: [],
  selectedWindowIds: [],
  selectionMode: 'default',
  sidebarExpanded: true,
}

describe('TabManager presentation', () => {
  it('emits product intents from mouse, keyboard and the action menu', () => {
    const onIntent = vi.fn()
    render(
      <Surface>
        <TabManager model={model} onIntent={onIntent} />
      </Surface>,
    )
    const tab = screen.getByRole('option', { name: 'Tab: Tabby' })
    fireEvent.click(tab, { ctrlKey: true })
    expect(onIntent).toHaveBeenLastCalledWith({
      type: 'select-item',
      item: { type: 'tab', id: 10 },
      shift: false,
      toggle: true,
    })
    fireEvent.keyDown(tab, { key: 'ArrowDown', shiftKey: true })
    expect(onIntent).toHaveBeenLastCalledWith({
      type: 'navigate',
      key: 'ArrowDown',
      shift: true,
      toggle: false,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Close tab' }))
    expect(onIntent).toHaveBeenLastCalledWith({
      type: 'close-tabs',
      tabIds: [10],
    })
    fireEvent.contextMenu(tab)
    expect(onIntent).toHaveBeenLastCalledWith({
      type: 'open-action-menu',
      target: { type: 'tab', id: 10 },
    })
    fireEvent.click(screen.getByRole('button', { name: 'New window' }))
    expect(onIntent).toHaveBeenLastCalledWith({ type: 'create-window' })
  })

  it.each(['Enter', ' '])(
    'preserves native close-button activation with %s',
    (key) => {
      const onIntent = vi.fn()
      render(
        <Surface>
          <TabManager model={model} onIntent={onIntent} />
        </Surface>,
      )
      const close = screen.getByRole('button', { name: 'Close tab' })
      close.focus()
      const nativeDefaultAllowed = fireEvent.keyDown(close, { key })
      expect(nativeDefaultAllowed).toBe(true)
      expect(onIntent).not.toHaveBeenCalled()
      // A browser activates a focused native button after the key's default action.
      fireEvent.click(close)
      expect(onIntent).toHaveBeenCalledExactlyOnceWith({
        type: 'close-tabs',
        tabIds: [10],
      })
    },
  )

  it('focuses a keyboard-opened menu so arrows navigate menu actions', () => {
    const onIntent = vi.fn()
    const Harness = () => {
      const [current, setCurrent] = useState({
        ...model,
        focusedItem: { type: 'tab' as const, id: 10 },
      } as TabManagerViewModel)
      return (
        <Surface>
          <TabManager
            model={current}
            onIntent={(intent) => {
              onIntent(intent)
              if (intent.type === 'navigate' && intent.key === 'ContextMenu')
                setCurrent({ ...current, actionMenu: {} })
              if (intent.type === 'dismiss-action-menu')
                setCurrent({ ...current, actionMenu: null })
            }}
          />
        </Surface>
      )
    }
    render(<Harness />)
    const tab = screen.getByRole('option', { name: 'Tab: Tabby' })
    tab.focus()
    fireEvent.keyDown(tab, { key: 'ContextMenu' })
    const close = screen.getByRole('menuitem', {
      name: 'Close 0 selected tabs',
    })
    expect(close).toHaveFocus()
    fireEvent.keyDown(close, { key: 'ArrowDown' })
    const dismiss = screen.getByRole('menuitem', { name: 'Dismiss menu' })
    expect(dismiss).toHaveFocus()
    expect(onIntent).toHaveBeenCalledOnce()
    expect(fireEvent.keyDown(dismiss, { key: 'Enter' })).toBe(true)
    fireEvent.click(dismiss)
    expect(onIntent).toHaveBeenLastCalledWith({ type: 'dismiss-action-menu' })
  })

  it('keeps theme tokens, group IDs and controlled menu portals within each instance', () => {
    const { container } = render(
      <>
        <Surface instanceId="first" theme="light">
          <TabManager model={{ ...model, actionMenu: {} }} onIntent={vi.fn()} />
        </Surface>
        <Surface instanceId="second" theme="dark">
          <TabManager model={{ ...model, actionMenu: {} }} onIntent={vi.fn()} />
        </Surface>
      </>,
    )
    const first = container.querySelector<HTMLElement>(
      '[data-surface="first"]',
    )!
    const second = container.querySelector<HTMLElement>(
      '[data-surface="second"]',
    )!
    expect(first.style.getPropertyValue('--background')).not.toBe(
      second.style.getPropertyValue('--background'),
    )
    const firstGroup = within(first).getByRole('button', { name: 'Reading' })
    const secondGroup = within(second).getByRole('button', { name: 'Reading' })
    expect(firstGroup.getAttribute('aria-controls')).not.toBe(
      secondGroup.getAttribute('aria-controls'),
    )
    expect(
      first.querySelector('[data-surface-portals] [role="menu"]'),
    ).not.toBeNull()
    expect(
      second.querySelector('[data-surface-portals] [role="menu"]'),
    ).not.toBeNull()
  })

  it('scopes palette attributes and honors explicit token overrides', () => {
    const { container } = render(
      <>
        <Surface
          instanceId="warm"
          theme="light"
          palette={{
            background: 'stone',
            foreground: 'neutral',
            accent: 'amber',
            strength: 22,
          }}
        >
          <div>Warm</div>
        </Surface>
        <Surface
          instanceId="cool"
          theme="dark"
          palette={{
            background: 'slate',
            foreground: 'zinc',
            accent: 'blue',
            strength: 12,
          }}
          tokens={{ accent: 'rebeccapurple' }}
        >
          <div>Cool</div>
        </Surface>
      </>,
    )
    const warm = container.querySelector<HTMLElement>('[data-surface="warm"]')!
    const cool = container.querySelector<HTMLElement>('[data-surface="cool"]')!
    expect(warm).toHaveAttribute('data-theme-background', 'stone')
    expect(warm).toHaveAttribute('data-theme-foreground', 'neutral')
    expect(warm).toHaveAttribute('data-theme-accent', 'amber')
    expect(warm.style.getPropertyValue('--accent-strength')).toBe('22')
    expect(warm.style.getPropertyValue('--accent')).toBe('')
    expect(warm.style.getPropertyValue('--background')).toBe('')
    expect(cool).toHaveAttribute('data-theme-accent', 'blue')
    expect(cool.style.getPropertyValue('--accent')).toBe('rebeccapurple')
  })

  it.each(['scripted', 'static'] as const)(
    'blocks real input in %s mode while preserving staged cues',
    (inputMode) => {
      const onIntent = vi.fn()
      const staged = {
        ...model,
        focusedItem: { type: 'tab' as const, id: 10 },
        hoveredItem: { type: 'tab' as const, id: 10 },
        actionMenu: {},
      }
      const { container } = render(
        <Surface inputMode={inputMode} motion="reduced">
          <TabManager model={staged} onIntent={onIntent} />
        </Surface>,
      )
      const tab = screen.getByRole('option', { name: 'Tab: Tabby' })
      fireEvent.click(tab)
      fireEvent.keyDown(tab, { key: 'Delete' })
      fireEvent.contextMenu(tab)
      fireEvent.click(
        screen.getByRole('menuitem', { name: 'Close 0 selected tabs' }),
      )
      expect(fireEvent.wheel(tab, { deltaY: 80, cancelable: true })).toBe(false)
      expect(fireEvent.touchMove(tab, { cancelable: true })).toBe(false)
      expect(onIntent).not.toHaveBeenCalled()
      expect(container.querySelector('[data-tab-id="10"]')).toHaveStyle({
        opacity: '1',
      })
      expect(container.querySelector('[inert]')).toHaveStyle({
        pointerEvents: 'none',
      })
      expect(container.querySelector('[data-tab-id="10"]')).toHaveAttribute(
        'data-hover',
        'true',
      )
      expect(container.querySelector('[data-tab-id="10"]')).toHaveAttribute(
        'data-focus',
        'true',
      )
      expect(screen.getByText('• 5m')).toBeInTheDocument()
    },
  )

  it('restores the physical owner after its native close button removes a row', async () => {
    const onIntent = vi.fn()
    const withTwoTabs: TabManagerViewModel = {
      ...model,
      windows: [
        {
          ...model.windows[0]!,
          tabs: [
            ...model.windows[0]!.tabs,
            { id: 11, title: 'Notes', groupId: 20 },
          ],
        },
      ],
    }
    const Harness = () => {
      const [current, setCurrent] = useState(withTwoTabs)
      return (
        <Surface motion="reduced">
          <TabManager
            model={current}
            onIntent={(intent) => {
              onIntent(intent)
              if (intent.type === 'close-tabs')
                setCurrent({
                  ...current,
                  windows: [
                    {
                      ...current.windows[0]!,
                      tabs: current.windows[0]!.tabs.filter(
                        (tab) => !intent.tabIds.includes(tab.id),
                      ),
                    },
                  ],
                  focusedItem: { type: 'group', id: 20 },
                })
            }}
          />
        </Surface>
      )
    }
    render(<Harness />)
    const close = screen.getAllByRole('button', { name: 'Close tab' })[0]!
    close.focus()
    expect(fireEvent.keyDown(close, { key: 'Enter' })).toBe(true)
    fireEvent.click(close)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Reading' })).toHaveFocus(),
    )
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
    expect(onIntent).toHaveBeenLastCalledWith({
      type: 'navigate',
      key: 'ArrowDown',
      shift: false,
      toggle: false,
    })
  })

  it('recovers external removal only in the owning instance and preserves outside focus', async () => {
    const withTwoTabs: TabManagerViewModel = {
      ...model,
      windows: [
        {
          ...model.windows[0]!,
          tabs: [
            ...model.windows[0]!.tabs,
            { id: 11, title: 'Notes', groupId: 20 },
          ],
        },
      ],
    }
    const pair = (next: TabManagerViewModel) => (
      <>
        <Surface instanceId="one" motion="reduced">
          <TabManager model={next} onIntent={vi.fn()} />
        </Surface>
        <Surface instanceId="two" motion="reduced">
          <TabManager model={next} onIntent={vi.fn()} />
        </Surface>
        <button>Outside</button>
      </>
    )
    const { rerender } = render(pair(withTwoTabs))
    screen.getAllByRole('option', { name: 'Tab: Tabby' })[0]!.focus()
    const remaining: TabManagerViewModel = {
      ...withTwoTabs,
      windows: [
        {
          ...withTwoTabs.windows[0]!,
          tabs: [withTwoTabs.windows[0]!.tabs[1]!],
        },
      ],
      focusedItem: { type: 'group', id: 20 },
    }
    rerender(pair(remaining))
    await waitFor(() =>
      expect(
        screen.getAllByRole('button', { name: 'Reading' })[0],
      ).toHaveFocus(),
    )
    const outside = screen.getByRole('button', { name: 'Outside' })
    outside.focus()
    rerender(
      pair({
        ...remaining,
        windows: [{ ...remaining.windows[0]!, tabs: [] }],
        focusedItem: null,
      }),
    )
    await waitFor(() => expect(screen.queryAllByRole('option')).toHaveLength(0))
    expect(outside).toHaveFocus()
  })

  it('does not move DOM focus to a mirrored instance when shared logical focus changes', () => {
    const onIntent = vi.fn()
    const pair = (next: TabManagerViewModel) => (
      <>
        <Surface instanceId="one">
          <TabManager model={next} onIntent={onIntent} />
        </Surface>
        <Surface instanceId="two">
          <TabManager model={next} onIntent={onIntent} />
        </Surface>
      </>
    )
    const { rerender } = render(pair(model))
    const firstTab = screen.getAllByRole('option', { name: 'Tab: Tabby' })[0]!
    firstTab.focus()
    fireEvent.keyDown(firstTab, { key: 'ArrowDown' })
    rerender(pair({ ...model, focusedItem: { type: 'tab', id: 10 } }))
    expect(firstTab).toHaveFocus()
  })
})
