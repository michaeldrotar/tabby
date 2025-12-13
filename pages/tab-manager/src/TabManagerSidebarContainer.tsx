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
  cn,
  SearchIcon,
  SettingsIcon,
  ScrollToActiveIcon,
  MoonIcon,
  PlusIcon,
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
  onClose,
}: {
  window: BrowserWindow
  isCurrent: boolean
  isSelected: boolean
  isExpanded: boolean
  onSelect: (window: BrowserWindow) => void
  onClose: () => void
}) => {
  const displayTabUrl = useDisplayTabUrl(window.id)
  const tabs = useBrowserTabsByWindowId(window.id)
  const activeTab = tabs.find((tab) => tab.active)
  const title = activeTab?.title || `Window ${window.id}`

  return (
    <WindowRailItem
      id={window.id}
      title={title}
      activeTabUrl={displayTabUrl}
      tabCount={tabs.length}
      isActive={isCurrent}
      isSelected={isSelected}
      isExpanded={isExpanded}
      onClick={() => onSelect(window)}
      onClose={onClose}
    />
  )
}

export const TabManagerSidebarContainer = ({
  selectedWindowId,
  onSelectWindow,
  onOpenSearch,
  onOpenSettings,
  onToggleTheme,
  onOpenTarget,
}: {
  selectedWindowId?: number
  onSelectWindow: (window: BrowserWindow) => void
  onOpenSearch: () => void
  onOpenSettings: () => void
  onToggleTheme: () => void
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

  const closeWindow = (windowId: number) => {
    chrome.windows.remove(windowId)
  }

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
          onClose={() => closeWindow(window.id)}
        />
      ))}
      <button
        onClick={openNewWindow}
        className={cn(
          'text-foreground hover:bg-muted/50 focus-visible:ring-ring/30 focus-visible:ring-offset-background group mt-2 flex w-full items-center gap-3 rounded-md p-2 transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        )}
        title="New Window"
        aria-label="New Window"
      >
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
          <PlusIcon className="size-5" />
        </div>
        <div
          className={cn(
            'overflow-hidden whitespace-nowrap text-left text-sm transition-all duration-300',
            isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0',
          )}
        >
          New Window
        </div>
      </button>
    </>
  )

  const actions = (
    <>
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
      <SidebarAction
        icon={<ScrollToActiveIcon className="size-5" />}
        label="Scroll to active"
        onClick={onOpenTarget}
        isExpanded={isExpanded}
      />
      <SidebarAction
        icon={<MoonIcon className="size-5" />}
        label="Theme"
        onClick={onToggleTheme}
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
