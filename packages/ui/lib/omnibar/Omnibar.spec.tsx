// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as matchers from '@testing-library/jest-dom/matchers'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { Omnibar } from './Omnibar'
import type { OmnibarSearchResult } from './OmnibarSearchResult'
import type { OmnibarResultGenerators } from './useOmnibarFiltering'

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

  beforeEach(() => {
    // Mock Chrome APIs
    globalThis.chrome = {
      tabs: {
        update: vi.fn(),
      },
      windows: {
        update: vi.fn(),
      },
      history: {
        search: vi.fn().mockResolvedValue([]),
      },
      bookmarks: {
        search: vi.fn().mockResolvedValue([]),
      },
      sessions: {
        getRecentlyClosed: vi.fn().mockResolvedValue([]),
      },
      storage: {
        local: {
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn(),
          remove: vi.fn(),
        },
      },
      runtime: {
        id: 'test-extension-id',
        getPlatformInfo: vi.fn().mockResolvedValue({ os: 'mac' }),
        openOptionsPage: vi.fn(),
      },
    } as unknown as typeof chrome
  })

  afterEach(() => {
    cleanup()
  })

  const mockOnDismiss = vi.fn()
  const mockOnSearch = vi.fn().mockResolvedValue([])

  const mockGenerators: OmnibarResultGenerators = {
    getGoogleSearchItem: (query: string) => ({
      id: `google-${query}`,
      type: 'search' as const,
      title: `Search Google for "${query}"`,
      url: `https://google.com/search?q=${encodeURIComponent(query)}`,
      execute: vi.fn(),
    }),
    getUrlNavigationItem: () => [],
    getMatchingCommands: () => [],
    getMatchingTabs: (tabs, queryTerms) =>
      tabs.filter((tab) =>
        queryTerms.some(
          (term) =>
            tab.title?.toLowerCase().includes(term.toLowerCase()) ||
            tab.url?.toLowerCase().includes(term.toLowerCase()),
        ),
      ),
  }

  const createQueryClient = () =>
    new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

  const renderWithQuery = (ui: React.ReactElement) => {
    const qc = createQueryClient()
    return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
  }

  it('should select item on mouse move', async () => {
    renderWithQuery(
      <Omnibar
        tabs={mockTabs}
        onSearch={mockOnSearch}
        generators={mockGenerators}
        onDismiss={mockOnDismiss}
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
    expect(items[0]).toHaveClass('bg-accent/[calc(var(--accent-strength)*1%)]')

    // Move mouse to the second item
    const secondItem = items[1]
    expect(secondItem).toBeDefined()
    fireEvent.mouseMove(secondItem!)

    // Second item should be selected
    expect(items[1]).toHaveClass('bg-accent/[calc(var(--accent-strength)*1%)]')
    expect(items[0]).not.toHaveClass(
      'bg-accent/[calc(var(--accent-strength)*1%)]',
    )
  })

  it('should NOT select item on mouse enter (simulating scroll under cursor)', async () => {
    renderWithQuery(
      <Omnibar
        tabs={mockTabs}
        onSearch={mockOnSearch}
        generators={mockGenerators}
        onDismiss={mockOnDismiss}
      />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Tab' } })

    const list = await screen.findByRole('list')
    const items = await within(list).findAllByRole('button', { name: /Tab/i })

    // Select first item
    expect(items[0]).toHaveClass('bg-accent/[calc(var(--accent-strength)*1%)]')

    // Fire mouseEnter on second item (should NOT change selection)
    const secondItem = items[1]
    expect(secondItem).toBeDefined()
    fireEvent.mouseEnter(secondItem!)

    expect(items[0]).toHaveClass('bg-accent/[calc(var(--accent-strength)*1%)]')
    expect(items[1]).not.toHaveClass(
      'bg-accent/[calc(var(--accent-strength)*1%)]',
    )
  })
})
