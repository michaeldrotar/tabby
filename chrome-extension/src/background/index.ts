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

const openOmnibarPopup = async (windowId?: number) => {
  const searchUrl = chrome.runtime.getURL(
    `omnibar-popup/index.html${windowId ? `?originalWindowId=${windowId}` : ''}`,
  )
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
    url: searchUrl,
    type: 'popup',
    width,
    height,
    left,
    top,
    focused: true,
  })
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open-omnibar-overlay') {
    const activeTab = (
      await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
    )[0]
    if (activeTab && activeTab.id) {
      const tabId = activeTab.id

      // Ensure window is focused (fixes issue where focus is lost after closing side panel)
      if (activeTab.windowId) {
        try {
          await chrome.windows.update(activeTab.windowId, { focused: true })
          const otherTab = await chrome.tabs.create({
            windowId: activeTab.windowId,
            active: true,
          })
          await chrome.tabs.update(activeTab.id, { active: true })
          if (otherTab && otherTab.id) {
            await chrome.tabs.remove(otherTab.id)
          }
        } catch (e) {
          console.warn('Failed to focus window', e)
        }
      }

      try {
        await chrome.tabs.sendMessage(tabId, {
          type: 'TOGGLE_OMNIBAR',
        })
      } catch (e) {
        console.warn(
          'Could not send message to content script, attempting to re-inject script...',
          { error: e },
        )
        // Try to inject the content script if it's missing
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js'],
          })
          // Retry sending the message
          await chrome.tabs.sendMessage(tabId, {
            type: 'TOGGLE_OMNIBAR',
          })
        } catch (retryError) {
          console.warn(
            'Failed to inject or send message after retry, opening search popup window...',
            { error: retryError },
          )
          // Fallback to popup if we can't inject (e.g. chrome:// pages)
          await openOmnibarPopup(activeTab.windowId)
        }
      }
    }
  } else if (command === 'open-omnibar-popup' && focusedWindowId) {
    await openOmnibarPopup(focusedWindowId)
  } else if (command === 'open-tab-manager' && focusedWindowId) {
    // We can't easily check if it's open, but calling open will open it.
    // To toggle, we might need to rely on the user closing it manually or use a hack.
    // Chrome API doesn't have a simple 'toggle' or 'isOpen' check for sidePanel yet.
    // For now, let's just ensure it opens.
    await chrome.sidePanel.open({ windowId: focusedWindowId })
  }
})
