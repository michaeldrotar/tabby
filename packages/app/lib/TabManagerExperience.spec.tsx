// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import {
  createFixtureBuilder,
  createMemoryPreferences,
  MemoryBackend,
} from '@extension/demo'
import { Surface } from '@extension/ui/Surface'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { createTabbyViews } from './createTabbyViews'
import { TabbyProvider } from './TabbyProvider'
import { TabManagerExperience } from './TabManagerExperience'
import { createTestResources } from './testResources'
import { createTabManagerView } from './view'

afterEach(cleanup)
describe('experience clock', () => {
  it('updates live tab ages using the host clock and stops when a frame becomes inert', () => {
    let now = 100000
    const fixture = createFixtureBuilder({ now })
    const backend = new MemoryBackend(
      fixture.generateScene({
        windows: [
          fixture.generateWindow({
            tabs: [
              fixture.generateTab({ title: 'Clock tab', lastAccessed: now }),
            ],
          }),
        ],
      }),
    )
    const preferences = createMemoryPreferences()
    const view = createTabManagerView()
    const pending: Array<() => void> = []
    const environment = {
      now: () => now,
      systemTheme: 'light' as const,
      schedule: (callback: () => void) => {
        pending.push(callback)
        return () => {
          const index = pending.indexOf(callback)
          if (index >= 0) pending.splice(index, 1)
        }
      },
    }
    const product = (inputMode: 'live' | 'scripted' | 'static') => (
      <TabbyProvider
        {...createTestResources({ backend, preferences, environment })}
        views={createTabbyViews({ tabManager: view })}
      >
        <Surface inputMode={inputMode} motion="full">
          <TabManagerExperience />
        </Surface>
      </TabbyProvider>
    )
    const { rerender } = render(product('live'))
    expect(screen.getByText('• just now')).toBeInTheDocument()
    act(() => {
      now += 1000
      pending.shift()!()
    })
    expect(screen.getByText('• 1s')).toBeInTheDocument()
    rerender(product('scripted'))
    expect(pending).toHaveLength(0)
    now += 10000
    expect(screen.getByText('• 1s')).toBeInTheDocument()
    rerender(product('static'))
    expect(pending).toHaveLength(0)
  })
})
