// @vitest-environment jsdom
import {
  createMemoryOptionsResource,
  createMemoryPreferences,
} from '@extension/demo'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createTabbyViews } from './createTabbyViews'
import {
  createOptionsController,
  createOptionsView,
  OptionsExperience,
} from './OptionsExperience'
import { TabbyProvider, TabbySurface } from './TabbyProvider'
import { createTestResources } from './testResources'

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})
afterEach(cleanup)

describe('Options resources', () => {
  it('keeps seasonal icons independent of the selected color theme', () => {
    const preferences = createMemoryPreferences({ themePreset: 'reef' })
    const options = createMemoryOptionsResource({
      logoUrl: '/tabby-face-128.png',
    })
    render(
      <TabbyProvider
        {...createTestResources({
          preferences,
          options,
          environment: {
            now: () => new Date(2026, 9, 24).getTime(),
            systemTheme: 'light',
          },
        })}
      >
        <TabbySurface>
          <OptionsExperience />
        </TabbySurface>
      </TabbyProvider>,
    )
    expect(
      screen.getByRole('img', { name: /^Tabby$/ }).getAttribute('src'),
    ).toBe('/seasonal-icons/halloween-frankenstein-hoodie-128.png')
  })
  it('changes shared theme choices and opens shortcuts', async () => {
    const preferences = createMemoryPreferences({
      theme: 'system',
      themeLightForeground: 'gray',
    })
    const view = createOptionsView()
    const shortcuts = vi.fn(async () => {})
    const resource = createMemoryOptionsResource(
      {},
      { openShortcutsSettings: shortcuts },
    )
    const controller = createOptionsController(preferences, resource, view)
    await controller.change({ themePreset: 'reef' })
    expect(preferences.getSnapshot()).toMatchObject({
      themePreset: 'reef',
      themeLightForeground: 'gray',
    })
    await controller.openShortcuts()
    expect(shortcuts).toHaveBeenCalledOnce()
  })

  it('reports failed writes and ignores an error from a cancelled action', async () => {
    const preferences = createMemoryPreferences()
    const resource = createMemoryOptionsResource()
    const view = createOptionsView()
    const controller = createOptionsController(preferences, resource, view)
    vi.spyOn(preferences, 'set').mockRejectedValueOnce(
      new Error('Storage unavailable'),
    )
    await controller.change({ theme: 'dark' })
    expect(view.getState().error).toBe('Storage unavailable')
    let reject!: (error: Error) => void
    vi.spyOn(resource, 'openSidePanelSettings').mockImplementationOnce(
      () =>
        new Promise((_, failure) => {
          reject = failure
        }),
    )
    const opening = controller.openAppearance()
    controller.cancel()
    reject(new Error('Disposed'))
    await opening
    expect(view.getState().error).toBeNull()
  })

  it('keeps radio groups and controlled view state separate while sharing preferences', async () => {
    window.history.replaceState(null, '', '/')
    const preferences = createMemoryPreferences({ theme: 'light' })
    const resource = createMemoryOptionsResource()
    const left = createOptionsView()
    const right = createOptionsView()
    const { container } = render(
      <>
        {[left, right].map((view, index) => (
          <TabbyProvider
            key={index}
            {...createTestResources({ preferences, options: resource })}
            views={createTabbyViews({ options: view })}
          >
            <TabbySurface instanceId={`options-${index}`} theme={undefined}>
              <OptionsExperience />
            </TabbySurface>
          </TabbyProvider>
        ))}
      </>,
    )
    const dark = screen.getAllByRole('radio', { name: 'Dark' })
    expect(dark[0]!.getAttribute('name')).not.toBe(
      dark[1]!.getAttribute('name'),
    )
    fireEvent.click(dark[0]!)
    await waitFor(() =>
      expect(dark.every((input) => (input as HTMLInputElement).checked)).toBe(
        true,
      ),
    )
    const seasonalButtons = screen.getAllByRole('button', {
      name: 'Choose seasonal icons',
    })
    fireEvent.click(seasonalButtons[0]!)
    fireEvent.click(seasonalButtons[1]!)
    const heartEyes = screen.getAllByRole('radio', { name: 'Heart eyes' })
    expect(heartEyes).toHaveLength(2)
    expect(
      new Set(heartEyes.map((input) => input.getAttribute('name'))).size,
    ).toBe(2)
    expect(window.location.hash).toBe('')
    expect(
      Array.from(container.querySelectorAll('[data-surface]')).map((surface) =>
        surface.getAttribute('data-theme'),
      ),
    ).toEqual(['dark', 'dark'])
    left.setState({ openControl: 'accent', scrollTop: 100 })
    expect(right.getState()).toMatchObject({ openControl: null, scrollTop: 0 })
  })
})
