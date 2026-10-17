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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Surface } from '../Surface'
import { TabManager } from './TabManager'
import type { TabManagerViewModel } from './TabManager'

expect.extend(matchers)
beforeEach(() => vi.spyOn(window, 'focus').mockImplementation(() => {}))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const model: TabManagerViewModel = {
  actions: [
    {
      id: 'close-selected-tabs',
      label: 'Close 1 tab',
      icon: 'Trash2',
      kind: 'primary',
    },
    { id: 'dismiss', label: 'Dismiss menu', icon: 'X', kind: 'secondary' },
  ],
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
  selectedTabIds: [10],
  selectedGroupIds: [],
  selectionMode: 'default',
}

describe('TabManager presentation', () => {
  it('keeps the window header and tools reachable with no selection actions', () => {
    const onIntent = vi.fn()
    const { container } = render(
      <Surface>
        <TabManager
          model={{ ...model, selectedTabIds: [] }}
          onIntent={onIntent}
        />
      </Surface>,
    )
    expect(
      screen.getByRole('button', { name: 'Switch window: Research' }),
    ).toBeInTheDocument()
    for (const name of [
      'Edit window',
      'Search everything',
      'Settings',
      'More actions',
    ])
      expect(screen.getByRole('button', { name })).toBeEnabled()
    expect(
      screen.queryByRole('button', { name: 'Window actions' }),
    ).not.toBeInTheDocument()
    expect(container.querySelector('[data-selection-summary]')).toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch window: Research' }),
    )
    expect(onIntent).toHaveBeenLastCalledWith({ type: 'open-window-picker' })
  })

  it('uses the full pane for keyboard window navigation with no search or back button', () => {
    const onIntent = vi.fn()
    render(
      <Surface>
        <TabManager
          model={{
            ...model,
            windows: [
              ...model.windows,
              {
                id: 2,
                title: 'Personal',
                tabs: [{ id: 11, title: 'Notes' }],
                groups: [],
              },
            ],
            windowPicker: true,
          }}
          onIntent={onIntent}
        />
      </Surface>,
    )
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Back to tabs' }),
    ).not.toBeInTheDocument()
    const first = screen.getByRole('button', { name: /^Research/ })
    fireEvent.keyDown(first, { key: 'End' })
    expect(screen.getByRole('button', { name: /^Personal/ })).toHaveFocus()
    fireEvent.click(document.activeElement!)
    expect(onIntent).toHaveBeenLastCalledWith({
      type: 'activate-window',
      windowId: 2,
    })
    fireEvent.keyDown(first, { key: 'Escape' })
    expect(onIntent).toHaveBeenLastCalledWith({ type: 'dismiss-window-picker' })
  })

  it('keeps rename input keys local and leaves shortcut help in Options', () => {
    const onIntent = vi.fn()
    render(
      <Surface>
        <TabManager
          model={{ ...model, renamingGroupId: 20, actionMenu: {} }}
          onIntent={onIntent}
        />
      </Surface>,
    )
    const input = screen.getByRole('textbox', { name: 'Group name' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Delete' })
    expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(true)
    expect(onIntent).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('menuitem', { name: 'Keyboard shortcuts' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Keyboard shortcuts' }),
    ).not.toBeInTheDocument()
  })

  it('activates ordinary row clicks and only selects modified clicks', () => {
    const onIntent = vi.fn()
    const { container } = render(
      <Surface>
        <TabManager model={model} onIntent={onIntent} />
      </Surface>,
    )
    const tab = screen.getByRole('option', { name: 'Tab: Tabby' })
    fireEvent.click(tab)
    expect(onIntent).toHaveBeenLastCalledWith({
      type: 'activate-tab',
      tabId: 10,
    })

    const favicon = container.querySelector('[data-tab-favicon]')!
    expect(
      screen.queryByRole('button', { name: 'Go to tab: Tabby' }),
    ).toBeNull()
    for (const activate of [() => fireEvent.click(favicon)]) {
      onIntent.mockClear()
      activate()
      expect(onIntent.mock.calls.map(([intent]) => intent)).toEqual([
        { type: 'activate-tab', tabId: 10 },
      ])
    }
    onIntent.mockClear()
    fireEvent.keyDown(tab, { key: 'Enter' })
    expect(onIntent).toHaveBeenLastCalledWith({
      type: 'navigate',
      key: 'Enter',
      shift: false,
      toggle: false,
    })

    for (const modifier of ['metaKey', 'ctrlKey', 'shiftKey']) {
      onIntent.mockClear()
      fireEvent.click(favicon, { [modifier]: true })
      expect(onIntent).toHaveBeenLastCalledWith({
        type: 'select-item',
        item: { type: 'tab', id: 10 },
        shift: modifier === 'shiftKey',
        toggle: modifier !== 'shiftKey',
      })
      expect(
        onIntent.mock.calls.some(([intent]) => intent.type === 'activate-tab'),
      ).toBe(false)
      fireEvent.doubleClick(tab, { [modifier]: true })
      expect(
        onIntent.mock.calls.some(([intent]) => intent.type === 'activate-tab'),
      ).toBe(false)
    }
    onIntent.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Reading' }))
    expect(onIntent.mock.calls.map(([intent]) => intent)).toEqual([
      {
        type: 'select-item',
        item: { type: 'group', id: 20 },
        shift: false,
        toggle: false,
      },
    ])
  })

  it('shows selection next to the persistent action menu without a clear button', () => {
    const onIntent = vi.fn()
    const { container } = render(
      <Surface>
        <TabManager
          model={{ ...model, selectedTabIds: [10], selectedGroupIds: [20] }}
          onIntent={onIntent}
        />
      </Surface>,
    )
    expect(screen.getByRole('option', { name: 'Tab: Tabby' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(container.querySelector('[data-selection-summary]')).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Clear selection' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('1 selected')).toBeNull()
  })

  it('synchronizes native keyboard focus without replacing a modifier selection', () => {
    const onIntent = vi.fn()
    render(
      <Surface>
        <TabManager
          model={{
            ...model,
            focusedItem: { type: 'tab', id: 11 },
            selectedTabIds: [10, 11],
            windows: [
              {
                ...model.windows[0]!,
                tabs: [
                  ...model.windows[0]!.tabs,
                  { id: 11, title: 'Notes', groupId: 20 },
                ],
              },
            ],
          }}
          onIntent={onIntent}
        />
      </Surface>,
    )
    const firstTab = screen.getByRole('option', { name: 'Tab: Tabby' })
    firstTab.focus()
    fireEvent.keyDown(firstTab, { key: 'Backspace' })
    expect(onIntent.mock.calls.map(([intent]) => intent)).toEqual([
      { type: 'focus-item', item: { type: 'tab', id: 10 } },
      { type: 'navigate', key: 'Backspace', shift: false, toggle: false },
    ])
    expect(screen.getAllByRole('option', { selected: true })).toHaveLength(2)
  })

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
      type: 'close-item',
      item: { type: 'tab', id: 10 },
    })
    fireEvent.contextMenu(tab)
    expect(onIntent).toHaveBeenLastCalledWith({
      type: 'open-action-menu',
      target: { type: 'tab', id: 10 },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Edit window' }))
    expect(onIntent).toHaveBeenLastCalledWith({ type: 'edit-window' })
  })

  it('renders a persistent window identity and a controlled rename checkpoint', () => {
    const onIntent = vi.fn()
    const initial: TabManagerViewModel = {
      ...model,
      renamingGroupId: 20,
      renamingGroupTitle: 'Review draft',
      windows: [
        {
          ...model.windows[0]!,
          title: 'Active title',
          tabs: [{ ...model.windows[0]!.tabs[0]!, title: 'First title' }],
        },
      ],
    }
    const { container, rerender } = render(
      <Surface>
        <TabManager model={initial} onIntent={onIntent} />
      </Surface>,
    )
    expect(
      container.querySelector('[data-window-picker-trigger]'),
    ).toHaveTextContent('Active title')
    expect(screen.getByRole('textbox')).toHaveValue('Review draft')
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Edited draft' },
    })
    expect(onIntent).toHaveBeenLastCalledWith({
      type: 'change-group-rename',
      groupId: 20,
      title: 'Edited draft',
    })
    rerender(
      <Surface>
        <TabManager
          model={{ ...initial, renamingGroupTitle: 'Restored draft' }}
          onIntent={onIntent}
        />
      </Surface>,
    )
    expect(screen.getByRole('textbox')).toHaveValue('Restored draft')
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
        type: 'close-item',
        item: { type: 'tab', id: 10 },
      })
    },
  )

  it('focuses a keyboard-opened menu so arrows navigate menu actions', async () => {
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
              if (
                intent.type === 'open-action-menu' ||
                (intent.type === 'navigate' && intent.key === 'ContextMenu')
              )
                setCurrent({ ...current, actionMenu: {} })
              if (
                intent.type === 'dismiss-action-menu' ||
                (intent.type === 'run-action' && intent.actionId === 'dismiss')
              )
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
      name: 'Close 1 tab',
    })
    expect(close).toHaveFocus()
    fireEvent.keyDown(close, { key: 'ArrowDown' })
    const dismiss = screen.getByRole('menuitem', { name: 'Dismiss menu' })
    await waitFor(() => expect(dismiss).toHaveFocus())
    expect(onIntent).toHaveBeenCalledOnce()
    fireEvent.keyDown(dismiss, { key: 'Enter' })
    expect(onIntent).toHaveBeenLastCalledWith({
      type: 'run-action',
      actionId: 'dismiss',
    })
    await waitFor(() => expect(tab).toHaveFocus())
    const origin = screen.getByRole('button', { name: 'Edit window' })
    origin.focus()
    vi.spyOn(document, 'hasFocus').mockReturnValue(false)
    fireEvent.contextMenu(tab, { clientX: 30, clientY: 100 })
    expect(window.focus).toHaveBeenCalledOnce()
    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: 'Close 1 tab' }),
      ).toHaveFocus(),
    )
    fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Close 1 tab' }), {
      key: 'Escape',
    })
    await waitFor(() => expect(origin).toHaveFocus())
  })

  it('replaces the whole tab pane when switching windows without retaining exited rows', () => {
    const other = {
      id: 2,
      title: 'Other',
      tabs: [{ id: 11, title: 'Other tab' }],
      groups: [],
    }
    const { rerender } = render(
      <Surface>
        <TabManager
          model={{ ...model, windows: [...model.windows, other] }}
          onIntent={vi.fn()}
        />
      </Surface>,
    )
    expect(
      screen.getByRole('option', { name: 'Tab: Tabby' }),
    ).toBeInTheDocument()
    rerender(
      <Surface>
        <TabManager
          model={{
            ...model,
            windows: [...model.windows, other],
            viewedWindowId: 2,
          }}
          onIntent={vi.fn()}
        />
      </Surface>,
    )
    expect(
      screen.queryByRole('option', { name: 'Tab: Tabby' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'Tab: Other tab' }),
    ).toBeInTheDocument()
  })

  it('renders controlled destination submenus and emits group rename and creation intents', () => {
    const onIntent = vi.fn()
    const { rerender } = render(
      <Surface>
        <TabManager
          model={{
            ...model,
            windows: [
              ...model.windows,
              { id: 2, title: 'Second window', tabs: [], groups: [] },
            ],
            actionPanel: { actionId: 'move' },
            actions: [
              {
                id: 'move',
                label: 'Move tabs',
                icon: 'MonitorUp',
                kind: 'primary',
                panel: 'windows',
                options: [{ id: '2', label: 'Second window' }],
              },
            ],
          }}
          onIntent={onIntent}
        />
      </Surface>,
    )
    fireEvent.pointerDown(
      screen.getByRole('menuitem', { name: /Second window/ }),
    )
    expect(onIntent).not.toHaveBeenCalledWith({ type: 'dismiss-action-menu' })
    fireEvent.click(screen.getByRole('menuitem', { name: /Second window/ }))
    expect(onIntent).toHaveBeenCalledWith({
      type: 'run-action',
      actionId: 'move',
      optionId: '2',
    })
    rerender(
      <Surface>
        <TabManager model={model} onIntent={onIntent} />
      </Surface>,
    )
    fireEvent.doubleClick(screen.getByRole('button', { name: 'Reading' }))
    expect(onIntent).toHaveBeenLastCalledWith({
      type: 'start-group-rename',
      groupId: 20,
    })
    fireEvent.click(screen.getByRole('button', { name: 'New tab in Reading' }))
    expect(onIntent).toHaveBeenLastCalledWith({
      type: 'create-tab',
      windowId: 1,
      groupId: 20,
    })
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
      fireEvent.click(screen.getByRole('menuitem', { name: 'Close 1 tab' }))
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
              if (intent.type === 'close-item')
                setCurrent({
                  ...current,
                  windows: [
                    {
                      ...current.windows[0]!,
                      tabs: current.windows[0]!.tabs.filter(
                        (tab) => intent.item.id !== tab.id,
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
      item: { type: 'tab', id: 11 },
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
    fireEvent.keyDown(firstTab, { key: 'ArrowUp' })
    rerender(pair({ ...model, focusedItem: { type: 'tab', id: 10 } }))
    expect(firstTab).toHaveFocus()
  })
})
