// @ts-expect-error - inline import
import css from './index.css?inline'

const CONTAINER_ID = 'tabby-omnibar-overlay-container'

let container: HTMLElement | null = null

const mount = () => {
  if (container) return

  // Cleanup any existing container
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

  // Layer 1: Backdrop (Blur & Dim)
  const backdrop = document.createElement('div')
  backdrop.style.position = 'fixed'
  backdrop.style.inset = '0'
  backdrop.style.zIndex = '99998'
  backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.2)'
  backdrop.style.backdropFilter = 'blur(4px)'
  backdrop.onclick = unmount
  shadow.appendChild(backdrop)

  // Layer 2: Iframe (Content)
  const iframe = document.createElement('iframe')
  iframe.src = chrome.runtime.getURL('content-search/index.html')
  iframe.style.position = 'fixed'
  iframe.style.inset = '0'
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.border = 'none'
  iframe.style.zIndex = '99999'
  iframe.style.setProperty('background-color', 'transparent', 'important')
  iframe.setAttribute('allowtransparency', 'true')
  shadow.appendChild(iframe)

  // Focus the iframe
  iframe.onload = () => {
    iframe.contentWindow?.focus()
  }
}

const unmount = () => {
  if (container) {
    container.remove()
    container = null
  }
}

const toggle = () => {
  if (container) {
    unmount()
  } else {
    mount()
  }
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TOGGLE_OMNIBAR') {
    toggle()
  }
})

// Listen for messages from the iframe
window.addEventListener('message', (event) => {
  if (event.data.type === 'CLOSE_OMNIBAR') {
    unmount()
  }
})
