import {
  createTabbyViews,
  createTabManagerController,
  initializeTabManagerView,
} from '@extension/app'
import {
  createFixtureBuilder,
  createMemoryOmnibarResource,
  createMemoryOptionsResource,
  createMemoryPreferences,
  MemoryBackend,
  memorySceneTime,
} from '@extension/demo'
import { createDemoPlayer } from '@extension/demo/player'
import { createStore } from 'zustand/vanilla'
import type { TabbyResources } from '@extension/app'
import type { TimelineFrame } from '@extension/demo/player'

export type Product = 'manager' | 'search' | 'options'
export const storeUrl =
  'https://chromewebstore.google.com/detail/tabby/jjkakicjobpalhifpeaggabpgdllmmob'

const favicon = (letter: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" rx="6" fill="${color}"/><text x="12" y="17" text-anchor="middle" fill="white" font-family="sans-serif" font-size="15" font-weight="bold">${letter}</text></svg>`)}`

export const createShowcase = async () => {
  const fixture = createFixtureBuilder({
    seed: 'marketing',
    now: memorySceneTime,
  })
  const tab = (id: number, title: string, color: string, groupId?: number) =>
    fixture.generateTab({
      id,
      title,
      url: `https://example.com/${title.toLowerCase().replaceAll(' ', '-')}`,
      faviconUrl: favicon(title.charAt(0), color),
      groupId,
      active: id === 1 || id === 8,
      pinned: id === 1 || id === 2,
    })
  const backend = new MemoryBackend(
    fixture.generateScene({
      windows: [
        fixture.generateWindow({
          id: 1,
          focused: true,
          groups: [
            fixture.generateGroup({
              id: 1,
              title: 'Design project',
              color: 'orange',
            }),
          ],
          tabs: [
            tab(1, 'Inbox', '#d06048'),
            tab(2, 'Calendar', '#5281c5'),
            tab(3, 'Design brief', '#a16b47', 1),
            tab(4, 'Design inspiration', '#9872ab', 1),
            tab(5, 'Coffee grinder comparison', '#699177'),
            tab(6, 'Coffee grinder reviews', '#bf8550'),
            tab(7, 'Coffee grinder specifications', '#627f99'),
          ],
        }),
        fixture.generateWindow({
          id: 2,
          tabs: [
            tab(8, 'Weekend in Copenhagen', '#679090'),
            tab(9, 'Places to eat', '#b67c5b'),
          ],
        }),
      ],
    }),
  )
  const views = createTabbyViews()
  initializeTabManagerView(views.tabManager, backend.getSnapshot())
  views.tabManager.setState({
    sidebarExpanded: false,
    focusedItem: null,
    scrollToItem: null,
  })
  const preferences = createMemoryPreferences({ theme: 'light' })
  const navigation = createStore<{ product: Product; notice: string | null }>(
    () => ({ product: 'manager', notice: null }),
  )
  const open = (product: Product) =>
    navigation.setState({ product, notice: null })
  const omnibar = createMemoryOmnibarResource(backend, {
    originalWindowId: 1,
    openTabManagerShortcut: 'Alt+Shift+E',
    onTabManager: () => open('manager'),
    onOptions: () => open('options'),
    results: [
      {
        id: 'bookmark-design',
        type: 'bookmark',
        title: 'Design system handbook',
        url: 'https://example.com/design-handbook',
        action: { kind: 'url', url: 'https://example.com/design-handbook' },
      },
      {
        id: 'history-design',
        type: 'history',
        title: 'Designing a calmer workspace',
        url: 'https://example.com/design-workspace',
        lastVisitTime: memorySceneTime - 3600000,
        action: { kind: 'url', url: 'https://example.com/design-workspace' },
      },
      {
        id: 'closed-design',
        type: 'recently-closed',
        title: 'Design checklist',
        url: 'https://example.com/design-checklist',
        sessionId: 'design-checklist',
        action: { kind: 'restore', sessionId: 'design-checklist' },
      },
    ],
    getFaviconUrl: () => favicon('D', '#9872ab'),
  })
  const options = createMemoryOptionsResource(
    {
      logoUrl: '/tabby-face.png',
      shortcuts: {
        'open-omnibar': 'Alt+E',
        'open-tab-manager': 'Alt+Shift+E',
      },
    },
    {
      openShortcutsSettings: async () =>
        navigation.setState({
          notice:
            'In Chrome, assign your shortcuts on the Extensions → Keyboard shortcuts page.',
        }),
      openSidePanelSettings: async () =>
        navigation.setState({
          notice:
            'In Chrome, choose your side panel position in Settings → Appearance.',
        }),
    },
  )
  const environment = {
    now: () => memorySceneTime,
    systemTheme: 'light' as const,
    platform: 'other' as const,
  }
  const resources: TabbyResources = {
    backend,
    preferences,
    omnibar,
    options,
    views,
    environment,
    host: {
      openSearch: () => open('search'),
      openOptions: () => open('options'),
    },
  }
  const controller = createTabManagerController({
    backend,
    preferences,
    view: views.tabManager,
    environment,
    host: resources.host,
  })
  await Promise.all([
    backend.start(),
    preferences.start(),
    omnibar.start(),
    options.start(),
  ])
  const capture = () => ({
    backend: backend.capture(),
    manager: structuredClone(views.tabManager.getState()),
    search: structuredClone(views.omnibar.getState()),
    options: structuredClone(views.options.getState()),
    preferences: structuredClone(preferences.getSnapshot()),
    navigation: { ...navigation.getState() },
  })
  const restore = (state: ReturnType<typeof capture>) => {
    controller.cancel()
    backend.restore(state.backend)
    views.tabManager.setState(structuredClone(state.manager), true)
    views.omnibar.setState(structuredClone(state.search), true)
    views.options.setState(structuredClone(state.options), true)
    preferences.restoreSnapshot(state.preferences)
    navigation.setState({ ...state.navigation }, true)
    omnibar.restoreSavedQuery(state.search.query)
  }
  const frames: TimelineFrame<ReturnType<typeof capture>>[] = [
    { at: 0, title: 'A whole browser, in one clear view.', state: capture() },
  ]
  const step = async (
    at: number,
    title: string,
    action: () => void | Promise<void>,
  ) => {
    await action()
    controller.reconcile()
    frames.push({ at, title, state: capture() })
  }
  await step(
    2000,
    'Finished researching? Select those tabs together.',
    async () => {
      await controller.dispatch({
        type: 'select-item',
        item: { type: 'tab', id: 5 },
      })
      await controller.dispatch({
        type: 'select-item',
        item: { type: 'tab', id: 7 },
        shift: true,
      })
    },
  )
  await step(4000, 'One menu. Actions for the whole selection.', () =>
    controller.dispatch({ type: 'open-action-menu' }),
  )
  await step(6000, 'Close all three. Keep what you are working on.', () =>
    controller.dispatch({ type: 'close-selection' }),
  )
  await step(
    8000,
    'Find open tabs, bookmarks, history, and recently closed tabs.',
    async () => {
      open('search')
      views.omnibar.setState({
        query: 'design',
        edited: true,
        resultsQuery: 'design',
        externalResults: await omnibar.search('design'),
      })
    },
  )
  await step(
    11000,
    'Make it yours. Choose your colors and layout.',
    async () => {
      open('manager')
      await preferences.set({ theme: 'dark', themeDarkAccent: 'rose' })
    },
  )
  await step(14000, 'A little order. A lot more room to focus.', () => {})
  const player = createDemoPlayer<ReturnType<typeof capture>>(
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
    controller,
    navigation,
    player,
    reset: () => {
      player.pause()
      player.rewind()
    },
    open,
    dispose: () => {
      player.dispose()
      controller.cancel()
      backend.dispose()
      preferences.dispose()
      omnibar.dispose()
      options.dispose()
    },
  }
}
export type Showcase = Awaited<ReturnType<typeof createShowcase>>
