import { useQuery } from '@tanstack/react-query'

export const useTabGroups = (query?: chrome.tabGroups.QueryInfo) => {
  const result = useQuery({
    queryKey: ['chrome.tabGroups.query', query],
    queryFn: () => chrome.tabGroups.query(query || {}),
    staleTime: 1000,
  })

  // Invalidation is handled centrally (packages/chrome/lib/centralInvalidation)
  // to avoid per-hook listeners firing the same invalidation repeatedly.

  return result
}
