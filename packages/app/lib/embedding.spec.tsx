import {
  createFixtureBuilder,
  createMemoryOmnibarResource,
  createMemoryOptionsResource,
  createMemoryPreferences,
  MemoryBackend,
} from '@extension/demo'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createTabbyViews } from './createTabbyViews'
import { OmnibarExperience } from './OmnibarExperience'
import { OptionsExperience } from './OptionsExperience'
import { TabbyProvider, TabbySurface } from './TabbyProvider'
import { TabManagerExperience } from './TabManagerExperience'

describe('ordinary web embedding', () => {
  it('renders all three experiences on the server without browser or Chrome globals', () => {
    const fixtures = createFixtureBuilder({ seed: 'server' })
    const backend = new MemoryBackend(
      fixtures.generateScene({
        windows: [
          fixtures.generateWindow({
            tabs: [fixtures.generateTab({ title: 'Server tab' })],
          }),
        ],
      }),
    )
    const preferences = createMemoryPreferences()
    const environment = {
      now: () => 1700000000000,
      systemTheme: 'light' as const,
    }
    const html = renderToString(
      <TabbyProvider
        backend={backend}
        preferences={preferences}
        omnibar={createMemoryOmnibarResource(backend)}
        options={createMemoryOptionsResource()}
        views={createTabbyViews()}
        environment={environment}
      >
        <TabbySurface instanceId="server-manager">
          <TabManagerExperience />
        </TabbySurface>
        <TabbySurface instanceId="server-search">
          <OmnibarExperience onDismiss={() => undefined} />
        </TabbySurface>
        <TabbySurface instanceId="server-options">
          <OptionsExperience />
        </TabbySurface>
      </TabbyProvider>,
    )
    expect(html).toContain('Server tab')
    expect(html).toContain('Search tabs, groups, bookmarks, history')
    expect(html).toContain('Appearance')
    expect(globalThis).not.toHaveProperty('chrome')
  })
})
