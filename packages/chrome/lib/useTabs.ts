import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export const useTabs = (query?: chrome.tabs.QueryInfo) => {
  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: ['chrome.tabs.query', query],
    queryFn: () => chrome.tabs.query(query || {}),
    staleTime: 1000,
  });

  useEffect(() => {
    const listener = () =>
      queryClient.invalidateQueries({ queryKey: ['chrome.tabs.query'] });

    chrome.tabs.onCreated.addListener(listener);
    chrome.tabs.onRemoved.addListener(listener);
    chrome.tabs.onMoved.addListener(listener);
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.onActivated.addListener(listener);

    return () => {
      chrome.tabs.onCreated.removeListener(listener);
      chrome.tabs.onRemoved.removeListener(listener);
      chrome.tabs.onMoved.removeListener(listener);
      chrome.tabs.onUpdated.removeListener(listener);
      chrome.tabs.onActivated.removeListener(listener);
    };
  }, [queryClient]);

  return result;
};
