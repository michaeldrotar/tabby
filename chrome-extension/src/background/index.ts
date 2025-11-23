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
  const searchUrl = chrome.runtime.getURL(
    `search/index.html${windowId ? `?originalWindowId=${windowId}` : ''}`,
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
  if (command === 'open-search') {
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
          type: 'TOGGLE_SEARCH',
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
            type: 'TOGGLE_SEARCH',
          })
        } catch (retryError) {
          console.warn(
            'Failed to inject or send message after retry, opening search popup window...',
            { error: retryError },
          )
          // Fallback to popup if we can't inject (e.g. chrome:// pages)
          await openSearchPopup(activeTab.windowId)
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
  if (message.type === 'GET_TABS') {
    chrome.tabs.query({}).then((tabs) => {
      sendResponse(tabs)
    })
    return true
  } else if (message.type === 'SEARCH') {
    const { query } = message
    Promise.all([
      chrome.history.search({ text: query, maxResults: 20, startTime: 0 }),
      chrome.bookmarks.search(query),
    ]).then(([historyResults, bookmarkResults]) => {
      const results = [
        ...bookmarkResults.map((b) => ({
          id: b.id,
          type: 'bookmark',
          title: b.title,
          url: b.url,
          description: 'Bookmark',
        })),
        ...historyResults.map((h) => ({
          id: h.id,
          type: 'history',
          title: h.title || h.url || 'Untitled',
          url: h.url,
          description: 'History',
        })),
      ]
      sendResponse(results)
    })
    return true
  } else if (message.type === 'EXECUTE') {
    const { item, modifier, originalWindowId } = message
    const performAction = async () => {
      if (item.type === 'tab') {
        if (item.windowId) {
          await chrome.windows.update(item.windowId, { focused: true })
        }
        if (item.tabId) {
          await chrome.tabs.update(item.tabId, { active: true })
        }
      } else if (item.type === 'command') {
        if (item.id === 'cmd-side-panel') {
          // Toggle side panel
          const targetWindowId = originalWindowId || focusedWindowId
          if (targetWindowId) {
            try {
              // Must be called synchronously to preserve user gesture
              chrome.sidePanel.open({ windowId: targetWindowId })
            } catch (e) {
              console.warn('Failed to open side panel from background', e)
            }
          }
        } else if (item.url) {
          if (modifier === 'new-window') {
            await chrome.windows.create({ url: item.url, focused: true })
          } else if (modifier === 'new-tab') {
            if (originalWindowId) {
              await chrome.tabs.create({
                windowId: originalWindowId,
                url: item.url,
                active: true,
              })
              await chrome.windows.update(originalWindowId, { focused: true })
            } else {
              await chrome.tabs.create({ url: item.url, active: true })
            }
          } else {
            if (originalWindowId) {
              const [tab] = await chrome.tabs.query({
                windowId: originalWindowId,
                active: true,
              })
              if (tab && tab.id) {
                await chrome.tabs.update(tab.id, {
                  url: item.url,
                  active: true,
                })
                await chrome.windows.update(originalWindowId, { focused: true })
              } else {
                await chrome.tabs.create({
                  windowId: originalWindowId,
                  url: item.url,
                })
              }
            } else {
              await chrome.tabs.update({ url: item.url })
            }
          }
        }
      } else if (['bookmark', 'history', 'url', 'search'].includes(item.type)) {
        if (modifier === 'new-window') {
          await chrome.windows.create({ url: item.url, focused: true })
        } else if (modifier === 'new-tab') {
          if (originalWindowId) {
            await chrome.tabs.create({
              windowId: originalWindowId,
              url: item.url,
              active: true,
            })
            await chrome.windows.update(originalWindowId, { focused: true })
          } else {
            await chrome.tabs.create({ url: item.url, active: true })
          }
        } else {
          if (originalWindowId) {
            const [tab] = await chrome.tabs.query({
              windowId: originalWindowId,
              active: true,
            })
            if (tab && tab.id) {
              await chrome.tabs.update(tab.id, { url: item.url, active: true })
              await chrome.windows.update(originalWindowId, { focused: true })
            } else {
              await chrome.tabs.create({
                windowId: originalWindowId,
                url: item.url,
              })
            }
          } else {
            await chrome.tabs.update({ url: item.url })
          }
        }
      }
      sendResponse(undefined)
    }
    performAction()
    return true
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
    return true
  } else if (message.type === 'SEARCH_HISTORY') {
    chrome.history
      .search({
        text: message.query,
        maxResults: 20,
        startTime: 0,
      })
      .then((results) => {
        sendResponse(results)
      })
    return true
  } else if (message.type === 'SEARCH_BOOKMARKS') {
    chrome.bookmarks.search(message.query).then((results) => {
      sendResponse(results)
    })
    return true
  } else if (message.type === 'OPEN_URL') {
    const { url, newTab, newWindow } = message
    if (newWindow) {
      chrome.windows.create({ url, focused: true })
    } else if (newTab) {
      chrome.tabs.create({ url, active: true })
    } else {
      chrome.tabs.update({ url })
    }
  }
  return undefined
})
