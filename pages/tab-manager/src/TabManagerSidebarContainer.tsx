import { useWindowActions } from './hooks/useWindowActions'
import {
  useBrowserWindows,
  useCurrentBrowserWindow,
  useBrowserTabsByWindowId,
  createBrowserWindow,
} from '@extension/chrome'
import { usePreferenceStorage } from '@extension/shared'
import { preferenceStorage } from '@extension/storage'
import {
  TabManagerSidebar,
  WindowRailItem,
  SidebarAction,
  SearchIcon,
  SettingsIcon,
  ScrollToActiveIcon,
  PlusIcon,
  WindowContextMenu,
} from '@extension/ui'
import type { BrowserWindow } from '@extension/chrome'

// Helper to get active tab url
const useDisplayTabUrl = (windowId: number) => {
  const { tabManagerCompactIconMode } = usePreferenceStorage()
  const tabs = useBrowserTabsByWindowId(windowId)
  const activeTab = tabs.find((tab) => tab.active)
  const firstTab = tabs[0]

  if (tabManagerCompactIconMode === 'active') {
    return activeTab?.url
  }
  return firstTab?.url
}

// Component for Window Item to use hook
const WindowItemContainer = ({
  window,
  isCurrent,
  isSelected,
  isExpanded,
  onSelect,
}: {
  window: BrowserWindow
  isCurrent: boolean
  isSelected: boolean
  isExpanded: boolean
  onSelect: (window: BrowserWindow) => void
}) => {
  const displayTabUrl = useDisplayTabUrl(window.id)
  const tabs = useBrowserTabsByWindowId(window.id)
  const activeTab = tabs.find((tab) => tab.active)
  const title = activeTab?.title || `Window ${window.id}`

  const hasAudibleTabs = tabs.some((t) => t.audible)
  const hasMutedTabs = tabs.some((t) => t.mutedInfo?.muted)

  const actions = useWindowActions(window, tabs)

  return (
    <WindowContextMenu
      window={window}
      tabCount={tabs.length}
      hasAudibleTabs={hasAudibleTabs}
      hasMutedTabs={hasMutedTabs}
      isCurrent={isCurrent}
      onFocus={actions.focus}
      onMuteAll={actions.muteAll}
      onUnmuteAll={actions.unmuteAll}
      onReloadAll={actions.reloadAll}
      onCopyAllUrls={actions.copyAllUrls}
      onClose={actions.close}
    >
      <WindowRailItem
        id={window.id}
        title={title}
        activeTabUrl={displayTabUrl}
        tabCount={tabs.length}
        isActive={isCurrent}
        isSelected={isSelected}
        isExpanded={isExpanded}
        onClick={() => onSelect(window)}
        onClose={actions.close}
      />
    </WindowContextMenu>
  )
}

export const TabManagerSidebarContainer = ({
  selectedWindowId,
  onSelectWindow,
  onOpenSearch,
  onOpenSettings,
  onOpenTarget,
}: {
  selectedWindowId?: number
  onSelectWindow: (window: BrowserWindow) => void
  onOpenSearch: () => void
  onOpenSettings: () => void
  onOpenTarget: () => void
}) => {
  const browserWindows = useBrowserWindows()
  const currentBrowserWindow = useCurrentBrowserWindow()
  const { tabManagerCompactLayout } = usePreferenceStorage()

  const isExpanded = tabManagerCompactLayout === 'list'
  const toggleExpand = () =>
    preferenceStorage.set((prev) => ({
      ...prev,
      tabManagerCompactLayout: isExpanded ? 'icon' : 'list',
    }))

  const openNewWindow = async () => {
    if (!currentBrowserWindow) {
      await createBrowserWindow()
      return
    }
    const newWindow = await createBrowserWindow({
      height: currentBrowserWindow.height,
      incognito: currentBrowserWindow.incognito,
      left: currentBrowserWindow.left,
      state: currentBrowserWindow.state,
      top: currentBrowserWindow.top,
      width: currentBrowserWindow.width,
    })
    if (newWindow) {
      chrome.sidePanel.open({ windowId: newWindow.id })
    }
  }

  const windowList = (
    <>
      {browserWindows.map((window) => (
        <WindowItemContainer
          key={window.id}
          window={window}
          isCurrent={window.id === currentBrowserWindow?.id}
          isSelected={window.id === selectedWindowId}
          isExpanded={isExpanded}
          onSelect={onSelectWindow}
        />
      ))}
    </>
  )

  const actions = (
    <>
      <SidebarAction
        icon={<PlusIcon className="size-5" />}
        label="New Window"
        onClick={openNewWindow}
        isExpanded={isExpanded}
      />
      <SidebarAction
        icon={<ScrollToActiveIcon className="size-5" />}
        label="Scroll to active"
        onClick={onOpenTarget}
        isExpanded={isExpanded}
      />
      <SidebarAction
        icon={<SearchIcon className="size-5" />}
        label="Search"
        onClick={onOpenSearch}
        isExpanded={isExpanded}
      />
      <SidebarAction
        icon={<SettingsIcon className="size-5" />}
        label="Settings"
        onClick={onOpenSettings}
        isExpanded={isExpanded}
      />
    </>
  )

  return (
    <TabManagerSidebar
      isExpanded={isExpanded}
      onToggleExpand={toggleExpand}
      windowList={windowList}
      actions={actions}
      windowCount={browserWindows.length}
    />
  )
}
