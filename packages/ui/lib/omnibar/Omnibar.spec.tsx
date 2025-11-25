// @vitest-environment jsdom
import { Omnibar } from './Omnibar'
import * as matchers from '@testing-library/jest-dom/matchers'
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from '@testing-library/react'
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import type { OmnibarSearchItem } from './OmnibarSearchItem'

expect.extend(matchers)

describe('Omnibar', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    cleanup()
  })

  const mockTabs: OmnibarSearchItem[] = [
    { id: 1, title: 'Tab 1', url: 'https://example.com/1', type: 'tab' },
    { id: 2, title: 'Tab 2', url: 'https://example.com/2', type: 'tab' },
    { id: 3, title: 'Tab 3', url: 'https://example.com/3', type: 'tab' },
  ]

  const mockOnSelect = vi.fn()
  const mockOnClose = vi.fn()
  const mockOnSearch = vi.fn().mockResolvedValue([])
  const MockFavicon = () => <div data-testid="favicon" />

  it('should select item on mouse move', async () => {
    render(
      <Omnibar
        tabs={mockTabs}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        Favicon={MockFavicon}
      />,
    )

    // Type into input to get results
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Tab' } })

    // Wait for items to appear
    // "Tab" matches the mock tabs
    // filteredItems will contain:
    // 1. Google Search "Tab"
    // 2. Commands (maybe "Tabby: Open Tab Manager")
    // 3. Local tabs "Tab 1", "Tab 2", "Tab 3"

    // Let's find the items. They are <li> elements or buttons.
    // OmnibarItem renders a <button>.
    const list = await screen.findByRole('list')
    const items = await within(list).findAllByRole('button', { name: /Tab/i })

    // The first item (index 0) should be selected by default
    // Google search is usually first.
    expect(items[0]).toHaveClass('bg-blue-50')

    // Move mouse to the second item
    fireEvent.mouseMove(items[1])

    // Second item should be selected
    expect(items[1]).toHaveClass('bg-blue-50')
    expect(items[0]).not.toHaveClass('bg-blue-50')
  })

  it('should NOT select item on mouse enter (simulating scroll under cursor)', async () => {
    render(
      <Omnibar
        tabs={mockTabs}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        Favicon={MockFavicon}
      />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Tab' } })

    const list = await screen.findByRole('list')
    const items = await within(list).findAllByRole('button', { name: /Tab/i })

    // Select first item
    expect(items[0]).toHaveClass('bg-blue-50')

    // Fire mouseEnter on second item (should NOT change selection)
    fireEvent.mouseEnter(items[1])

    expect(items[0]).toHaveClass('bg-blue-50')
    expect(items[1]).not.toHaveClass('bg-blue-50')
  })
})
