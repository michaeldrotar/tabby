import { createFixtureBuilder } from './fixtures'
import type { FixtureOptions } from './fixtures'
import type { BrowserSnapshot, BrowserTab } from '@extension/core'

export type MemoryScenePreset =
  | 'single-window'
  | 'standard'
  | 'many-windows'
  | 'large'
  | 'restricted'
  | 'loading'
  | 'error'
  | 'empty'

export type MemorySceneOverrides = Partial<BrowserSnapshot> &
  FixtureOptions & {
    variant?: 'left' | 'right'
  }

export const memorySceneTime = Date.UTC(2026, 0, 12, 12)
const buildScene = (
  variant: 'left' | 'right',
  dataset: MemoryScenePreset,
  fixtureOptions: FixtureOptions,
): BrowserSnapshot => {
  const fixture = createFixtureBuilder({
    seed: fixtureOptions.seed ?? variant,
    now: fixtureOptions.now ?? memorySceneTime,
  })
  const faviconUrl = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" rx="5" fill="#64748b"/><text x="12" y="17" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">T</text></svg>')}`
  const generateTab = (overrides: Partial<BrowserTab>) =>
    fixture.generateTab({ faviconUrl, ...overrides })
  const group = fixture.generateGroup({
    id: 101,
    title: 'Research',
    color: 'blue',
  })
  const scene = fixture.generateScene({
    windows: [
      fixture.generateWindow({
        id: 1,
        focused: true,
        groups: [group],
        tabs: [
          generateTab({
            id: 11,
            title: 'Tabby',
            url: 'https://tabby.app',
            active: true,
            pinned: true,
          }),
          generateTab({
            id: 12,
            title:
              variant === 'left' ? 'Architecture notes' : 'Design inspiration',
            groupId: 101,
          }),
          generateTab({
            id: 13,
            title: 'Component library',
            groupId: 101,
          }),
          ...Array.from({ length: 13 }, (_, index) =>
            generateTab({
              id: 14 + index,
              title: `Reference ${index + 1}`,
              audible: index === 0,
              muted: index === 1,
              discarded: index === 2,
            }),
          ),
        ],
      }),
      fixture.generateWindow({
        id: 2,
        groups: [
          fixture.generateGroup({
            id: 102,
            title: 'Later',
            color: 'purple',
            collapsed: true,
          }),
        ],
        tabs: [
          generateTab({
            id: 31,
            title: 'Release checklist',
            active: true,
          }),
          generateTab({ id: 32, title: 'Documentation', groupId: 102 }),
        ],
      }),
    ],
  })
  if (dataset === 'single-window') {
    scene.windows = scene.windows.slice(0, 1)
    scene.tabs = scene.tabs.filter((tab) => tab.windowId === 1).slice(0, 4)
    scene.groups = scene.groups.filter((group) => group.windowId === 1)
  }
  if (dataset === 'many-windows') {
    const extra = fixture.generateScene({
      windows: Array.from({ length: 4 }, (_, index) =>
        fixture.generateWindow({
          id: index + 3,
          tabs: Array.from({ length: 6 }, (_, tabIndex) =>
            generateTab({ title: `Window ${index + 3} · Tab ${tabIndex + 1}` }),
          ),
        }),
      ),
    })
    scene.windows = [
      ...scene.windows,
      ...extra.windows.map((window) => ({ ...window, focused: false })),
    ]
    scene.tabs = [...scene.tabs, ...extra.tabs]
  }
  if (dataset === 'large') {
    scene.tabs = scene.windows.flatMap((window) => {
      const existing = scene.tabs.filter((tab) => tab.windowId === window.id)
      return [
        ...existing,
        ...Array.from({ length: 200 - existing.length }, (_, index) => ({
          ...generateTab({
            id: window.id * 1000 + index,
            title: `Large window ${window.id} · Tab ${existing.length + index + 1}`,
          }),
          windowId: window.id,
          index: existing.length + index,
        })),
      ]
    })
  }
  if (dataset === 'restricted')
    scene.windows = scene.windows.map((window) => ({
      ...window,
      incognito: window.id === 2,
    }))
  if (dataset === 'loading' || dataset === 'error') {
    return {
      ...scene,
      state: dataset,
      windows: [],
      tabs: [],
      groups: [],
      error:
        dataset === 'error'
          ? 'The sample browser could not load. Choose another dataset to continue.'
          : undefined,
    }
  }
  if (dataset === 'empty')
    return { ...scene, windows: [], tabs: [], groups: [] }
  return scene
}

/** Deterministic scenes can be replaced or customized without any browser APIs. */
export const createMemoryScene = (
  preset: MemoryScenePreset | BrowserSnapshot = 'standard',
  overrides: MemorySceneOverrides = {},
): BrowserSnapshot => {
  const {
    variant = 'left',
    seed,
    now,
    windows,
    tabs,
    groups,
    ...metadata
  } = overrides
  const scene =
    typeof preset === 'string'
      ? buildScene(variant, preset, { seed, now })
      : preset
  if (windows === undefined && tabs === undefined && groups === undefined)
    return { ...scene, ...metadata }
  const normalized = createFixtureBuilder({ seed, now }).generateScene({
    windows: windows ?? scene.windows,
    tabs: tabs ?? (windows === undefined ? scene.tabs : undefined),
    groups: groups ?? (windows === undefined ? scene.groups : undefined),
  })
  return {
    ...scene,
    windows: normalized.windows,
    tabs: normalized.tabs,
    groups: normalized.groups,
    ...metadata,
  }
}
