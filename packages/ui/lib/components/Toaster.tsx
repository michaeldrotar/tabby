import { useResolvedTheme } from '@extension/shared/hooks/preference'
import { Toaster as Sonner } from 'sonner'
import { CheckCircleIcon, CloseIcon, InfoIcon, LoaderIcon } from '../icons'
import type { ToasterProps } from 'sonner'

/**
 * Themed Toaster component wrapping sonner.
 * Uses the resolved theme from user preferences (light/dark/system).
 *
 * Design note: Following Tabby's design philosophy, we use bold accent colors
 * to celebrate actions and provide delightful feedback. Errors use the same
 * accent treatment with helpful messaging rather than alarming red.
 */
export const Toaster = ({ ...props }: ToasterProps) => {
  const resolvedTheme = useResolvedTheme()

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      position="bottom-right"
      icons={{
        success: <CheckCircleIcon className="size-5 text-accent" />,
        info: <InfoIcon className="size-5 text-accent" />,
        warning: <InfoIcon className="size-5 text-accent" />,
        error: <InfoIcon className="size-5 text-accent" />,
        loading: <LoaderIcon className="size-5 animate-spin text-accent" />,
        close: <CloseIcon className="size-5 text-accent" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: `
            group flex w-fit min-w-[200px] items-center gap-3 rounded-xl
            bg-accent/[calc(var(--accent-strength)*1.5%)] backdrop-blur-sm
            px-4 py-3 text-foreground
            shadow-xl shadow-accent/20
            border-2 border-accent/30
            animate-in slide-in-from-right-full fade-in-0
            duration-300
          `,
          title: 'text-sm font-semibold',
          description: 'text-xs text-muted-foreground',
          actionButton:
            'rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition-colors',
          cancelButton:
            'rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/90 transition-colors',
          closeButton:
            'absolute -right-1 -top-1 rounded-full bg-background p-1 text-muted-foreground shadow-md hover:bg-muted hover:text-foreground transition-colors',
        },
      }}
      {...props}
    />
  )
}

// Re-export toast function for convenience
export { toast } from 'sonner'
