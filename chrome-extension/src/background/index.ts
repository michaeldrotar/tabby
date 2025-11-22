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

const openSearchPopup = async (windowId?: number) => {
  const searchUrl = chrome.runtime.getURL('search/index.html')
  const existingTabs = await chrome.tabs.query({ url: searchUrl })

  if (existingTabs.length > 0 && existingTabs[0].windowId) {
    await chrome.windows.update(existingTabs[0].windowId, { focused: true })
    return
  }

  const width = 600
  const height = 400
  let left = 0
  let top = 0

  if (windowId) {
    try {
      const currentWindow = await chrome.windows.get(windowId)
      left = Math.round(
        (currentWindow.left ?? 0) + ((currentWindow.width ?? 0) - width) / 2,
      )
      top = Math.round(
        (currentWindow.top ?? 0) + ((currentWindow.height ?? 0) - height) / 2,
      )
    } catch (e) {
      console.warn('Could not get window info', e)
    }
  }

  await chrome.windows.create({
    url: 'search/index.html',
    type: 'popup',
    width,
    height,
    left,
    top,
    focused: true,
  })
}

chrome.commands.onCommand.addListener(async (command) => {
  console.log('command', command)
  if (command === 'open-search') {
    const activeTab = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    })
    console.log('activeTab', activeTab)
    if (activeTab.length > 0 && activeTab[0].id) {
      const tabId = activeTab[0].id
      const tabs = await chrome.tabs.query({})
      try {
        await chrome.tabs.sendMessage(tabId, {
          type: 'TOGGLE_SEARCH',
          tabs,
        })
      } catch (e) {
        console.warn('Could not send message to content script', e)
        // Try to inject the content script if it's missing
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js'],
          })
          // Retry sending the message
          await chrome.tabs.sendMessage(tabId, {
            type: 'TOGGLE_SEARCH',
            tabs,
          })
        } catch (retryError) {
          console.error(
            'Failed to inject or send message after retry',
            retryError,
          )
          // Fallback to popup if we can't inject (e.g. chrome:// pages)
          await openSearchPopup(activeTab[0].windowId)
        }
      }
    }
  } else if (command === 'open-search-popup' && focusedWindowId) {
    await openSearchPopup(focusedWindowId)
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
