import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export const useTabGroups = (query?: chrome.tabGroups.QueryInfo) => {
  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: ['chrome.tabGroups.query', query],
    queryFn: () => chrome.tabGroups.query(query || {}),
    staleTime: 1000,
  });

  useEffect(() => {
    const listener = () =>
      queryClient.invalidateQueries({ queryKey: ['chrome.tabGroups.query'] });

    chrome.tabGroups.onCreated.addListener(listener);
    chrome.tabGroups.onRemoved.addListener(listener);
    chrome.tabGroups.onUpdated.addListener(listener);

    return () => {
      chrome.tabGroups.onCreated.removeListener(listener);
      chrome.tabGroups.onRemoved.removeListener(listener);
      chrome.tabGroups.onUpdated.removeListener(listener);
    };
  }, [queryClient]);

  return result;
};
