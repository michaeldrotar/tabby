import 'webextension-polyfill'
import { exampleThemeStorage } from '@extension/storage'

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme)
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
})
