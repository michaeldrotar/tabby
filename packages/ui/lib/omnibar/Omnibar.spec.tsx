// @vitest-environment jsdom
import * as matchers from '@testing-library/jest-dom/matchers'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { Surface } from '../Surface'
import { Omnibar } from './Omnibar'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

expect.extend(matchers)
afterEach(cleanup)

describe('Omnibar', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  const mockTabs: OmnibarSearchResult[] = [
    {
      id: 1,
      type: 'tab',
      title: 'Tab 1',
      url: 'https://example.com/1',
      windowId: 1,
      tabId: 1,
      execute: vi.fn(),
    },
    {
      id: 2,
      type: 'tab',
      title: 'Tab 2',
      url: 'https://example.com/2',
      windowId: 1,
      tabId: 2,
      execute: vi.fn(),
    },
    {
      id: 3,
      type: 'tab',
      title: 'Tab 3',
      url: 'https://example.com/3',
      windowId: 1,
      tabId: 3,
      execute: vi.fn(),
    },
  ]

  const mockOnDismiss = vi.fn()
  const renderOmnibar = render

  it.each(['click', 'Escape', 'Escape from scope'])(
    'dismisses search with %s without clearing the query',
    (method) => {
      const onDismiss = vi.fn()
      const onQueryChange = vi.fn()
      render(
        <Omnibar
          results={mockTabs}
          query="Tab"
          onQueryChange={onQueryChange}
          onDismiss={onDismiss}
        />,
      )
      const close = screen.getByRole('button', { name: 'Close search' })
      if (method === 'click') fireEvent.click(close)
      else
        fireEvent.keyDown(
          method === 'Escape from scope'
            ? screen.getByRole('button', { name: 'Search scope: All' })
            : close,
          { key: 'Escape' },
        )
      expect(onDismiss).toHaveBeenCalledTimes(1)
      expect(onQueryChange).not.toHaveBeenCalled()
    },
  )

  it('navigates only visible quick actions in the initiating surface', () => {
    render(
      <>
        <Omnibar
          results={[]}
          onDismiss={vi.fn()}
          onOpenTabManager={vi.fn()}
          onOpenOptions={vi.fn()}
          autofocus={false}
        />
        <Omnibar
          results={[]}
          onDismiss={vi.fn()}
          hideTabManagerAction
          onOpenTabManager={vi.fn()}
          onOpenOptions={vi.fn()}
          autofocus={false}
        />
      </>,
    )
    const input = screen.getAllByRole('combobox')[1]!
    act(() => input.focus())
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const options = screen.getAllByRole('option', { name: 'Open options' })[1]!
    expect(input).toHaveFocus()
    expect(options).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute('aria-activedescendant', options.id)
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(options).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByRole('option')[0]).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('keeps keyboard input with the initiating surface when shared omnibars mount', async () => {
    const Shared = () => {
      const [open, setOpen] = useState(false)
      const [query, setQuery] = useState('Tab')
      return (
        <>
          {['Left', 'Right'].map((name) => (
            <section key={name} aria-label={name}>
              <Surface>
                {!open && <button onClick={() => setOpen(true)}>Search</button>}
                {open && (
                  <Omnibar
                    results={mockTabs}
                    query={query}
                    onQueryChange={setQuery}
                    onDismiss={vi.fn()}
                  />
                )}
              </Surface>
            </section>
          ))}
        </>
      )
    }
    render(<Shared />)
    const left = within(screen.getByRole('region', { name: 'Left' }))
    const right = within(screen.getByRole('region', { name: 'Right' }))
    const trigger = right.getByRole('button', { name: 'Search' })
    act(() => trigger.focus())
    fireEvent.click(trigger)
    const input = right.getByRole('combobox') as HTMLInputElement
    await waitFor(() => expect(document.activeElement).toBe(input))
    fireEvent.change(document.activeElement!, { target: { value: 'Tab 2' } })
    expect((left.getByRole('combobox') as HTMLInputElement).value).toBe('Tab 2')
    expect(input.value).toBe('Tab 2')
    expect(document.activeElement).toBe(input)
  })

  it('focuses and selects the initial query in a standalone live popup', async () => {
    render(
      <Surface>
        <Omnibar results={mockTabs} query="Tab" onDismiss={vi.fn()} />
      </Surface>,
    )
    const input = screen.getByRole('combobox') as HTMLInputElement
    await waitFor(() => expect(document.activeElement).toBe(input))
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(3)
  })

  it('should select item on mouse move', async () => {
    renderOmnibar(<Omnibar results={mockTabs} onDismiss={mockOnDismiss} />)

    // Type into input to get results
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'Tab' } })

    const list = await screen.findByRole('listbox')
    const items = await within(list).findAllByRole('option', { name: /Tab/i })

    // The first item (index 0) should be selected by default
    expect(items[0]).toHaveClass('bg-accent-selected')

    // Move mouse to the second item
    const secondItem = items[1]
    expect(secondItem).toBeDefined()
    fireEvent.mouseMove(secondItem!)

    // Second item should be selected
    expect(items[1]).toHaveClass('bg-accent-selected')
    expect(items[0]).not.toHaveClass('bg-accent-selected')
  })

  it('should NOT select item on mouse enter (simulating scroll under cursor)', async () => {
    renderOmnibar(<Omnibar results={mockTabs} onDismiss={mockOnDismiss} />)

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'Tab' } })

    const list = await screen.findByRole('listbox')
    const items = await within(list).findAllByRole('option', { name: /Tab/i })

    // Select first item
    expect(items[0]).toHaveClass('bg-accent-selected')

    // Fire mouseEnter on second item (should NOT change selection)
    const secondItem = items[1]
    expect(secondItem).toBeDefined()
    fireEvent.mouseEnter(secondItem!)

    expect(items[0]).toHaveClass('bg-accent-selected')
    expect(items[1]).not.toHaveClass('bg-accent-selected')
  })
  it('announces keyboard selection and highlights literal query terms safely', () => {
    render(
      <Omnibar
        results={mockTabs.map((tab, index) =>
          index ? tab : { ...tab, title: 'Plan [1] <img src=x>' },
        )}
        query="Plan [1]"
        onDismiss={vi.fn()}
      />,
    )
    const input = screen.getByRole('combobox')
    const list = screen.getByRole('listbox', { name: 'Search results' })
    const options = within(list).getAllByRole('option')
    expect(input).toHaveAttribute('aria-controls', list.id)
    expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id)
    expect(options[0]!).toHaveTextContent('Plan [1] <img src=x>')
    expect(options[0]!.querySelector('img')).toBeNull()
    expect(within(options[0]!).getByText('[1]')).toHaveClass('font-bold')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveAttribute('aria-activedescendant', options[1]!.id)
    expect(options[1]!).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('3 results')
  })
})

it('selects a scope from the picker and returns to typing without changing the query', async () => {
  render(<Omnibar results={[]} query="project" onDismiss={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Search scope: All' }))
  const picker = screen.getByRole('listbox', { name: 'Search scope' })
  expect(within(picker).getAllByRole('option')).toHaveLength(9)
  fireEvent.click(within(picker).getByRole('option', { name: /Bookmarks/ }))
  const input = screen.getByRole('combobox')
  await waitFor(() => expect(input).toHaveFocus())
  expect(input).toHaveValue('project')
  expect(input).toHaveAttribute('placeholder', 'Search bookmarks…')
  expect(
    screen.getByRole('button', { name: 'Search scope: Bookmarks' }),
  ).toBeVisible()
})

it('announces scope changes while the query keeps typing focus', () => {
  render(<Omnibar results={[]} query="missing" onDismiss={vi.fn()} />)
  const input = screen.getByRole('combobox')
  for (const [key, label] of [
    ['w', 'Windows'],
    ['D', 'Current window'],
    ['g', 'Tab groups'],
  ]) {
    fireEvent.keyDown(input, { key: 'Tab' })
    fireEvent.keyDown(input, { key })
    expect(input).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent(
      `Search scope: ${label}. 0 results`,
    )
    expect(input).toHaveAccessibleDescription(
      new RegExp(`Search scope: ${label}`),
    )
  }
})

it('leaves native modifier shortcuts untouched while the scope chooser is open', () => {
  render(<Omnibar results={[]} query="project" onDismiss={vi.fn()} />)
  const input = screen.getByRole('combobox')
  fireEvent.keyDown(input, { key: 'Tab' })
  for (const key of ['a', 'c', 'x', 'v', 'z', 'k', 'ArrowUp']) {
    expect(fireEvent.keyDown(input, { key, metaKey: true })).toBe(true)
    expect(screen.getByRole('listbox', { name: 'Search scope' })).toBeVisible()
  }
  expect(fireEvent.keyDown(input, { key: 'ArrowDown', shiftKey: true })).toBe(
    true,
  )
  expect(input).toHaveValue('project')
})

it('shows neither tips nor hidden quick actions in a specific empty scope', () => {
  const manager = vi.fn()
  const changeScope = vi.fn()
  const dismiss = vi.fn()
  render(
    <Omnibar
      results={[]}
      scope="bookmarks"
      selectedIndex={7}
      onScopeChange={changeScope}
      onOpenTabManager={manager}
      onDismiss={dismiss}
    />,
  )
  expect(screen.queryByRole('heading', { name: 'Quick actions' })).toBeNull()
  expect(screen.queryByRole('heading', { name: 'Tips' })).toBeNull()
  expect(screen.getByText('No bookmarks to show.')).toBeVisible()
  const suggestion = screen.getByRole('option', { name: /Search everything/ })
  const input = screen.getByRole('combobox')
  expect(suggestion).toHaveAttribute('aria-selected', 'true')
  expect(input).toHaveAttribute('aria-activedescendant', suggestion.id)
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(changeScope).toHaveBeenCalledWith('all')
  expect(input).toHaveFocus()
  expect(manager).not.toHaveBeenCalled()
  expect(dismiss).not.toHaveBeenCalled()
})

it('puts the scope and close shortcuts last in All tips', () => {
  render(
    <Omnibar results={[]} onOpenTabManager={vi.fn()} onDismiss={vi.fn()} />,
  )
  const tips = screen.getByRole('heading', { name: 'Tips' }).parentElement!
  const rows = within(tips).getAllByRole('listitem')
  expect(rows.at(-2)).toHaveTextContent('Tab to change search scope')
  expect(rows.at(-1)).toHaveTextContent('Esc to close search')
  expect(
    screen.getByRole('button', { name: 'Close search' }),
  ).toHaveTextContent('')
})
