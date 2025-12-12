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
} from '@extension/ui'
import type { BrowserWindow } from '@extension/chrome'

// Icons
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)
const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const TargetIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)
const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
)

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
          'group mt-2 flex w-full items-center gap-3 rounded-md p-2 text-gray-700 transition-all hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
        )}
        title="New Window"
      >
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
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
        icon={<SearchIcon />}
        label="Search"
        onClick={onOpenSearch}
        isExpanded={isExpanded}
      />
      <SidebarAction
        icon={<SettingsIcon />}
        label="Settings"
        onClick={onOpenSettings}
        isExpanded={isExpanded}
      />
      <SidebarAction
        icon={<TargetIcon />}
        label="Scroll to active"
        onClick={onOpenTarget}
        isExpanded={isExpanded}
      />
      <SidebarAction
        icon={<MoonIcon />}
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
