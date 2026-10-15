import { createTabbyViews } from '@extension/app'
import { defaultPreferences, reduceSelectionIntent } from '@extension/core'
import {
  createFixtureBuilder,
  createMemoryPreferences,
  MemoryBackend,
  memorySceneTime,
} from '@extension/demo'
import type { OmnibarViewState, TabManagerViewState } from '@extension/app'
import type {
  BrowserSnapshot,
  OmnibarResult,
  PreferenceState,
} from '@extension/core'
import type { TimelineFrame } from '@extension/demo/player'

const favicon = (letter: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" rx="5" fill="${color}"/><text x="12" y="17" text-anchor="middle" fill="white" font-size="15" font-family="sans-serif">${letter}</text></svg>`)}`

export const createMarketingScene = () => {
  const f = createFixtureBuilder({ seed: 'marketing', now: memorySceneTime })
  const tab = (
    id: number,
    title: string,
    url: string,
    color: string,
    extra = {},
  ) =>
    f.generateTab({
      id,
      title,
      url,
      faviconUrl: favicon(title[0]!, color),
      lastAccessed: memorySceneTime - 120_000,
      ...extra,
    })
  return f.generateScene({
    windows: [
      f.generateWindow({
        id: 1,
        focused: true,
        groups: [
          f.generateGroup({
            id: 101,
            title: 'Design project',
            color: 'purple',
          }),
        ],
        tabs: [
          tab(
            11,
            'Design system',
            'https://figma.com/design/system',
            '#a855b1',
            { active: true, groupId: 101 },
          ),
          tab(
            12,
            'Project brief',
            'https://notion.so/project-brief',
            '#df844b',
            { groupId: 101 },
          ),
          tab(
            13,
            'Inspiration board',
            'https://pinterest.com/inspiration',
            '#c75564',
            { groupId: 101 },
          ),
          tab(
            14,
            'Team inbox',
            'https://mail.google.com/mail/inbox',
            '#4b8eab',
          ),
          tab(
            15,
            'Launch checklist',
            'https://docs.google.com/document/launch',
            '#628457',
          ),
          tab(
            16,
            'Customer feedback',
            'https://linear.app/team/feedback',
            '#7773b1',
          ),
          tab(
            17,
            'A little background music',
            'https://open.spotify.com',
            '#528567',
            { audible: true },
          ),
        ],
      }),
      f.generateWindow({
        id: 2,
        tabs: [
          tab(
            21,
            'Weekend in Copenhagen',
            'https://visitcopenhagen.com',
            '#cc8654',
            { active: true },
          ),
          tab(22, 'Places to stay', 'https://airbnb.com', '#c75564'),
          tab(23, 'Coffee spots', 'https://maps.google.com', '#628457'),
        ],
      }),
      f.generateWindow({
        id: 3,
        tabs: [
          tab(31, 'The creative act', 'https://read.amazon.com', '#a855b1', {
            active: true,
          }),
          tab(
            32,
            'A better design process',
            'https://alistapart.com',
            '#4b8eab',
          ),
        ],
      }),
    ],
  })
}

export const searchExamples: OmnibarResult[] = [
  {
    id: 'design-bookmark',
    type: 'bookmark',
    title: 'Design references',
    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
    favIconUrl: favicon('D', '#a855b1'),
    action: {
      kind: 'url',
      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
    },
  },
  {
    id: 'design-history',
    type: 'history',
    title: 'Design review notes',
    url: 'https://docs.google.com/document/design-review',
    favIconUrl: favicon('D', '#4b8eab'),
    lastVisitTime: memorySceneTime - 3600_000,
    action: {
      kind: 'url',
      url: 'https://docs.google.com/document/design-review',
    },
  },
  {
    id: 'closed-design',
    type: 'recently-closed',
    title: 'Design palette exploration',
    url: 'https://figma.com/file/colors',
    favIconUrl: favicon('D', '#628457'),
    sessionId: 'demo-closed',
    action: { kind: 'restore', sessionId: 'demo-closed' },
  },
]

export type ShowcaseState = {
  browser: BrowserSnapshot
  manager: TabManagerViewState
  search: OmnibarViewState
  preferences: PreferenceState
  experience: 'manager' | 'search'
}

export const createMarketingDemo = (theme: 'light' | 'dark') => {
  const scene = createMarketingScene()
  const backend = new MemoryBackend(scene)
  const views = createTabbyViews()
  const selectTabs = (ids: number[]) =>
    ids.reduce(
      (selection, id, index) =>
        reduceSelectionIntent(
          selection,
          {
            type: 'click',
            item: { type: 'tab', id },
            pane: 'tab',
            shift: false,
            toggle: index > 0,
            orderedItems: [],
          },
          scene,
        ),
      views.tabManager.getState().selection,
    )
  views.tabManager.setState({
    viewedWindowId: 1,
    sidebarExpanded: false,
    selection: selectTabs([scene.tabs[0]!.id]),
  })
  const preferences = createMemoryPreferences({
    theme,
    themeLightAccent: 'orange',
    themeDarkAccent: 'violet',
  })
  const initial: ShowcaseState = {
    browser: scene,
    manager: structuredClone(views.tabManager.getState()),
    search: {
      ...structuredClone(views.omnibar.getState()),
      query: 'design',
      edited: true,
      externalResults: searchExamples,
      resultsQuery: 'design',
      selectedIndex: 1,
    },
    preferences: { ...preferences.getSnapshot() },
    experience: 'manager',
  }
  views.omnibar.setState(initial.search)
  const selected = structuredClone(initial)
  selected.manager.scrollTop = 190
  selected.manager.selection = selectTabs([14, 15, 16])
  const grouped = structuredClone(initial)
  grouped.manager.scrollTop = 180
  grouped.browser = {
    ...scene,
    groups: [
      ...scene.groups,
      {
        id: 102,
        windowId: 1,
        title: 'Launch',
        color: 'green',
        collapsed: false,
      },
    ],
    tabs: scene.tabs.map((tab) =>
      [14, 15, 16].includes(tab.id) ? { ...tab, groupId: 102 } : tab,
    ),
  }
  const frames: TimelineFrame<ShowcaseState>[] = [
    { at: 0, title: 'All your windows, in one place', state: initial },
    { at: 2600, title: 'Select three tabs together', state: selected },
    { at: 5200, title: 'Give that project a home', state: grouped },
    {
      at: 7800,
      title: 'Find tabs, bookmarks, and history',
      state: { ...grouped, experience: 'search' },
    },
    {
      at: 10400,
      title: 'Choose a look that feels like you',
      state: {
        ...grouped,
        preferences: {
          ...defaultPreferences,
          theme: theme === 'light' ? 'dark' : 'light',
          themeDarkAccent: 'violet',
          themeLightAccent: 'teal',
        },
      },
    },
    { at: 13000, title: 'A little order. Back to your day.', state: grouped },
  ]
  const restore = (state: ShowcaseState) => {
    backend.restoreSnapshot(state.browser)
    views.tabManager.setState(state.manager)
    views.omnibar.setState(state.search)
    preferences.restoreSnapshot(state.preferences)
  }
  return { backend, views, preferences, frames, restore, initial }
}
