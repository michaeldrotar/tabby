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
  console.log('command', command)
  if (command === 'open-search') {
    const activeTab = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    })
    console.log('activeTab', activeTab)
    if (activeTab.length > 0 && activeTab[0].id) {
      try {
        const tabs = await chrome.tabs.query({})
        await chrome.tabs.sendMessage(activeTab[0].id, {
          type: 'TOGGLE_SEARCH',
          tabs,
        })
      } catch (e) {
        console.warn('Could not send message to content script', e)
      }
    }
  } else if (command === 'open-search-popup' && focusedWindowId) {
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('message', message, sender)
  if (message.type === 'GET_TABS') {
    chrome.tabs.query({}).then((tabs) => {
      sendResponse(tabs)
    })
  } else if (message.type === 'SWITCH_TAB') {
    const performSwitch = async () => {
      if (message.windowId) {
        await chrome.windows.update(message.windowId, { focused: true })
      }
      if (message.tabId) {
        await chrome.tabs.update(message.tabId, { active: true })
      }
      sendResponse(undefined)
    }
    performSwitch()
  }
  return undefined
})
