import { EventLog } from './EventLog'
import SidePanel from './SidePanel'
import { BrowserStoreProvider } from '@extension/chrome'
import {
  registerQueryClient,
  unregisterQueryClient,
} from '@extension/chrome/lib/centralInvalidation'
import { useThemeApplicator } from '@extension/shared'
import { loadThemeStorage } from '@extension/storage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'

const queryClient = new QueryClient()
loadThemeStorage()

export const Root = () => {
  useThemeApplicator()

  useEffect(() => {
    // Register the QueryClient with the central invalidation module so
    // chrome event listeners are installed only once and invalidate
    // this single client.
    registerQueryClient(queryClient)
    return () => unregisterQueryClient(queryClient)
  }, [])

  return (
    <>
      <EventLog />
      <QueryClientProvider client={queryClient}>
        <BrowserStoreProvider>
          <SidePanel />
        </BrowserStoreProvider>
      </QueryClientProvider>
    </>
  )
}
