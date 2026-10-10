// @vitest-environment jsdom
import { defaultPreferences } from '@extension/core'
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
import { resolveTheme } from './PreferenceSurface'
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
  it('changes only the requested preferences, randomizes the active palette, and resets shared values', async () => {
    const preferences = createMemoryPreferences({
      theme: 'system',
      tabManagerCompactLayout: 'list',
    })
    const view = createOptionsView()
    const shortcuts = vi.fn(async () => {})
    const resource = createMemoryOptionsResource(
      {},
      { openShortcutsSettings: shortcuts },
    )
    const controller = createOptionsController(
      preferences,
      resource,
      view,
      () => 'dark',
      () => 0,
    )
    await controller.change({ themeDarkAccent: 'rose' })
    expect(preferences.getSnapshot()).toMatchObject({
      themeDarkAccent: 'rose',
      tabManagerCompactLayout: 'list',
    })
    await controller.randomize()
    expect(preferences.getSnapshot()).toMatchObject({
      themeDarkAccent: 'red',
      themeDarkBackground: 'slate',
      themeLightAccent: defaultPreferences.themeLightAccent,
    })
    await controller.openShortcuts()
    expect(shortcuts).toHaveBeenCalledOnce()
    await controller.reset()
    expect(preferences.getSnapshot()).toEqual(defaultPreferences)
    expect(
      resolveTheme({ ...defaultPreferences, theme: 'dark' }, 'light').accent,
    ).toBe(defaultPreferences.themeDarkAccent)
  })

  it('reports failed writes and ignores an error from a cancelled action', async () => {
    const preferences = createMemoryPreferences()
    const resource = createMemoryOptionsResource()
    const view = createOptionsView()
    const controller = createOptionsController(
      preferences,
      resource,
      view,
      () => 'light',
    )
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
    expect(
      Array.from(container.querySelectorAll('[data-surface]')).map((surface) =>
        surface.getAttribute('data-theme'),
      ),
    ).toEqual(['dark', 'dark'])
    left.setState({ openControl: 'accent', scrollTop: 100 })
    expect(right.getState()).toMatchObject({ openControl: null, scrollTop: 0 })
  })
})
