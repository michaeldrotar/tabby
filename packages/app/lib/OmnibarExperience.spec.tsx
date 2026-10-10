// @vitest-environment jsdom
import {
  createFixtureBuilder,
  createMemoryOmnibarResource,
  MemoryBackend,
} from '@extension/demo'
import { Surface } from '@extension/ui/Surface'
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
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createOmnibarView, OmnibarExperience } from './OmnibarExperience'
import { TabbyProvider } from './TabbyProvider'
import { createTestResources } from './testResources'
import type { OmnibarMetadata, OmnibarResult } from '@extension/core'

expect.extend(matchers)
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const setup = () => {
  const fixtures = createFixtureBuilder({ seed: 'search' })
  const browser = new MemoryBackend(
    fixtures.generateScene({
      windows: [
        fixtures.generateWindow({
          id: 1,
          tabs: [
            fixtures.generateTab({
              id: 11,
              title: 'Tabby project',
              url: 'http://localhost:3000',
            }),
          ],
        }),
      ],
    }),
  )
  const resource = createMemoryOmnibarResource(browser, {
    originalWindowId: 1,
    initialQuery: 'project',
    isMac: true,
  })
  return {
    ...createTestResources({ backend: browser, omnibar: resource }),
    backend: browser,
    omnibar: resource,
  }
}

describe('Omnibar experience', () => {
  it('shares browser results with separate controlled views and preserves the query on dismissal', async () => {
    const resources = setup()
    const left = createOmnibarView()
    const right = createOmnibarView({ query: 'window', edited: true })
    const dismiss = vi.fn()
    render(
      <>
        <section aria-label="left">
          <TabbyProvider
            {...resources}
            views={{ ...resources.views, omnibar: left }}
          >
            <OmnibarExperience onDismiss={dismiss} />
          </TabbyProvider>
        </section>
        <section aria-label="right">
          <TabbyProvider
            {...resources}
            views={{ ...resources.views, omnibar: right }}
          >
            <OmnibarExperience onDismiss={() => undefined} />
          </TabbyProvider>
        </section>
      </>,
    )
    const leftPanel = within(screen.getByRole('region', { name: 'left' }))
    const rightPanel = within(screen.getByRole('region', { name: 'right' }))
    await waitFor(() =>
      expect(leftPanel.getByRole('textbox')).toHaveValue('project'),
    )
    expect(rightPanel.getByRole('textbox')).toHaveValue('window')
    const tab = within(leftPanel.getByRole('list')).getByRole('button', {
      name: /^Tabby project/,
    })
    fireEvent.click(tab, { ctrlKey: true })
    await waitFor(() =>
      expect(resources.backend.getSnapshot().tabs).toHaveLength(2),
    )
    expect(dismiss).toHaveBeenCalledOnce()
    expect(resources.omnibar.getSavedQuery()).toBe('')
    expect(left.getState().query).toBe('')
    expect(right.getState().query).toBe('window')
    fireEvent.change(leftPanel.getByRole('textbox'), {
      target: { value: 'saved search' },
    })
    fireEvent.keyDown(leftPanel.getByRole('textbox'), { key: 'Escape' })
    await waitFor(() =>
      expect(resources.omnibar.getSavedQuery()).toBe('saved search'),
    )
    expect(dismiss).toHaveBeenCalledTimes(2)
  })
  it('renders a captured search frame without starting searches or accepting keyboard input', () => {
    vi.useFakeTimers()
    const resources = setup()
    const search = vi.spyOn(resources.omnibar, 'search')
    const view = createOmnibarView({
      query: 'captured',
      edited: true,
      resultsQuery: 'captured',
      externalResults: [
        {
          id: 'history',
          type: 'history',
          title: 'Captured history',
          url: 'https://captured.test',
          action: { kind: 'url', url: 'https://captured.test' },
        },
      ],
    })
    const dismiss = vi.fn()
    render(
      <Surface inputMode="scripted" motion="reduced">
        <TabbyProvider
          {...resources}
          views={{ ...resources.views, omnibar: view }}
        >
          <OmnibarExperience onDismiss={dismiss} />
        </TabbyProvider>
      </Surface>,
    )
    act(() => vi.advanceTimersByTime(300))
    expect(search).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: /^Captured history/, hidden: true }),
    ).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('textbox', { hidden: true }), {
      key: 'Escape',
    })
    expect(dismiss).not.toHaveBeenCalled()
    expect(view.getState().query).toBe('captured')
  })
  it('opens an external bookmark in a new tab through a modified click', async () => {
    const resources = setup()
    const view = createOmnibarView({
      query: 'documentation',
      edited: true,
      resultsQuery: 'documentation',
      externalResults: [
        {
          id: 'documentation-bookmark',
          type: 'bookmark',
          title: 'Tabby documentation',
          url: 'https://tabby.test/docs',
          action: { kind: 'url', url: 'https://tabby.test/docs' },
        },
      ],
    })
    const dismiss = vi.fn()
    render(
      <TabbyProvider
        {...resources}
        views={{ ...resources.views, omnibar: view }}
      >
        <OmnibarExperience onDismiss={dismiss} />
      </TabbyProvider>,
    )
    const bookmark = within(screen.getByRole('list')).getByRole('button', {
      name: /^Tabby documentation/,
    })
    fireEvent.click(bookmark, { metaKey: true })
    await waitFor(() => {
      expect(resources.backend.getSnapshot().tabs).toHaveLength(2)
      expect(dismiss).toHaveBeenCalledOnce()
    })
    expect(resources.backend.getSnapshot().tabs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          windowId: 1,
          url: 'https://tabby.test/docs',
          active: true,
        }),
      ]),
    )
  })
  it('keeps a user edit when saved query metadata arrives later', async () => {
    const resources = setup()
    let metadata: OmnibarMetadata = {
      loaded: false,
      initialQuery: '',
      isMac: false,
    }
    const listeners = new Set<() => void>()
    const resource = {
      ...resources.omnibar,
      getSnapshot: () => metadata,
      subscribe: (listener: () => void) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
    }
    const view = createOmnibarView()
    render(
      <TabbyProvider
        {...resources}
        omnibar={resource}
        views={{ ...resources.views, omnibar: view }}
      >
        <OmnibarExperience onDismiss={() => undefined} />
      </TabbyProvider>,
    )
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'user edit' },
    })
    act(() => {
      metadata = { ...metadata, loaded: true, initialQuery: 'saved query' }
      listeners.forEach((listener) => listener())
    })
    expect(screen.getByRole('textbox')).toHaveValue('user edit')
    expect(resource.getSavedQuery()).toBe('user edit')
  })
  it('keeps the newest query results when searches resolve out of order', async () => {
    vi.useFakeTimers()
    const resources = setup()
    const pending: Record<string, (results: OmnibarResult[]) => void> = {}
    const resource = {
      ...resources.omnibar,
      search: (query: string) =>
        new Promise<OmnibarResult[]>((resolve) => {
          pending[query] = resolve
        }),
    }
    const view = createOmnibarView({ query: 'first', edited: true })
    render(
      <TabbyProvider
        {...resources}
        omnibar={resource}
        views={{ ...resources.views, omnibar: view }}
      >
        <OmnibarExperience onDismiss={() => undefined} />
      </TabbyProvider>,
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'second' },
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })
    const result = (title: string): OmnibarResult => ({
      id: title,
      type: 'history',
      title,
      action: { kind: 'url', url: `https://${title}.test` },
    })
    await act(async () => {
      pending.second!([result('Second result')])
    })
    await act(async () => {
      pending.first!([result('First result')])
    })
    expect(view.getState().resultsQuery).toBe('second')
    expect(
      screen.getByRole('button', { name: /^Second result/ }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^First result/ }),
    ).not.toBeInTheDocument()
  })
  it('preserves a restored view when an awaited host action finishes after rewind', async () => {
    vi.useFakeTimers()
    const resources = setup()
    let finish!: () => void
    const resource = createMemoryOmnibarResource(resources.backend, {
      initialQuery: 'options',
      onOptions: () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    })
    const view = createOmnibarView()
    const dismiss = vi.fn()
    render(
      <TabbyProvider
        {...resources}
        omnibar={resource}
        views={{ ...resources.views, omnibar: view }}
      >
        <OmnibarExperience onDismiss={dismiss} />
      </TabbyProvider>,
    )
    fireEvent.click(
      within(screen.getByRole('list')).getByRole('button', {
        name: /Tabby: Open Options/,
      }),
    )
    act(() => {
      resource.restoreSavedQuery('restored query')
      view.setState({ query: 'restored query', edited: true, error: null })
    })
    const restored = view.getState()
    await act(async () => {
      finish()
    })
    expect(view.getState()).toBe(restored)
    expect(resource.getSavedQuery()).toBe('restored query')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(dismiss).not.toHaveBeenCalled()
  })
})
