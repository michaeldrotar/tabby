import { MemoryBackend } from './memoryBackend'
import { createMemoryOmnibarResource } from './memoryOmnibar'
import { createMemoryOptionsResource } from './memoryOptions'
import { createMemoryPreferences } from './memoryPreferences'
import { createMemoryScene } from './scenes'
import type { MemoryOmnibarOptions } from './memoryOmnibar'
import type { MemorySceneOverrides, MemoryScenePreset } from './scenes'
import type {
  BrowserBackend,
  BrowserSnapshot,
  OmnibarResource,
  OptionsMetadata,
  OptionsResource,
  PreferenceResource,
  PreferenceState,
} from '@extension/core'

export type MemoryTabbyData = {
  backend: BrowserBackend
  preferences: PreferenceResource
  omnibar: OmnibarResource
  options: OptionsResource
}

export type MemoryTabbyDataOptions = {
  scene?: MemoryScenePreset | BrowserSnapshot
  overrides?: MemorySceneOverrides
  preferences?: Partial<PreferenceState>
  resources?: Partial<MemoryTabbyData>
  omnibar?: MemoryOmnibarOptions
  optionsMetadata?: Partial<OptionsMetadata>
  optionsHost?: Partial<
    Pick<OptionsResource, 'openShortcutsSettings' | 'openSidePanelSettings'>
  >
  commands?: 'apply' | 'ignore'
}

export const createMemoryTabbyBackend = (
  config: MemoryTabbyDataOptions = {},
): BrowserBackend =>
  config.resources?.backend ??
  new MemoryBackend(
    createMemoryScene(config.scene ?? 'standard', config.overrides),
    { commands: config.commands ?? 'apply' },
  )

export const createMemoryTabbyPreferences = (
  config: MemoryTabbyDataOptions = {},
): PreferenceResource =>
  config.resources?.preferences ?? createMemoryPreferences(config.preferences)

export const createMemoryTabbyOmnibar = (
  backend: BrowserBackend,
  config: MemoryTabbyDataOptions = {},
): OmnibarResource => {
  const snapshot = backend.getSnapshot()
  const originalWindowId =
    snapshot.windows.find((window) => window.focused)?.id ??
    snapshot.windows[0]?.id
  return (
    config.resources?.omnibar ??
    createMemoryOmnibarResource(backend, {
      originalWindowId,
      commands: config.commands ?? 'apply',
      isMac: config.optionsMetadata?.isMac ?? false,
      ...config.omnibar,
    })
  )
}

export const createMemoryTabbyOptions = (
  config: MemoryTabbyDataOptions = {},
): OptionsResource =>
  config.resources?.options ??
  createMemoryOptionsResource(
    { isMac: config.omnibar?.isMac ?? false, ...config.optionsMetadata },
    config.optionsHost,
  )

/** Share any supplied handles; create independent defaults for the remaining data. */
export const createMemoryTabbyData = (
  config: MemoryTabbyDataOptions = {},
): MemoryTabbyData => {
  const backend = createMemoryTabbyBackend(config)
  return {
    backend,
    preferences: createMemoryTabbyPreferences(config),
    omnibar: createMemoryTabbyOmnibar(backend, config),
    options: createMemoryTabbyOptions(config),
  }
}
