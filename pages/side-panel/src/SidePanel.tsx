import '@src/SidePanel.css';
import TabItem from './TabItem';
import { t } from '@extension/i18n';
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
      <div
        className={cn(
          'min-h-screen p-3 font-sans text-sm',
          isLight ? 'bg-gray-50 text-gray-800' : 'bg-gray-800 text-gray-100',
        )}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tabby</h2>
        </div>

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
                : isLight
                  ? 'border border-gray-300 bg-white shadow-sm'
                  : 'border border-gray-700 bg-gray-900/20 shadow-sm',
            )}>
            <div
              className={cn(
                'flex items-center justify-between px-3 py-2',
                isLight ? 'border-b border-gray-200' : 'border-b border-gray-700',
              )}>
              <h3 className={cn('font-semibold', isLight ? 'text-gray-700' : 'text-gray-100')}>
                Window {win.id}
                {win.focused && (
                  <span
                    className={cn(
                      'ml-2 inline-block text-xs font-medium',
                      isLight ? 'text-blue-500' : 'text-blue-300',
                    )}>
                    focused
                  </span>
                )}
              </h3>
              <span className={cn('text-xs', isLight ? 'text-gray-400' : 'text-gray-400/80')}>
                {tabs.filter(t => t.windowId === win.id).length} tabs
              </span>
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
                        ? isLight
                          ? 'border-2 border-blue-300 bg-blue-50'
                          : 'border-2 border-blue-600 bg-blue-900/20'
                        : isLight
                          ? 'border border-gray-200 bg-gray-100'
                          : 'border border-gray-700 bg-gray-900/10',
                    )}>
                    <h4
                      className={cn(
                        'mb-1 text-sm font-medium',
                        group.color ? `text-${group.color}-600` : isLight ? 'text-gray-700' : 'text-gray-100',
                      )}>
                      {group.title || 'Unnamed Group'}
                    </h4>
                    <ol className={cn('ml-0 space-y-1', isLight ? 'text-gray-700' : 'text-gray-200')}>
                      {tabs
                        .filter(t => t.windowId === win.id && t.groupId === group.id)
                        .map(tab => (
                          <li key={tab.id} className="flex">
                            <TabItem
                              tab={tab as chrome.tabs.Tab & { favIconUrl?: string }}
                              isActive={tab.id === currentTabId}
                              isLight={isLight}
                              refresh={refresh}
                            />
                          </li>
                        ))}
                    </ol>
                  </div>
                ))}

              {/* Ungrouped tabs */}
              <ol className={cn('ml-0 space-y-1', isLight ? '' : 'text-gray-200')}>
                {tabs
                  .filter(t => t.windowId === win.id && t.groupId === -1)
                  .map(tab => (
                    <li key={tab.id} className="flex">
                      <TabItem
                        tab={tab as chrome.tabs.Tab & { favIconUrl?: string }}
                        isActive={tab.id === currentTabId}
                        isLight={isLight}
                        refresh={refresh}
                      />
                    </li>
                  ))}
              </ol>
            </div>
          </div>
        ))}
      </div>
      <div className="p-8" />
      {/* Floating theme toggle — sleek circular button with icon, stays visible while scrolling */}
      <button
        onClick={() => exampleThemeStorage.toggle()}
        title={t('toggleTheme')}
        aria-label={t('toggleTheme')}
        className={cn(
          'fixed bottom-4 right-4 z-50 flex h-12 w-12 transform-gpu items-center justify-center rounded-full shadow-lg transition-all duration-150 hover:scale-105 focus:outline-none focus-visible:ring-2',
          isLight
            ? 'border border-gray-200 bg-white text-gray-800 hover:ring-blue-200'
            : 'border border-gray-700 bg-gray-800 text-yellow-200 hover:ring-yellow-400',
        )}>
        {isLight ? (
          // Sun icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="currentColor"
            aria-hidden>
            <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.8 1.8-1.8zM1 13h3v-2H1v2zm10 9h2v-3h-2v3zm7.24-2.16l1.79 1.79 1.79-1.79-1.79-1.8-1.79 1.8zM20 11v2h3v-2h-3zM11 1h2v3h-2V1zm4.24 3.76l1.79-1.8-1.79-1.79-1.8 1.79 1.8 1.8zM12 6a6 6 0 100 12 6 6 0 000-12z" />
          </svg>
        ) : (
          // Moon icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="currentColor"
            aria-hidden>
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        )}
      </button>
    </>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <LoadingSpinner />), ErrorDisplay);
