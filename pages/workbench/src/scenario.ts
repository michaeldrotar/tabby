import {
  createOmnibarView,
  createOptionsView,
  createTabManagerController,
  createTabManagerView,
} from '@extension/app'
import {
  createMemoryOmnibarResource,
  createMemoryOptionsResource,
  createMemoryPreferences,
  createMemoryScene,
  deserializeDemoState,
  MemoryBackend,
  memorySceneTime,
  serializeDemoState,
} from '@extension/demo'
import { createDemoPlayer } from '@extension/demo/player'
import { createStore } from 'zustand/vanilla'
import logoUrl from '../../../chrome-extension/public/tabby-face.png?url'
import type {
  OmnibarViewState,
  OptionsViewState,
  TabbyResources,
  TabManagerResources,
  TabManagerViewState,
} from '@extension/app'
import type { PreferenceState } from '@extension/core'
import type { MemoryCheckpoint, MemoryScenePreset } from '@extension/demo'
import type { TimelineFrame } from '@extension/demo/player'
import type { TabManagerItem } from '@extension/ui/tab-manager/TabManager'

export type Sharing = 'none' | 'data' | 'all'
export type Dataset = MemoryScenePreset
export type Product = 'manager' | 'omnibar' | 'options'
export type NavigationState = { product: Product; notice: string | null }
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
  omnibarViews: OmnibarViewState[]
  optionsViews: OptionsViewState[]
  navigation: NavigationState[]
  savedQueries: string[]
}

const baselineTime = memorySceneTime
export const createScenario = async (
  sharing: Sharing,
  sharePreferences: boolean,
  ignoreCommands = false,
  dataset: Dataset = 'standard',
) => {
  let now = baselineTime
  let clockRunning = false
  let clockOrigin = performance.now()
  let cue: Cue = null
  const environment = {
    now: () => now + (clockRunning ? performance.now() - clockOrigin : 0),
    systemTheme: 'light' as const,
    schedule: (callback: () => void, delay: number) => {
      const timer = setTimeout(callback, delay)
      return () => clearTimeout(timer)
    },
  }
  const leftBackend = new MemoryBackend(
    createMemoryScene(dataset, { variant: 'left' }),
    {
      commands: ignoreCommands ? 'ignore' : 'apply',
    },
  )
  const rightBackend =
    sharing === 'none'
      ? new MemoryBackend(createMemoryScene(dataset, { variant: 'right' }), {
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
  const leftNavigation = createStore<NavigationState>(() => ({
    product: 'manager',
    notice: null,
  }))
  const rightNavigation =
    sharing === 'all'
      ? leftNavigation
      : createStore<NavigationState>(() => ({
          product: 'manager',
          notice: null,
        }))
  const navigation = [leftNavigation, rightNavigation]
  const resources: TabManagerResources[] = [
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
  resources.forEach((resource, index) => {
    const local = navigation[index]!
    resource.host = {
      getCurrentWindowId: () => 1,
      openSearch: () => local.setState({ product: 'omnibar' }),
      openOptions: () => local.setState({ product: 'options' }),
      writeClipboardText: async (text) => {
        local.setState({
          notice: `Copied ${text.split('\n').length} links to the demo clipboard`,
        })
      },
    }
  })
  const leftOmnibarView = createOmnibarView()
  const leftOptionsView = createOptionsView()
  const omnibarViews = [
    leftOmnibarView,
    sharing === 'all' ? leftOmnibarView : createOmnibarView(),
  ]
  const optionsViews = [
    leftOptionsView,
    sharing === 'all' ? leftOptionsView : createOptionsView(),
  ]
  const omnibarResources = resources.map((resource, index) =>
    createMemoryOmnibarResource(resource.backend, {
      originalWindowId: 1,
      commands: ignoreCommands ? 'ignore' : 'apply',
      openTabManagerShortcut: 'Alt+T',
      onTabManager: () => navigation[index]!.setState({ product: 'manager' }),
      onOptions: () => navigation[index]!.setState({ product: 'options' }),
      results: [
        {
          id: 'bookmark-tabby',
          type: 'bookmark',
          title: 'Tabby documentation',
          url: 'https://tabby.app/docs',
          action: { kind: 'url', url: 'https://tabby.app/docs' },
        },
        {
          id: 'history-tabby',
          type: 'history',
          title: 'Tabby architecture guide',
          url: 'https://tabby.app/architecture',
          lastVisitTime: baselineTime - 3600000,
          action: { kind: 'url', url: 'https://tabby.app/architecture' },
        },
        {
          id: 'closed-guide',
          type: 'recently-closed',
          title: 'Closed research guide',
          url: 'https://tabby.app/guide',
          sessionId: 'demo-guide',
          action: { kind: 'restore', sessionId: 'demo-guide' },
        },
      ],
    }),
  )
  const optionsResources = navigation.map((local) =>
    createMemoryOptionsResource(
      {
        logoUrl,
        shortcuts: {
          'open-omnibar': 'Alt+E',
          'open-tab-manager': 'Alt+T',
          'focus-window-01': 'Alt+1',
        },
      },
      {
        openShortcutsSettings: async () => {
          local.setState({
            notice: 'Shortcut settings opened in the demo host',
          })
        },
        openSidePanelSettings: async () => {
          local.setState({
            notice: 'Appearance settings opened in the demo host',
          })
        },
      },
    ),
  )
  const providerResources: TabbyResources[] = resources.map(
    (resource, index) => ({
      backend: resource.backend,
      preferences: resource.preferences,
      environment: resource.environment,
      host: resource.host,
      omnibar: omnibarResources[index]!,
      options: optionsResources[index]!,
      views: {
        tabManager: resource.view,
        omnibar: omnibarViews[index]!,
        options: optionsViews[index]!,
      },
    }),
  )
  const uniqueOmnibarViews = [...new Set(omnibarViews)]
  const uniqueOptionsViews = [...new Set(optionsViews)]
  const uniqueNavigation = [...new Set(navigation)]
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
    omnibarViews: uniqueOmnibarViews.map((view) =>
      structuredClone(view.getState()),
    ),
    optionsViews: uniqueOptionsViews.map((view) =>
      structuredClone(view.getState()),
    ),
    navigation: uniqueNavigation.map((view) =>
      structuredClone(view.getState()),
    ),
    savedQueries: omnibarResources.map((resource) => resource.getSavedQuery()),
  })
  const restore = (checkpoint: Checkpoint) => {
    if (checkpoint.sceneVersion !== 1)
      throw new Error('Unsupported Tab Manager tutorial version.')
    controllers.forEach((controller) => controller.cancel())
    now = checkpoint.now
    clockOrigin = performance.now()
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
    uniqueOmnibarViews.forEach((view, index) =>
      view.setState(structuredClone(checkpoint.omnibarViews[index]!), true),
    )
    uniqueOptionsViews.forEach((view, index) =>
      view.setState(structuredClone(checkpoint.optionsViews[index]!), true),
    )
    uniqueNavigation.forEach((view, index) =>
      view.setState(structuredClone(checkpoint.navigation[index]!), true),
    )
    omnibarResources.forEach((resource, index) =>
      resource.restoreSavedQuery(checkpoint.savedQueries[index]!),
    )
  }
  await Promise.all(
    [...backends, ...omnibarResources, ...optionsResources, ...preferences].map(
      (resource) => resource.start(),
    ),
  )
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
  const otherWindow = leftBackend
    .getSnapshot()
    .windows.find((window) => window.id !== leftView.getState().viewedWindowId)
  await step(
    8400,
    otherWindow
      ? 'Open another window in this view'
      : 'Inspect the current window',
    () => {
      if (otherWindow)
        return controllers[0]!.dispatch({
          type: 'view-window',
          windowId: otherWindow.id,
        })
    },
  )
  await step(9600, 'Create a window in the shared data', () =>
    controllers[0]!.dispatch({ type: 'create-window' }),
  )
  await step(11200, 'Search the same browser data in Omnibar', () =>
    leftNavigation.setState({ product: 'omnibar' }),
  )
  await step(
    13200,
    'Find tabs, bookmarks, and history',
    async () => {
      leftOmnibarView.setState({
        query: 'Tabby',
        edited: true,
        resultsQuery: 'Tabby',
        externalResults: await omnibarResources[0]!.search('Tabby'),
      })
      await omnibarResources[0]!.saveQuery('Tabby')
    },
    { kind: 'keyboard', item: { type: 'tab', id: 11 }, label: 'Type Tabby' },
  )
  await step(
    15200,
    'Open a result as a new tab',
    async () => {
      await omnibarResources[0]!.execute(
        { kind: 'url', url: 'https://tabby.app/docs' },
        'new-tab',
      )
      leftNavigation.setState({ product: 'manager' })
    },
    {
      kind: 'keyboard',
      item: { type: 'window', id: 1 },
      label: 'Ctrl + Enter',
    },
  )
  await step(17200, 'Open the reusable Options page', () =>
    leftNavigation.setState({ product: 'options' }),
  )
  await step(19200, 'Change the shared appearance preferences', () =>
    leftPreferences.set({ themeLightAccent: 'rose', themeDarkAccent: 'rose' }),
  )
  await step(21200, 'Return to the updated Tab Manager', () =>
    leftNavigation.setState({ product: 'manager' }),
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
    (state) => deserializeDemoState<Checkpoint>(serializeDemoState(state)),
  )
  return {
    setInputMode: (mode: 'live' | 'scripted' | 'static') => {
      if (clockRunning) now = environment.now()
      clockRunning = mode === 'live'
      clockOrigin = performance.now()
      if (!clockRunning)
        controllers.forEach((controller) => controller.cancel())
    },
    resources,
    providerResources,
    controllers,
    omnibarResources,
    omnibarViews,
    optionsResources,
    optionsViews,
    navigation,
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
      omnibarResources.forEach((resource) => resource.dispose())
      optionsResources.forEach((resource) => resource.dispose())
    },
  }
}

export type Scenario = Awaited<ReturnType<typeof createScenario>>
