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
    await chrome.sidePanel.open({ windowId: focusedWindowId })
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'OPEN_SEARCH',
        windowId: focusedWindowId,
      })
    }, 100)
  } else if (command === 'toggle-side-panel' && focusedWindowId) {
    // We can't easily check if it's open, but calling open will open it.
    // To toggle, we might need to rely on the user closing it manually or use a hack.
    // Chrome API doesn't have a simple 'toggle' or 'isOpen' check for sidePanel yet.
    // For now, let's just ensure it opens.
    await chrome.sidePanel.open({ windowId: focusedWindowId })
  }
})
