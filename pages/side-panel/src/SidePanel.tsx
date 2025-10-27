import '@src/SidePanel.css';
import { t } from '@extension/i18n';
import { PROJECT_URL_OBJECT, useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { cn, ErrorDisplay, LoadingSpinner, ToggleButton } from '@extension/ui';
import { useEffect, useState } from 'react';

interface Tab {
  id: number;
  title?: string;
  url?: string;
  windowId: number;
  groupId?: number;
}

interface TabGroup {
  id: number;
  title?: string;
  color?: string;
  windowId: number;
}

interface Window {
  id: number;
  focused?: boolean;
}

const SidePanel = () => {
  const { isLight } = useStorage(exampleThemeStorage);
  const logo = isLight ? 'side-panel/logo_vertical.svg' : 'side-panel/logo_vertical_dark.svg';

  const goGithubSite = () => chrome.tabs.create(PROJECT_URL_OBJECT);

  const [windows, setWindows] = useState<Window[]>([]);
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);

  const refresh = async () => {
    const winList = await chrome.windows.getAll();
    const tabList = await chrome.tabs.query({});
    let groupList: TabGroup[] = [];
    try {
      groupList = await chrome.tabGroups.query({});
    } catch {
      // tabGroups API not always available – ignore errors
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
    chrome.windows.onCreated.addListener(listener);
    chrome.windows.onRemoved.addListener(listener);
    chrome.tabGroups?.onCreated?.addListener?.(listener);
    chrome.tabGroups?.onRemoved?.addListener?.(listener);
    chrome.tabGroups?.onUpdated?.addListener?.(listener);

    return () => {
      chrome.tabs.onCreated.removeListener(listener);
      chrome.tabs.onRemoved.removeListener(listener);
      chrome.tabs.onMoved.removeListener(listener);
      chrome.tabs.onUpdated.removeListener(listener);
      chrome.windows.onCreated.removeListener(listener);
      chrome.windows.onRemoved.removeListener(listener);
      chrome.tabGroups?.onCreated?.removeListener?.(listener);
      chrome.tabGroups?.onRemoved?.removeListener?.(listener);
      chrome.tabGroups?.onUpdated?.removeListener?.(listener);
    };
  }, []);

  return (
    <div className={cn('App', isLight ? 'bg-slate-50' : 'bg-gray-800')}>
      <header className={cn('App-header', isLight ? 'text-gray-900' : 'text-gray-100')}>
        <button onClick={goGithubSite}>
          <img src={chrome.runtime.getURL(logo)} className="App-logo" alt="logo" />
        </button>
        <p>
          Edit <code>pages/side-panel/src/SidePanel.tsx</code>
        </p>
        <ToggleButton onClick={exampleThemeStorage.toggle}>{t('toggleTheme')}</ToggleButton>
      </header>
      <div className="min-h-screen bg-gray-50 p-3 font-sans text-sm text-gray-800">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">
          Tabby <span className="text-rose-500">🐾</span>
        </h2>

        {windows.map(win => (
          <div key={win.id} className="mb-4 rounded-lg border border-gray-300 bg-white shadow-sm">
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
                  <div key={`group-${group.id}`} className="rounded-md border border-gray-200 bg-gray-100 p-2">
                    <h4
                      className={`mb-1 text-sm font-medium ${
                        group.color ? `text-${group.color}-600` : 'text-gray-700'
                      }`}>
                      {group.title || 'Unnamed Group'}
                    </h4>
                    <ul className="ml-3 list-inside list-disc space-y-0.5 text-gray-700">
                      {tabs
                        .filter(t => t.windowId === win.id && t.groupId === group.id)
                        .map(tab => (
                          <li key={tab.id} className="cursor-pointer truncate hover:text-blue-600">
                            <a href={tab.url} target="_blank" rel="noreferrer" title={tab.url}>
                              {tab.title}
                            </a>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}

              {/* Ungrouped tabs */}
              <ul className="ml-3 list-inside list-disc space-y-0.5">
                {tabs
                  .filter(t => t.windowId === win.id && t.groupId === -1)
                  .map(tab => (
                    <li key={tab.id} className="cursor-pointer truncate hover:text-blue-600">
                      <a href={tab.url} target="_blank" rel="noreferrer" title={tab.url}>
                        {tab.title}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <LoadingSpinner />), ErrorDisplay);
