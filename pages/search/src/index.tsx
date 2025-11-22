import '@src/index.css'
import { SearchPage } from './SearchPage'
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
      <SearchPage />
    </BrowserStoreProvider>,
  )
}

init()
