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

  afterEach(() => {
    cleanup()
  })

  const mockOnDismiss = vi.fn()
  const renderOmnibar = render

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
