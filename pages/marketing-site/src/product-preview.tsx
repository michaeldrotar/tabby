import '@extension/ui/base.css'
import './product-preview.css'
import { BrowserTabList } from '@extension/ui/BrowserTabList'
import { SearchIcon, SettingsIcon } from '@extension/ui/icons'
import { Omnibar } from '@extension/ui/omnibar/Omnibar'
import { SidebarAction } from '@extension/ui/tab-manager/ui/SidebarAction'
import { TabManagerShell } from '@extension/ui/tab-manager/ui/TabManagerShell'
import { TabManagerSidebar } from '@extension/ui/tab-manager/ui/TabManagerSidebar'
import { WindowRailItem } from '@extension/ui/tab-manager/ui/WindowRailItem'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import messages from '../../../packages/i18n/locales/en/messages.json'
import browserFixture from '../../../scripts/preview/browser-data.json'
import type { BrowserTabListItemData } from '@extension/ui/BrowserTabList'
import type { OmnibarResultGenerators } from '@extension/ui/omnibar/Omnibar'
import type { OmnibarSearchResult } from '@extension/ui/omnibar/OmnibarSearchResult'

type DemoTab = {
  id: string
  title: string
  url: string
  faviconColor: string
  active?: boolean
}

type DemoWindow = {
  id: number
  title: string
  subtitle: string
  tabs: BrowserTabListItemData[]
}

const favicon = (color: string) => (
  <span
    aria-hidden="true"
    className="demo-favicon"
    style={{ backgroundColor: color }}
  />
)

const createTab = (tab: DemoTab) => ({
  id: tab.id,
  title: tab.title,
  url: tab.url,
  active: tab.active,
  favicon: favicon(tab.faviconColor),
})

const DEMO_WINDOWS: DemoWindow[] = [
  {
    id: 1,
    title: 'Design work',
    subtitle: '5 tabs',
    tabs: [
      {
        type: 'group',
        group: {
          id: 'design-group',
          title: 'Website refresh',
          color: 'purple',
          active: true,
        },
        tabs: [
          createTab({
            id: 'figma',
            title: 'Tabby website · Figma',
            url: 'https://figma.com/design/tabby-site',
            faviconColor: '#8b5cf6',
            active: true,
          }),
          createTab({
            id: 'copy',
            title: 'Launch copy · Notion',
            url: 'https://notion.so/tabby/launch-copy',
            faviconColor: '#222222',
          }),
          createTab({
            id: 'issues',
            title: 'Open design issues · GitHub',
            url: 'https://github.com/michaeldrotar/tabby/issues',
            faviconColor: '#373737',
          }),
        ],
      },
      {
        type: 'tab',
        tab: createTab({
          id: 'components',
          title: 'Component library · Storybook',
          url: 'https://storybook.js.org/',
          faviconColor: '#ff4785',
        }),
      },
      {
        type: 'tab',
        tab: createTab({
          id: 'accessibility',
          title: 'Accessibility checklist · Linear',
          url: 'https://linear.app/',
          faviconColor: '#5e6ad2',
        }),
      },
    ],
  },
  {
    id: 2,
    title: 'Research',
    subtitle: '3 tabs',
    tabs: [
      {
        type: 'tab',
        tab: createTab({
          id: 'docs',
          title: 'Keyboard navigation · MDN',
          url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility',
          faviconColor: '#202020',
          active: true,
        }),
      },
      {
        type: 'tab',
        tab: createTab({
          id: 'react',
          title: 'React documentation',
          url: 'https://react.dev/',
          faviconColor: '#58c4dc',
        }),
      },
      {
        type: 'tab',
        tab: createTab({
          id: 'vite',
          title: 'Vite guide',
          url: 'https://vite.dev/guide/',
          faviconColor: '#8b5cf6',
        }),
      },
    ],
  },
  {
    id: 3,
    title: 'Personal',
    subtitle: '3 tabs',
    tabs: [
      {
        type: 'tab',
        tab: createTab({
          id: 'calendar',
          title: 'Calendar',
          url: 'https://calendar.google.com/',
          faviconColor: '#4285f4',
          active: true,
        }),
      },
      {
        type: 'tab',
        tab: createTab({
          id: 'recipes',
          title: 'Saved recipes · Pinterest',
          url: 'https://pinterest.com/',
          faviconColor: '#e60023',
        }),
      },
      {
        type: 'tab',
        tab: createTab({
          id: 'music',
          title: 'Focus playlist · YouTube',
          url: 'https://youtube.com/',
          faviconColor: '#ff0000',
        }),
      },
    ],
  },
]

const noop = () => {}

const TabManagerPreview = () => {
  const [activeWindowId, setActiveWindowId] = useState(1)
  const [isExpanded, setIsExpanded] = useState(() => window.innerWidth >= 600)
  const [isGroupCollapsed, setIsGroupCollapsed] = useState(false)
  const [selectedTabIds, setSelectedTabIds] = useState<Set<string>>(
    () => new Set(['figma', 'copy']),
  )
  const activeWindow =
    DEMO_WINDOWS.find((demoWindow) => demoWindow.id === activeWindowId) ??
    DEMO_WINDOWS[0]!

  const windows = DEMO_WINDOWS.map((demoWindow) => (
    <WindowRailItem
      key={demoWindow.id}
      id={demoWindow.id}
      title={demoWindow.title}
      subtitle={demoWindow.subtitle}
      icon={
        <span
          aria-hidden="true"
          className={`
            demo-window-mark
            demo-window-mark-${demoWindow.id}
          `}
        />
      }
      isActive={demoWindow.id === 1}
      isViewing={demoWindow.id === activeWindowId}
      isExpanded={isExpanded}
      onClick={() => {
        setActiveWindowId(demoWindow.id)
        setSelectedTabIds(new Set())
        setIsGroupCollapsed(false)
      }}
    />
  ))

  return (
    <TabManagerShell
      className="product-manager-shell"
      selectionMode="multi-select"
      sidebar={
        <TabManagerSidebar
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded((expanded) => !expanded)}
          collapseSidebarLabel="Collapse sidebar"
          expandSidebarLabel="Expand sidebar"
          windowCount={DEMO_WINDOWS.length}
          windowList={windows}
          actions={
            <>
              <SidebarAction
                icon={<SearchIcon className="size-5" />}
                label="Search everything"
                isExpanded={isExpanded}
                onClick={noop}
              />
              <SidebarAction
                icon={<SettingsIcon className="size-5" />}
                label="Settings"
                isExpanded={isExpanded}
                onClick={noop}
              />
            </>
          }
        />
      }
      actionBar={
        <div className="preview-action-bar">
          <span>{selectedTabIds.size} tabs selected</span>
          <div aria-hidden="true" className="preview-action-list">
            <span>Move</span>
            <span>Group</span>
            <span>Close</span>
          </div>
        </div>
      }
    >
      <div className="preview-pane-header">
        <div>
          <strong>{activeWindow.title}</strong>
          <span>{activeWindow.subtitle}</span>
        </div>
        <span className="preview-view-label">All windows</span>
      </div>
      <BrowserTabList
        className="preview-tab-list"
        items={activeWindow.tabs.map((item) =>
          item.type === 'group' && item.group.id === 'design-group'
            ? {
                ...item,
                group: { ...item.group, collapsed: isGroupCollapsed },
              }
            : item,
        )}
        selectedTabIds={selectedTabIds}
        isMultiSelectMode
        onTabClick={(tab) => setSelectedTabIds(new Set([String(tab.id)]))}
        onGroupToggleCollapse={() =>
          setIsGroupCollapsed((collapsed) => !collapsed)
        }
      />
    </TabManagerShell>
  )
}

const SEARCH_TABS: OmnibarSearchResult[] = [
  {
    id: 'tabby-figma',
    type: 'tab',
    title: 'Tabby website · Figma',
    url: 'https://figma.com/design/tabby-site',
    windowId: 1,
    tabId: 101,
    active: true,
    execute: async () => {},
  },
  {
    id: 'tabby-components',
    type: 'tab',
    title: 'Component library · Storybook',
    url: 'https://storybook.js.org/',
    windowId: 1,
    tabId: 102,
    execute: async () => {},
  },
  {
    id: 'tabby-group',
    type: 'tab-group',
    title: 'Website refresh',
    groupColor: 'purple',
    groupTabCount: 3,
    groupWindowLabel: 'Design work',
    groupCollapsed: false,
    execute: async () => {},
  },
]

const SEARCH_EXTERNAL_RESULTS: OmnibarSearchResult[] = [
  {
    id: 'bookmark-design-notes',
    type: 'bookmark',
    title: 'Design notes · Notion',
    url: 'https://notion.so/tabby/design-notes',
    execute: async () => {},
  },
  {
    id: 'history-design-tokens',
    type: 'history',
    title: 'Design tokens and component patterns',
    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
    execute: async () => {},
  },
]

const getSearchTerms = (queryTerms: string[], item: OmnibarSearchResult) => {
  const searchable = `${item.title} ${item.url ?? ''}`.toLowerCase()
  return queryTerms.every((term) => searchable.includes(term))
}

const omnibarGenerators: OmnibarResultGenerators = {
  getGoogleSearchItem: (query) => ({
    id: `google:${query}`,
    type: 'search',
    title: `Search Google for "${query}"`,
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    execute: async () => {},
  }),
  getUrlNavigationItem: () => [],
  getMatchingCommands: () => [],
  getMatchingTabs: (tabs, queryTerms) =>
    tabs.filter((tab) => getSearchTerms(queryTerms, tab)),
  getMatchingTabGroups: (groups, queryTerms) =>
    groups.filter((group) => getSearchTerms(queryTerms, group)),
}

const searchExternalResults = async (query: string) => {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean)
  return SEARCH_EXTERNAL_RESULTS.filter((result) =>
    getSearchTerms(queryTerms, result),
  )
}

const SearchPreview = () => {
  return (
    <Omnibar
      className="preview-omnibar"
      focusInputOnOpen={false}
      tabs={SEARCH_TABS}
      groups={[]}
      onSearch={searchExternalResults}
      generators={omnibarGenerators}
      onDismiss={noop}
      isMac
    />
  )
}

const view = new URLSearchParams(window.location.search).get('view')

const renderProductPreview = async () => {
  if (view === 'search') {
    Object.defineProperty(globalThis, '__TABBY_PREVIEW__', {
      configurable: true,
      value: {
        browser: browserFixture,
        messages,
        platform: 'mac',
      },
    })
    // This is a side-effect-only browser script shared with the app preview.
    // @ts-expect-error The script intentionally has no module exports.
    await import('../../../scripts/preview/mock-chrome.js')
    await chrome.storage.local.set({ lastQuery: 'design' })
  }

  createRoot(document.getElementById('root')!).render(
    view === 'search' ? <SearchPreview /> : <TabManagerPreview />,
  )
}

void renderProductPreview()
