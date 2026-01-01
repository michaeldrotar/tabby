import './index.css'
import { createRoot } from 'react-dom/client'
import { OmnibarOverlay } from './OmnibarOverlay'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element not found')
}

const root = createRoot(container)
root.render(<OmnibarOverlay />)
