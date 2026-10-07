import { BrowserStoreProvider } from '@extension/chrome/BrowserStoreProvider'
import {
  useResolvedTheme,
  useThemeApplicator,
} from '@extension/shared/hooks/preference'
import { loadPreferenceStorage } from '@extension/storage/impl/preference-storage'
import { Toaster } from '@extension/ui/components/Toaster'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TabManager from './TabManager'

const queryClient = new QueryClient()
loadPreferenceStorage()

export const Root = () => {
  useThemeApplicator()
  const theme = useResolvedTheme()

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Toaster
          theme={theme}
          offset={{ bottom: 64, right: 8 }}
          mobileOffset={{ bottom: 64, left: 8, right: 8 }}
          style={{ zIndex: 40 }}
        />
        <BrowserStoreProvider>
          <TabManager />
        </BrowserStoreProvider>
      </QueryClientProvider>
    </>
  )
}
