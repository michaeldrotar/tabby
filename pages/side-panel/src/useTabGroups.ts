import { useEffect, useState } from 'react';

export const useTabGroups = (query?: chrome.tabGroups.QueryInfo) => {
  const [groups, setGroups] = useState<chrome.tabGroups.TabGroup[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchGroups = async () => {
      try {
        if (!chrome.tabGroups) {
          if (mounted) setGroups([]);
          return;
        }
        const all = await chrome.tabGroups.query(query || {});
        if (mounted) setGroups(all || []);
      } catch {
        if (mounted) setGroups([]);
      }
    };

    fetchGroups();

    const listener = () => fetchGroups();
    chrome.tabGroups?.onCreated?.addListener?.(listener);
    chrome.tabGroups?.onRemoved?.addListener?.(listener);
    chrome.tabGroups?.onUpdated?.addListener?.(listener);

    return () => {
      mounted = false;
      chrome.tabGroups?.onCreated?.removeListener?.(listener);
      chrome.tabGroups?.onRemoved?.removeListener?.(listener);
      chrome.tabGroups?.onUpdated?.removeListener?.(listener);
    };
  }, []);

  return groups;
};
