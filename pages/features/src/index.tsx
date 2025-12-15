import '@src/index.css'
import '@src/Features.css'
import Features from '@src/Features'
import { createRoot } from 'react-dom/client'

const init = () => {
  const appContainer = document.querySelector('#app-container')
  if (!appContainer) {
    throw new Error('Can not find #app-container')
  }
  const root = createRoot(appContainer)
  root.render(<Features />)
}

init()
