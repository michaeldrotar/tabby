import '@src/index.css'
import { OmnibarPage } from './OmnibarPage'
import { BrowserStoreProvider } from '@extension/chrome'
import { createRoot } from 'react-dom/client'

const init = () => {
  const appContainer = document.querySelector('#app-container')
  if (!appContainer) {
    throw new Error('Can not find #app-container')
  }
  const root = createRoot(appContainer)
  root.render(
    <BrowserStoreProvider>
      <OmnibarPage />
    </BrowserStoreProvider>,
  )
}

init()
