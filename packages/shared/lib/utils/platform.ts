/**
 * Formats a keyboard shortcut for display on the user's platform.
 * macOS uses compact symbols; Windows and Linux retain labels such as
 * "Alt+Shift+E".
 */
export const formatShortcut = (
  shortcut: string | undefined,
  isMac: boolean,
): string | undefined => {
  if (!shortcut || !isMac) return shortcut

  return shortcut
    .replace(/Command|Cmd/gi, '⌘')
    .replace(/MacCtrl/gi, '⌃')
    .replace(/Control|Ctrl/gi, '⌃')
    .replace(/Option|Alt/gi, '⌥')
    .replace(/Shift/gi, '⇧')
    .replace(/\+/g, '')
}
