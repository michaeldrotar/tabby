import { useEffect, useState } from 'react'
import {
  getWindowSwitchSlotIndexFromCommand,
  getWindowSwitchSlotNumber,
} from '@extension/chrome/window/windowSwitchSlots'

export const useWindowShortcutBindings = (): Record<number, string> => {
  const [bindings, setBindings] = useState<Record<number, string>>({})

  useEffect(() => {
    let isMounted = true

    const refreshBindings = async () => {
      try {
        const commands = await chrome.commands.getAll()
        if (!isMounted) return

        const nextBindings: Record<number, string> = {}
        for (const command of commands) {
          const slotIndex = getWindowSwitchSlotIndexFromCommand(
            command.name ?? '',
          )
          if (slotIndex === undefined) continue

          const slotNumber = getWindowSwitchSlotNumber(slotIndex)
          if (slotNumber !== undefined) {
            nextBindings[slotNumber] = command.shortcut || ''
          }
        }
        setBindings(nextBindings)
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
