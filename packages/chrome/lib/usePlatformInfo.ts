import { useQuery } from '@tanstack/react-query'

const getPlatformInfo = async (): Promise<chrome.runtime.PlatformInfo> => {
  const info = await chrome.runtime.getPlatformInfo()
  return info
}

export const usePlatformInfo = () => {
  return useQuery<chrome.runtime.PlatformInfo, Error>({
    queryKey: ['chrome.runtime.getPlatformInfo'],
    queryFn: getPlatformInfo,
    staleTime: Infinity,
  })
}
