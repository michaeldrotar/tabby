import './index.css'
import { OmnibarOverlay } from './OmnibarOverlay'
import { OmnibarPopup } from './OmnibarPopup'
import { useThemeApplicator } from '@extension/shared'
import { loadThemeStorage } from '@extension/storage'
import { createRoot } from 'react-dom/client'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element not found')
}

loadThemeStorage()

const searchParams = new URLSearchParams(window.location.search)
const isPopup = searchParams.get('mode') === 'popup'

const Root = () => {
  useThemeApplicator()

  return <>{isPopup ? <OmnibarPopup /> : <OmnibarOverlay />}</>
}

const root = createRoot(container)
root.render(<Root />)
