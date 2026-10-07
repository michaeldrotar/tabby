import { useEffect, useRef } from 'react'
import { Toaster, useSonner } from 'sonner'
import { CloseIcon } from '../icons'
import type { ReactNode } from 'react'

export const ToastStatus = ({
  dismissLabel,
  children,
  onDismiss,
}: {
  dismissLabel: string
  children: ReactNode
  onDismiss?: () => void
}) => {
  const { toasts } = useSonner()
  const hasNotifications = toasts.length > 0
  const toasterRef = useRef<HTMLElement>(null)
  const restoreFocusRef = useRef(false)
  const dismissedToastRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const toaster = toasterRef.current
    if (!toaster) return
    const updateFocusability = () => {
      const list = toaster.querySelector<HTMLElement>('[data-sonner-toaster]')
      if (
        toaster.matches(':hover') &&
        list?.querySelector('[data-sonner-toast][data-expanded="false"]')
      ) {
        // Keep hover behavior active as cards are removed.
        list.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
      }
      toaster
        .querySelectorAll<HTMLElement>('[data-sonner-toast]')
        .forEach((notification) => {
          notification.inert =
            notification.dataset.visible !== 'true' ||
            notification.dataset.removed === 'true' ||
            (notification.dataset.front !== 'true' &&
              notification.dataset.expanded !== 'true')
        })
      if (dismissedToastRef.current && !dismissedToastRef.current.isConnected) {
        dismissedToastRef.current = null
        if (document.activeElement === document.body) {
          toaster
            .querySelector<HTMLButtonElement>(
              '[data-sonner-toast][data-front="true"] [data-close-button]',
            )
            ?.focus()
        }
      }
    }
    const observer = new MutationObserver(updateFocusability)
    observer.observe(toaster, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'data-front',
        'data-expanded',
        'data-visible',
        'data-removed',
      ],
    })
    updateFocusability()
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (hasNotifications || !restoreFocusRef.current) return
    restoreFocusRef.current = false
    onDismiss?.()
  }, [hasNotifications, onDismiss])

  return (
    <div className="relative">
      <div
        inert={hasNotifications}
        aria-hidden={hasNotifications ? true : undefined}
        className={hasNotifications ? 'invisible' : undefined}
      >
        {children}
      </div>
      <div
        data-notification-status
        className="pointer-events-none absolute inset-0"
        style={{ clipPath: 'inset(-100vh 0 0 0)' }}
        onFocusCapture={(event) => {
          event.stopPropagation()
          restoreFocusRef.current = true
        }}
        onBlurCapture={(event) => {
          event.stopPropagation()
          if (
            !event.currentTarget.contains(event.relatedTarget) &&
            !(
              event.relatedTarget === null &&
              (event.target as HTMLElement).closest(
                '[data-sonner-toast][data-removed="true"]',
              )
            )
          ) {
            restoreFocusRef.current = false
          }
        }}
        onClickCapture={(event) => {
          const target = event.target as HTMLElement
          if (target.closest('[data-close-button]')) {
            dismissedToastRef.current = target.closest<HTMLElement>(
              '[data-sonner-toast]',
            )
            restoreFocusRef.current = true
          }
        }}
      >
        <Toaster
          ref={toasterRef}
          position="bottom-right"
          closeButton
          swipeDirections={[]}
          gap={6}
          offset={0}
          mobileOffset={0}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            height: '100%',
            fontFamily: 'inherit',
            zIndex: 1,
            pointerEvents: hasNotifications ? 'auto' : 'none',
          }}
          icons={{
            success: null,
            info: null,
            warning: null,
            error: null,
            close: <CloseIcon size={18} aria-hidden="true" />,
          }}
          toastOptions={{
            closeButtonAriaLabel: dismissLabel,
            style: {
              width: '100%',
              height: '100%',
              minHeight: '100%',
              padding: '8px 52px 8px 8px',
              background:
                'color-mix(in srgb, var(--accent) calc(var(--accent-strength) * 0.5%), var(--background))',
              color: 'var(--muted)',
              border: 'none',
              borderTop:
                '1px solid color-mix(in srgb, var(--accent) calc(var(--accent-strength) * 1%), var(--border))',
              borderRadius: 0,
              boxShadow: 'none',
              fontSize: 12,
              userSelect: 'text',
              touchAction: 'auto',
            },
            classNames: {
              content: 'min-w-0 flex-1',
              title: 'line-clamp-2 !font-normal !leading-4',
              closeButton: `
                !top-2 !right-2 !left-auto !flex !size-9 !transform-none
                !items-center !justify-center !rounded-md !border-0
                !bg-transparent !p-0 !text-muted !shadow-none
                hover:!bg-highlighted/50 hover:!text-foreground
                focus-visible:outline-accent focus-visible:outline
                focus-visible:outline-2 focus-visible:-outline-offset-2
              `,
            },
          }}
        />
      </div>
    </div>
  )
}
