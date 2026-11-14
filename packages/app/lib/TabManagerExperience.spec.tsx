// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { createFixtureBuilder, MemoryBackend } from '@extension/demo'
import { Surface } from '@extension/ui/Surface'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { TabbyProvider } from './TabbyProvider'
import { TabManagerExperience } from './TabManagerExperience'
import { createTestResources } from './testResources'

afterEach(cleanup)

it('shows tab titles and domains without activity times or clock updates', () => {
  const now = 100000
  const fixture = createFixtureBuilder({ now })
  const backend = new MemoryBackend(
    fixture.generateScene({
      windows: [
        fixture.generateWindow({
          tabs: [
            fixture.generateTab({
              title: 'Recent tab',
              url: 'https://recent.test/page',
              lastAccessed: now,
            }),
            fixture.generateTab({
              title: 'Older tab',
              url: 'https://older.test/page',
              lastAccessed: now - 60000,
            }),
          ],
        }),
      ],
    }),
  )
  const schedule = vi.fn(() => () => {})
  const { container } = render(
    <TabbyProvider
      {...createTestResources({
        backend,
        environment: { now: () => now, systemTheme: 'light', schedule },
      })}
    >
      <Surface inputMode="live" motion="full">
        <TabManagerExperience />
      </Surface>
    </TabbyProvider>,
  )
  expect(screen.getByRole('option', { name: 'Tab: Recent tab' })).toBeVisible()
  expect(screen.getByRole('option', { name: 'Tab: Older tab' })).toBeVisible()
  expect(
    Array.from(
      container.querySelectorAll('[data-tab-details]'),
      (element) => element.textContent,
    ),
  ).toEqual(['Recent tabrecent.test', 'Older tabolder.test'])
  expect(schedule).not.toHaveBeenCalled()
})
