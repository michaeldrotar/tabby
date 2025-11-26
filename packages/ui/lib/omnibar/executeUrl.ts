export const executeUrl = async (
  url: string,
  modifier?: 'new-tab' | 'new-window',
  originalWindowId?: number,
) => {
  if (modifier === 'new-window') {
    await chrome.windows.create({ url, focused: true })
  } else if (modifier === 'new-tab') {
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
  } else {
    if (originalWindowId) {
      const [tab] = await chrome.tabs.query({
        windowId: originalWindowId,
        active: true,
      })
      if (tab && tab.id) {
        await chrome.tabs.update(tab.id, { url, active: true })
        await chrome.windows.update(originalWindowId, { focused: true })
      } else {
        await chrome.tabs.create({
          windowId: originalWindowId,
          url,
        })
      }
    } else {
      await chrome.tabs.update({ url })
    }
  }
}
