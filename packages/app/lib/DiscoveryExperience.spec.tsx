// @vitest-environment jsdom
import { createDiscoveryResource } from '@extension/core/discovery'
import { createMemoryPreferences } from '@extension/demo'
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
import { DiscoveryExperience, DiscoveryOptions } from './DiscoveryExperience'
import { TabbyProvider, TabbySurface } from './TabbyProvider'
import { createTestResources } from './testResources'

expect.extend(matchers)
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
})
afterEach(cleanup)

describe('discovery experience', () => {
  it('shows a tour once, permits skipping, and replays from the tip library', async () => {
    const discovery = createDiscoveryResource()
    await discovery.start()
    const resources = createTestResources({ discovery })
    render(
      <TabbyProvider {...resources}>
        <TabbySurface>
          <button data-window-picker-trigger>Windows</button>
          <DiscoveryExperience area="tab-manager" ready />
          <DiscoveryOptions />
        </TabbySurface>
      </TabbyProvider>,
    )
    const tour = screen.getByRole('dialog')
    expect(tour).toHaveTextContent('1 of 3')
    fireEvent.click(within(tour).getByRole('button', { name: 'Next' }))
    expect(tour).toHaveTextContent('2 of 3')
    fireEvent.keyDown(tour, { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(discovery.getSnapshot().completedTours).toEqual(['tab-manager'])
    fireEvent.click(
      screen.getByRole('button', { name: 'Replay tab manager walkthrough' }),
    )
    await waitFor(() =>
      expect(screen.getByRole('dialog')).toHaveTextContent('1 of 3'),
    )
  })

  it('delivers a mature move tip to the destination, changes the preference, and undoes only that setting', async () => {
    let time = new Date(2026, 10, 1, 12).getTime()
    const discovery = createDiscoveryResource(undefined, () => time)
    await discovery.start()
    await discovery.completeTour('tab-manager')
    for (let day = 0; day < 3; day++) {
      if (day) {
        time += 86400000
        discovery.dispose()
        await discovery.start()
      }
      await discovery.offerTip('follow-windows', 2)
    }
    const preferences = createMemoryPreferences()
    const resources = createTestResources({
      discovery,
      preferences,
      host: { getCurrentWindowId: () => 1 },
    })
    const view = (windowId: number) => (
      <TabbyProvider
        {...resources}
        host={{ getCurrentWindowId: () => windowId }}
      >
        <TabbySurface>
          <DiscoveryExperience area="tab-manager" ready />
        </TabbySurface>
      </TabbyProvider>
    )
    const mounted = render(view(1))
    expect(screen.queryByLabelText('Tabby tip')).not.toBeInTheDocument()
    mounted.rerender(view(2))
    expect(screen.getByRole('link', { name: 'Open options' })).toHaveAttribute(
      'href',
      '/options/index.html#tips-and-walkthroughs',
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Always switch windows' }),
    )
    await waitFor(() =>
      expect(preferences.getSnapshot().tabManagerWindowClickBehavior).toBe(
        'switch',
      ),
    )
    expect(screen.getByRole('status')).toHaveTextContent('Setting changed.')
    await act(() => preferences.set({ tabManagerCompactIconMode: 'first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    await waitFor(() =>
      expect(preferences.getSnapshot()).toMatchObject({
        tabManagerWindowClickBehavior: 'view',
        tabManagerCompactIconMode: 'first',
      }),
    )
    expect(screen.queryByLabelText('Tabby tip')).not.toBeInTheDocument()
  })

  it('makes every tip available immediately and reports failed setting changes without offering undo', async () => {
    const discovery = createDiscoveryResource()
    await discovery.start()
    const preferences = createMemoryPreferences()
    vi.spyOn(preferences, 'set').mockRejectedValueOnce(
      new Error('Could not save settings'),
    )
    render(
      <TabbyProvider {...createTestResources({ discovery, preferences })}>
        <TabbySurface>
          <DiscoveryOptions />
        </TabbySurface>
      </TabbyProvider>,
    )
    expect(
      screen.getByText('Make switching windows the default'),
    ).toBeInTheDocument()
    const details = screen
      .getByText('Make switching windows the default')
      .closest('details')!
    details.open = true
    fireEvent.click(
      within(details).getByRole('button', { name: 'Always switch windows' }),
    )
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Could not save settings',
      ),
    )
    expect(
      screen.queryByRole('button', { name: 'Undo' }),
    ).not.toBeInTheDocument()
    expect(preferences.getSnapshot().tabManagerWindowClickBehavior).toBe('view')
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Show tips as I use Tabby' }),
    )
    await waitFor(() => expect(discovery.getSnapshot().tipsEnabled).toBe(false))
  })
})
