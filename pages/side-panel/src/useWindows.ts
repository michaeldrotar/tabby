import { useEffect, useState } from 'react';

export const useWindows = () => {
  const [windows, setWindows] = useState<chrome.windows.Window[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchWindows = async () => {
      try {
        const all = await chrome.windows.getAll();
        if (mounted) setWindows(all);
      } catch {
        if (mounted) setWindows([]);
      }
    };

    fetchWindows();

    const listener = () => fetchWindows();
    chrome.windows.onCreated.addListener(listener);
    chrome.windows.onRemoved.addListener(listener);
    chrome.windows.onFocusChanged.addListener?.(listener);

    return () => {
      mounted = false;
      chrome.windows.onCreated.removeListener(listener);
      chrome.windows.onRemoved.removeListener(listener);
      chrome.windows.onFocusChanged.removeListener?.(listener);
    };
  }, []);

  return windows;
};
