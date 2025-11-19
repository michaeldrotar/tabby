import SidePanel from './SidePanel'
import { BrowserWindowStoreProvider3 } from '@extension/chrome'
import {
  registerQueryClient,
  unregisterQueryClient,
} from '@extension/chrome/lib/centralInvalidation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'

const queryClient = new QueryClient()

export const Root = () => {
  useEffect(() => {
    // Register the QueryClient with the central invalidation module so
    // chrome event listeners are installed only once and invalidate
    // this single client.
    registerQueryClient(queryClient)
    return () => unregisterQueryClient(queryClient)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserWindowStoreProvider3>
        <SidePanel />
      </BrowserWindowStoreProvider3>
    </QueryClientProvider>
  )
}
