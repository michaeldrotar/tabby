import { BrowserStoreProvider } from '@extension/chrome/BrowserStoreProvider'
import {
  useResolvedTheme,
  useThemeApplicator,
} from '@extension/shared/hooks/preference'
import { loadPreferenceStorage } from '@extension/storage/impl/preference-storage'
import { Toaster } from '@extension/ui/components/Toaster'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EventLog } from './EventLog'
import TabManager from './TabManager'

const queryClient = new QueryClient()
loadPreferenceStorage()

export const Root = () => {
  useThemeApplicator()
  const theme = useResolvedTheme()

  return (
    <>
      <EventLog />
      <QueryClientProvider client={queryClient}>
        <Toaster theme={theme} />
        <BrowserStoreProvider>
          <TabManager />
        </BrowserStoreProvider>
      </QueryClientProvider>
    </>
  )
}
