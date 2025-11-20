import { EventLog } from './EventLog'
import SidePanel from './SidePanel'
import { BrowserStoreProvider } from '@extension/chrome'
import { useThemeApplicator } from '@extension/shared'
import { loadThemeStorage } from '@extension/storage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()
loadThemeStorage()

export const Root = () => {
  useThemeApplicator()

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
