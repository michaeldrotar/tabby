/**
 * Platform detection utilities.
 *
 * Uses chrome.runtime.getPlatformInfo for accurate detection.
 * The platform info is preloaded at module initialization time,
 * making subsequent calls synchronous.
 */

let cachedPlatformOS: chrome.runtime.PlatformOs | undefined = undefined

// Preload platform info at module initialization
const preloadPromise = chrome.runtime.getPlatformInfo().then((info) => {
  cachedPlatformOS = info.os
  return info.os
})

/**
 * Wait for platform info to be loaded.
 * Call this during app initialization to ensure sync functions work correctly.
 */
export const waitForPlatformInfo = (): Promise<chrome.runtime.PlatformOs> =>
  preloadPromise

/**
 * Get the current platform OS synchronously.
 * Returns the cached value if available, otherwise makes a best guess.
 *
 * For guaranteed accuracy, call `waitForPlatformInfo()` during app init.
 */
export const getPlatformOS = (): chrome.runtime.PlatformOs => {
  if (cachedPlatformOS) {
    return cachedPlatformOS
  }

  // Fallback to navigator.platform if not yet loaded
  if (typeof navigator !== 'undefined') {
    if (/Mac|iPhone|iPad|iPod/.test(navigator.platform)) {
      return 'mac'
    }
    if (/Win/.test(navigator.platform)) {
      return 'win'
    }
    if (/Android/.test(navigator.userAgent)) {
      return 'android'
    }
    if (/CrOS/.test(navigator.userAgent)) {
      return 'cros'
    }
  }

  return 'linux'
}

/**
 * Check if the current platform is macOS.
 */
export const isMac = (): boolean => {
  return getPlatformOS() === 'mac'
}

/**
 * Check if the current platform is Windows.
 */
export const isWindows = (): boolean => {
  return getPlatformOS() === 'win'
}

/**
 * Returns the appropriate modifier key symbol/name for the current platform.
 * Mac: "⌘" (Command symbol)
 * Others: "Ctrl"
 */
export const getPlatformModifier = (): string => {
  return isMac() ? '⌘' : 'Ctrl'
}

/**
 * Formats a keyboard shortcut string for display.
 * Converts platform-specific key names to symbols.
 *
 * Examples:
 * - "Command+E" → "⌘E"
 * - "Ctrl+Shift+K" → "⌃⇧K"
 * - "Alt+E" → "⌥E"
 */
export const formatShortcut = (shortcut: string | undefined): string => {
  if (!shortcut) return ''

  return shortcut
    .replace(/Command|Cmd/gi, '⌘')
    .replace(/Control|Ctrl/gi, '⌃')
    .replace(/Alt/gi, '⌥')
    .replace(/Shift/gi, '⇧')
    .replace(/\+/g, '')
}
