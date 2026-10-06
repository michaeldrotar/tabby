import { BrowserStoreProvider } from '@extension/chrome/BrowserStoreProvider'
import { WiredOmnibar } from '@extension/omnibar/WiredOmnibar'
import {
  useResolvedTheme,
  useThemeApplicator,
} from '@extension/shared/hooks/preference'
import { Toaster } from '@extension/ui/components/Toaster'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

const onDismiss = () => {
  window.parent.postMessage({ type: 'CLOSE_OMNIBAR' }, '*')
}

const OmnibarOverlayContent = () => {
  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[20vh]"
      onClick={onDismiss}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onDismiss()
      }}
    >
      <WiredOmnibar
        onDismiss={onDismiss}
        className={`
          border-border max-h-[75vh] w-[600px] max-w-[90vw] rounded-xl border
          shadow-2xl
        `}
      />
    </div>
  )
}

export const OmnibarOverlay = () => {
  useThemeApplicator()
  const theme = useResolvedTheme()

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster theme={theme} />
      <BrowserStoreProvider>
        <OmnibarOverlayContent />
      </BrowserStoreProvider>
    </QueryClientProvider>
  )
}
