import {
  createFixtureBuilder,
  createMemoryOmnibarResource,
  createMemoryOptionsResource,
  createMemoryPreferences,
  MemoryBackend,
} from '@extension/demo'
import { createTabbyViews } from './createTabbyViews'
import type { TabbyResources } from './TabbyProvider'

export const createTestResources = (
  overrides: Partial<TabbyResources> = {},
): TabbyResources => {
  const backend =
    overrides.backend ??
    new MemoryBackend(createFixtureBuilder().generateScene())
  return {
    backend,
    preferences: createMemoryPreferences(),
    omnibar: createMemoryOmnibarResource(backend),
    options: createMemoryOptionsResource(),
    views: createTabbyViews(),
    environment: { now: () => 10000, systemTheme: 'light' },
    ...overrides,
  }
}
