import { useBrowserTabsByWindowId } from '@extension/chrome/tab/useBrowserTabsByWindowId'
import { createBrowserWindow } from '@extension/chrome/window/createBrowserWindow'
import { useBrowserWindows } from '@extension/chrome/window/useBrowserWindows'
import { useCurrentBrowserWindow } from '@extension/chrome/window/useCurrentBrowserWindow'
import { getWindowSwitchSlotEntries } from '@extension/chrome/window/windowSwitchSlots'
import { t } from '@extension/i18n/i18n'
import { tt } from '@extension/i18n/plurals'
import { usePreferenceStorage } from '@extension/shared/hooks/preference'
import { preferenceStorage } from '@extension/storage/impl/preference-storage'
import { Favicon } from '@extension/ui/Favicon'
import {
  PlusIcon,
  ScrollToActiveIcon,
  SearchIcon,
  SettingsIcon,
} from '@extension/ui/icons'
import { SidebarAction } from '@extension/ui/tab-manager/ui/SidebarAction'
import { TabManagerSidebar } from '@extension/ui/tab-manager/ui/TabManagerSidebar'
import { WindowRailItem } from '@extension/ui/tab-manager/ui/WindowRailItem'
import { useCallback, useMemo } from 'react'
import { useBatchTabActions } from './actions/useBatchTabActions'
import { useWindowShortcutBindings } from './hooks/useWindowShortcutBindings'
import { useSelectionInteraction, useSelectionStore } from './selection'
import type { BrowserWindow } from '@extension/chrome/window/BrowserWindow'

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
  shortcutSlot,
  shortcutBinding,
  unassignedShortcutLabel,
  isCurrent,
  isViewing,
  isExpanded,
  selected,
  isMultiSelectMode,
  onSelect,
  onContextMenu,
  onClose,
}: {
  window: BrowserWindow
  shortcutSlot?: number
  shortcutBinding?: string
  unassignedShortcutLabel: string
  isCurrent: boolean
  isViewing: boolean
  isExpanded: boolean
  selected: boolean
  isMultiSelectMode: boolean
  onSelect: (window: BrowserWindow, event: React.MouseEvent) => void
  onContextMenu: (
    window: BrowserWindow,
    event: React.MouseEvent<HTMLDivElement>,
  ) => void
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
      icon={
        displayTabUrl ? (
          <Favicon pageUrl={displayTabUrl} size={24} />
        ) : undefined
      }
      subtitle={tt('nTabs', tabs.length)}
      isActive={isCurrent}
      isViewing={isViewing}
      isExpanded={isExpanded}
      selected={selected}
      isMultiSelectMode={isMultiSelectMode}
      shortcutSlot={shortcutSlot}
      shortcutBinding={shortcutBinding}
      unassignedShortcutLabel={unassignedShortcutLabel}
      onClick={(event) => onSelect(window, event)}
      onContextMenu={(event) => onContextMenu(window, event)}
      onClose={onClose}
    />
  )
}

export const TabManagerSidebarContainer = ({
  selectedWindowId,
  onSelectWindow,
  onOpenSearch,
  onOpenSettings,
  onOpenTarget,
  onOpenActionMenu,
}: {
  /**
   * The selected window ID, whose content is shown in the tab pane.
   * Should correspond to the first selected window.
   */
  selectedWindowId?: number
  onSelectWindow: (window: BrowserWindow) => void
  onOpenSearch: () => void
  onOpenSettings: () => void
  onOpenTarget: () => void
  onOpenActionMenu: () => void
}) => {
  const browserWindows = useBrowserWindows()
  const currentBrowserWindow = useCurrentBrowserWindow()
  const { tabManagerCompactLayout } = usePreferenceStorage()
  const shortcutBindings = useWindowShortcutBindings()
  const unassignedShortcutLabel = t('windowShortcut_unassigned')
  const windowSlots = useMemo(
    () =>
      getWindowSwitchSlotEntries(
        browserWindows,
        Boolean(currentBrowserWindow?.incognito),
      ),
    [browserWindows, currentBrowserWindow?.incognito],
  )
  const slotByWindowId = useMemo(
    () => new Map(windowSlots.map(({ window, number }) => [window.id, number])),
    [windowSlots],
  )

  // Selection state - subscribe to the Set directly for proper re-renders
  const selectedWindowIds = useSelectionStore((s) => s.windowIds)
  const selectionMode = useSelectionStore((s) => s.mode)
  const isMultiSelectMode = selectionMode === 'multi-select'

  // Selection interaction handler
  const selectionInteraction = useSelectionInteraction()
  const batchActions = useBatchTabActions()
  const orderedWindowItems = useMemo(
    () =>
      browserWindows.map((window) => ({
        type: 'window' as const,
        id: window.id,
      })),
    [browserWindows],
  )

  const handleSelectWindow = useCallback(
    (window: BrowserWindow, event: React.MouseEvent) => {
      // Handle selection
      selectionInteraction.handleClick(
        { type: 'window', id: window.id },
        {
          shiftKey: event.shiftKey,
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey,
        },
        'window',
        orderedWindowItems,
      )
      // Also update the viewing window (for now, always show clicked window)
      // TODO: In the future, derive viewing window from selection store
      onSelectWindow(window)
    },
    [orderedWindowItems, selectionInteraction, onSelectWindow],
  )

  const handleWindowContextMenu = useCallback(
    (window: BrowserWindow, event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const wasSelected = selectedWindowIds.has(window.id)
      selectionInteraction.handleWindowContextMenu(window.id)
      if (!wasSelected) onSelectWindow(window)
      onOpenActionMenu()
    },
    [onOpenActionMenu, onSelectWindow, selectedWindowIds, selectionInteraction],
  )

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
          shortcutSlot={slotByWindowId.get(window.id)}
          shortcutBinding={
            shortcutBindings[slotByWindowId.get(window.id) ?? -1]
          }
          unassignedShortcutLabel={unassignedShortcutLabel}
          isCurrent={window.id === currentBrowserWindow?.id}
          isViewing={window.id === selectedWindowId}
          isExpanded={isExpanded}
          selected={selectedWindowIds.has(window.id)}
          isMultiSelectMode={isMultiSelectMode}
          onSelect={handleSelectWindow}
          onContextMenu={handleWindowContextMenu}
          onClose={() =>
            void batchActions.performWindowAction('close', [window.id])
          }
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
        label="Search everything"
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
      collapseSidebarLabel={t('sidebar_collapseSidebar')}
      expandSidebarLabel={t('sidebar_expandSidebar')}
    />
  )
}
