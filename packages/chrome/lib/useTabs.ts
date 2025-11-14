import { useQuery } from '@tanstack/react-query'

export const useTabs = (query?: chrome.tabs.QueryInfo) => {
  const result = useQuery({
    queryKey: ['chrome.tabs.query', query],
    queryFn: async () => {
      const tabs = await chrome.tabs.query(query || {})
      console.log(tabs)
      return tabs
    },
    staleTime: 1000,
  })

  // Invalidation is handled centrally (packages/chrome/lib/centralInvalidation)
  // to avoid dozens of duplicate listeners firing the same invalidate logic.

  return result
}
