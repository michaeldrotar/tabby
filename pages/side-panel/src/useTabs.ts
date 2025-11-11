import { useEffect, useState } from 'react';

export const useTabs = (query?: chrome.tabs.QueryInfo) => {
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchTabs = async () => {
      try {
        const all = await chrome.tabs.query(query || {});
        if (mounted) setTabs(all);
      } catch {
        if (mounted) setTabs([]);
      }
    };

    fetchTabs();

    const listener = (...args: unknown[]) => {
      console.log(...args);
      fetchTabs();
    };
    chrome.tabs.onCreated.addListener(listener);
    chrome.tabs.onRemoved.addListener(listener);
    chrome.tabs.onMoved.addListener(listener);
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.onActivated.addListener(listener);

    return () => {
      mounted = false;
      chrome.tabs.onCreated.removeListener(listener);
      chrome.tabs.onRemoved.removeListener(listener);
      chrome.tabs.onMoved.removeListener(listener);
      chrome.tabs.onUpdated.removeListener(listener);
      chrome.tabs.onActivated.removeListener(listener);
    };
  }, []);

  return tabs;
};
