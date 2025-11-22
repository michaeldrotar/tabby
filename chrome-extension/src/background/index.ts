import 'webextension-polyfill'

let focusedWindowId: number | undefined = undefined
const loadFocusedWindowId = async () => {
  const focusedWindow = await chrome.windows.getLastFocused()
  focusedWindowId = focusedWindow.id
}
loadFocusedWindowId()

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
})

chrome.windows.onFocusChanged.addListener((id) => {
  focusedWindowId = id
})

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open-search' && focusedWindowId) {
    const searchUrl = chrome.runtime.getURL('search/index.html')
    const existingTabs = await chrome.tabs.query({ url: searchUrl })

    if (existingTabs.length > 0 && existingTabs[0].windowId) {
      await chrome.windows.update(existingTabs[0].windowId, { focused: true })
      return
    }

    const currentWindow = await chrome.windows.get(focusedWindowId)
    const width = 600
    const height = 400
    const left = Math.round(
      (currentWindow.left ?? 0) + ((currentWindow.width ?? 0) - width) / 2,
    )
    const top = Math.round(
      (currentWindow.top ?? 0) + ((currentWindow.height ?? 0) - height) / 2,
    )

    await chrome.windows.create({
      url: 'search/index.html',
      type: 'popup',
      width,
      height,
      left,
      top,
      focused: true,
    })
  } else if (command === 'toggle-side-panel' && focusedWindowId) {
    // We can't easily check if it's open, but calling open will open it.
    // To toggle, we might need to rely on the user closing it manually or use a hack.
    // Chrome API doesn't have a simple 'toggle' or 'isOpen' check for sidePanel yet.
    // For now, let's just ensure it opens.
    await chrome.sidePanel.open({ windowId: focusedWindowId })
  }
})
