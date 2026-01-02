import { BrowserStoreProvider } from '@extension/chrome/BrowserStoreProvider'
import { useThemeApplicator } from '@extension/shared/hooks/preference'
import { loadPreferenceStorage } from '@extension/storage/impl/preference-storage'
import { Toaster } from '@extension/ui/components/Toaster'
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
        <Toaster />
        <BrowserStoreProvider>
          <TabManager />
        </BrowserStoreProvider>
      </QueryClientProvider>
    </>
  )
}
