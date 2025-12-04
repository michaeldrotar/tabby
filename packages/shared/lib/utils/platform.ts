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
