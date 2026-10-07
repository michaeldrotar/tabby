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
const demoActiveTabId = 44
const demoPinnedTabId = 45
const demoTabIds = [demoTabId, demoActiveTabId, demoPinnedTabId]
const singleTabSelection = [demoTabId]
const multiTabSelection = [demoTabId, demoPinnedTabId]
const demoWindowId = 1

const demoTabs = [
  {
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
  },
  {
    id: demoActiveTabId,
    windowId: demoWindowId,
    index: 1,
    title: 'Release checklist',
    url: 'https://example.com/release-checklist',
    status: 'complete',
    active: true,
    highlighted: false,
    pinned: false,
    audible: false,
    mutedInfo: { muted: false },
    groupId: -1,
    discarded: false,
    lifecycle: 'loaded',
  },
  {
    id: demoPinnedTabId,
    windowId: demoWindowId,
    index: 2,
    title: 'Pinned reference',
    url: 'https://example.com/reference',
    status: 'complete',
    active: false,
    highlighted: false,
    pinned: true,
    audible: false,
    mutedInfo: { muted: false },
    groupId: -1,
    discarded: false,
    lifecycle: 'loaded',
  },
] as BrowserTab[]

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
  batch_discardTabs: 'Discard tab',
  batch_discardNoEligibleTabs:
    'All selected tabs are active or already discarded.',
  batch_copyTabs: 'Copy tab',
  tabContextMenu_discardTab: 'Discard Tab',
  tabContextMenu_discardOtherTabs: 'Discard Other Tabs',
  tabContextMenu_noOtherDiscardableTabs: 'No other tabs can be discarded.',
  tabContextMenu_discardActiveTab: 'The active tab cannot be discarded.',
  tabContextMenu_alreadyDiscarded: 'This tab is already discarded.',
  toast_tabDiscarded: 'Tab discarded from memory',
  toast_tabDiscardFailed: 'Chrome could not discard this tab',
  toast_nTabsDiscarded: 'Tabs discarded from memory',
  toast_nTabsDiscarded_one: 'Tab discarded from memory',
  toast_batchDiscardSkipped: 'Tabs discarded or skipped',
  toast_batchDiscardPartial: 'Some tabs could not be discarded',
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

const ManualTabDiscardDemo = ({
  initialSelection = singleTabSelection,
  multiSelect = false,
}: {
  initialSelection?: number[]
  multiSelect?: boolean
}) => {
  const [ActionBarComponent, setActionBarComponent] =
    useState<ComponentType<ActionBarProps> | null>(null)
  const [openMenuRequest, setOpenMenuRequest] = useState(0)
  const [queryClient] = useState(() => {
    const client = new QueryClient()
    client.setQueryData(['chrome.runtime.getPlatformInfo'], { os: 'linux' })
    return client
  })
  const tabById = useBrowserStore((state) => state.tabById)
  const selectedTabIds = useSelectionStore((state) => state.tabIds)
  const tabs = demoTabIds.flatMap((id) => {
    const tab = tabById[id]
    return tab ? [tab] : []
  })

  useEffect(() => {
    let active = true
    useBrowserStore.setState({
      state: 'loaded',
      tabById: Object.fromEntries(demoTabs.map((tab) => [tab.id, tab])),
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
      tabIds: new Set(initialSelection),
      mode: initialSelection.length > 1 ? 'multi-select' : 'default',
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
  }, [initialSelection])

  if (!ActionBarComponent || tabs.length === 0) return null

  return (
    <QueryClientProvider client={queryClient}>
      <div className="mx-auto w-[420px] max-w-full">
        <p className="text-muted mb-3 text-sm">
          {multiSelect
            ? 'Two inactive tabs are selected. Open More actions to discard them together.'
            : 'Right-click a tab to open its action menu. Discarding updates this demo locally; clicking a tab simulates activation.'}
        </p>
        <div className="bg-background border-border rounded-lg border">
          {tabs.map((tab) => (
            <BrowserTabItem
              key={tab.id}
              tabId={tab.id}
              title={tab.title ?? 'Untitled'}
              url={tab.url}
              favicon={<span aria-hidden="true">📄</span>}
              selected={selectedTabIds.has(tab.id)}
              active={tab.active}
              discarded={tab.discarded}
              pinned={tab.pinned}
              isMultiSelectMode={multiSelect}
              onClick={() => {
                for (const id of demoTabIds) {
                  useBrowserStore.getState().updateTabById(id, {
                    active: id === tab.id,
                    ...(id === tab.id
                      ? {
                          discarded: false,
                          lifecycle: 'loading',
                          status: 'loading',
                        }
                      : {}),
                  })
                }
              }}
              onContextMenu={(event) => {
                event.preventDefault()
                useSelectionStore.setState({
                  windowIds: new Set(),
                  expandedWindowIds: new Set(),
                  groupIds: new Set(),
                  tabIds: new Set([tab.id]),
                  mode: 'default',
                })
                setOpenMenuRequest((request) => request + 1)
              }}
            />
          ))}
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

export const MultiSelect: StoryObj<typeof meta> = {
  render: () => (
    <ManualTabDiscardDemo initialSelection={multiTabSelection} multiSelect />
  ),
}
