import { useBrowserStore } from '@extension/chrome/useBrowserStore'
import { BrowserTabItem } from '@extension/ui/BrowserTabItem'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useSelectionStore } from '../../../pages/tab-manager/src/selection/SelectionStore'
import type { BrowserTab } from '../../chrome/lib/tab/BrowserTab'
import type { BrowserWindow } from '../../chrome/lib/window/BrowserWindow'
import type { Meta, StoryObj } from '@storybook/react'
import type { ComponentType } from 'react'

const demoTabId = 43
const demoWindowId = 1

const demoTab = {
  id: demoTabId,
  windowId: demoWindowId,
  index: 0,
  title: 'Project notes',
  url: 'https://example.com/project-notes',
  status: 'complete',
  active: false,
  highlighted: false,
  pinned: false,
  audible: false,
  mutedInfo: { muted: false },
  groupId: -1,
  discarded: false,
  lifecycle: 'loaded',
} as BrowserTab

const demoWindow = {
  id: demoWindowId,
  focused: false,
  incognito: false,
  type: 'normal',
  state: 'normal',
} as BrowserWindow

const demoMessages: Record<string, string> = {
  batch_closeTabs: 'Close tab',
  batch_moveTabs: 'Move tab',
  batch_groupTabs: 'Group tab',
  batch_pinTabs: 'Pin tab',
  batch_duplicateTabs: 'Duplicate tab',
  batch_reloadTabs: 'Reload tab',
  batch_copyTabs: 'Copy tab',
  tabContextMenu_discardTab: 'Discard Tab',
  tabContextMenu_discardActiveTab: 'The active tab cannot be discarded.',
  tabContextMenu_alreadyDiscarded: 'This tab is already discarded.',
  toast_tabDiscarded: 'Tab discarded from memory',
  toast_tabDiscardFailed: 'Chrome could not discard this tab',
}

type DemoChrome = {
  tabs?: {
    discard?: (tabId: number) => Promise<chrome.tabs.Tab | undefined>
  }
  i18n?: {
    getUILanguage: () => string
    getMessage: (messageName: string) => string
  }
  runtime?: {
    getPlatformInfo: () => Promise<chrome.runtime.PlatformInfo>
  }
}

type ActionBarProps = {
  selectedWindowId: number
  openMenuRequest: number
}

const ManualTabDiscardDemo = () => {
  const [ActionBarComponent, setActionBarComponent] =
    useState<ComponentType<ActionBarProps> | null>(null)
  const [openMenuRequest, setOpenMenuRequest] = useState(0)
  const [queryClient] = useState(() => {
    const client = new QueryClient()
    client.setQueryData(['chrome.runtime.getPlatformInfo'], { os: 'linux' })
    return client
  })
  const tab = useBrowserStore((state) => state.tabById[demoTabId])

  useEffect(() => {
    let active = true
    useBrowserStore.setState({
      state: 'loaded',
      tabById: { [demoTabId]: demoTab },
      tabGroupById: {},
      windowById: { [demoWindowId]: demoWindow },
      windowIds: [demoWindowId],
      currentWindowId: demoWindowId,
      focusedWindowId: demoWindowId,
      selectedWindowId: demoWindowId,
    })
    useSelectionStore.setState({
      windowIds: new Set(),
      expandedWindowIds: new Set(),
      groupIds: new Set(),
      tabIds: new Set([demoTabId]),
      mode: 'default',
    })

    const chromeTarget = globalThis as unknown as { chrome?: DemoChrome }
    const previousChrome = chromeTarget.chrome
    const fakeDiscard = async (tabId: number) => {
      const currentTab = useBrowserStore.getState().tabById[tabId]
      if (!currentTab || currentTab.active || currentTab.discarded) {
        return undefined
      }
      useBrowserStore.getState().updateTabById(tabId, {
        discarded: true,
        lifecycle: 'loaded',
        status: 'unloaded',
      })
      return {
        ...currentTab,
        discarded: true,
        status: 'unloaded',
      } as chrome.tabs.Tab
    }
    chromeTarget.chrome = {
      ...previousChrome,
      tabs: { ...previousChrome?.tabs, discard: fakeDiscard },
      i18n: {
        getUILanguage: () => 'en',
        getMessage: (messageName) => demoMessages[messageName] ?? messageName,
      },
      runtime: {
        getPlatformInfo: async () =>
          ({ os: 'linux' }) as chrome.runtime.PlatformInfo,
      },
    }
    void import('../../../pages/tab-manager/src/action-bar/ActionBar').then(
      ({ ActionBar }) => {
        if (active) setActionBarComponent(() => ActionBar)
      },
    )

    return () => {
      active = false
      chromeTarget.chrome = previousChrome
      useBrowserStore.setState({
        state: 'initial',
        tabById: {},
        tabGroupById: {},
        windowById: {},
        windowIds: [],
        currentWindowId: undefined,
        focusedWindowId: undefined,
        selectedWindowId: undefined,
      })
      useSelectionStore.setState({
        windowIds: new Set(),
        expandedWindowIds: new Set(),
        groupIds: new Set(),
        tabIds: new Set(),
        mode: 'default',
      })
    }
  }, [])

  if (!ActionBarComponent || !tab) return null

  return (
    <QueryClientProvider client={queryClient}>
      <div className="mx-auto w-[420px] max-w-full">
        <p className="text-muted mb-3 text-sm">
          Right-click the tab to open its action menu. Discarding updates this
          demo locally; clicking the tab simulates activation.
        </p>
        <div className="bg-background border-border rounded-lg border">
          <BrowserTabItem
            tabId={tab.id}
            title={tab.title ?? 'Untitled'}
            url={tab.url}
            favicon={<span aria-hidden="true">📄</span>}
            selected
            active={tab.active}
            discarded={tab.discarded}
            onClick={() => {
              useBrowserStore.getState().updateTabById(demoTabId, {
                active: true,
                discarded: false,
                lifecycle: 'loading',
                status: 'loading',
              })
            }}
            onContextMenu={(event) => {
              event.preventDefault()
              useSelectionStore.setState({
                windowIds: new Set(),
                expandedWindowIds: new Set(),
                groupIds: new Set(),
                tabIds: new Set([demoTabId]),
              })
              setOpenMenuRequest((request) => request + 1)
            }}
          />
          <ActionBarComponent
            selectedWindowId={demoWindowId}
            openMenuRequest={openMenuRequest}
          />
        </div>
        <p className="text-muted mt-3 text-xs">
          Chrome reloads a discarded tab when you activate it.
        </p>
      </div>
    </QueryClientProvider>
  )
}

const meta = {
  title: 'Tab Manager/Manual tab discard',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta

export const ContextMenu: StoryObj<typeof meta> = {
  render: () => <ManualTabDiscardDemo />,
}
