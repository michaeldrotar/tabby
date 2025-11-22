// @ts-expect-error - inline import
import css from './index.css?inline'
import { SearchOverlay } from './SearchOverlay'
import { createRoot } from 'react-dom/client'
import type { BrowserTab } from '@extension/chrome'

const CONTAINER_ID = 'tabby-search-overlay-container'

let root: ReturnType<typeof createRoot> | null = null
let container: HTMLElement | null = null

const mount = (initialTabs: BrowserTab[]) => {
  if (container) return

  // Cleanup any existing container from previous injections/orphaned scripts
  const existingContainer = document.getElementById(CONTAINER_ID)
  if (existingContainer) {
    existingContainer.remove()
  }

  container = document.createElement('div')
  container.id = CONTAINER_ID
  document.body.appendChild(container)

  const shadow = container.attachShadow({ mode: 'open' })

  // Inject styles
  const style = document.createElement('style')
  style.textContent = css
  shadow.appendChild(style)

  const appRoot = document.createElement('div')
  shadow.appendChild(appRoot)

  root = createRoot(appRoot)
  root.render(<SearchOverlay onClose={unmount} initialTabs={initialTabs} />)
}

const unmount = () => {
  if (root) {
    root.unmount()
    root = null
  }
  if (container) {
    container.remove()
    container = null
  }
}

const toggle = (tabs?: BrowserTab[]) => {
  if (container) {
    unmount()
  } else {
    mount(tabs || [])
  }
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TOGGLE_SEARCH') {
    toggle(message.tabs)
  }
})
