import './index.css'
import { Root } from './Root'
import { createRoot } from 'react-dom/client'

const init = () => {
  const appContainer = document.querySelector('#app-container')
  if (!appContainer) {
    throw new Error('Can not find #app-container')
  }
  const root = createRoot(appContainer)
  root.render(<Root />)
}

init()
