import '@src/SidePanel.css';
import TabItem from './TabItem';
import { t } from '@extension/i18n';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { cn, ErrorDisplay, LoadingSpinner } from '@extension/ui';
import { useEffect, useState } from 'react';

type TabItem = {
  type: 'tab';
  window: chrome.windows.Window;
  tabGroup?: chrome.tabGroups.TabGroup;
  tab: chrome.tabs.Tab;
};

type TabGroupItem = {
  type: 'group';
  window: chrome.windows.Window;
  tabGroup: chrome.tabGroups.TabGroup;
  subItems: TabItem[];
};

type WindowItem = {
  window: chrome.windows.Window;
  subItems: Array<TabGroupItem | TabItem>;
};

const SidePanel = () => {
  const { isLight } = useStorage(exampleThemeStorage);

  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
  const [windowItems, setWindowItems] = useState<WindowItem[]>([]);

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

    const newWindowItems: WindowItem[] = [];
    let lastWindowItem: WindowItem | undefined = undefined;
    let lastTabGroupItem: TabGroupItem | undefined = undefined;
    tabList.forEach(tab => {
      if (!lastWindowItem || tab.windowId !== lastWindowItem.window.id) {
        const foundWindow = winList.find(win => win.id === tab.windowId);
        if (!foundWindow) throw new Error(`Window ${tab.windowId} not found for tab`);
        lastWindowItem = {
          window: foundWindow,
          subItems: [],
        };
        newWindowItems.push(lastWindowItem);
      }
      if (tab.groupId === -1) {
        if (lastTabGroupItem) {
          lastTabGroupItem = undefined;
        }
        if (!lastWindowItem) throw new Error('Window not set for new tab');
        lastWindowItem.subItems.push({
          type: 'tab',
          window: lastWindowItem.window,
          tab: tab,
        });
      } else {
        if (!lastTabGroupItem || tab.groupId !== lastTabGroupItem.tabGroup.id) {
          if (!lastWindowItem) throw new Error('Window not set for new tab group');
          const foundTabGroup = groupList.find(tg => tg.id === tab.groupId);
          if (!foundTabGroup) throw new Error(`Tab group ${tab.groupId} not found for tab`);
          lastTabGroupItem = {
            type: 'group',
            window: lastWindowItem.window,
            tabGroup: foundTabGroup,
            subItems: [],
          };
          lastWindowItem.subItems.push(lastTabGroupItem);
        }
        lastTabGroupItem.subItems.push({
          type: 'tab',
          window: lastWindowItem.window,
          tabGroup: lastTabGroupItem.tabGroup,
          tab: tab,
        });
      }
    });
    setWindowItems(newWindowItems);

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
      setCurrentGroupId(typeof active?.groupId === 'number' ? active.groupId : -1);
    } catch {
      setCurrentTabId(null);
      setCurrentGroupId(null);
    }

    setTabs(tabList);
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

  // Scroll the side-panel to the current active tab (if any). Retries a few times
  // in case the element isn't rendered yet.
  const scrollToCurrentTab = () => {
    const target = currentTabId;
    if (typeof target !== 'number') return;

    const selector = `[data-tabid="${String(target)}"]`;
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus?.();
      return;
    }
  };

  return (
    <>
      <div
        className={cn(
          'min-h-screen font-sans text-sm',
          isLight ? 'bg-gray-50 text-gray-800' : 'bg-gray-800 text-gray-100',
        )}>
        <div
          className={cn(
            'sticky top-0 flex items-center justify-between p-3 shadow-md',
            isLight ? 'bg-gray-50 text-gray-800' : 'bg-gray-800 text-gray-100',
          )}>
          <h2 className="text-xl font-semibold">Tabby</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Scroll to active tab"
              aria-label="Scroll to active tab"
              onClick={() => scrollToCurrentTab()}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-md border p-1 transition hover:scale-105',
                isLight ? 'border-gray-200 bg-white text-gray-700' : 'border-gray-700 bg-gray-800 text-gray-100',
              )}>
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4ZM6 8C6 6.89543 6.89543 6 8 6C9.10457 6 10 6.89543 10 8C10 9.10457 9.10457 10 8 10C6.89543 10 6 9.10457 6 8Z"
                    fill="#000000"></path>
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8Z"
                    fill="#000000"></path>
                </g>
              </svg>
            </button>
            <button
              type="button"
              title={t('toggleTheme')}
              aria-label={t('toggleTheme')}
              onClick={() => exampleThemeStorage.toggle()}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-md border p-1 transition-all duration-150 hover:scale-105',
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
          </div>
        </div>

        <ol className="p-3">
          {windowItems.map(windowItem => {
            const win = windowItem.window;
            return (
              <li
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
                  <ol className="flex flex-col">
                    {windowItem.subItems.map(childItem => (
                      <li
                        key={childItem.type === 'tab' ? childItem.tab.id : childItem.tabGroup.id}
                        className="flex w-full flex-col">
                        {childItem.type === 'group' && (
                          <div className={cn('flex flex-col rounded-md p-2')}>
                            <h4
                              className={cn(
                                'mb-1 text-sm font-medium',
                                childItem.tabGroup.color
                                  ? childItem.tabGroup.id === currentGroupId
                                    ? isLight
                                      ? `text-${childItem.tabGroup.color}-600`
                                      : `text-${childItem.tabGroup.color}-500`
                                    : isLight
                                      ? `text-${childItem.tabGroup.color}-800`
                                      : `text-${childItem.tabGroup.color}-700`
                                  : isLight
                                    ? 'text-gray-700'
                                    : 'text-gray-100',
                              )}>
                              {childItem.tabGroup.title || 'Unnamed Group'}
                            </h4>
                            <ol
                              className={cn(
                                'ml-0 space-y-1 border-l-2 pl-2',
                                childItem.tabGroup.color
                                  ? `border-l-${childItem.tabGroup.color}-600`
                                  : 'border-l-gray-600',
                                isLight ? 'text-gray-700' : 'text-gray-200',
                              )}>
                              {childItem.subItems.map(tabItem => (
                                <li key={tabItem.tab.id} className="flex flex-col">
                                  <div data-tabid={tabItem.tab.id}>
                                    <TabItem
                                      tab={tabItem.tab}
                                      isActive={tabItem.tab.id === currentTabId}
                                      isLight={isLight}
                                      refresh={refresh}
                                    />
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {childItem.type === 'tab' && (
                          <div data-tabid={childItem.tab.id}>
                            <TabItem
                              tab={childItem.tab}
                              isActive={childItem.tab.id === currentTabId}
                              isLight={isLight}
                              refresh={refresh}
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="p-8" />
    </>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <LoadingSpinner />), ErrorDisplay);
