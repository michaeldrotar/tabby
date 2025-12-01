import './index.css'
import { OmnibarPopup } from './OmnibarPopup'
import { createRoot } from 'react-dom/client'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element not found')
}

const root = createRoot(container)
root.render(<OmnibarPopup />)
