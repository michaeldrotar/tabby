import { BrowserStoreProvider } from '@extension/chrome'
import { WiredOmnibar } from '@extension/omnibar'
import { useResolvedTheme, useThemeApplicator } from '@extension/shared'
import { Toaster } from '@extension/ui'
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
          max-h-[75vh] w-[600px] max-w-[90vw] rounded-xl border border-border
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
