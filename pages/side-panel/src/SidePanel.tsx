import '@src/SidePanel.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { cn, ErrorDisplay, LoadingSpinner } from '@extension/ui';
import { useEffect, useState } from 'react';

const SidePanel = () => {
  const { isLight } = useStorage(exampleThemeStorage);

  const [windows, setWindows] = useState<chrome.windows.Window[]>([]);
  const [tabGroups, setTabGroups] = useState<chrome.tabGroups.TabGroup[]>([]);
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);

  // current active identifiers for highlighting
  const [currentWindowId, setCurrentWindowId] = useState<number | null>(null);
  const [currentTabId, setCurrentTabId] = useState<number | null>(null);
  const [currentGroupId, setCurrentGroupId] = useState<number | null>(null);

  const refresh = async () => {
    const winList = await chrome.windows.getAll();
    const tabList = await chrome.tabs.query({});
    let groupList: chrome.tabGroups.TabGroup[] = [];
    try {
      groupList = await chrome.tabGroups.query({});
    } catch {
      // tabGroups API not always available – ignore errors
    }

    // determine current active window / tab / group
    try {
      const currentWin = await chrome.windows.getCurrent();
      setCurrentWindowId(currentWin?.id ?? null);
    } catch {
      setCurrentWindowId(null);
    }

    try {
      const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const active = activeTabs[0];
      setCurrentTabId(active?.id ?? null);
      // groupId can be a number or -1 for ungrouped; if undefined treat as -1
      setCurrentGroupId(typeof active?.groupId === 'number' ? active!.groupId : -1);
    } catch {
      setCurrentTabId(null);
      setCurrentGroupId(null);
    }

    setWindows(winList);
    setTabs(tabList);
    setTabGroups(groupList);
  };

  useEffect(() => {
    refresh();

    // Listen for updates to keep view fresh
    const listener = () => refresh();
    chrome.tabs.onCreated.addListener(listener);
    chrome.tabs.onRemoved.addListener(listener);
    chrome.tabs.onMoved.addListener(listener);
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.onActivated.addListener?.(listener);
    chrome.windows.onCreated.addListener(listener);
    chrome.windows.onRemoved.addListener(listener);
    chrome.windows.onFocusChanged.addListener?.(listener);
    chrome.tabGroups?.onCreated?.addListener?.(listener);
    chrome.tabGroups?.onRemoved?.addListener?.(listener);
    chrome.tabGroups?.onUpdated?.addListener?.(listener);

    return () => {
      chrome.tabs.onCreated.removeListener(listener);
      chrome.tabs.onRemoved.removeListener(listener);
      chrome.tabs.onMoved.removeListener(listener);
      chrome.tabs.onUpdated.removeListener(listener);
      chrome.tabs.onActivated.removeListener?.(listener);
      chrome.windows.onCreated.removeListener(listener);
      chrome.windows.onRemoved.removeListener(listener);
      chrome.windows.onFocusChanged.removeListener?.(listener);
      chrome.tabGroups?.onCreated?.removeListener?.(listener);
      chrome.tabGroups?.onRemoved?.removeListener?.(listener);
      chrome.tabGroups?.onUpdated?.removeListener?.(listener);
    };
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-3 font-sans text-sm text-gray-800">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">
          Tabby <span className="text-rose-500">🐾</span>
        </h2>

        {windows.map(win => (
          <div
            key={win.id}
            className={cn(
              'mb-4 rounded-lg px-0',
              win.id === currentWindowId
                ? // highlighted current window
                  isLight
                  ? 'border-2 border-blue-400 bg-blue-50 shadow-md'
                  : 'border-2 border-blue-600 bg-blue-900/40 shadow-md'
                : 'border border-gray-300 bg-white shadow-sm',
            )}>
            <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
              <h3 className="font-semibold text-gray-700">
                Window {win.id}
                {win.focused && <span className="ml-2 inline-block text-xs font-medium text-blue-500">focused</span>}
              </h3>
              <span className="text-xs text-gray-400">{tabs.filter(t => t.windowId === win.id).length} tabs</span>
            </div>

            <div className="space-y-3 p-3">
              {/* Tab Groups */}
              {tabGroups
                .filter(g => g.windowId === win.id)
                .map(group => (
                  <div
                    key={`group-${group.id}`}
                    className={cn(
                      'rounded-md p-2',
                      group.id === currentGroupId
                        ? 'border-2 border-blue-300 bg-blue-50'
                        : 'border border-gray-200 bg-gray-100',
                    )}>
                    <h4
                      className={`mb-1 text-sm font-medium ${
                        group.color ? `text-${group.color}-600` : 'text-gray-700'
                      }`}>
                      {group.title || 'Unnamed Group'}
                    </h4>
                    <ul className="ml-0 space-y-1 text-gray-700">
                      {tabs
                        .filter(t => t.windowId === win.id && t.groupId === group.id)
                        .map(tab => (
                          <li
                            key={tab.id}
                            className={cn(
                              'flex cursor-pointer items-center gap-2 truncate rounded-sm px-1 py-0.5',
                              tab.id === currentTabId
                                ? 'bg-blue-50 font-semibold text-blue-700'
                                : 'hover:text-blue-600',
                            )}>
                            <img
                              src={tab.favIconUrl ?? `chrome://favicon/${tab.url ?? ''}`}
                              alt="fav"
                              className="h-4 w-4 flex-shrink-0 rounded-sm"
                            />
                            <a className="truncate" href={tab.url} target="_blank" rel="noreferrer" title={tab.url}>
                              {tab.title}
                            </a>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}

              {/* Ungrouped tabs */}
              <ul className="ml-0 space-y-1">
                {tabs
                  .filter(t => t.windowId === win.id && t.groupId === -1)
                  .map(tab => (
                    <li
                      key={tab.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 truncate rounded-sm px-1 py-0.5',
                        tab.id === currentTabId ? 'bg-blue-50 font-semibold text-blue-700' : 'hover:text-blue-600',
                      )}>
                      <img
                        src={tab.favIconUrl ?? `chrome://favicon/${tab.url ?? ''}`}
                        alt="fav"
                        className="h-4 w-4 flex-shrink-0 rounded-sm"
                      />
                      <a className="truncate" href={tab.url} target="_blank" rel="noreferrer" title={tab.url}>
                        {tab.title}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <LoadingSpinner />), ErrorDisplay);
