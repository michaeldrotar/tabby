import { useThemeApplicator } from '@extension/shared'
import { Omnibar } from '@extension/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export const OmnibarOverlay = () => {
  useThemeApplicator()

  const onDismiss = () => {
    window.parent.postMessage({ type: 'CLOSE_OMNIBAR' }, '*')
  }

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
      <QueryClientProvider client={queryClient}>
        <Omnibar
          onDismiss={onDismiss}
          className="max-h-[75vh] w-[600px] max-w-[90vw] rounded-xl border border-border shadow-2xl"
        />
      </QueryClientProvider>
    </div>
  )
}
