import { useEffect, useState } from 'react'
import { getCommandShortcuts } from '@extension/chrome/commands'

export const useWindowShortcutBindings = (): Record<number, string> => {
  const [bindings, setBindings] = useState<Record<number, string>>({})

  useEffect(() => {
    let isMounted = true

    const refreshBindings = async () => {
      try {
        const shortcuts = await getCommandShortcuts()
        if (!isMounted) return
        setBindings(
          Object.fromEntries(
            Object.entries(shortcuts.windowSwitchSlots).map(([slot, value]) => [
              Number(slot),
              value ?? '',
            ]),
          ),
        )
      } catch (error) {
        console.warn('Could not read window shortcut bindings', error)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshBindings()
      }
    }

    void refreshBindings()
    window.addEventListener('focus', refreshBindings)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      window.removeEventListener('focus', refreshBindings)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return bindings
}
