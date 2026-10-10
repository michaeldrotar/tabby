import {
  createTabManagerController,
  createTabManagerView,
} from '@extension/app'
import {
  createFixtureBuilder,
  createMemoryPreferences,
  MemoryBackend,
} from '@extension/demo'
import { createDemoPlayer } from '@extension/demo/player'
import type { TabbyResources, TabManagerViewState } from '@extension/app'
import type {
  BrowserSnapshot,
  BrowserTab,
  PreferenceState,
} from '@extension/core'
import type { MemoryCheckpoint } from '@extension/demo'
import type { TimelineFrame } from '@extension/demo/player'
import type { TabManagerItem } from '@extension/ui/tab-manager/TabManager'

export type Sharing = 'none' | 'data' | 'all'
export type Cue = {
  kind: 'mouse' | 'keyboard'
  item: TabManagerItem
  label: string
} | null
type Checkpoint = {
  sceneVersion: 1
  backends: MemoryCheckpoint[]
  views: TabManagerViewState[]
  preferences: PreferenceState[]
  cue: Cue
  now: number
}

const baselineTime = Date.UTC(2026, 0, 12, 12)
const seedScene = (variant: 'left' | 'right'): BrowserSnapshot => {
  const fixture = createFixtureBuilder({ seed: variant, now: baselineTime })
  const faviconUrl = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" rx="5" fill="#64748b"/><text x="12" y="17" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">T</text></svg>')}`
  const generateTab = (overrides: Partial<BrowserTab>) =>
    fixture.generateTab({ faviconUrl, ...overrides })
  const group = fixture.generateGroup({
    id: 101,
    title: 'Research',
    color: 'blue',
  })
  return fixture.generateScene({
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
}

export const createScenario = async (
  sharing: Sharing,
  sharePreferences: boolean,
  ignoreCommands = false,
) => {
  let now = baselineTime
  let cue: Cue = null
  const environment = { now: () => now, systemTheme: 'light' as const }
  const leftBackend = new MemoryBackend(seedScene('left'), {
    commands: ignoreCommands ? 'ignore' : 'apply',
  })
  const rightBackend =
    sharing === 'none'
      ? new MemoryBackend(seedScene('right'), {
          commands: ignoreCommands ? 'ignore' : 'apply',
        })
      : leftBackend
  const leftView = createTabManagerView({ viewedWindowId: 1 })
  const rightView =
    sharing === 'all' ? leftView : createTabManagerView({ viewedWindowId: 1 })
  const leftPreferences = createMemoryPreferences({ theme: 'light' })
  const rightPreferences = sharePreferences
    ? leftPreferences
    : createMemoryPreferences({ theme: 'dark' })
  const resources: TabbyResources[] = [
    {
      backend: leftBackend,
      view: leftView,
      preferences: leftPreferences,
      environment,
    },
    {
      backend: rightBackend,
      view: rightView,
      preferences: rightPreferences,
      environment,
    },
  ]
  const backends = [...new Set([leftBackend, rightBackend])]
  const views = [...new Set([leftView, rightView])]
  const preferences = [...new Set([leftPreferences, rightPreferences])]
  const controllers = resources.map(createTabManagerController)
  const capture = (): Checkpoint => ({
    sceneVersion: 1,
    backends: backends.map((backend) => backend.capture()),
    views: views.map((view) => structuredClone(view.getState())),
    preferences: preferences.map((resource) =>
      structuredClone(resource.getSnapshot()),
    ),
    cue: structuredClone(cue),
    now,
  })
  const restore = (checkpoint: Checkpoint) => {
    if (checkpoint.sceneVersion !== 1)
      throw new Error('Unsupported Tab Manager tutorial version.')
    controllers.forEach((controller) => controller.cancel())
    now = checkpoint.now
    cue = structuredClone(checkpoint.cue)
    backends.forEach((backend, index) =>
      backend.restore(checkpoint.backends[index]!),
    )
    views.forEach((view, index) =>
      view.setState(structuredClone(checkpoint.views[index]!), true),
    )
    preferences.forEach((resource, index) =>
      resource.restoreSnapshot(checkpoint.preferences[index]!),
    )
  }
  await Promise.all(backends.map((backend) => backend.start()))
  controllers.forEach((controller) => controller.reconcile())
  const frames: TimelineFrame<Checkpoint>[] = [
    { at: 0, title: 'Start with a clean Tab Manager', state: capture() },
  ]
  const step = async (
    at: number,
    title: string,
    run: () => void | Promise<void>,
    nextCue: Cue = null,
  ) => {
    now = baselineTime + at
    cue = nextCue
    await run()
    controllers.forEach((controller) => controller.reconcile())
    frames.push({ at, title, state: capture() })
  }
  await step(
    1200,
    'Hover the first tab',
    () => leftView.setState({ hoveredItem: { type: 'tab', id: 11 } }),
    { kind: 'mouse', item: { type: 'tab', id: 11 }, label: 'Move pointer' },
  )
  await step(
    2400,
    'Select Tabby',
    () =>
      controllers[0]!.dispatch({
        type: 'select-item',
        item: { type: 'tab', id: 11 },
      }),
    { kind: 'mouse', item: { type: 'tab', id: 11 }, label: 'Click' },
  )
  await step(
    3600,
    'Extend the selection with Shift + Arrow Down',
    () => {
      leftView.setState({ hoveredItem: null })
      return controllers[0]!.dispatch({
        type: 'navigate',
        key: 'ArrowDown',
        shift: true,
      })
    },
    { kind: 'keyboard', item: { type: 'group', id: 101 }, label: 'Shift + ↓' },
  )
  await step(
    4800,
    'Open the selection actions',
    () => controllers[0]!.dispatch({ type: 'open-action-menu' }),
    {
      kind: 'keyboard',
      item: { type: 'group', id: 101 },
      label: 'Selection actions',
    },
  )
  await step(
    6000,
    'Close the selected tabs',
    () => controllers[0]!.dispatch({ type: 'close-selection' }),
    { kind: 'keyboard', item: { type: 'tab', id: 14 }, label: 'Delete' },
  )
  await step(7200, 'Scroll through the remaining tabs', () =>
    controllers[0]!.dispatch({ type: 'scroll', top: 180 }),
  )
  await step(8400, 'Open another window in this view', () =>
    controllers[0]!.dispatch({ type: 'view-window', windowId: 2 }),
  )
  await step(9600, 'Create a window in the shared data', () =>
    controllers[0]!.dispatch({ type: 'create-window' }),
  )
  const player = createDemoPlayer<Checkpoint>(
    frames,
    restore,
    {
      now: () => performance.now(),
      schedule: (callback, delay) => {
        const timer = setTimeout(callback, delay)
        return () => clearTimeout(timer)
      },
    },
    structuredClone,
  )
  return {
    resources,
    controllers,
    player,
    steps: frames.map(({ at, title }) => ({ at, title })),
    getCue: () => cue,
    reset: () => {
      player.pause()
      player.rewind()
    },
    dispose: () => {
      player.dispose()
      controllers.forEach((controller) => controller.cancel())
      backends.forEach((backend) => backend.dispose())
      preferences.forEach((resource) => resource.dispose())
    },
  }
}

export type Scenario = Awaited<ReturnType<typeof createScenario>>
