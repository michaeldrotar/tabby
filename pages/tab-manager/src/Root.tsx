import { BrowserStoreProvider } from '@extension/chrome'
import { useThemeApplicator } from '@extension/shared'
import { loadPreferenceStorage } from '@extension/storage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EventLog } from './EventLog'
import TabManager from './TabManager'

const queryClient = new QueryClient()
loadPreferenceStorage()

export const Root = () => {
  useThemeApplicator()

  return (
    <>
      <EventLog />
      <QueryClientProvider client={queryClient}>
        <BrowserStoreProvider>
          <TabManager />
        </BrowserStoreProvider>
      </QueryClientProvider>
    </>
  )
}
