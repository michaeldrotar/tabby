/**
 * Opens a URL based on the modifier key and original window context.
 *
 * @param url - The URL to open
 * @param modifier - How to open: 'new-tab', 'new-window', or undefined (current tab)
 * @param originalWindowId - The window that initiated the omnibar (for routing)
 */
export const executeOmnibarUrl = async (
  url: string,
  modifier?: 'new-tab' | 'new-window',
  originalWindowId?: number,
): Promise<void> => {
  if (modifier === 'new-window') {
    await chrome.windows.create({ url, focused: true })
    return
  }

  if (modifier === 'new-tab') {
    if (originalWindowId) {
      await chrome.tabs.create({
        windowId: originalWindowId,
        url,
        active: true,
      })
      await chrome.windows.update(originalWindowId, { focused: true })
    } else {
      await chrome.tabs.create({ url, active: true })
    }
    return
  }

  // Default: open in current tab
  if (originalWindowId) {
    const [tab] = await chrome.tabs.query({
      windowId: originalWindowId,
      active: true,
    })
    if (tab?.id) {
      await chrome.tabs.update(tab.id, { url, active: true })
      await chrome.windows.update(originalWindowId, { focused: true })
    } else {
      await chrome.tabs.create({ windowId: originalWindowId, url })
    }
  } else {
    await chrome.tabs.update({ url })
  }
}
