import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export const useWindows = () => {
  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: ['chrome.windows.getAll'],
    queryFn: () => chrome.windows.getAll(),
    staleTime: 1000,
  });

  useEffect(() => {
    const listener = () =>
      queryClient.invalidateQueries({ queryKey: ['chrome.windows.getAll'] });

    chrome.windows.onCreated.addListener(listener);
    chrome.windows.onRemoved.addListener(listener);
    chrome.windows.onFocusChanged.addListener(listener);

    return () => {
      chrome.windows.onCreated.removeListener(listener);
      chrome.windows.onRemoved.removeListener(listener);
      chrome.windows.onFocusChanged.removeListener(listener);
    };
  }, [queryClient]);

  return result;
};
