// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as matchers from '@testing-library/jest-dom/matchers'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
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

const createLocalhostTabs = (): OmnibarSearchResult[] =>
  [
    { id: 1, title: 'Project One', windowId: 2, tabId: 1 },
    { id: 2, title: 'Project Two', windowId: 3, tabId: 2 },
    { id: 3, title: 'Project Three', windowId: 4, tabId: 3 },
  ].map((tab) => ({
    ...tab,
    type: 'tab',
    url: 'http://localhost:3000',
    execute: vi.fn().mockResolvedValue(undefined),
  }))

const createGenerators = (): OmnibarResultGenerators => ({
  getGoogleSearchItem: (query) => ({
    id: `google-${query}`,
    type: 'search',
    title: `Search Google for "${query}"`,
    url: `https://google.com/search?q=${encodeURIComponent(query)}`,
    execute: vi.fn().mockResolvedValue(undefined),
  }),
  getUrlNavigationItem: () => [],
  getMatchingCommands: () => [],
  getMatchingTabs: (tabs, queryTerms) =>
    tabs.filter((tab) =>
      queryTerms.every((term) =>
        `${tab.title} ${tab.url}`.toLowerCase().includes(term.toLowerCase()),
      ),
    ),
})

describe('Omnibar modifier actions', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  beforeEach(() => {
    globalThis.chrome = {
      runtime: { id: 'test-extension-id' },
    } as unknown as typeof chrome
  })

  afterEach(cleanup)

  const renderOmnibar = (tabs: OmnibarSearchResult[]) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const onDismiss = vi.fn()
    const onSearch = vi.fn().mockResolvedValue([])

    render(
      <QueryClientProvider client={queryClient}>
        <Omnibar
          tabs={tabs}
          onSearch={onSearch}
          generators={createGenerators()}
          onDismiss={onDismiss}
          originalWindowId={1}
        />
      </QueryClientProvider>,
    )
  }

  const searchLocalhostTabs = async () => {
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'localhost' } })
    const list = await screen.findByRole('list')
    return { input, list }
  }

  it('routes keyboard new-tab actions for localhost results', async () => {
    const tabs = createLocalhostTabs()
    renderOmnibar(tabs)

    const { input, list } = await searchLocalhostTabs()
    const projectTwo = within(list).getByRole('button', {
      name: /Project Two/,
    })
    fireEvent.mouseMove(projectTwo)
    fireEvent.keyDown(input, { key: 'Control' })

    expect(projectTwo).toHaveTextContent('Open in New Tab')
    expect(projectTwo).not.toHaveTextContent('Jump to')

    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true })

    await waitFor(() =>
      expect(tabs[1]!.execute).toHaveBeenCalledWith('new-tab', 1),
    )
  })

  it('preserves Shift precedence and updates the keyboard action hint', async () => {
    const tabs = createLocalhostTabs()
    renderOmnibar(tabs)

    const { input, list } = await searchLocalhostTabs()
    const projectThree = within(list).getByRole('button', {
      name: /Project Three/,
    })
    fireEvent.mouseMove(projectThree)
    fireEvent.keyDown(input, { key: 'Control' })
    fireEvent.keyDown(input, { key: 'Shift', ctrlKey: true })

    expect(projectThree).toHaveTextContent('Open in New Window')

    fireEvent.keyDown(input, {
      key: 'Enter',
      ctrlKey: true,
      shiftKey: true,
    })

    await waitFor(() =>
      expect(tabs[2]!.execute).toHaveBeenCalledWith('new-window', 1),
    )
  })

  it('routes modifier-clicks to the clicked localhost result', async () => {
    const tabs = createLocalhostTabs()
    renderOmnibar(tabs)

    const { list } = await searchLocalhostTabs()
    const projectOne = within(list).getByRole('button', { name: /Project One/ })
    const projectThree = within(list).getByRole('button', {
      name: /Project Three/,
    })

    fireEvent.click(projectOne, { metaKey: true })
    await waitFor(() =>
      expect(tabs[0]!.execute).toHaveBeenCalledWith('new-tab', 1),
    )

    fireEvent.click(projectThree, { shiftKey: true })
    await waitFor(() =>
      expect(tabs[2]!.execute).toHaveBeenCalledWith('new-window', 1),
    )
  })
})
